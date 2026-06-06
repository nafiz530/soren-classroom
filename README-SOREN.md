# Soren Classroom — AI Teaching Engine v3.1

## Overview

Soren Classroom is a flow-based, adaptive, spatially intelligent AI teaching engine built for the Bangladesh National Curriculum (Class 6-10). It replaces rigid timeline-driven AI simulators with a human-like classroom simulation that feels like a real teacher.

## Architecture

### Core Engines

| Module | File | Description |
|--------|------|-------------|
| **FlowController** | `src/engine/FlowController.ts` | Runtime "brain" that orchestrates teaching flow, handles timing, speech-board synchronization, pacing, and conflict resolution |
| **SpeechStreamEngine** | `src/engine/SpeechStreamEngine.ts` | Continuous speech stream with Web Speech API, natural flow, progress tracking |
| **BoardManager** | `src/engine/BoardManager.ts` | Spatial Intelligence Board with semantic zones, board memory, importance/persistence/lifespan |
| **PacingEngine** | `src/engine/PacingEngine.ts` | Adaptive Teaching Pacing — no fixed timestamps, runtime-computed pacing per teaching phase |
| **EventBus** | `src/engine/EventBus.ts` | Internal event system for engine communication |

### Teaching Intent Graph (TIG)

AI outputs **intent-based blocks**, NOT timestamped events:

```json
{
  "intent": "explain_concept",
  "content": {
    "speech": "English text...",
    "speechBn": "Bengali text...",
    "board": { "type": "definition", "text": "..." }
  },
  "priority": "high",
  "actions": ["speak", "board_write"]
}
```

### Flow Model

```
INTRO → EXPLANATION → EXAMPLE → QUIZ → RECAP
```

Speech and board run in **parallel** during explanation phases.

### Spatial Board Zones

| Zone | Content Type | Position |
|------|-------------|----------|
| `top-left` | Definition | Top-left corner |
| `center-left` | Formula | Center-left area |
| `center` | Concept | Center of board |
| `right` | Example | Right side |
| `bottom` | Recap | Bottom strip |
| `center-large` | Diagram/Graph | Full center overlay |

### Board Memory System

Each board block has:
- **importance**: `critical` | `high` | `medium` | `low`
- **persist**: Whether block survives zone clearing
- **lifespan**: `lesson` | `section` | `temporary`
- **zone**: Semantic spatial position

## Data Persistence

All user data stored in **browser localStorage only** (Cloudflare Pages compatible):

| Key | Content |
|-----|---------|
| `soren:classrooms` | All classroom configurations |
| `soren:progress` | Student progress, quiz scores, weak areas |
| `soren:session` | Active session for resume capability |
| `soren:tokens` | Token usage history and cumulative totals |
| `soren:classroom-memory` | Per-classroom teaching history for AI context |

## Token Tracking

- Tracks input/output/total tokens per lesson and cumulative session
- Environment variable `NEXT_PUBLIC_TOKEN_SHOW=true/false` controls UI visibility
- Must re-read env on restart (not cached permanently)
- Token data stored in localStorage under `soren:tokens`

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State**: Zustand (client state)
- **Animation**: Framer Motion
- **AI**: z-ai-web-dev-sdk (Chat Completions API)
- **Speech**: Web Speech API (SpeechSynthesis + SpeechRecognition)
- **Database**: None — purely client-side localStorage
- **Deployment**: Cloudflare Pages compatible (stateless frontend)

## Setup

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_TOKEN_SHOW=true  (to show token usage UI)
#   MISTRAL_API_KEY=your-key     (optional, not used by z-ai-web-dev-sdk)
#   MODEL_NAME=your-model-name   (required — no hardcoded model in code)

# Run development server
bun run dev

# Lint check
bun run lint
```

## File Structure

```
src/
├── app/
│   ├── page.tsx                  # Main page (Home/Classroom router)
│   ├── layout.tsx                # Root layout with fonts & toaster
│   ├── globals.css               # Tailwind + CSS variables
│   └── api/
│       └── lesson/route.ts       # AI lesson generation endpoint
├── engine/
│   ├── FlowController.ts         # Main teaching flow orchestrator
│   ├── SpeechStreamEngine.ts     # Continuous speech stream
│   ├── BoardManager.ts           # Spatial intelligence board
│   ├── PacingEngine.ts           # Adaptive teaching pacing
│   └── EventBus.ts               # Internal event system
├── components/
│   ├── HomeView.tsx              # Home dashboard
│   ├── ClassroomView.tsx         # Classroom teaching interface
│   ├── classroom/
│   │   ├── SpatialBoard.tsx      # Board canvas with zones
│   │   ├── SpeechIndicator.tsx   # Speech progress & controls
│   │   ├── InputBar.tsx          # User input with voice support
│   │   ├── QuizOverlay.tsx       # Quiz interaction overlay
│   │   └── TokenDisplay.tsx      # Token usage display
│   ├── home/
│   │   ├── ClassroomCard.tsx     # Classroom card component
│   │   └── CreateClassroomDialog.tsx  # New classroom form
│   └── ui/                       # shadcn/ui components
├── stores/
│   ├── flowStore.ts              # Flow state (Zustand)
│   ├── classroomStore.ts         # Classroom CRUD (Zustand + localStorage)
│   ├── progressStore.ts          # Student progress (Zustand + localStorage)
│   └── tokenStore.ts             # Token tracking (Zustand + localStorage)
├── services/
│   ├── storage.ts                # localStorage persistence layer
│   └── classroomMemory.ts       # Classroom teaching memory
├── config/
│   └── curriculum.ts             # Bangladesh curriculum config (Class 6-10)
├── types/
│   └── index.ts                  # All TypeScript types
├── lib/
│   ├── utils.ts                  # cn() utility
│   └── db.ts                     # Prisma client (unused in v3.1)
└── hooks/
    ├── use-toast.ts              # Toast hook
    └── use-mobile.ts             # Mobile detection hook
```

## Deployment (Cloudflare Pages)

This project is designed for stateless, edge-friendly deployment:

1. No server-dependent session memory
2. All data in browser localStorage
3. API routes use serverless-friendly patterns
4. Set `output: "standalone"` in `next.config.ts`

```bash
bun run build
# Deploy .next/standalone to Cloudflare Pages
```

## Features

- **Bilingual Support**: English + Bengali (বাংলা) for all content
- **5 Teacher Personas**: Friendly, Strict, Exam Coach, Slow Explainer, Bilingual First
- **Voice Input**: Web Speech Recognition (Bengali/English)
- **Voice Output**: Speech Synthesis with language auto-detection
- **Smart Board**: Semantic zones with importance, persistence, and lifespan
- **Adaptive Pacing**: Runtime-computed delays based on teaching phase
- **Quiz System**: Multiple choice with explanations
- **Session Resume**: Auto-save and restore capability
- **Token Tracking**: Per-lesson and cumulative token usage monitoring
- **Progress Tracking**: Topics learned, time spent, quiz scores, weak areas
