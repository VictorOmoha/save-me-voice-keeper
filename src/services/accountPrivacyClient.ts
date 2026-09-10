import {auth} from '@/lib/firebase';
import {getCloudFunctionUrl} from '@/utils/cloudFunctions';

async function post(path: string, body = {}): Promise<Record<string, unknown>> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in again to continue.');
  const response = await fetch(getCloudFunctionUrl(path), {method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${await user.getIdToken()}`}, body:JSON.stringify(body), signal:AbortSignal.timeout(path === 'accountExport' ? 550_000 : 60_000)});
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'The request could not finish. Please try again.');
  return result;
}
export async function exportAccount(): Promise<string> {
  const result = await post('accountExport');
  if (typeof result.url !== 'string' || new URL(result.url).protocol !== 'https:') throw new Error('The export download link is invalid.');
  return result.url;
}
export async function requestAccountDeletion(): Promise<string> {
  const result = await post('accountDelete', {confirmation:'DELETE'});
  if (result.status !== 'pending' || typeof result.receiptId !== 'string') throw new Error('Deletion was not confirmed. Please try again.');
  return result.receiptId;
}
