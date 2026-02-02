/**
 * Voice Processor
 * Main unified voice processor that handles all voice commands and conversations
 */

import {
  VoiceCommand,
  VoiceContext,
  PendingConfirmation,
  VoiceProcessorConfig,
} from '../types';
import { commandParser, CommandParser } from '../core/CommandParser';
import { intentDetector } from '../core/IntentDetector';
import { ttsFilter } from '../core/TTSFilter';
import { DEFAULT_CONFIG, COMMAND_PATTERNS } from '../constants';
import { normalizeText } from '../core/TextCleaner';

export class VoiceProcessor {
  private pendingConfirmation: PendingConfirmation | null = null;
  private commandHistory: string[] = [];
  private confirmationTimeout: NodeJS.Timeout | null = null;
  private config: Required<VoiceProcessorConfig>;
  private commandParser: CommandParser;

  constructor(config: VoiceProcessorConfig = {}) {
    this.config = {
      enableTTSFiltering: config.enableTTSFiltering ?? true,
      enableDebugMode: config.enableDebugMode ?? false,
      confirmationTimeout: config.confirmationTimeout ?? DEFAULT_CONFIG.CONFIRMATION_TIMEOUT,
      commandCooldown: config.commandCooldown ?? DEFAULT_CONFIG.COMMAND_COOLDOWN,
    };

    this.commandParser = commandParser;
    this.commandParser.setDebugMode(this.config.enableDebugMode);
  }

  /**
   * Process a voice command
   */
  async processVoiceCommand(transcript: string, context: VoiceContext): Promise<VoiceCommand> {
    if (this.config.enableDebugMode) {
      console.log('🎯 VoiceProcessor: Processing command:', transcript);
      console.log('🔍 VoiceProcessor: Context:', {
        hasPendingConfirmation: !!this.pendingConfirmation,
      });
    }

    // Check TTS filter first
    if (this.config.enableTTSFiltering && ttsFilter.isTTSFeedback(transcript)) {
      return this.createBlockedCommand();
    }

    // Add to command history
    this.addToHistory(transcript);

    // Check for reset/escape commands
    if (this.isResetCommand(transcript)) {
      this.clearConfirmationState();
      return this.createResetCommand();
    }

    // Handle pending confirmation
    if (this.pendingConfirmation) {
      return this.handleConfirmation(transcript, context);
    }

    // Parse and process the command
    const { command } = this.commandParser.parse(transcript, context);

    // Handle commands that need confirmation
    if (command.needsConfirmation) {
      this.setPendingConfirmation(command);
    }

    return command;
  }

  /**
   * Handle confirmation response
   */
  private handleConfirmation(transcript: string, context: VoiceContext): VoiceCommand {
    if (!this.pendingConfirmation) {
      return this.createUnknownCommand('No pending confirmation');
    }

    const normalized = normalizeText(transcript);

    if (this.config.enableDebugMode) {
      console.log('🔄 VoiceProcessor: Handling confirmation:', normalized);
    }

    // Check for positive confirmation
    if (this.isPositiveConfirmation(normalized)) {
      const confirmedCommand = {
        ...this.pendingConfirmation.command,
        parameters: {
          ...this.pendingConfirmation.command.parameters,
          confirmed: true,
        },
        needsConfirmation: false,
        conversationalResponse:
          this.pendingConfirmation.command.intent === 'delete'
            ? 'Deleting entry now.'
            : 'Processing your request now.',
      };
      this.clearConfirmationState();
      return confirmedCommand;
    }

    // Check for negative confirmation
    if (this.isNegativeConfirmation(normalized)) {
      this.clearConfirmationState();
      return {
        type: 'cancel',
        intent: 'cancel',
        parameters: { confirmed: false },
        confidence: 0.9,
        conversationalResponse: "Okay, I've cancelled that action.",
      };
    }

    // Check if this is a new command instead of unclear confirmation
    if (intentDetector.isLikelyNewCommand(normalized)) {
      if (this.config.enableDebugMode) {
        console.log('🎯 VoiceProcessor: User gave new command during confirmation, processing as new');
      }
      this.clearConfirmationState();
      const { command } = this.commandParser.parse(transcript, context);
      return command;
    }

    // Unclear response - ask again
    return {
      type: 'unknown',
      intent: 'clarification',
      parameters: {},
      confidence: 0.3,
      conversationalResponse: "I didn't understand that. Please say 'yes' to confirm or 'no' to cancel.",
      needsConfirmation: true,
    };
  }

