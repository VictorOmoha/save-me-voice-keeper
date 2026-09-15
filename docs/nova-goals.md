# Nova background goals

Nova goals (`/agent`) carry out bounded, multi-step work even when the browser is closed. Users can start a goal in the workspace or ask Nova to delegate one during a conversation. Tools cover public web research, saved-entry search and reading, note drafting and updates, reviewed deletion, tasks/reminder lookup, reminders, delayed follow-up, and [selected external applications](nova-connections.md).

This is an autonomous agent within SaveMe's available tools. Google Calendar, Google Drive, and user-selected remote MCP tools extend its reach. There is no built-in browser/computer control, code execution, or purchasing tool. Missing essential information or capabilities pause the run for the user.

## Execution and controls

- `novaAgent` authenticates first-party Firebase users and handles creation, pause, resume, cancellation, approvals, rejection, and replies. It does not accept scoped third-party API keys.
- `novaAgentCreated` starts new work. `novaAgentScheduler` runs every minute, continuing due goals and recovering expired worker leases. Each invocation performs at most two actions. The scheduler processes four due runs per tick with concurrency two; load can delay work.
- Runs, plans, observations, pending actions, and results are persisted in `nova_agent_runs`. Four-minute leases fence every checkpoint and write. Pause/cancel invalidates the lease. An already committed change is retained; a provider request in flight may finish but cannot commit under a revoked lease.
- A pending action is stored before execution. Note/reminder effects and their completion record commit in the same transaction. Deterministic document ids and request ids prevent retry duplication. Updates and deletions require a complete recorded read and the exact Firestore revision. Oversized source entries require manual editing.
- Review mode pauses before writes. Automatic mode permits saves, updates, and reminders; deletion always requires approval of the exact pending action. Stale approvals and replies are rejected.
- A separate model call checks proposed completion against the goal and execution record. Rejected completion returns feedback to the runner. This is a consistency check, not a guarantee that an AI-generated answer is correct.
- Each run has 4–30 steps (the UI uses 16, or 24 when applications are selected), at most twice that many model calls, and a 100,000 observed-token threshold. Calls are reserved before provider requests, so interrupted calls still consume the call budget. The token threshold can be exceeded by the final in-flight response; it is not a billing cap. Three consecutive planning/provider infrastructure failures stop the run. At most three open goals and ten new goals per UTC day are allowed per account.
- Completion, questions, approvals, and failures create an inbox notification and a delivery job. Existing explicit phone/email opt-ins, the automation notification preference, and account-deletion checks apply. Email needs a configured provider; phone delivery needs a registered device. The UI never reports enqueueing as confirmed external delivery.

## Configuration and deployment

The worker uses the existing server-only `OPENAI_API_KEY`. `NOVA_AGENT_MODEL` optionally overrides the default `gpt-4.1-mini`; select a model supporting Responses function calling, structured output, and web search. No new frontend secret is required.

Deploy Firestore rules and indexes before the worker, and wait for the new indexes to become ready. Required indexes include `nova_agent_runs` by owner/created time, owner/status, status/next run time, and entries by owner/update time. Deploy `novaAgent`, `novaAgentCreated`, `novaAgentScheduler`, the voice functions, updated `checkReminders`, and Hosting. Account export/deletion includes the new run and account-counter collections.

Run `npm run typecheck`, `npm test`, and `npm --prefix functions test`. The Firebase emulator suite exercises overlapping workers, expired leases, pause/cancel during model calls, stale approvals/revisions, quotas, ownership, deletion fencing, and multi-invocation completion using mocked provider responses. These tests never call a live model or send notifications.

## Current limits

Search covers the 500 most recently updated entries, returning up to twelve matches per query. Task/reminder lookup returns up to fifty of each. Run observations and sources are bounded to keep Firestore documents and model context manageable. Large or ambiguous goals should be split. Explicitly supply dates and timezones when delegating through voice; the workspace supplies the browser timezone.

There is no local tool installation or recurring open-ended monitoring. Cross-app execution uses the connections selected for that goal. Google reads can run automatically; Google Calendar changes and every remote MCP call require approval. External action outcomes are journaled separately because remote services cannot participate in a Firestore transaction. An already-sent external request may finish after pause/cancellation. See the connection documentation for recovery and transport limits.
