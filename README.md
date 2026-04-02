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

- **Auth & DB**: Supabase (PostgreSQL, Edge Functions, Row-Level Security)
- **Payments**: Stripe (checkout, webhooks, customer portal)
- **Voice Processing**: Edge functions for STT, TTS (ElevenLabs, MiniMax, Google Cloud), and Nova AI processing
- **Storage**: Supabase Storage for voice recordings and documents

### AI Layer (Nova)

- NovaFloat → NovaVoiceAgent → useVoiceAgent → Firebase voiceAgent
- Voice commands → Firebase cloud functions → appCommands/events
- Brain dump enhancement via Supabase edge functions

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
  lib/                # Core libraries and API clients
supabase/
  functions/          # Edge functions (STT, TTS, payments, Nova AI)
  migrations/         # Database schema migrations
functions/            # Firebase Cloud Functions (Nova voice tools)
public/               # Static assets
```

## Development

### Prerequisites

- Node.js 18+ and npm
- Supabase project (local or remote)
- Firebase project (for Nova functions)
- Stripe account (payments)
- ElevenLabs API key (TTS)

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
