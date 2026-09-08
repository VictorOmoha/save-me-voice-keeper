import {readFileSync, writeFileSync} from 'node:fs';

// gcloud's captured response stays in the runner's temporary directory. Never
// print environment values or copy the response into a deployment archive.
const deployed = JSON.parse(readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, ''));
const project = 'saveme-f5af0';
if (deployed.name !== `projects/${project}/locations/us-central1/functions/createCheckout`) {
  throw new Error('Unexpected source function for production environment');
}
const reserved = /^(FIREBASE_|GOOGLE_|GCLOUD_|GCP_|X_GOOGLE_|EXT_|CLOUD_RUNTIME_CONFIG$|EVENTARC_|PORT$|K_SERVICE$|K_REVISION$|K_CONFIGURATION$)/;
const env = Object.fromEntries(Object.entries(deployed.environmentVariables || {}).filter(([name]) => !reserved.test(name)));
// GOOGLE_TTS_API_KEY is an application setting, not a platform variable.
if (deployed.environmentVariables?.GOOGLE_TTS_API_KEY) env.GOOGLE_TTS_API_KEY = deployed.environmentVariables.GOOGLE_TTS_API_KEY;
for (const name of ['STRIPE_MODE', 'STRIPE_LIVE_BASIC_MONTHLY_PRICE_ID', 'STRIPE_LIVE_PREMIUM_MONTHLY_PRICE_ID']) {
  if (!process.env[name]?.trim()) throw new Error(`Missing ${name}`);
  env[name] = process.env[name].trim();
}
for (const name of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'GEMINI_API_KEY', 'OPENAI_API_KEY']) {
  if (!env[name]?.trim()) throw new Error(`Existing production function is missing ${name}`);
}
if (env.STRIPE_MODE !== 'live' || !env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
  throw new Error('Production Stripe mode and credential do not match');
}
if (env.STRIPE_LIVE_BASIC_MONTHLY_PRICE_ID === env.STRIPE_LIVE_PREMIUM_MONTHLY_PRICE_ID) {
  throw new Error('Basic and Premium prices must differ');
}
const lines = Object.entries(env).map(([name, value]) => {
  if (!/^[A-Z][A-Z0-9_]*$/.test(name) || typeof value !== 'string' || /[\r\n"\\]/.test(value)) {
    throw new Error(`Unsupported dotenv setting: ${name}`);
  }
  return `${name}="${value}"`;
});
writeFileSync(`functions/.env.${project}`, `${lines.join('\n')}\n`, {mode: 0o600});
console.log('Preserved existing runtime settings and applied verified billing configuration.');
