
export interface VoiceCommand {
  type: 'create_field' | 'create_entry' | 'delete_entry' | 'open_entry' | 'save_entry' | 'cancel' | 'fill_form' | 'unknown';
  params?: {
    fieldName?: string;
    fieldType?: 'text' | 'number' | 'date' | 'textarea';
    entryTitle?: string;
    entryId?: string;
    entryCategory?: string;
  };
}

export const processVoiceCommand = (transcript: string): VoiceCommand => {
  const lowerTranscript = transcript.toLowerCase().trim();
  
  // Create field commands
  if (lowerTranscript.includes('create') && lowerTranscript.includes('field')) {
    const fieldName = extractFieldName(lowerTranscript);
    const fieldType = extractFieldType(lowerTranscript);
    return {
      type: 'create_field',
      params: { fieldName, fieldType }
    };
  }
  
  // Create entry commands
  if (lowerTranscript.includes('create') && (lowerTranscript.includes('entry') || lowerTranscript.includes('record'))) {
    const entryTitle = extractEntryTitle(lowerTranscript, 'create');
    const entryCategory = extractCategory(lowerTranscript);
    return {
      type: 'create_entry',
      params: { entryTitle, entryCategory }
    };
  }
  // Delete entry commands
  if (lowerTranscript.includes('delete')) {
    const entryTitle = extractEntryTitle(lowerTranscript, 'delete');
    return {
      type: 'delete_entry',
      params: { entryTitle }
    };
  }
  
  // Open entry commands - made more flexible
  if (lowerTranscript.includes('open') || lowerTranscript.includes('show')) {
    const entryTitle = extractEntryTitle(lowerTranscript, lowerTranscript.includes('open') ? 'open' : 'show');
    return {
      type: 'open_entry',
      params: { entryTitle }
    };
  }
  
  // Fill form commands
  if (lowerTranscript.includes('fill') && lowerTranscript.includes('form')) {
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
  
  // Cancel commands
  if (lowerTranscript.includes('cancel') || lowerTranscript.includes('stop') || lowerTranscript.includes('close')) {
    return { type: 'cancel' };
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
  // More flexible patterns to capture various ways of naming entries
  const patterns = [
    // Specific patterns first
    new RegExp(`${action}\\s+([^.]+?)\\s+(?:entry|information)`, 'i'),
    new RegExp(`${action}\\s+(?:entry|information)\\s+(?:called|named)\\s+([^.]+)`, 'i'),
    new RegExp(`${action}\\s+(?:entry|information)\\s+about\\s+([^.]+)`, 'i'),
    new RegExp(`${action}\\s+(?:entry|information)\\s+([^.]+)`, 'i'),
    // More general patterns - capture anything after the action word
    new RegExp(`${action}\\s+([^.]+)`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim().replace(/\.$/, '');
      // Clean up common words that might be captured
      const cleanTitle = title.replace(/\b(the|a|an|my|our|your)\b/gi, '').trim();
      return cleanTitle || title;
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
