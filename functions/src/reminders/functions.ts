import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {randomUUID} from 'node:crypto';
import {
  appOrigin, agentDestination, channelEnabled, ChannelResult, DELIVERY_WINDOW_MS, EmailMessage,
  emailConfigured, emailMessage, MAX_ATTEMPTS, reminderText, retryAt, sendReminderEmail, terminal,
} from './delivery';

const timestamp = (millis: number) => admin.firestore.Timestamp.fromMillis(millis);
interface DeliveryJob {
  run_id?: string;
  notification_id?: string;
  user_id: string;
  text: string;
  status: string;
  attempts: number;
  expires_at: admin.firestore.Timestamp;
  next_attempt_at: admin.firestore.Timestamp;
  email?: ChannelResult;
  push?: ChannelResult;
  email_message?: EmailMessage;
  sent_device_ids?: string[];
}

/** Atomic enqueue: overlapping schedules cannot create duplicate notifications/jobs. */
export async function queueDueReminders(db: admin.firestore.Firestore, now: number): Promise<void> {
  const due = await db.collection('reminders').where('status', '==', 'pending')
    .where('trigger_at', '<=', timestamp(now)).orderBy('trigger_at').limit(100).get();
  for (const candidate of due.docs) {
    await db.runTransaction(async tx => {
      const snap = await tx.get(candidate.ref);
      const reminder = snap.data();
      if (!reminder || reminder.status !== 'pending') return;
      const triggerMillis = typeof reminder.trigger_at?.toMillis === 'function' ? reminder.trigger_at.toMillis() : NaN;
      if (!Number.isFinite(triggerMillis) || typeof reminder.user_id !== 'string' || !reminder.user_id || reminder.user_id.includes('/')) {
        tx.update(candidate.ref, {status: 'cancelled', updated_at: timestamp(now)});
        return;
      }
      if (triggerMillis > now) return;
      const deletion = await tx.get(db.collection('account_deletions').doc(reminder.user_id));
      if (deletion.exists) {
        tx.update(candidate.ref, {status: 'cancelled', updated_at: timestamp(now)});
        return;
      }
      const text = reminderText(reminder);
      tx.set(db.collection('pending_notifications').doc(`reminder_${snap.id}`), {
        user_id: reminder.user_id, type: 'reminder', text,
        task_text: text, entry_id: reminder.entry_id || null, reminder_id: snap.id,
        status: 'pending', created_at: timestamp(now),
      });
      tx.set(db.collection('reminder_deliveries').doc(snap.id), {
        user_id: reminder.user_id, reminder_id: snap.id, text,
        status: 'pending', attempts: 0, created_at: timestamp(now), next_attempt_at: timestamp(now),
        expires_at: timestamp(triggerMillis + DELIVERY_WINDOW_MS),
      });
      tx.update(candidate.ref, {status: 'sent', sent_at: timestamp(now), updated_at: timestamp(now)});
    });
  }
}

