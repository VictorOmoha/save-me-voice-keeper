import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const inventory = read("docs/hardening/data-flow-inventory.md");
const manifest = read("docs/hardening/user-data-manifest.json");
const legalSource = read("src/content/legalContent.ts");
const privacyPage = read("src/pages/PrivacyPolicy.tsx");
const termsPage = read("src/pages/TermsOfService.tsx");
const privacyDraft = read("PRIVACY_POLICY.md");
const termsDraft = read("TERMS_OF_SERVICE.md");

const processors = ["Google Firebase / Google Cloud", "OpenAI", "ElevenLabs", "MiniMax", "Stripe", "GoatCounter", "Google Analytics", "Google Fonts"];
const inventoryEvidence = ["OpenAI", "ElevenLabs", "MiniMax", "Stripe", "GoatCounter", "Google Analytics 4", "Google Fonts"];
const errors = [];

for (const name of inventoryEvidence) if (!inventory.includes(name)) errors.push(`data-flow inventory lost processor evidence: ${name}`);
for (const name of processors) if (!legalSource.includes(name)) errors.push(`internal processor review source lost: ${name}`);
for (const collection of ["entries", "nova_conversations", "nova_memories", "shared_memories", "api_keys", "search_analytics", "webhook_events"]) if (!manifest.includes(`\"${collection}\"`)) errors.push(`user-data manifest lost source: ${collection}`);
for (const token of ["KNOWN_PROCESSORS", "Pending legal approval", "Google Gemini", "connected agents"]) if (!`${privacyDraft}\n${legalSource}`.includes(token)) errors.push(`internal privacy review artifact lost: ${token}`);
for (const token of ["no paid trial", "Stripe card-only billing", "cancellation without deletion", "support-directed deletion"]) if (!termsDraft.includes(token)) errors.push(`internal terms review artifact lost: ${token}`);
for (const token of ["Effective Date:</strong> January 15, 2026", "Last Updated:</strong> November 17, 2025"]) {
  if (!privacyPage.includes(token)) errors.push(`effective privacy route changed: ${token}`);
  if (!termsPage.includes(token)) errors.push(`effective terms route changed: ${token}`);
}
for (const token of ["@/content/legalContent", "SAVE-103 engineering draft", "Pending legal approval"]) if (`${privacyPage}\n${termsPage}`.includes(token)) errors.push(`unapproved legal draft exposed on effective route: ${token}`);

const prohibited = [
  [/multi-factor authentication available/i, "unsupported MFA claim"],
  [/14-day (free )?trial/i, "unsupported paid-trial claim"],
  [/PayPal/i, "unsupported PayPal claim"],
  [/prorated refund/i, "unsupported prorated-refund claim"],
  [/audio (is )?immediately deleted/i, "unsupported exact audio-deletion claim"],
  [/never sell or share/i, "unsupported never-share claim"],
];
for (const [pattern, label] of prohibited) if (pattern.test(legalSource)) errors.push(label);

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log(`privacy source inventory verified (${processors.length} named processors; manifest and claim guards passed)`);
