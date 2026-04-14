# SaveMe Shared Memory V1 Implementation Plan

## Purpose
This document turns the shared human + agent memory idea into concrete implementation work for SaveMe.

It is the next layer after `shared-memory-for-humans-and-agents.md`.

This document covers:
- Firestore indexes for `shared_memories`
- API and callable-function design for create/search/update
- first OpenClaw adapter implementation shape
- rollout order

---

## Current codebase reality

### What exists now
The current SaveMe backend already has:
- `nova_memories` in Firestore
- `functions/src/voiceTools/memory.ts`
- `rebuildMemoryProfile()` and Nova-specific memory flows

### Why not reuse that directly
`nova_memories` is useful, but it is too narrow for the larger product direction.

Current `nova_memories` is optimized for:
- Nova voice memory
- inferred facts and recall
- lightweight assistant profile rebuilding

The new shared memory system must support:
- humans
- OpenClaw
- Hermes
- future agents
- multiple memory types
- verification states
- visibility controls
- broader search and filtering

### Recommendation
Keep current Nova memory behavior intact for compatibility.
Introduce a new collection:
- `shared_memories`

Then gradually bridge or migrate useful patterns into it.

---

## Firestore collection design

### New collection
`shared_memories`

### Document shape
```ts
{
  user_id: string,
  title: string,
  content: string,
  summary?: string,
  type: "preference" | "fact" | "decision" | "task" | "idea" | "summary" | "project_context" | "conversation_memory" | "relationship" | "document_note",
  source: "human" | "openclaw" | "hermes" | "import" | "system",
  source_agent?: string | null,
  created_by: string,
  tags: string[],
  people: string[],
  project?: string | null,
  confidence?: number | null,
  verification: "unverified" | "agent_suggested" | "human_confirmed" | "system_verified",
  visibility: "private" | "shared_with_agents" | "shared_with_selected_agents",
  status: "active" | "archived" | "superseded" | "deleted",
  created_at: Timestamp,
  updated_at: Timestamp,
  last_accessed_at?: Timestamp | null,
  access_count?: number,
  metadata?: {
    conversation_id?: string,
    session_id?: string,
    external_ref?: string,
    related_memory_ids?: string[],
    original_format?: string,
    [key: string]: unknown,
  }
}
```

---

## Firestore indexes for V1

These indexes are the minimum useful set for real-world reads.

### 1. Active memories by user, newest first
Used for:
- recent project context
- recent decisions
- latest agent memory

```json
{
  "collectionGroup": "shared_memories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "user_id", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "updated_at", "order": "DESCENDING" }
  ]
}
```

### 2. Active memories by user and type
Used for:
- preference retrieval
- decision retrieval
- task retrieval

```json
{
  "collectionGroup": "shared_memories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "user_id", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "updated_at", "order": "DESCENDING" }
  ]
}
```

### 3. Active memories by user and project
Used for:
- project continuity
- SaveMe or client-specific context recall

```json
{
  "collectionGroup": "shared_memories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "user_id", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "project", "order": "ASCENDING" },
    { "fieldPath": "updated_at", "order": "DESCENDING" }
  ]
}
```

### 4. Active memories by user and verification state
Used for:
- review inbox
- human-confirmed memory retrieval

```json
{
  "collectionGroup": "shared_memories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "user_id", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "verification", "order": "ASCENDING" },
    { "fieldPath": "updated_at", "order": "DESCENDING" }
  ]
}
```

### 5. Active memories by user and source
Used for:
- see what OpenClaw wrote
- see what Hermes wrote
- audit agent memory

```json
{
  "collectionGroup": "shared_memories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "user_id", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "source", "order": "ASCENDING" },
    { "fieldPath": "updated_at", "order": "DESCENDING" }
  ]
}
```

### 6. Active memories by user and visibility
Used for:
- read only what agents should see

