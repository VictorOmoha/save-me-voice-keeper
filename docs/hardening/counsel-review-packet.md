# SAVE-002 C2/C3 — Counsel Review Packet

**Ticket:** SAVE-002 deliverables C2 (policy-claim matrix, in `data-flow-inventory.md` §4) and C3 (this packet) · **Tracking:** GitHub issue #11
**Baseline:** `main @ 569225b68333d165a942dbd7f258cccc3413ca45` · **Evidence date:** 2026-08-07
**Prepared by:** Covenant Privacy (AI privacy/data-governance specialist, Omoha Solutions) — **not a licensed attorney; nothing herein is legal advice.**
**Companion evidence:** `docs/hardening/data-flow-inventory.md` (flow register + policy-claim matrix with file-level citations).

---

## 1. Scope of this review request

SaveMe.Space is a voice-first personal knowledge product (web app + PWA + Chrome extension) with: AI transcription and a conversational agent ("Nova"), per-user persistent memory readable/writable by **third-party AI agents** via user-minted API keys, AI-derived intelligence over user content (entities, action items, behavioral patterns, daily insights), Stripe subscriptions, and analytics. The system explicitly solicits and processes **health, finance, contacts, and credential-type user content**.

Current public policies (PRIVACY_POLICY.md / TERMS_OF_SERVICE.md, both v1.0) contain multiple claims that source evidence contradicts (see matrix). This packet asks counsel to resolve the questions below so engineering can align code and policy in M1+.

**What counsel is NOT being asked to do:** review marketing tone, audit security controls, or opine on jurisdictions where Omoha Solutions has no users or establishment. **What we need:** decisions on the questions in §4, in the sequence in §5.

**Jurisdictions assumed for scoping (please correct):** operator US-based (policies print Charlotte, NC); product marketed publicly without geo-restriction; policy text already invokes GDPR and CCPA/CPRA concepts; no EU/UK establishment. No users known in regulated-industry contexts. **Please confirm or adjust this scope first — several questions below depend on it.**

---

## 2. Processor / subprocessor list (for counsel verification)

| Processor | Role (evidenced) | Data categories | Contract/DPA evidence | Confidence |
|---|---|---|---|---|
| Google — Gemini API (`gemini-2.5-flash`) | Transcription; agent conversation; memory extraction; enrichment; patterns; insights; briefings | Audio, transcripts, entries, conversations, personal facts (incl. health/finance), derived data | **None in repo** — which Gemini API terms apply (incl. training-use exclusion, retention) must be confirmed against the actual API key's tier | Confirmed-in-code |
| Google — Cloud Text-to-Speech | Voice responses; TTS proxy; public demo | Response/entry text; demo text; client IP (transient) | None in repo (likely under GCP DPA — confirm ADC/service-account vs API-key path treatment) | Confirmed-in-code |
| Google — Firebase/GCP (Auth, Firestore, Functions, Storage, Analytics→GA4) | Backend, persistence, hosting, analytics | All classes | None in repo (GCP/Firebase DPA — confirm executed) | Confirmed-in-code |
| ElevenLabs | TTS (server proxy) + **user-BYOK direct browser path** | Read-aloud text; user's own EL credential | None in repo | Confirmed-in-code (TTS only) |
| OpenAI (`gpt-4o-mini`) | Brain-dump enhancement | Raw brain-dump text | None in repo (OpenAI API terms/DPA — confirm) | Confirmed-in-code |
| MiniMax (`speech-01-turbo`) | TTS proxy | Read-aloud text | None in repo. **Note:** MiniMax is a China-based provider — cross-border/sensitive-data treatment needs explicit counsel attention | Confirmed-in-code |
| Stripe | Payments | Email, Firebase UID metadata, subscription state | None in repo (Stripe DPA — confirm) | Confirmed-in-code |
| GoatCounter | Pageview analytics (cookieless) | Page paths, referrer, UA, screen | None in repo | Confirmed-in-code |
| Google Analytics 4 (via Firebase Analytics) | Product analytics | Bounded event params; device/app-instance IDs | Covered under Google terms if executed — confirm | Confirmed-in-code |
| User-configured webhooks / Zapier | User-initiated outbound sharing | Full entry content + user email, sent from client | n/a (user-directed) — but disclosure is missing | Confirmed-in-code |
| Third-party AI agents (OpenClaw/Nia, Hermes, Claude, Codex, Cursor, custom) | Read/write user memory via `sm_` keys; legacy shared static key | Entire shared-memory corpus incl. auto-mirrored personal facts | n/a — user-authorized recipients; **but no disclosure, no per-agent scoping enforcement, revocation broken** | Confirmed-in-code |
| Supabase | None evidenced (vestigial scaffold) | — | — | Referenced only |
| Google/Microsoft OAuth | Sign-in (Google only implemented) | Name, email | n/a | Google confirmed; Microsoft referenced only |

