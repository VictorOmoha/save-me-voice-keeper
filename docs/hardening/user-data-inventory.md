# SAVE-001 — User-Data Inventory and Deletion/Export Contract

**Ticket:** SAVE-001 (M0 Foundation Sprint) · **Tracking:** GitHub issue #11
**Baseline:** `main @ 569225b68333d165a942dbd7f258cccc3413ca45`
**Author:** Atlas Backend (Omoha Solutions) · **Evidence date:** 2026-08-07
**Method:** **Static source-only verification** of the repository at the baseline commit. No production systems, live data, or deployed configurations were accessed. Anything that can only be verified against production is marked **unknown**.

> **Contract status.** Victor approved D-003 on 2026-08-10. Subscription cancellation and account deletion are separate; deletion requires recent authentication, revokes agent and scheduled access first, runs an asynchronous manifest-driven purge, and deletes the Auth identity last. Export means a portable archive containing versioned JSON, original files, checksums, schema metadata, and a human-readable index—not a restorable backup. Application-data purge must complete as soon as practical and no later than 30 days; narrowly documented legal, billing, fraud, security, and deletion-receipt exceptions may remain. Generated export archives expire after 7 days. This M0 artifact ratifies the contract but does not implement production deletion or export.

---

## 1. How to read this inventory

One row per **data class**. Columns:

- **Location** — Firestore collection / Storage prefix / browser store.
- **CRUD code paths** — the exact files that create / read / update / delete it at baseline.
- **Owner selector** — how a record is bound to a user. Value is one of the closed enum `field:user_id` · `docIdEqualsUid` · `serverOnly` · `publicRead` · `publicCreate`, chosen to **textually match the rule predicate** in `firestore.rules`.
- **Derived / cascading records** — records that reference or are generated from this class.
- **Export (PROPOSED)** — proposed export representation.
- **Delete (PROPOSED)** — proposed delete action and relative order.
- **Retention / exceptions** — claimed vs. evidenced.
- **Processor exposure** — which external processors see this data (aligns with SAVE-002 classes A–I).
- **Confidence** — `verified-in-source` or `unknown` (production-only).

**Owner-selector enum** (closed — used verbatim in `user-data-manifest.json`):

| Value | Meaning | Matching rule predicate |
|---|---|---|
| `field:user_id` | Ownership asserted by a `user_id` document field compared to `request.auth.uid` | `resource.data.user_id == request.auth.uid` |
| `docIdEqualsUid` | Document ID equals the user's UID | `isOwner(userId)` / `docId == request.auth.uid` |
| `serverOnly` | No direct client access; reachable only via Cloud Functions (Admin SDK) | `allow write: if false` / no client path |
| `publicRead` | Readable by anyone (signed-in or anonymous) with no owner check | `allow read: if true` or `if isSignedIn()` with no owner predicate |
| `publicCreate` | Creatable by anyone (including unauthenticated) | `allow create: if true` |

**Data classes (aligned with SAVE-002 / Covenant Privacy A–I):** A transient audio · B transcripts/text captures · C entries · D conversation history · E derived intelligence · F agent-accessible memory · G account & billing · H telemetry & logs · I credentials & BYOK.

---

## 2. Firestore collections (matched in `firestore.rules`)

Every collection below is matched by an explicit `match` block in `firestore.rules` at baseline, or falls under the terminal `match /{document=**} { allow read, write: if false; }` catch-all.

