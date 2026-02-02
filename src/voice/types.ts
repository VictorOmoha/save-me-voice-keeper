/**
 * Voice Processing Types
 * Consolidated type definitions for the voice processing system
 */

// Intent types for voice commands
export type VoiceIntent =
  | 'create'
  | 'delete'
  | 'edit'
  | 'search'
  | 'navigate'
  | 'export'
  | 'bulk_operation'
  | 'form_fill'
  | 'conversation'
  | 'close'
  | 'cancel'
  | 'clarification'
  | 'confirm'
  | 'deny'
  | 'unknown';

// Command types for direct voice commands
export type CommandType =
  | 'create_entry'
  | 'open_entry'
  | 'delete_entry'
  | 'save_entry'
  | 'cancel'
  | 'show_all'
  | 'confirm'
  | 'deny'
  | 'search'
  | 'navigate'
  | 'close_modal'
  | 'unknown';

// Conversation step types
export type ConversationStepType =
  | 'title'
  | 'category'
  | 'field_name'
  | 'field_type'
  | 'more_fields'
  | 'preview'
  | 'confirm';

// Field types for entries
export type FieldType = 'text' | 'number' | 'date' | 'textarea';

// Voice command result
export interface VoiceCommand {
  type: CommandType;
  intent: VoiceIntent;
  target?: string;
  parameters: Record<string, any>;
  confidence: number;
  conversationalResponse?: string;
  needsConfirmation?: boolean;
  followUpExpected?: boolean;
}

// Conversation step definition
export interface ConversationStep {
  type: ConversationStepType;
  question: string;
  expectedResponse?: string[];
}

// Entry draft during conversation
export interface EntryDraft {
  title?: string;
  category?: string;
  fields: Array<{ name: string; type: FieldType }>;
}

// Conversation state
export interface ConversationState {
  isInConversation: boolean;
  currentStep: ConversationStep | null;
  entryDraft: EntryDraft;
  currentFieldName?: string;
  waitingForFollowUp?: boolean;
}

// Voice context for command processing
export interface VoiceContext {
  currentView?: string;
  availableEntries: Array<{
    id: string;
    title: string;
    category: string;
  }>;
  currentEntry?: {
    id: string;
    title: string;
  };
  previousCommands: string[];
  isFormOpen?: boolean;
  hasPendingConfirmation?: boolean;
}

// Speech recognition callbacks
export interface SpeechRecognitionCallbacks {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onInterim?: (transcript: string) => void;
}

// Voice processor configuration
export interface VoiceProcessorConfig {
  enableTTSFiltering?: boolean;
  enableDebugMode?: boolean;
  confirmationTimeout?: number;
  commandCooldown?: number;
}

// Pending confirmation data
export interface PendingConfirmation {
  command: VoiceCommand;
  entryId?: string;
  entryTitle?: string;
  timestamp: number;
}

// ============================================================================
// Backwards Compatibility Types
// These types maintain compatibility with the old enhancedVoiceProcessor.ts
// ============================================================================

/**
 * @deprecated Use VoiceCommand instead
 * Legacy type alias for backwards compatibility with existing code
 */
export interface EnhancedVoiceCommand {
  intent: VoiceIntent | 'delegate_confirmation';
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  conversationalResponse?: string;
  needsConfirmation?: boolean;
  followUpExpected?: boolean;
  expectsFollowUp?: boolean;
  followUpQuestions?: string[];
}
