import * as admin from 'firebase-admin';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {assertFails, initializeTestEnvironment, type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import {assertEmulatorOnly} from './emulator-guard';
import {createRun} from '../../functions/src/autonomy/service';
import {claimRun, stamp} from '../../functions/src/autonomy/store';
import {AgentAction} from '../../functions/src/autonomy/policy';
import {Connection, connectionId, publicConnection} from '../../functions/src/connections/types';
import {beginGoogle, changeConnection, connectionDependencies, finishGoogle, listConnections} from '../../functions/src/connections/service';
import {googleDependencies, GOOGLE_SCOPES} from '../../functions/src/connections/google';
import {externalAction, externalDependencies} from '../../functions/src/connections/agent';
import {exportSafeValue} from '../../functions/src/privacy/accountResources';

let env: RulesTestEnvironment;
let db: admin.firestore.Firestore;
const uid = 'connections-alice';
const id = connectionId(uid, 'mcp:https://example.com/mcp');
const connection: Connection = {user_id: uid, provider: 'mcp', name: 'Example tools', account: 'example.com', endpoint: 'https://example.com/mcp', revision: 'revision-one',
  tools: [{name: 'make_task', description: 'Create a task', inputSchema: {type: 'object'}}], enabled_tools: ['make_task'], credentials_secret: {bearer_token: 'PRIVATE-TOKEN'}, created_at: null, updated_at: null};
const action: AgentAction = {tool: 'call_external_tool', args: {connection_id: id, connection_revision: connection.revision, tool_name: 'make_task', arguments_json: '{"title":"Synthetic task"}'}};
const call = vi.fn();
beforeAll(async () => {
  assertEmulatorOnly({projectId: 'demo-saveme'});
  env = await initializeTestEnvironment({projectId: 'demo-saveme', firestore: {host: '127.0.0.1', port: 8080, rules: readFileSync(resolve('firestore.rules'), 'utf8')}});
  if (!admin.apps.length) admin.initializeApp({projectId: 'demo-saveme'});
  db = admin.firestore();
});
beforeEach(async () => {
  await env.clearFirestore();
  await db.collection('nova_connections').doc(id).set(connection);
  call.mockReset().mockResolvedValue({success: true, content: ['Created task 123']});
  vi.spyOn(externalDependencies, 'openMcp').mockResolvedValue({call, list: async () => connection.tools, close: async () => {}});
  vi.stubEnv('NOVA_GOOGLE_CLIENT_ID', 'test-client'); vi.stubEnv('NOVA_GOOGLE_CLIENT_SECRET', 'test-secret');
});
afterEach(() => {vi.restoreAllMocks(); vi.unstubAllEnvs();});
afterAll(async () => {await env?.cleanup(); await Promise.all(admin.apps.map(app => app?.delete()));});
async function pending(approved = true, value = action) {
  const runId = await createRun(db, uid, {goal: 'Make a task', connectionIds: [id], requestId: randomUUID()});
  const ref = db.collection('nova_agent_runs').doc(runId);
  await ref.update({pending: value, pending_id: 'request-one', approved});
  const claim = (await claimRun(ref))!;
  return {ref, ...claim};
}
it('denies all direct client access to tokens, OAuth states, and execution records, including their owner', async () => {
  const client = env.authenticatedContext(uid).firestore();
  for (const collection of ['nova_connections', 'nova_oauth_states', 'nova_external_actions']) {
    await db.collection(collection).doc(id).set({user_id: uid, credentials_secret: {bearer_token: 'PRIVATE-TOKEN'}});
    await assertFails(getDoc(doc(client, collection, id)));
    await assertFails(setDoc(doc(client, collection, id), {user_id: uid}));
  }
});
it('isolates account catalogs and never returns or exports credentials', async () => {
  expect(await listConnections(db, 'bob')).toEqual([]);
  expect(JSON.stringify(await listConnections(db, uid))).not.toContain('PRIVATE-TOKEN');
  expect(JSON.stringify(exportSafeValue(connection))).not.toContain('PRIVATE-TOKEN');
  expect(publicConnection(id, connection)).not.toHaveProperty('credentials_secret');
  await expect(createRun(db, 'bob', {goal: 'Read', requestId: randomUUID(), connectionIds: [id]})).rejects.toThrow('no longer connected');
});
it('requires approval and never calls an external server before approval', async () => {
  const {ref, lease, run} = await pending(false);
  await expect(externalAction(ref, lease, run, action)).rejects.toThrow('approval');
  expect(externalDependencies.openMcp).not.toHaveBeenCalled(); expect(call).not.toHaveBeenCalled();
});
it('records an external result once and reuses it after worker recovery', async () => {
  const {ref, lease, run} = await pending();
  const first = await externalAction(ref, lease, run, action);
  expect(first.result).toContain('Created task 123');
  expect(await externalAction(ref, lease, run, action)).toEqual(first);
  expect(call).toHaveBeenCalledOnce();
  expect((await db.collection('nova_external_actions').get()).docs[0].data().status).toBe('done');
});
it('does not resend a timed-out action even if the model proposes it again', async () => {
  const {ref, lease, run} = await pending();
  call.mockRejectedValue(new Error('Timeout with PRIVATE-TOKEN'));
  await expect(externalAction(ref, lease, run, action)).rejects.toThrow('outcome could not be confirmed');
  await expect(externalAction(ref, lease, {...run, pending_id: 'new-proposal'}, action)).rejects.toThrow('will not repeat');
  expect(call).toHaveBeenCalledOnce();
  const record = (await db.collection('nova_external_actions').get()).docs[0].data();
  expect(record.status).toBe('uncertain'); expect(JSON.stringify(record)).not.toContain('PRIVATE-TOKEN');
});
it('honors disconnection while preparing the remote call', async () => {
  const {ref, lease, run} = await pending();
  vi.mocked(externalDependencies.openMcp).mockImplementation(async () => {
    await changeConnection(db, uid, {operation: 'disconnect', id, revision: connection.revision});
    return {call, list: async () => [], close: async () => {}};
  });
  await expect(externalAction(ref, lease, run, action)).rejects.toThrow('disconnected');
  expect(call).not.toHaveBeenCalled(); expect((await db.collection('nova_external_actions').get()).empty).toBe(true);
});
it('honors pause and account deletion before dispatch', async () => {
  const {ref, lease, run} = await pending();
  vi.mocked(externalDependencies.openMcp).mockImplementation(async () => {
    await ref.update({status: 'paused', lease: null});
    return {call, list: async () => [], close: async () => {}};
  });
  await expect(externalAction(ref, lease, run, action)).rejects.toThrow('paused');
  expect(call).not.toHaveBeenCalled();
  await db.collection('account_deletions').doc(uid).set({status: 'pending'});
  await expect(changeConnection(db, uid, {operation: 'tools', id, revision: connection.revision, tools: []})).rejects.toThrow('deletion');
});
it('invalidates approval after tool access changes', async () => {
  const {ref, lease, run} = await pending();
  await changeConnection(db, uid, {operation: 'tools', id, revision: connection.revision, tools: []});
  await expect(externalAction(ref, lease, run, action)).rejects.toThrow('changed');
  expect(call).not.toHaveBeenCalled();
});
it('binds single-use Google authorization to its initiating user, PKCE, origin, and granted scope', async () => {
  const start = await beginGoogle(db, uid, {provider: 'google_drive'}, 'https://saveme.space');
  const auth = new URL(start.url);
  expect(auth.searchParams.get('redirect_uri')).toBe('https://saveme.space/settings');
  expect(auth.searchParams.get('code_challenge_method')).toBe('S256');
  const exchange = vi.spyOn(connectionDependencies, 'googleToken').mockResolvedValue({access_token: 'access', refresh_token: 'refresh-secret', scope: GOOGLE_SCOPES.google_drive});
  vi.spyOn(googleDependencies, 'request').mockResolvedValue({status: 200, headers: {}, body: '{"email":"alice@example.com"}'});
  const request = {provider: 'google_drive', state: start.state, code: 'synthetic-code'};
  await expect(finishGoogle(db, 'bob', request)).rejects.toThrow('expired');
  expect(exchange).not.toHaveBeenCalled();
  const result = await finishGoogle(db, uid, request);
  expect(result.connection.account).toBe('alice@example.com');
  expect(JSON.stringify(result)).not.toContain('refresh-secret');
  expect(exchange.mock.calls[0][0].code_verifier).toBeTruthy();
  await expect(finishGoogle(db, uid, request)).rejects.toThrow('expired');
  expect(exchange).toHaveBeenCalledOnce();
  await expect(beginGoogle(db, uid, {provider: 'google_drive'}, 'https://evil.example')).rejects.toThrow('SaveMe');
});
it('rejects expired authorization and partially granted Google permissions', async () => {
  const first = await beginGoogle(db, uid, {provider: 'google_calendar'}, 'https://saveme.space');
  await db.collection('nova_oauth_states').doc(connectionId(uid, 'google_calendar')).update({expires_at: stamp(0)});
  await expect(finishGoogle(db, uid, {...first, code: 'code'})).rejects.toThrow('expired');
  const next = await beginGoogle(db, uid, {provider: 'google_calendar'}, 'https://saveme.space');
  vi.spyOn(connectionDependencies, 'googleToken').mockResolvedValue({access_token: 'access', refresh_token: 'refresh', scope: 'openid email'});
  await expect(finishGoogle(db, uid, {...next, code: 'code'})).rejects.toThrow('not granted');
  expect((await db.collection('nova_connections').doc(connectionId(uid, 'google_calendar')).get()).exists).toBe(false);
});
