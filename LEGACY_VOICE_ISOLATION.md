# Legacy Voice Isolation

## Purpose
This document marks the old voice-command stack as **legacy** and non-canonical.

## Canonical Nova path
All new assistant behavior must go through:

`NovaFloat -> NovaVoiceAgent -> useVoiceAgent -> backend voiceAgent -> app commands/events`

## Legacy stack (quarantined)
These files belong to the older local/parser-driven voice architecture:

- `src/contexts/VoiceCommandContext.tsx`
- `src/components/DashboardVoiceListener.tsx`
- `src/components/VoiceCommandGlobalListener.tsx`
- `src/utils/voiceCommandProcessor.ts`
- `src/utils/enhancedVoiceProcessor.ts`
- `src/utils/nlp/commandRouter.ts`
- related parser/sequencer/intent-recognition helpers under `src/utils/nlp/*`

## Rules
1. Do **not** add new features to the legacy stack.
2. Do **not** wire new pages/components to `VoiceCommandContext`.
3. Do **not** extend parser/router logic for new Nova behavior.
4. If a feature is needed, implement it in the canonical Nova path.
5. Legacy code may remain temporarily only for backward compatibility during migration.

## Why
The app previously evolved through multiple voice architectures.
That created overlap, ambiguity, and maintenance drag.

To make SaveMe.Space agentic in a coherent way, Nova must be the single source of truth.

## Migration direction
- Keep legacy stack frozen
- Move any still-needed behavior into canonical Nova path
- Remove legacy listeners/providers once no live surfaces depend on them

## Current status
Legacy stack is **quarantined but not fully removed**.
The active/live architecture is Nova-based.
