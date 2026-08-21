# SaveMe.Space

Voice-first external memory. Capture thoughts by voice. Nova AI organizes them.

**Live**: https://saveme.space

## How a new user signs up, captures voice, and pays

1. **Sign up** at `/signup` (email + password, or Google). `/login` is the return path. After auth, you land on `/dashboard` unless a `?plan=` or `?next=` link sent you elsewhere.
2. **Capture voice** from `/voice-capture`, the floating Nova mic, or `/brain-dump`. The browser will ask for the microphone. Audio goes to the Firebase `voiceAgent` function, which transcribes and files an entry.
3. **Pay** at `/subscription` (also Settings → Subscription). Basic is $9/month. Premium is $19/month. Free is $0 with a 50-entry / 500 MB cap. Checkout and the customer portal are Stripe sessions created by Firebase Functions. There is **no paid trial** and **no annual SKU**.

That path is implemented in this repo. Whether live Stripe actually charges a card still depends on Functions secrets (`STRIPE_MODE`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the matching `STRIPE_*_MONTHLY_PRICE_ID` values) being set in Firebase. This repo does not contain those values, and this README does not claim checkout works in production.

## Architecture

### Frontend

- React 18 + TypeScript + Vite
- shadcn/ui + Tailwind CSS
- React Router v6 **BrowserRouter** (old `/#/dashboard` links are rewritten on load)
- Firebase Auth + Firestore + Storage clients

### Backend

- **Auth & DB**: Firebase Auth + Cloud Firestore (`saveme-f5af0`)
- **Server logic**: Firebase Cloud Functions in `functions/`
- **Payments**: `createCheckout`, `customerPortal`, `stripeWebhook`
- **Voice**: `voiceAgent`, plus audio / intelligence / shared-memory functions
- **No second backend**: the active app is Firebase only. Do not add Supabase, edge functions, or another API client.

### AI layer (Nova)

NovaFloat → NovaVoiceAgent → useVoiceAgent → Firebase `voiceAgent`.

## Local development

### Prerequisites

- Node.js 20+ and npm
- Access to Firebase project `saveme-f5af0` (or emulators)
- Stripe test-mode keys for Functions (not committed)

### Setup

```bash
npm install
cp .env.example .env.local   # fill VITE_FIREBASE_* and optional VITE_CLOUD_FUNCTIONS_URL
npm --prefix functions install
# For Functions: copy functions/.env.example and set secrets in the Firebase console,
# or use emulators. Never commit .env, .env.local, or .env.production.
npm run dev
```

Production Hosting builds must receive `VITE_*` values from GitHub Actions secrets. See `.github/workflows/deploy.yml`. Do not put those values in git.

### Testing

```bash
npm test                      # Vitest (excludes legacy NLP)
npm --prefix functions test   # Functions unit tests
npm run test:emulator         # Firestore/Storage rules (needs Java + emulators)
npm run test:legacy-voice     # deprecated voice/NLP suite
```

### Build

```bash
npm run build
npm run preview
```

## Deploy

- **Hosting** deploys from `.github/workflows/deploy.yml` on push to `main`.
- That workflow now also deploys **Functions**. It will fail closed if required `VITE_*` GitHub secrets are missing, so a broken unconfigured bundle cannot overwrite production.
- Firestore/Storage rules are not auto-deployed by that workflow. Deploy them deliberately: `npx firebase deploy --only firestore:rules,storage`.
- Stripe webhook public URL after Hosting rewrite: `https://saveme.space/api/billing/webhook` (the `*.cloudfunctions.net/stripeWebhook` URL still works if already configured).

Required GitHub Actions secret **names** (values stay in GitHub / Firebase, never in this repo):

- `FIREBASE_SERVICE_ACCOUNT_SAVEME_F5AF0`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_CLOUD_FUNCTIONS_URL`

Required Firebase Functions secret **names** (see `functions/.env.example` and `docs/billing/SAVE-106-rollout.md`):

- `STRIPE_MODE` (`test` or `live`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_TEST_BASIC_MONTHLY_PRICE_ID` / `STRIPE_TEST_PREMIUM_MONTHLY_PRICE_ID` or the `STRIPE_LIVE_*` pair

## Key pages

- `/` — Landing
- `/signup`, `/login`, `/reset-password`
- `/dashboard` — workspace
- `/voice-capture` — talk to Nova
- `/brain-dump` — longer capture
- `/subscription` — pay / manage billing
- `/settings` — includes the same Stripe actions
- `/user-guide` — in-app how-to

## Historical docs

Root files such as `BEAST_MODE_PLAN.md`, `VOICE_FLOW_AUDIT.md`, and `docs/hardening/*` are consolidation notes. The commercial contract that launch copy must match is `docs/hardening/decisions/d-004-commercial-contract.md`.

---

Built by [BrotherVictorSpeaks](https://x.com/phylosophy) at [Omoha Solutions](https://omohasolutions.com).
