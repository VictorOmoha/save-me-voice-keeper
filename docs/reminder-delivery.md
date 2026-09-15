# Reminder delivery

## User experience

Open **Settings → Notifications** or use **Set up phone & email delivery** below the reminder form.

- Every reminder appears in the notification inbox. This includes reminders created with Nova.
- **Enable on this device** requests notification permission and registers that browser or installed web app. Repeat on each phone/computer. Push can arrive with SaveMe closed. Signing out disconnects that device and blocks queued push contents locally.
- On iPhone/iPad, open SaveMe in Safari, use **Share → Add to Home Screen**, open the saved app, and then enable notifications. Supported browsers and OS notification/Focus settings control presentation.
- **Email reminders** sends to the Firebase Auth account's verified email. The UI provides verification and refresh actions. Arbitrary recipient addresses are not accepted.
- The global push switch controls all connected devices; **Disconnect this device** removes only this device. **Reminder alerts** pauses external delivery and foreground sounds while preserving the inbox.
- **Schedule a test reminder** creates a reminder due in one minute through the normal pipeline. Scheduling it is not a claim of delivery.
- New accounts default to external channels off. Explicitly saved existing channel preferences are preserved.

## Required deployment configuration

No production settings or services are changed by this implementation.

1. In Firebase Console → Project settings → Cloud Messaging, enable the FCM Registration API if needed and generate a Web Push certificate key pair. Add its **public** key as `VITE_FIREBASE_VAPID_KEY` in the frontend build environment / GitHub Actions secret. Firebase messaging sender ID must match the project.
2. Configure a verified sending domain in Resend. Add server-only `RESEND_API_KEY` and `REMINDER_EMAIL_FROM` (for example `SaveMe <reminders@your-domain.example>`). Add `REMINDER_APP_ORIGIN=https://your-app.example` if the app is not at `https://saveme.space`. In GitHub Actions, use a secret for the API key and repository variables for the sender and origin. The release script preserves these settings across subsequent deployments. Do not put the API key in a `VITE_` variable.
3. Deploy Firestore indexes and rules, wait for the `reminder_deliveries` index to become ready, then deploy Functions and Hosting. `checkReminders` retains its existing exported function name but now runs every minute. Cloud Scheduler / scheduled Functions must be enabled for the project.
4. Check Settings → Notifications on the deployed HTTPS origin. Email is shown as unavailable until both server settings exist. Device setup is unavailable without the public Web Push key. Test only with an account/address/device you control and explicitly opt in.

The release workflow now deploys Firestore indexes as well as rules. As usual, a newly built index can require additional time before queries succeed; check readiness before relying on scheduled delivery. The application uses its existing `/sw.js` worker, not a separate overlapping worker. For local background-push verification use a production build/preview: development startup intentionally unregisters service workers.

## Reliability and data model

- A minute scheduler reads up to 100 due reminders in chronological order. A transaction rechecks each reminder and creates one deterministic `pending_notifications/reminder_{id}` plus `reminder_deliveries/{id}`. The original reminder's `sent` state means queued to the inbox, not that an external provider delivered it.
- The same scheduler processes up to 20 eligible delivery jobs (five concurrently). A five-minute transaction lease prevents overlapping jobs. Temporary failures use exponential backoff with a maximum of six attempts and a one-hour window from the reminder time. Old reminders remain in the inbox but do not generate stale external alerts. Backlogs can add latency; monitor queue age and increase bounded capacity or use task queues if volume exceeds these limits.
- Email and push have independent `sent`, `skipped`, `retry`, or `failed` results. Each attempt rechecks preferences, account deletion, disabled accounts, and verified email. Successful channels are not resent. Email payloads are frozen before sending and use Resend idempotency keys; retries stay well within Resend's 24-hour idempotency window.
- Push stores accepted device IDs and retries only remaining devices. Expired FCM tokens are removed. The service worker uses a stable notification tag and a local one-day deduplication record. It checks the current registered account before displaying private reminder text and opens only SaveMe's reminders destination on click.
- `sent` means the provider accepted a message, not that the person read it. Neither email nor browser push guarantees an exact alarm time. FCM acceptance followed by a server crash can repeat a provider call; the worker suppresses sequential duplicates, but this is not an exactly-once transport.
- `push_devices` has owner-only read/write/delete rules with validated fields and immutable ownership. The delivery ledger is server-written and readable only by its owner. Both collections are in the account export/deletion inventory; exports strip token fields.
- Email provider configuration failures and transient failures remain visible in the delivery ledger. Inspect `status`, `attempts`, `email`, `push`, `reason`, and `next_attempt_at` without logging addresses, tokens, keys, or provider response bodies.

## Verification

Unit tests cover email request/idempotency behavior, opt-in policies, backoff, the worker without open windows, sign-out/account isolation, duplicate push suppression, and settings interactions. Emulator tests exercise actual Firestore transactions, overlapping schedules, retry isolation, preference changes, unverified email, deleted accounts, device cleanup, and security rules. Provider calls in automated tests are mocked; a deployed test on an actual phone and email account is still required after configuring the services.

## Platform references

- [Firebase Web Push setup](https://firebase.google.com/docs/cloud-messaging/web/get-started)
- [Firebase message handling](https://firebase.google.com/docs/cloud-messaging/web/receive-messages)
- [Apple/WebKit Home Screen Web Push support](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
