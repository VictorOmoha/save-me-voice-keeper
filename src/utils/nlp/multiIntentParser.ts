export interface ParsedIntent {
  type: string;
  confidence: number;
  parameters: Record<string, any>;
  rawText: string;
  position: { start: number; end: number };
}

export interface MultiIntentResult {
  intents: ParsedIntent[];
  hasMultipleIntents: boolean;
  originalText: string;
  coordinators: string[];
}

export class MultiIntentParser {
  private coordinators = [
    'and then', 'then', 'after that', 'next', 'afterwards',
    'and also', 'also', 'plus', 'additionally',
    'followed by', 'before', 'first', 'second', 'finally'
  ];

  private intentPatterns = [
    { pattern: /\b(create|add|new)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: 'create_entry' },
    { pattern: /\b(open|edit|show)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: 'open_entry' },
    { pattern: /\b(delete|remove|trash)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: 'delete_entry' },
    { pattern: /\b(close|cancel|stop|exit)\s*([^,]*?)(?:\s+(?:and|then|,)|$)/gi, type: 'cancel' },
    { pattern: /\b(save|store)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: 'save_entry' },
    { pattern: /\b(search|find|look\s+for)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: 'search_entries' },
    { pattern: /\b(go\s+to|navigate\s+to|show\s+me)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: 'navigate_view' }
  ];

  parse(text: string): MultiIntentResult {
    console.log('🔍 MultiIntentParser: Parsing text:', text);

    const normalizedText = this.normalizeText(text);
    const segments = this.segmentByCoordinators(normalizedText);
    
    console.log('🔍 MultiIntentParser: Found segments:', segments);

    const intents: ParsedIntent[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const parsedIntent = this.parseSegment(segment, i);
      
      if (parsedIntent) {
        intents.push(parsedIntent);
        console.log('✅ MultiIntentParser: Parsed intent:', parsedIntent);
      } else {
        console.log('❌ MultiIntentParser: Failed to parse segment:', segment);
      }
    }

    const result: MultiIntentResult = {
      intents,
      hasMultipleIntents: intents.length > 1,
      originalText: text,
      coordinators: this.findCoordinators(normalizedText)
    };

    console.log('🎯 MultiIntentParser: Final result:', result);
    return result;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      // Normalize common speech recognition errors
      .replace(/\bopen\s+([^.]+?)\s+policy\b/g, 'close $1 policy')
      .replace(/\bopening\s+([^.]+?)\s+policy\b/g, 'close $1 policy')
      // Standardize coordinators
      .replace(/\s+and\s+then\s+/g, ' and then ')
      .replace(/\s+then\s+/g, ' then ')
      .replace(/\s+after\s+that\s+/g, ' after that ')
      .replace(/\s+also\s+/g, ' also ')
      .replace(/\s+plus\s+/g, ' plus ');
  }

  private segmentByCoordinators(text: string): string[] {
    let segments: string[] = [text];

    // Split by coordinators while preserving order
    for (const coordinator of this.coordinators) {
      const newSegments: string[] = [];
      
      for (const segment of segments) {
        if (segment.includes(coordinator)) {
          const parts = segment.split(new RegExp(`\\s+${coordinator}\\s+`, 'i'));
          newSegments.push(...parts.filter(p => p.trim().length > 0));
        } else {
          newSegments.push(segment);
        }
      }
      
      segments = newSegments;
    }

    return segments.filter(s => s.trim().length > 2);
  }

  private parseSegment(segment: string, position: number): ParsedIntent | null {
    const trimmedSegment = segment.trim();
    
    for (const { pattern, type } of this.intentPatterns) {
      pattern.lastIndex = 0; // Reset regex
      const match = pattern.exec(trimmedSegment);
      
      if (match) {
        const parameters = this.extractParameters(trimmedSegment, type, match);
        
        return {
          type,
          confidence: this.calculateConfidence(trimmedSegment, type),
          parameters,
          rawText: trimmedSegment,
          position: { start: 0, end: trimmedSegment.length }
        };
      }
    }

    // Fallback: try to infer intent from keywords
    return this.inferIntentFromKeywords(trimmedSegment, position);
  }

