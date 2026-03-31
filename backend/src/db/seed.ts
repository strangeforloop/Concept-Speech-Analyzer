import 'dotenv/config';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { queryOne, run, transaction } from './database.js';
import type { Difficulty } from '../types/index.js';

interface SeedConcept {
  topic: string;
  category: string;
  difficulty: Difficulty;
  generatedPrompt: string;
}

interface CountRow {
  count: number;
}

const EXPECTED_CONCEPT_COUNT = 75;
const ALLOWED_DIFFICULTIES: Difficulty[] = ['mid', 'senior', 'staff'];
const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const SEED_DATA_PATH = path.resolve(
  path.dirname(CURRENT_FILE_PATH),
  'concepts-seed-data.json'
);

function validateConcept(value: unknown, index: number): SeedConcept {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`Concept at index ${index} is not an object.`);
  }

  const candidate = value as Partial<SeedConcept>;
  if (typeof candidate.topic !== 'string' || candidate.topic.trim() === '') {
    throw new Error(`Concept at index ${index} is missing a valid topic.`);
  }
  if (typeof candidate.category !== 'string' || candidate.category.trim() === '') {
    throw new Error(`Concept at index ${index} is missing a valid category.`);
  }
  if (
    typeof candidate.generatedPrompt !== 'string' ||
    candidate.generatedPrompt.trim() === ''
  ) {
    throw new Error(`Concept at index ${index} is missing a valid generatedPrompt.`);
  }
  if (
    typeof candidate.difficulty !== 'string' ||
    !ALLOWED_DIFFICULTIES.includes(candidate.difficulty as Difficulty)
  ) {
    throw new Error(
      `Concept at index ${index} has invalid difficulty. Expected one of: ${ALLOWED_DIFFICULTIES.join(', ')}.`
    );
  }

  return {
    topic: candidate.topic.trim(),
    category: candidate.category.trim(),
    difficulty: candidate.difficulty as Difficulty,
    generatedPrompt: candidate.generatedPrompt.trim()
  };
}

function loadConceptsFromJsonFile(): SeedConcept[] {
  const raw = readFileSync(SEED_DATA_PATH, 'utf8');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${SEED_DATA_PATH}: ${message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Seed file must contain a JSON array.`);
  }

  const concepts = parsed.map((item, index) => validateConcept(item, index));
  if (concepts.length !== EXPECTED_CONCEPT_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_CONCEPT_COUNT} concepts, but found ${concepts.length}.`
    );
  }

  return concepts;
}

function extractResponseText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function unwrapJsonEnvelope(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fenced?.[1] ?? raw).trim();
}

/**
 * Future path: generate concepts directly via Anthropic and return validated concepts.
 * This is intentionally preserved for when you switch from static JSON seeding.
 */
export async function generateConceptsFromAnthropic(apiKey: string): Promise<SeedConcept[]> {
  const client = new Anthropic({ apiKey });

  const prompt = `Generate exactly ${EXPECTED_CONCEPT_COUNT} technical interview practice concepts for a senior full-stack engineer.

Return ONLY a valid JSON array and nothing else.
Each item must be an object with these fields:
- topic: string
- category: string (Frontend Architecture, System Design, Infrastructure, Fundamentals, Backend/Database)
- difficulty: one of "mid", "senior", "staff"
- generatedPrompt: string (specific interview-style prompt to answer out loud)

Balance coverage approximately as:
- Frontend Architecture: 30%
- System Design: 25%
- Infrastructure: 20%
- Fundamentals: 15%
- Backend/Database: 10%

Do not include markdown code fences.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    temperature: 0.4,
    messages: [{ role: 'user', content: prompt }]
  });

  const rawText = extractResponseText(response);
  if (rawText.length === 0) {
    throw new Error('Anthropic returned an empty response.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(unwrapJsonEnvelope(rawText));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse Anthropic response as JSON: ${message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Anthropic response JSON is not an array.');
  }

  const concepts = parsed.map((item, index) => validateConcept(item, index));
  if (concepts.length !== EXPECTED_CONCEPT_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_CONCEPT_COUNT} concepts from Anthropic, but received ${concepts.length}.`
    );
  }

  return concepts;
}

/**
 * Seeds canonical concepts from local JSON file if concepts table is empty.
 */
export async function runSeed(): Promise<void> {
  try {
    console.log('Checking existing concepts...');
    const existing = queryOne<CountRow>('SELECT COUNT(*) AS count FROM concepts');
    const existingCount = existing?.count ?? 0;

    if (existingCount > 0) {
      console.log(`Seed skipped: ${existingCount} concepts already exist.`);
      return;
    }

    console.log(`Loading ${EXPECTED_CONCEPT_COUNT} concepts from ${SEED_DATA_PATH}...`);
    const concepts = loadConceptsFromJsonFile();

    console.log('Inserting concepts into database...');
    transaction(() => {
      for (const concept of concepts) {
        run(
          `INSERT INTO concepts (id, topic, category, difficulty, generated_prompt)
           VALUES (?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            concept.topic,
            concept.category,
            concept.difficulty,
            concept.generatedPrompt
          ]
        );
      }
    });

    console.log(`Seeded ${concepts.length} concepts successfully.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Seed failed: ${message}`);
    throw error;
  }
}

const thisFile = fileURLToPath(import.meta.url);
const entry = process.argv[1];
const isDirectRun =
  entry !== undefined && path.resolve(entry) === path.resolve(thisFile);

if (isDirectRun) {
  runSeed().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
}