```json
{
  "collectionGroup": "shared_memories",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "user_id", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "visibility", "order": "ASCENDING" },
    { "fieldPath": "updated_at", "order": "DESCENDING" }
  ]
}
```

### Notes
V1 text search can begin with client-side ranking over a recent indexed window.
Full semantic retrieval can come later.

---

## Backend API design

The current Firebase backend is already using HTTPS endpoints and authenticated requests.
For consistency, shared memory should begin there too.

### Recommended v1 endpoints

#### `POST /sharedMemoryCreate`
Create a single memory.

#### `POST /sharedMemoryBatchCreate`
Create multiple memories in one request.
Useful for session summaries or multiple extracted facts.

#### `POST /sharedMemorySearch`
Search memory using query + filters.
Use POST instead of GET for easier structured filter payloads.

#### `POST /sharedMemoryUpdate`
Update a memory by id.

#### `POST /sharedMemoryGet`
Get one memory by id.

#### `POST /sharedMemoryList`
List recent memories with filters and pagination.
Useful for UI and review inboxes.

---

## Request/response shapes

### 1. Create memory

#### Request
```json
{
  "title": "Victor prefers direct answers first",
  "content": "Victor prefers direct answers first, then deeper context only when helpful.",
  "type": "preference",
  "source": "openclaw",
  "sourceAgent": "Nia",
  "createdBy": "openclaw:nia",
  "tags": ["communication", "user_preference"],
  "people": [],
  "project": null,
  "confidence": 0.94,
  "verification": "agent_suggested",
  "visibility": "shared_with_agents",
  "metadata": {
    "session_id": "openclaw-main-2026-04-13"
  }
}
```

#### Response
```json
{
  "ok": true,
  "id": "mem_123"
}
```

### 2. Search memory

#### Request
```json
{
  "query": "brain dump",
  "types": ["decision", "project_context"],
  "project": "SaveMe",
  "verification": ["human_confirmed", "agent_suggested"],
  "sources": ["openclaw", "human"],
  "visibility": ["shared_with_agents"],
  "limit": 10
}
```

#### Response
```json
{
  "ok": true,
  "results": [
    {
      "id": "mem_456",
      "title": "Brain Dump should be the primary activation path",
      "content": "SaveMe should push users into Brain Dump as the fastest first-value flow.",
      "type": "decision",
      "source": "openclaw",
      "source_agent": "Nia",
      "verification": "human_confirmed",
      "project": "SaveMe",
      "confidence": 0.98
    }
  ]
}
```

### 3. Update memory

#### Request
```json
{
  "id": "mem_456",
  "patch": {
    "verification": "human_confirmed",
    "confidence": 1,
    "tags": ["activation", "product_strategy"]
  }
}
```

---

## Search strategy for V1

### Step 1
Query Firestore for a recent filtered window using indexed fields.

### Step 2
Do lightweight in-function ranking by:
- exact title match
- exact content substring match
- partial keyword matches
- preferred boost for `human_confirmed`
- preferred boost for matching `project`
- preferred boost for `preference`, `decision`, `project_context`

### Step 3
Return top N results.

### Why this is enough for V1
This gets shared memory working without waiting on embeddings or vector infra.

Semantic search can be added later with:
- stored embeddings
- external vector store
- or Firestore-adjacent search layer

---

## First OpenClaw adapter design

### Goal
Let OpenClaw read and write durable user memory to SaveMe with minimal coupling.

### Adapter responsibilities
- convert OpenClaw memory objects into SaveMe shared memory schema
- write authenticated memory create/search/update calls
- default source attribution correctly
- avoid junk memory writes

### OpenClaw write policy, V1
OpenClaw should only write:
- user preferences
- important decisions
- durable project context
- important reminders/follow-ups
- useful session summaries

OpenClaw should not write:
- every conversational detail
- speculative low-confidence summaries
- transient filler context

