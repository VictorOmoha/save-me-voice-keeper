import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {randomUUID} from 'crypto';
import {Readable} from 'stream';
import {pipeline} from 'stream/promises';
import {createGzip} from 'zlib';
import {withCors} from '../common/http';
import {verifyAuth} from '../common/auth';
import {enforceAbuseControls, sendAbuseError} from '../common/abuseControl';
import {assertRecentAuth} from './safety';
import {getStripeClient} from '../billing/stripeClient';
import {customerBelongsToUser} from '../billing/core';
import {ACCOUNT_COLLECTIONS, ACCOUNT_FILE_PREFIXES, base64Chunks, exportSafeValue, safeAccountUid} from './accountResources';

const accountBucket = () => admin.storage().bucket();
const NO_CACHE = {'Cache-Control': 'no-store'};
const json = (value: unknown) => JSON.stringify(exportSafeValue(value));

async function* ownedDocuments(uid: string, name: string, owner: string): AsyncGenerator<admin.firestore.DocumentSnapshot> {
  const collection = admin.firestore().collection(name);
  if (owner === 'documentId') {
    const snapshot = await collection.doc(uid).get();
    if (snapshot.exists) yield snapshot;
    // storage_usage previously used both document IDs and user_id ownership.
    if (name !== 'storage_usage') return;
    owner = 'user_id';
  }
  let cursor: admin.firestore.DocumentSnapshot | undefined;
  for (;;) {
    let query = collection.where(owner, '==', uid).orderBy(admin.firestore.FieldPath.documentId()).limit(200);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) return;
    for (const document of page.docs) if (!(name === 'storage_usage' && document.id === uid)) yield document;
    cursor = page.docs[page.docs.length - 1];
  }
}

export async function createAccountArchive(uid: string, archiveId: string): Promise<string> {
  safeAccountUid(uid);
  const bucket = accountBucket();
  const path = `account-exports/${uid}/${archiveId}.json.gz`;
  async function* archive() {
    yield `{"schema":"saveme.account-export/v1","createdAt":${json(new Date())},"account":`;
    const user = await admin.auth().getUser(uid);
    yield json({uid, email: user.email, displayName: user.displayName, createdAt: user.metadata.creationTime});
    yield ',"resources":[';
    let first = true;
    for (const {name, owner} of ACCOUNT_COLLECTIONS) {
      for await (const snapshot of ownedDocuments(uid, name, owner)) {
        if (!first) yield ','; first = false;
        yield json({collection: name, id: snapshot.id, data: snapshot.data()});
      }
    }
    yield '],"originalFiles":[';
    first = true;
    for (const prefix of ACCOUNT_FILE_PREFIXES) {
      const stream = bucket.getFilesStream({prefix: `${prefix}/${uid}/`});
      for await (const file of stream) {
        const [metadata] = await file.getMetadata();
        if (!first) yield ','; first = false;
        yield `{"path":${json(file.name)},"mediaType":${json(metadata.contentType || 'application/octet-stream')},"sizeBytes":${Number(metadata.size)},"encoding":"base64","content":"`;
        for await (const chunk of base64Chunks(file.createReadStream())) yield chunk;
        yield '"}';
      }
    }
    yield `],"scope":${json({excluded: ['Credentials and secrets', 'Provider security logs and legally retained billing records', 'Unsynced data on other devices'], consistency: 'Records and files as read during export; avoid editing until it finishes.'})}}`;
  }
  try {
    await pipeline(Readable.from(archive()), createGzip(), bucket.file(path).createWriteStream({resumable: false, metadata: {
      contentType: 'application/gzip', cacheControl: 'private, no-store',
      contentDisposition: 'attachment; filename="saveme-account-export.json.gz"',
      metadata: {expiresAt: String(Date.now() + 86_400_000)},
    }}));
    return path;
  } catch (error) { await bucket.file(path).delete({ignoreNotFound: true}).catch(() => undefined); throw error; }
}

async function recentUser(req: functions.https.Request, res: functions.Response) {
  const user = await verifyAuth(req);
  if (!user) {res.status(401).json({error: 'Sign in again to continue.'}); return null;}
  try { assertRecentAuth(user.uid, {assertedUid: user.uid, authenticatedAtMs: user.auth_time * 1000}, Date.now()); }
  catch {res.status(401).json({error: 'For your security, sign in again before exporting or deleting your account.'}); return null;}
  if ((await admin.firestore().collection('account_deletions').doc(user.uid).get()).exists) {
    res.status(409).json({error: 'Account deletion has already been requested.'}); return null;
  }
  return user;
}

export const accountExport = functions.runWith({timeoutSeconds: 540, memory: '512MB'}).https.onRequest(withCors(async (req, res) => {
  res.set(NO_CACHE);
  if (req.method !== 'POST') return void res.status(405).json({error: 'Method not allowed'});
  const user = await recentUser(req, res); if (!user) return;
  try {
    await enforceAbuseControls({endpoint: 'accountExport', user, req, policies: [{name:'hourly', limit:3, windowMs:3_600_000}]});
    const path = await createAccountArchive(user.uid, randomUUID());
    // A deletion requested while exporting must not leave an archive behind.
    if ((await admin.firestore().collection('account_deletions').doc(user.uid).get()).exists) {
      await accountBucket().file(path).delete({ignoreNotFound:true});
      return void res.status(409).json({error: 'Export canceled because account deletion was requested.'});
    }
    const expiresAt = Date.now() + 15 * 60_000;
    const [url] = await accountBucket().file(path).getSignedUrl({action:'read', expires:expiresAt});
    res.json({url, expiresAt, format:'json.gz'});
  } catch (error) {
    if (sendAbuseError(res,error)) return;
    console.error('Account export failed', {uid:user.uid, error: error instanceof Error ? error.name : 'unknown'});
    res.status(503).json({error:'Export could not finish. No partial archive was returned. Please try again or contact support.'});
  }
}));

