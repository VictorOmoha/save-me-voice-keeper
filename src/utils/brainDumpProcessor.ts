
export interface ActionItem {
  text: string;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  assignee?: string;
}

export interface BrainDumpResult {
  title: string;
  category: string;
  tags: string[];
  actionItems: ActionItem[];
  notes: string[];
  keyPoints: string[];
  people: string[];
  structuredFields: Record<string, unknown>;
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
    const tags = this.extractTags(cleanContent);
    const title = this.generateTitle(cleanContent);
    const structuredFields = this.extractStructuredFields(cleanContent);
    const people = this.extractPeople(cleanContent);

    return {
      title,
      category,
      tags,
      actionItems,
      notes,
      keyPoints,
      people,
      structuredFields,
      confidence: this.calculateConfidence(cleanContent, actionItems, keyPoints, notes)
    };
  }

  private extractActionItems(content: string): ActionItem[] {
    const actionPatterns = [
      /(?:need to|have to|must|should|todo|action|task)[\s:]([^.!?]+)/gi,
      /(?:remember to|don't forget to|make sure to)[\s:]([^.!?]+)/gi,
      /(?:call|email|contact|reach out to|schedule|book|set up)[\s:]([^.!?]+)/gi,
      /(?:follow up|check on|review|prepare|complete|finish|send|submit)[\s:]([^.!?]+)/gi,
    ];

    const actions: ActionItem[] = [];
    const seenTexts = new Set<string>();
    const sentences = content.split(/[.!?]+/);

    sentences.forEach(sentence => {
      actionPatterns.forEach(pattern => {
        const matches = sentence.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const cleaned = match.replace(pattern, '$1').trim();
            if (cleaned.length > 3 && !seenTexts.has(cleaned.toLowerCase())) {
              seenTexts.add(cleaned.toLowerCase());
              actions.push(this.createActionItem(cleaned, sentence));
            }
          });
        }
      });
    });

    // Also look for imperative sentences
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (this.isImperative(trimmed) && !seenTexts.has(trimmed.toLowerCase())) {
        seenTexts.add(trimmed.toLowerCase());
        actions.push(this.createActionItem(trimmed, sentence));
      }
    });

    // Sort by priority (high first)
    return actions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
      return (priorityOrder[a.priority || 'undefined'] || 3) - (priorityOrder[b.priority || 'undefined'] || 3);
    });
  }

  private createActionItem(text: string, context: string): ActionItem {
    return {
      text,
      priority: this.extractPriority(context),
      dueDate: this.extractDueDate(context),
      assignee: this.extractAssignee(context),
    };
  }

  private extractPriority(text: string): 'high' | 'medium' | 'low' | undefined {
    const lower = text.toLowerCase();

    // High priority indicators
    if (/\b(urgent|asap|immediately|critical|important|priority|must|crucial|essential|now|today)\b/.test(lower)) {
      return 'high';
    }

    // Low priority indicators
    if (/\b(when\s+(?:you\s+)?(?:have|get)\s+(?:a\s+)?(?:chance|time)|eventually|someday|later|low\s+priority|not\s+urgent|nice\s+to\s+have)\b/.test(lower)) {
      return 'low';
    }

    // Medium priority (default for action items with deadlines but no urgency markers)
    if (/\b(by|before|deadline|due|until|end\s+of)\b/.test(lower)) {
      return 'medium';
    }

    return undefined;
  }

  private extractDueDate(text: string): string | undefined {
    const lower = text.toLowerCase();

    // Relative dates
    if (/\btoday\b/.test(lower)) {
      return new Date().toISOString().split('T')[0];
    }
    if (/\btomorrow\b/.test(lower)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    // Day of week patterns
    const dayMatch = lower.match(/\b(by|before|on|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dayMatch) {
      const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayMatch[2]);
      const today = new Date();
      const currentDay = today.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + daysUntil);
      return targetDate.toISOString().split('T')[0];
    }

    // End of week/month patterns
    if (/\bend\s+of\s+(?:the\s+)?week\b/.test(lower)) {
      const today = new Date();
      const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
      const friday = new Date();
      friday.setDate(today.getDate() + daysUntilFriday);
      return friday.toISOString().split('T')[0];
    }

    if (/\bend\s+of\s+(?:the\s+)?month\b/.test(lower)) {
      const today = new Date();
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return endOfMonth.toISOString().split('T')[0];
    }

    // "next week" pattern
    if (/\bnext\s+week\b/.test(lower)) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }

    // Specific date patterns (already handled in structuredFields, but extract here too)
    const dateMatch = text.match(/\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/);
    if (dateMatch) {
      return dateMatch[1];
    }

    return undefined;
  }

  private extractAssignee(text: string): string | undefined {
    // Look for "for [Name]" or "assign to [Name]" patterns
    const assignMatch = text.match(/\b(?:for|assign(?:ed)?\s+to|ask|tell|have|get)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
    if (assignMatch) {
      return assignMatch[1];
    }
    return undefined;
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
      'Finance': ['bank', 'money', 'payment', 'invoice', 'tax', 'budget', 'financial', 'investment', 'insurance', 'receipt', 'bill', 'refund', 'pricing', 'quote', 'estimate'],
      'Work': ['project', 'meeting', 'deadline', 'client', 'colleague', 'office', 'work', 'job', 'career', 'standup', 'retro', 'sprint', 'OKR', 'roadmap', 'minutes'],
      'Personal': ['family', 'friend', 'hobby', 'personal', 'home', 'vacation', 'travel', 'chores', 'groceries'],
      'Documents': [
        'document', 'doc', 'file', 'record', 'certificate', 'license', 'contract', 'agreement', 'nda', 'proposal', 'sow', 'statement of work',
        'invoice', 'report', 'policy', 'sop', 'standard operating procedure', 'brief', 'memo', 'letter', 'resume', 'cv', 'whitepaper', 'executive summary'
      ],
    };

    const lowerContent = content.toLowerCase();
    let maxMatches = 0;
    let bestCategory: keyof typeof categoryKeywords = 'Personal';

    Object.entries(categoryKeywords).forEach(([cat, keywords]) => {
      const matches = (keywords as string[]).filter(keyword => lowerContent.includes(keyword.toLowerCase())).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = cat as keyof typeof categoryKeywords;
      }
    });

    // Tie-breakers and additional heuristics
    if (bestCategory === 'Personal') {
      if (/meeting\s+notes|action\s+items|agenda/.test(lowerContent)) {
        bestCategory = 'Work';
      }
      if (/dear\s+\w+|executive\s+summary|deliverables|scope|terms|sign\b/.test(lowerContent)) {
        bestCategory = 'Documents';
      }
    }

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

  private extractStructuredFields(content: string): Record<string, unknown> {
    const fields: Record<string, unknown> = {};

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

    // Extract URLs
    const urlMatches = content.match(/https?:\/\/[^\s]+/g);
    if (urlMatches) {
      fields.urls = urlMatches;
    }

    // Extract times
    const timeMatches = content.match(/\b\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?\b/g);
    if (timeMatches) {
      fields.times = timeMatches;
    }

    return fields;
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const lower = content.toLowerCase();

    // Extract hashtags if present
    const hashtagMatches = content.match(/#[a-zA-Z][a-zA-Z0-9_]*/g);
    if (hashtagMatches) {
      hashtagMatches.forEach(tag => tags.push(tag.substring(1)));
    }

    // Infer tags from content
    const tagKeywords: Record<string, string[]> = {
      'meeting': ['meeting', 'standup', 'sync', 'call', 'conference'],
      'urgent': ['urgent', 'asap', 'critical', 'immediately', 'priority'],
      'follow-up': ['follow up', 'follow-up', 'check back', 'revisit'],
      'idea': ['idea', 'thought', 'maybe', 'could try', 'what if'],
      'reminder': ['remember', 'don\'t forget', 'reminder'],
      'deadline': ['deadline', 'due', 'by end of', 'before'],
      'research': ['research', 'look into', 'investigate', 'find out'],
      'decision': ['decide', 'decision', 'choose', 'pick'],
    };

    Object.entries(tagKeywords).forEach(([tag, keywords]) => {
      if (keywords.some(kw => lower.includes(kw)) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });

    return tags;
  }

  private extractPeople(content: string): string[] {
    const people: string[] = [];
    const seenNames = new Set<string>();

    // Pattern for names after common prepositions/verbs
    const namePatterns = [
      /\b(?:with|from|to|for|by|and|ask|tell|email|call|contact|meet(?:ing)?(?:\s+with)?|talk(?:\s+to)?|speak(?:\s+to)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|mentioned|asked|told|wants|needs|will|should)\b/g,
      /\b(?:@)([A-Z][a-z]+(?:[A-Z][a-z]+)?)\b/g, // @mentions
    ];

    // Common words to exclude (not names)
    const excludeWords = new Set([
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
      'Today', 'Tomorrow', 'Yesterday', 'Morning', 'Afternoon', 'Evening', 'Night',
      'The', 'This', 'That', 'These', 'Those', 'Here', 'There',
      'Project', 'Meeting', 'Report', 'Document', 'Email', 'Call', 'Task',
      'Important', 'Urgent', 'Priority', 'Action', 'Note', 'Remember',
      'Work', 'Personal', 'Health', 'Finance', 'Documents',
    ]);

    namePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1]?.trim();
        if (name && name.length > 1 && !excludeWords.has(name) && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          people.push(name);
        }
      }
    });

    return people;
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

  private calculateConfidence(content: string, actionItems: ActionItem[], keyPoints: string[], notes: string[]): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on structure found
    if (actionItems.length > 0) confidence += 0.15;
    if (keyPoints.length > 0) confidence += 0.15;
    if (notes.length > 2) confidence += 0.1;

    // Bonus for action items with metadata
    const actionsWithPriority = actionItems.filter(a => a.priority).length;
    const actionsWithDueDate = actionItems.filter(a => a.dueDate).length;
    if (actionsWithPriority > 0) confidence += 0.05;
    if (actionsWithDueDate > 0) confidence += 0.05;

    // Adjust based on content length and quality
    const wordCount = content.split(' ').length;
    if (wordCount > 20) confidence += 0.1;
    if (wordCount > 50) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }
}

// Helper function to format action items for display
export function formatActionItemsForDisplay(items: ActionItem[]): string {
  return items.map(item => {
    let formatted = item.text;
    const meta: string[] = [];
    if (item.priority) meta.push(`[${item.priority.toUpperCase()}]`);
    if (item.dueDate) meta.push(`Due: ${item.dueDate}`);
    if (item.assignee) meta.push(`@${item.assignee}`);
    if (meta.length > 0) {
      formatted = `${formatted} (${meta.join(' | ')})`;
    }
    return formatted;
  }).join('\n• ');
}

// Helper to convert ActionItems to simple strings (for backward compatibility)
export function actionItemsToStrings(items: ActionItem[]): string[] {
  return items.map(item => {
    let str = item.text;
    if (item.priority === 'high') str = `🔴 ${str}`;
    else if (item.priority === 'medium') str = `🟡 ${str}`;
    else if (item.priority === 'low') str = `🟢 ${str}`;
    if (item.dueDate) str += ` [Due: ${item.dueDate}]`;
    return str;
  });
}

export const brainDumpProcessor = new BrainDumpProcessor();
