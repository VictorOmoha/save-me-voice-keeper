import type {User} from 'firebase/auth';
import type {Timestamp} from 'firebase/firestore';
import {getCloudFunctionUrl} from '@/utils/cloudFunctions';
import {auth} from '@/lib/firebase';

export interface NovaGoal {
  id: string; user_id: string; goal: string;
  status: 'queued' | 'running' | 'paused' | 'waiting' | 'completed' | 'failed' | 'cancelled';
  write_mode: 'auto' | 'review'; allow_web: boolean; max_steps: number;
  connection_ids?: string[];
  steps: {number: number; tool: string; summary: string; result: string; at: string}[];
  plan: string[]; result: string; question: string;
  pending: {tool: string; args: Record<string, unknown>} | null; pending_id: string;
  sources: {title: string; url: string}[]; outputs: {id: string; title: string}[];
  next_run_at?: Timestamp;
}

export async function goalRequest<T = {success: boolean}>(user: Pick<User, 'uid'>, body: Record<string, unknown>): Promise<T> {
  // AuthContext exposes a spread profile; Firebase's prototype methods live on the session.
  const session = auth.currentUser;
  if (!session || session.uid !== user.uid) throw new Error('Sign in again to continue.');
  const token = await session.getIdToken();
  if (auth.currentUser?.uid !== user.uid) throw new Error('Your account changed. Please try again.');
  const response = await fetch(getCloudFunctionUrl('novaAgent'), {method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
    body: JSON.stringify(body), signal: AbortSignal.timeout(60000)});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : data.error?.message || 'Could not update this goal. Please try again.');
  return data as T;
}

export const goalStatus: Record<NovaGoal['status'], string> = {
  queued: 'Scheduled', running: 'Working', paused: 'Paused', waiting: 'Needs you', completed: 'Completed', failed: 'Stopped', cancelled: 'Cancelled',
};
export const ended = (goal: NovaGoal) => ['completed', 'failed', 'cancelled'].includes(goal.status);
