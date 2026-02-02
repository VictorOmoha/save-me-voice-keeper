/**
 * Intent Detector
 * Detects user intent from voice input
 */

import { VoiceIntent, CommandType, VoiceContext } from '../types';
import { COMMAND_PATTERNS, CATEGORY_ALIASES, ValidCategory } from '../constants';
import { normalizeText } from './TextCleaner';

export interface DetectedIntent {
  intent: VoiceIntent;
  commandType: CommandType;
  confidence: number;
  matchedPatterns: string[];
}

export class IntentDetector {
  /**
   * Detect the primary intent from text
   */
  detectIntent(text: string): DetectedIntent {
    const normalized = normalizeText(text);
    const matchedPatterns: string[] = [];

    // Check confirmation intents first (highest priority)
    if (this.matchesPatterns(normalized, COMMAND_PATTERNS.POSITIVE_CONFIRMATION)) {
      return {
        intent: 'confirm',
        commandType: 'confirm',
        confidence: 0.95,
        matchedPatterns: ['positive_confirmation'],
      };
    }

    if (this.matchesPatterns(normalized, COMMAND_PATTERNS.NEGATIVE_CONFIRMATION)) {
      return {
        intent: 'deny',
        commandType: 'deny',
        confidence: 0.95,
        matchedPatterns: ['negative_confirmation'],
      };
    }

    // Check cancel intent
    if (this.matchesPatterns(normalized, COMMAND_PATTERNS.CANCEL)) {
      return {
        intent: 'cancel',
        commandType: 'cancel',
        confidence: 0.9,
        matchedPatterns: ['cancel'],
      };
    }

    // Check create intent
    if (this.isCreateCommand(normalized)) {
      matchedPatterns.push('create');
      return {
        intent: 'create',
        commandType: 'create_entry',
        confidence: 0.9,
        matchedPatterns,
      };
    }

    // Check delete intent
    if (this.matchesPatterns(normalized, COMMAND_PATTERNS.DELETE)) {
      return {
        intent: 'delete',
        commandType: 'delete_entry',
        confidence: 0.85,
        matchedPatterns: ['delete'],
      };
    }

    // Check edit/open intent
    if (this.matchesPatterns(normalized, COMMAND_PATTERNS.OPEN_EDIT)) {
      const isShowAll = this.isShowAllCommand(normalized);
      return {
        intent: 'edit',
        commandType: isShowAll ? 'show_all' : 'open_entry',
        confidence: 0.8,
        matchedPatterns: ['open_edit'],
      };
    }

    // Check search intent
    if (this.matchesPatterns(normalized, COMMAND_PATTERNS.SEARCH)) {
      return {
        intent: 'search',
        commandType: 'search',
        confidence: 0.85,
        matchedPatterns: ['search'],
      };
    }

    // Check save intent
    if (this.matchesPatterns(normalized, COMMAND_PATTERNS.SAVE)) {
      return {
        intent: 'form_fill',
        commandType: 'save_entry',
        confidence: 0.85,
        matchedPatterns: ['save'],
      };
    }

    // Check navigation intent
    if (this.isNavigationCommand(normalized)) {
      return {
        intent: 'navigate',
        commandType: 'navigate',
        confidence: 0.8,
        matchedPatterns: ['navigate'],
      };
    }

    // Unknown intent
    return {
      intent: 'unknown',
      commandType: 'unknown',
      confidence: 0.3,
      matchedPatterns: [],
    };
  }

  /**
   * Check if text matches any patterns in a list
   */
  private matchesPatterns(text: string, patterns: readonly string[]): boolean {
    return patterns.some(pattern => {
      // Exact match
      if (text === pattern) return true;
      // Word boundary match
      const regex = new RegExp(`\\b${this.escapeRegex(pattern)}\\b`);
      return regex.test(text);
    });
  }

  /**
   * Check if text is a create command
   */
  private isCreateCommand(text: string): boolean {
    const hasCreateWord = COMMAND_PATTERNS.CREATE.some(word => text.includes(word));
    const hasEntryWord = ['entry', 'record', 'document', 'item'].some(word => text.includes(word));
    return hasCreateWord && hasEntryWord;
  }

  /**
   * Check if text is a "show all" command
   */
  private isShowAllCommand(text: string): boolean {
    const showWords = ['show', 'view', 'display', 'list'];
    const allWords = ['all', 'entries', 'everything', 'documents', 'my'];

    const hasShowWord = showWords.some(word => text.includes(word));
    const hasAllWord = allWords.some(word => text.includes(word));

    return hasShowWord && hasAllWord;
  }

  /**
   * Check if text is a navigation command
   */
  private isNavigationCommand(text: string): boolean {
    return COMMAND_PATTERNS.NAVIGATE.some(pattern => text.includes(pattern));
  }

  /**
   * Detect navigation destination
   */
  detectNavigationDestination(text: string): string | null {
    const normalized = normalizeText(text);

    if (normalized.includes('dashboard')) {
      return 'dashboard';
    }
    if (normalized.includes('brain dump') || normalized.includes('braindump')) {
      return 'brain-dump';
    }
    if (normalized.includes('settings') || normalized.includes('preferences')) {
      return 'settings';
    }
    if (normalized.includes('all entries') || normalized.includes('entries')) {
      return 'all-entries';
    }

    return null;
  }

  /**
   * Match category from text using aliases
   */
  matchCategory(text: string): ValidCategory | null {
    const normalized = normalizeText(text);

    // Check direct category names first
    for (const category of ['Documents', 'Health', 'Contacts', 'Finance', 'Personal'] as ValidCategory[]) {
      if (normalized.includes(category.toLowerCase())) {
        return category;
      }
    }

    // Check aliases
    for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
      if (normalized.includes(alias)) {
        return category;
      }
    }

    return null;
  }

  /**
   * Find matching entry from available entries
   */
  findMatchingEntry(
    text: string,
    availableEntries: VoiceContext['availableEntries']
  ): { id: string; title: string } | null {
    const normalized = normalizeText(text);
    const words = normalized.split(' ');

    for (const entry of availableEntries) {
      const entryTitle = entry.title.toLowerCase();
      const titleWords = entryTitle.split(' ');

      // Exact match
      if (entryTitle === normalized) {
        return { id: entry.id, title: entry.title };
      }

      // Partial word match
      const hasMatch = titleWords.some(
        titleWord =>
          titleWord.length > 2 &&
          words.some(word => word.includes(titleWord) || titleWord.includes(word))
      );

      // Contained match
      const isContained = entryTitle.includes(normalized) && normalized.length > 2;

      if (hasMatch || isContained) {
        return { id: entry.id, title: entry.title };
      }
    }

    return null;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check if text is likely a new command (not a confirmation response)
   */
  isLikelyNewCommand(text: string): boolean {
    const normalized = normalizeText(text);
    const commandWords = [
      'create', 'add', 'new', 'make', 'open', 'show', 'delete',
      'remove', 'edit', 'update', 'search', 'find', 'list', 'help',
    ];

    const words = normalized.split(' ');

    // If the first word is a command word, likely a new command
    if (commandWords.includes(words[0])) {
      return true;
    }

    // Question patterns
    if (/\b(what|how|where|when)\b/.test(normalized)) {
      return true;
    }

    return false;
  }
}

// Singleton instance
export const intentDetector = new IntentDetector();
