-- Concepts: seeded technical interview topics
CREATE TABLE IF NOT EXISTS concepts (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('mid', 'senior', 'staff')),
  generated_prompt TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Practice attempts: transcription + AI analysis (ai_analysis stored as JSON text)
CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  concept_id TEXT NOT NULL,
  transcription TEXT NOT NULL,
  ai_analysis TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attempts_concept_id ON attempts(concept_id);
