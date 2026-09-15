import * as admin from 'firebase-admin';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {doc, getDoc, setDoc, updateDoc} from 'firebase/firestore';
import {assertEmulatorOnly} from './emulator-guard';
import {createRun, controlRun} from '../../functions/src/autonomy/service';
import {runAgent, runnerDependencies} from '../../functions/src/autonomy/runner';
import {claimRun, checkpoint, stamp} from '../../functions/src/autonomy/store';
import {readAction} from '../../functions/src/autonomy/actions';
import type {AgentAction, AgentRun} from '../../functions/src/autonomy/policy';

let env: RulesTestEnvironment;
let db: admin.firestore.Firestore;
const uid = 'nova-test-alice';
const save: AgentAction = {tool: 'save_note', args: {title: 'Weekly plan', content: 'Finish the prototype.', category: 'Work'}};
const finish: AgentAction = {tool: 'finish', args: {result: 'Saved your weekly plan.', evidence: 'The save_note tool returned a saved entry id.'}};
const decision = (action: AgentAction) => ({action, tokens: 40});
beforeAll(async () => {
  assertEmulatorOnly({projectId: 'demo-saveme'});
  env = await initializeTestEnvironment({projectId: 'demo-saveme', firestore: {host: '127.0.0.1', port: 8080, rules: readFileSync(resolve('firestore.rules'), 'utf8')}});
  if (!admin.apps.length) admin.initializeApp({projectId: 'demo-saveme'});
  db = admin.firestore();
  await admin.auth().createUser({uid}).catch(error => {if (error.code !== 'auth/uid-already-exists') throw error;});
});
beforeEach(async () => {
  await env.clearFirestore();
  vi.spyOn(runnerDependencies, 'nextAction').mockResolvedValue(decision(finish));
  vi.spyOn(runnerDependencies, 'research').mockResolvedValue({text: 'A sourced finding.', sources: [{url: 'https://example.org/source', title: 'Source'}], tokens: 20});
  vi.spyOn(runnerDependencies, 'verifyCompletion').mockResolvedValue({complete: true, feedback: 'The requested output is saved.', tokens: 20});
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {await env?.cleanup(); await Promise.all(admin.apps.map(app => app?.delete()));});
async function create(options: Record<string, unknown> = {}) {
  const id = await createRun(db, uid, {goal: 'Save a weekly plan', writeMode: 'auto', requestId: randomUUID(), ...options});
  return db.collection('nova_agent_runs').doc(id);
}
const data = async (ref: admin.firestore.DocumentReference) => (await ref.get()).data() as AgentRun;

it('runs multiple steps across checkpoints, verifies completion, and queues a user notification', async () => {
  const ref = await create();
  vi.mocked(runnerDependencies.nextAction).mockResolvedValueOnce(decision({tool: 'plan', args: {steps: ['Draft a weekly plan', 'Save it']}})).mockResolvedValueOnce(decision(save));
  await runAgent(ref);
  expect((await data(ref)).status).toBe('queued');
  expect((await db.collection('entries').get()).size).toBe(1);
  await runAgent(ref);
  expect((await data(ref))).toMatchObject({status: 'completed', result: finish.args.result});
  expect(runnerDependencies.verifyCompletion).toHaveBeenCalledOnce();
  expect((await db.collection('pending_notifications').get()).docs[0].data()).toMatchObject({run_id: ref.id, type: 'automation'});
  expect((await db.collection('reminder_deliveries').get()).docs[0].data()).toMatchObject({run_id: ref.id, status: 'pending'});
});
it('fences overlapping workers and saves the effect once', async () => {
  const ref = await create();
  vi.mocked(runnerDependencies.nextAction).mockResolvedValueOnce(decision(save));
  await Promise.all([runAgent(ref), runAgent(ref)]);
  expect((await db.collection('entries').get()).size).toBe(1);
  expect((await data(ref)).steps.filter(step => step.tool === 'save_note')).toHaveLength(1);
});
it('resumes an expired lease with its persisted pending action', async () => {
  const ref = await create();
  await ref.update({status: 'running', lease: 'dead-worker', lease_until: Date.now() - 1, next_run_at: stamp(Date.now() - 1), pending: save, pending_id: 'persisted'});
  await runAgent(ref);
  expect((await db.collection('entries').get()).size).toBe(1);
  expect((await data(ref)).status).toBe('completed');
  expect(runnerDependencies.nextAction).toHaveBeenCalledOnce();
});
it.each(['pause', 'cancel'])('prevents a model response from writing after %s', async operation => {
  const ref = await create();
  vi.mocked(runnerDependencies.nextAction).mockImplementationOnce(async () => {
    await controlRun(db, uid, {operation, runId: ref.id});
    return decision(save);
  });
  await runAgent(ref);
  expect((await data(ref)).status).toBe(operation === 'pause' ? 'paused' : 'cancelled');
  expect((await db.collection('entries').get()).empty).toBe(true);
});
it('requires exact approval and rejects other owners and stale approval ids', async () => {
  const ref = await create({writeMode: 'review'});
  vi.mocked(runnerDependencies.nextAction).mockResolvedValueOnce(decision(save));
  await runAgent(ref);
  const waiting = await data(ref);
  expect(waiting.status).toBe('waiting');
  expect((await db.collection('entries').get()).empty).toBe(true);
  await expect(controlRun(db, 'bob', {operation: 'approve', runId: ref.id, pendingId: waiting.pending_id})).rejects.toThrow('not found');
  await expect(controlRun(db, uid, {operation: 'approve', runId: ref.id, pendingId: 'stale'})).rejects.toThrow('changed');
  await controlRun(db, uid, {operation: 'approve', runId: ref.id, pendingId: waiting.pending_id});
  await runAgent(ref);
  expect((await db.collection('entries').get()).size).toBe(1);
});
it('always requests approval for deletion and preserves a concurrently edited entry', async () => {
  await db.collection('entries').doc('note').set({user_id: uid, title: 'Keep me', fields: {content: 'Original'}, updated_at: stamp()});
  const ref = await create();
  const observed = await readAction(db, await data(ref), {tool: 'read_entry', args: {id: 'note'}});
  const revision = JSON.parse(observed.result).revision;
  await ref.update({steps: [{number: 1, tool: 'read_entry', ...observed, at: new Date().toISOString()}]});
  vi.mocked(runnerDependencies.nextAction).mockResolvedValueOnce(decision({tool: 'delete_note', args: {id: 'note', revision}}));
  await runAgent(ref);
  const waiting = await data(ref);
  expect(waiting.status).toBe('waiting');
  await db.collection('entries').doc('note').update({'fields.content': 'New edit'});
  await controlRun(db, uid, {operation: 'approve', runId: ref.id, pendingId: waiting.pending_id});
  await runAgent(ref);
  expect((await db.collection('entries').doc('note').get()).data()?.fields.content).toBe('New edit');
  expect((await data(ref)).steps.some(step => step.result.includes('This entry changed'))).toBe(true);
});
it('rejected changes never execute, and the agent can ask for clarification', async () => {
  const ref = await create({writeMode: 'review'});
  vi.mocked(runnerDependencies.nextAction).mockResolvedValueOnce(decision(save));
  await runAgent(ref);
  await controlRun(db, uid, {operation: 'reject', runId: ref.id, pendingId: (await data(ref)).pending_id});
  vi.mocked(runnerDependencies.nextAction).mockResolvedValueOnce(decision({tool: 'ask_user', args: {question: 'What should change?'}}));
  await runAgent(ref);
  expect((await db.collection('entries').get()).empty).toBe(true);
  await expect(controlRun(db, uid, {operation: 'reply', runId: ref.id, answer: 'Shorter', expectedSteps: 99})).rejects.toThrow('changed');
  await controlRun(db, uid, {operation: 'reply', runId: ref.id, answer: 'Shorter', expectedSteps: (await data(ref)).steps.length});
  expect((await data(ref)).notes).toContain('Shorter');
});
it('rejects an unsupported completion and continues to seek input', async () => {
  const ref = await create({goal: 'Send a message through an unconnected account'});
  vi.mocked(runnerDependencies.verifyCompletion).mockResolvedValue({complete: false, feedback: 'No message was sent. Ask the user for the missing connection.', tokens: 10});
  vi.mocked(runnerDependencies.nextAction).mockResolvedValueOnce(decision(finish)).mockResolvedValueOnce(decision({tool: 'ask_user', args: {question: 'The account is not connected. Can I save a draft?'}}));
  await runAgent(ref);
  expect((await data(ref)).status).toBe('waiting');
  expect((await data(ref)).steps[0].tool).toBe('verification');
});
it('does not claim future work or access a deleting account', async () => {
  const ref = await create();
  await ref.update({next_run_at: stamp(Date.now() + 3600000)});
  expect(await claimRun(ref)).toBeNull();
  await ref.update({next_run_at: stamp()});
  const claim = await claimRun(ref);
  await db.collection('account_deletions').doc(uid).set({status: 'pending'});
  expect(await checkpoint(ref, claim!.lease, () => ({result: 'Should never commit'}))).toBeNull();
  await expect(create()).rejects.toThrow('deletion');
});
it('bounds requests, deduplicates retries, and serializes the three-open-goal cap', async () => {
  const requestId = randomUUID();
  const ref = await create({requestId});
  expect((await create({requestId})).id).toBe(ref.id);
  await create();
  const results = await Promise.allSettled([create(), create()]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect((await db.collection('nova_agent_runs').get()).size).toBe(3);
  await ref.update({status: 'completed'});
  await db.collection('nova_agent_accounts').doc(uid).set({day: new Date().toISOString().slice(0, 10), created_today: 10});
  await expect(create()).rejects.toThrow('10 goals');
}, 60000);
it('enforces entry admission, disabled web access, and model-work limits', async () => {
  const ref = await create();
  await db.collection('entitlement_usage').doc(uid).set({entries: 50});
  vi.mocked(runnerDependencies.nextAction).mockResolvedValueOnce(decision(save)).mockResolvedValueOnce(decision({tool: 'web_research', args: {query: 'public topic'}}));
  await runAgent(ref);
  expect((await db.collection('entries').get()).empty).toBe(true);
  expect(runnerDependencies.research).not.toHaveBeenCalled();
  await ref.update({calls: 32});
  await runAgent(ref);
  expect((await data(ref)).status).toBe('failed');
});
it('allows only the owner to read runs and denies all direct client writes', async () => {
  const ref = await create();
  const alice = env.authenticatedContext(uid).firestore();
  const bob = env.authenticatedContext('bob').firestore();
  await assertSucceeds(getDoc(doc(alice, ref.path)));
  await assertFails(getDoc(doc(bob, ref.path)));
  await assertFails(updateDoc(doc(alice, ref.path), {approved: true, status: 'queued'}));
  await assertFails(setDoc(doc(alice, 'nova_agent_runs/forged'), {user_id: uid, goal: 'forged'}));
  await assertFails(setDoc(doc(alice, `nova_agent_accounts/${uid}`), {created_today: 0}));
});
