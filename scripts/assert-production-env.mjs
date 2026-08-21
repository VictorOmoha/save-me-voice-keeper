#!/usr/bin/env node
/**
 * Fail closed before a production Hosting build if required client env is missing.
 * Does not print values. Used by the deploy workflow.
 */
const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(
    "Production client env is incomplete. Set these GitHub Actions secrets " +
      `(names only; do not commit values): ${missing.join(", ")}`
  );
  process.exit(1);
}

const allowed = new Set([
  ...required,
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_MEASUREMENT_ID",
  "VITE_CLOUD_FUNCTIONS_URL",
  "VITE_GOOGLE_CLOUD_API_KEY",
]);
const unexpected = Object.keys(process.env)
  .filter((name) => name.startsWith("VITE_") && !allowed.has(name) && process.env[name]?.trim());
if (unexpected.length > 0) {
  console.error(
    "Unexpected VITE_ client env names are set. Production builds only accept Firebase, " +
      `Cloud Functions, and Google Cloud TTS keys. Remove: ${unexpected.join(", ")}`
  );
  process.exit(1);
}

console.log("Production client env names are present.");
