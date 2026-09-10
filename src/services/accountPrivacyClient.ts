import {auth, storage} from '@/lib/firebase';
import {getBlob, ref} from 'firebase/storage';
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
  const uid = auth.currentUser?.uid;
  const result = await post('accountExport');
  if (!uid || auth.currentUser?.uid !== uid || typeof result.storagePath !== 'string'
    || !result.storagePath.startsWith(`account-exports/${uid}/`)
    || !/^[\w-]+\.json\.gz$/.test(result.storagePath.slice(`account-exports/${uid}/`.length))) {
    throw new Error('The export download path is invalid.');
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const blob = await Promise.race([
      getBlob(ref(storage, result.storagePath)),
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('The archive download timed out. Please try again.')),550_000);}),
    ]);
    if (auth.currentUser?.uid !== uid) throw new Error('Sign in again to download your archive.');
    return URL.createObjectURL(blob);
  } finally {clearTimeout(timer);}
}
export async function requestAccountDeletion(): Promise<string> {
  const result = await post('accountDelete', {confirmation:'DELETE'});
  if (result.status !== 'pending' || typeof result.receiptId !== 'string') throw new Error('Deletion was not confirmed. Please try again.');
  return result.receiptId;
}
