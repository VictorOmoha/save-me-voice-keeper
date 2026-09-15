import * as admin from 'firebase-admin';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc} from 'firebase/firestore';
import {vi} from 'vitest';
import {assertEmulatorOnly} from './emulator-guard';
import {deliverReminder, queueDueReminders} from '../../functions/src/reminders/functions';

let env: RulesTestEnvironment;
let db: admin.firestore.Firestore;
const projectId = 'demo-saveme';
const now = Date.parse('2026-09-15T12:00:00Z');
const ts = (ms: number) => admin.firestore.Timestamp.fromMillis(ms);
const sendPush = vi.fn();
const sendEmail = vi.fn();

beforeAll(async () => {
  assertEmulatorOnly({projectId});
  env = await initializeTestEnvironment({projectId, firestore: {host: '127.0.0.1', port: 8080, rules: readFileSync(resolve('firestore.rules'), 'utf8')}});
  if (!admin.apps.length) admin.initializeApp({projectId});
  db = admin.firestore();
  await admin.auth().createUser({uid: 'reminder-alice', email: 'reminder-alice@example.com', emailVerified: true}).catch(error => {if (error.code !== 'auth/uid-already-exists') throw error;});
  vi.spyOn(admin.messaging(), 'sendEachForMulticast').mockImplementation(sendPush);
});
beforeEach(async () => {
  await env.clearFirestore();
  vi.stubEnv('RESEND_API_KEY', 'test-key');
  vi.stubEnv('REMINDER_EMAIL_FROM', 'SaveMe <reminders@example.com>');
  vi.stubGlobal('fetch', sendEmail);
  sendPush.mockReset().mockResolvedValue({responses: [{success: true}], successCount: 1, failureCount: 0});
  sendEmail.mockReset().mockResolvedValue({ok: true});
  await admin.auth().updateUser('reminder-alice', {emailVerified: true, disabled: false});
});
afterEach(() => {vi.unstubAllGlobals(); vi.unstubAllEnvs();});
afterAll(async () => {vi.restoreAllMocks(); await env?.cleanup(); await Promise.all(admin.apps.map(app => app?.delete()));});

async function seedReminder(id = 'r1', trigger = now - 1000) {
  await db.collection('reminders').doc(id).set({user_id: 'reminder-alice', status: 'pending', text: 'Call Mum', trigger_at: ts(trigger)});
}
async function enableDelivery() {
  await db.collection('user_preferences').doc('reminder-alice').set({email_notifications: true, push_notifications: true});
  await db.collection('push_devices').doc('device1').set({user_id: 'reminder-alice', token: 'valid-test-token'});
}
async function job() {return (await db.collection('reminder_deliveries').doc('r1').get()).data()!;}
async function deliver(time = now) {await deliverReminder(db, db.collection('reminder_deliveries').doc('r1'), time);}

