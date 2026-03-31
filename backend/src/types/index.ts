/** Matches DB CHECK and API difficulty values */
export type Difficulty = 'mid' | 'senior' | 'staff';

export interface Concept {
  id: string;
  topic: string;
  category: string;
  difficulty: Difficulty;
  generatedPrompt: string;
  createdAt: string;
}

export interface AiAnalysis {
  score: number;
  strengths: string[];
  gaps: string[];
  followUpQuestions: string[];
}

export interface Attempt {
  id: string;
  conceptId: string;
  transcription: string;
  aiAnalysis: AiAnalysis;
  durationSeconds: number;
  attemptedAt: string;
}

/** Concept row as returned from list endpoints */
export interface ConceptWithAttemptCount extends Concept {
  attemptCount: number;
}

/** Request body for POST /api/attempts (audio as raw bytes or base64 string TBD) */
export interface CreateAttemptBody {
  conceptId: string;
  audioBlob: Buffer;
  durationSeconds: number;
}

/** Response shape for a new attempt after transcribe + analyze */
export type CreateAttemptResponse = Attempt;
