import { supabase } from "@/integrations/supabase/client";
import { SavedEntry } from "@/types/dashboard";

export interface EnhancedVoiceCommand {
  intent: 'create' | 'delete' | 'edit' | 'search' | 'navigate' | 'export' | 'bulk_operation' | 'form_fill' | 'conversation' | 'unknown';
  action: string;
  confidence: number;
  parameters: Record<string, any>;
  needsConfirmation: boolean;
  conversationalResponse: string;
  followUpQuestions?: string[];
  originalTranscript: string;
  expectsFollowUp?: boolean;
  context?: {
    category?: string;
    entryTitle?: string;
    operation?: string;
    fields?: any;
  };
}

export interface VoiceContext {
  currentView?: string;
  availableEntries?: Array<{ id: string; title: string; category: string }>;
  currentEntry?: { id: string; title: string };
  previousCommands?: string[];
}

export class EnhancedVoiceProcessor {
  private conversationHistory: string[] = [];
  private pendingConfirmation: EnhancedVoiceCommand | null = null;
  private maxRetries = 3;
  private retryCount = 0;
  private currentContext: any = null;
  private expectingFollowUp: boolean = false;

  async processVoiceCommand(
    transcript: string,
    context: VoiceContext
  ): Promise<EnhancedVoiceCommand> {
    try {
      console.log('Processing enhanced voice command:', transcript);
      
      // FIRST LINE OF DEFENSE: Check if this is clearly TTS output
      const lowerTranscript = transcript.toLowerCase().trim();
      
      // Only block if this starts with clear TTS phrases AND is not a follow-up response
      const ttsIndicators = [
        /^i'?ll help you/,
        /^what information would you like/,
        /^what would you like to add/,
        /^perfect! i'?ll create/,
        /^successfully created/,
        /^i'?ll\s/,
        /^what\s.*\?$/,
        /^would you like.*\?$/,
      ];
      
      // Don't block if we're expecting a follow-up (user is responding to our question)
      const isClearlyTTS = !this.expectingFollowUp && ttsIndicators.some(pattern => pattern.test(lowerTranscript));
      if (isClearlyTTS) {
        console.log('🚫 VOICE PROCESSOR: Blocking TTS feedback:', transcript);
        return {
          intent: 'unknown',
          action: 'tts_feedback_blocked',
          confidence: 0,
          parameters: {},
          needsConfirmation: false,
          conversationalResponse: '',
          originalTranscript: transcript,
        };
      }
      
      // Check if this is a confirmation response
      if (this.pendingConfirmation && this.isConfirmationResponse(transcript)) {
        const confirmed = this.extractConfirmation(transcript);
        const command = this.pendingConfirmation;
        this.pendingConfirmation = null;
        this.expectingFollowUp = false;
        this.currentContext = null;
        
        return {
          ...command,
          parameters: { ...command.parameters, confirmed },
          needsConfirmation: false,
          conversationalResponse: confirmed 
            ? `Confirmed! I'll ${command.action} now.`
            : 'Okay, I\'ve cancelled that action. What else can I help you with?'
        };
      }

      // Handle follow-up responses in ongoing conversations
      if (this.expectingFollowUp && this.currentContext) {
        return this.handleFollowUpResponse(transcript, context);
      }

      // Add current command to history
      this.conversationHistory.push(transcript);
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      // Prepare context for AI processing
      const enhancedContext = {
        ...context,
        previousCommands: this.conversationHistory,
      };

      // Try local pattern matching first
      const localCommand = this.processLocalCommand(transcript, enhancedContext);
      if (localCommand.confidence > 0.5) {
        console.log('Using local command processing:', localCommand);
        return localCommand;
      }

      // Call the Supabase Edge Function for AI processing as fallback
      const { data, error } = await supabase.functions.invoke('voice-ai-processor', {
        body: {
          transcript,
          context: enhancedContext,
        },
      });

      if (error) {
        console.error('Error calling voice AI processor:', error);
        // Fall back to local processing
        return localCommand;
      }
      
      // Reset retry count on success
      this.retryCount = 0;

      const processedCommand: EnhancedVoiceCommand = {
        ...data,
        originalTranscript: transcript,
      };

      // Store pending confirmation if needed
      if (processedCommand.needsConfirmation) {
        this.pendingConfirmation = processedCommand;
      }

      // Set up follow-up expectations
      if (processedCommand.expectsFollowUp) {
        this.expectingFollowUp = true;
        this.currentContext = processedCommand.context;
      }

      console.log('Processed command:', processedCommand);
      return processedCommand;

    } catch (error) {
      console.error('Error processing voice command:', error);
      
      // Fallback to basic processing for safety
      return {
        intent: 'unknown',
        action: 'error',
        confidence: 0,
        parameters: {},
        needsConfirmation: false,
        conversationalResponse: 'Sorry, I had trouble understanding that. Could you please try again?',
        followUpQuestions: ['Try saying something like "Create a new entry" or "Show me my documents"'],
        originalTranscript: transcript,
      };
    }
  }

