# SaveMe Hardening Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make SaveMe dependable enough for confident internal/test-user use by finishing the Nova consolidation, restoring a clean validation baseline, and removing misleading incomplete product surfaces.

**Architecture:** Keep the canonical assistant path as the only supported live path: `NovaFloat -> NovaVoiceAgent -> useVoiceAgent -> Firebase voiceAgent -> appCommands/events -> UI`. Treat legacy voice/NLP code as deprecated infrastructure unless runtime evidence proves otherwise. Fix validation around the live path first; quarantine or remove dead legacy paths second.

**Tech Stack:** Vite, React, TypeScript, Firebase Hosting, Firebase Cloud Functions, Vitest, ESLint.

---

## Ground truth established before implementation

- Frontend build passes: `npm run build`
- Frontend lint passes: `npm run lint`
- Functions build passes: `cd functions && npm run build`
- Default Vitest suite is failing in legacy NLP tests:
  - `src/utils/tests/categoryMatcher.test.ts`
  - `src/utils/nlp/tests/intentRecognizer.test.ts`
  - `src/utils/nlp/tests/nlpEngine.test.ts`
- Canonical Nova docs already declare legacy overlap as deprecated:
  - `CANONICAL_NOVA_ARCHITECTURE.md`
  - `CONSOLIDATION_HARDENING_STATUS.md`
  - `NOVA_ACTION_AUDIT.md`
  - `NOVA_DEPENDABILITY_TEST_MATRIX.md`

## Execution principles

1. No new feature work on legacy voice listeners.
2. No hiding failures without proving the failing code is truly non-runtime/deprecated.
3. Every change must preserve:
   - `npm run build`
   - `npm run lint`
   - `cd functions && npm run build`
4. Prefer smaller commits grouped by intent:
   - docs/plan
   - legacy quarantine or repair
   - canonical Nova validation additions
   - billing surface cleanup

---

## Task 1: Prove legacy runtime status

**Objective:** Determine whether the failing NLP/voice modules are still part of the live application runtime or are just dead/deprecated code.

**Files:**
- Read: `src/App.tsx`
- Read: `src/contexts/VoiceCommandContext.tsx`
- Read: `src/components/VoiceCommandGlobalListener.tsx`
- Read: `src/components/DashboardVoiceListener.tsx`
- Read: `src/components/VoiceControlModal.tsx`
- Search: `src/**/*.ts*`

**Step 1: Trace runtime mounts/imports**
- Confirm whether `VoiceCommandProvider`, `VoiceCommandGlobalListener`, `DashboardVoiceListener`, `VoiceControlModal`, and `src/utils/nlp/*` are referenced from the current app shell.

**Step 2: Capture evidence in this plan or commit message**
- Record whether each legacy path is:
  - mounted in `App.tsx`
  - imported by active routes/components
  - only present as deprecated code/tests

**Step 3: Decide path**
- If runtime usage exists: fix the failing legacy implementation/tests.
- If no runtime usage exists: quarantine/remove legacy tests from the default validation path and strengthen deprecation boundaries in code/docs.

**Verification:**
- Evidence exists for the decision; no guesswork.

---

## Task 2: Restore a clean default validation baseline

**Objective:** Ensure the repo’s default quality gate reflects the live product, not abandoned subsystems.

**Files:**
- Modify: `vite.config.ts` if Vitest config must explicitly exclude deprecated tests
- Modify: `package.json` if new scripts are needed
- Modify: legacy test files or their placement if quarantine is the right move
- Optionally create: `docs/testing/legacy-voice-tests.md`

**Step 1: Write failing expectation for the chosen path**
- If keeping legacy runtime: run targeted failing tests and keep them as regression tests.
- If deprecating legacy runtime: add a clear test/config boundary so default `npx vitest run` excludes deprecated test folders, while a separate script can still run them intentionally.

**Step 2: Implement the minimal validation change**
- Preferred if deprecated:
  - configure Vitest to exclude `src/utils/nlp/tests/**` and any other dead legacy test folders from default runs
  - add a separate script like `test:legacy-voice` so debt remains visible but non-blocking
- Preferred if live:
  - fix the code, not the tests first

