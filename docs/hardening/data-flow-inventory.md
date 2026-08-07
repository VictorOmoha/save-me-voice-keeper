# SAVE-002 — Data-Flow & Processor Inventory

**Ticket:** SAVE-002 (M0 Foundation Sprint) · **Tracking:** GitHub issue #11
**Baseline:** `main @ 569225b68333d165a942dbd7f258cccc3413ca45`
**Author:** Covenant Privacy (Omoha Solutions) · **Evidence date:** 2026-08-07
**Method:** Static source-only verification of the repository at the baseline commit. No production systems, live data, or deployed configurations were accessed. Anything that can only be verified in production is marked **[UNKNOWN — production-only]**.

> **Scope & status disclaimer.** This document is an engineering evidence inventory prepared to accelerate review by qualified counsel. It is **not legal advice**, does not conclude compliance or non-compliance with any law, and must not be quoted in public policy as a promise of behavior. Every "policy mismatch" noted here is a statement that source evidence and public text diverge — resolution (change code, change policy, or both) is a tracked M0 decision for the product owner and counsel.

---

## 1. How to read this inventory

Each flow is recorded with: trigger & user expectation · source → destination · payload **by category only** (never real values) · processor/subprocessor · transient vs. stored · retention (claimed vs. evidenced) · user control & disclosure point · logs/telemetry · policy mismatch.

**Data classes used throughout** (aligns with SAVE-001 manifest vocabulary; Atlas to confirm final taxonomy):

| Class | Definition |
|---|---|
| **A — Transient audio** | Raw voice recordings in transit (base64 in request bodies). Evidenced: never persisted server-side; no Cloud Storage usage for audio. |
| **B — Transcripts / text captures** | Speech-to-text output, brain-dump text, quick-save page content. |
| **C — Entries (user content)** | `entries` docs: titles, free-form fields, categories, source URLs, document attachments. |
| **D — Conversation history** | `nova_conversations` turns (full text dialogue with the Nova agent, incl. tool-call records). |
| **E — Derived intelligence** | `entity_graph`, `entry_entities`, `entry_links`, `action_items`, `user_patterns`, `user_category_patterns`, `pending_notifications` (insights), `summary` fields. |
| **F — Agent-accessible memory** | `nova_memories`, `nova_user_profile`, `shared_memories`, `api_keys`. |
| **G — Account & billing** | Firebase Auth records, `users`, `profiles`, `user_preferences`, Stripe customer/subscription mirror. |
| **H — Telemetry & logs** | GA4 events, GoatCounter pageviews, `search_analytics`, `webhook_events`, Cloud Logging output, client `console.*`. |
| **I — Credentials & BYOK** | User's own ElevenLabs key, agent `sm_` keys (hashed), legacy static agent key, extension-held Firebase ID token. |

---

## 2. Processor / subprocessor inventory (evidence-based)

Confidence: **Confirmed-in-code** = live code path calling the vendor at baseline. **Referenced** = code/config/docs reference it but no live call path was evidenced at baseline.

