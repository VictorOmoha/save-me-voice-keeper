
import { toast } from 'sonner';

export interface EnhancedVoiceCommand {
  intent: 'create' | 'delete' | 'edit' | 'search' | 'navigate' | 'export' | 'bulk_operation' | 'form_fill' | 'conversation' | 'unknown';
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  conversationalResponse?: string;
  needsConfirmation?: boolean;
  followUpExpected?: boolean;
  expectsFollowUp?: boolean;
  followUpQuestions?: string[];
}

export interface VoiceContext {
  currentView?: string;
  availableEntries: Array<{
    id: string;
    title: string;
    category: string;
  }>;
  currentEntry?: {
    id: string;
    title: string;
  };
  previousCommands: string[];
}

class EnhancedVoiceProcessor {
  private pendingConfirmation: EnhancedVoiceCommand | null = null;
  private expectingFollowUp: boolean = false;
  private commandHistory: string[] = [];

  // Improved TTS detection
  private isTTSFeedback(text: string): boolean {
    // Primary check: if TTS is currently speaking
    if ((window as any).__tts_is_speaking) {
      console.log('🚫 Enhanced Processor: TTS is speaking, blocking input');
      return true;
    }
    
    const cleanText = text.toLowerCase().trim();
    
    // Block empty or very short inputs
    if (cleanText.length < 3) {
      console.log('🚫 Enhanced Processor: Text too short, blocking');
      return true;
    }
    
    // Block only clear system responses
    const systemPhrases = [
      'voice mode activated',
      'how can i help you',
      'what would you like',
      'successfully created',
      'entry not found',
      'operation completed',
      'tts feedback detected'
    ];
    
    const isSystemPhrase = systemPhrases.some(phrase => cleanText.includes(phrase));
    if (isSystemPhrase) {
      console.log('🚫 Enhanced Processor: System phrase detected, blocking:', text);
      return true;
    }
    
    // Check against recent TTS with exact phrase matching
    if ((window as any).__recent_tts_texts) {
      const recentTTS = (window as any).__recent_tts_texts as string[];
      
      // Only block if exactly matches TTS output
      const isExactTTSMatch = recentTTS.some(ttsText => {
        return ttsText.toLowerCase().trim() === cleanText;
      });
      
      if (isExactTTSMatch) {
        console.log('🚫 Enhanced Processor: Exactly matches recent TTS, blocking');
        return true;
      }
    }
    
    return false;
  }