---

## 3. Engineering dependencies counsel should know about

These constrain what policy can honestly promise (fix order = M1 planning input):

1. **No account-deletion pipeline exists** (UI is a "contact support" toast). All deletion-window promises are currently unbacked.
2. **Entry deletion orphans derived data** (`entity_graph`, `entry_entities` incl. 200-char content snippets, `entry_links`, `action_items`, mirrored `shared_memories`). Cascade design is Atlas's SAVE-001 dependency.
3. **Memory deletion is soft-delete only** (`active:false`); no purge path; `forgetMemory` does not retract the mirrored agent-readable copy.
4. **Agent-key revocation appears broken** (firestore.rules deny client delete; no server endpoint) and **`visibility` tiers are unenforced** (any read key sees everything, including `"private"`).
5. **Silent memory extraction is a designed behavior** (system prompt instructs non-disclosure) and defaults to agent-shared visibility.
6. **No consent capture anywhere** (signup, voice, analytics); no cookie banner; GoatCounter/GA load unconditionally.
7. **Cloud Logging carries content** (transcript snippets, raw tool args, untruncated Gemini insight output, userIds); production browser console logs full transcripts/webhook payloads.
8. **`triggerExport` Cloud Function is referenced by the client but absent from `functions/src/index.ts` exports** — server-side export may 404; client export is JSON/CSV only vs. promised JSON/CSV/PDF/DOCX.
9. **User's ElevenLabs BYOK key is stored in Firestore plaintext-at-application-layer** (owner-read rules) and round-trips to the client.
10. **Extension stores the user's Firebase ID token in `chrome.storage.local`** (55-min expiry) via a window-event relay whose dispatcher may have been removed (SAVE-004).
11. **Retention is "forever" everywhere in code**; all numeric retention promises (90-day metadata, 30-day deletion, 90-day backups, 7-year billing) have no implementing mechanism.
12. **`demoTts` is unauthenticated** (IP rate-limit only); **`waiting_list` accepts unauthenticated writes** without validation.

---

## 4. Questions for counsel (complete list)

### A. Jurisdiction & applicability
- **A1.** Confirm the jurisdictional scope of this review: US (federal + which states — NC only, or all-state consumer privacy laws e.g. CA/CPRA, VA, CO, CT, TX…?) and whether GDPR/UK GDPR exposure is accepted given open web marketing. Does Omoha Solutions meet any state-law applicability thresholds today, and which thresholds should be monitored (user counts, revenue)?
- **A2.** The product explicitly solicits **health and finance** entries and "credential" fields. Does any sectoral regime (e.g., HIPAA — presumably not covered but confirm the "not a covered entity/BA" posture and whether disclaimers are advisable; GLBA-adjacent; state sensitive-data regimes like Washington My Health My Data) attach to a consumer product that **invites** health/finance content? MHMD-style laws can reach non-HIPAA consumer health data — assess exposure.
- **A3.** Age posture: policy says 18+ flat; ToS says "18 or parental consent"; no age gate exists. Which is intended? If minors-with-consent is kept, what COPPA/age-appropriate-design obligations follow? Recommend a single consistent posture + mechanism.
- **A4.** Biometric/voiceprint laws: audio is transcribed by Google and not stored by SaveMe. Is voice audio here plausibly "biometric" under BIPA-style statutes given no identification purpose? Confirm risk posture and whether the (incorrect) 11Labs framing created any representation risk worth remediating proactively.

