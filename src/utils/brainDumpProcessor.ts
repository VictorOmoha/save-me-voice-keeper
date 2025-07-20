
export interface BrainDumpResult {
  title: string;
  category: string;
  actionItems: string[];
  notes: string[];
  keyPoints: string[];
  structuredFields: Record<string, any>;
  confidence: number;
}

export class BrainDumpProcessor {
  
  processBrainDump(content: string): BrainDumpResult {
    console.log('🧠 Processing brain dump content:', content);
    
    const cleanContent = content.replace(/^BRAIN_DUMP:\s*/, '').trim();
    
    // Extract different components from the content
    const actionItems = this.extractActionItems(cleanContent);
    const keyPoints = this.extractKeyPoints(cleanContent);
    const notes = this.extractNotes(cleanContent);
    const category = this.inferCategory(cleanContent);
    const title = this.generateTitle(cleanContent);
    const structuredFields = this.extractStructuredFields(cleanContent);
    
    return {
      title,
      category,
      actionItems,
      notes,
      keyPoints,
      structuredFields,
      confidence: this.calculateConfidence(cleanContent, actionItems, keyPoints, notes)
    };
  }

  private extractActionItems(content: string): string[] {
    const actionPatterns = [
      /(?:need to|have to|must|should|todo|action|task)[\s:]([^.!?]+)/gi,
      /(?:remember to|don't forget to|make sure to)[\s:]([^.!?]+)/gi,
      /(?:call|email|contact|reach out to|schedule|book|set up)[\s:]([^.!?]+)/gi,
    ];

    const actions: string[] = [];
    const sentences = content.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      actionPatterns.forEach(pattern => {
        const matches = sentence.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const cleaned = match.replace(pattern, '$1').trim();
            if (cleaned.length > 3) {
              actions.push(cleaned);
            }
          });
        }
      });
    });

    // Also look for imperative sentences
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (this.isImperative(trimmed)) {
        actions.push(trimmed);
      }
    });

    return [...new Set(actions)]; // Remove duplicates
  }

  private extractKeyPoints(content: string): string[] {
    const keyPoints: string[] = [];
    const sentences = content.split(/[.!?]+/);
    
    // Look for emphasized content
    const emphasisPatterns = [
      /important[ly]?\s*[:-]?\s*([^.!?]+)/gi,
      /key\s+(?:point|thing|issue)\s*[:-]?\s*([^.!?]+)/gi,
      /note\s+that\s+([^.!?]+)/gi,
      /remember\s+([^.!?]+)/gi,
    ];

    sentences.forEach(sentence => {
      // Check for emphasis patterns
      emphasisPatterns.forEach(pattern => {
        const match = sentence.match(pattern);
        if (match && match[1]) {
          keyPoints.push(match[1].trim());
        }
      });

      // Look for sentences with numbers or specific details
      if (this.containsSpecificDetails(sentence)) {
        keyPoints.push(sentence.trim());
      }
    });

    return [...new Set(keyPoints)];
  }

  private extractNotes(content: string): string[] {
    const sentences = content.split(/[.!?]+/);
    const notes: string[] = [];
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && !this.isActionItem(trimmed) && !this.isKeyPoint(trimmed)) {
        notes.push(trimmed);
      }
    });

    return notes;
  }

  private inferCategory(content: string): string {
    const categoryKeywords = {
      'Health': ['doctor', 'medical', 'prescription', 'health', 'hospital', 'clinic', 'medication', 'treatment'],
      'Finance': ['bank', 'money', 'payment', 'invoice', 'tax', 'budget', 'financial', 'investment', 'insurance'],
      'Work': ['project', 'meeting', 'deadline', 'client', 'colleague', 'office', 'work', 'job', 'career'],
      'Personal': ['family', 'friend', 'hobby', 'personal', 'home', 'vacation', 'travel'],
      'Documents': ['document', 'file', 'record', 'certificate', 'license', 'contract', 'agreement'],
    };

    const lowerContent = content.toLowerCase();
    let maxMatches = 0;
    let bestCategory = 'Personal';

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      const matches = keywords.filter(keyword => lowerContent.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    });

    return bestCategory;
  }

  private generateTitle(content: string): string {
    const sentences = content.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim();
    
    if (firstSentence && firstSentence.length > 0) {
      // Extract the first few words or main subject
      const words = firstSentence.split(' ').slice(0, 6);
      let title = words.join(' ');
      
      // Clean up the title
      title = title.replace(/^(so|well|um|uh|okay|alright)\s+/i, '');
      title = title.charAt(0).toUpperCase() + title.slice(1);
      
      return title.length > 50 ? title.substring(0, 47) + '...' : title;
    }
    
    return `Brain Dump - ${new Date().toLocaleDateString()}`;
  }

  private extractStructuredFields(content: string): Record<string, any> {
    const fields: Record<string, any> = {};
    
    // Extract dates
    const dateMatches = content.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g);
    if (dateMatches) {
      fields.dates = dateMatches;
    }

    // Extract phone numbers
    const phoneMatches = content.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
    if (phoneMatches) {
      fields.phoneNumbers = phoneMatches;
    }

    // Extract email addresses
    const emailMatches = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    if (emailMatches) {
      fields.emails = emailMatches;
    }

    // Extract amounts/prices
    const amountMatches = content.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g);
    if (amountMatches) {
      fields.amounts = amountMatches;
    }

    return fields;
  }

  private isImperative(sentence: string): boolean {
    const imperativeStarters = ['call', 'email', 'send', 'buy', 'get', 'make', 'do', 'go', 'come', 'take', 'bring'];
    const firstWord = sentence.split(' ')[0]?.toLowerCase();
    return imperativeStarters.includes(firstWord || '');
  }

  private containsSpecificDetails(sentence: string): boolean {
    // Check for numbers, dates, times, proper nouns, etc.
    return /\b\d+\b|\b[A-Z][a-z]+\s+[A-Z][a-z]+\b|\b\d{1,2}:\d{2}\b/.test(sentence);
  }

  private isActionItem(sentence: string): boolean {
    return /\b(?:need to|have to|must|should|call|email|contact|schedule|book|remember to)\b/i.test(sentence);
  }

  private isKeyPoint(sentence: string): boolean {
    return /\b(?:important|key|note|remember)\b/i.test(sentence);
  }

  private calculateConfidence(content: string, actionItems: string[], keyPoints: string[], notes: string[]): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on structure found
    if (actionItems.length > 0) confidence += 0.2;
    if (keyPoints.length > 0) confidence += 0.2;
    if (notes.length > 2) confidence += 0.1;
    
    // Adjust based on content length and quality
    const wordCount = content.split(' ').length;
    if (wordCount > 20) confidence += 0.1;
    if (wordCount > 50) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
}

export const brainDumpProcessor = new BrainDumpProcessor();
