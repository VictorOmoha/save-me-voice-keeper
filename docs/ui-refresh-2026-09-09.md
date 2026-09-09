# Workspace UI refresh — September 9, 2026

The dashboard and Voice Capture retain SaveMe’s dark and cyan palette with clearer hierarchy, quieter surfaces, and a shared navigation frame.

## Changed

- Dashboard: one primary Nova action, readable recent memories, compact collections, and a separate daily overview. Secondary workspace details load when expanded.
- Navigation: grouped links, meaningful counts, one desktop header, mobile search, and a modal mobile menu with focus restoration.
- Voice Capture: conversation history and confirmed saves have distinct areas. Starting prompts fill the shared draft. On phones, the microphone and composer appear before suggestions so capture is immediately accessible.
- Nova’s existing app-owned session is preserved. The floating control is hidden on Voice Capture; minimizing it or changing routes does not end the session. The idle phone control occupies less space.
- Search: an empty result has explicit feedback and a clear action; dashboard collection and archive totals remain independent of the search filter.
- Memory titles open their details directly. Grid actions remain visible for touch and keyboard users. Upload document opens the upload mode.
- Reminders: the overview uses the canonical `trigger_at` field, refreshes after creation, and offers retry on read failure. The initial date/time uses the device’s local time.
- Motion: the voice waveform stops its animation loop for reduced-motion preferences.

## Validation

- 139 frontend tests passed across 33 files, including the shared voice-session lifecycle regression tests, mobile menu focus, prompt draft behavior, empty search, and reminder recovery/refresh.
- App and Node TypeScript checks, ESLint, and the production Vite build passed.
- Authenticated browser review used a disposable account and sample memories at desktop and 390px phone widths. Verified memory opening, list/grid switching, search/clear, manual form cancellation, upload entry point, reminders, mobile navigation, and shared draft continuity across Dashboard, Voice Capture, and the global Nova panel. No horizontal overflow at the checked widths.
- Review screenshots are local, ignored artifacts under `.firebase/ui-refresh-review/`.
- The disposable review account and its sample records were removed after validation.
- This pass did not repeat the prior live speech-to-speech test or test physical iOS/Android devices. Session ownership and realtime transport were not changed.

## Deployment

`firestore.indexes.json` adds the reminders composite index for `user_id`, `status`, and `trigger_at`. The additive index was deployed and its query verified in the browser before the hosting release. No Firestore rules or Cloud Functions changes are required.