### B. Processor & contract decisions
- **B1.** For each processor in §2: confirm which vendor terms/DPA must be executed or verified (GCP/Firebase DPA incl. GA4; **Gemini API terms — paid vs. free tier and their respective training-use and retention terms**; OpenAI API terms + DPA; ElevenLabs; MiniMax; Stripe; GoatCounter). Which, if any, are deal-breakers if unavailable (e.g., MiniMax for sensitive content)?
- **B2.** Policy §11.2 claims SCCs are in place. They are not evidenced. Either obtain/verify the underlying vendor transfer mechanisms and correct the claim's framing (SCCs typically sit inside vendor DPAs, not something Omoha signs directly), or remove/rewrite. Which?
- **B3.** Should the public subprocessor list be maintained as a living page (with change notice) rather than embedded in the policy? Provide required notice mechanics if so.
- **B4.** Is the **user-BYOK ElevenLabs path** properly characterized as the user's own controller-processor relationship (SaveMe merely passing text at user instruction), and what disclosure wording makes that accurate?
- **B5.** Third-party AI agents reading user memory: are these (a) user-authorized recipients (user as controller granting access), (b) Omoha's processors, or (c) something else? The answer drives whether a DPA-like artifact, agent terms of use, or just clear user-facing disclosure is needed. Note the legacy shared-static-key path with no per-user isolation — recommend kill-or-formalize decision.

### C. Lawful basis, consent & disclosure
- **C1.** Given silent memory extraction ("don't tell the user"), special-category solicitation, and per-user behavioral profiling/insights — what lawful bases are defensible per jurisdiction, and where is **explicit consent or just-in-time notice** required (voice processing, memory extraction, agent mirroring, analytics)? Draft requirements; engineering will implement mechanisms.
- **C2.** Is a signup ToS/privacy acceptance mechanism legally required for the contemplated claims (it is currently absent)? What evidence of acceptance should be retained?
- **C3.** Analytics without consent (GA4 + GoatCounter, unconditional): acceptable under which regimes given cookieless/GA4 configurations? Is a consent banner required for EU/UK/any-state exposure, and what must it gate?
- **C4.** The "We will NEVER train AI models on your private data without consent" promise depends on **vendor** training terms (Gemini tier, OpenAI API). What contract evidence must be on file before this sentence may stay public?
- **C5.** AI-specific disclosure laws (e.g., EU AI Act transparency for GenAI interaction; state chatbot-disclosure bills): does a voice assistant that silently stores memories trigger any current or imminent disclosure duty?

