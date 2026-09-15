import {auth} from '@/lib/firebase';
import {getCloudFunctionUrl} from '@/utils/cloudFunctions';

export interface AppConnection {
  id: string; provider: 'google_calendar' | 'google_drive' | 'mcp'; name: string; account: string; revision: string;
  endpoint?: string; enabled_tools: string[];
  tools: {name: string; description: string; inputSchema: Record<string, unknown>}[];
}
export interface ConnectionList {connections: AppConnection[]; googleAvailable: boolean}
export async function connectionRequest<T = {success: boolean}>(uid: string, body: Record<string, unknown>): Promise<T> {
  const session = auth.currentUser;
  if (!session || session.uid !== uid) throw new Error('Sign in again to manage connections.');
  const token = await session.getIdToken();
  if (auth.currentUser?.uid !== uid) throw new Error('Your account changed. Please try again.');
  const response = await fetch(getCloudFunctionUrl('novaConnections'), {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`}, body: JSON.stringify(body), signal: AbortSignal.timeout(150000)});
  const data = await response.json().catch(() => ({}));
  if (auth.currentUser?.uid !== uid) throw new Error('Your account changed. Please try again.');
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not update the connection. Please try again.');
  return data as T;
}

export const GOOGLE_RETURN_KEY = 'saveme.google-connection';
export function validateGoogleReturn(raw: string | null, uid: string, state: string) {
  let pending;
  try {pending = JSON.parse(raw || 'null');} catch { /* Invalid local state must never finish authorization. */ }
  if (!pending || pending.uid !== uid || pending.state !== state || pending.expires < Date.now() || !['google_calendar', 'google_drive'].includes(pending.provider)) throw new Error('This connection belongs to another session or has expired. Please connect again.');
  return pending as {provider: 'google_calendar' | 'google_drive'; uid: string; state: string; expires: number};
}
