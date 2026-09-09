# Application UI review — September 9, 2026

This pass extends the dark/cyan workspace refresh beyond Dashboard and Voice capture. The aim is consistent navigation, readable memory lists, direct forms, and usable phone layouts. It uses the existing app, components, authentication, and global Nova session.

## Changes and findings

| Finding | Change |
| --- | --- |
| Brain Dump, Settings, Insights, and Briefing used separate page frames. | Shared workspace navigation and page headers; Briefing and Insights are directly accessible in the sidebar. |
| Collections repeated titles and had inconsistent controls and awkward create labels. | One collection header, contextual descriptions, shared list/grid controls, and clear Add memory/Add document actions. |
| Creating a memory required configuring fields before entering ordinary notes. | Title, collection, and Notes come first. Custom fields are optional and accept a value before the first save. |
| A collection was not reliably selected in its create form. Numeric zero could disappear during editing. | Preselect the originating collection, respect the submitted collection, and preserve zero values. |
| All entries depended on a wide table with many competing actions. | Responsive memory rows with sorting, selection, export, and an entry actions menu. Bulk deletion is limited to visible selected entries and asks for confirmation. |
| Collection detail dialogs retained a bright gradient, duplicate close controls, and clipped mobile actions. | Neutral detail header, one close control, a scrolling body, wrapping footer, and accessible touch targets. |
| Document creation could save without a required file or retain a stale generated file. | Keep the draft on upload failure, wait for saves, reject empty editor content, and require regeneration after content/format changes. |
| Downloads looked only in local browser storage. | Shared download handling also retrieves cloud-stored documents. |
| Settings tabs and document editor controls were difficult to use on phones. | A labeled mobile section selector, responsive forms/dialogs, and labeled editor controls. |
| Voice preferences emphasized the legacy read-aloud controls. | Put shared Nova conversation settings first; place read-aloud preferences in a separate disclosure. |
| The agent-key list failed its compound query and could show a false empty state. | Query the owner's keys and sort locally; provide explicit loading and retry states. The list loaded successfully in the review. |
| Automation offered a “connected” status backed only by local component state. | Remove that simulated connection form. Keep real agent-key controls and webhook testing, with instructions and code in expandable sections. Remove a hardcoded webhook destination and personal email defaults. |
| Insights had a disconnected period control and opened searches for labels that did not match the source text. | Use one working period selector; open the actual contributing memories by their IDs. Describe tone results as word matches and remove unsupported trend presentation. |
| Help contained outdated feature claims and searched React objects instead of its text. | Short, searchable topics describing implemented flows, working internal links, and clear no-result recovery. |
| Registration, recovery, onboarding, and legal screens had visual inconsistencies. | Cyan registration/recovery actions, consistent recovery and 404 styling, accessible tour controls, collection icons, and explicit legal typography. Legal wording is unchanged. |

## Browser coverage

Reviewed with a disposable authenticated account and synthetic entries, using the in-app browser at 1440 × 1000 and 390 × 844. Screenshots are retained locally in `.firebase/application-review/`; they are not deployed or committed.

| Area | What was checked |
| --- | --- |
| Dashboard and Voice capture | Shared navigation; a typed Nova draft survived Voice capture → Dashboard → Voice capture. |
| Brain Dump | Desktop/mobile layout; type, organize, review, and reset a synthetic draft. No live microphone session was started. |
| Documents, Health, Contacts, Finance, Personal | All five collection layouts on mobile; desktop collection controls; create, detail, edit, fill, and template form entry points. |
| Memory save/edit | Created a Health entry with notes and a custom value; edited it; confirmed the result stayed one entry. |
| All entries | Desktop/mobile list, search and clear-search recovery, sorting/selection presentation, detail navigation. Automated checks cover filtered bulk deletion and cancellation. |
| Documents | Upload and write modes, mobile editor controls, client-side DOCX generation, and cancel. No real document was uploaded in this review. Automated checks cover missing files, upload failure, duplicate submission, empty content, and stale format output. |
| Settings | Opened all ten user sections. Reviewed phone section selection, shared Nova preferences, help navigation, and agent-key loading. Did not create credentials, send support messages, or send webhook payloads. |
| Insights | Desktop/mobile layout, period control, theme → contributing memories → correct saved entry. |
| Daily briefing | Desktop/mobile layout and explicit fallback when the live briefing request was unavailable in the preview. |
| Subscription | Phone plan comparison, current-plan presentation, and billing controls. No paid checkout or portal session was started. |
| Help | Phone layout, search across topic content, internal links, and guided-tour entry. |
| Onboarding | Welcome/collections layouts, enlarged progress controls, and skip back to Brain Dump. |
| Public screens | Sign-in, registration, password recovery, Terms, and Privacy layouts; no registration or reset email submitted. 404 implementation reviewed. |

The marketing homepage, public app preview, extension surfaces, and administrator-only tools were inventoried in source but did not receive a complete interaction review in this pass.

## Validation and remaining checks

- Frontend regression suite: 149 tests across 36 files passed without unhandled errors, including source-memory navigation from Insights.
- Application and tooling TypeScript checks and ESLint passed.
- Production build passed. Vite still reports a large document-viewer chunk; this pass does not resolve that existing bundle-size issue. Deployment uses the existing Firebase Hosting project, with the deployed HTML and changed JavaScript/CSS assets compared against the local build.
- Live audio on physical phones and multiple browsers, payment completion, account export/deletion, agent-key creation, real uploads/downloads, and webhook delivery still require separate end-to-end verification. The live briefing service was unavailable in the local preview; its successful response was not verified here.
- Insights continues to use keyword heuristics. Its UI now links to source memories and avoids presenting word-match trends as established emotional changes.

No realtime transport or model change is part of this release. The app-level VoiceSessionProvider remains the single owner of the conversation. Disposable review data is removed before publishing.
