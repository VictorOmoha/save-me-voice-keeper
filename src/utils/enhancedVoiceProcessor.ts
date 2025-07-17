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
      console.log('Processing enhanced voice command with NLP engine:', transcript);
      
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
        "listening for commands"
      ];
      
      // Only block if it's an exact match to prevent blocking real user commands
      if (exactTTSResponses.includes(lowerTranscript)) {
        console.log('🚫 VOICE PROCESSOR: Blocking exact TTS match:', transcript);
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
        return this.handleFollowUpResponse(transcript, context);
      }

      // Add current command to history
      this.conversationHistory.push(transcript);
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      // Process with NLP engine
      const nlpResult = await nlpEngine.processText(transcript, {
        userId: 'current-user', // TODO: Get from auth context
        currentView: context.currentView,
        availableEntries: context.availableEntries,
        permissions: ['auto_confirm'] // TODO: Get from user permissions
      });

      console.log('NLP processing result:', nlpResult);

      // Convert NLP result to EnhancedVoiceCommand format
      const enhancedCommand = this.convertNLPResultToCommand(nlpResult, transcript);

      // Store pending confirmation if needed
      if (enhancedCommand.needsConfirmation) {
        this.pendingConfirmation = enhancedCommand;
      }

      // Set up follow-up expectations
      if (enhancedCommand.expectsFollowUp) {
        this.expectingFollowUp = true;
        this.currentContext = enhancedCommand.context;
      }

      console.log('Enhanced command:', enhancedCommand);
      return enhancedCommand;

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

  private convertNLPResultToCommand(nlpResult: NLPProcessingResult, transcript: string): EnhancedVoiceCommand {
    const { intent, routing, confidence } = nlpResult;

    // Map NLP intents to enhanced voice command intents
    const intentMapping: Record<string, EnhancedVoiceCommand['intent']> = {
      'create_entry': 'create',
      'delete_entry': 'delete', 
      'edit_entry': 'edit',
      'search_entries': 'search',
      'navigate_view': 'navigate',
      'export_data': 'export',
      'help': 'conversation',
      'unknown': 'unknown',
      'error': 'unknown'
    };

    const mappedIntent = intentMapping[intent.name] || 'unknown';
    
    if (!routing.success) {
      return {
        intent: 'unknown',
        action: 'error',
        confidence: 0,
        parameters: {},
        needsConfirmation: false,
        conversationalResponse: routing.error || 'Command could not be processed',
        followUpQuestions: routing.suggestions || [],
        originalTranscript: transcript
      };
    }

    const result = routing.result;
    
    return {
      intent: mappedIntent,
      action: result?.action || intent.name,
      confidence,
      parameters: intent.parameters,
      needsConfirmation: result?.needsConfirmation || false,
      conversationalResponse: this.generateConversationalResponse(mappedIntent, result),
      followUpQuestions: result?.suggestions || [],
      originalTranscript: transcript,
      expectsFollowUp: result?.expectsFollowUp || false,
      context: result?.context
    };
  }

  private generateConversationalResponse(intent: EnhancedVoiceCommand['intent'], result: any): string {
    switch (intent) {
      case 'create':
        return result?.expectsFollowUp 
          ? "I'll help you create a new entry. What information would you like to add?"
          : `Perfect! I'll create "${result?.title || 'your entry'}" for you.`;
          
      case 'delete':
        return result?.needsConfirmation
          ? `Are you sure you want to delete "${result?.target}"? This cannot be undone.`
          : `I'll delete "${result?.target}" for you.`;
          
      case 'edit':
        return `Opening "${result?.target}" for editing.`;
        
      case 'search':
        return `Searching for "${result?.query}" in your entries.`;
        
      case 'navigate':
        return `Navigating to ${result?.destination}.`;
        
      case 'export':
        return `Exporting your data in ${result?.format} format.`;
        
      case 'conversation':
        return result?.message || "Hello! How can I help you today?";
        
      default:
        return "I didn't quite understand that. Could you please rephrase your request?";
    }
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