| # | Processor | Role evidenced in source | Data categories sent | Confidence | Disclosed in current PRIVACY_POLICY.md? |
|---|---|---|---|---|---|
| 1 | **Google — Gemini API** (`generativelanguage.googleapis.com`, model `gemini-2.5-flash`) | Audio **transcription** (`transcribeAudio`); Nova agent conversation loop; silent memory extraction; entry enrichment (`processEntryDeep`); category prediction; daily pattern mining (`analyzePatterns`); daily insights (`novaInsights`); briefings (`prepareBriefing`); brain-dump category prediction in `quickSave` | A (audio bytes), B, C, D, E, F (personal facts incl. health/finance/contacts categories), display name derived from email | **Confirmed-in-code** | **No.** Policy names "11Labs" as the voice/transcription processor; Google is listed only as Firebase/Google Cloud hosting (§5.1). **Headline mismatch.** |
| 2 | **Google — Cloud Text-to-Speech** (`texttospeech.googleapis.com`) | Voice-agent spoken responses (service-account ADC); `googleCloudTts` proxy (API key); `demoTts` public demo endpoint | Assistant response text / B; demo text; **client IP** (demo rate-limit map, in-memory only) | **Confirmed-in-code** | No — not named as a processor. |
| 3 | **Google — Firebase / Google Cloud Platform** (Auth, Firestore, Cloud Functions, Cloud Storage, Firebase Analytics→GA4) | Primary backend, persistence, auth, hosting, analytics | All classes A–I as detailed in §3 | **Confirmed-in-code** | Partially — named for hosting/auth/database/storage (§5.1); not disclosed as AI-processing subprocessor; analytics disclosed only as "Google Analytics or similar (anonymized data only)". |
| 4 | **ElevenLabs** (`api.elevenlabs.io`) | TTS via server proxy (`elevenlabsTts`, model `eleven_turbo_v2`); **direct browser→ElevenLabs BYOK path** using the user's own key | Assistant/entry text selected for read-aloud (B/C); user's own ElevenLabs credential (I) on BYOK path | **Confirmed-in-code (TTS)**; **NOT evidenced for transcription** | Mis-described: policy §2.2/§5.1 claims 11Labs performs **voice-to-text transcription** and is the "voice AI provider". Source shows ElevenLabs is **TTS-only**; transcription is Gemini. |
| 5 | **MiniMax** (`api.minimax.chat`, model `speech-01-turbo`) | TTS via server proxy (`minimaxTts`) | Text selected for speech (B/C) | **Confirmed-in-code** | No — absent from policy's provider list. |
| 6 | **OpenAI** (`api.openai.com`, model `gpt-4o-mini`) | `enhanceBrainDump` — brain-dump text enhancement | B (raw free-text thoughts) | **Confirmed-in-code** | No — absent from policy. |
| 7 | **Stripe** (SDK, apiVersion `2023-10-16`) | Subscription checkout, customer portal, webhooks | Email, Firebase UID (in Stripe metadata), plan/price IDs, subscription status (G). No card data touches SaveMe servers (Stripe-hosted checkout). | **Confirmed-in-code** | Yes (§2.1, §5.1). |
| 8 | **GoatCounter** (`saveme.goatcounter.com`, script `gc.zgo.at`) | Pageview analytics, cookieless; loaded unconditionally in `index.html`, no consent gate | Page path, referrer, UA-derived browser/OS, screen size (H). IP handling per GoatCounter's own policy — [UNKNOWN — production-only] | **Confirmed-in-code** | **No** — not named in policy §5.1/§9 (only "Google Analytics or similar"). |
| 9 | **Google Analytics 4** (via Firebase Analytics SDK, measurement ID from `VITE_FIREBASE_MEASUREMENT_ID`) | Product analytics events (`signup_*`, `recording_*`, `transcription_*`, `brain_dump_saved`, etc.) | Event names + bounded params (source, method, mime type, blob size, transcript **length**, category name). No user ID set; no content text sent. [IP anonymization default-on in this SDK path; no explicit `anonymize_ip` config — flag] | **Confirmed-in-code** | Partially — "Google Analytics or similar (anonymized data only)". The "anonymized" characterization is only partially evidenced (no user ID, no content; but device/app-instance identifiers still flow). |
| 10 | **User-configured webhooks / Zapier** (`webhookService.ts`, `zapierService.ts`) | User-initiated outbound integrations on entry create/update/delete | **Full entry objects (C)** + user email (G), sent from the **client browser** to arbitrary user-supplied URLs | **Confirmed-in-code** | Not disclosed as a data-sharing channel in policy (Zapier named only in shared-memory API docs). |
| 11 | **Third-party AI agents** (OpenClaw/"Nia", Hermes/Cognibrowse, Claude, Codex, Cursor, Gemini CLI, custom agents) | Read/write access to `shared_memories` via user-minted `sm_` keys; legacy path via shared static `AGENT_API_KEY` env secret writing under pseudo-user IDs | F (full shared-memory corpus of the key's owner, incl. auto-mirrored personal facts); legacy path also C/E writes under `nia-openclaw-agent` pseudo-user | **Confirmed-in-code (API surface)**; external agents themselves are off-repo | Partially — shared-memory API is documented in-repo and on landing page; **privacy policy §5 has no processor/sharing entry for third-party agent access at all.** |
| 12 | **Google/Microsoft OAuth** | Policy §2.4 claims profile info from "Google, Microsoft, or other OAuth providers" | Signup: name, email (G) | **Google only — confirmed; Microsoft/others — referenced only (not implemented)** | Over-broad claim vs. implemented Google-only OAuth. |
| 13 | **Supabase** | Vestigial scaffold (`src/integrations/supabase/client.ts`, `supabase/config.toml`); no dependency in `package.json`, no imports observed | None evidenced | **Referenced — appears dead** | n/a (not disclosed; no flow evidenced). |
| 14 | **Google Fonts** (`fonts.googleapis.com`, `fonts.gstatic.com`) | Font delivery on web app | Request metadata (IP, UA) inherent to font fetch (H-incidental) | **Confirmed-in-code** | No. |
| 15 | **Browser Speech APIs** (Web Speech API / SpeechSynthesis) | On-device fallback TTS and transitional speech recognition | B (utterances) processed on-device / by OS-level services [vendor routing depends on browser/OS — UNKNOWN to repo] | **Confirmed-in-code (client)** | Not disclosed. |

**Vendor DPAs / SCCs / data-processing terms:** not in repo for any processor. **[UNKNOWN — contract artifacts to be supplied by owner]** Policy §11.2 claims "We use Standard Contractual Clauses (SCCs) for data transfers" — no contractual evidence exists in-repo; this is a counsel verification item (see counsel packet Q-series).

---

## 3. Data-flow register

> Payloads are described **by category only**. "Stored" locations cite the Firestore collection or storage key evidenced at baseline. All server-side persistence is Firestore (us-central1 per function URLs) unless noted; **[region pinning for Firestore/Storage beyond function region — UNKNOWN — production-only]**.

### 3.1 Voice capture → transcription (Class A → B)

| Field | Detail |
|---|---|
| **Trigger / user expectation** | User taps Nova mic or brain-dump voice capture. UI sets expectation of private "second brain"; onboarding gives **no voice-processing disclosure** (`VoiceStep.tsx`). |
| **Source → destination** | Browser `MediaRecorder` (webm/opus, ≤30s) → base64 JSON POST → Cloud Function `transcribeAudio` (and/or `voiceAgent` with inline audio) → **Gemini `gemini-2.5-flash`** `generateContent`. |
| **Payload categories** | Audio bytes (A); Firebase ID token (G-auth); for `voiceAgent`: prior conversation turns (D), `sessionId`. |
| **Processor / subprocessor** | Google (Gemini API) on Google Cloud Functions. |
| **Transient vs. stored** | **Transient.** Audio is never written to Storage or Firestore server-side (evidenced: no `admin.storage()` usage anywhere in `functions/`). Policy claim "audio immediately deleted after transcription (< 1 minute)" is **consistent with code in the trivial sense that audio is never persisted** — but the claim as written also implies a deletion process that doesn't exist, and says nothing about Gemini's own processing/retention, which is governed by Google's API terms **[UNKNOWN — which Gemini API terms apply (free vs. paid tier training exclusions) — production/contract]** |
| **Retention (claimed vs. evidenced)** | Claimed: deletion < 1 minute (PP §2.2/§7.3). Evidenced: no server-side persistence at all; last blob URL kept as `window.__lastCapturedAudioUrl` page-global client-side (session-scoped). |
| **User control / disclosure point** | Mic permission prompt (browser). No in-product disclosure naming Google/Gemini. Policy names the wrong vendor (11Labs). |
| **Logs / telemetry** | `transcribeAudio` **logs transcript text truncated to 200 chars** to Cloud Logging; logs Gemini error bodies (≤200 chars). Client logs **full transcript** via `console.log` in `useBrainDumpCapture.ts` (production build, console-local only). GA event `transcription_completed` carries transcript **length** only. |
| **Policy mismatch** | **Critical**: PP §2.2/§5.1 + ToS §4.1 attribute transcription to 11Labs; implementation is Gemini. ToS §4.1 carve-out "unless you explicitly save them" has no implemented save-audio path (no audio storage exists). |

### 3.2 Nova voice-agent conversation loop (Classes B, C, D, E, F → Gemini; D stored)

| Field | Detail |
|---|---|
| **Trigger / expectation** | User speaks/types to Nova. Marketing: "Only you — and the agents you explicitly authorize — can read your memory" (landing). |
| **Source → destination** | Client → `voiceAgent` CF → Gemini (system prompt + conversation + tools) → response text → **Google Cloud TTS** (ADC) → base64 audio back to client. |
| **Payload categories** | System prompt embeds: **display name (derived from email local-part)**, `memory_summary` (**concatenated personal facts incl. health/finance/contacts**), last conversation summary, active behavioral patterns (F/E); plus current turn (B/audio A), conversation history (D), tool schemas. Response text (B) → Google TTS. |
| **Processor** | Google (Gemini + Cloud TTS). |
| **Transient vs. stored** | Gemini/TTS calls transient [vendor-side retention UNKNOWN — contract]. **Stored:** `nova_conversations/{sessionId}` — full text turns incl. tool-call records, `actions[]`, `summary`; audio parts sanitized to `"[voice message]"` placeholder before storage (good). |
| **Retention** | **No TTL, no scheduled deletion.** In-memory history capped to last 10 turns before persist; the persisted doc accumulates. Claimed "Command metadata: retained 90 days" (PP §7.3) — **no 90-day mechanism evidenced**. |
| **User control / disclosure** | No per-turn disclosure that conversation + memory profile is sent to Google. No setting to disable memory extraction. |
| **Logs / telemetry** | `[VoiceAgent] Tool: ${name}`, args — **raw tool args logged** (can include entry content, phone numbers, memory facts supplied by the model); fallback response text logged; summarized args (≤120 chars/field via `summarizeToolArgs` — **truncation, not redaction**) logged on completion; session IDs logged; internal `error.message` returned to client on 500. |
| **Policy mismatch** | Memory/conversation processing by Google undisclosed; 90-day command-metadata retention unsupported by code (indefinite instead); "agents you explicitly authorize" undercut by silent auto-mirroring of facts to agent-readable store (see 3.5). |

### 3.3 Silent memory extraction & profile building (Class B → F; F → Gemini)

| Field | Detail |
|---|---|
| **Trigger / expectation** | Automatic after voice turns (`extractAndStoreMemories`). **System prompt instructs Nova: "Do NOT tell the user you're storing a memory unless they explicitly asked you to. Just do it silently."** Users are not told. |
| **Source → destination** | User utterance text → Gemini extraction prompt (categories enum: `personal\|health\|finance\|work\|contacts\|preferences\|schedule`) → `nova_memories` + `nova_user_profile` → **auto-mirror to `shared_memories` with `visibility: "shared_with_agents"`**. |
| **Payload categories** | B (utterance) to Gemini; F (extracted facts incl. **special-category-adjacent health/finance**) stored and mirrored. |
| **Processor** | Google (Gemini). Third-party agents gain read access via mirror (see 3.5). |
| **Transient vs. stored** | Stored indefinitely (F). |
| **Retention** | No TTL/purge. `forgetMemory` sets `active: false` — **soft delete; content retained** and readable by anyone with direct Firestore access; mirrored `shared_memories` copy is **not** deactivated by `forgetMemory` **[verify: no cross-store cleanup evidenced]**. |
| **User control / disclosure** | No consent, no notice, no opt-out. "Memory" is marketed as a feature but silent capture of health/finance facts is not disclosed in PP. |
| **Logs / telemetry** | Error-path logging only in extraction; but voiceAgent tool logs may carry `rememberFact` content (≤120 chars/field). |
| **Policy mismatch** | Silent collection conflicts with policy's consent framing (PP §4 legal bases list "Consent") and with landing's "agents you explicitly authorize". Auto-mirror default `shared_with_agents` means **explicit `rememberFact` and silent extractions both become agent-readable by default.** |

### 3.4 Entry intelligence pipeline (Class C → E; C/E → Gemini & OpenAI)

| Field | Detail |
|---|---|
| **Trigger / expectation** | `processEntryDeep` Firestore onWrite trigger on every entry create/update; `enhanceBrainDump` on brain-dump save; scheduled `analyzePatterns` (24h) and `novaInsights` (24h, America/New_York); `prepareBriefing` on demand. |
| **Source → destination** | `entries` → Gemini (title + all string fields, entity/action-item/summary extraction; ≤50 titles+categories for patterns; 7-day titles+150-char content snippets for insights; category histogram + 3 example titles/category for category prediction). `enhanceBrainDump` → **OpenAI `gpt-4o-mini`** (raw brain-dump text). |
| **Payload categories** | C (titles, full field content), E, F (memory facts in briefings), person names/assignees. **Concentrated relational data** in `prepareBriefing` (entries + memories + open action items about a named person). |
| **Processor** | Google (Gemini); **OpenAI (undisclosed)**. |
| **Transient vs. stored** | Stored: `entity_graph` (person/org names, aliases, mention counts), `entry_entities` (incl. **`context_snippet` = first 200 chars of entry content**), `entry_links`, `action_items`, `user_patterns`, `user_category_patterns` (**doc IDs embed content-derived keywords**: `${userId}_${signal}_${category}`), `pending_notifications` (insight text embeds **real entry titles**), `entries.summary/tags/entities/linked_entries`. |
| **Retention** | None. All derived artifacts persist indefinitely. **`deleteEntry` hard-deletes the entry doc but leaves ALL derived artifacts orphaned** (entity_graph, entry_entities, entry_links, action_items, mirrored shared_memories) — **deletion-completeness defect**, critical for Atlas's manifest `deleteOrder`/`dependencies`. |
| **User control / disclosure** | None surfaced. Policy §3 discloses "improve the service" style purposes generically; no disclosure of per-entry AI enrichment or of OpenAI. |
| **Logs / telemetry** | `novaInsights` failure path logs **raw Gemini output untruncated** (embeds entry titles); `analyzePatterns`/`novaInsights` log userIds; `processEntryDeep` logs Gemini raw output ≤200 chars on parse failure. |
| **Policy mismatch** | OpenAI absent from processor list; behavioral profiling/insights undisclosed; "anonymized, aggregated data only" (PP §3.2/§3.5) conflicts with **per-user, content-level** processing (patterns and insights are user-level and content-bearing, not anonymized). |

### 3.5 Shared-memory agent API (Class F ↔ third-party agents)

| Field | Detail |
|---|---|
| **Trigger / expectation** | User creates an `sm_` agent key in Settings (UI default scopes: **read + write**). Agents (OpenClaw/Nia, Hermes, Claude, Codex, Cursor, custom) call 7 HTTP endpoints. |
| **Source → destination** | Agent ↔ Cloud Functions `sharedMemory*` ↔ `shared_memories` (Firestore). |
| **Payload categories** | F: title, content (free-form memory text), summary, type, source, `people[]` (**person names**), tags, project, confidence, verification, visibility, arbitrary `metadata{}`. |
| **Processor** | Third-party agents are **recipients** (user-authorized data sharing), plus legacy shared-static-key path (`AGENT_API_KEY` env) funneling writes under pseudo-user `nia-openclaw-agent`. |
| **Transient vs. stored** | Stored. `api_keys` stores **SHA-256 hash only** + prefix (first 10 chars + "..."), `is_active`, `last_used_at` (verified: `agentKeys.ts` hashes; plaintext returned once at creation). |
| **Retention** | **No memory delete endpoint** (update allows `status: "deleted"` soft-delete only). **No key-revocation endpoint** exported server-side; UI revoke calls `deleteDoc` on `api_keys` but **firestore.rules deny client delete** (`allow create, update, delete: if false`) — **revocation appears broken at baseline** (contradicts docs claim "Revoking a key deletes the Firestore key record" and UI promise "revoke access anytime"). No key expiry/rotation. |
| **User control / disclosure** | Landing: "Per-agent API keys with read/write scopes you control." Code: `visibility` field is a **query filter, not an access gate** — any read-scoped key can list/search `"private"` memories; `shared_with_selected_agents` enum exists with **zero enforcement code**. Default new-key scope is read+write (not least-privilege). |
| **Logs / telemetry** | `access_count`/`last_accessed_at` incremented on docs (audit metadata). Error-only console logs. `sharedMemoryAgentStatus` echoes key prefix to caller. |
| **Policy mismatch** | Privacy policy contains **no disclosure of third-party agent access as a sharing channel** despite it being a headline product feature; "agents you explicitly authorize" is undercut by (a) silent auto-mirror default-shared facts (3.3), (b) broken revocation, (c) unenforced visibility tiers. Legacy static-key path has **no per-user isolation** (all legacy-agent data lands in one synthetic user's bucket). |

### 3.6 Billing via Stripe (Class G)

| Field | Detail |
|---|---|
| **Trigger / expectation** | Upgrade to paid plan; manage subscription. |
| **Source → destination** | Client → `createCheckout` / `customerPortal` CFs → Stripe (hosted checkout/portal); Stripe → `stripeWebhook` (signature-verified) → Firestore mirror. |
| **Payload categories** | To Stripe: email, Firebase UID (customer + session `metadata`), plan/price IDs, origin-scoped return URLs. From Stripe: customer id, subscription id/status/price. **No card data touches SaveMe** (Stripe-hosted pages) — supports PP §2.1 claim. |
| **Processor** | Stripe (disclosed). |
| **Transient vs. stored** | Stored mirror: `users/{uid}` ← `stripeCustomerId`, `subscriptionStatus`, `subscriptionId`, `subscriptionTier`, `updatedAt`. |
| **Retention** | Claimed "billing records retained 7 years" (PP §7.2) — no code mechanism (would be a deletion-exemption rule in SAVE-001 manifest; **dependency on Atlas**). |
| **User control / disclosure** | Stripe-hosted pages carry Stripe's own disclosures. |
| **Logs / telemetry** | Error objects logged (request ids possible); `Unhandled event type: ${event.type}`. |
| **Policy mismatch** | Price/plan env fallbacks are placeholder strings (`price_basic_monthly`) — **[UNKNOWN — production-only]** whether live price IDs exist; pricing presented three different ways across repo (ToS: Free/Pro $12/Teams $29/Enterprise; in-app ToS: Free/Pro; landing: FREE/BASIC $9/PREMIUM $19) — billing claims are SAVE-003 scope, noted here for counsel context. ToS §6.6 "Credit card required for trial activation" vs. marketing "Start free. No card needed." |

### 3.7 Browser extension quick capture (Class C from arbitrary pages; Class I token)

| Field | Detail |
|---|---|
| **Trigger / expectation** | User invokes context-menu "Save to SaveMe" on selected text, or opens popup. Store listing: "No selling, no sharing, no tracking." |
| **Source → destination** | Content script (saveme.space origins only) relays **Firebase ID token** via window event `saveme:auth-token` → background → `chrome.storage.local` (`authToken`, 55-min expiry). Popup/context-menu → `quickSave` CF (+ live category prediction as user types, debounced 600ms — **content leaves device before explicit save**). |
| **Payload categories** | Selected text, page title, page URL (C); Firebase ID token (I/G) stored in extension storage; `predictCategory` sends title+≤5000-char content (capped 200 chars in-prompt) → **Gemini**. |
| **Processor** | Google (Gemini via CF; Firebase). Extension itself has no third-party telemetry (evidenced: no analytics in extension code). |
| **Transient vs. stored** | Stored: entry in `entries` (`source: "browser_extension"`, `fields.url` = source URL); token in `chrome.storage.local`. |
| **Retention** | None beyond entry lifecycle. |
| **User control / disclosure** | `activeTab`-scoped selection capture is user-initiated (good). Store listing's permissions justifications live only in extension README, not the listing. Popup's pre-save category ping is undisclosed anywhere. |
| **Logs / telemetry** | None in extension. |
| **Policy mismatch** | **M0 guardrail #5** ("no restoration of the extension window-event token relay") — note: `content-script.js` still listens for `saveme:auth-token` while `useExtensionBridge.ts` says the dispatcher was removed; the handshake may be dead code or the dispatcher may live in an unread file **[verify — SAVE-004 scope, flagged as dependency]**. "No tracking" claim holds in-repo for the extension. Extension data collection (page URL/title/selection) is not described in PP §2. |

### 3.8 Analytics & first-party telemetry (Class H)

| Field | Detail |
|---|---|
| **Flows** | (a) **GoatCounter** pageviews — unconditional script in `index.html`, cookieless, no consent gate. (b) **GA4 via Firebase Analytics** — `trackActivationEvent` events: `signup_started/completed` (source, method, requested_plan), `mic_permission_*`, `recording_*` (mime, blob **size**), `transcription_completed` (transcript **length**), `brain_dump_saved` (source, category name), `brain_dump_voice_agent_failed` (server error text ≤80 chars — could embed content echoed by backend). No `setUserId`; no content/titles. (c) **First-party `search_analytics`** — **raw search query text** stored in Firestore with user_id (not disclosed as such). (d) `webhook_events` Firestore log of full webhook payloads. |
| **Retention** | GA4: per GA settings [UNKNOWN — production-only]. GoatCounter: per GC settings [UNKNOWN]. `search_analytics`/`webhook_events`: **no TTL** in code. Claimed "command metadata retained 90 days" unsupported. |
| **User control / disclosure** | No cookie banner, no consent mode, no opt-out UI. Policy §9 describes cookies + GA opt-out link; **no in-app mechanism evidenced**. Policy says "We do not currently respond to Do Not Track" (accurate as far as code shows). |
| **Policy mismatch** | "Anonymized data only" overstates: GA path sends device/app-instance IDs; `search_analytics` stores raw queries keyed to user_id; GoatCounter undisclosed; no consent gating despite PP §4 consent legal basis and cookie claims. |

### 3.9 Local / offline storage (Classes C, I on-device)

| Field | Detail |
|---|---|
| **IndexedDB `saveme-offline`** | `cached_entries` (full entry records incl. content fields), `offline_queue` (full create/update/delete payloads) — syncs to Firestore on reconnect (`_syncedFromOffline: true`). |
| **localStorage** | `nova_session_id` (conversation continuity), TTS/voice prefs, **`savedWebhookConfigs` (user webhook URLs + test field values, plaintext)**, Firebase auth keys. sessionStorage: `saveme_share_payload`. |
| **window globals** | `__lastCapturedAudioUrl` (blob URL of last recording), `__recent_tts_texts` (last 3 spoken strings), TTS state flags. |
| **Policy mismatch** | Offline/local persistence is entirely absent from PP (README markets "PWA with offline sync"). Interacts awkwardly with "audio immediately deleted" framing: audio isn't persisted locally either (blob URL is memory-scoped), but **entries and pending-sync content are**. Deletion flows do not purge `saveme-offline` caches **[verify — deletion-completeness dependency for Atlas]**. |

### 3.10 BYOK — user-provided ElevenLabs key (Class I)

| Field | Detail |
|---|---|
| **Flow** | Settings → key stored in **Firestore `user_preferences/{uid}.elevenlabs_api_key` (plaintext, owner-read rules)** → mirrored to in-memory `userSecrets.ts` at runtime → browser calls `api.elevenlabs.io` **directly** with `xi-api-key` (text-to-speech of assistant/entry text). Key validated client-side via `GET /v1/voices`. |
| **Policy mismatch** | Policy frames 11Labs strictly as company-side processor; the BYOK path makes the **user's own ElevenLabs account** the TTS processor relationship — undisclosed. Plaintext-at-application-layer storage of a user credential in Firestore (rules are owner-only, but any server-side breach/rule regression exposes it) vs. UI claim elsewhere that "Agent API keys are hashed and cannot be recovered" (true for `sm_` keys, **not** for the ElevenLabs key — users may conflate). MiniMax key has a format validator but no storage path found **[dead or in unread file — flag]**. |

### 3.11 Auth & account (Class G)

| Field | Detail |
|---|---|
| **Flows** | Email/password signup (name, email, password; `sendEmailVerification`) + Google OAuth (`select_account`, popup/redirect). No other providers (PP §2.4's "Microsoft or other" unimplemented). **No MFA anywhere** — SecuritySettings shows 2FA "Coming Soon". Password rules inconsistent: signup min 6 chars vs. settings change 8+ complexity. Account deletion: UI button shows "contact support" toast and logs out — **no self-serve deletion implemented**; no server-side account-deletion job found. |
| **Policy mismatch** | PP §6.1 "Multi-factor authentication available" — **false at baseline**. PP §7.1 "Deleted content is permanently removed within 30 days" and §7.2 "Data is permanently deleted 30 days after cancellation" — **no deletion pipeline evidenced at all**; backup 90-day language unreconciled with 30-day promise. Breach-notification 72h promise (ToS §9.3) has no mechanism in code. |

---

## 4. Policy-claim matrix (claims ↔ technical evidence)

Status key: **Supported** / **Partially supported** / **Unsupported (no evidence)** / **Contradicted** / **Unknown (production-only)**.

| # | Claim (source) | Technical evidence | Status |
|---|---|---|---|
| P1 | "Audio is sent to 11Labs… 11Labs converts speech to text" (PP §2.2; ToS §4.1 "currently 11Labs"; STORE_LISTING "AI-powered transcription") | Transcription = **Gemini** `gemini-2.5-flash` in `transcribeAudio`/`voiceAgent`; ElevenLabs is TTS-only (`elevenlabsTts`, BYOK direct) | **Contradicted** |
| P2 | "Audio is immediately deleted after transcription (< 1 minute)" (PP §2.2/§7.3) | Audio never persisted server-side (no Storage use). No deletion *process* exists because nothing is stored; Gemini-side retention unknown | **Partially supported** (effect) / **misleading framing**; vendor-side retention **Unknown** |
| P3 | "Only the text transcription is permanently stored" (PP §2.2) | Transcripts persist inside `nova_conversations` turns and entries; audio placeholders stored for voice turns | **Supported** (with D-class nuance: full conversations stored, not just transcripts) |
| P4 | "We do NOT share voice data with third parties (except 11Labs for processing)" (PP §2.2) | Voice audio + transcripts + memory profiles go to **Google Gemini**; brain-dump text to **OpenAI**; TTS text to Google/MiniMax/ElevenLabs | **Contradicted** |
| P5 | "Command metadata: Retained for 90 days" (PP §2.2/§7.3) | No TTL/retention mechanism anywhere; `nova_conversations` indefinite | **Contradicted** (indefinite, not 90 days) |
| P6 | "Deleted content is permanently removed within 30 days" (PP §7.1); "Data permanently deleted 30 days after cancellation" (PP §7.2; ToS §9.4) | Per-entry hard delete exists (`deleteEntry`) but **orphans all derived artifacts**; memories soft-delete only; **no account-deletion implementation** (UI = "contact support" toast); no scheduled purge | **Contradicted** |
| P7 | "Export: JSON, CSV, PDF, DOCX" / "at any time… no charge" (PP §8.1; ToS §9.5) | Client export = **JSON only** (EnhancedDataManagement) or **JSON/CSV** (ExportSettings via `triggerExport` CF — function existence at baseline: referenced client-side; **not found in `functions/src/index.ts` exports** → likely 404s); no PDF/DOCX path; Free tier "PDF export only" per ToS pricing conflicts | **Contradicted** (formats) / **Unknown** (server export function missing from exports) |
| P8 | "Multi-factor authentication available" (PP §6.1); "Enable 2FA (if available)" (§6.2) | SecuritySettings 2FA = "Coming Soon"; no MFA code paths | **Contradicted** |
| P9 | "All data encrypted in transit (HTTPS/TLS)" + "Data at rest is encrypted in our database" (PP §6.1; landing claims transit-only) | TLS everywhere (CF endpoints, HTTPS); at-rest = Firebase/GCP default encryption (no app-level encryption). Claim is a GCP-infrastructure pass-through | **Supported** (infrastructure-delegated) — counsel to confirm wording; note landing deliberately claims less than PP |
| P10 | "Google Analytics or similar (anonymized data only)" (PP §5.1); "Voice command accuracy metrics (anonymized)" (§2.3); "anonymized, aggregated data only" for improvement (§3.2/§3.5) | GA4 without user-ID and content-free params (good), but GoatCounter undisclosed; `search_analytics` stores raw queries keyed by user_id; pattern/insight pipelines are per-user content processing, not anonymized aggregation | **Partially supported / Contradicted** for the broader anonymization framing |
| P11 | "We will NEVER… Train AI models on your private data without consent" (PP §3.5) | SaveMe code does not train models; but user content **is sent to Google/OpenAI** — whether those vendors train on API data depends on each vendor's API terms (Gemini free-tier vs paid; OpenAI API default no-training) — **contract-dependent, not code-dependent** | **Unknown — counsel/vendor-terms verification required** |
| P12 | "Agent API keys are hashed and cannot be recovered" (settings UI; shared-memory docs) | `agentKeys.ts`: SHA-256 hash at rest, plaintext shown once | **Supported** (for `sm_` keys only; not for ElevenLabs BYOK key or legacy static `AGENT_API_KEY`) |
| P13 | "Only you — and the agents you explicitly authorize — can read your memory" (landing) | Silent auto-mirror of extracted facts to `shared_with_agents`; `visibility` not enforced; key revocation broken at rules layer; legacy shared key has no per-user isolation | **Contradicted** in practice |
| P14 | "We will notify you of any data breach within 72 hours" (ToS §9.3) | No breach-detection/notification mechanism in code | **Unsupported** (process artifact — may exist off-repo; counsel to confirm) |
| P15 | "Standard Contractual Clauses (SCCs) for data transfers" (PP §11.2); US-primary storage (§11.1) | No contracts in repo; Firestore region = us-central1 implied by function URLs; Gemini/OpenAI/MiniMax/ElevenLabs endpoints are vendor-global | **Unknown — contract verification required** |
| P16 | Age gate: "not intended for users under 18" (PP §10) vs. "18 or have parental consent" (ToS §3.1) | No age gate, no parental-consent flow, no age field at signup | **Contradicted internally** + **Unsupported** mechanically |
| P17 | "You can revoke agent access at any time" (settings UI); "Revoking a key deletes the Firestore key record" (docs) | `firestore.rules`: `api_keys` client create/update/delete **denied**; no server revoke endpoint exported | **Contradicted at baseline** (appears broken) |
| P18 | "No selling, no sharing, no tracking" (extension store listing) | Extension has no telemetry; **but** popup live-sends typed content to `quickSave` for category prediction before save; listing omits permission justifications | **Partially supported** (tracking) / disclosure gap (pre-save transmission) |
| P19 | "Data is stored securely with encryption at rest" + "You can export your data or revoke agent access at any time" (Data Management settings card) | See P9/P17/P7 | **Mixed** (see rows) |
| P20 | Internal consistency: Last Updated Nov 17 2025 **before** Effective Jan 15 2026; in-app PrivacyPolicy.tsx omits GDPR bases/SCCs/DPO/DNT/business-transfer vs. PRIVACY_POLICY.md; 3 conflicting pricing tables; Charlotte NC address in policies vs. marketing rule "Do not mention Charlotte publicly" | n/a (document hygiene) | **Contradicted internally** — counsel should ratify one canonical text |
| P21 | "Credit card details (processed by Stripe, not stored by us)"; "We do NOT see your full credit card details" (PP §2.1/§5.1) | Stripe-hosted checkout/portal only; no card fields in code | **Supported** |
| P22 | "We do not currently respond to Do Not Track" (PP §12) | No DNT handling found | **Supported** |
| P23 | Offline support (README: "capture even when disconnected") | IndexedDB caches + sync queue exist; **not disclosed in PP** | **Disclosure gap** |
| P24 | Subprocessor completeness (PP §5.1: Firebase/Google Cloud, 11Labs, Stripe, "Google Analytics or similar") | Missing: Gemini (as AI processor), OpenAI, MiniMax, Google Cloud TTS, GoatCounter, third-party agents (as data recipients), user-configured webhooks/Zapier channel | **Contradicted (incomplete)** |

---

## 5. Cross-cutting observations for counsel & engineering

1. **Special-category data is a first-class product surface.** Tool schemas and memory prompts explicitly solicit health, finance, contacts, and "credential" entries. This drives the counsel questions on sensitive-data posture, marketing claims, and whether any regulated-data disclaimers are needed.
2. **Deletion is architecturally incomplete.** Hard delete exists only for `entries` docs and orphans derived intelligence; memories/soft-delete everywhere else; no account deletion; local caches and extension token not covered. This is the primary input Atlas's SAVE-001 manifest must satisfy (`deletePolicy`, `deleteOrder`, `dependencies`).
3. **The agent-memory sharing model outruns its disclosures.** Silent capture → auto-mirror → unenforced visibility → broken revocation is a compounding chain; each link is individually documented above.
4. **Logging carries content.** Cloud Logging receives transcript snippets (≤200 chars), raw tool args (content-bearing), raw Gemini insight output (untruncated), userIds; production client `console.log` carries full transcripts and webhook payloads (console-local). A log-hygiene decision (retention, access, redaction) is needed.
5. **Consent is asserted but not captured.** PP §4 lists "Consent" as a legal basis; signup has no ToS/privacy acceptance mechanism; voice processing has no just-in-time notice; analytics has no consent gate.
6. **`user_category_patterns` document IDs leak entry vocabulary** (`${userId}_${signal}_${category}`) — visible to anyone with Firestore read on that collection (owner-only per rules today; still a design smell).
7. **Unauthenticated surface:** `demoTts` (IP-rate-limited, processes arbitrary short text + client IPs) and `waiting_list` (public write, no validation).

---

## 6. Dependencies

- **From Atlas (SAVE-001):** deletion/export treatment per data class (esp. derived-intelligence cascade `entity_graph`/`entry_entities`/`entry_links`/`action_items`/`shared_memories` mirrors; `nova_conversations`; `search_analytics`; `webhook_events`; local IndexedDB; Stripe mirror and the 7-year billing-record claim), `retentionPolicy` vocabulary to align with this inventory's classes, and `verificationStatus` conventions.
- **From SAVE-004:** resolution of extension token-relay state (guardrail #5 vs. live listener in `content-script.js`).
- **From owner/counsel:** vendor contracts (Google Cloud/Gemini API terms incl. training-use exclusions and DPA, OpenAI API terms + DPA, ElevenLabs, MiniMax, Stripe, GoatCounter), production-only unknowns flagged throughout, and decisions on every counsel-packet question.

*End of inventory. Companion document: `docs/hardening/counsel-review-packet.md`.*