  private processLocalCommand(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Create entry patterns
    if (this.matchesPattern(lowerTranscript, ['create', 'add', 'new'], ['entry', 'record', 'item'])) {
      return {
        intent: 'create',
        action: 'create_entry',
        confidence: 0.9,
        parameters: { type: 'entry' },
        needsConfirmation: false,
        conversationalResponse: 'I\'ll help you create a new entry. What information would you like to add?',
        followUpQuestions: ['What category should this entry be in?'],
        originalTranscript: transcript,
        expectsFollowUp: true,
        context: {
          operation: 'create_entry',
          category: 'Personal',
          entryTitle: `New Entry - ${new Date().toLocaleDateString()}`
        }
      };
    }

    // Show/view all entries
    if (this.matchesPattern(lowerTranscript, ['show', 'view', 'display', 'list'], ['all', 'entries', 'documents', 'items'])) {
      return {
        intent: 'navigate',
        action: 'show_all_entries',
        confidence: 0.9,
        parameters: {},
        needsConfirmation: false,
        conversationalResponse: 'I\'ll show you all your entries.',
        originalTranscript: transcript,
      };
    }

    // Search patterns
    if (this.matchesPattern(lowerTranscript, ['search', 'find', 'look'], ['for'])) {
      const searchTerm = this.extractSearchTerm(lowerTranscript);
      return {
        intent: 'search',
        action: 'search_entries',
        confidence: 0.8,
        parameters: { query: searchTerm },
        needsConfirmation: false,
        conversationalResponse: searchTerm 
          ? `I'll search for "${searchTerm}" in your entries.`
          : 'What would you like me to search for?',
        originalTranscript: transcript,
      };
    }

    // Category navigation
    const categories = ['documents', 'health', 'contacts', 'finance', 'personal'];
    for (const category of categories) {
      if (lowerTranscript.includes(category)) {
        return {
          intent: 'navigate',
          action: 'navigate_to_category',
          confidence: 0.8,
          parameters: { category: category.charAt(0).toUpperCase() + category.slice(1) },
          needsConfirmation: false,
          conversationalResponse: `I'll show you your ${category} entries.`,
          originalTranscript: transcript,
        };
      }
    }

    // Default unknown command
    return {
      intent: 'unknown',
      action: 'unknown',
      confidence: 0.1,
      parameters: {},
      needsConfirmation: false,
      conversationalResponse: 'I didn\'t quite understand that. Could you please rephrase your request?',
      followUpQuestions: [
        'Try saying "Create a new entry" or "Show me my documents"',
        'You can also say "Search for [term]" or navigate to categories like "Show my health records"'
      ],
      originalTranscript: transcript,
    };
  }

  private matchesPattern(text: string, triggerWords: string[], contextWords: string[]): boolean {
    const hasTrigger = triggerWords.some(word => text.includes(word));
    const hasContext = contextWords.some(word => text.includes(word));
    return hasTrigger && (contextWords.length === 0 || hasContext);
  }

