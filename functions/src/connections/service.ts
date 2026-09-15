import * as admin from 'firebase-admin';
import {randomBytes, randomUUID} from 'crypto';
import {getAllowedOrigin} from '../billing/safety';
import {stamp} from '../autonomy/store';
import {Connection, ConnectionError, connectionId, digest, exactId, publicConnection, requiredText} from './types';
import {googleConfig, googleDependencies, googleToken, GOOGLE_SCOPES, GOOGLE_TOOLS} from './google';
import {externalUrl} from './transport';
import {openMcp} from './mcp';

export const connectionDependencies = {openMcp, googleToken};
export async function listConnections(db: admin.firestore.Firestore, uid: string) {
  const snapshot = await db.collection('nova_connections').where('user_id', '==', uid).limit(10).get();
  return snapshot.docs.map(doc => publicConnection(doc.id, doc.data() as Connection));
}
export async function ownedConnection(db: admin.firestore.Firestore, uid: string, id: unknown): Promise<Connection> {
  const doc = await db.collection('nova_connections').doc(exactId(id)).get();
  const value = doc.data() as Connection | undefined;
  if (!value || value.user_id !== uid) throw new ConnectionError('Connection unavailable. Open Settings → Connections to reconnect.', 404);
  return value;
}
async function accountActive(tx: admin.firestore.Transaction, db: admin.firestore.Firestore, uid: string) {
  if ((await tx.get(db.collection('account_deletions').doc(uid))).exists) throw new ConnectionError('Account deletion is in progress', 403);
}
export async function beginGoogle(db: admin.firestore.Firestore, uid: string, body: Record<string, unknown>, origin?: string) {
  const provider = body.provider;
  if (provider !== 'google_calendar' && provider !== 'google_drive') throw new ConnectionError('Choose Google Calendar or Google Drive');
  const allowed = getAllowedOrigin(origin);
  if (!allowed) throw new ConnectionError('Start the connection from SaveMe');
  const redirect = `${allowed}/settings`;
  const config = googleConfig();
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const id = connectionId(uid, provider);
  await db.runTransaction(async tx => {
    await accountActive(tx, db, uid);
    tx.set(db.collection('nova_oauth_states').doc(id), {user_id: uid, provider, state_hash: digest(state), verifier_secret: verifier, redirect_uri: redirect, expires_at: stamp(Date.now() + 600000)});
  });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({client_id: config.client_id, redirect_uri: redirect, response_type: 'code', access_type: 'offline', prompt: 'consent select_account',
    scope: `openid email ${GOOGLE_SCOPES[provider]}`, state, code_challenge: Buffer.from(digest(verifier), 'hex').toString('base64url'), code_challenge_method: 'S256'}).toString();
  return {url: url.toString(), state, provider};
}
export async function finishGoogle(db: admin.firestore.Firestore, uid: string, body: Record<string, unknown>) {
  const provider = body.provider;
  if (provider !== 'google_calendar' && provider !== 'google_drive') throw new ConnectionError('Invalid Google connection');
  const code = requiredText(body.code, 'authorization code', 4000);
  const state = requiredText(body.state, 'authorization state', 200);
  const id = connectionId(uid, provider);
  const stateRef = db.collection('nova_oauth_states').doc(id);
  const claimed = await db.runTransaction(async tx => {
    await accountActive(tx, db, uid);
    const pending = (await tx.get(stateRef)).data();
    if (!pending || pending.user_id !== uid || pending.state_hash !== digest(state) || pending.expires_at.toMillis() < Date.now() || pending.claimed) throw new ConnectionError('This connection request expired or was already used. Connect again.');
    tx.update(stateRef, {claimed: true});
    return pending;
  });
  const token = await connectionDependencies.googleToken({...googleConfig(), code, code_verifier: claimed.verifier_secret, redirect_uri: claimed.redirect_uri, grant_type: 'authorization_code'});
  const scopes = typeof token.scope === 'string' ? token.scope.split(' ') : [];
  if (!scopes.includes(GOOGLE_SCOPES[provider]) || typeof token.refresh_token !== 'string' || !token.refresh_token) throw new ConnectionError('The requested permission was not granted. Reconnect and allow access for this application.');
  const profile = await googleDependencies.request(new URL('https://openidconnect.googleapis.com/v1/userinfo'), {headers: {Authorization: `Bearer ${token.access_token}`}});
  if (profile.status !== 200) throw new ConnectionError('Could not identify the connected Google account. Connect again.');
  let account: string;
  try {account = requiredText(JSON.parse(profile.body).email, 'Google account', 320);} catch {throw new ConnectionError('Google did not share the account email. Connect again.');}
  const connection: Connection = {user_id: uid, provider, name: provider === 'google_calendar' ? 'Google Calendar' : 'Google Drive', account, revision: randomUUID(),
    tools: GOOGLE_TOOLS[provider], enabled_tools: GOOGLE_TOOLS[provider].map(tool => tool.name), credentials_secret: {refresh_token: token.refresh_token}, created_at: stamp(), updated_at: stamp()};
  await db.runTransaction(async tx => {
    await accountActive(tx, db, uid);
    const current = (await tx.get(stateRef)).data();
    if (!current || current.state_hash !== digest(state)) throw new ConnectionError('The connection was cancelled. Connect again.');
    tx.set(db.collection('nova_connections').doc(id), connection); tx.delete(stateRef);
  });
  return {connection: publicConnection(id, connection)};
}
export async function saveMcp(db: admin.firestore.Firestore, uid: string, body: Record<string, unknown>) {
  const endpoint = externalUrl(requiredText(body.endpoint, 'server URL')).toString();
  const name = requiredText(body.name, 'connection name', 80);
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const id = connectionId(uid, `mcp:${endpoint}`);
  const existing = (await db.collection('nova_connections').doc(id).get()).data() as Connection | undefined;
  const bearer = token || existing?.credentials_secret.bearer_token || '';
  const session = await connectionDependencies.openMcp(endpoint, bearer);
  let tools;
  try {tools = await session.list();} finally {await session.close();}
  const value: Connection = {user_id: uid, provider: 'mcp', name, account: new URL(endpoint).hostname, endpoint, revision: randomUUID(),
    tools, enabled_tools: [], credentials_secret: {bearer_token: bearer}, created_at: stamp(), updated_at: stamp()};
  await db.runTransaction(async tx => {
    await accountActive(tx, db, uid);
    const connections = await tx.get(db.collection('nova_connections').where('user_id', '==', uid).limit(10));
    if (!connections.docs.some(doc => doc.id === id) && connections.docs.filter(doc => doc.data().provider === 'mcp').length >= 8) throw new ConnectionError('You can connect up to eight external tool servers alongside Google Calendar and Drive');
    const current = (await tx.get(db.collection('nova_connections').doc(id))).data();
    if (current?.revision !== existing?.revision) throw new ConnectionError('This connection changed. Refresh and try again.', 409);
    tx.set(db.collection('nova_connections').doc(id), value);
  });
  return {connection: publicConnection(id, value)};
}
export async function changeConnection(db: admin.firestore.Firestore, uid: string, body: Record<string, unknown>) {
  const id = exactId(body.id);
  const ref = db.collection('nova_connections').doc(id);
  await db.runTransaction(async tx => {
    await accountActive(tx, db, uid);
    const value = (await tx.get(ref)).data() as Connection | undefined;
    if (!value || value.user_id !== uid) throw new ConnectionError('Connection not found', 404);
    if (body.revision !== value.revision) throw new ConnectionError('This connection changed. Refresh and try again.', 409);
    if (body.operation === 'disconnect') {
      tx.delete(ref);
      if (value.provider !== 'mcp') tx.delete(db.collection('nova_oauth_states').doc(id));
    } else {
      if (!Array.isArray(body.tools) || body.tools.length > 50 || body.tools.some(name => typeof name !== 'string' || !value.tools.some(tool => tool.name === name))) throw new ConnectionError('Choose tools from this connection');
      tx.update(ref, {enabled_tools: [...new Set(body.tools)], revision: randomUUID(), updated_at: stamp()});
    }
  });
  return {success: true};
}
