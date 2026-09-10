import * as admin from 'firebase-admin';
import {randomUUID} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {assertFails, assertSucceeds, initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import {getBytes, ref, uploadBytes} from 'firebase/storage';
import {assertEmulatorOnly} from './emulator-guard';
import {ACCOUNT_COLLECTIONS} from '../../functions/src/privacy/accountResources';
import {createAccountArchive, purgeAccount} from '../../functions/src/privacy/accountFunctions';

test('exports original bytes and owned records, locks access, and deletes only the requested account', async () => {
  const projectId=assertEmulatorOnly({projectId:process.env.EMULATOR_PROJECT_ID || 'demo-saveme'});
  if (!admin.apps.length) admin.initializeApp({projectId,storageBucket:`${projectId}.appspot.com`});
  const db=admin.firestore(), bucket=admin.storage().bucket();
  const uid=`privacy-${randomUUID()}`, other=`privacy-${randomUUID()}`;
  const env=await initializeTestEnvironment({projectId,firestore:{rules:readFileSync('firestore.rules','utf8'),host:'127.0.0.1',port:8080},storage:{rules:readFileSync('storage.rules','utf8'),host:'127.0.0.1',port:9199}});
  const original=Buffer.from('Synthetic upload: spare keys in the blue drawer.');
  try {
    await admin.auth().createUser({uid}); await admin.auth().createUser({uid:other});
    for(const owner of [uid,other]) {
      for(const resource of ACCOUNT_COLLECTIONS) await db.collection(resource.name).doc(owner).set({[resource.owner === 'documentId' ? 'user_id' : resource.owner]:owner,title:'Synthetic account record',refreshTokenHash:'must-not-export',settings:{elevenlabs_api_key:'must-not-export'}});
      await bucket.file(`documents/${owner}/example/note.txt`).save(original,{metadata:{contentType:'text/plain'}});
    }
    const path=await createAccountArchive(uid,randomUUID());
    const [bytes]=await bucket.file(path).download();
    const archive=JSON.parse(gunzipSync(bytes).toString());
    expect(archive.resources).toHaveLength(ACCOUNT_COLLECTIONS.length);
    expect(JSON.stringify(archive)).not.toContain(other);
    expect(JSON.stringify(archive)).not.toContain('must-not-export');
    expect(Buffer.from(archive.originalFiles[0].content,'base64')).toEqual(original);
    const client=env.authenticatedContext(uid);
    expect(Buffer.from(await assertSucceeds(getBytes(ref(client.storage(`gs://${bucket.name}`),path))))).toEqual(bytes);
    await assertFails(getBytes(ref(env.authenticatedContext(other).storage(`gs://${bucket.name}`),path)));
    await assertFails(getBytes(ref(env.unauthenticatedContext().storage(`gs://${bucket.name}`),path)));
    await assertFails(uploadBytes(ref(client.storage(`gs://${bucket.name}`),path),original));
    await assertSucceeds(getDoc(doc(client.firestore(),'entries',uid)));
    await db.collection('account_deletions').doc(uid).set({receiptId:randomUUID(),status:'pending',finalizeAfter:Date.now()+600_000,leaseUntil:0});
    await assertFails(getDoc(doc(client.firestore(),'entries',uid)));
    await assertFails(getBytes(ref(client.storage(`gs://${bucket.name}`),path)));
    await assertFails(setDoc(doc(client.firestore(),'entries','late-write'),{user_id:uid}));
    await assertFails(uploadBytes(ref(client.storage(`gs://${bucket.name}`),`documents/${uid}/late/note.txt`),original,{contentType:'text/plain'}));
    await purgeAccount(uid);
    expect((await admin.auth().getUser(uid)).disabled).toBe(true);
    expect((await db.collection('account_deletions').doc(uid).get()).data()?.status).toBe('pending');
    // Simulate an in-flight trusted write and the final scheduled pass.
    await db.collection('nova_memories').doc('late-derived').set({user_id:uid});
    await db.collection('account_deletions').doc(uid).update({finalizeAfter:0});
    await purgeAccount(uid); await purgeAccount(uid); // completed retries are harmless
    await expect(admin.auth().getUser(uid)).rejects.toMatchObject({code:'auth/user-not-found'});
    for(const resource of ACCOUNT_COLLECTIONS) {
      expect((await db.collection(resource.name).doc(uid).get()).exists).toBe(false);
      expect((await db.collection(resource.name).doc(other).get()).exists).toBe(true);
    }
    expect((await db.collection('nova_memories').doc('late-derived').get()).exists).toBe(false);
    expect((await bucket.getFiles({prefix:`documents/${uid}/`}))[0]).toHaveLength(0);
    expect((await bucket.getFiles({prefix:`account-exports/${uid}/`}))[0]).toHaveLength(0);
    expect((await bucket.getFiles({prefix:`documents/${other}/`}))[0]).toHaveLength(1);
  } finally {await env.cleanup();}
},120_000);
