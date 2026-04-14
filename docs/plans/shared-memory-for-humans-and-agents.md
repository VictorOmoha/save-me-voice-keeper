# SaveMe Shared Memory for Humans and Agents

## Status
Draft v1 architecture and product plan

## Why this exists
SaveMe should evolve from a voice-first note and memory app into a shared memory layer for humans and AI systems.

That means a person can save thoughts, tasks, preferences, decisions, and context, while agents like OpenClaw and Hermes can also write and retrieve memory from the same system.

The goal is not just storage.
The goal is durable, searchable, user-controlled memory that works across humans and agents.

---

## Product positioning

### Primary positioning
**SaveMe is memory for you and your AI.**

### One-line pitch
**One shared memory layer for humans, OpenClaw, Hermes, and future AI assistants.**

### Expanded message
SaveMe gives people and AI assistants a shared, searchable, user-owned memory system. It helps users capture what matters, lets agents remember useful context across sessions, and keeps everything editable, inspectable, and under user control.

### What changes
Before:
- voice capture app
- personal memory vault
- second-brain tool

After:
- memory infrastructure for humans and agents
- persistent context layer for AI-native workflows
- shared memory system with human control and agent attribution

---

## Product principles

1. **User-owned memory**
   - the user controls what is stored and who can access it

2. **Agent-writeable, human-readable**
   - agents can write memory, but users can inspect and edit everything

3. **Trust is explicit**
   - agent memory is not automatically truth
   - verification and confidence are first-class fields

4. **Structured memory beats note blobs**
   - preferences, facts, decisions, tasks, ideas, and summaries should be first-class memory types

5. **Shared memory should improve continuity**
   - users and agents should be able to pick up where they left off across sessions and tools

---

## V1 use cases

### Human use cases
- save tasks, ideas, notes, and reminders
- store durable personal context
- search what happened, what matters, and what was decided

### OpenClaw use cases
- store user preferences
- store important project decisions
- store current project context and follow-ups
- retrieve durable context before assisting

### Hermes use cases
- write session summaries
- remember long-term user instructions
- carry project continuity across sessions
- retrieve preferences and prior decisions

---

## V1 memory schema

```ts
type MemoryType =
  | "preference"
  | "fact"
  | "decision"
  | "task"
  | "idea"
  | "summary"
  | "project_context"
  | "conversation_memory"
  | "relationship"
  | "document_note";

type MemorySource =
  | "human"
  | "openclaw"
  | "hermes"
  | "import"
  | "system";

type MemoryVerification =
  | "unverified"
  | "agent_suggested"
  | "human_confirmed"
  | "system_verified";

type MemoryVisibility =
  | "private"
  | "shared_with_agents"
  | "shared_with_selected_agents";

type MemoryStatus =
  | "active"
  | "archived"
  | "superseded"
  | "deleted";

interface MemoryRecord {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary?: string;
  type: MemoryType;
  source: MemorySource;
  sourceAgent?: string | null;
  createdBy: string;
  tags?: string[];
  people?: string[];
  project?: string | null;
  confidence?: number | null;
  verification: MemoryVerification;
  visibility: MemoryVisibility;
  status: MemoryStatus;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string | null;
  embedding?: number[] | null;
  metadata?: {
    conversationId?: string;
    sessionId?: string;
    externalRef?: string;
    relatedMemoryIds?: string[];
    originalFormat?: string;
    [key: string]: unknown;
  };
}
```

---

## Firestore shape for V1

### Primary collection
`shared_memories`

