# Soren Classroom — Real Vibe AI Teaching Engine v1.0

## Overview

Soren Classroom is a real-feeling AI classroom built for **Bangladesh National Curriculum (NCTB)** students (Class 6-10). It simulates a **real PhD teacher** from Dhaka University taking a class — natural Bangla-English code-switching, Bangladesh-specific examples, NCTB textbook references, and culturally authentic teaching style.

**This is NOT a robotic AI chatbot.** It's designed to feel like you're sitting in a real classroom in Dhaka, with a teacher who uses "তোমরা", "ভাই", "আপু", cracks examples about rickshaws and Padma Bridge, and genuinely cares about students understanding.

## What Changed from v0.2 → v1.0

### 🔥 Critical Fix: AI Calls Now Actually Work
- **Before**: Client-side Mistral API call that silently failed (no API key) → fell back to hardcoded "pre-recorded" template responses
- **After**: Server-side API routes using `z-ai-web-dev-sdk` — AI calls work out of the box, no API key configuration needed

### 🎓 System Prompt Overhaul: PhD Teacher Persona
- **Before**: Generic "AI Teacher Engine" prompt producing robotic content
- **After**: Detailed prompt simulating a real Bangladeshi PhD professor — code-switching, NCTB references, cultural authenticity

### 🇧🇩 Full Bangla + English Bilingual Support
- **Before**: English-first with robotic Bangla translations
- **After**: Bangla-first with natural English mixing, just like real BD classrooms. All UI labels are bilingual.

### 🗣️ Enhanced TTS
- **Before**: Basic Web Speech API with poor voice selection
- **After**: Smart voice matching (Google/Microsoft/Natural priority), Chrome keepAlive fix, proper Bangla speech rate

## Architecture

### Core Engines

| Module | File | Description |
|--------|------|-------------|
| **FlowController** | `src/engine/FlowController.ts` | Runtime "brain" — orchestrates teaching flow, timing, speech-board sync |
| **SpeechStreamEngine** | `src/engine/SpeechStreamEngine.ts` | Enhanced Web Speech API with smart voice selection, Bangla support |
| **BoardManager** | `src/engine/BoardManager.ts` | Spatial Intelligence Board with semantic zones |
| **PacingEngine** | `src/engine/PacingEngine.ts` | Adaptive teaching pacing per phase |
| **EventBus** | `src/engine/EventBus.ts` | Internal event system |

### API Routes (NEW)

| Route | File | Description |
|-------|------|-------------|
| **POST /api/lesson** | `src/app/api/lesson/route.ts` | Server-side AI lesson generation using z-ai-web-dev-sdk |
| **POST /api/followup** | `src/app/api/followup/route.ts` | Server-side AI follow-up question handling |

### Data Flow

```
Student asks question (InputBar)
    ↓
lessonService.generateLesson() → fetch('/api/lesson')
    ↓
API Route (server-side) → z-ai-web-dev-sdk → AI Model
    ↓
Returns LessonPlan with TeachingIntents
    ↓
FlowController.loadLessonPlan() → plays intents sequentially
    ↓
SpeechStreamEngine (TTS) + BoardManager (visual) in parallel
    ↓
React re-renders via flowStore (Zustand)
```

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

**No environment variables needed!** The AI SDK works out of the box.

## Deployment

### Cloudflare Pages (with SSR support)

Since the app now uses server-side API routes, you need Cloudflare Pages with Next.js SSR support:

1. **Install the Cloudflare adapter:**
   ```bash
   npm install -D @cloudflare/next-on-pages
   ```

2. **Build for Cloudflare Pages:**
   ```bash
   npx @cloudflare/next-on-pages
   ```

3. **Cloudflare Pages Settings:**
   - Build Command: `npx @cloudflare/next-on-pages`
   - Build Output directory: `.vercel/output/static`

4. **Or use the helper scripts:**
   ```bash
   npm run pages:build    # Build for Cloudflare
   npm run pages:deploy   # Build + deploy
   ```

### Vercel (alternative)

```bash
npm run build
# Deploy with: vercel deploy --prod
```

### Self-hosted

```bash
npm run build
npm run start
```

## Features

- **Real PhD Teacher Vibe**: Natural Bangla-English code-switching, Bangladesh-specific examples, NCTB references
- **5 Teacher Personas**: Friendly (বন্ধুত্বপূর্ণ), Strict (কঠোর), Exam Coach (পরীক্ষা কোচ), Slow Explainer (ধীর ব্যাখ্যাকারী), Bilingual First (দ্বিভাষিক)
- **Full Bangla + English UI**: All labels, buttons, placeholders in both languages
- **Voice Input**: Web Speech Recognition with Bangla/English toggle
- **Voice Output**: Enhanced Speech Synthesis with smart voice selection
- **Smart Board**: Semantic zones with importance, persistence, and lifespan
- **Adaptive Pacing**: Runtime-computed delays based on teaching phase
- **Quiz System**: Multiple choice with bilingual explanations
- **Session Resume**: Auto-save and restore
- **Progress Tracking**: Topics learned, time spent, quiz scores, weak areas

## Curriculum Coverage

Based on **National Curriculum and Textbook Board (NCTB), Bangladesh**:

| Class | Subjects |
|-------|----------|
| 6-8 | গণিত (Math), বিজ্ঞান (Science), ইংরেজি (English), বাংলা (Bangla), ICT, বাংলাদেশ ও বিশ্বপরিচয় (BGS), ইসলাম ও নৈতিক শিক্ষা (Islam) |
| 9-10 Science | পদার্থবিজ্ঞান (Physics), রসায়ন (Chemistry), জীববিজ্ঞান (Biology), উচ্চতর গণিত (Higher Math), English, Bangla, ICT |
| 9-10 Arts | ইতিহাস (History), ভূগোল (Geography), অর্থনীতি (Economics), পৌরনীতি (Political Science), English, Bangla, ICT |
| 9-10 Commerce | হিসাববিজ্ঞান (Accounting), ব্যবসায় সংগঠন (Business Org), অর্থনীতি (Economics), English, Bangla, ICT |

## Tech Stack

- **Framework**: Next.js 16 with App Router (SSR + API Routes)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State**: Zustand
- **Animation**: Framer Motion
- **AI**: z-ai-web-dev-sdk (server-side)
- **Speech**: Web Speech API (SpeechSynthesis + SpeechRecognition)
- **Database**: Client-side localStorage
- **Deployment**: Cloudflare Pages (with SSR) / Vercel / Self-hosted
