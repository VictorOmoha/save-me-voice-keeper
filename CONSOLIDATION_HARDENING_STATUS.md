# SaveMe Consolidation / Hardening Status

## Canonical assistant architecture

The only supported assistant path is:

`NovaFloat -> NovaVoiceAgent -> useVoiceAgent -> Firebase voiceAgent -> appCommands/events`

## Legacy voice surfaces still present

These are legacy/non-canonical and should not receive new product work:

- `src/contexts/VoiceCommandContext.tsx`
- `src/components/DashboardVoiceListener.tsx`
- `src/components/VoiceCommandGlobalListener.tsx`
- `src/components/VoiceControlModal.tsx`
- `src/utils/voiceCommandProcessor.ts`
- `src/utils/speechRecognitionSetup.ts`
- `src/utils/nlp/*`

## Important nuance

Some browser speech-recognition code is still used by non-canonical capture/diagnostic flows, especially brain-dump capture and diagnostics. That code should be treated as transitional utility code, not assistant orchestration.

## Hardening changes completed so far

- Added architectural boundary docs to Nova shell and voiceAgent contract
- Tightened appCommand filtering to successful canonical commands only
- Unified quick capture with `nova:entries-changed` refresh event
- Marked legacy voice/control files more explicitly as deprecated
- Added runtime warning if legacy `VoiceCommandContext` path is invoked

## Next recommended work

1. Split `functions/src/index.ts` into smaller modules
2. Normalize tool result schemas more deeply
3. Harden NovaBriefing backend/frontend contracts
4. Remove dead legacy voice UI if confirmed unused
5. Add smoke-test checklist for canonical Nova actions
