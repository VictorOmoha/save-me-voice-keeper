# SaveMe UI/UX and unified voice — September 9, 2026

The dark/cyan identity is consistent, but the original dashboard gave competing actions similar prominence and kept the first-memory tutorial visible for returning users. Voice Capture looked like a separate assistant because its large microphone coexisted with the floating microphone. This also reflected a functional split: page/panel-owned clients ended on unmount, and Brain Dump used a separate recorder.

## Changes by flow step

1. **Dashboard — improved hierarchy.** Talk to Nova is the primary action; existing users see a compact prompt and recent entries before statistics and secondary tools. The reminder form is collapsed. Desktop uses the header search; mobile has a full-width search field. Category tiles are keyboard-operable buttons.
2. **Voice Capture — clearer state.** A smaller, top-aligned workspace shows the conversation and confirmed saves. Empty save slots are replaced with explanatory text. The breadcrumb identifies the actual page. The static online badge and duplicate floating microphone are removed.
3. **Navigate and continue — verified.** One account-scoped provider owns the realtime client above the routes. Voice Capture, Brain Dump, and the Nova panel share the same connection, microphone, history, input draft, continuous-mode preference, start time, and save receipts. Only successful server-returned commands trigger app actions. Brain Dump no longer parses captions into a second set of commands or plays separate TTS acknowledgments.
4. **Minimize or end — verified.** Minimize keeps the conversation active with a visible microphone indicator and End control. End stops tracks, closes the peer, and requests server hangup. Escape minimizes and returns focus. Reload, tab closure, account change, and reset end the session; account change clears the previous user's in-memory state.

## Verification

- Release checks passed: 134 frontend tests across 32 files; the five provider tests passed again after the final back-navigation adjustment. App/build-config TypeScript checks, full ESLint, production Vite build, and whitespace checks passed. The build retains the existing large document-viewer chunk warning.
- Automated provider tests use the actual voice hook and realtime controller with stubbed WebRTC and authenticated HTTP responses. They exercise canonical navigation, retained history/draft/start time, confirmed save receipts, failed and duplicate commands, Brain Dump continuity, explicit End, reset, account changes, and page exit.
- A browser session used the actual app with a disposable Firebase account, production realtime endpoints, and generated speech supplied through a local-only microphone fixture. Nova transcribed and answered the speech; a navigation request continued into Dashboard and Brain Dump. A test memory saved from Dashboard remained in the returned Voice Capture transcript and receipt panel.
- Diagnostics recorded one peer connection and one microphone acquisition throughout navigation. Session creation, navigation/save tools, and End returned HTTP 200. End left the peer closed and the audio track ended. No window errors were recorded. Test identity and stored test data were removed.
- At 390px wide, the dashboard dock and expanded conversation fit without horizontal overflow. Desktop captures were checked at 1786px wide. The final small label, privacy-copy, search-width, and elapsed-time adjustments followed the live audio run and are covered by release checks.

## Limits and follow-up

This verifies continuity within the running single-page app, not across reloads or new tabs. Network interruption, Safari/iOS microphone behavior, real-phone audio/noise conditions, and full screen-reader/contrast/reduced-motion compliance need separate checks. The existing ten-minute client session limit remains; this change does not add a hard provider-side spending cutoff.

The UI is clearer for beta use. A later design pass can further reduce the dashboard's secondary intelligence panels and clarify when users should use Brain Dump's structured draft editor versus the general Nova conversation.

Local visual evidence and before/after notes are in `.firebase/unified-voice-audit/report.md` (not deployed). No backend endpoint, database schema, or permission-rule changes are part of this release.
