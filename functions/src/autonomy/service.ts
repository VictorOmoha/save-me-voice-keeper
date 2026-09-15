import * as admin from 'firebase-admin';
import {createHash} from 'crypto';
import {newRun, requiresApproval} from './policy';
import {dataOf, stamp} from './store';

export class AgentRequestError extends Error {
  constructor(public status: number, message: string) {super(message);}
}

export async function createRun(db: admin.firestore.Firestore, uid: string, body: Record<string, unknown>): Promise<string> {
  if (typeof body.goal !== 'string') throw new AgentRequestError(400, 'A goal is required');
  if (typeof body.requestId !== 'string' || !/^[\w-]{12,80}$/.test(body.requestId)) throw new AgentRequestError(400, 'Invalid request id');
  const id = createHash('sha256').update(`${uid}:${body.requestId}`).digest('hex');
  const ref = db.collection('nova_agent_runs').doc(id);
  const run = newRun(uid, body.goal, body, stamp());
  await db.runTransaction(async tx => {
    const existing = dataOf(await tx.get(ref));
    if (existing) {
      if (existing.user_id !== uid || existing.goal !== run.goal) throw new AgentRequestError(409, 'This request was already used for another goal');
      return;
    }
    if ((await tx.get(db.collection('account_deletions').doc(uid))).exists) throw new AgentRequestError(403, 'Account deletion is in progress');
    for (const connectionId of run.connection_ids || []) {
      const connection = (await tx.get(db.collection('nova_connections').doc(connectionId))).data();
      if (connection?.user_id !== uid) throw new AgentRequestError(400, 'An application is no longer connected. Refresh and try again.');
    }
    const lock = db.collection('nova_agent_accounts').doc(uid);
    const account = (await tx.get(lock)).data();
    const day = new Date().toISOString().slice(0, 10);
    const createdToday = account?.day === day ? Number(account.created_today) || 0 : 0;
    if (createdToday >= 10) throw new AgentRequestError(429, 'You can start up to 10 goals per day. Please try again tomorrow.');
    const active = await tx.get(db.collection('nova_agent_runs').where('user_id', '==', uid).where('status', 'in', ['queued', 'running', 'paused', 'waiting']).limit(3));
    if (active.size >= 3) throw new AgentRequestError(409, 'Finish or cancel an existing goal before starting another. You can have three open goals.');
    tx.set(lock, {updated_at: stamp(), day, created_today: createdToday + 1});
    tx.create(ref, run);
  });
  return id;
}

export async function controlRun(db: admin.firestore.Firestore, uid: string, body: Record<string, unknown>): Promise<void> {
  if (typeof body.runId !== 'string' || !/^[a-f0-9]{64}$/.test(body.runId)) throw new AgentRequestError(400, 'Invalid run id');
  const ref = db.collection('nova_agent_runs').doc(body.runId);
  await db.runTransaction(async tx => {
    const run = dataOf(await tx.get(ref));
    if (!run || run.user_id !== uid) throw new AgentRequestError(404, 'Goal not found');
    if ((await tx.get(db.collection('account_deletions').doc(uid))).exists) throw new AgentRequestError(403, 'Account deletion is in progress');
    if (['completed', 'cancelled', 'failed'].includes(run.status)) throw new AgentRequestError(409, 'This goal has ended. Start a new goal to continue.');
    const reset = {lease: null, lease_until: 0, updated_at: stamp()};
    if (body.operation === 'cancel') {
      tx.update(ref, {...reset, status: 'cancelled', pending: null, pending_id: '', approved: false, question: ''});
    } else if (body.operation === 'pause' && ['queued', 'running'].includes(run.status)) {
      tx.update(ref, {...reset, status: 'paused'});
    } else if (body.operation === 'resume' && run.status === 'paused') {
      tx.update(ref, {...reset, status: 'queued', next_run_at: stamp()});
    } else if (['approve', 'reject'].includes(String(body.operation)) && run.status === 'waiting' && run.pending && requiresApproval(run.pending, run)) {
      if (body.pendingId !== run.pending_id) throw new AgentRequestError(409, 'This action changed. Review the current action first.');
      tx.update(ref, {...reset, status: 'queued', next_run_at: stamp(), question: '', approved: body.operation === 'approve',
        ...(body.operation === 'reject' ? {pending: null, pending_id: '', notes: [...run.notes, `User rejected ${run.pending.tool}: ${JSON.stringify(run.pending.args).slice(0, 1000)}. Find another approach.`].slice(-12)} : {})});
    } else if (body.operation === 'reply' && run.status === 'waiting' && !run.pending) {
      if (body.expectedSteps !== run.steps.length) throw new AgentRequestError(409, 'This question changed. Refresh and answer the current question.');
      if (typeof body.answer !== 'string' || !body.answer.trim() || body.answer.length > 4000) throw new AgentRequestError(400, 'Enter a reply of up to 4000 characters');
      tx.update(ref, {...reset, status: 'queued', next_run_at: stamp(), question: '', notes: [...run.notes, body.answer.trim()].slice(-12)});
    } else throw new AgentRequestError(409, 'That action is not available for this goal');
  });
}
