export const LEGAL_METADATA = {
  version: "SAVE-103 engineering draft 1",
  status: "Pending legal approval — not effective",
  prepared: "2026-08-11",
} as const;

export const KNOWN_PROCESSORS = [
  { name: "Google Firebase / Google Cloud", role: "Authentication, hosting, database, backend functions, storage, analytics, Gemini AI processing, transcription, and text-to-speech." },
  { name: "OpenAI", role: "Enhances brain-dump text in the implemented enhancement flow." },
  { name: "ElevenLabs", role: "Text-to-speech, including an optional connection using a user's own ElevenLabs API key." },
  { name: "MiniMax", role: "Text-to-speech in the implemented MiniMax voice path." },
  { name: "Stripe", role: "Hosted card checkout, subscriptions, and billing portal. SaveMe does not receive full card numbers." },
  { name: "GoatCounter", role: "Cookieless pageview analytics." },
  { name: "Google Analytics", role: "Product usage events and device/app-instance analytics; event payloads are designed not to include entry text." },
  { name: "Google Fonts", role: "Web font delivery, which inherently receives request metadata such as IP address and user agent." },
] as const;

export const USER_DIRECTED_RECIPIENTS = [
  "AI agents connected with a SaveMe agent key (for example OpenClaw, Claude, Codex, Cursor, Gemini, or a custom agent)",
  "webhook and Zapier destinations configured by the user",
  "browser or operating-system speech services when fallback speech features are used",
] as const;