describe('Reminder scheduler and delivery', () => {
  it('quarantines a malformed legacy owner without blocking valid reminders', async () => {
    await seedReminder();
    await db.collection('reminders').doc('bad').set({user_id: 'invalid/owner', status: 'pending', trigger_at: ts(now - 2000)});
    await queueDueReminders(db, now);
    expect((await db.collection('reminders').doc('bad').get()).data()?.status).toBe('cancelled');
    expect((await db.collection('reminder_deliveries').get()).size).toBe(1);
  });
  it('atomically queues each due reminder once across overlapping runs and ignores future reminders', async () => {
    await seedReminder();
    await seedReminder('future', now + 60_000);
    await Promise.all([queueDueReminders(db, now), queueDueReminders(db, now)]);
    expect((await db.collection('pending_notifications').get()).size).toBe(1);
    expect((await db.collection('reminder_deliveries').get()).size).toBe(1);
    expect((await db.collection('reminders').doc('future').get()).data()?.status).toBe('pending');
  });
  it('sends email and push once, using a stable email key and only the account devices', async () => {
    await seedReminder(); await enableDelivery();
    await db.collection('push_devices').doc('bob-device').set({user_id: 'bob', token: 'bob-token'});
    await queueDueReminders(db, now);
    await Promise.all([deliver(), deliver()]);
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(sendPush).toHaveBeenCalledOnce();
    expect(sendPush.mock.calls[0][0].tokens).toEqual(['valid-test-token']);
    expect(sendEmail.mock.calls[0][1].headers['Idempotency-Key']).toBe('reminder/r1/email');
    expect(await job()).toMatchObject({status: 'complete', email: {state: 'sent'}, push: {state: 'sent'}});
  });
  it('retries a failed email without resending successful push or changing the email payload', async () => {
    await seedReminder(); await enableDelivery(); await queueDueReminders(db, now);
    sendEmail.mockResolvedValueOnce({ok: false, status: 503});
    await deliver();
    expect(await job()).toMatchObject({status: 'pending', email: {state: 'retry'}, push: {state: 'sent'}});
    await deliver(now + 60_001);
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail.mock.calls[0][1].body).toEqual(sendEmail.mock.calls[1][1].body);
    expect(sendPush).toHaveBeenCalledOnce();
    expect((await job()).status).toBe('complete');
  });
  it('retries only failed devices and removes expired tokens', async () => {
    await seedReminder(); await enableDelivery();
    await db.collection('push_devices').doc('device2').set({user_id: 'reminder-alice', token: 'retry-token'});
    await db.collection('push_devices').doc('device3').set({user_id: 'reminder-alice', token: 'expired-token'});
    sendPush.mockResolvedValueOnce({responses: [{success: true}, {success: false, error: {code: 'messaging/server-unavailable'}}, {success: false, error: {code: 'messaging/registration-token-not-registered'}}]});
    await queueDueReminders(db, now); await deliver(); await deliver(now + 60_001);
    expect(sendPush.mock.calls[1][0].tokens).toEqual(['retry-token']);
    expect((await db.collection('push_devices').doc('device3').get()).exists).toBe(false);
    expect(sendEmail).toHaveBeenCalledOnce();
  });
  it('keeps the inbox reminder while external delivery is disabled', async () => {
    await seedReminder(); await enableDelivery();
    await db.collection('user_preferences').doc('reminder-alice').update({reminder_notifications: false});
    await queueDueReminders(db, now); await deliver();
    expect(sendEmail).not.toHaveBeenCalled(); expect(sendPush).not.toHaveBeenCalled();
    expect((await db.collection('pending_notifications').get()).size).toBe(1);
    expect(await job()).toMatchObject({email: {state: 'skipped'}, push: {state: 'skipped'}});
  });
  it('rechecks opt-out before retrying email', async () => {
    await seedReminder(); await enableDelivery(); await queueDueReminders(db, now);
    sendEmail.mockResolvedValueOnce({ok: false, status: 503});
    await deliver();
    await db.collection('user_preferences').doc('reminder-alice').update({email_notifications: false});
    await deliver(now + 60_001);
    expect(sendEmail).toHaveBeenCalledOnce();
    expect((await job()).email).toEqual({state: 'skipped', reason: 'disabled'});
  });
  it('does not email unverified addresses and still sends push', async () => {
    await seedReminder(); await enableDelivery();
    await admin.auth().updateUser('reminder-alice', {emailVerified: false});
    await queueDueReminders(db, now); await deliver();
    expect(sendEmail).not.toHaveBeenCalled(); expect(sendPush).toHaveBeenCalledOnce();
    expect((await job()).email.reason).toBe('email_unverified');
  });
  it('does not send historical reminders or exhaust retries forever', async () => {
    await seedReminder('r1', now - 2 * 60 * 60_000); await enableDelivery();
    await queueDueReminders(db, now); await deliver();
    expect(sendEmail).not.toHaveBeenCalled(); expect(sendPush).not.toHaveBeenCalled();
    expect((await job()).status).toBe('complete');
    expect((await job()).email.reason).toBe('delivery_expired');
  });
  it('skips accounts queued for deletion after the reminder was enqueued', async () => {
    await seedReminder(); await enableDelivery(); await queueDueReminders(db, now);
    await db.collection('account_deletions').doc('reminder-alice').set({status: 'pending'});
    await deliver();
    expect(sendEmail).not.toHaveBeenCalled(); expect(sendPush).not.toHaveBeenCalled();
    expect((await job()).status).toBe('complete');
  });
});

describe('Push devices and delivery ledger security', () => {
  it('allows device enrollment and disconnection only for the owning account', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    const bob = env.authenticatedContext('bob').firestore();
    const ref = doc(alice, 'push_devices', 'device-a');
    await assertSucceeds(setDoc(ref, {user_id: 'alice', token: 'a'.repeat(30), updated_at: serverTimestamp()}));
    await assertFails(getDoc(doc(bob, 'push_devices', 'device-a')));
    await assertFails(updateDoc(doc(bob, 'push_devices', 'device-a'), {user_id: 'bob', updated_at: serverTimestamp()}));
    await assertFails(updateDoc(ref, {user_id: 'bob', updated_at: serverTimestamp()}));
    await assertFails(deleteDoc(doc(bob, 'push_devices', 'device-a')));
    await assertSucceeds(deleteDoc(ref));
  });
  it('rejects malformed devices and forged delivery records', async () => {
    const alice = env.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(alice, 'push_devices', 'bad'), {user_id: 'alice', token: 'short', updated_at: serverTimestamp()}));
    await assertFails(setDoc(doc(alice, 'reminder_deliveries', 'fake'), {user_id: 'alice', status: 'pending'}));
    await db.collection('reminder_deliveries').doc('owned').set({user_id: 'alice', status: 'complete'});
    await assertSucceeds(getDoc(doc(alice, 'reminder_deliveries', 'owned')));
    await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore(), 'reminder_deliveries', 'owned')));
  });
});