**Step 3: Verify**
Run:
- `npx vitest run`
- any new targeted script such as `npm run test:legacy-voice`

**Expected:**
- Default validation is green and aligned to the live app
- Legacy debt is still intentionally runnable if retained

---

## Task 3: Add canonical Nova regression coverage

**Objective:** Add automated coverage for the live assistant path so cleanup of legacy code does not reduce confidence.

**Files:**
- Create or modify tests near:
  - `src/hooks/useVoiceAgent.ts`
  - `src/components/NovaFloat.tsx`
  - `src/utils/novaBriefingClient.ts`
  - `src/pages/NovaBriefing.tsx`
- Optional create: `src/hooks/tests/useVoiceAgent.test.tsx`
- Optional create: `src/components/tests/NovaFloat.test.tsx`

**Step 1: Identify one high-value live behavior per test**
Candidates:
- `useVoiceAgent` executes one app command once
- `save/update/delete` emits or responds to `nova:entries-changed`
- `NovaFloat` maps `printEntry` payloads safely
- settings update callbacks normalize payloads cleanly

**Step 2: Add minimal focused tests**
- No giant integration harness.
- Cover only the canonical hooks/components that actually ship.

**Step 3: Verify**
Run targeted tests and then the default suite.

**Expected:**
- Confidence moves from docs-only to code-backed for the live path.

---

## Task 4: Clean up misleading billing/product surfaces

**Objective:** Stop presenting fake billing capability as if it is implemented.

**Files:**
- Modify: `src/components/settings/SubscriptionSettings.tsx`
- Search for other billing/upgrade CTAs in `src/**/*.tsx`

**Step 1: Decide UX stance**
- Either hide upgrade/manage billing actions entirely
- Or relabel them clearly as waitlist / coming soon without actionable billing language

**Step 2: Implement minimal honest UI**
- Remove fake processing states where no real checkout exists
- Replace with explicit messaging or a contact/waitlist path

**Step 3: Verify**
- Build passes
- No misleading “processing” path remains without backend support

---

## Task 5: Manual smoke the canonical Nova path

**Objective:** Validate the flows the docs already identify as highest value.

**Files/Surfaces:**
- `src/components/NovaFloat.tsx`
- `src/hooks/useVoiceAgent.ts`
- `src/pages/Dashboard.tsx`
- `src/pages/AllEntries.tsx`
- `src/pages/BrainDump.tsx`
- `src/pages/Settings.tsx`
- `src/pages/NovaBriefing.tsx`

**Checklist:**
1. Open/close Nova across routes
2. Navigate via Nova
3. Open entry form via Nova
4. Save/update/delete entry and confirm refresh behavior
5. Trigger brain-dump start/process/save
6. Trigger settings updates and confirm route/tab behavior
7. Validate briefing states are honest

**Verification:**
- Update `NOVA_DEPENDABILITY_TEST_MATRIX.md` with what was actually verified

---

## Task 6: Commit the branch in clean slices

**Objective:** Turn the current dirty repo into understandable, reviewable changes.

**Suggested commit sequence:**
1. `docs: add SaveMe hardening plan`
2. `test: align default validation with canonical Nova runtime`
3. `test: add canonical Nova regression coverage`
4. `fix: make subscription settings honest about billing status`
5. `docs: update Nova dependability verification`

**Verification:**
- `git status --short` is understandable
- Each commit has one coherent purpose

---

## Immediate execution order

1. Task 1 — prove legacy runtime status
2. Task 2 — restore clean default validation baseline
3. Task 3 — add canonical Nova regression coverage
4. Task 4 — fix misleading billing UI
5. Task 5 — manual smoke + docs update
6. Task 6 — commit slices

## Commands to keep re-running

From repo root:
- `npm run build`
- `npm run lint`
- `npx vitest run`
- `git status --short`

From `functions/`:
- `npm run build`

## Exit criteria

SaveMe is in a materially better state when:
- default build/lint/test gates are green
- those gates reflect the live canonical Nova product, not dead legacy code
- canonical Nova has at least a small automated regression safety net
- billing UI is honest about what is and is not implemented
- dependability docs reflect actual verification, not assumptions
