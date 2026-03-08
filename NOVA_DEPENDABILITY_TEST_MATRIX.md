# Nova Dependability Test Matrix

## Purpose

Validate that the canonical Nova flow is reliable across the highest-value user journeys:

`NovaFloat -> NovaVoiceAgent -> useVoiceAgent -> voiceAgent -> appCommands/events -> UI`

## Status legend

- `[ ]` Not verified
- `[~]` Partially verified / code-path confidence only
- `[x]` Verified by code inspection/build signal
- `[!]` Known risk / needs focused manual test

---

## A. Core assistant shell

### A1. Nova opens/closes reliably
- [x] Nova is mounted globally in app shell
- [x] Nova close command path exists
- [!] Manual test: open Nova from multiple routes and confirm close is consistent

### A2. Conversation transport works
- [x] `useVoiceAgent` is canonical transport hook
- [x] backend `voiceAgent` endpoint returns `appCommands`
- [!] Manual test: text command and voice command both produce expected UI changes

### A3. Pending command execution is deterministic
- [x] `useVoiceAgent` executes app commands in one central effect
- [!] Manual test: multiple sequential commands do not double-fire or drop

---

## B. Navigation / shell control

### B1. Route navigation
- [x] `navigateApp` -> `navigate` command path exists
- [x] `navigateToCategory` -> `navigate` command path exists
- [!] Manual test: dashboard, all entries, category, briefing, brain-dump navigation via Nova

### B2. Close / back behavior
- [x] `closeEntry` -> `goBack` command exists
- [x] `nova:close` listeners exist on major surfaces
- [!] Manual test: close form, dialog, document viewer, document editor, quick capture, selected entry dialog

### B3. Scroll behavior
- [x] `scrollPage` command exists
- [!] Known risk: nested scroll containers may not behave consistently
- [!] Manual test: scroll on dashboard, all entries, briefing, settings

---

## C. Entry lifecycle

### C1. Open entry form
- [x] `openEntryForm` command exists
- [!] Manual test: category-prefilled create path works from Nova

### C2. Save entry
- [x] backend save path normalized
- [x] `save_entry` live action path exists
- [x] `nova:entries-changed` refresh contract exists
- [!] Manual test: saved entry appears immediately in dashboard and all entries

### C3. Search entries
- [x] search tool returns normalized result + `novaAction`
- [!] Manual test: search results reflect actual matching entries and do not stale

### C4. Update entry
- [x] backend update path normalized
- [x] update live action path exists
- [!] Manual test: updating title/content/category refreshes open and list views correctly

### C5. Delete entry
- [x] backend delete path normalized
- [x] delete live action path exists
- [!] Manual test: delete removes from all list/detail surfaces without stale dialog state

### C6. Open entry by title/id
- [x] backend resolves title to id when needed
- [!] Manual test: ambiguous titles behave predictably

---

## D. Brain dump / capture

### D1. Brain dump start/process/save
- [x] commands exist for start/process/save brain dump
- [!] Manual test: brain dump route auto-start and save category pass-through work correctly

### D2. Quick capture
- [x] quick capture now emits `nova:entries-changed`
- [!] Manual test: quick capture save refreshes dashboard/all entries consistently

### D3. Extension / quick save consistency
- [~] Quick save backend path exists
- [!] Manual test: extension save and app quick capture follow same refresh semantics

---

## E. Settings / mutations

### E1. Theme update
- [x] backend updateTheme normalized
- [!] Manual test: theme changes instantly and persists

### E2. Profile update
- [x] backend updateProfile normalized
- [!] Manual test: profile update persists and lands user in correct settings context

### E3. Notification toggle
- [x] toggleNotification normalized
- [!] Manual test: toggle persists and correct tab stays selected

### E4. Voice settings
- [x] updateVoiceSettings normalized
- [!] Manual test: voice settings persist and do not silently fail

### E5. Export data
- [x] export command path normalized
- [x] settings page listens for `nova:export-data`
- [!] Manual test: export triggers consistently from Nova and settings UI

---

## F. Briefing / intelligence

### F1. Backend briefing contract
- [x] briefing tools use structured `success/data/error`
- [x] NovaBriefing has explicit backend modes: ready/partial/fallback
- [!] Manual test: successful backend run shows `ready` mode

### F2. Partial failure behavior
- [x] partial backend mode supported
- [!] Manual test: simulate partial backend failure and verify honest UI messaging

### F3. Fallback behavior
- [x] fallback mode supported
- [!] Manual test: verify local fallback remains useful when backend unavailable

### F4. Related context quality
- [x] `getRelatedEntries` normalized
- [!] Manual test: returned related entries are relevant and clickable

### F5. Deadlines / activity summary
- [x] `getActivitySummary` and `getUpcomingDeadlines` normalized
- [!] Manual test: outputs align with actual saved/action-item data

---

## G. Memory / reminders / action items

### G1. Remember fact
- [x] normalized memory save action
- [!] Manual test: remembered fact is later recallable

### G2. Recall memories
- [x] normalized recall result
- [!] Manual test: memory recall relevance is acceptable

### G3. Forget memory
- [x] normalized forget action
- [!] Manual test: forgotten memory no longer appears in recall

### G4. Update action item
- [x] normalized update_task action
- [!] Manual test: best-match task selection is correct enough

### G5. Set reminder
- [x] normalized set_reminder action
- [!] Manual test: natural language timing parses correctly for common phrases

---

## H. Error handling / resilience

### H1. Invalid tool args
- [x] centralized validation added
- [!] Manual test: malformed requests fail cleanly without UI corruption

### H2. Tool logging
- [x] tool execution logging added
- [!] Manual verification in backend logs: latency/success/appCommand visible

### H3. Unknown tool handling
- [x] unknown tools fail through shared helper

### H4. Direct-tool briefing path
- [x] direct-tool response now reads `result.data`
- [!] Manual test: briefing client direct calls still return correct text + state

---

## I. Performance / operational risks

### I1. Build health
- [x] production build passes after hardening/modularization work

### I2. Bundle size
- [!] Known risk: `EnhancedDocumentViewer` ~934 kB minified
- [!] Known risk: document/editor/firebase chunks still heavy

### I3. Always-mounted globals
- [~] Code review confidence only
- [!] Manual/runtime profiling recommended for NovaFloat + QuickCaptureOverlay + listeners

---

## Highest-priority manual verification order

1. Nova open/close across routes
2. Navigate / open entry / open form
3. Save / update / delete entry refresh behavior
4. Brain dump start/process/save
5. Quick capture refresh consistency
6. Theme / settings mutation persistence
7. Briefing ready/partial/fallback behavior
8. Reminder + action-item mutation flows
9. Memory recall/forget behavior
10. Scroll and print edge cases

---

## Exit criteria for “dependable enough”

Nova is dependable when:

- one command causes one predictable UI effect
- entry mutations refresh all relevant surfaces consistently
- settings mutations visibly stick
- briefing states are honest and useful
- close/back behavior is consistent across overlays/dialogs
- malformed tool calls fail cleanly
- logs are sufficient to debug unexpected outcomes quickly