export async function deliverReminder(db: admin.firestore.Firestore, ref: admin.firestore.DocumentReference, now: number): Promise<void> {
  const lease = randomUUID();
  const job = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const data = snap.data() as DeliveryJob | undefined;
    if (!data || data.status !== 'pending' || data.next_attempt_at.toMillis() > now) return null;
    tx.update(ref, {lease, attempts: data.attempts + 1, next_attempt_at: timestamp(now + 5 * 60_000)});
    return {...data, attempts: data.attempts + 1};
  });
  if (!job) return;
  const save = async (updates: Record<string, unknown>) => {
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (snap.data()?.lease !== lease) throw new Error('Delivery lease expired');
      tx.update(ref, {...updates, updated_at: timestamp(Date.now())});
    });
  };
  try {
    const uid = job.user_id as string;
    const [prefs, deletion] = await Promise.all([
      db.collection('user_preferences').doc(uid).get(), db.collection('account_deletions').doc(uid).get(),
    ]);
    if (deletion.exists) {
      await save({status: 'complete', email: {state: 'skipped', reason: 'account_unavailable'}, push: {state: 'skipped', reason: 'account_unavailable'}});
      return;
    }
    const user = await admin.auth().getUser(uid).catch((error: {code?: string}) => {
      if (error.code === 'auth/user-not-found') return null;
      throw error;
    });
    if (!user || user.disabled) {
      await save({status: 'complete', email: {state: 'skipped', reason: 'account_unavailable'}, push: {state: 'skipped', reason: 'account_unavailable'}});
      return;
    }
    const preferences = prefs.data() || {};
    if (job.run_id && preferences.automation_notifications === false) {
      await save({status: 'complete', email: {state: 'skipped', reason: 'disabled'}, push: {state: 'skipped', reason: 'disabled'}});
      return;
    }
    const expired = now >= job.expires_at.toMillis() || job.attempts > MAX_ATTEMPTS;
    let email: ChannelResult | undefined = job.email;
    let push: ChannelResult | undefined = job.push;
    if (!terminal(email)) {
      if (!channelEnabled(preferences, 'email')) email = {state: 'skipped', reason: 'disabled'};
      else if (!user.emailVerified || !user.email) email = {state: 'skipped', reason: 'email_unverified'};
      else if (expired) email = {state: 'failed', reason: 'delivery_expired'};
      else if (!emailConfigured()) email = {state: 'retry', reason: 'email_not_configured'};
      else {
        // Freeze the body before calling Resend so a retry uses the identical payload/key.
        const message: EmailMessage = job.email_message || {...emailMessage(job.text, job.run_id), to: [user.email]};
        if (message.to[0] !== user.email) email = {state: 'skipped', reason: 'email_changed'};
        else {
          if (!job.email_message) await save({email_message: message});
          email = await sendReminderEmail(message, `reminder/${ref.id}/email`);
        }
      }
      await save({email});
    }
    if (!terminal(push)) {
      if (!channelEnabled(preferences, 'push')) push = {state: 'skipped', reason: 'disabled'};
      else if (expired) push = {state: 'failed', reason: 'delivery_expired'};
      else {
        const devices = await db.collection('push_devices').where('user_id', '==', uid).get();
        const sent = new Set<string>(job.sent_device_ids || []);
        const pending = devices.docs.filter(device => !sent.has(device.id));
        let transient = false;
        let failed = false;
        for (let index = 0; index < pending.length; index += 100) {
          const group = pending.slice(index, index + 100);
          const response = await admin.messaging().sendEachForMulticast({
            tokens: group.map(device => device.data().token),
            data: {title: job.run_id ? 'Nova update' : 'SaveMe reminder', body: Array.from(job.text).slice(0, 450).join(''), user_id: uid, notification_id: job.notification_id || `reminder_${ref.id}`, url: `${appOrigin()}${agentDestination(job.run_id)}`},
            webpush: {headers: {TTL: '3600', Urgency: 'high'}},
          });
          for (let i = 0; i < response.responses.length; i++) {
            const result = response.responses[i];
            if (result.success) sent.add(group[i].id);
            else if (['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(result.error?.code || '')) {
              await group[i].ref.delete();
            } else if (['messaging/invalid-argument', 'messaging/mismatched-credential'].includes(result.error?.code || '')) failed = true;
            else transient = true;
          }
          // Persist successes so retries target only devices that have not accepted the message.
          await save({sent_device_ids: [...sent]});
        }
        push = transient ? {state: 'retry', reason: 'push_unavailable'}
          : failed ? {state: 'failed', reason: 'push_rejected'}
            : sent.size ? {state: 'sent'} : {state: 'skipped', reason: 'no_devices'};
      }
      await save({push});
    }
    if (job.attempts >= MAX_ATTEMPTS) {
      if (!terminal(email)) email = {state: 'failed', reason: email?.reason || 'attempt_limit'};
      if (!terminal(push)) push = {state: 'failed', reason: push?.reason || 'attempt_limit'};
    }
    await save({email, push, status: terminal(email) && terminal(push) ? 'complete' : 'pending', next_attempt_at: timestamp(retryAt(job.attempts, now))});
  } catch {
    // Leave the lease to expire after an unexpected infrastructure failure.
    // Channel results already persisted above are retained for the next attempt.
    if (job.attempts >= MAX_ATTEMPTS) await save({status: 'failed', reason: 'attempt_limit'});
    console.error('[reminders] Delivery attempt failed', {reminderId: ref.id, attempt: job.attempts});
  }
}

export const checkReminders = functions.runWith({timeoutSeconds: 120, memory: '256MB'})
  .pubsub.schedule('every 1 minutes').onRun(async () => {
    const db = admin.firestore();
    const now = Date.now();
    await queueDueReminders(db, now);
    const jobs = await db.collection('reminder_deliveries').where('status', '==', 'pending')
      .where('next_attempt_at', '<=', timestamp(now)).orderBy('next_attempt_at').limit(20).get();
    for (let i = 0; i < jobs.docs.length; i += 5) {
      await Promise.all(jobs.docs.slice(i, i + 5).map(job => deliverReminder(db, job.ref, now)));
    }
  });

export const reminderDeliveryStatus = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Sign in to configure reminders.');
  return {emailAvailable: emailConfigured()};
});
