import { MultiIntentParser, ParsedIntent } from './nlp/multiIntentParser';
import { CommandSequencer, SequencedCommand } from './nlp/commandSequencer';

export interface VoiceCommand {
  type: 'create_field' | 'create_entry' | 'delete_entry' | 'open_entry' | 'open_file' | 'save_entry' | 'cancel' | 'fill_form' | 'set_title' | 'set_category' | 'confirm_delete' | 'unknown' | 'multi_command' | 'sequenced_command';
  params?: {
    fieldName?: string;
    fieldType?: 'text' | 'number' | 'date' | 'textarea';
    entryTitle?: string;
    entryId?: string;
    entryCategory?: string;
    titleValue?: string;
    categoryValue?: string;
    commands?: SequencedCommand[]; // For multi-command support
    originalText?: string;
    intent?: ParsedIntent; // For sequenced single commands
  };
}

// Enhanced command processor with multi-intent support
const multiIntentParser = new MultiIntentParser();

export const processVoiceCommand = (transcript: string): VoiceCommand => {
  console.log('🎯 Processing voice command:', transcript);
  
  if (!transcript || transcript.trim().length === 0) {
    console.log('❌ Empty text provided to processVoiceCommand');
    return { type: 'unknown' };
  }

  // First, try multi-intent parsing for ALL commands
  const multiIntentResult = multiIntentParser.parse(transcript);
  console.log('🔍 Multi-intent analysis result:', multiIntentResult);
  
  if (multiIntentResult.intents.length === 0) {
    console.log('❌ No intents parsed from input');
    return { type: 'unknown' };
  }

  // If we have multiple intents, handle as multi-command
  if (multiIntentResult.hasMultipleIntents) {
    console.log('🔄 Multi-intent command detected:', multiIntentResult);
    
    // Convert parsed intents to sequenced commands
    const commandSequencer = new CommandSequencer(async () => ({})); // Placeholder executor
    const sequencedCommands = commandSequencer.sequenceCommands(multiIntentResult.intents);
    
    return {
      type: 'multi_command',
      params: {
        commands: sequencedCommands,
        originalText: transcript
      }
    };
  }

  // Single intent - convert ParsedIntent to VoiceCommand format
  const singleIntent = multiIntentResult.intents[0];
  console.log('🎯 Single intent detected:', singleIntent);
  
  // Map ParsedIntent to VoiceCommand with enhanced processing
  const voiceCommand = convertParsedIntentToVoiceCommand(singleIntent, transcript);
  console.log('✅ Converted to voice command:', voiceCommand);
  
  return voiceCommand;
};

// Enhanced conversion function that properly maps ParsedIntent to VoiceCommand
const convertParsedIntentToVoiceCommand = (intent: ParsedIntent, originalText: string): VoiceCommand => {
  console.log('🔄 Converting parsed intent to voice command:', intent);
  
  switch (intent.type) {
    case 'create_entry':
      return {
        type: 'sequenced_command',
        params: {
          intent,
          originalText,
          entryTitle: intent.parameters.entryTitle || '',
          entryCategory: intent.parameters.entryCategory || 'Personal'
        }
      };
      
    case 'open_entry':
      return {
        type: 'sequenced_command',
        params: {
          intent,
          originalText,
          entryTitle: intent.parameters.entryTitle || ''
        }
      };
      
    case 'delete_entry':
      return {
        type: 'sequenced_command',
        params: {
          intent,
          originalText,
          entryTitle: intent.parameters.entryTitle || ''
        }
      };
      
    case 'save_entry':
      return {
        type: 'sequenced_command',
        params: {
          intent,
          originalText,
          entryTitle: intent.parameters.entryTitle || ''
        }
      };
      
    case 'cancel':
      return {
        type: 'sequenced_command',
        params: {
          intent,
          originalText
        }
      };
      
    default:
      console.log('❓ Unknown intent type, falling back to legacy processing');
      // Fallback to legacy single-command processing
      return processLegacySingleCommand(originalText);
  }
};

