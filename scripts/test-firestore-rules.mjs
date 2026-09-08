import assert from 'node:assert/strict';

// This harness deliberately refuses remote hosts or real Firebase projects.
const host = process.env.FIRESTORE_EMULATOR_HOST;
const project = process.env.GCLOUD_PROJECT || 'demo-saveme-audit';
if (!host || !/^(localhost|127\.0\.0\.1):\d+$/.test(host) || !project.startsWith('demo-')) {
  throw new Error('Run against a loopback Firestore emulator with a demo- project ID.');
}
const base = `http://${host}/v1/projects/${project}/databases/(default)/documents`;
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = uid => `${encode({alg: 'none', typ: 'JWT'})}.${encode({
  sub: uid, user_id: uid, aud: project, iss: `https://securetoken.google.com/${project}`,
  iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600,
  firebase: {sign_in_provider: 'custom', identities: {}},
})}.`;
const fields = values => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, {stringValue: value}]));
async function request(method, path, bearer, values) {
  return fetch(`${base}/${path}`, {
    method,
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${bearer}`},
    body: values === undefined ? undefined : JSON.stringify({fields: fields(values)}),
  });
}
async function expectStatus(response, status, message) {
  assert.equal(response.status, status, `${message}: ${await response.text()}`);
}

const suffix = Date.now().toString(36);
const alice = `alice-${suffix}`;
const bob = `bob-${suffix}`;
const userPath = `users/${alice}`;
await expectStatus(await request('PATCH', userPath, 'owner', {subscriptionTier: 'premium', stripeCustomerId: 'cus_alice'}), 200, 'Seed billing state');
await expectStatus(await request('GET', userPath, token(alice)), 200, 'Owner can read subscription');
await expectStatus(await request('GET', userPath, token(bob)), 403, 'Other users cannot read subscription');
await expectStatus(await request('PATCH', userPath, token(alice), {subscriptionTier: 'enterprise', stripeCustomerId: 'cus_bob'}), 403, 'Owner cannot forge billing state');
await expectStatus(await request('DELETE', userPath, token(alice)), 403, 'Owner cannot delete billing state');
await expectStatus(await request('PATCH', `users/${bob}`, token(bob), {subscriptionTier: 'premium'}), 403, 'Owner cannot create billing state');
await expectStatus(await request('PATCH', `profiles/${alice}`, token(alice), {full_name: 'Alice'}), 200, 'Profile remains editable');

const keyPath = `api_keys/key-${suffix}`;
await expectStatus(await request('PATCH', keyPath, 'owner', {user_id: alice, key_hash: 'test-hash'}), 200, 'Server can mint key');
await expectStatus(await request('GET', keyPath, token(alice)), 200, 'Owner can list key details');
await expectStatus(await request('DELETE', keyPath, token(alice)), 403, 'Key deletion requires the server revocation endpoint');
await expectStatus(await request('PATCH', keyPath, token(alice), {user_id: alice, key_hash: 'forged'}), 403, 'Owner cannot replace key hash');

const entryPath = `entries/entry-${suffix}`;
await expectStatus(await request('PATCH', entryPath, token(alice), {user_id: alice, title: 'Private entry'}), 200, 'Owner can create an entry');
await expectStatus(await request('PATCH', entryPath, token(alice), {user_id: bob, title: 'Transferred'}), 403, 'Entry ownership cannot change');
await expectStatus(await request('DELETE', entryPath, token(bob)), 403, 'Other users cannot delete entry');
console.log('Firestore emulator: 14 authorization checks passed.');
