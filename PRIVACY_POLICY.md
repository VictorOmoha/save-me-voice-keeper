# SaveMe Voice Keeper — Privacy Policy

**Status:** Pending legal approval — not effective

**Draft prepared:** 2026-08-11

**Version:** SAVE-103 engineering draft 1

> **Human legal gate:** This engineering draft describes source-evidenced behavior. It is not legal advice or a legal conclusion and must not be published or treated as effective until approved by qualified counsel and the product owner.

The canonical product-facing draft is implemented in `src/pages/PrivacyPolicy.tsx`. It discloses:

- Account, billing, content, derived intelligence, memory, telemetry, credential, browser/offline, and extension data.
- Google Gemini transcription and agent processing; Google Cloud TTS; OpenAI brain-dump enhancement; ElevenLabs and MiniMax TTS; Firebase/Google Cloud; Stripe; GoatCounter; Google Analytics; Google Fonts; browser/OS speech services.
- User-directed sharing with connected agents and webhook/Zapier destinations.
- Automatic memory extraction and shared-memory mirroring, including the current limits of visibility labels and key revocation.
- Current indefinite/no-TTL behavior, provider/configuration unknowns, limited JSON export, unimplemented full portable export, support-directed deletion, and the approved but unimplemented D-003 deletion target.
- HTTPS/TLS and infrastructure encryption without unsupported MFA or absolute security language.
- A legal-review checklist rather than invented statutory conclusions.

## Required legal decisions before an effective policy

Counsel must approve controller/operator identity and contact details; effective date/version; jurisdictions and age threshold; legal bases and sensitive-data posture; statutory notices and request timelines; sale/share/advertising and model-training characterizations; vendor contracts, retention, training exclusions, DPAs and transfer safeguards; retention exceptions; analytics notice/consent; and public address requirements.

## Engineering evidence

This draft is based on `docs/hardening/data-flow-inventory.md`, `docs/hardening/user-data-inventory.md`, `docs/hardening/user-data-manifest.json`, and approved decision `docs/hardening/decisions/d-003-data-rights-contract.md`. Production configuration and contract-only unknowns remain unknown.
