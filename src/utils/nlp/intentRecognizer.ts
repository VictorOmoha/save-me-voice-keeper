
export interface Intent {
  name: string;
  confidence: number;
  parameters: Record<string, unknown>;
  requiredParameters: string[];
  optionalParameters: string[];
}

export interface IntentPattern {
  intent: string;
  patterns: RegExp[];
  requiredParams: string[];
  optionalParams: string[];
  examples: string[];
}

export class IntentRecognizer {
  private patterns: IntentPattern[] = [
    {
      intent: 'create_entry',
      patterns: [
        /(?:create|add|new|make)\s+(?:a\s+)?(?:new\s+)?(?:entry|record|item|document)/i,
        /(?:create|add)\s+(?:.*\s+)?(?:entry|record|item)/i,
        /new\s+(?:entry|record|item|document)/i
      ],
      requiredParams: [],
      optionalParams: ['title', 'category', 'description'],
      examples: ['create new entry', 'add entry', 'new document', 'create medical record']
    },
    {
      intent: 'delete_entry',
      patterns: [
        /(?:delete|remove|erase|trash)\s+(?:.*)/i,
        /get\s+rid\s+of\s+(?:.*)/i
      ],
      requiredParams: ['target'],
      optionalParams: ['confirmation'],
      examples: ['delete medical record', 'remove invoice', 'trash old entries']
    },
    {
      intent: 'edit_entry',
      patterns: [
        /(?:edit|modify|update|change)\s+(?:.*)/i,
        /open\s+(?:.*)\s+(?:for\s+)?(?:editing|modification)/i
      ],
      requiredParams: ['target'],
      optionalParams: [],
      examples: ['edit medical record', 'modify invoice', 'update contact info']
    },
    {
      intent: 'search_entries',
      patterns: [
        /(?:search|find|look\s+for|locate)\s+(?:.*)/i,
        /show\s+(?:me\s+)?(?:.*)/i,
        /where\s+(?:is|are)\s+(?:.*)/i
      ],
      requiredParams: ['query'],
      optionalParams: ['category', 'dateRange'],
      examples: ['search medical records', 'find invoice', 'show me documents']
    },
    {
      intent: 'navigate_view',
      patterns: [
        /(?:go\s+to|navigate\s+to|show\s+me|open)\s+(?:.*)/i,
        /(?:view|display)\s+(?:.*)/i
      ],
      requiredParams: ['destination'],
      optionalParams: [],
      examples: ['go to health category', 'show documents', 'navigate to contacts']
    },
    {
      intent: 'export_data',
      patterns: [
        /(?:export|download|save\s+as)\s+(?:.*)/i,
        /generate\s+(?:.*)\s+(?:report|file)/i
      ],
      requiredParams: ['format'],
      optionalParams: ['filter', 'category'],
      examples: ['export to PDF', 'download CSV', 'save as Excel']
    },
    {
      intent: 'help',
      patterns: [
        /(?:help|assistance|what\s+can\s+you\s+do)/i,
        /(?:how\s+do\s+i|show\s+me\s+how)/i,
        /(?:commands|instructions)/i
      ],
      requiredParams: [],
      optionalParams: ['topic'],
      examples: ['help', 'what can you do', 'show me commands']
    }
  ];

  recognizeIntent(text: string): Intent {
    const normalizedText = text.toLowerCase().trim();
    
    for (const pattern of this.patterns) {
      for (const regex of pattern.patterns) {
        const match = normalizedText.match(regex);
        if (match) {
          const parameters = this.extractParameters(text, pattern);
          const confidence = this.calculateConfidence(text, pattern, match);
          
          return {
            name: pattern.intent,
            confidence,
            parameters,
            requiredParameters: pattern.requiredParams,
            optionalParameters: pattern.optionalParams
          };
        }
      }
    }

    return {
      name: 'unknown',
      confidence: 0,
      parameters: {},
      requiredParameters: [],
      optionalParameters: []
    };
  }

