import { supabase } from "@/integrations/supabase/client";
import { SavedEntry } from "@/types/dashboard";
import { nlpEngine, NLPProcessingResult } from "./nlp/nlpEngine";

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
  isFormOpen?: boolean;
  editingEntry?: any;
  fillingEntry?: any;
}

export class EnhancedVoiceProcessor {
  private conversationHistory: string[] = [];
  private pendingConfirmation: EnhancedVoiceCommand | null = null;
  private maxRetries = 3;
  private retryCount = 0;
  private currentContext: any = null;
  private expectingFollowUp: boolean = false;
  private conversationActive: boolean = false;
  private lastCommand: string = '';

  async processVoiceCommand(
    transcript: string,
    context: VoiceContext
  ): Promise<EnhancedVoiceCommand> {
    try {
      console.log('🎙️ Enhanced Voice Processor: Processing command:', transcript);
      console.log('🔍 Context:', context);
      
      // FIRST LINE OF DEFENSE: Check if this is clearly TTS output
      const lowerTranscript = transcript.toLowerCase().trim();
      
      // Only block exact system responses - be very conservative
      const exactTTSResponses = [
        "i'll help you create a new entry. what information would you like to add?",
        "what information would you like to add?",
        "perfect! i'll create that for you.",
        "successfully created",
        "voice assistant",
        "ai voice assistant ready", 
        "processing with ai",
        "listening for commands",
        "opening",
        "creating"
      ];
      
      // Only block if it's an exact match to prevent blocking real user commands
      if (exactTTSResponses.some(response => lowerTranscript.includes(response))) {
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
      
      console.log('✅ VOICE PROCESSOR: Processing user command:', transcript);
      
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
        console.log('🔄 Processing follow-up command...');
        return this.handleFollowUpResponse(transcript, context);
      }

      // Add current command to history
      this.conversationHistory.push(transcript);
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      // Set conversation as active
      this.conversationActive = true;
      this.lastCommand = transcript;

      // Enhanced command processing with context awareness
      const enhancedCommand = await this.processCommandWithContext(transcript, context);

      // Store pending confirmation if needed
      if (enhancedCommand.needsConfirmation) {
        this.pendingConfirmation = enhancedCommand;
      }

      // Set up follow-up expectations
      if (enhancedCommand.expectsFollowUp) {
        this.expectingFollowUp = true;
        this.currentContext = enhancedCommand.context;
      }

      console.log('✅ Enhanced command processed:', enhancedCommand);
      return enhancedCommand;

    } catch (error) {
      console.error('❌ Error processing voice command:', error);
      
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

  private async processCommandWithContext(transcript: string, context: VoiceContext): Promise<EnhancedVoiceCommand> {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Enhanced command recognition with context awareness
    if (this.isCreateCommand(lowerTranscript)) {
      return this.handleCreateCommand(transcript, context);
    }
    
    if (this.isOpenCommand(lowerTranscript)) {
      return this.handleOpenCommand(transcript, context);
    }
    
    if (this.isDeleteCommand(lowerTranscript)) {
      return this.handleDeleteCommand(transcript, context);
    }
    
    if (this.isSaveCommand(lowerTranscript)) {
      return this.handleSaveCommand(transcript, context);
    }
    
    if (this.isCancelCommand(lowerTranscript)) {
      return this.handleCancelCommand(transcript, context);
    }
    
    if (this.isSearchCommand(lowerTranscript)) {
      return this.handleSearchCommand(transcript, context);
    }

    // If we have an active form, try to interpret as form input
    if (context.isFormOpen || context.editingEntry || context.fillingEntry) {
      return this.handleFormInput(transcript, context);
    }
    
    // Default unknown command
    return this.createUnknownCommand(transcript);
  }

  private isCreateCommand(transcript: string): boolean {
    return /\b(create|add|new|make)\b.*\b(entry|record|document|item)\b/i.test(transcript) ||
           /\b(create|add|new|make)\b/i.test(transcript);
  }

  private isOpenCommand(transcript: string): boolean {
    return /\b(open|edit|show|view|display)\b/i.test(transcript);
  }

  private isDeleteCommand(transcript: string): boolean {
    return /\b(delete|remove|trash|erase)\b/i.test(transcript);
  }

  private isSaveCommand(transcript: string): boolean {
    return /\b(save|store|submit)\b/i.test(transcript);
  }

  private isCancelCommand(transcript: string): boolean {
    // Enhanced cancel command detection to include specific entry names
    const cancelPatterns = [
      /\b(cancel|close|stop|exit|back|dismiss)\b/i,
      /\bclose\s+.*\b(form|entry|policy|document|record)\b/i,
      /\bcancel\s+.*\b(form|entry|policy|document|record)\b/i,
      /\b(done|finished)\s+with\b/i
    ];
    
    return cancelPatterns.some(pattern => pattern.test(transcript));
  }

  private isSearchCommand(transcript: string): boolean {
    return /\b(search|find|look\s+for|where\s+is)\b/i.test(transcript);
  }

  private handleCreateCommand(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    const entryTitle = this.extractEntityFromText(transcript, 'create');
    const category = this.extractCategoryFromText(transcript);
    
    return {
      intent: 'create',
      action: 'create_entry',
      confidence: 0.9,
      parameters: {
        entryTitle: entryTitle || '',
        entryCategory: category || 'Personal'
      },
      needsConfirmation: false,
      conversationalResponse: entryTitle 
        ? `Creating a new entry: "${entryTitle}"`
        : "Creating a new entry",
      originalTranscript: transcript,
      expectsFollowUp: !entryTitle,
      context: entryTitle ? undefined : {
        operation: 'create_entry',
        category: category || 'Personal'
      }
    };
  }

  private handleOpenCommand(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    const searchTerm = this.extractEntityFromText(transcript, 'open');
    
    if (searchTerm === 'all' || transcript.toLowerCase().includes('all entries')) {
      return {
        intent: 'navigate',
        action: 'show_all_entries',
        confidence: 0.95,
        parameters: {},
        needsConfirmation: false,
        conversationalResponse: "Showing all entries",
        originalTranscript: transcript
      };
    }
    
    return {
      intent: 'edit',
      action: 'open_entry',
      confidence: searchTerm ? 0.9 : 0.7,
      parameters: {
        entryTitle: searchTerm || '',
        searchTerm
      },
      needsConfirmation: false,
      conversationalResponse: searchTerm 
        ? `Opening: "${searchTerm}"`
        : "What would you like to open?",
      originalTranscript: transcript,
      expectsFollowUp: !searchTerm,
      context: searchTerm ? undefined : {
        operation: 'open_entry'
      }
    };
  }

  private handleDeleteCommand(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    const searchTerm = this.extractEntityFromText(transcript, 'delete');
    
    return {
      intent: 'delete',
      action: 'delete_entry',
      confidence: searchTerm ? 0.9 : 0.7,
      parameters: {
        entryTitle: searchTerm || '',
        searchTerm
      },
      needsConfirmation: true,
      conversationalResponse: searchTerm 
        ? `Are you sure you want to delete "${searchTerm}"?`
        : "What would you like to delete?",
      originalTranscript: transcript,
      expectsFollowUp: !searchTerm,
      context: searchTerm ? undefined : {
        operation: 'delete_entry'
      }
    };
  }

  private handleSaveCommand(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    return {
      intent: 'create',
      action: 'save_current_entry',
      confidence: 0.95,
      parameters: {},
      needsConfirmation: false,
      conversationalResponse: context.isFormOpen 
        ? "Saving the current entry"
        : "No entry form is currently open",
      originalTranscript: transcript
    };
  }

  private handleCancelCommand(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    // Reset conversation state
    this.expectingFollowUp = false;
    this.currentContext = null;
    this.conversationActive = false;
    
    // Enhanced close command handling - extract entry name if provided
    const entryName = this.extractEntityFromText(transcript, 'close');
    
    return {
      intent: 'navigate',
      action: 'cancel_operation',
      confidence: 0.95,
      parameters: {
        entryName: entryName || ''
      },
      needsConfirmation: false,
      conversationalResponse: entryName 
        ? `Closing ${entryName}`
        : context.isFormOpen 
          ? "Closing all forms"
          : "Cancelling current operation",
      originalTranscript: transcript
    };
  }

  private handleSearchCommand(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    const searchQuery = this.extractEntityFromText(transcript, 'search');
    
    return {
      intent: 'search',
      action: 'search_entries',
      confidence: searchQuery ? 0.9 : 0.7,
      parameters: {
        query: searchQuery || ''
      },
      needsConfirmation: false,
      conversationalResponse: searchQuery 
        ? `Searching for: "${searchQuery}"`
        : "What would you like to search for?",
      originalTranscript: transcript,
      expectsFollowUp: !searchQuery,
      context: searchQuery ? undefined : {
        operation: 'search_entries'
      }
    };
  }

  private handleFormInput(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    // If user is giving content for a form
    return {
      intent: 'form_fill',
      action: 'add_form_content',
      confidence: 0.8,
      parameters: {
        content: transcript,
        fieldType: 'text'
      },
      needsConfirmation: false,
      conversationalResponse: `Adding: "${transcript}"`,
      originalTranscript: transcript
    };
  }

  private extractEntityFromText(text: string, action: string): string {
    // Enhanced entity extraction for close commands
    let cleaned = text.toLowerCase();
    
    // For close commands, be more specific about what we're extracting
    if (action === 'close') {
      // Remove the action word and common close-related words
      cleaned = cleaned
        .replace(/\b(close|cancel|stop|exit|back|dismiss|done|finished)\b/gi, '')
        .replace(/\b(the|a|an|my|our|your|form|entry|document|record)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      // Remove action words and common articles
      cleaned = cleaned
        .replace(new RegExp(`\\b${action}\\b`, 'gi'), '')
        .replace(/\b(entry|record|document|item|the|a|an|my|our|your|new|called|named)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Remove trailing punctuation
    cleaned = cleaned.replace(/[.,!?]+$/, '');
    
    return cleaned.length > 1 ? cleaned : '';
  }

  private extractCategoryFromText(text: string): string {
    const categories = ['documents', 'health', 'contacts', 'finance', 'personal'];
    const lowerText = text.toLowerCase();
    
    for (const category of categories) {
      if (lowerText.includes(category)) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }
    
    return 'Personal';
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
    this.conversationActive = false;
    this.expectingFollowUp = false;
    this.currentContext = null;
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

    if (this.currentContext.operation === 'open_entry') {
      return this.handleOpenEntryFollowUp(lowerTranscript, this.currentContext, context);
    }

    if (this.currentContext.operation === 'delete_entry') {
      return this.handleDeleteEntryFollowUp(lowerTranscript, this.currentContext, context);
    }

    if (this.currentContext.operation === 'search_entries') {
      return this.handleSearchFollowUp(lowerTranscript, this.currentContext);
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
    this.expectingFollowUp = false;
    this.currentContext = null;

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

  private handleOpenEntryFollowUp(transcript: string, context: any, voiceContext: VoiceContext): EnhancedVoiceCommand {
    this.expectingFollowUp = false;
    this.currentContext = null;

    return {
      intent: 'edit',
      action: 'open_entry',
      parameters: {
        entryTitle: transcript,
        searchTerm: transcript
      },
      conversationalResponse: `Opening: "${transcript}"`,
      needsConfirmation: false,
      confidence: 0.9,
      originalTranscript: transcript
    };
  }

  private handleDeleteEntryFollowUp(transcript: string, context: any, voiceContext: VoiceContext): EnhancedVoiceCommand {
    this.expectingFollowUp = false;
    this.currentContext = null;

    return {
      intent: 'delete',
      action: 'delete_entry',
      parameters: {
        entryTitle: transcript,
        searchTerm: transcript
      },
      conversationalResponse: `Are you sure you want to delete "${transcript}"?`,
      needsConfirmation: true,
      confidence: 0.9,
      originalTranscript: transcript
    };
  }

  private handleSearchFollowUp(transcript: string, context: any): EnhancedVoiceCommand {
    this.expectingFollowUp = false;
    this.currentContext = null;

    return {
      intent: 'search',
      action: 'search_entries',
      parameters: {
        query: transcript
      },
      conversationalResponse: `Searching for: "${transcript}"`,
      needsConfirmation: false,
      confidence: 0.9,
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

  isConversationActive(): boolean {
    return this.conversationActive;
  }

  getLastCommand(): string {
    return this.lastCommand;
  }

  resetConversation(): void {
    this.conversationActive = false;
    this.expectingFollowUp = false;
    this.currentContext = null;
    this.pendingConfirmation = null;
    this.lastCommand = '';
  }
}

// Global instance for conversation continuity
export const voiceProcessor = new EnhancedVoiceProcessor();
