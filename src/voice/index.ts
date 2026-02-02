/**
 * Voice Processing Module
 * Main entry point for the consolidated voice processing architecture
 */

// Types
export * from './types';

// Constants
export * from './constants';

// Core modules
export { TTSFilter, ttsFilter } from './core/TTSFilter';
export { IntentDetector, intentDetector } from './core/IntentDetector';
export { CommandParser, commandParser } from './core/CommandParser';
export {
  cleanVoiceInput,
  extractEntryTitle,
  extractOpenTarget,
  extractDeleteTarget,
  extractSearchTerm,
  normalizeText,
  TTS_FEEDBACK_MARKER,
} from './core/TextCleaner';

// Processors
export { VoiceProcessor, voiceProcessor } from './processors/VoiceProcessor';

// Hooks
export { useVoiceProcessor } from './hooks/useVoiceProcessor';
export { useConversation } from './hooks/useConversation';
export { useSpeechRecognition } from './hooks/useSpeechRecognition';
