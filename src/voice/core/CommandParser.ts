/**
 * Command Parser
 * Parses voice transcripts into structured commands
 */

import { VoiceCommand, VoiceContext, CommandType, VoiceIntent } from '../types';
import { intentDetector, IntentDetector } from './IntentDetector';
import { ttsFilter, TTSFilter } from './TTSFilter';
import {
  cleanVoiceInput,
  extractEntryTitle,
  extractOpenTarget,
  extractDeleteTarget,
  extractSearchTerm,
  TTS_FEEDBACK_MARKER,
} from './TextCleaner';
import { COMMAND_PATTERNS } from '../constants';

export interface ParsedCommand {
  command: VoiceCommand;
  rawTranscript: string;
  cleanedTranscript: string;
}

export class CommandParser {
  private intentDetector: IntentDetector;
  private ttsFilter: TTSFilter;
  private debugMode: boolean;

  constructor(debugMode = false) {
    this.intentDetector = intentDetector;
    this.ttsFilter = ttsFilter;
    this.debugMode = debugMode;
  }

  /**
   * Parse a voice transcript into a command
   */
  parse(transcript: string, context: VoiceContext): ParsedCommand {
    if (this.debugMode) {
      console.log('🎯 CommandParser: Parsing transcript:', transcript);
    }

    // Clean the input
    const cleanedTranscript = cleanVoiceInput(transcript);

    // Check for TTS feedback marker
    if (cleanedTranscript === TTS_FEEDBACK_MARKER || !cleanedTranscript) {
      return {
        command: this.createUnknownCommand('tts_feedback_blocked'),
        rawTranscript: transcript,
        cleanedTranscript: '',
      };
    }

    // Check TTS filter
    if (this.ttsFilter.isTTSFeedback(transcript)) {
      return {
        command: this.createUnknownCommand('tts_feedback_blocked'),
        rawTranscript: transcript,
        cleanedTranscript,
      };
    }

    // Detect intent
    const detectedIntent = this.intentDetector.detectIntent(cleanedTranscript);

    if (this.debugMode) {
      console.log('🎯 CommandParser: Detected intent:', detectedIntent);
    }

    // Build command based on intent
    const command = this.buildCommand(detectedIntent, cleanedTranscript, context);

    return {
      command,
      rawTranscript: transcript,
      cleanedTranscript,
    };
  }

  /**
   * Build a command from detected intent
   */
  private buildCommand(
    detectedIntent: ReturnType<IntentDetector['detectIntent']>,
    cleanedTranscript: string,
    context: VoiceContext
  ): VoiceCommand {
    const { intent, commandType, confidence } = detectedIntent;

    switch (intent) {
      case 'confirm':
        return this.buildConfirmCommand(confidence);

      case 'deny':
        return this.buildDenyCommand(confidence);

      case 'cancel':
        return this.buildCancelCommand(cleanedTranscript, confidence);

      case 'create':
        return this.buildCreateCommand(cleanedTranscript, confidence);

      case 'delete':
        return this.buildDeleteCommand(cleanedTranscript, context, confidence);

      case 'edit':
        return this.buildEditCommand(cleanedTranscript, context, commandType, confidence);

      case 'search':
        return this.buildSearchCommand(cleanedTranscript, confidence);

      case 'navigate':
        return this.buildNavigateCommand(cleanedTranscript, confidence);

      case 'form_fill':
        return this.buildSaveCommand(confidence);

      default:
        return this.createUnknownCommand('unknown_command', cleanedTranscript);
    }
  }

  /**
   * Build confirm command
   */
  private buildConfirmCommand(confidence: number): VoiceCommand {
    return {
      type: 'confirm',
      intent: 'confirm',
      parameters: { confirmed: true },
      confidence,
      conversationalResponse: 'Confirmed!',
    };
  }

  /**
   * Build deny command
   */
  private buildDenyCommand(confidence: number): VoiceCommand {
    return {
      type: 'deny',
      intent: 'deny',
      parameters: { confirmed: false },
      confidence,
      conversationalResponse: "Okay, I've cancelled that action.",
    };
  }

  /**
   * Build cancel command
   */
  private buildCancelCommand(cleanedTranscript: string, confidence: number): VoiceCommand {
    // Check for specific close targets
    let action = 'close_modal';
    let response = 'Closing the current dialog.';

    if (cleanedTranscript.includes('settings') || cleanedTranscript.includes('preferences')) {
      action = 'close_settings';
      response = 'Closing settings.';
    } else if (cleanedTranscript.includes('entry') || cleanedTranscript.includes('form')) {
      action = 'close_entry';
      response = 'Closing the entry form.';
    }

    return {
      type: 'cancel',
      intent: 'cancel',
      parameters: { action },
      confidence,
      conversationalResponse: response,
    };
  }

