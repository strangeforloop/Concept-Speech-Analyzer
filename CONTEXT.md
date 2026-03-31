# Concept Practice App - Technical Interview Prep Tool

## Project Purpose
Personal interview prep tool that lets me practice explaining technical concepts out loud and get AI feedback on my explanations. Built to close my gap around externalizing technical thinking and articulating concepts clearly under pressure.

## MVP Scope
- **Single user** (no authentication needed)
- **Backend only initially** - Node/Express/TypeScript/SQLite
- **75 pre-generated concepts** covering senior full-stack topics
- **Record → Transcribe → Analyze → Store** flow
- **No audio storage** - transcribe immediately and discard
- **Simple REST API** for future frontend

## Core User Flow
1. Backend seeds database with 75 AI-generated technical concepts
2. User selects a concept to practice
3. User records audio explanation (2-5 min)
4. Backend transcribes audio via Anthropic API
5. Backend analyzes transcription quality via Anthropic API
6. Backend stores: transcription + analysis + score
7. User sees feedback: score, strengths, gaps, follow-up questions
8. User can retry same concept or pick new one

## Technical Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **AI**: Anthropic API (Claude Sonnet 4)
- **Audio**: Receive as blob, transcribe via Anthropic, discard immediately

## Data Model

### Concept
- `id`: string (UUID)
- `topic`: string (e.g., "Docker container isolation")
- `category`: string (e.g., "Infrastructure", "Frontend", "System Design")
- `difficulty`: string ("mid" | "senior" | "staff")
- `generatedPrompt`: string (specific question to answer)
- `createdAt`: timestamp

### Attempt
- `id`: string (UUID)
- `conceptId`: string (FK to Concept)
- `transcription`: string (what user actually said)
- `aiAnalysis`: JSON object
  - `score`: number (1-10)
  - `strengths`: string[]
  - `gaps`: string[]
  - `followUpQuestions`: string[]
- `durationSeconds`: number
- `attemptedAt`: timestamp

## API Endpoints

### Concepts
- `GET /api/concepts` - List all concepts (with attempt counts)
- `GET /api/concepts/:id` - Get single concept details
- `GET /api/concepts/:id/attempts` - Get all attempts for a concept

### Attempts
- `POST /api/attempts` - Submit new practice attempt
  - Body: `{ conceptId, audioBlob, durationSeconds }`
  - Returns: `{ id, transcription, aiAnalysis, ... }`

## File Organization Principles
- **`db/`** - Database schema, connection, seed logic
- **`routes/`** - Express route handlers (thin, delegate to services)
- **`services/`** - Business logic (Anthropic calls, audio processing)
- **`types/`** - Shared TypeScript interfaces
- Keep routes focused on HTTP concerns
- Keep services focused on domain logic

## Development Workflow
1. Set up project scaffolding (this step)
2. Implement database schema and connection
3. Build concept generation/seeding
4. Build attempt creation flow (transcribe + analyze)
5. Build history/retrieval endpoints
6. Test end-to-end with Postman/curl
7. Build frontend (separate phase)

## Environment Variables
```
ANTHROPIC_API_KEY=your_key_here
PORT=3000
DATABASE_PATH=./storage/database.db
```

## Technical Concept Coverage Areas
The 75 concepts should span:
- **Frontend Architecture** (30%): Component patterns, state management, performance, rendering, accessibility
- **System Design** (25%): Scalability, reliability, API design, caching, distributed systems
- **Infrastructure** (20%): Docker, CI/CD, deployment, monitoring, networking
- **Fundamentals** (15%): Algorithms, data structures, complexity, memory
- **Backend/Database** (10%): SQL, transactions, indexing, connection pooling

## Quality Bar
- Code should be production-quality (proper error handling, types, validation)
- AI prompts should be specific and structured
- Database queries should be efficient
- Audio handling should be memory-safe (no temp files)
```