Each document:

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
  }
}
```

### Optional support collection
`memory_access_policies`

Used later if per-agent or per-system access needs to get more granular.
Not required for the first version.

### Optional support collection
`memory_ingestion_events`

Useful later for audit logs and debugging write flows from agents.
Not required for first launch, but good to keep in mind.

---

## Retrieval model

V1 should support 3 retrieval modes:

1. **Keyword search**
   - exact or partial text matches

2. **Structured filtering**
   - by type
   - by source
   - by source agent
   - by project
   - by visibility
   - by verification
   - by date range

3. **Semantic search**
   - vector search or embedding-backed retrieval
   - can be added after the base schema is stable

### Retrieval priorities
When agents read memory, prioritize:
- human_confirmed memories
- active memories
- project-matching memories
- recent relevant memories
- preference and decision memories over generic notes

---

## V1 API contract

### POST `/api/memory`
Create one memory.

### GET `/api/memory/search`
Search memory by query and filters.

### GET `/api/memory/:id`
Retrieve a specific memory.

### PATCH `/api/memory/:id`
Update a memory, especially verification, tags, status, or project.

### POST `/api/memory/batch`
Write multiple memories at once, useful for agent session summaries.

---

## OpenClaw adapter, V1

### What OpenClaw should write first
- user preferences
- project decisions
- high-value project context
- follow-up reminders
- end-of-session summaries

### What OpenClaw should read first
- user preferences
- active project context
- recent decisions
- relevant summaries

### Adapter responsibilities
- map OpenClaw memory items into SaveMe schema
- attach source=`openclaw`
- attach source_agent=`Nia` when relevant
- default agent writes to `verification=agent_suggested`
- default agent-visible writes to `visibility=shared_with_agents`

### Example OpenClaw write
```json
{
  "title": "Victor prefers direct answers first",
  "content": "Victor prefers direct answers first, then deeper context only when helpful.",
  "type": "preference",
  "source": "openclaw",
  "sourceAgent": "Nia",
  "verification": "agent_suggested",
  "visibility": "shared_with_agents",
  "confidence": 0.94,
  "tags": ["communication", "user_preference"]
}
```

---

## Hermes adapter, V1

### What Hermes should write first
- session summaries
- stable user instructions
- durable project continuity
- learned recurring patterns

### What Hermes should read first
- active tasks
- user preferences
- recent decisions
- current project context

### Adapter responsibilities
- map Hermes session outputs into SaveMe memory types
- attach source=`hermes`
- attach source_agent=`Hermes`
- write only durable, high-value memory, not every conversational detail

---

## Trust and review model

This is essential.

### Agent memory should not be treated as automatic truth
Every agent-generated memory should default to:
- `verification=agent_suggested`
- `confidence=<scored>`

### Human review inbox, later but important
Users should eventually be able to:
- approve memory
- edit memory
- reject memory
- archive stale memory
- promote memory to long-term important context

This becomes the trust layer that makes SaveMe credible as agent memory infrastructure.

---

## Implementation sequence

### Phase 1
- define shared memory schema
- create `shared_memories` collection
- create memory create/search/update endpoints
- build basic OpenClaw adapter
- build basic Hermes adapter

### Phase 2
- add review UI for agent-suggested memories
- add structured filters in frontend
- add session summary batch writes

### Phase 3
- add semantic retrieval
- add relationship links between memories
- add per-agent access control

---

## Existing codebase relevance

Current SaveMe already has memory-like behavior in:
- voice capture and structured entry flows
- `functions/src/voiceTools/memory.ts`

That current `nova_memories` pattern is useful as a starting point, but it is too narrow for the bigger shared-memory architecture.

### Recommendation
Do not try to stretch `nova_memories` into the full shared-memory model.
Instead:
- preserve existing behavior for compatibility
- introduce a new `shared_memories` model for the broader human + agent memory system
- migrate relevant Nova memory behaviors into the new schema over time

---

## Non-goals for V1

Do not overbuild the first version.

Avoid starting with:
- complex graph visualizations
- heavy multi-agent permissions
- automatic ingestion of every conversation detail
- full autonomy in memory writing without review concepts

The first version should prove:
- useful memory writes
- reliable retrieval
- user trust
- continuity across OpenClaw and Hermes

---

## Success criteria

V1 is working if:
- OpenClaw can write and retrieve durable memory from SaveMe
- Hermes can write and retrieve durable memory from SaveMe
- users can inspect and edit stored memory
- memory improves continuity across sessions
- people feel SaveMe is more useful because their AI remembers better

---

## Immediate next steps

1. create the `shared_memories` Firestore collection design and indexes
2. define the first HTTP or callable function API for create/search/update
3. build the OpenClaw adapter first
4. add a small internal UI for reviewing agent-created memories