const removeAuth = async (uid: string, remove: boolean) => {
  try {
    if (remove) await admin.auth().deleteUser(uid);
    else {await admin.auth().updateUser(uid, {disabled:true}); await admin.auth().revokeRefreshTokens(uid);}
  } catch (error) {if ((error as {code?:string}).code !== 'auth/user-not-found') throw error;}
};

export const accountDelete = functions.https.onRequest(withCors(async (req, res) => {
  res.set(NO_CACHE);
  if (req.method !== 'POST') return void res.status(405).json({error:'Method not allowed'});
  const user = await recentUser(req,res); if (!user) return;
  if (req.body?.confirmation !== 'DELETE') return void res.status(400).json({error:'Type DELETE to confirm.'});
  const uid = safeAccountUid(user.uid);
  const ref = admin.firestore().collection('account_deletions').doc(uid);
  const receiptId = randomUUID();
  // Creating this server-only record blocks Firestore/Storage access immediately.
  await ref.create({receiptId, status:'pending', requestedAt:Date.now(), finalizeAfter:Date.now()+10*60_000, nextAttemptAt:Date.now(), leaseUntil:0});
  await removeAuth(uid,false).catch(() => console.warn('Deletion worker will retry access revocation'));
  res.status(202).json({receiptId, status:'pending'});
}));

export async function purgeAccount(uid: string): Promise<void> {
  safeAccountUid(uid);
  const db = admin.firestore(), ref = db.collection('account_deletions').doc(uid);
  const job = await db.runTransaction(async tx => {
    const snapshot = await tx.get(ref), data = snapshot.data();
    if (!data || data.status === 'completed' || data.leaseUntil > Date.now()) return null;
    tx.update(ref,{leaseUntil:Date.now()+10*60_000,nextAttemptAt:Date.now()+10*60_000}); return data;
  });
  if (!job) return;
  try {
    await removeAuth(uid,false);
    for (const name of ['api_keys','extensionCredentials','extensionAccessTokens','extensionPairingCodes']) {
      for await (const snapshot of ownedDocuments(uid,name,name === 'api_keys' ? 'user_id' : 'userId')) await db.recursiveDelete(snapshot.ref);
    }
    // Hang up live calls before deleting the call identifiers.
    for await (const snapshot of ownedDocuments(uid,'nova_conversations','user_id')) {
      const callId = snapshot.data()?.call_id;
      if (typeof callId === 'string' && /^[\w-]{1,160}$/.test(callId)) {
        const result = await fetch(`https://api.openai.com/v1/realtime/calls/${callId}/hangup`, {method:'POST', headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`}, signal:AbortSignal.timeout(10_000)});
        if (!result.ok && ![404,410].includes(result.status)) throw new Error('Voice hangup failed');
      }
    }
    const customerId = (await db.collection('users').doc(uid).get()).data()?.stripeCustomerId;
    if (customerId) {
      const stripe = getStripeClient(), customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted) {
        if (!customerBelongsToUser(customer,uid)) throw new Error('Billing owner mismatch');
        await stripe.customers.del(customerId); // Stripe cancels subscriptions when the customer is deleted.
      }
    }
    for (const {name,owner} of ACCOUNT_COLLECTIONS) {
      for await (const snapshot of ownedDocuments(uid,name,owner)) await db.recursiveDelete(snapshot.ref);
    }
    for (const prefix of [...ACCOUNT_FILE_PREFIXES,'account-exports']) await accountBucket().deleteFiles({prefix:`${prefix}/${uid}/`, force:true});
    // A second sweep after the longest function deadline removes writes already in flight.
    if (Date.now() < job.finalizeAfter) {await ref.update({leaseUntil:0,nextAttemptAt:job.finalizeAfter}); return;}
    await removeAuth(uid,true);
    await ref.update({status:'completed',completedAt:Date.now(),leaseUntil:0,nextAttemptAt:admin.firestore.FieldValue.delete()});
  } catch (error) {
    await ref.update({leaseUntil:0,lastAttemptAt:Date.now(),nextAttemptAt:Date.now()+5*60_000});
    console.error('Account cleanup requires retry',{receiptId:job.receiptId,error:error instanceof Error ? error.name : 'unknown'});
    throw error;
  }
}

export const accountDeletionWorker = functions.runWith({timeoutSeconds:540,memory:'512MB',failurePolicy:true}).firestore.document('account_deletions/{uid}').onCreate(async (_snapshot, context) => purgeAccount(context.params.uid));

export const accountPrivacyMaintenance = functions.runWith({timeoutSeconds:540,memory:'512MB'}).pubsub.schedule('every 5 minutes').onRun(async () => {
  const db=admin.firestore();
  const pending=await db.collection('account_deletions').where('nextAttemptAt','<=',Date.now()).limit(20).get();
  for (const snapshot of pending.docs) await purgeAccount(snapshot.id).catch(() => undefined);
  const cutoff=Date.now()-30*86_400_000;
  const completed=await db.collection('account_deletions').where('completedAt','<',cutoff).limit(100).get();
  for (const snapshot of completed.docs) await snapshot.ref.delete();
  for await (const file of accountBucket().getFilesStream({prefix:'account-exports/'})) {
    const [metadata]=await file.getMetadata();
    if (Number(metadata.metadata?.expiresAt || 0) < Date.now()) await file.delete({ignoreNotFound:true});
  }
});
