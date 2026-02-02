/**
 * Text Cleaner
 * Utilities for cleaning and normalizing voice input text
 */

import { TTS_FEEDBACK_PATTERNS } from '../constants';

// Marker for pure TTS feedback
export const TTS_FEEDBACK_MARKER = '__TTS_FEEDBACK__';

/**
 * Clean voice input by removing TTS feedback and normalizing text
 */
export function cleanVoiceInput(input: string): string {
  if (!input) return '';

  const trimmedInput = input.trim();

  // Check if this is pure TTS feedback that should be completely ignored
  const pureTtsPatterns = [
    /^What would you like to call this entry\?$/i,
    /^What category should this entry be in\? You can say Documents, Health, Contacts, Finance, or Personal\.$/i,
    /^What type of field should this be\? You can say text,? number,? date,? or text ?area\.?$/i,
    /^Would you like to add any custom fields\? Say yes to add fields, or no to create the entry now\.$/i,
    /^What would you like to name this field\?$/i,
    /^Perfect.*entry preview.*$/i,
    /^I didn't catch that\..*$/i,
    /^Please try again\.$/i,
    /^Voice mode activated\.$/i,
    /^How can I help you\?$/i,
  ];

  // If it's pure TTS feedback, return special marker
  for (const pattern of pureTtsPatterns) {
    if (pattern.test(trimmedInput)) {
      return TTS_FEEDBACK_MARKER;
    }
  }

  // Remove common TTS feedback patterns from mixed input
  const ttsPatterns = [
    /^(What would you like to call this entry\?)\s*/i,
    /^(What category should this entry be in\?)\s*/i,
    /^(Perfect.*entry preview.*)\s*/i,
    /^(Would you like to add any custom fields\?)\s*/i,
    /^(What type of field.*)\s*/i,
    /^(I didn't catch that\.)\s*/i,
    /^(Please try again\.)\s*/i,
    /^(Voice mode activated\.)\s*/i,
    /^(How can I help you\?)\s*/i,
  ];

  let cleaned = trimmedInput;

  // Remove TTS patterns from the beginning
  for (const pattern of ttsPatterns) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, '').trim();
      // If nothing meaningful remains after removing TTS, return empty
      if (cleaned.length < 2) {
        return '';
      }
    }
  }

  // Extract meaningful content from mixed TTS+user input
  const meaningfulParts = cleaned.split(/[.?!]\s+/);
  if (meaningfulParts.length > 1) {
    // Take the last meaningful part that's not too short
    const lastPart = meaningfulParts[meaningfulParts.length - 1].trim();
    if (lastPart.length >= 2) {
      cleaned = lastPart;
    }
  }

  return cleaned;
}

/**
 * Extract entry title from transcript
 */
export function extractEntryTitle(transcript: string, action: string): string {
  const lowerTranscript = transcript.toLowerCase();
  const genericPhrases = ['new entry', 'entry', 'record', 'item', 'information'];

  // If the transcript is mostly just generic words, return empty string
  for (const phrase of genericPhrases) {
    if (lowerTranscript.includes(action) && lowerTranscript.includes(phrase)) {
      const remaining = lowerTranscript.replace(action, '').replace(phrase, '').trim();
      if (remaining.length < 3 || remaining.match(/^\s*(new|a|an|the)\s*$/)) {
        return '';
      }
    }
  }

  // More specific patterns for actual titles
  const patterns = [
    new RegExp(`${action}\\s+(?:entry|information)\\s+(?:called|named)\\s+([^.]+)`, 'i'),
    new RegExp(`${action}\\s+(?:entry|information)\\s+about\\s+([^.]+)`, 'i'),
    new RegExp(`${action}\\s+([^.]+?)\\s+(?:entry|information)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim().replace(/\.$/, '');
      const cleanTitle = title.replace(/\b(the|a|an|my|our|your|new)\b/gi, '').trim();
      if (cleanTitle.length > 2) {
        return cleanTitle;
      }
    }
  }

  return '';
}

/**
 * Extract target from open/edit command
 */
export function extractOpenTarget(transcript: string): string {
  const patterns = [
    /open\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /edit\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /open\s+(.+)/i,
    /edit\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      let target = match[1].trim();
      target = target.replace(/\b(document|entry|record|item|information)\b/gi, '').trim();
      target = target.replace(/\b(the|a|an|my|our|your)\b/gi, '').trim();

      if (target.length > 1) {
        return target;
      }
    }
  }

  return '';
}

/**
 * Extract target from delete command
 */
export function extractDeleteTarget(transcript: string): string {
  const patterns = [
    /delete\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /remove\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /erase\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /trash\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /delete\s+(.+)/i,
    /remove\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      let target = match[1].trim();
      target = target.replace(/\b(document|entry|record|item|information|file)\b/gi, '').trim();
      target = target.replace(/\b(the|a|an|my|our|your|this|that)\b/gi, '').trim();

      if (target.length > 1) {
        return target;
      }
    }
  }

  return '';
}

/**
 * Extract search term from search command
 */
export function extractSearchTerm(text: string): string {
  const searchPhrases = ['search for', 'find', 'show me', 'look for'];
  for (const phrase of searchPhrases) {
    const index = text.indexOf(phrase);
    if (index !== -1) {
      return text.substring(index + phrase.length).trim();
    }
  }
  return text.replace(/search|find|show|look/g, '').trim();
}

/**
 * Normalize text for comparison
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?]+$/g, '')
    .replace(/\s+/g, ' ');
}
