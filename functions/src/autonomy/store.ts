import * as admin from 'firebase-admin';
import {randomUUID} from 'crypto';
import {AgentRun, isActive} from './policy';

export const stamp = (now = Date.now()) => admin.firestore.Timestamp.fromMillis(now);
export const dataOf = (snap: admin.firestore.DocumentSnapshot) => snap.data() as AgentRun | undefined;

export async function claimRun(ref: admin.firestore.DocumentReference): Promise<{run: AgentRun; lease: string} | null> {
  const now = Date.now();
  const lease = randomUUID();
  return ref.firestore.runTransaction(async tx => {
    const run = dataOf(await tx.get(ref));
    if (!run || !['queued', 'running'].includes(run.status) || run.lease_until > now ||
      (run.next_run_at as admin.firestore.Timestamp).toMillis() > now) return null;
    if ((await tx.get(ref.firestore.collection('account_deletions').doc(run.user_id))).exists) return null;
    const update = {status: 'running' as const, lease, lease_until: now + 240000, next_run_at: stamp(now + 240000), updated_at: stamp(now)};
    tx.update(ref, update);
    return {run: {...run, ...update}, lease};
  });
}

/** Fence every checkpoint and side effect with the current lease and deletion lock. */
export async function checkpoint(
  ref: admin.firestore.DocumentReference,
  lease: string,
  change: (tx: admin.firestore.Transaction, run: AgentRun) => Promise<Partial<AgentRun>> | Partial<AgentRun>,
  pendingId?: string,
): Promise<AgentRun | null> {
  return ref.firestore.runTransaction(async tx => {
    const run = dataOf(await tx.get(ref));
    if (!run || !isActive(run, lease, Date.now())) return null;
    if (pendingId !== undefined && run.pending_id !== pendingId) return null;
    if ((await tx.get(ref.firestore.collection('account_deletions').doc(run.user_id))).exists) return null;
    const update = {...await change(tx, run), updated_at: stamp()};
    tx.update(ref, update);
    return {...run, ...update};
  });
}

export function notifyRun(tx: admin.firestore.Transaction, ref: admin.firestore.DocumentReference, run: AgentRun, status: string) {
  const id = `agent_${ref.id}_${run.steps.length}_${status}`;
  const text = status === 'completed' ? `Nova finished: ${run.goal.slice(0, 150)}` : `Nova needs your attention: ${run.goal.slice(0, 150)}`;
  tx.set(ref.firestore.collection('pending_notifications').doc(id), {user_id: run.user_id, type: 'automation', status: 'pending',
    text,
    run_id: ref.id, url: `/agent?run=${ref.id}`, created_at: stamp()});
  // Reuse the user's explicit push/email opt-ins and the delivery worker's retries.
  tx.set(ref.firestore.collection('reminder_deliveries').doc(id), {user_id: run.user_id, text, run_id: ref.id,
    notification_id: id, status: 'pending', attempts: 0, created_at: stamp(), next_attempt_at: stamp(), expires_at: stamp(Date.now() + 3600000)});
}
