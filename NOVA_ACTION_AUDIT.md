# Nova Canonical Action Audit

Status legend:
- **LIVE** = wired through canonical Nova path and lands in UI coherently
- **PARTIAL** = mostly wired, but UX/state handling is incomplete or indirect
- **NEEDS SUPPORT** = backend/client action exists, but UI support is weak or absent
- **LEGACY OVERLAP** = exists in older voice systems and should not be extended there

## Canonical path
`NovaFloat -> NovaVoiceAgent -> useVoiceAgent -> backend voiceAgent -> callbacks/events -> page response`

## Action audit

### navigateApp
- **LIVE**
- handled by `NovaFloat.handleNavigate(route)`
- routes via React Router and closes Nova panel

### navigateToCategory
- **LIVE**
- handled by same route navigation pattern
- category pages load correctly from route

### openEntryForm
- **LIVE**
- `NovaFloat` navigates to `/dashboard?action=create[&category=...]`
- Dashboard now consumes `action=create` and `category` query params
- category intent now actually reaches page state

### openEntry
- **LIVE**
- if entry id exists: navigates to `/all-entries/:id`
- otherwise falls back to search query in `/all-entries?search=...`
- AllEntries already supports dialog-open by route param

### goBack / close current UI
- **PARTIAL**
- implemented as `nova:close`
- Dashboard / AllEntries / CategoryPage respond to it
- QuickCaptureOverlay, EntryViewDialog, EnhancedEntryViewDialog, EnhancedDocumentViewer, and DocumentEditor now also respond to it
- still needs final sweep across remaining modal/overlay surfaces for full standardization

### scrollPage
- **PARTIAL**
- handled in `NovaFloat.handleScrollPage`
- scroll target uses `main` or document root
- works generically, but not guaranteed for all nested scroll containers

### startBrainDump
- **LIVE**
- handled by Nova -> route to `/brain-dump`
- sessionStorage payload + listener support auto-start capture

### processBrainDump
- **LIVE**
- event `brain-dump:process`
- BrainDump page listens and processes current content

### saveBrainDump
- **LIVE**
- event `brain-dump:save`
- BrainDump page listens, optionally normalizes requested category, processes if needed, then saves

### updateTheme
- **LIVE**
- NovaFloat applies `setTheme(theme)` and toasts result

### updateProfile
- **PARTIAL**
- Settings page now reacts to `nova:settings-updated` and opens profile tab
- actual profile-field mutation path should be verified end-to-end against backend actions

### toggleNotification
- **PARTIAL**
- Settings page now lands on notifications tab from Nova updates
- actual toggle mutation should be verified per setting type

### updateVoiceSettings
- **PARTIAL**
- Settings page now lands on voice tab from Nova updates
- actual value-specific change path should be verified end-to-end

### exportUserData
- **LIVE**
- Nova routes to `/settings?tab=data-management`
- emits `nova:export-data`
- `EnhancedDataManagementSettings` listens and triggers export

### printEntry
- **LIVE**
- NovaFloat converts returned entries to printable shape and opens professional print flow

### searchEntries
- **LIVE**
- Nova live action completion navigates to `/all-entries?search=...`
- list view receives search query flow

### saveEntry
- **LIVE**
- live action completion emits `nova:entries-changed`
- `useSavedEntries`, AllEntries, CategoryPage now react and refresh
- optional navigation to saved entry route already exists

### updateEntry
- **LIVE**
- same refresh/event path as saveEntry
- navigates to updated entry when id available

### deleteEntry
- **LIVE**
- emits `nova:entries-changed`
- navigates back to `/all-entries`
- pages refresh accordingly

## Legacy overlap
These remain in repo but should not receive new feature work:
- `VoiceCommandContext`
- `VoiceCommandGlobalListener`
- `DashboardVoiceListener`
- older command-router/sequencer page listeners

## Main findings
1. Canonical Nova path is real and viable
2. Most high-value actions are now coherent
3. Weakest areas are settings mutations and generic close/scroll semantics
4. Biggest architectural risk remains legacy voice overlap, not the canonical Nova path

## Recommended next fixes
1. Standardize close semantics across all dialogs/pages (`nova:close` contract)
2. Audit `useVoiceAgent` app-command-to-callback mapping directly
3. Verify settings mutations end-to-end for profile/notifications/voice
4. Remove or quarantine legacy voice listener paths
5. Add a small Nova developer test matrix for canonical actions
