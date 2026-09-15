import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {verifyAuth} from '../common/auth';
import {withCors} from '../common/http';
import {assertUtf8Bytes, enforceAbuseControls, sendAbuseError} from '../common/abuseControl';
import {assertVoiceAiAccess, readUserEntitlements, sendEntitlementError} from '../entitlements/entitlements';
import {AgentRequestError, controlRun, createRun} from './service';
import {runAgent} from './runner';
import {stamp} from './store';

export const novaAgent = functions.runWith({timeoutSeconds: 60, memory: '256MB'}).https.onRequest(withCors(async (req, res) => {
  const user = await verifyAuth(req);
  if (!user) {res.status(401).json({error: 'Sign in to use Nova goals'}); return;}
  if (req.method !== 'POST') {res.status(405).json({error: 'Use POST'}); return;}
  res.set('Cache-Control', 'no-store');
  try {
    assertUtf8Bytes(req.body, 12000);
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new AgentRequestError(400, 'Invalid request');
    const db = admin.firestore();
    const operation = req.body.operation;
    if (operation === 'create') {
      if (!process.env.OPENAI_API_KEY) throw new AgentRequestError(503, 'Background goals are not configured yet');
      await enforceAbuseControls({endpoint: 'novaAgentCreate', req, user, policies: [{name: 'daily', limit: 10, windowMs: 86400000}, {name: 'burst', limit: 3, windowMs: 60000}]});
      assertVoiceAiAccess(await readUserEntitlements(user.uid, db));
      const runId = await createRun(db, user.uid, req.body);
      res.json({runId});
    } else if (operation === 'status') {
      res.json({available: Boolean(process.env.OPENAI_API_KEY), maxOpenGoals: 3, maxSteps: 30});
    } else {
      await enforceAbuseControls({endpoint: 'novaAgentControl', req, user, policies: [{name: 'minute', limit: 30, windowMs: 60000}]});
      await controlRun(db, user.uid, req.body);
      res.json({success: true});
    }
  } catch (error) {
    if (sendAbuseError(res, error) || sendEntitlementError(res, error)) return;
    if (error instanceof AgentRequestError) {res.status(error.status).json({error: error.message}); return;}
    // Validation errors contain no provider payloads or secrets.
    if (error instanceof Error && /Describe a goal|Choose between|Invalid write/.test(error.message)) {res.status(400).json({error: error.message}); return;}
    console.error('Nova goal request failed', {operation: req.body?.operation});
    res.status(503).json({error: 'Nova could not update this goal. Please try again.'});
  }
}));

export const novaAgentCreated = functions.runWith({timeoutSeconds: 540, memory: '512MB'})
  .firestore.document('nova_agent_runs/{runId}').onCreate(async snap => {await runAgent(snap.ref);});

export const novaAgentScheduler = functions.runWith({timeoutSeconds: 540, memory: '512MB'})
  .pubsub.schedule('every 1 minutes').onRun(async () => {
    const db = admin.firestore();
    const jobs = await db.collection('nova_agent_runs').where('status', 'in', ['queued', 'running'])
      .where('next_run_at', '<=', stamp()).orderBy('next_run_at').limit(4).get();
    // Expired leases are eligible too, so a terminated instance cannot strand a run.
    for (let offset = 0; offset < jobs.size; offset += 2) {
      const outcomes = await Promise.allSettled(jobs.docs.slice(offset, offset + 2).map(job => runAgent(job.ref)));
      if (outcomes.some(outcome => outcome.status === 'rejected')) console.error('A Nova goal worker could not claim or checkpoint its run; the scheduler will retry.');
    }
  });