// Legacy single-command processing for backward compatibility
const processLegacySingleCommand = (transcript: string): VoiceCommand => {
  const lowerTranscript = transcript.toLowerCase().trim();
  
  // Handle common speech recognition errors and misinterpretations
  let correctedTranscript = lowerTranscript
    .replace(/\bopen\s+([^.]+?)\s+policy\b/g, 'close $1 policy')
    .replace(/\bopening\s+([^.]+?)\s+policy\b/g, 'close $1 policy')
    .replace(/\bcall\s+it\b/g, 'cancel')
    .replace(/\bcancel\s+it\b/g, 'cancel')
    .replace(/\bstop\s+it\b/g, 'cancel');
  
  // Cancel/Close commands - check first for immediate response
  if (correctedTranscript.includes('cancel') || 
      correctedTranscript.includes('stop') || 
      correctedTranscript.includes('close') ||
      correctedTranscript.includes('exit') ||
      correctedTranscript.includes('dismiss') ||
      correctedTranscript.includes('back')) {
    return { type: 'cancel' };
  }
  
  // Create entry commands
  if ((lowerTranscript.includes('create') || lowerTranscript.includes('add') || lowerTranscript.includes('new')) && 
      (lowerTranscript.includes('entry') || lowerTranscript.includes('record') || lowerTranscript.includes('item'))) {
    
    const entryTitle = extractEntryTitle(lowerTranscript, 'create');
    const entryCategory = extractCategory(lowerTranscript);
    
    return {
      type: 'create_entry',
      params: { entryTitle, entryCategory }
    };
  }

  // Show/view all entries
  if ((lowerTranscript.includes('show') || lowerTranscript.includes('view') || lowerTranscript.includes('display') || lowerTranscript.includes('list')) && 
      (lowerTranscript.includes('all') || lowerTranscript.includes('entries') || lowerTranscript.includes('documents') || lowerTranscript.includes('my'))) {
    return {
      type: 'open_entry',
      params: { entryTitle: 'all_entries' }
    };
  }
  
  // Delete entry commands
  if (lowerTranscript.includes('delete') || 
      lowerTranscript.includes('remove') || 
      lowerTranscript.includes('erase') ||
      lowerTranscript.includes('trash')) {
    const searchTerm = extractDeleteTarget(lowerTranscript);
    return {
      type: 'delete_entry',
      params: { entryTitle: searchTerm }
    };
  }
  
  // Open specific entry commands
  if (lowerTranscript.includes('open') && !lowerTranscript.includes('all')) {
    const searchTerm = extractOpenTarget(lowerTranscript);
    return {
      type: 'open_entry',
      params: { entryTitle: searchTerm }
    };
  }
  
  // Fill form commands
  if (lowerTranscript.includes('fill') && (lowerTranscript.includes('form') || lowerTranscript.includes('template'))) {
    const entryTitle = extractEntryTitle(lowerTranscript, 'fill');
    return {
      type: 'fill_form',
      params: { entryTitle }
    };
  }
  
  // Save entry commands
  if (lowerTranscript.includes('save')) {
    const entryTitle = extractEntryTitle(lowerTranscript, 'save');
    return {
      type: 'save_entry',
      params: { entryTitle }
    };
  }
  
  return { type: 'unknown' };
};

const extractFieldName = (transcript: string): string => {
  // Look for patterns like "create field called name" or "create field name"
  const patterns = [
    /create.*field.*called\s+([^.]+)/i,
    /create.*field\s+([^.]+)/i,
    /field.*called\s+([^.]+)/i,
    /field\s+([^.]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/\.$/, '');
    }
  }
  
  return 'New Field';
};

const extractFieldType = (transcript: string): 'text' | 'number' | 'date' | 'textarea' => {
  if (transcript.includes('number') || transcript.includes('numeric')) return 'number';
  if (transcript.includes('date')) return 'date';
  if (transcript.includes('long') || transcript.includes('textarea') || transcript.includes('description')) return 'textarea';
  return 'text';
};

const extractEntryTitle = (transcript: string, action: string): string => {
  // Don't extract titles from generic commands
  const genericPhrases = ['new entry', 'entry', 'record', 'item', 'information'];
  const lowerTranscript = transcript.toLowerCase();
  
  // If the transcript is mostly just generic words, return empty string
  for (const phrase of genericPhrases) {
    if (lowerTranscript.includes(action) && lowerTranscript.includes(phrase)) {
      const remaining = lowerTranscript.replace(action, '').replace(phrase, '').trim();
      if (remaining.length < 3 || remaining.match(/^\s*(new|a|an|the)\s*$/)) {
        console.log('Skipping title extraction for generic command:', transcript);
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
};

const extractCategory = (transcript: string): string => {
  const categories = ['documents', 'health', 'contacts', 'finance', 'personal'];
  const lowerTranscript = transcript.toLowerCase();
  
  for (const category of categories) {
    if (lowerTranscript.includes(category)) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }
  
  return 'Personal'; // Default category
};

const extractOpenTarget = (transcript: string): string => {
  const lowerTranscript = transcript.toLowerCase();
  
  // Enhanced patterns for flexible file/entry opening
  const patterns = [
    // Direct patterns: "open my medical records", "open file invoice.pdf"
    /open\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /edit\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    // Handle "open" followed by anything
    /open\s+(.+)/i,
    /edit\s+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      let target = match[1].trim();
      
      // Clean up common words but preserve the core search term
      target = target.replace(/\b(document|entry|record|item|information)\b/gi, '').trim();
      target = target.replace(/\b(the|a|an|my|our|your)\b/gi, '').trim();
      
      // If we still have meaningful content, return it
      if (target.length > 1) {
        return target;
      }
    }
  }
  
  return '';
};

const extractDeleteTarget = (transcript: string): string => {
  const lowerTranscript = transcript.toLowerCase();
  
  // Enhanced patterns for delete commands
  const patterns = [
    // Direct patterns: "delete my medical records", "remove file invoice"
    /delete\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /remove\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /erase\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /trash\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    // Handle "delete" followed by anything
    /delete\s+(.+)/i,
    /remove\s+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      let target = match[1].trim();
      
      // Clean up common words but preserve the core search term
      target = target.replace(/\b(document|entry|record|item|information|file)\b/gi, '').trim();
      target = target.replace(/\b(the|a|an|my|our|your|this|that)\b/gi, '').trim();
      
      // If we still have meaningful content, return it
      if (target.length > 1) {
        return target;
      }
    }
  }
  
  return '';
};
