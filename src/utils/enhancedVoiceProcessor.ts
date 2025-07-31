
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';

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
  private confirmationTimeout: NodeJS.Timeout | null = null;
  private debugMode: boolean = true; // Enable debug mode for troubleshooting

  // Store last TTS prompt for comparison
  private lastTTSPrompt: string = '';

  // Clear stuck confirmation state immediately
  public clearConfirmationState(): void {
    if (this.debugMode) console.log('🧹 Enhanced Processor: Clearing confirmation state');
    this.pendingConfirmation = null;
    this.expectingFollowUp = false;
    if (this.confirmationTimeout) {
      clearTimeout(this.confirmationTimeout);
      this.confirmationTimeout = null;
    }
  }

  // Start confirmation timeout
  private startConfirmationTimeout(): void {
    if (this.confirmationTimeout) {
      clearTimeout(this.confirmationTimeout);
    }
    
    this.confirmationTimeout = setTimeout(() => {
      if (this.debugMode) console.log('⏰ Enhanced Processor: Confirmation timeout - clearing state');
      this.clearConfirmationState();
      speak("Confirmation timeout. Please try your command again.");
    }, 30000); // 30 second timeout
  }

  // Improved TTS detection with better filtering
  private isTTSFeedback(text: string): boolean {
    const cleanText = text.toLowerCase().trim();
    
    if (this.debugMode) {
      console.log('🎤 Transcript received:', text);
      console.log('🤖 Last TTS prompt:', this.lastTTSPrompt);
    }
    
    // Check if TTS is currently speaking
    if ((window as any).__tts_is_speaking) {
      if (this.debugMode) console.log('🚫 Enhanced Processor: TTS currently speaking, blocking input');
      return true;
    }
    
    // Only block if it's clearly a help message or TTS confirmation being read back
    // BUT don't block simple yes/no responses during confirmations
    const helpPatterns = [
      /i didn't understand that.*try saying/,
      /try saying.*create a new entry/,
      /voice mode activated.*how can i help/,
      /starting guided entry creation/,
      /bling bling bling/,
      /please say yes to confirm.*no to cancel/,
      /to confirm or no.*to cancel/,
      /say yes to confirm/
    ];
    
    // Don't block simple confirmation responses when we have pending confirmation
    const isSimpleConfirmation = /^(yes|no|yeah|yep|confirm|cancel)$/i.test(cleanText);
    if (this.pendingConfirmation && isSimpleConfirmation) {
      console.log('✅ Enhanced Processor: Allowing confirmation response during pending confirmation:', cleanText);
      return false;
    }
    
    const isHelpMessage = helpPatterns.some(pattern => pattern.test(cleanText));
    if (isHelpMessage) {
      console.log('🚫 Enhanced Processor: Help message detected, blocking');
      return true;
    }
    
    // Check if transcript matches recent TTS prompts exactly
    if (this.lastTTSPrompt && cleanText === this.lastTTSPrompt.toLowerCase().trim()) {
      console.log('🚫 Enhanced Processor: Exact TTS prompt match, blocking');
      return true;
    }
    
    // For short user responses like "people story", don't block
    if (cleanText.length < 50 && !cleanText.includes('try saying') && !cleanText.includes('understand')) {
      console.log('✅ Enhanced Processor: Allowing short user response:', cleanText);
      return false;
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

    // Check for escape commands first (higher priority than confirmation)
    const cleanText = transcript.toLowerCase().trim();
    if (cleanText.includes('start over') || cleanText.includes('reset') || cleanText.includes('clear')) {
      if (this.debugMode) console.log('🔄 Enhanced Processor: User requested reset/start over');
      this.clearConfirmationState();
      return {
        intent: 'conversation',
        action: 'reset_conversation',
        parameters: {},
        confidence: 0.9,
        conversationalResponse: 'Starting fresh. What would you like to do?'
      };
    }

    // Handle pending confirmation
    if (this.pendingConfirmation) {
      return this.handleConfirmation(transcript, context);
    }

    // Handle follow-up expected (waiting for content after "create entry")
    if (this.expectingFollowUp || context.waitingForFollowUp) {
      return this.handleFollowUp(transcript, context);
    }

    // Process new command
    return this.parseCommand(transcript, context);
  }

  private handleConfirmation(transcript: string, context?: VoiceContext): EnhancedVoiceCommand {
    console.log('🤔 Enhanced Processor: Handling confirmation for transcript:', transcript);
    console.log('🤔 Enhanced Processor: Pending confirmation:', this.pendingConfirmation);
    
    const cleanText = transcript.toLowerCase().trim();
    
    // Enhanced confirmation patterns - more flexible matching
    const yesPatterns = [
      /^yes$/i, /^yeah$/i, /^yep$/i, /^confirm$/i, /^do it$/i, /^proceed$/i, 
      /^okay$/i, /^ok$/i, /^sure$/i, /^absolutely$/i, /^definitely$/i,
      /yes.*delete/i, /delete.*yes/i, /go.*ahead/i, /^correct$/i
    ];
    
    const noPatterns = [
      /^no$/i, /^nope$/i, /^cancel$/i, /^stop$/i, /^abort$/i, 
      /never.*mind/i, /^nevermind$/i, /^don't$/i, /^dont$/i,
      /no.*delete/i, /cancel.*delete/i, /^negative$/i, /^wait$/i
    ];
    
    const isYes = yesPatterns.some(pattern => pattern.test(cleanText));
    const isNo = noPatterns.some(pattern => pattern.test(cleanText));
    
    console.log('🤔 Enhanced Processor: Confirmation analysis:', { 
      cleanText, 
      isYes, 
      isNo,
      hasPendingConfirmation: !!this.pendingConfirmation 
    });
    
    if (isYes && this.pendingConfirmation) {
        console.log('✅ Enhanced Processor: User confirmed action - EXECUTING');
        const command = { 
          ...this.pendingConfirmation!, 
          parameters: { ...this.pendingConfirmation!.parameters, confirmed: true },
          needsConfirmation: false,
          conversationalResponse: 'Confirmed. Executing action now.'
        };
        this.clearConfirmationState();
        console.log('✅ Enhanced Processor: Returning confirmed command:', command);
        return command;
      } else if (isNo && this.pendingConfirmation) {
        console.log('❌ Enhanced Processor: User cancelled action');
        const command = { 
          ...this.pendingConfirmation!, 
          parameters: { ...this.pendingConfirmation!.parameters, confirmed: false },
          needsConfirmation: false,
          conversationalResponse: 'Action cancelled.'
        };
        this.clearConfirmationState();
        return command;
    }
    
    // Check if this is a completely different command instead of unclear confirmation
    const isNewCommand = this.isLikelyNewCommand(cleanText);
    if (isNewCommand && context) {
      if (this.debugMode) console.log('🎯 Enhanced Processor: User gave new command during confirmation, clearing and processing:', cleanText);
      this.clearConfirmationState();
      // Process the new command
      return this.parseCommand(transcript, context);
    }
    
    console.log('🔄 Enhanced Processor: Asking for clarification');
    return {
      intent: 'conversation',
      action: 'clarify_confirmation',
      parameters: {},
      confidence: 0.8,
      conversationalResponse: 'I need a clear yes or no. Please say yes to confirm or no to cancel.'
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
      console.log('🗑️ Enhanced Processor: Processing delete command');
      const entryMatch = this.extractEntryReference(cleanText, context);
      
      if (entryMatch) {
        console.log('🗑️ Enhanced Processor: Found entry match for deletion:', entryMatch);
        // Store the confirmation command but also return it
        this.pendingConfirmation = {
          intent: 'delete',
          action: 'delete_entry',
          parameters: { entryId: entryMatch.id, title: entryMatch.title },
          confidence: 0.8,
          needsConfirmation: true,
          conversationalResponse: `Are you sure you want to delete "${entryMatch.title}"? Say yes to confirm or no to cancel.`
        };
        this.startConfirmationTimeout();
        return this.pendingConfirmation;
      } else {
        // Try to extract the search term
        const searchTerm = cleanText.replace(/delete|remove/g, '').trim();
        console.log('🗑️ Enhanced Processor: No exact match, using search term:', searchTerm);
        
        this.pendingConfirmation = {
          intent: 'delete',
          action: 'delete_entry',
          parameters: { searchTerm },
          confidence: 0.6,
          needsConfirmation: true,
          conversationalResponse: `Looking for entries matching "${searchTerm}" to delete. Say yes to confirm or no to cancel.`
        };
        return this.pendingConfirmation;
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

  // Helper to detect if user is giving a new command instead of confirmation
  private isLikelyNewCommand(text: string): boolean {
    const commandWords = [
      'create', 'add', 'new', 'make', 'open', 'show', 'delete', 'remove', 'edit', 'update', 'search', 'find', 'list', 'help'
    ];
    const words = text.split(' ');
    
    // If the first word is a command word, likely a new command
    if (commandWords.includes(words[0])) {
      return true;
    }
    
    // Check for question patterns that aren't confirmations
    if (text.includes('what') || text.includes('how') || text.includes('where') || text.includes('when')) {
      return true;
    }
    
    return false;
  }

  public hasPendingConfirmation(): boolean {
    return this.pendingConfirmation !== null;
  }

  public isExpectingFollowUp(): boolean {
    return this.expectingFollowUp;
  }

  // Clear pending confirmation (legacy method for backwards compatibility)
  public clearPendingConfirmation(): void {
    if (this.debugMode) console.log('🧹 Enhanced Processor: clearPendingConfirmation called (legacy)');
    this.clearConfirmationState();
  }
}

export const voiceProcessor = new EnhancedVoiceProcessor();