  async processVoiceCommand(transcript: string, context: VoiceContext): Promise<EnhancedVoiceCommand> {
    console.log('🎯 Enhanced Processor: Processing command:', transcript);
    
    // Handle mixed TTS feedback - extract user command from mixed input
    const cleanText = transcript.toLowerCase().trim();
    if (cleanText.includes('tts feedback detected') || 
        cleanText.includes('how can i help you') ||
        cleanText.includes('voice mode activated')) {
      
      // Try to extract the actual user command by removing TTS phrases
      let userCommand = cleanText
        .replace(/tts feedback detected and blocked\.?/g, '')
        .replace(/how can i help you\.?/g, '')
        .replace(/voice mode activated\.?/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // If we have a meaningful command after cleanup, process it
      if (userCommand.length > 2 && !userCommand.includes('tts') && !userCommand.includes('voice mode')) {
        console.log('🔄 Enhanced Processor: Extracting user command from mixed input:', userCommand);
        // Process the cleaned command
        return this.processVoiceCommand(userCommand, context);
      }
    }
    
    // Check for TTS feedback
    if (this.isTTSFeedback(transcript)) {
      return {
        intent: 'unknown',
        action: 'tts_feedback_blocked',
        parameters: {},
        confidence: 0,
        conversationalResponse: 'TTS feedback detected and blocked'
      };
    }

    // Add to command history
    this.commandHistory.push(transcript);
    if (this.commandHistory.length > 5) {
      this.commandHistory.shift();
    }

    // Handle pending confirmation
    if (this.pendingConfirmation) {
      return this.handleConfirmation(transcript);
    }

    // Handle follow-up expected
    if (this.expectingFollowUp) {
      return this.handleFollowUp(transcript, context);
    }

    // Process new command
    return this.parseCommand(transcript, context);
  }

  private handleConfirmation(transcript: string): EnhancedVoiceCommand {
    const cleanText = transcript.toLowerCase().trim();
    const isYes = ['yes', 'yeah', 'yep', 'confirm', 'do it', 'proceed'].some(word => cleanText.includes(word));
    const isNo = ['no', 'nope', 'cancel', 'stop', 'abort', 'never mind'].some(word => cleanText.includes(word));
    
    if (isYes) {
      const command = { ...this.pendingConfirmation!, parameters: { ...this.pendingConfirmation!.parameters, confirmed: true } };
      this.pendingConfirmation = null;
      return command;
    } else if (isNo) {
      const command = { ...this.pendingConfirmation!, parameters: { ...this.pendingConfirmation!.parameters, confirmed: false } };
      this.pendingConfirmation = null;
      return command;
    }
    
    return {
      intent: 'conversation',
      action: 'clarify_confirmation',
      parameters: {},
      confidence: 0.8,
      conversationalResponse: 'Please say yes to confirm or no to cancel.'
    };
  }

  private handleFollowUp(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    this.expectingFollowUp = false;
    
    // Simple follow-up handling for entry creation
    return {
      intent: 'create',
      action: 'create_entry_with_content',
      parameters: {
        title: `Voice Entry - ${new Date().toLocaleDateString()}`,
        category: 'Personal',
        description: transcript,
        additionalFields: {}
      },
      confidence: 0.9,
      conversationalResponse: `I've created a new entry with your information: "${transcript}"`
    };
  }

  private parseCommand(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    const cleanText = transcript.toLowerCase().trim();
    
    // Create commands - more specific patterns
    if (cleanText.includes('create') && (cleanText.includes('entry') || cleanText.includes('new'))) {
      this.expectingFollowUp = true;
      return {
        intent: 'create',
        action: 'initiate_create',
        parameters: {},
        confidence: 0.9,
        conversationalResponse: 'What information would you like to add to this new entry?',
        followUpExpected: true
      };
    }
    
    // Simple create commands
    if (cleanText.includes('create') || cleanText.includes('new entry') || cleanText.includes('add entry')) {
      return {
        intent: 'create',
        action: 'initiate_create',
        parameters: {},
        confidence: 0.8,
        conversationalResponse: 'Creating a new entry for you.'
      };
    }
    
    // Delete commands
    if (cleanText.includes('delete') || cleanText.includes('remove')) {
      const entryMatch = this.extractEntryReference(cleanText, context);
      if (entryMatch) {
        this.pendingConfirmation = {
          intent: 'delete',
          action: 'delete_entry',
          parameters: { entryId: entryMatch.id, title: entryMatch.title },
          confidence: 0.8,
          needsConfirmation: true,
          conversationalResponse: `Are you sure you want to delete "${entryMatch.title}"? Say yes to confirm.`
        };
        return this.pendingConfirmation;
      } else {
        return {
          intent: 'delete',
          action: 'delete_entry',
          parameters: { searchTerm: cleanText.replace(/delete|remove/g, '').trim() },
          confidence: 0.6,
          conversationalResponse: 'Which entry would you like to delete? Please be more specific.'
        };
      }
    }
    
    // Edit/Open commands
    if (cleanText.includes('edit') || cleanText.includes('open') || cleanText.includes('modify')) {
      const entryMatch = this.extractEntryReference(cleanText, context);
      if (entryMatch) {
        return {
          intent: 'edit',
          action: 'open_entry',
          parameters: { entryId: entryMatch.id, title: entryMatch.title },
          confidence: 0.8,
          conversationalResponse: `Opening "${entryMatch.title}" for editing`
        };
      } else {
        // Try to extract entry name from the command
        const entryName = cleanText.replace(/edit|open|modify/g, '').trim();
        if (entryName) {
          return {
            intent: 'edit',
            action: 'open_entry',
            parameters: { title: entryName },
            confidence: 0.7,
            conversationalResponse: `Looking for "${entryName}" to open`
          };
        }
      }
    }
    
    // Search commands
    if (cleanText.includes('search') || cleanText.includes('find') || cleanText.includes('show me')) {
      const searchTerm = this.extractSearchTerm(cleanText);
      return {
        intent: 'search',
        action: 'execute_search',
        parameters: { query: searchTerm },
        confidence: 0.7,
        conversationalResponse: `Searching for "${searchTerm}"`
      };
    }
    
    // Conversation/greeting
    if (cleanText.includes('hello') || cleanText.includes('hi') || cleanText.includes('help')) {
      return {
        intent: 'conversation',
        action: 'greeting',
        parameters: {},
        confidence: 0.9,
        conversationalResponse: 'Hello! I can help you create, edit, delete, and search your entries. What would you like to do?'
      };
    }
    
    // Unknown command
    return {
      intent: 'unknown',
      action: 'unknown_command',
      parameters: { originalText: transcript },
      confidence: 0.3,
      conversationalResponse: 'I didn\'t understand that. Try saying "create a new entry", "open [entry name]", "delete [entry name]", or "search for [term]".'
    };
  }

  private extractEntryReference(text: string, context: VoiceContext): { id: string; title: string } | null {
    // Look for entries mentioned in the text
    const words = text.split(' ');
    
    for (const entry of context.availableEntries) {
      const titleWords = entry.title.toLowerCase().split(' ');
      
      // Check if any significant words from the entry title appear in the command
      const hasMatch = titleWords.some(titleWord => 
        titleWord.length > 2 && words.some(word => word.includes(titleWord))
      );
      
      if (hasMatch) {
        return { id: entry.id, title: entry.title };
      }
    }
    
    return null;
  }

  private extractSearchTerm(text: string): string {
    // Extract search term after common search phrases
    const searchPhrases = ['search for', 'find', 'show me', 'look for'];
    for (const phrase of searchPhrases) {
      const index = text.indexOf(phrase);
      if (index !== -1) {
        return text.substring(index + phrase.length).trim();
      }
    }
    return text.replace(/search|find|show|look/g, '').trim();
  }

  public hasPendingConfirmation(): boolean {
    return this.pendingConfirmation !== null;
  }

  public isExpectingFollowUp(): boolean {
    return this.expectingFollowUp;
  }

  public clearPendingConfirmation(): void {
    this.pendingConfirmation = null;
    this.expectingFollowUp = false;
  }
}

export const voiceProcessor = new EnhancedVoiceProcessor();
