# Future Self — Protocol v2.1

A cinematic Socratic AI experience that reveals your core desire through psychological interrogation, then shows you two diverging futures.

## Architecture

```
future-self/
├── backend/        Node.js + Express + Google Gemini API
│   └── server.js   All API routes, AI prompts, JSONBin persistence
├── frontend/       Vite + React + Tailwind CSS + Framer Motion
│   └── src/
│       ├── App.jsx              Orchestrator (state, routing, global controls)
│       ├── components/          10 screen components + utilities
│       ├── hooks/               useVoice, useAmbientMusic
│       └── utils/               sessionMemory
└── README.md
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env        # fill in JSONBIN values
npm install
node server.js              # → http://localhost:3001
```

### Frontend
```bash
cd frontend
cp .env.example .env        # set VITE_API_URL
npm install
npm run dev                 # → http://localhost:5173
```

## Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `VITE_API_URL` | frontend `.env` | Backend URL (e.g., `http://localhost:3001`) |
| `JSONBIN_BIN_ID` | backend `.env` | JSONBin bin ID for review/stats persistence |
| `JSONBIN_API_KEY` | backend `.env` | JSONBin API key |
| `NODE_ENV` | backend `.env` | `production` enables keep-alive ping |

## Deployment

### Backend → Railway / Render
- Root Directory: `backend`
- Build: `npm install`
- Start: `node server.js`
- Add env vars: `JSONBIN_BIN_ID`, `JSONBIN_API_KEY`, `NODE_ENV=production`

### Frontend → Vercel
- Root Directory: `frontend`
- Framework: Vite
- Add env var: `VITE_API_URL` → your deployed backend URL
- `vercel.json` handles SPA routing

## Features (Phase 2.3)
- **Wall of Human Truths**: A global anonymous ledger of users' core desires, calculating resonance across entries.
- **Cinematic Enhancements**: 7-second teaser trailer on load, dynamic visual Depth Pulse indicator, internal ambient background coloring, and rotating cinematic loaders.
- **Community Mechanics**: "This Hit" micro-reactions during excavation, "Write Back" replies to Future Selves, tappable chat suggestions, and monthly returning user check-ins.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check (returns `{ status: 'alive' }`) |
| POST | `/api/chat` | Socratic dialogue (supports SKIP/EXPLAIN) |
| POST | `/api/generate-profiles` | Generate passive/active future profiles |
| POST | `/api/persona-chat` | Chat with passive/active future selves |
| POST | `/api/generate-archetype` | Character archetype analysis |
| POST | `/api/generate-letter` | Generate final letters from future selves |
| POST | `/api/analyse-emotions` | Emotional arc analysis |
| POST | `/api/save-review` | Save user review to JSONBin |
| GET | `/api/get-reviews` | Fetch public reviews |
| POST | `/api/increment-stats` | Increment user counter |
| GET | `/api/get-stats` | Get total user count |
| POST | `/api/add-to-wall` | Add an anonymous truth to the global wall |
| GET | `/api/wall` | Fetch the public wall of truths |

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, html2canvas, lucide-react
- **Backend**: Express, @google/generative-ai, node-fetch
- **Persistence**: JSONBin.io (reviews + stats), sessionStorage + localStorage (client)
- **AI**: Google Gemini 2.0 Flash
