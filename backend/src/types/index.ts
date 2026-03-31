/** Matches DB CHECK and API difficulty values */
export type Difficulty = 'mid' | 'senior' | 'staff';

export interface Concept {
  id: string;
  topic: string;
  category: string;
  difficulty: Difficulty;
  generated_prompt: string;
  created_at: number;
  attempt_count?: number;
}

export interface AIAnalysis {
  score: number;
  strengths: string[];
  gaps: string[];
  followUpQuestions: string[];
}

export interface Attempt {
  id: string;
  conceptId: string;
  transcription: string;
  aiAnalysis: AIAnalysis;
  durationSeconds: number;
  attemptedAt: number;
}

/** Request body for POST /api/attempts (audio as raw bytes or base64 string TBD) */
export interface CreateAttemptBody {
  conceptId: string;
  audioBlob: string;
  durationSeconds: number;
}

/** Response shape for a new attempt after transcribe + analyze */
export type CreateAttemptResponse = Attempt;
