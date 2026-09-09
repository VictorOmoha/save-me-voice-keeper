# Realtime Voice Capture and Nova

Voice Capture, Brain Dump, and the global Nova panel share one app-owned session using `gpt-realtime-2.1` for direct speech-to-speech interaction, `marin` for output, and `gpt-transcribe` for user captions. The model hears audio directly; captions are asynchronous guidance and can differ from what it heard. Semantic turn detection generates replies and supports interruption while speaking. The integration uses the GA API and does not silently fall back to Gemini.

## Flow

1. A signed-in browser creates a WebRTC offer. Microphone access happens only after Start, including the explicit Brain Dump handoff. Typed messages and greetings do not request microphone access.
2. `voiceRealtimeSession` checks Firebase authentication, quotas, and voice entitlement. It loads the owner's memory context and posts SDP plus the server-defined model, instructions, and 30 tools to OpenAI's `/v1/realtime/calls`.
3. The browser receives only the SDP answer, session ID, model name, and expiry. Audio travels between the browser and OpenAI; the permanent API key stays on the server.
4. Completed function calls go to `voiceRealtimeTool`. Every call verifies the conversation owner and expiry, validates the tool, and runs the existing argument validation and user-bound executor. Only successful canonical app commands reach UI callbacks. Client events are untrusted and are not proof that the model requested an operation.
5. End, reset, page exit, account change, connection failure, or app unmount closes the peer, stops tracks and playback, and requests `voiceRealtimeEnd`. Internal navigation and minimizing the panel keep the session running. The server marks an ended session and hangs up the owned provider call. Pending startups are cancelled using the client-generated session ID. Pending writes may still complete; an uncertain result must be checked before retrying.

## Boundaries and storage

- `OPENAI_API_KEY` is required only on Cloud Functions. Model selection is fixed in `functions/src/voiceAgent/realtimeConfig.ts`.
- Continuous mode leaves the mic enabled through replies for barge-in. Manual mode mutes input after one detected turn; changing the preference does not reactivate it.
- `VoiceSessionProvider` owns the only `useVoiceAgent` instance above the routes. Voice Capture, Brain Dump, and the global panel consume that session. Navigation preserves the WebRTC connection, microphone, conversation, input draft, continuous-mode preference, start time, and confirmed save receipts. Minimize hides the panel; End explicitly releases audio. The compact dock is hidden on Voice Capture, which already shows full controls.
- Session state belongs to the signed-in account and is cleared on account change. It is kept in memory, not restored after reload or tab closure. End keeps the visible conversation until reset, account change, or page exit; restarting can seed the recent text history into a new connection. Voice Capture remains the destination after sign-in; first-time service-worker installation does not reload and interrupt that flow.
- Session creation is limited to 4/minute and 24/hour per authenticated principal. Tool calls use the existing voice quotas and are capped at 100/session. Request bodies are capped at 64 KB.
- The client ends sessions after ten minutes; server tool access expires at ten minutes. This is not a hard provider-side billing cutoff: a modified client can keep the audio connection alive up to OpenAI's provider limit. Cleanup requests are best effort on abrupt browser/network exit.
- Tool IDs are atomically claimed before execution in `nova_conversations.processed_calls`. A duplicate returns 409. This prevents repeated writes; it does not guarantee exactly-once completion or replay lost results after a crash.
- `nova_conversations` retains the owner, transport, model, provider call ID, session state/timestamps, processed call IDs, and a bounded caption history submitted when ending. No new collections/subcollections are introduced. Session expiry does not delete stored conversation records.
- SaveMe does not persist raw realtime audio. OpenAI receives audio, conversation context, relevant memory summaries, and tool results. Entry categorization/enrichment and legacy audio transcription still use Google Gemini. Brain Dump uses the shared OpenAI voice session while its manual draft processing retains existing enrichment. Explicit remember/save tools retain their existing behavior; realtime captions do not trigger the legacy per-turn silent extraction loop or a second client-side command parser.
- Legacy `voiceAgent` remains deployed for older clients and briefing integrations. All current conversational voice views use only the new realtime endpoints.

## Validation

Regression coverage includes authentication, session ownership/expiry, duplicate writes, cancellation during connection, late microphone permissions, continuous/manual behavior, captions, tool success/failure, and blocked playback. A live synthetic OpenAI test verified the model, caption model, voice, session schema, all 30 tool declarations, and generated speech.

A headless Edge browser also verified actual audio input over WebRTC, GPT-Transcribe captions, spoken responses, authenticated `getRecentEntries` execution, and server hangup. This used a disposable Firebase test account and a generated speech fixture; the account and conversation were removed afterward. The September 8 release passed 131 frontend and 110 functions tests.

On September 9, the unified-session browser check exercised real generated speech and a navigation request, continued through Dashboard and Brain Dump, saved a disposable memory, and returned to Voice Capture. Diagnostics showed one peer connection and one microphone acquisition throughout, retained captions and a confirmed save receipt, and stopped tracks plus a closed peer after End. The disposable account, saved entry, and conversation were deleted. The 390px layout had no horizontal overflow. Provider/controller regression tests also cover route changes, duplicate/failed commands, reset, account changes, and page exit. See [the UI/UX change record](unified-voice-ux-2026-09-09.md) for validation and limits.

Official references checked on 2026-09-08: [model](https://developers.openai.com/api/docs/models/gpt-realtime-2.1), [WebRTC](https://developers.openai.com/api/docs/guides/realtime-webrtc), [call configuration](https://developers.openai.com/api/reference/resources/realtime/subresources/calls/methods/create), [conversations and tools](https://developers.openai.com/api/docs/guides/realtime-conversations).
