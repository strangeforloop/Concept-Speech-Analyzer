import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import { queryOne, run } from '../db/database.js';
import type { AiAnalysis, CreateAttemptBody, CreateAttemptResponse } from '../types/index.js';

const router = Router();

interface ConceptRow {
  id: string;
  topic: string;
  generated_prompt: string;
}

function extractAnthropicText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function parseAnalysis(text: string): AiAnalysis {
  const jsonText = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '$1').trim();
  const parsed = JSON.parse(jsonText) as Partial<AiAnalysis>;

  if (
    typeof parsed.score !== 'number' ||
    !Array.isArray(parsed.strengths) ||
    !Array.isArray(parsed.gaps) ||
    !Array.isArray(parsed.followUpQuestions)
  ) {
    throw new Error('Invalid analysis format from Anthropic');
  }

  return {
    score: parsed.score,
    strengths: parsed.strengths.map(String),
    gaps: parsed.gaps.map(String),
    followUpQuestions: parsed.followUpQuestions.map(String)
  };
}

/**
 * POST /api/attempts — submit audio; transcribe with Whisper, analyze with Anthropic, persist
 */
router.post(
  '/',
  async (
    req: Request<object, CreateAttemptResponse | { error: string }, CreateAttemptBody>,
    res: Response
  ) => {
    try {
      console.log('Request body keys:', Object.keys(req.body));
      console.log('conceptId:', req.body.conceptId);
      console.log('audioBlob length:', req.body.audioBlob?.length);
      console.log('durationSeconds:', req.body.durationSeconds);
    
    const { conceptId, audioBlob, durationSeconds } = req.body;

      if (!conceptId || !audioBlob || typeof durationSeconds !== 'number') {
        res.status(400).json({ error: 'Missing required fields: conceptId, audioBlob, durationSeconds' });
        return;
      }

      const concept = queryOne<ConceptRow>('SELECT id, topic, generated_prompt FROM concepts WHERE id = ?', [conceptId]);
      if (!concept) {
        res.status(404).json({ error: 'Concept not found' });
        return;
      }

      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      const openAiApiKey = process.env.OPENAI_API_KEY;
      if (!anthropicApiKey) {
        res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
        return;
      }
      if (!openAiApiKey) {
        res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
        return;
      }

      const anthropicClient = new Anthropic({ apiKey: anthropicApiKey });
      const openAiClient = new OpenAI({ apiKey: openAiApiKey });

      const audioBuffer =
        typeof audioBlob === 'string'
          ? Buffer.from(audioBlob, 'base64')
          : Buffer.isBuffer(audioBlob)
            ? audioBlob
            : Buffer.from(audioBlob as unknown as Uint8Array);

      if (audioBuffer.length === 0) {
        res.status(400).json({ error: 'audioBlob is empty' });
        return;
      }

      console.log(`Transcribing audio for concept: ${concept.topic}`);

      const whisperFile = await toFile(audioBuffer, 'attempt-audio.webm', {
        type: 'audio/webm'
      });
      const transcriptionResponse = await openAiClient.audio.transcriptions.create({
        file: whisperFile,
        model: 'whisper-1'
      });

      const transcription = transcriptionResponse.text.trim();

      if (!transcription) {
        res.status(500).json({ error: 'Failed to transcribe audio' });
        return;
      }

      console.log(`Transcription complete. Length: ${transcription.length} characters`);

      console.log('Analyzing transcription quality...');

      const analysisPrompt = `You are evaluating a technical interview response. The candidate was asked:

"${concept.generated_prompt}"

Their spoken response (transcribed):
"""
${transcription}
"""

Evaluate this response and return ONLY valid JSON (no markdown, no preamble) with this structure:
{
  "score": <number 1-10>,
  "strengths": [<array of 2-4 specific strengths>],
  "gaps": [<array of 2-4 specific gaps or areas to improve>],
  "followUpQuestions": [<array of 2-3 follow-up questions to deepen understanding>]
}

Scoring guide:
1-3: Incorrect or very incomplete
4-6: Partial understanding, missing key concepts
7-8: Good grasp, minor gaps
9-10: Excellent, comprehensive explanation`;

      const analysisResponse = await anthropicClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{ role: 'user', content: analysisPrompt }]
      });

      const analysisText = extractAnthropicText(analysisResponse);
      let analysis: AiAnalysis;
      try {
        analysis = parseAnalysis(analysisText);
      } catch (error) {
        console.error('Failed to parse analysis JSON:', error);
        res.status(500).json({ error: 'Failed to parse AI analysis' });
        return;
      }

      console.log(`Analysis complete. Score: ${analysis.score}/10`);

      const attemptId = randomUUID();
      const attemptedAt = new Date().toISOString();

      run(
        `INSERT INTO attempts (id, concept_id, transcription, ai_analysis, duration_seconds, attempted_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          attemptId,
          conceptId,
          transcription,
          JSON.stringify(analysis),
          durationSeconds,
          attemptedAt
        ]
      );

      console.log(`Attempt saved: ${attemptId}`);

      const response: CreateAttemptResponse = {
        id: attemptId,
        conceptId,
        transcription,
        aiAnalysis: analysis,
        durationSeconds,
        attemptedAt
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error processing attempt:', error);
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: `Failed to process attempt: ${message}` });
    }
  }
);

export default router;