  private extractParameters(text: string, intentType: string, match: RegExpExecArray): Record<string, any> {
    const params: Record<string, any> = {};

    switch (intentType) {
      case 'create_entry':
        params.entryTitle = this.cleanEntityText(match[2] || '');
        params.entryCategory = this.extractCategory(text);
        break;
        
      case 'open_entry':
      case 'delete_entry':
        params.entryTitle = this.cleanEntityText(match[2] || '');
        break;
        
      case 'save_entry':
        params.entryTitle = this.cleanEntityText(match[2] || '');
        break;
        
      case 'search_entries':
        params.query = this.cleanEntityText(match[2] || '');
        params.category = this.extractCategory(text);
        break;
        
      case 'navigate_view':
        params.destination = this.cleanEntityText(match[2] || '');
        break;
        
      case 'cancel':
        // No additional parameters needed
        break;
    }

    return params;
  }

  private cleanEntityText(text: string): string {
    return text
      .replace(/\b(the|a|an|my|our|your|new|called|named)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractCategory(text: string): string {
    const categories = ['documents', 'health', 'contacts', 'finance', 'personal'];
    const lowerText = text.toLowerCase();
    
    for (const category of categories) {
      if (lowerText.includes(category)) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }
    
    return 'Personal';
  }

  private calculateConfidence(text: string, intentType: string): number {
    // Simple confidence calculation based on keyword presence and text clarity
    let confidence = 0.5;
    
    const intentKeywords = {
      create_entry: ['create', 'add', 'new', 'entry', 'record'],
      open_entry: ['open', 'edit', 'show', 'view'],
      delete_entry: ['delete', 'remove', 'trash'],
      cancel: ['close', 'cancel', 'stop', 'exit'],
      save_entry: ['save', 'store'],
      search_entries: ['search', 'find', 'look'],
      navigate_view: ['go', 'navigate', 'show']
    };

    const keywords = intentKeywords[intentType as keyof typeof intentKeywords] || [];
    const foundKeywords = keywords.filter(keyword => text.includes(keyword));
    
    confidence += (foundKeywords.length / keywords.length) * 0.4;
    
    // Penalty for very short or unclear text
    if (text.length < 5) confidence -= 0.2;
    if (text.split(' ').length < 2) confidence -= 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private inferIntentFromKeywords(text: string, position: number): ParsedIntent | null {
    // Fallback intent detection based on primary keywords
    const fallbackPatterns = [
      { keywords: ['create', 'add', 'new'], type: 'create_entry' },
      { keywords: ['open', 'show', 'edit'], type: 'open_entry' },
      { keywords: ['delete', 'remove'], type: 'delete_entry' },
      { keywords: ['close', 'cancel'], type: 'cancel' },
      { keywords: ['save'], type: 'save_entry' }
    ];

    for (const { keywords, type } of fallbackPatterns) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return {
          type,
          confidence: 0.3, // Lower confidence for fallback detection
          parameters: { entryTitle: this.cleanEntityText(text) },
          rawText: text,
          position: { start: 0, end: text.length }
        };
      }
    }

    return null;
  }

  private findCoordinators(text: string): string[] {
    const found: string[] = [];
    
    for (const coordinator of this.coordinators) {
      if (text.includes(coordinator)) {
        found.push(coordinator);
      }
    }
    
    return found;
  }

  // Validation methods
  validateParameters(intent: ParsedIntent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    switch (intent.type) {
      case 'create_entry':
        if (!intent.parameters.entryTitle || intent.parameters.entryTitle.length < 2) {
          errors.push('Entry title must be at least 2 characters');
        }
        break;
        
      case 'open_entry':
      case 'delete_entry':
        if (!intent.parameters.entryTitle || intent.parameters.entryTitle.length < 1) {
          errors.push('Entry identifier is required');
        }
        break;
        
      case 'search_entries':
        if (!intent.parameters.query || intent.parameters.query.length < 1) {
          errors.push('Search query is required');
        }
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}