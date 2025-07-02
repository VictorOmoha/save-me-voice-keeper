import { supabase } from "@/integrations/supabase/client";
import { SavedEntry } from "@/pages/Dashboard";

export interface EnhancedVoiceCommand {
  intent: 'create' | 'delete' | 'edit' | 'search' | 'navigate' | 'export' | 'bulk_operation' | 'form_fill' | 'conversation' | 'unknown';
  action: string;
  confidence: number;
  parameters: Record<string, any>;
  needsConfirmation: boolean;
  conversationalResponse: string;
  followUpQuestions?: string[];
  originalTranscript: string;
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

  async processVoiceCommand(
    transcript: string,
    context: VoiceContext
  ): Promise<EnhancedVoiceCommand> {
    try {
      console.log('Processing enhanced voice command:', transcript);
      
      // Check if this is a confirmation response
      if (this.pendingConfirmation && this.isConfirmationResponse(transcript)) {
        const confirmed = this.extractConfirmation(transcript);
        const command = this.pendingConfirmation;
        this.pendingConfirmation = null;
        
        return {
          ...command,
          parameters: { ...command.parameters, confirmed },
          needsConfirmation: false,
          conversationalResponse: confirmed 
            ? `Confirmed! I'll ${command.action} now.`
            : 'Okay, I\'ve cancelled that action. What else can I help you with?'
        };
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

      // Call the Supabase Edge Function for AI processing
      const { data, error } = await supabase.functions.invoke('voice-ai-processor', {
        body: {
          transcript,
          context: enhancedContext,
        },
      });

      if (error) {
        console.error('Error calling voice AI processor:', error);
        throw error;
      }

      const processedCommand: EnhancedVoiceCommand = {
        ...data,
        originalTranscript: transcript,
      };

      // Store pending confirmation if needed
      if (processedCommand.needsConfirmation) {
        this.pendingConfirmation = processedCommand;
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
}

// Global instance for conversation continuity
export const voiceProcessor = new EnhancedVoiceProcessor();