  /**
   * Build create command
   */
  private buildCreateCommand(cleanedTranscript: string, confidence: number): VoiceCommand {
    const entryTitle = extractEntryTitle(cleanedTranscript, 'create');

    return {
      type: 'create_entry',
      intent: 'create',
      parameters: {
        entryTitle: entryTitle || undefined,
      },
      confidence,
      conversationalResponse: 'Starting guided entry creation...',
      followUpExpected: true,
    };
  }

  /**
   * Build delete command
   */
  private buildDeleteCommand(
    cleanedTranscript: string,
    context: VoiceContext,
    confidence: number
  ): VoiceCommand {
    // Try to find matching entry
    const entryMatch = this.intentDetector.findMatchingEntry(
      cleanedTranscript,
      context.availableEntries
    );

    if (entryMatch) {
      return {
        type: 'delete_entry',
        intent: 'delete',
        parameters: {
          entryId: entryMatch.id,
          entryTitle: entryMatch.title,
        },
        confidence: 0.8,
        needsConfirmation: true,
        conversationalResponse: `Are you sure you want to delete "${entryMatch.title}"? Say yes to confirm or no to cancel.`,
      };
    }

    // Extract delete target from text
    const searchTerm = extractDeleteTarget(cleanedTranscript);

    return {
      type: 'delete_entry',
      intent: 'delete',
      parameters: { searchTerm },
      confidence: 0.6,
      needsConfirmation: true,
      conversationalResponse: `Looking for entries matching "${searchTerm}" to delete.`,
    };
  }

  /**
   * Build edit/open command
   */
  private buildEditCommand(
    cleanedTranscript: string,
    context: VoiceContext,
    commandType: CommandType,
    confidence: number
  ): VoiceCommand {
    // Handle show all
    if (commandType === 'show_all') {
      return {
        type: 'show_all',
        intent: 'edit',
        parameters: { showAll: true },
        confidence,
        conversationalResponse: 'Showing all entries.',
      };
    }

    // Try to find matching entry
    const entryMatch = this.intentDetector.findMatchingEntry(
      cleanedTranscript,
      context.availableEntries
    );

    if (entryMatch) {
      return {
        type: 'open_entry',
        intent: 'edit',
        parameters: {
          entryId: entryMatch.id,
          entryTitle: entryMatch.title,
        },
        confidence: 0.8,
        conversationalResponse: `Opening "${entryMatch.title}" for editing.`,
      };
    }

    // Extract open target
    const target = extractOpenTarget(cleanedTranscript);

    return {
      type: 'open_entry',
      intent: 'edit',
      target,
      parameters: { searchTerm: target },
      confidence: target ? 0.7 : 0.4,
      conversationalResponse: target
        ? `Looking for "${target}" to open.`
        : 'What entry would you like to open?',
    };
  }

  /**
   * Build search command
   */
  private buildSearchCommand(cleanedTranscript: string, confidence: number): VoiceCommand {
    const searchTerm = extractSearchTerm(cleanedTranscript);

    return {
      type: 'search',
      intent: 'search',
      parameters: { query: searchTerm },
      confidence,
      conversationalResponse: `Searching for "${searchTerm}".`,
    };
  }

  /**
   * Build navigate command
   */
  private buildNavigateCommand(cleanedTranscript: string, confidence: number): VoiceCommand {
    const destination = this.intentDetector.detectNavigationDestination(cleanedTranscript);

    return {
      type: 'navigate',
      intent: 'navigate',
      parameters: { destination },
      confidence,
      conversationalResponse: destination
        ? `Opening ${destination}.`
        : 'Where would you like to go?',
    };
  }

  /**
   * Build save command
   */
  private buildSaveCommand(confidence: number): VoiceCommand {
    return {
      type: 'save_entry',
      intent: 'form_fill',
      parameters: {},
      confidence,
      conversationalResponse: 'Saving entry...',
    };
  }

  /**
   * Create an unknown command
   */
  private createUnknownCommand(action: string, originalText?: string): VoiceCommand {
    return {
      type: 'unknown',
      intent: 'unknown',
      parameters: { action, originalText },
      confidence: 0,
      conversationalResponse:
        action === 'tts_feedback_blocked'
          ? ''
          : 'I didn\'t understand that. Try saying "create entry", "open [name]", "delete [name]", or "search for [term]".',
    };
  }

  /**
   * Set the last TTS prompt for filtering
   */
  setLastTTSPrompt(prompt: string): void {
    this.ttsFilter.setLastTTSPrompt(prompt);
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.ttsFilter.setDebugMode(enabled);
  }
}

// Singleton instance
export const commandParser = new CommandParser();
