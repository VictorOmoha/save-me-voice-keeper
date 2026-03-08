# Canonical Nova Architecture

## Canonical Live Path
The app's active Nova path is:

`NovaFloat -> NovaVoiceAgent -> useVoiceAgent -> Firebase voiceAgent -> appCommands / novaAction events -> page/UI updates`

## Canonical Principles
1. **NovaFloat is the only global assistant shell**
   - lives in `src/App.tsx`
   - owns open/minimize/close state
   - routes Nova callbacks into navigation and UI events

2. **NovaVoiceAgent is the canonical conversational interface**
   - text + voice interaction
   - live action feed
   - continuous listening state

3. **useVoiceAgent is the canonical client orchestration hook**
   - sends text/audio to backend
   - receives `actionsExecuted` + `appCommands`
   - executes frontend callbacks provided by NovaFloat

4. **Firebase `voiceAgent` is the canonical backend agent**
   - tool calling
   - memory access
   - category intelligence
   - reminders / actions / briefings / retrieval

5. **Pages should react to Nova through stable events/callbacks only**
   - `nova:close`
   - `nova:entries-changed`
   - `nova:settings-updated`
   - app route callbacks from NovaFloat

## Non-Canonical / Legacy Systems
These exist in repo but are not the primary live path:
- `VoiceCommandContext`
- `VoiceCommandGlobalListener`
- `DashboardVoiceListener`
- older command-router / sequencer-driven page listeners
- older dashboard-embedded voice execution logic

## Rule Going Forward
- Do not add new voice features to legacy listeners.
- New agent behavior must go through the canonical Nova path.
- Legacy systems should either be:
  - migrated into the canonical path, or
  - isolated and removed once replacements are confirmed.

## Phase 1 Goals
- Consolidate around canonical Nova path
- Ensure all pages respond consistently to Nova close/update actions
- Remove ambiguity about which voice system is active
- Prepare for Phase 2: visible intelligence surfaces