### D. Rights handling: deletion, export, correction
- **D1.** Given the deletion gaps (§3 items 1–3), what deletion architecture must exist before the 30-day promises can be made: scope (derived data, logs, backups, vendor-side), exceptions (7-year billing records — confirm the legal basis and exact scope of "billing records"), and verification evidence?
- **D2.** Backup language ("may persist 90 days") vs. "permanently removed within 30 days": ratify a single reconciled statement that matches achievable Firebase backup behavior [Firebase backup/restore capabilities for Firestore to be confirmed by engineering — UNKNOWN].
- **D3.** Export: which formats must be supported to keep the promise (currently JSON/CSV at best; PDF/DOCX claimed)? Is narrowing the promise acceptable, and does tier-gating export (Free = "PDF export only"; landing gates export to Premium) conflict with GDPR portability / state-law access rights (which generally cannot be paywalled)?
- **D4.** Response windows already promised (30 days GDPR / 45 days CCPA): confirm the intake channel (founder's personal email doubles as DPO contact — acceptable?), identity-verification approach, and whether an actual DPO is required or the title should be removed.
- **D5.** Do agent-accessible memories require special handling in access/deletion requests (e.g., copies already pulled by third-party agents are outside our reach — what disclosure covers this)?

### E. Security & breach representations
- **E1.** "MFA available" is false today. Confirm remediation = remove the claim now (not build-first), and advise on any duty to correct given users may have relied on it.
- **E2.** "Encrypted in transit and at rest" is infrastructure-delegated (GCP). Confirm acceptable wording, and whether the ElevenLabs BYOK key's plaintext-in-Firestore storage undermines any "credentials are protected" implication (UI elsewhere claims agent keys "hashed and cannot be recovered" — true only for `sm_` keys).
- **E3.** The 72-hour breach-notification promise (ToS §9.3): confirm it matches obligations Omoha actually has (state laws vary; GDPR 72h runs to authorities), and that a no-mechanism promise is an unacceptable exposure until a breach runbook exists.
- **E4.** Logging: transcript snippets, raw tool args, and untruncated AI outputs in Cloud Logging; userIds in logs. Provide a retention/access standard for content-bearing logs so engineering can set log policies.

### F. Policy document hygiene & public claims
- **F1.** Ratify one canonical policy text (repo `.md` vs. abridged in-app page differ; dates are self-contradictory). Confirm required version-history/notice mechanics for updates.
- **F2.** Immediate correction list (claims contradicted by code — see matrix P1, P4–P8, P13, P16–P17, P24): confirm these should be corrected **now**, ahead of full policy rewrite, and whether any user notice is advisable for the transcription-vendor misstatement.
- **F3.** "No selling, no sharing, no tracking" (extension listing) and "never sell or share your data" (landing): assess against actual flows (analytics to Google, agent sharing as designed feature, user webhooks). Recommend precise replacement language.
- **F4.** Operator identity/location: policies print a Charlotte, NC address while marketing rules say don't mention Charlotte publicly. Confirm what contact/operator details the policy must legally show.
- **F5.** Marketing rule "never overclaim privacy… beyond what is live" exists internally. Advise whether a documented claim-substantiation file (this inventory + matrix) is sufficient process, or what sign-off ritual should gate future public privacy claims.

### G. Governance artifacts to produce in M1+ (advise on shape, not content)
- **G1.** Record of Processing Activities — required for Omoha's posture? If GDPR in scope, yes; confirm and we will generate it from the SAVE-001/002 artifacts.
- **G2.** DPIA (or state-equivalent assessment) for: voice processing, silent memory extraction + agent sharing, behavioral pattern mining, special-category solicitation. Confirm which assessments are mandatory vs. prudent, and the required sign-off.
- **G3.** Agent Terms of Use / API Addendum for third-party agents (memory-as-context-not-commands, verification labels, visibility semantics) — worth formalizing? What liability allocation is achievable?
- **G4.** Data-processing inventory for vendor-side retention (Gemini/OpenAI/EL/MiniMax prompt retention windows) — confirm which vendor attestations counsel needs collected as evidence.

---

## 5. Recommended review sequence

1. **Pass 1 — Stop-the-bleeding (days 1–2):** A1 (scope), F2 (immediate corrections: transcription vendor, MFA, deletion windows), B1-partial (confirm Gemini API tier/terms so the corrected disclosure is accurate). *Output: corrected public claims with owner sign-off.*
2. **Pass 2 — Architecture-bound decisions (days 3–5):** B5 (agent-sharing characterization), C1/C2 (consent & lawful bases — these gate M1 engineering), D1–D3 (deletion/export architecture requirements feeding SAVE-001 implementation).
3. **Pass 3 — Contracts & transfers (week 2):** B1–B4, E4, G-series; vendor evidence collection.
4. **Pass 4 — Full policy rewrite (week 2–3):** F1/F3/F4 + all ratified answers consolidated; new policy drafted from the **stabilized** data-flow inventory, not before.

---

## 6. What this packet deliberately does not do

- No legal conclusions, no compliance verdicts, no invented retention periods or legal bases.
- No policy drafting — drafts follow counsel's decisions on §4, per Pass 4.
- Production-only unknowns are listed as unknowns in the inventory, not guessed.

**Release gate recommendation:** items F2 (immediate corrections) and a counsel answer on C1 (consent for silent memory extraction + agent mirroring) should gate any further public marketing pushes; neither blocks M0 completion since M0 ships no production changes.
