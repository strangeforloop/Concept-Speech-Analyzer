import 'dotenv/config';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
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

function normalizeConceptCount(concepts: SeedConcept[]): SeedConcept[] {
  if (concepts.length < EXPECTED_CONCEPT_COUNT) {
    throw new Error(
      `Expected at least ${EXPECTED_CONCEPT_COUNT} concepts from Anthropic, but received ${concepts.length}.`
    );
  }

  if (concepts.length > EXPECTED_CONCEPT_COUNT) {
    console.warn(
      `Anthropic returned ${concepts.length} concepts. Trimming to ${EXPECTED_CONCEPT_COUNT}.`
    );
  }

  return concepts.slice(0, EXPECTED_CONCEPT_COUNT);
}

/**
 * Future path: generate concepts directly via Anthropic and return validated concepts.
 * This is intentionally preserved for when you switch from static JSON seeding.
 */
export async function generateConceptsFromAnthropic(apiKey: string): Promise<SeedConcept[]> {
  const client = new Anthropic({ apiKey });

  const prompt = `Generate exactly ${EXPECTED_CONCEPT_COUNT} technical interview practice concepts for a senior full-stack engineer preparing for interviews.

IMPORTANT: Include a mix of fundamental explanations and advanced concepts. I need to practice explaining basic tools and technologies, not just system design patterns.

Return ONLY a valid JSON array and nothing else.
Each item must be an object with these fields:
- topic: string
- category: string (see categories below)
- difficulty: one of "mid", "senior", "staff"
- generatedPrompt: string (specific interview-style prompt to answer out loud)

CATEGORIES AND EXAMPLES:

Frontend Fundamentals (20%):
- Basic concepts: "Explain what the Virtual DOM is and why React uses it"
- Core APIs: "Walk me through how useEffect works and common pitfalls"
- Browser features: "Explain how localStorage differs from sessionStorage"
- Performance: "What is React memoization and when should you use it?"

Infrastructure & Tools (20%):
- Docker: "Explain what Docker containers are and how they differ from VMs"
- CI/CD: "Walk me through what happens in a typical CI/CD pipeline"
- Networking: "Explain the DNS resolution process step by step"
- Deployment: "What is blue-green deployment and when would you use it?"

Web Fundamentals (15%):
- HTTP: "Explain the difference between GET, POST, PUT, and PATCH"
- Authentication: "How does JWT authentication work?"
- CORS: "What is CORS and why do browsers enforce it?"
- WebSockets: "Explain how WebSockets differ from HTTP requests"

System Design (15%):
- Scalability patterns
- Distributed systems
- API architecture
- Caching strategies

Backend & Database (15%):
- SQL concepts: "Explain database indexing and when to create an index"
- Transactions: "What does ACID mean in databases?"
- APIs: "Explain RESTful API design principles"
- Message queues: "What problems do message queues solve?"

Modern Development (10%):
- AI/ML tools: "Explain what AI agents are and how they work"
- Developer tools: "What is an MCP server and what problem does it solve?"
- State management: "Compare different React state management approaches"
- Build tools: "Explain how Webpack bundling works"

Algorithms & Data Structures (5%):
- Focus on practical application, not leetcode-style problems

DIFFICULTY DISTRIBUTION:
- 40% mid: "Explain what X is and how it works"
- 40% senior: "When would you use X and what are the tradeoffs?"
- 20% staff: "Design a system using X or explain advanced internals"

TONE: Questions should sound like a friendly senior engineer asking "hey, can you explain how X works?" - not overly formal interview questions.

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
  return normalizeConceptCount(concepts);
}

/**
 * Seeds canonical concepts from Anthropic if concepts table is empty.
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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required to seed concepts from Anthropic.');
    }

    console.log(`Generating ${EXPECTED_CONCEPT_COUNT} concepts from Anthropic...`);
    const concepts = await generateConceptsFromAnthropic(apiKey);

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