| Collection | Owner selector | CRUD code paths (source) | Derived / cascading records | Export (PROPOSED) | Delete (PROPOSED) | Retention / exceptions | Processor exposure | Confidence |
|---|---|---|---|---|---|---|---|---|
| `entries` | `field:user_id` | C: `functions/src/quickSave/functions.ts` (add), `src/hooks/useSavedEntries.ts`, `src/hooks/useOfflineSync.ts`, `src/pages/*`; R: same + `functions/src/entryIntelligence/functions.ts`; U: `useSavedEntries.ts`; D: `useDashboard.ts` → `deleteEntry` | `entry_entities`, `entry_links`, `action_items`, `entity_graph`, mirrored `shared_memories`, Storage objects `documents/{uid}/{entryId}/*`, `images/{uid}/*` | Full doc incl. `fields`, `field_definitions`, `category`, timestamps; plus resolved Storage object references | Delete doc; cascade-delete derived rows and Storage objects; recompute `entity_graph` | Retention "forever" in code; policy promises unbacked | C → Gemini (enrichment), OpenAI (brain-dump), webhooks/Zapier (client) | verified-in-source |
| `action_items` | `field:user_id` | C: `functions/src/entryIntelligence/functions.ts` (add); R/U/D: client per rules | `entries` (source), `reminders` (via `action_item_id`) | Full doc | Delete with owning entry or standalone | forever | E → Gemini | verified-in-source |
| `nova_memories` | `field:user_id` | C/U: server-only (`functions/src/voiceAgent/memory.ts`, `functions/src/voiceTools/memory.ts`); R: client (`src/components/settings/NovaMemorySettings.tsx`); **soft-delete only** (`active:false`); **no purge** | mirrored into `shared_memories` (agent-readable copy) | Full doc incl. `active` flag | **Hard purge required** (PROPOSAL); also retract mirrored `shared_memories` copy | soft-delete ≠ deletion; policy "permanently removed" unbacked | F → Gemini (extraction); third-party agents via mirror | verified-in-source |
| `nova_conversations` | `field:user_id` | C/U: server-only (`functions/src/voiceAgent/functions.ts`); R: client | tool-call records reference `entries`, `reminders` | Full turns array | Delete all docs for user | forever | D → Gemini | verified-in-source |
| `nova_user_profile` | `docIdEqualsUid` | C/U: server-only (`functions/src/voiceAgent/memory.ts`); R: client (`isOwner`) | — | Full doc | Delete doc | forever | F → Gemini | verified-in-source |
| `entry_links` | `field:user_id` | C: server-only (`entryIntelligence/functions.ts`); R: client | `entries` (source/target) | Full doc | Delete with either endpoint entry | forever | E → Gemini | verified-in-source |
| `entry_entities` | `field:user_id` | C: server-only (`entryIntelligence/functions.ts`); R: client | `entries`, `entity_graph`; **contains 200-char content snippets** | Full doc | Delete with owning entry | forever; snippet copies of entry content | E → Gemini | verified-in-source |
| `entity_graph` | `field:user_id` | C/U: server-only (`entryIntelligence/functions.ts`); R: client | aggregated from `entry_entities` | Full doc | Recompute/delete on entry delete | forever | E → Gemini | verified-in-source |
| `user_patterns` | `field:user_id` | C/U: server-only (`entryIntelligence/functions.ts` `analyzePatterns`); R: client | derived from `entries` | Full doc | Delete | forever | E → Gemini | verified-in-source |
| `user_category_patterns` | `field:user_id` | C/U: server-only (`entryIntelligence/categoryIntelligence.ts`); R: client | derived from `entries` | Full doc | Delete | forever | E → Gemini | verified-in-source |
| `reminders` | `field:user_id` | C: client (`src/services/taskReminderService.ts`) + server (`functions/src/voiceTools/intelligence.ts`); R: client; U/D: server-only (`allow update, delete: if false`) | `pending_notifications` (on trigger), `entries` | Full doc | Delete doc | forever; `status` flips pending→sent by scheduler | — | verified-in-source |
| `pending_notifications` | `field:user_id` | C: server-only (`checkReminders`, `novaInsights`); R: client; U: client **only `status`→`dismissed`** (rules-constrained); D: server-only | `reminders`, `entries` | Full doc | Delete doc | forever | H (insights text) → Gemini | verified-in-source |
| `users` | `docIdEqualsUid` | C/U: `src/hooks/useAuthState.ts` (client), `functions/src/billing/functions.ts` (server); R: client listener | Firebase Auth identity; Stripe customer | `stripeCustomerId`, `subscriptionStatus`, `subscriptionTier`, profile fields | Delete doc; cancel Stripe subscription; delete Auth user | **7-year billing-record exception (claimed, unverified)**; Stripe-side retention governed by Stripe | G → Stripe, Firebase Auth | verified-in-source |
| `profiles` | `docIdEqualsUid` | C/U: `src/components/settings/ProfileSettings.tsx`; R: client | — | Full doc | Delete doc | forever | G | verified-in-source |
| `user_preferences` | `docIdEqualsUid` | C/U: `src/hooks/useUserPreferences.ts`, `functions/src/voiceTools/settings.ts`; R: client | — | Full doc **excluding `elevenlabs_api_key` plaintext** (see I) | Delete doc; scrub BYOK key | forever | G, I (BYOK ElevenLabs key stored here) | verified-in-source |
| `search_preferences` | `docIdEqualsUid` | C/U: `src/services/searchAnalytics.ts`; R: client | — | Full doc | Delete doc | forever | G | verified-in-source |
| `api_keys` | `field:user_id` | C: server-only (`functions/src/sharedMemory/functions.ts` `sharedMemoryCreateAgentKey`); R: client; **U/D: denied by rules** (`allow create, update, delete: if false`) → **client revocation broken** | grants access to `shared_memories`; legacy global `AGENT_API_KEY` (env) bypasses per-user isolation under pseudo-user `nia-openclaw-agent` | Metadata only (`id`, `name`, `key_prefix`, `permissions`, `is_active`, timestamps) — **never export `key_hash`** | **Revocation path must be added** (D-003 approved; first deletion action); delete doc; revoke legacy key | forever; no revocation today | I | verified-in-source |
| `shared_memories` | `field:user_id` | C/U: server-only via Cloud Functions (`functions/src/sharedMemory/*`) gated by `sm_` key or Firebase session; R: client + third-party agents | mirrored from `nova_memories`; legacy `AGENT_API_KEY` writes under pseudo-user | Full doc | Delete doc; retract on memory forget | forever | F → third-party AI agents (OpenClaw/Nia, Hermes, Claude, Codex, Cursor, custom) | verified-in-source |
| `storage_usage` | `field:user_id` + `docId` | C/U/D: server-only; R: client (`src/hooks/useStorageStats.ts`) requires both `docId == uid` and `user_id == uid` | derived from Storage objects | Full doc | Delete doc | forever | G | verified-in-source |
| `search_analytics` | `field:user_id` | C: client (`src/services/searchAnalytics.ts`); R: client; U/D: denied | — | Full doc | Delete doc | forever | H | verified-in-source |
| `webhook_events` | `field:user_id` | C: client (`src/services/webhookService.ts`); R: client; U/D: denied | payload embeds full entry object (C) | Full doc | Delete doc | forever | H, C → user-configured webhook URLs | verified-in-source |
| `support_tickets` | `field:user_id` | C: client (`src/components/settings/EnhancedHelpSupportSettings.tsx`); R: client; U/D: denied | — | Full doc | Delete doc | forever | G | verified-in-source |
| `public_demo_videos` | `publicRead` | C/U/D: none in source (`allow write: if false`); R: **anyone** (`allow read: if true`) | — | n/a (not user-owned) | n/a (not user-owned) | n/a | — | verified-in-source |
| `demo_videos` | `publicRead` (signed-in) | C/U/D: `src/components/admin/VideoUpload.tsx` attempts client writes (likely fail; rules `allow write: if false`, admin-only intended server-side); R: **any signed-in user** (`allow read: if isSignedIn()`, **no owner predicate**) | Storage objects `demo-videos/*` | n/a (not user-owned) | n/a (not user-owned) | n/a | — | verified-in-source |
| `waiting_list` | `publicCreate` | C: **anyone** (`allow create: if true`); R/U/D: denied | — | n/a (not user-owned) | n/a | n/a | — | verified-in-source |
| `user_roles` | *(no rule match)* | R: `src/pages/Settings.tsx` (`doc(db, 'user_roles', uid)`) — **falls under catch-all `allow read, write: if false`** → read will fail at runtime | — | n/a | n/a | n/a | G | **unknown** (no rule match; behavior is deny-by-default) |

