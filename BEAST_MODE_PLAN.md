# SaveMe.Space — Beast Mode Plan

## Core Product Definition
SaveMe.Space becomes an **agentic personal memory OS**:
- capture anything fast
- understand it automatically
- connect it to context
- surface what matters proactively
- let Nova act naturally across the app

## Product Pillars

### 1. Capture
- Voice-first capture via Nova
- Quick capture overlay
- Brain dump mode
- Browser extension quick save
- Manual structured forms
- Document import/create/edit

### 2. Intelligence
- Entity extraction
- Related entry graph
- Action-item extraction
- Memory profile + recall
- Category prediction + learning
- Daily proactive insights
- Briefings / contextual synthesis

### 3. Agentic UX
- One canonical Nova orchestration layer
- Natural app control
- Live action feedback
- Follow-up handling
- Reliable command routing
- Interrupt / cancel / resume support

### 4. Reliability
- Offline support
- PWA installability
- Stable sync model
- Clear error states
- Robust settings/config validation

### 5. Power User Surface
- Global shortcuts
- Fast search / semantic retrieval
- Printing / export / sharing
- Activity dashboard
- Notifications and reminders

## Current Strategic Problems
1. Voice architecture is fragmented
2. Canonical Nova flow is not fully consolidated
3. Intelligence features exist but are not fully surfaced end-to-end
4. Product surface is broad but not yet unified
5. Performance needs targeted tightening

## Transformation Priorities

### Phase 1 — Unify the Agent Core
Goal: make Nova the single canonical interaction layer.
- Audit and consolidate voice systems
- Decide canonical entry flow for agent actions
- Connect NovaFloat/NovaVoiceAgent/NovaLiveAction cleanly
- Ensure navigation, create, open, delete, brain dump, print all work through one path
- Remove or isolate stale voice paths

### Phase 2 — Make Intelligence Visible
Goal: intelligence must be felt, not just exist in backend.
- Surface related entries everywhere relevant
- Show extracted action items and deadlines in UI
- Add memory/insight surfaces to dashboard/settings
- Improve briefing and activity views
- Connect notifications to actionable UX

### Phase 3 — Build the Agentic Memory OS
Goal: turn vault into operating system.
- Semantic search as first-class experience
- Unified timeline/activity dashboard
- “Ask Nova” contextual workspace actions
- Smart follow-up suggestions
- Per-entry intelligence cards
- Daily briefing / digest experience

### Phase 4 — Make It Production-Hard
Goal: performance and reliability.
- Reduce heavy bundles
- Validate service worker/offline flows
- Harden env/config checks
- Improve extension auth/save resilience
- Add smoke tests for canonical flows

## Immediate Build Tracks

### Track A — Architecture cleanup
- map active vs stale voice components
- wire one canonical orchestration route
- remove duplicated command handling

### Track B — UI intelligence
- dashboard intelligence panel
- entry related-items panel
- reminders/deadlines surface
- activity overview improvements

### Track C — Nova experience
- stronger floating assistant UX
- response/action history
- pending tasks / suggestions
- better state transitions

### Track D — Platform hardening
- config guardrails
- extension reliability
- build/chunk improvements
- deployment sanity checks

## Definition of Beast
The app should feel like:
- Not a note app
- Not just a vault
- Not just voice chat
- A personal AI operating system that remembers, organizes, connects, and prompts action

## Execution Principle
Do not add random features.
Consolidate around the identity:
**Capture -> Understand -> Connect -> Act -> Surface proactively**
