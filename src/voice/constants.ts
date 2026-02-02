/**
 * Voice Processing Constants
 * Centralized constants for conversation steps, command patterns, and categories
 */

import { ConversationStep } from './types';

// Valid categories for entries
export const VALID_CATEGORIES = ['Documents', 'Health', 'Contacts', 'Finance', 'Personal'] as const;
export type ValidCategory = typeof VALID_CATEGORIES[number];

// Conversation steps for guided entry creation
export const CONVERSATION_STEPS: Record<string, ConversationStep> = {
  TITLE: {
    type: 'title',
    question: 'What would you like to call this entry?',
  },
  CATEGORY: {
    type: 'category',
    question: 'What category should this entry be in? You can say Documents, Health, Contacts, Finance, or Personal.',
    expectedResponse: [...VALID_CATEGORIES],
  },
  MORE_FIELDS: {
    type: 'more_fields',
    question: 'Would you like to add any custom fields? Say yes to add fields, or no to create the entry now.',
    expectedResponse: ['yes', 'no'],
  },
  FIELD_NAME: {
    type: 'field_name',
    question: 'What would you like to name this field?',
  },
  FIELD_TYPE: {
    type: 'field_type',
    question: 'What type of field should this be? You can say text, number, date, or textarea.',
    expectedResponse: ['text', 'number', 'date', 'textarea'],
  },
  PREVIEW: {
    type: 'preview',
    question: "Here's your entry preview. Would you like to save this entry or edit something?",
  },
};

// Command patterns for voice recognition
export const COMMAND_PATTERNS = {
  // Confirmation patterns
  POSITIVE_CONFIRMATION: [
    'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'confirm', 'do it',
    'go ahead', 'affirmative', 'correct', 'right', 'absolutely', 'definitely',
    'proceed', 'continue', "that's right", 'sounds good', 'looks good',
  ],
  NEGATIVE_CONFIRMATION: [
    'no', 'nope', 'nah', 'cancel', 'stop', 'abort', 'negative', "don't",
    'skip', 'never mind', 'nevermind', 'not now', 'hold on', 'wait',
    'incorrect', 'wrong', "that's not right",
  ],

  // Cancel patterns
  CANCEL: ['cancel', 'close', 'stop', 'exit', 'back', 'dismiss', 'done'],

  // Create patterns
  CREATE: ['create', 'add', 'new', 'make'],

  // Open/Edit patterns
  OPEN_EDIT: ['open', 'edit', 'modify', 'view', 'show'],

  // Delete patterns
  DELETE: ['delete', 'remove', 'erase', 'trash'],

  // Save patterns
  SAVE: ['save', 'submit', 'done', 'finish'],

  // Search patterns
  SEARCH: ['search', 'find', 'look for', 'show me'],

  // Navigation patterns
  NAVIGATE: ['go to', 'navigate to', 'open', 'take me to'],
} as const;

// TTS feedback patterns to filter out
export const TTS_FEEDBACK_PATTERNS = [
  /i didn't understand that.*try saying/i,
  /try saying.*create a new entry/i,
  /voice mode activated.*how can i help/i,
  /starting guided entry creation/i,
  /please say yes to confirm.*no to cancel/i,
  /to confirm or no.*to cancel/i,
  /say yes to confirm/i,
  /what would you like to call this entry/i,
  /what category should this entry be in/i,
  /what type of field should this be/i,
  /would you like to add any custom fields/i,
  /what would you like to name this field/i,
  /perfect.*entry preview/i,
  /i didn't catch that/i,
  /please try again/i,
  /voice mode activated/i,
  /how can i help you/i,
];

// System phrases to ignore
export const SYSTEM_PHRASES = [
  'voice mode activated',
  'listening for commands',
  'processing with ai',
  'ai voice assistant ready',
  'voice recognition',
  'speech recognition',
];

// Configuration defaults
export const DEFAULT_CONFIG = {
  CONFIRMATION_TIMEOUT: 30000, // 30 seconds
  COMMAND_COOLDOWN: 800, // ms between commands
  SILENCE_TIMEOUT: 20000, // 20 seconds
  MAX_CONSECUTIVE_ERRORS: 3,
  TTS_GRACE_PERIOD: 300, // ms after TTS ends
  MAX_RESTART_ATTEMPTS: 5,
} as const;

// Category aliases for fuzzy matching
export const CATEGORY_ALIASES: Record<string, ValidCategory> = {
  // Documents
  'document': 'Documents',
  'documents': 'Documents',
  'doc': 'Documents',
  'docs': 'Documents',
  'file': 'Documents',
  'files': 'Documents',
  'paper': 'Documents',
  'papers': 'Documents',

  // Health
  'health': 'Health',
  'medical': 'Health',
  'medicine': 'Health',
  'healthcare': 'Health',
  'doctor': 'Health',
  'hospital': 'Health',

  // Contacts
  'contact': 'Contacts',
  'contacts': 'Contacts',
  'people': 'Contacts',
  'person': 'Contacts',
  'friends': 'Contacts',
  'family': 'Contacts',

  // Finance
  'finance': 'Finance',
  'financial': 'Finance',
  'money': 'Finance',
  'banking': 'Finance',
  'bank': 'Finance',
  'budget': 'Finance',
  'expense': 'Finance',
  'expenses': 'Finance',

  // Personal
  'personal': 'Personal',
  'private': 'Personal',
  'notes': 'Personal',
  'note': 'Personal',
  'general': 'Personal',
  'other': 'Personal',
  'misc': 'Personal',
};