---

## 3. Non-Firestore user-linked data

| Store | Owner selector | Code path | Notes | Confidence |
|---|---|---|---|---|
| **Firebase Auth identity** (`uid`, email, displayName, provider) | `serverOnly` | `src/hooks/useAuthState.ts`, `functions/src/billing/functions.ts` | Source of truth for `uid`; deletion must call `admin.auth().deleteUser(uid)` | verified-in-source |
| **Stripe linkage** (`stripeCustomerId`, `subscriptionId`, `subscriptionStatus`, `subscriptionTier`) | `field:user_id` (mirrored on `users`) | `functions/src/billing/functions.ts` | No card data touches SaveMe servers (Stripe-hosted checkout). Deletion must cancel subscription + delete Stripe customer | verified-in-source |
| **Cloud Storage** — `images/{uid}/*` | `field:user_id` (path-derived) | `src/components/forms/ImageUpload.tsx` | **No `storage.rules` exists at baseline — UNKNOWN**; objects referenced from `entries.fields` | **unknown** (no rules file) |
| **Cloud Storage** — `documents/{uid}/{entryId}/*` | `field:user_id` (path-derived) | `src/utils/documentStorage.ts`, `src/components/documents/DocumentEditor.tsx` | Orphaned on entry delete today | **unknown** (no rules file) |
| **Cloud Storage** — `demo-videos/*` | `serverOnly` (intended) | `src/components/admin/VideoUpload.tsx` | Admin demo assets; not user-owned | verified-in-source |
| **Browser IndexedDB** `saveme-offline` → `cached_entries`, `offline_queue` | device-local | `src/utils/offlineStorage.ts` | Holds full entry copies client-side; cleared only by user action | verified-in-source |
| **Browser localStorage** — `savedWebhookConfigs`, `zapierWebhookUrl`, `nova_session_id`, `saveme_demo_entries`, `speech_*`, `selected_*`, `voice_audio_cue_*`, `continuous_listening`, `auto_speak` | device-local | various `src/` files | Webhook URLs and session pointers; not content-bearing except `saveme_demo_entries` | verified-in-source |
| **Extension `chrome.storage.local`** — `authToken`, `authTokenExpiry` | device-local | `browser-extension/background.js`, `content-script.js` | **Legacy window-event token relay** (`saveme:auth-token`); SAVE-004 owns redesign; token must be revoked on account deletion | verified-in-source |
| **Cloud Logging** (transcript snippets ≤200 chars, userIds, raw tool args, untruncated Gemini insight output) | `serverOnly` | `functions/src/*` (`console.log/console.error`) | Content-bearing logs; no scrubbing at baseline; retention per GCP log policy **[UNKNOWN — production-only]** | verified-in-source (that logging occurs) / unknown (retention) |
| **GA4 / GoatCounter telemetry** | device / pseudonymous | `index.html`, `src/` analytics helpers | No user ID set; event names + bounded params only | verified-in-source |

