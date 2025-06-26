
export interface VoiceCommand {
  type: 'create_field' | 'delete_entry' | 'open_entry' | 'save_entry' | 'cancel' | 'fill_form' | 'unknown';
  params?: {
    fieldName?: string;
    fieldType?: 'text' | 'number' | 'date' | 'textarea';
    entryTitle?: string;
    entryId?: string;
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
  
  // Delete entry commands
  if (lowerTranscript.includes('delete') && (lowerTranscript.includes('entry') || lowerTranscript.includes('information'))) {
    const entryTitle = extractEntryTitle(lowerTranscript, 'delete');
    return {
      type: 'delete_entry',
      params: { entryTitle }
    };
  }
  
  // Open entry commands
  if ((lowerTranscript.includes('open') || lowerTranscript.includes('show')) && (lowerTranscript.includes('entry') || lowerTranscript.includes('information'))) {
    const entryTitle = extractEntryTitle(lowerTranscript, 'open');
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
  if (lowerTranscript.includes('save') && (lowerTranscript.includes('entry') || lowerTranscript.includes('information'))) {
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
  // Look for patterns like "delete entry called xyz" or "open information about xyz"
  const patterns = [
    new RegExp(`${action}.*(?:entry|information).*called\\s+([^.]+)`, 'i'),
    new RegExp(`${action}.*(?:entry|information)\\s+about\\s+([^.]+)`, 'i'),
    new RegExp(`${action}.*(?:entry|information)\\s+([^.]+)`, 'i'),
    new RegExp(`${action}\\s+([^.]+)`, 'i')
  ];
  
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/\.$/, '');
    }
  }
  
  return '';
};