  private extractParameters(text: string, pattern: IntentPattern): Record<string, unknown> {
    const parameters: Record<string, unknown> = {};
    
    switch (pattern.intent) {
      case 'create_entry':
        parameters.title = this.extractTitle(text);
        parameters.category = this.extractCategory(text);
        parameters.description = this.extractDescription(text);
        break;
        
      case 'delete_entry':
      case 'edit_entry':
        parameters.target = this.extractTarget(text);
        break;
        
      case 'search_entries':
        parameters.query = this.extractSearchQuery(text);
        parameters.category = this.extractCategory(text);
        break;
        
      case 'navigate_view':
        parameters.destination = this.extractDestination(text);
        break;
        
      case 'export_data':
        parameters.format = this.extractFormat(text);
        parameters.filter = this.extractFilter(text);
        break;
    }
    
    return parameters;
  }

  private extractTitle(text: string): string {
    const patterns = [
      /(?:called|named|titled)\s+"([^"]+)"/i,
      /(?:called|named|titled)\s+([^.]+)/i,
      /(?:for|about)\s+([^.]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  private extractCategory(text: string): string {
    const categories = ['health', 'medical', 'finance', 'financial', 'personal', 'documents', 'contacts'];
    const lowerText = text.toLowerCase();
    
    for (const category of categories) {
      if (lowerText.includes(category)) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }
    
    return 'Personal';
  }

  private extractDescription(text: string): string {
    const patterns = [
      /(?:with|containing|about)\s+([^.]+)/i,
      /(?:description|details?):\s*([^.]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  private extractTarget(text: string): string {
    const actionWords = ['delete', 'remove', 'erase', 'trash', 'edit', 'modify', 'update', 'change'];
    const lowerText = text.toLowerCase();
    
    for (const action of actionWords) {
      const index = lowerText.indexOf(action);
      if (index !== -1) {
        const remaining = text.substring(index + action.length).trim();
        if (remaining) {
          return remaining.replace(/^(the|my|a|an)\s+/i, '').trim();
        }
      }
    }
    
    return '';
  }

  private extractSearchQuery(text: string): string {
    const patterns = [
      /(?:search|find|look\s+for|locate)\s+(?:for\s+)?([^.]+)/i,
      /show\s+(?:me\s+)?([^.]+)/i,
      /where\s+(?:is|are)\s+([^.]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  private extractDestination(text: string): string {
    const patterns = [
      /(?:go\s+to|navigate\s+to|show\s+me|open)\s+([^.]+)/i,
      /(?:view|display)\s+([^.]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  private extractFormat(text: string): string {
    const formats = ['pdf', 'csv', 'excel', 'json', 'xml'];
    const lowerText = text.toLowerCase();
    
    for (const format of formats) {
      if (lowerText.includes(format)) {
        return format.toUpperCase();
      }
    }
    
    return 'CSV';
  }

  private extractFilter(text: string): string {
    const patterns = [
      /(?:only|just)\s+([^.]+)/i,
      /(?:filter\s+by|where)\s+([^.]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  private calculateConfidence(text: string, pattern: IntentPattern, match: RegExpMatchArray): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for exact matches
    if (match[0] === text.toLowerCase().trim()) {
      confidence += 0.3;
    }
    
    // Boost confidence if parameters are found
    const parameters = this.extractParameters(text, pattern);
    const foundParams = Object.values(parameters).filter(val => val && val !== '').length;
    confidence += foundParams * 0.1;
    
    // Boost confidence for longer matches
    confidence += (match[0].length / text.length) * 0.2;
    
    return Math.min(confidence, 1.0);
  }

  getAvailableIntents(): string[] {
    return this.patterns.map(p => p.intent);
  }

  getExamplesForIntent(intent: string): string[] {
    const pattern = this.patterns.find(p => p.intent === intent);
    return pattern?.examples || [];
  }
}
