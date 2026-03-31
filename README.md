# Technical Concept Practice App
 
A full-stack application for practicing technical interview explanations out loud with AI-powered feedback. Record yourself explaining engineering concepts, get instant transcription and detailed analysis from Claude, and track your progress over time.
 
## Purpose
 
Built to address a specific interview prep gap: being able to externalize technical thinking and articulate concepts clearly under pressure. Instead of just reading about React hooks or Docker containers, you practice explaining them as if you're in a real interview, then receive structured feedback on your explanation quality.
 
## Technologies Used
 
### Backend
- **Node.js + Express** - REST API server
- **TypeScript** - Type-safe development
- **SQLite** (better-sqlite3) - Lightweight database for concepts and attempts
- **OpenAI Whisper API** - Audio transcription
- **Anthropic Claude API** - Technical explanation analysis and feedback generation
 
### Frontend
- **React + TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **MediaRecorder API** - Browser audio recording
 
## Prerequisites
 
- Node.js 18+ installed
- npm or yarn
- API keys:
  - [Anthropic API key](https://console.anthropic.com/settings/keys) 
  - [OpenAI API key](https://platform.openai.com/api-keys)

 ## Database Setup
 
### Initial Seed (First Time Only)
 
The database needs to be seeded with 75 technical concepts before you can use the app:
 
```bash
cd backend
npm run seed
```

 ## API Endpoints
 
### Concepts
 
**GET /api/concepts**
- Returns all 75 concepts with attempt counts
- Response: `Array<Concept & { attempt_count: number }>`
 
**GET /api/concepts/:id**
- Returns a single concept by ID
- Response: `Concept`
 
**GET /api/concepts/:id/attempts**
- Returns all practice attempts for a specific concept
- Ordered by most recent first
- Response: `Attempt[]`
 
