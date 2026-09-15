import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {verifyAuth} from '../common/auth';
import {withCors} from '../common/http';
import {assertUtf8Bytes, enforceAbuseControls, sendAbuseError} from '../common/abuseControl';
import {beginGoogle, changeConnection, finishGoogle, listConnections, saveMcp} from './service';
import {ConnectionError} from './types';

export const novaConnections = functions.runWith({timeoutSeconds: 180, memory: '256MB'}).https.onRequest(withCors(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.method !== 'POST') {res.status(405).json({error: 'Use POST'}); return;}
  const user = await verifyAuth(req);
  if (!user) {res.status(401).json({error: 'Sign in to manage connections'}); return;}
  try {
    assertUtf8Bytes(req.body, 20000);
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new ConnectionError('Invalid request');
    await enforceAbuseControls({endpoint: 'novaConnections', req, user, policies: [{name: 'minute', limit: 30, windowMs: 60000}]});
    const db = admin.firestore();
    if ((await db.collection('account_deletions').doc(user.uid).get()).exists) throw new ConnectionError('Account deletion is in progress', 403);
    if (req.body.operation === 'list') res.json({connections: await listConnections(db, user.uid), googleAvailable: Boolean(process.env.NOVA_GOOGLE_CLIENT_ID && process.env.NOVA_GOOGLE_CLIENT_SECRET)});
    else if (req.body.operation === 'google_start') res.json(await beginGoogle(db, user.uid, req.body, req.get('origin')));
    else if (req.body.operation === 'google_finish') res.json(await finishGoogle(db, user.uid, req.body));
    else if (req.body.operation === 'mcp_save') res.json(await saveMcp(db, user.uid, req.body));
    else if (req.body.operation === 'disconnect' || req.body.operation === 'tools') res.json(await changeConnection(db, user.uid, req.body));
    else throw new ConnectionError('Unknown connection operation');
  } catch (error) {
    if (sendAbuseError(res, error)) return;
    if (error instanceof ConnectionError) {res.status(error.status).json({error: error.message}); return;}
    // Never log authorization codes, bearer tokens, or provider response bodies.
    console.error('Nova connection request failed', {operation: req.body?.operation});
    res.status(503).json({error: 'Could not update this connection. Please try again.'});
  }
}));