  /**
   * Check for positive confirmation patterns
   */
  private isPositiveConfirmation(text: string): boolean {
    return COMMAND_PATTERNS.POSITIVE_CONFIRMATION.some(pattern => {
      if (text === pattern) return true;
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      return regex.test(text);
    });
  }

  /**
   * Check for negative confirmation patterns
   */
  private isNegativeConfirmation(text: string): boolean {
    return COMMAND_PATTERNS.NEGATIVE_CONFIRMATION.some(pattern => {
      if (text === pattern) return true;
      const regex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      return regex.test(text);
    });
  }

  /**
   * Check if this is a reset command
   */
  private isResetCommand(text: string): boolean {
    const normalized = normalizeText(text);
    return (
      normalized.includes('start over') ||
      normalized.includes('reset') ||
      normalized.includes('clear')
    );
  }

  /**
   * Set pending confirmation
   */
  private setPendingConfirmation(command: VoiceCommand): void {
    this.pendingConfirmation = {
      command,
      entryId: command.parameters.entryId,
      entryTitle: command.parameters.entryTitle,
      timestamp: Date.now(),
    };
    this.startConfirmationTimeout();
  }

  /**
   * Start confirmation timeout
   */
  private startConfirmationTimeout(): void {
    this.clearConfirmationTimeout();
    this.confirmationTimeout = setTimeout(() => {
      if (this.config.enableDebugMode) {
        console.log('⏰ VoiceProcessor: Confirmation timeout - clearing state');
      }
      this.clearConfirmationState();
    }, this.config.confirmationTimeout);
  }

  /**
   * Clear confirmation timeout
   */
  private clearConfirmationTimeout(): void {
    if (this.confirmationTimeout) {
      clearTimeout(this.confirmationTimeout);
      this.confirmationTimeout = null;
    }
  }

  /**
   * Clear confirmation state
   */
  clearConfirmationState(): void {
    if (this.config.enableDebugMode) {
      console.log('🧹 VoiceProcessor: Clearing confirmation state');
    }
    this.pendingConfirmation = null;
    this.clearConfirmationTimeout();
  }

  /**
   * Clear only the pending confirmation
   */
  clearPendingConfirmation(): void {
    this.pendingConfirmation = null;
    this.clearConfirmationTimeout();
  }

  /**
   * Add transcript to history
   */
  private addToHistory(transcript: string): void {
    this.commandHistory.push(transcript);
    if (this.commandHistory.length > 5) {
      this.commandHistory.shift();
    }
  }

  /**
   * Create a blocked command (for TTS feedback)
   */
  private createBlockedCommand(): VoiceCommand {
    return {
      type: 'unknown',
      intent: 'unknown',
      parameters: { action: 'tts_feedback_blocked' },
      confidence: 0,
      conversationalResponse: '',
    };
  }

  /**
   * Create a reset command
   */
  private createResetCommand(): VoiceCommand {
    return {
      type: 'cancel',
      intent: 'conversation',
      parameters: { action: 'reset_conversation' },
      confidence: 0.9,
      conversationalResponse: 'Starting fresh. What would you like to do?',
    };
  }

  /**
   * Create an unknown command
   */
  private createUnknownCommand(message: string): VoiceCommand {
    return {
      type: 'unknown',
      intent: 'unknown',
      parameters: { message },
      confidence: 0,
      conversationalResponse: message,
    };
  }

  /**
   * Check if there's a pending confirmation
   */
  hasPendingConfirmation(): boolean {
    return this.pendingConfirmation !== null;
  }

  /**
   * Get the pending confirmation
   */
  getPendingConfirmation(): PendingConfirmation | null {
    return this.pendingConfirmation;
  }

  /**
   * Set the last TTS prompt for filtering
   */
  setLastTTSPrompt(prompt: string): void {
    ttsFilter.setLastTTSPrompt(prompt);
    this.commandParser.setLastTTSPrompt(prompt);
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.config.enableDebugMode = enabled;
    this.commandParser.setDebugMode(enabled);
    ttsFilter.setDebugMode(enabled);
  }
}

// Singleton instance with default configuration
export const voiceProcessor = new VoiceProcessor({ enableDebugMode: true });
