# SaveMe.Space

Voice-first external memory system for people who think out loud.

Capture your thoughts by voice. Nova AI organizes them. Get structured documents, insights, and actionable memory — automatically.

**Live**: https://saveme.space

## What It Does

- **Voice Capture**: Speak naturally. Nova transcribes, categorizes, and structures your thoughts in real time.
- **Smart Organization**: Automatic entry categorization, semantic search, and pattern recognition across your history.
- **Document Export**: Generate structured PDFs, DOCX, and CSVs from voice entries.
- **Nova AI Voice Agent**: Conversational AI layer built on top of your personal memory. Ask questions, get answers based on your captured data.
- **Brain Dump Processing**: Turn unstructured rambling into structured, actionable entries.
- **Intelligence Layers**: Recent entries, related entries, activity dashboards, and insights panels.
- **Offline Support**: PWA with offline sync — capture even when disconnected.
- **Browser Extension**: Quick capture from any page via Chrome/Firefox extension.

## Architecture

### Frontend

- **Framework**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS + Radix primitives
- **State**: React Query, React Context, localStorage
- **Routing**: React Router v6 (HashRouter)
- **Rich Text**: TipTap editor
- **PDF**: jsPDF + pdfjs-dist
- **Speech**: Web Speech API + ElevenLabs TTS integration

### Backend

- **Auth & DB**: Firebase Auth + Cloud Firestore (`saveme-f5af0`)
- **Server logic**: Firebase Cloud Functions in `functions/`
- **Payments**: Stripe checkout, webhooks, and customer portal through Firebase functions
- **Voice Processing**: Firebase functions for Nova agent execution, audio transcription, TTS, quick save, entry intelligence, and shared memory APIs
- **Storage**: Firebase Storage for app assets/user files where enabled
- **No legacy backend clients**: The active app uses Firebase only. Do not add alternate backend clients, edge functions, migrations, docs, or deployment config back into this codebase.

### AI Layer (Nova)

- NovaFloat → NovaVoiceAgent → useVoiceAgent → Firebase `voiceAgent`
- Voice commands → Firebase Cloud Functions → Firestore mutations + appCommands/events
- Shared memory and external agent integration → Firebase shared-memory functions + user-minted `sm_` API keys

## Project Structure

```
src/
  components/          # React components
    settings/          # Settings page sections
    documents/         # Document viewing and editing
    categoryView/      # Category entry browsing
    dashboard/         # Dashboard panels
    voice/             # Voice recording UI
    landing/           # Landing page components
    admin/             # Admin-only components
  pages/              # Route-level page components
  hooks/              # Custom React hooks
  contexts/           # React Context providers
  utils/              # Shared utilities
    nlp/              # Legacy voice command NLP (deprecated)
  lib/                # Core Firebase/API clients
functions/            # Firebase Cloud Functions (Nova, billing, audio, shared memory)
public/               # Static assets
```

## Development

### Prerequisites

- Node.js 20+ and npm
- Firebase project (`saveme-f5af0`) with Auth, Firestore, Storage, and Functions enabled
- Stripe account (payments)
- Gemini/Google Cloud credentials for Nova voice agent and TTS
- Optional user-provided ElevenLabs API key for alternate TTS flows

### Setup

```bash
npm install
cp .env.example .env  # configure your environment
npm run dev           # start dev server
```

### Testing

```bash
npm run test              # default test suite (Vitest, excludes legacy NLP)
npm run test:legacy-voice # deprecated voice/NLP test suite
```

### Build

```bash
npm run build             # production build
npm run build:dev         # development build
npm run preview           # preview production build
```

## Key Pages

- `/` — Landing page with interactive voice demo
- `/dashboard` — Main workspace (voice capture, recent entries, intelligence)
- `/entries` — All entries with search and filtering
- `/category/:id` — Category-specific entry view
- `/insights` — Pattern analysis and activity dashboard
- `/nova-briefing` — Nova AI briefing interface
- `/subscription` — Stripe-powered subscription management
- `/settings` — Full settings panel (profile, voice, data, subscriptions)

## Design

Custom galvanized/skeletal design system — dark, industrial aesthetic with grid blueprint backgrounds, technical typography, and metallic accents. Not a generic template.

---

Built by [BrotherVictorSpeaks](https://x.com/phylosophy) at [Omoha Solutions](https://omohasolutions.com).