---

## 4. Scheduled jobs touching user data

| Job | Schedule | Collection(s) touched | Code path |
|---|---|---|---|
| `checkReminders` | every 15 min | reads `reminders` (status=pending, trigger_at<=now), writes `pending_notifications`, updates `reminders` | `functions/src/entryIntelligence/functions.ts` |
| `analyzePatterns` | every 24 h | reads `entries`, writes `user_patterns` | `functions/src/entryIntelligence/functions.ts` |
| `novaInsights` | daily | reads `entries`, writes `pending_notifications` | `functions/src/entryIntelligence/functions.ts` |

---

## 5. Cross-cutting deletion/export observations (input to D-003)

These are **verified-in-source** gaps that any deletion/export contract must resolve. They are restated as proposals, not commitments.

1. **No account-deletion pipeline exists.** The UI (`EnhancedDataManagementSettings.tsx`) shows a "contact support" toast and logs the user out. No server endpoint deletes Auth user, Firestore docs, or Storage objects.
2. **Entry deletion orphans derived data.** `useDashboard.deleteEntry` deletes only the `entries` doc. `entity_graph`, `entry_entities` (incl. 200-char content snippets), `entry_links`, `action_items`, and mirrored `shared_memories` are left behind.
3. **Memory deletion is soft-delete only.** `nova_memories` uses `active:false`; there is no purge path. `forgetMemory` does not retract the agent-readable `shared_memories` mirror.
4. **Agent-key revocation is broken.** Rules deny client `delete` on `api_keys`; there is no server revocation endpoint. The UI's "revoke" (`ApiKeysSettings.tsx` `deleteDoc`) will fail. Legacy global `AGENT_API_KEY` has no per-user isolation or rotation path.
5. **`triggerExport` is referenced by the client but absent from `functions/src/index.ts` exports.** Server-side export likely 404s. Client-side export covers only `entries`, `sharedMemories`, `preferences`, `apiKeys` metadata, and only as JSON (policy claims JSON/CSV/PDF/DOCX).
6. **No `storage.rules` at baseline.** Storage object access control and deletion behavior cannot be verified from source.
7. **Retention is "forever" everywhere in code.** All numeric retention promises (30-day deletion, 90-day backups, 7-year billing) have no implementing mechanism.

---

## 6. Read-access notes (what could NOT be verified from source)

- **Production Firestore contents, indexes-in-use, and actual data volume** — production-only.
- **Cloud Storage rules and object inventory** — no `storage.rules` at baseline; object existence is production-only.
- **Firebase Auth user records and custom claims** — production-only.
- **Stripe live mode, price IDs, and webhook endpoint configuration** — production-only.
- **Cloud Logging retention and log-based metrics** — production/contract-only.
- **Gemini/OpenAI/ElevenLabs/MiniMax API tier, training-use exclusion, and vendor retention terms** — contract-only.
- **`user_roles` runtime behavior** — referenced in source but has no rules match; actual production behavior is deny-by-default at the rules layer.

---

*End of inventory. Machine-readable companion: `docs/hardening/user-data-manifest.json`. Validator: `scripts/validate-user-data-manifest.mjs`.*
