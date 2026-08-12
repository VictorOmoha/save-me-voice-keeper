import * as admin from "firebase-admin";

export {
  sharedMemoryAgentStatus,
  sharedMemoryCreateAgentKey,
  sharedMemoryCreate,
  sharedMemorySearch,
  sharedMemoryGet,
  sharedMemoryList,
  sharedMemoryUpdate,
  sharedMemoryBatchCreate,
} from "./sharedMemory/functions";

export {
  transcribeAudio,
  elevenlabsTts,
  googleCloudTts,
  minimaxTts,
  demoTts,
} from "./audio/functions";

export {
  createCheckout,
  customerPortal,
  stripeWebhook,
} from "./billing/functions";

export {
  quickSave,
} from "./quickSave/functions";

export {
  extensionPairingCode,
  extensionPair,
  extensionRefresh,
  extensionRevoke,
  extensionRevokeAll,
} from "./extensionAuth/functions";

export {
  enhanceBrainDump,
  processEntryDeep,
  checkReminders,
  analyzePatterns,
  novaInsights,
} from "./entryIntelligence/functions";

export {
  voiceAgent,
} from "./voiceAgent/functions";

// Initialize Firebase Admin
admin.initializeApp();
