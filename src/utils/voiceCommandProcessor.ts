
export interface VoiceCommand {
  type: 'create_field' | 'create_entry' | 'delete_entry' | 'open_entry' | 'save_entry' | 'cancel' | 'fill_form' | 'set_title' | 'set_category' | 'unknown';
  params?: {
    fieldName?: string;
    fieldType?: 'text' | 'number' | 'date' | 'textarea';
    entryTitle?: string;
    entryId?: string;
    entryCategory?: string;
    titleValue?: string;
    categoryValue?: string;
  };
}

export const processVoiceCommand = (transcript: string): VoiceCommand => {
  const lowerTranscript = transcript.toLowerCase().trim();
  console.log('Processing voice command:', lowerTranscript);
  
  // Form field commands - check these first for active forms
  
  // Title setting commands - more natural speech patterns
  if ((lowerTranscript.includes('title') || lowerTranscript.includes('call')) && 
      (lowerTranscript.includes('my') || lowerTranscript.includes('document') || 
       lowerTranscript.includes('entry') || lowerTranscript.includes('name'))) {
    const titleValue = extractTitleFromSpeech(lowerTranscript);
    if (titleValue) {
      console.log('Detected set title command:', { titleValue });
      return {
        type: 'set_title',
        params: { titleValue }
      };
    }
  }
  
  // Category setting commands - natural speech patterns  
  if (lowerTranscript.includes('category') || 
      (lowerTranscript.includes('set') && (lowerTranscript.includes('personal') || 
       lowerTranscript.includes('documents') || lowerTranscript.includes('health') || 
       lowerTranscript.includes('finance') || lowerTranscript.includes('contacts')))) {
    const categoryValue = extractCategoryFromSpeech(lowerTranscript);
    if (categoryValue) {
      console.log('Detected set category command:', { categoryValue });
      return {
        type: 'set_category',
        params: { categoryValue }
      };
    }
  }
  
  // Enhanced pattern matching for better command recognition
  
  // Create entry commands - prioritize conversation mode over title extraction
  if ((lowerTranscript.includes('create') || lowerTranscript.includes('add') || lowerTranscript.includes('new')) && 
      (lowerTranscript.includes('entry') || lowerTranscript.includes('record') || lowerTranscript.includes('item'))) {
    
    // Don't extract titles for generic "create entry" commands - start conversation instead
    const isGenericCommand = lowerTranscript.includes('new entry') || 
                           lowerTranscript.includes('create entry') ||
                           lowerTranscript.includes('add entry') ||
                           lowerTranscript === 'create' ||
                           lowerTranscript === 'new';
    
    const entryTitle = isGenericCommand ? '' : extractEntryTitle(lowerTranscript, 'create');
    const entryCategory = extractCategory(lowerTranscript);
    
    console.log('Detected create entry command:', { 
      entryTitle, 
      entryCategory, 
      isGenericCommand,
      originalTranscript: lowerTranscript 
    });
    
    return {
      type: 'create_entry',
      params: { entryTitle, entryCategory }
    };
  }

  // Show/view all entries - very flexible patterns
  if ((lowerTranscript.includes('show') || lowerTranscript.includes('view') || lowerTranscript.includes('display') || lowerTranscript.includes('list')) && 
      (lowerTranscript.includes('all') || lowerTranscript.includes('entries') || lowerTranscript.includes('documents') || lowerTranscript.includes('my'))) {
    console.log('Detected show all entries command');
    return {
      type: 'open_entry',
      params: { entryTitle: 'all_entries' }
    };
  }
  
  // Create field commands
  if ((lowerTranscript.includes('create') || lowerTranscript.includes('add')) && lowerTranscript.includes('field')) {
    const fieldName = extractFieldName(lowerTranscript);
    const fieldType = extractFieldType(lowerTranscript);
    console.log('Detected create field command:', { fieldName, fieldType });
    return {
      type: 'create_field',
      params: { fieldName, fieldType }
    };
  }
  
  // Delete entry commands
  if (lowerTranscript.includes('delete') || lowerTranscript.includes('remove')) {
    const entryTitle = extractEntryTitle(lowerTranscript, 'delete');
    console.log('Detected delete command:', { entryTitle });
    return {
      type: 'delete_entry',
      params: { entryTitle }
    };
  }
  
  // Open specific entry commands
  if ((lowerTranscript.includes('open') || lowerTranscript.includes('edit')) && !lowerTranscript.includes('all')) {
    const entryTitle = extractEntryTitle(lowerTranscript, 'open');
    console.log('Detected open entry command:', { entryTitle });
    return {
      type: 'open_entry',
      params: { entryTitle }
    };
  }
  
  // Fill form commands
  if (lowerTranscript.includes('fill') && (lowerTranscript.includes('form') || lowerTranscript.includes('template'))) {
    const entryTitle = extractEntryTitle(lowerTranscript, 'fill');
    console.log('Detected fill form command:', { entryTitle });
    return {
      type: 'fill_form',
      params: { entryTitle }
    };
  }
  
  // Save entry commands
  if (lowerTranscript.includes('save')) {
    const entryTitle = extractEntryTitle(lowerTranscript, 'save');
    console.log('Detected save command:', { entryTitle });
    return {
      type: 'save_entry',
      params: { entryTitle }
    };
  }
  
  // Cancel commands
  if (lowerTranscript.includes('cancel') || lowerTranscript.includes('stop') || lowerTranscript.includes('close')) {
    console.log('Detected cancel command');
    return { type: 'cancel' };
  }
  
  console.log('Unknown command:', lowerTranscript);
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

const extractFormValue = (transcript: string, fieldType: string): string => {
  const lowerTranscript = transcript.toLowerCase();
  
  // Pattern 1: "TITLE: My Document" or "CATEGORY: Personal"
  const colonPattern = new RegExp(`${fieldType}:\\s*(.+)`, 'i');
  const colonMatch = transcript.match(colonPattern);
  if (colonMatch && colonMatch[1]) {
    return colonMatch[1].trim();
  }
  
  // Pattern 2: "SET TITLE My Document" or "TITLE My Document"  
  const setPattern = new RegExp(`(?:set\\s+)?${fieldType}\\s+(.+)`, 'i');
  const setMatch = transcript.match(setPattern);
  if (setMatch && setMatch[1]) {
    return setMatch[1].trim();
  }
  
  return '';
};

const extractTitleFromSpeech = (transcript: string): string => {
  // Handle speech recognition variations like "title call on my document" -> "My Document"
  const patterns = [
    /title.*?(?:call|called|is|named|should be).*?(?:on|for)?\s*(.+)/i,
    /(?:call|name)\s+(?:it|this|the\s+(?:entry|document))?\s*(.+)/i,
    /title\s+(.+)/i,
    /(?:set|make)\s+(?:the\s+)?title\s+(.+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      let title = match[1].trim();
      // Clean up common speech recognition artifacts
      title = title.replace(/\b(my|the|a|an|document|entry)\b/gi, '').trim();
      if (title.length > 2) {
        return title;
      }
    }
  }
  
  return '';
};

const extractCategoryFromSpeech = (transcript: string): string => {
  const categories = ['personal', 'documents', 'health', 'finance', 'contacts'];
  const lowerTranscript = transcript.toLowerCase();
  
  for (const category of categories) {
    if (lowerTranscript.includes(category)) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }
  
  return '';
};
