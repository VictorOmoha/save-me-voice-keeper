
import { toast } from 'sonner';

export interface EnhancedVoiceCommand {
  intent: 'create' | 'delete' | 'edit' | 'search' | 'navigate' | 'export' | 'bulk_operation' | 'form_fill' | 'conversation' | 'close' | 'unknown';
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
  waitingForFollowUp?: boolean;
}

class EnhancedVoiceProcessor {
  private pendingConfirmation: EnhancedVoiceCommand | null = null;
  private expectingFollowUp: boolean = false;
  private commandHistory: string[] = [];

  // Store last TTS prompt for comparison
  private lastTTSPrompt: string = '';

  // Improved TTS detection with better filtering
  private isTTSFeedback(text: string): boolean {
    const cleanText = text.toLowerCase().trim();
    
    console.log('🎤 Transcript received:', text);
    console.log('🤖 Last TTS prompt:', this.lastTTSPrompt);
    
    // Skip very short inputs
    if (cleanText.length < 3) {
      console.log('🚫 Enhanced Processor: Text too short, skipping');
      return true;
    }
    
    // Check if TTS is currently speaking
    if ((window as any).__tts_is_speaking) {
      console.log('🚫 Enhanced Processor: TTS currently speaking, blocking input');
      return true;
    }
    
    // Check if transcript matches recent TTS prompts exactly
    if (this.lastTTSPrompt && cleanText === this.lastTTSPrompt.toLowerCase().trim()) {
      console.log('🚫 Enhanced Processor: Exact TTS prompt match, blocking');
      return true;
    }
    
    // System prompts to filter out
    const systemPhrases = [
      'voice mode activated',
      'how can i help you',
      'what would you like to call this entry',
      'what category should this entry be in',
      'would you like to add any custom fields',
      'tell me what to add',
      'what information would you like to add'
    ];
    
    // Check for exact system phrase matches
    for (const phrase of systemPhrases) {
      if (cleanText === phrase || cleanText.includes(phrase)) {
        console.log('🚫 Enhanced Processor: System phrase match, blocking:', phrase);
        return true;
      }
    }
    
    // Check recent TTS cache
    if ((window as any).__recent_tts_texts) {
      const recentTTS = (window as any).__recent_tts_texts as string[];
      
      for (const ttsText of recentTTS) {
        const ttsClean = ttsText.toLowerCase().trim();
        if (cleanText === ttsClean || 
            (cleanText.length > 10 && ttsClean.includes(cleanText)) ||
            (ttsClean.length > 10 && ttsClean.includes(cleanText))) {
          console.log('🚫 Enhanced Processor: Close TTS match, blocking');
          return true;
        }
      }
    }
    
    return false;
  }

  // Method to track TTS prompts
  public setLastTTSPrompt(prompt: string): void {
    this.lastTTSPrompt = prompt.toLowerCase().trim();
  }

  async processVoiceCommand(transcript: string, context: VoiceContext): Promise<EnhancedVoiceCommand> {
    console.log('🎯 Enhanced Processor: Processing command:', transcript);
    console.log('🔍 Enhanced Processor: Context:', { 
      waitingForFollowUp: context.waitingForFollowUp,
      expectingFollowUp: this.expectingFollowUp,
      hasPendingConfirmation: !!this.pendingConfirmation
    });
    
    // Check for TTS feedback first
    if (this.isTTSFeedback(transcript)) {
      return {
        intent: 'unknown',
        action: 'tts_feedback_blocked',
        parameters: {},
        confidence: 0,
        conversationalResponse: ''
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

    // Handle follow-up expected (waiting for content after "create entry")
    if (this.expectingFollowUp || context.waitingForFollowUp) {
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
      const command = { 
        ...this.pendingConfirmation!, 
        parameters: { ...this.pendingConfirmation!.parameters, confirmed: true } 
      };
      this.pendingConfirmation = null;
      return command;
    } else if (isNo) {
      const command = { 
        ...this.pendingConfirmation!, 
        parameters: { ...this.pendingConfirmation!.parameters, confirmed: false } 
      };
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
    console.log('📝 Enhanced Processor: Handling follow-up with content:', transcript);
    this.expectingFollowUp = false;
    
    // Create entry with the provided content
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
      conversationalResponse: `Perfect! I've created a new entry with: "${transcript}"`
    };
  }

  private parseCommand(transcript: string, context: VoiceContext): EnhancedVoiceCommand {
    const cleanText = transcript.toLowerCase().trim();
    
    console.log('🔍 Enhanced Processor: Parsing command:', cleanText);
    
    // Handle close commands with expanded patterns
    if (cleanText.includes('close') || cleanText.includes('dismiss') || cleanText.includes('cancel') || 
        cleanText.includes('exit') || cleanText.match(/^(stop|end|quit)$/)) {
      // Context-specific closes
      if (cleanText.includes('settings') || cleanText.includes('preferences')) {
        return {
          intent: 'close',
          action: 'close_settings',
          parameters: {},
          confidence: 0.95,
          conversationalResponse: "Closing settings modal."
        };
      }
      if (cleanText.includes('export')) {
        return {
          intent: 'close',
          action: 'close_export',
          parameters: {},
          confidence: 0.95,
          conversationalResponse: "Closing export modal."
        };
      }
      if (cleanText.includes('video')) {
        return {
          intent: 'close',
          action: 'close_video',
          parameters: {},
          confidence: 0.95,
          conversationalResponse: "Closing video modal."
        };
      }
      if (cleanText.includes('entry') || cleanText.includes('dialog') || cleanText.includes('modal') || cleanText.includes('window')) {
        return {
          intent: 'close',
          action: 'close_entry',
          parameters: {},
          confidence: 0.9,
          conversationalResponse: "Closing the current dialog."
        };
      }
      // Generic close for any open modal
      return {
        intent: 'close',
        action: 'close_modal',
        parameters: {},
        confidence: 0.85,
        conversationalResponse: "Closing the current modal or dialog."
      };
    }
    
    // Create commands - more specific patterns
    if ((cleanText.includes('create') && cleanText.includes('entry')) || 
        cleanText.includes('new entry') || 
        cleanText.includes('add entry') ||
        cleanText.includes('make entry')) {
      return {
        intent: 'create',
        action: 'create_entry',
        parameters: {},
        confidence: 0.95,
        conversationalResponse: 'Starting guided entry creation...',
        followUpExpected: false
      };
    }
    
    // Simple create without "entry"
    if (cleanText === 'create' || cleanText === 'new' || cleanText === 'add') {
      this.expectingFollowUp = true;
      return {
        intent: 'create',
        action: 'initiate_create',
        parameters: {},
        confidence: 0.8,
        conversationalResponse: 'Creating a new entry. What would you like to add?',
        followUpExpected: true
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
    
    
    // Close commands
    if (cleanText.includes('close') && (cleanText.includes('entry') || cleanText.includes('dialog') || cleanText.includes('modal'))) {
      return {
        intent: 'navigate',
        action: 'close_entry',
        parameters: {},
        confidence: 0.9,
        conversationalResponse: 'Closing the current entry view'
      };
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
