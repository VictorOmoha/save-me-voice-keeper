# Nova application connections

## User flow

1. Open **Settings → Connections**.
2. Connect Google Calendar or Drive through Google's account consent screen, or enter a remote MCP server URL and its bearer token if required.
3. For MCP, select and save the tools Nova may use. New or refreshed catalogs start with no enabled tools.
4. Open **Nova goals**, select the applications for this goal, and describe the outcome. Voice can discover connections with `getConnectedApps` and pass the requested application ids to `startAgentGoal`.
5. Google reads run without a separate approval. Calendar event creation and every MCP call pause for review of the destination, tool, and exact arguments.

Disconnecting removes the saved credential and prevents new dispatches. Requests already sent may still finish. Google permissions can also be revoked at https://myaccount.google.com/connections. Reconnecting or changing enabled tools changes the connection revision, invalidating previously proposed actions. A goal's application selection is fixed; start a new goal when a missing application is connected.

## Available capabilities

| Connection | Tools | Limits |
| --- | --- | --- |
| Google Calendar | List primary-calendar events; create a timed event | 50 events per read, date ranges up to 93 days. No attendee invitations, email, event editing, or deletion. |
| Google Drive | Search file names; read a file by returned id | 20 search results; Google Docs/Slides as text, Sheets first sheet as CSV, and plain text/Markdown/CSV. Large reads are bounded and marked truncated. PDFs and other binary files return metadata and their normal Drive link. No file changes. |
| Remote MCP | Discover and enable tools, invoke after approval | Public HTTPS Streamable HTTP with optional bearer token. Up to eight servers; up to 50 tools discovered over four pages. OAuth-only MCP, stdio/local processes, legacy HTTP+SSE, client sampling, and elicitation are not supported. |

The MCP client negotiates versions 2025-11-25, 2025-06-18, and 2025-03-26. It supports JSON and SSE responses, session headers, initialization notifications, paginated tool discovery, tool calls, and best-effort session closure. Tool arguments use the discovered JSON schema; the remote server performs schema validation. Nova does not execute provider HTML or fetch returned resource links.

## Credentials and boundaries

- `novaConnections` accepts verified Firebase sessions, with abuse limits and an account-deletion check. Shared-memory API keys cannot manage connections.
- `nova_connections`, `nova_oauth_states`, and `nova_external_actions` deny all direct client Firestore access. Admin endpoints return an explicit metadata allowlist. Credentials are stored in server-only Firestore records under its encryption at rest, excluded from API output, prompts, logs, and account exports. Account deletion includes all three collections.
- Google authorization uses a ten-minute, single-use state record, PKCE, an authenticated finish request, and browser session/account matching. The backend checks the scope Google actually granted before saving a refresh token. Google access tokens are refreshed server-side before requests and are not sent to the model.
- Calendar uses `calendar.events.owned`; Drive uses `drive.readonly`, with `openid email` to identify the connected account. These permissions require accurate Google consent-screen configuration. Google's verification requirements for sensitive/restricted scopes apply before a public rollout; testing-mode refresh tokens may expire and need reconnection.
- MCP URLs must use a public hostname, HTTPS, and port 443. Embedded credentials, query strings, redirects, IP literals, and private/reserved IPv4 ranges are rejected. IPv4 DNS results are checked and pinned to the actual connection to prevent rebinding. IPv6-only endpoints are currently unsupported. Requests have a 25-second transport deadline and 256 KB response bound.
- Tool metadata and results are untrusted observations. Google read tools are allowlisted in server code; a remote server cannot label its own tool read-only to bypass approval. Each call rechecks goal ownership, selected connection, revision, enabled tool, approval, active lease, and deletion lock immediately before dispatch.

## External action recovery

Before a mutating/unknown external call, Nova stores an intent record keyed by the run, connection revision, tool, and canonical arguments. The exact proposal must be approved. A completed result can be reused after a worker restart without calling the provider again.

If a request was dispatched but its result cannot be confirmed, Nova pauses and asks the user to check the application. It does not resend that same action automatically, even if a later model decision proposes it again. This favors avoiding duplicate changes; a crash after reserving an intent but before sending can require manual checking even when no remote change happened. It is not a distributed exactly-once guarantee. Calendar event ids are derived from the same intent identity.

## Operator setup and deployment

1. Enable Google Calendar API (`calendar-json.googleapis.com`) and Google Drive API (`drive.googleapis.com`) in the Firebase project's Google Cloud project.
2. Configure a Web application OAuth client with `https://saveme.space/settings` as an authorized redirect URI. If serving the flow from another allowed app origin, register its exact `/settings` URI too.
3. Set server-only `NOVA_GOOGLE_CLIENT_ID` and `NOVA_GOOGLE_CLIENT_SECRET`. Never place these in Vite/public environment variables or commit them. The existing `OPENAI_API_KEY` continues to power the runner.
4. Review Google Auth Platform branding, audience, consent scopes, and verification. Users always complete their own Google consent before Nova can access their account.
5. Deploy Firestore rules, `novaConnections`, `novaAgent`, `novaAgentCreated`, `novaAgentScheduler`, voice endpoints, account export/deletion endpoints, and Hosting. No new compound indexes are required.

When Google credentials are absent, the UI explicitly shows administrator setup is pending and disables Google Connect. MCP remains available.

## Verification

Unit and Firebase emulator tests cover account isolation, credential exclusion, direct-client rules denial, single-use/expired OAuth state, partial consent, connection selection, approvals, revocation during preparation, pause/deletion, permission revision changes, completed-action reuse, and uncertain outcomes. These tests use synthetic data and mocked external responses. The MCP transport was also exercised against Microsoft's public Learn server with a public documentation query; it did not read saved user data. User-specific Google consent and external account actions require a connected account to verify live.

Protocol and provider references: [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports), [MCP tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools), [Google OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server), [Calendar event creation](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert), [Drive export](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/export), [Microsoft Learn MCP](https://learn.microsoft.com/en-us/training/support/mcp).