  private extractSearchTerm(text: string): string {
    // Extract search term after words like "search for", "find", "look for"
    const patterns = [
      /search\s+for\s+(.+)/i,
      /find\s+(.+)/i,
      /look\s+for\s+(.+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  private isConfirmationResponse(transcript: string): boolean {
    const lowerTranscript = transcript.toLowerCase().trim();
    const confirmationWords = ['yes', 'yeah', 'yep', 'confirm', 'proceed', 'continue', 'do it', 'go ahead'];
    const negationWords = ['no', 'nope', 'cancel', 'stop', 'don\'t', 'nevermind', 'abort'];
    
    return confirmationWords.some(word => lowerTranscript.includes(word)) ||
           negationWords.some(word => lowerTranscript.includes(word));
  }

  private extractConfirmation(transcript: string): boolean {
    const lowerTranscript = transcript.toLowerCase().trim();
    const confirmationWords = ['yes', 'yeah', 'yep', 'confirm', 'proceed', 'continue', 'do it', 'go ahead', 'okay', 'ok'];
    
    return confirmationWords.some(word => lowerTranscript.includes(word));
  }

  clearPendingConfirmation(): void {
    this.pendingConfirmation = null;
  }

  hasPendingConfirmation(): boolean {
    return this.pendingConfirmation !== null;
  }

  getPendingConfirmation(): EnhancedVoiceCommand | null {
    return this.pendingConfirmation;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  private handleFollowUpResponse(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    if (!this.currentContext) {
      return this.createUnknownCommand(transcript);
    }

    // Handle different types of follow-up contexts
    if (this.currentContext.operation === 'create_entry') {
      return this.handleCreateEntryFollowUp(lowerTranscript, this.currentContext);
    }

    if (this.currentContext.operation === 'add_field') {
      return this.handleAddFieldFollowUp(lowerTranscript, this.currentContext);
    }

    // Default follow-up handling
    this.expectingFollowUp = false;
    this.currentContext = null;
    
    return {
      intent: 'conversation',
      action: 'followup_complete',
      parameters: { response: transcript },
      conversationalResponse: `I've noted your response: "${transcript}". What would you like to do next?`,
      needsConfirmation: false,
      confidence: 0.9,
      originalTranscript: transcript
    };
  }

  private handleCreateEntryFollowUp(transcript: string, context: any): EnhancedVoiceCommand {
    // Reset expectation since we're handling it
    this.expectingFollowUp = false;
    this.currentContext = null;

    // Extract the content for the new entry
    const entryData = {
      title: context.entryTitle || `New Entry - ${new Date().toLocaleDateString()}`,
      category: context.category || 'Personal',
      content: transcript
    };

    return {
      intent: 'create',
      action: 'create_entry_with_content',
      parameters: {
        title: entryData.title,
        category: entryData.category,
        description: entryData.content,
        additionalFields: {}
      },
      conversationalResponse: `Perfect! I'll create "${entryData.title}" with that information.`,
      needsConfirmation: false,
      confidence: 0.95,
      originalTranscript: transcript
    };
  }

  private handleAddFieldFollowUp(transcript: string, context: any): EnhancedVoiceCommand {
    this.expectingFollowUp = false;
    this.currentContext = null;

    return {
      intent: 'create',
      action: 'add_field_to_entry',
      parameters: {
        entryId: context.entryId,
        fieldName: context.fieldName,
        fieldValue: transcript,
        fieldType: context.fieldType || 'text'
      },
      conversationalResponse: `Great! I've added "${context.fieldName}" with the value you provided.`,
      needsConfirmation: false,
      confidence: 0.95,
      originalTranscript: transcript
    };
  }

  private createUnknownCommand(transcript: string): EnhancedVoiceCommand {
    return {
      intent: 'unknown',
      action: 'unrecognized',
      parameters: {},
      conversationalResponse: 'I didn\'t understand that command. Try saying "create a new entry" or "show me my documents"',
      needsConfirmation: false,
      confidence: 0.1,
      originalTranscript: transcript
    };
  }

  isExpectingFollowUp(): boolean {
    return this.expectingFollowUp;
  }
}

// Global instance for conversation continuity
export const voiceProcessor = new EnhancedVoiceProcessor();