import { Router, type Request, type Response } from 'express';
import type { Concept, Attempt } from '../types/index.js';
import { query, queryOne } from '../db/database.js';

const router = Router();

interface ConceptRow {
  id: string;
  topic: string;
  category: string;
  difficulty: Concept['difficulty'];
  generated_prompt: string;
  created_at: string;
}

interface ConceptWithCountRow extends ConceptRow {
  attempt_count: number;
}

interface AttemptRow {
  id: string;
  concept_id: string;
  transcription: string;
  ai_analysis?: string;
  analysis_json?: string;
  duration_seconds: number;
  attempted_at: string;
}

type ConceptWithCount = Concept & { attempt_count: number };

function toConcept(row: ConceptRow): Concept {
  const createdAtUnix = Math.floor(new Date(row.created_at).getTime() / 1000);
  return {
    id: row.id,
    topic: row.topic,
    category: row.category,
    difficulty: row.difficulty,
    generated_prompt: row.generated_prompt,
    created_at: Number.isFinite(createdAtUnix) ? createdAtUnix : 0
  };
}

function toConceptWithCount(row: ConceptWithCountRow): ConceptWithCount {
  return {
    ...toConcept(row),
    attempt_count: Number(row.attempt_count)
  };
}

function toAttempt(row: AttemptRow): Attempt {
  const analysisRaw = row.ai_analysis ?? row.analysis_json;
  if (analysisRaw === undefined) {
    throw new Error(`Missing analysis JSON for attempt ${row.id}`);
  }

  return {
    id: row.id,
    conceptId: row.concept_id,
    transcription: row.transcription,
    aiAnalysis: JSON.parse(analysisRaw) as Attempt['aiAnalysis'],
    durationSeconds: row.duration_seconds,
    attemptedAt: Number(row.attempted_at)
  };
}

/**
 * GET /api/concepts — list all concepts with attempt counts
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const rows = query<ConceptWithCountRow>(
      `SELECT
         c.id, c.topic, c.category, c.difficulty,
         c.generated_prompt, c.created_at,
         COUNT(a.id) as attempt_count
       FROM concepts c
       LEFT JOIN attempts a ON c.id = a.concept_id
       GROUP BY c.id
       ORDER BY c.category, c.topic`
    );

    const concepts = rows.map(toConceptWithCount);
    res.json(concepts);
  } catch (error) {
    console.error('Failed to list concepts:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/concepts/:id/attempts — attempts for a concept (before /:id)
 */
router.get('/:id/attempts', (req: Request<{ id: string }>, res: Response) => {
  try {
    const concept = queryOne<ConceptRow>('SELECT * FROM concepts WHERE id = ?', [req.params.id]);
    if (!concept) {
      res.status(404).json({ error: 'Concept not found' });
      return;
    }

    const rows = query<AttemptRow>(
      'SELECT * FROM attempts WHERE concept_id = ? ORDER BY attempted_at DESC',
      [req.params.id]
    );

    const attempts = rows.map(toAttempt);
    res.json(attempts);
  } catch (error) {
    console.error(`Failed to fetch attempts for concept ${req.params.id}:`, error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/concepts/:id — single concept
 */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  try {
    const row = queryOne<ConceptRow>('SELECT * FROM concepts WHERE id = ?', [req.params.id]);
    if (!row) {
      res.status(404).json({ error: 'Concept not found' });
      return;
    }

    res.json(toConcept(row));
  } catch (error) {
    console.error(`Failed to fetch concept ${req.params.id}:`, error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

export default router;