### Default mapping
```ts
{
  source: "openclaw",
  sourceAgent: "Nia",
  createdBy: "openclaw:nia",
  verification: "agent_suggested",
  visibility: "shared_with_agents",
  status: "active"
}
```

### Example adapter interface
```ts
interface SaveMeMemoryAdapter {
  createMemory(input: CreateMemoryInput): Promise<{ id: string }>;
  batchCreate(input: CreateMemoryInput[]): Promise<{ ids: string[] }>;
  searchMemory(input: SearchMemoryInput): Promise<SearchMemoryResult[]>;
  updateMemory(id: string, patch: UpdateMemoryPatch): Promise<void>;
}
```

### Example first OpenClaw operations

#### `storePreference`
Writes:
- communication style
- user preferences
- recurring constraints

#### `storeDecision`
Writes:
- product decisions
- architecture decisions
- business decisions

#### `storeProjectContext`
Writes:
- active project state
- next-step continuity
- key blockers

#### `recallRelevantMemory`
Reads:
- by project
- by type
- by query

---

## Hermes adapter design

Hermes should use the same API shape.
The only difference is source attribution and write policy.

### Default mapping
```ts
{
  source: "hermes",
  sourceAgent: "Hermes",
  createdBy: "hermes",
  verification: "agent_suggested",
  visibility: "shared_with_agents",
  status: "active"
}
```

### Hermes-first writes
- session summaries
- stable user instructions
- active task continuity
- recurring behavior patterns

---

## Function implementation recommendation

### Keep implementation modular
Do not bury shared memory logic directly inside `functions/src/index.ts`.

### Recommended file layout
```txt
functions/src/
  sharedMemory/
    types.ts
    create.ts
    batchCreate.ts
    search.ts
    update.ts
    list.ts
    scoring.ts
    authz.ts
```

### Index entrypoints
Then in `functions/src/index.ts`, export thin wrappers:
- `sharedMemoryCreate`
- `sharedMemoryBatchCreate`
- `sharedMemorySearch`
- `sharedMemoryUpdate`
- `sharedMemoryGet`
- `sharedMemoryList`

This prevents the existing `index.ts` from becoming even harder to maintain.

---

## Auth and access rules, V1

### Human-authenticated frontend
- can create, search, update, archive, and list their own memory

### OpenClaw and Hermes integration
For V1, the cleanest route is one of these:

#### Option A, user-scoped Firebase-authenticated requests
Best if the agent acts on behalf of the signed-in user in first-party contexts.

#### Option B, service-authenticated backend integration
Best for system-to-system integrations later.

### Recommendation
Use **Option A first** for initial first-party integration.
It is simpler and fits the current SaveMe backend pattern.

---

## Rollout sequence

### Phase 1, schema + backend
- add `shared_memories` collection design
- add Firestore indexes
- add create/search/update/list endpoints

### Phase 2, first-party UI
- add simple review/list UI for shared memories
- show source, source agent, type, verification, visibility

### Phase 3, OpenClaw adapter
- implement adapter client
- write/read preferences, decisions, and project context

### Phase 4, Hermes adapter
- implement same API usage pattern for Hermes

### Phase 5, better ranking and semantic retrieval
- add embeddings or vector retrieval
- add relationship linking if needed

---

## Definition of done for V1

V1 is successful when:
- SaveMe can store `shared_memories`
- authenticated clients can create, search, and update them
- OpenClaw can write preferences, decisions, and project context
- OpenClaw can retrieve relevant memory before assisting
- Hermes can do the same through the same interface
- humans can inspect what agents wrote
- agent memory feels useful and trustworthy

---

## Recommended immediate implementation tasks

1. add `shared_memories` indexes to `firestore.indexes.json`
2. scaffold `functions/src/sharedMemory/` module files
3. implement `sharedMemoryCreate`
4. implement `sharedMemorySearch`
5. implement `sharedMemoryUpdate`
6. add minimal internal UI to inspect and review agent-created memories
7. build OpenClaw adapter against those endpoints
