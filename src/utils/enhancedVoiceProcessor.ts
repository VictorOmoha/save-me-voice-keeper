
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';

export interface EnhancedVoiceCommand {
  intent: 'create' | 'delete' | 'edit' | 'search' | 'navigate' | 'export' | 'bulk_operation' | 'form_fill' | 'conversation' | 'close' | 'cancel' | 'clarification' | 'unknown';
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
    this.lastTTSPrompt = '';
    if (this.confirmationTimeout) {
      clearTimeout(this.confirmationTimeout);
      this.confirmationTimeout = null;
    }
  }

  public clearPendingConfirmation(): void {
    if (this.debugMode) console.log('🧹 Enhanced Processor: Clearing pending confirmation only');
    this.pendingConfirmation = null;
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
    console.log('🤔 Enhanced Processor: Handling confirmation for transcript:', transcript, {
      hasPending: !!this.pendingConfirmation,
      pendingAction: this.pendingConfirmation?.action,
      pendingParams: this.pendingConfirmation?.parameters
    });
    
    if (!this.pendingConfirmation) {
      console.log('⚠️ Enhanced Processor: No pending confirmation found');
      return {
        intent: 'unknown',
        action: 'none',
        parameters: {},
        confidence: 0,
        conversationalResponse: "I'm not waiting for any confirmation right now. What would you like to do?"
      };
    }
    
    const cleanText = transcript.toLowerCase().trim().replace(/[.,!?]+$/g, '');
    console.log('🔍 Enhanced Processor: Checking confirmation text:', cleanText);
    
    // Comprehensive positive confirmation patterns with word boundary matching
    const positivePatterns = [
      'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'confirm', 'do it', 
      'go ahead', 'affirmative', 'correct', 'right', 'absolutely', 'definitely',
      'proceed', 'continue', 'that\'s right', 'sounds good', 'looks good'
    ];
    
    const negativePatterns = [
      'no', 'nope', 'nah', 'cancel', 'stop', 'abort', 'negative', 'don\'t',
      'skip', 'never mind', 'nevermind', 'not now', 'hold on', 'wait',
      'incorrect', 'wrong', 'that\'s not right'
    ];
    
    // More sophisticated pattern matching using word boundaries
    const isPositive = positivePatterns.some(pattern => {
      // Exact match
      if (cleanText === pattern) return true;
      
      // Word boundary matching to avoid false positives
      const wordBoundaryRegex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      return wordBoundaryRegex.test(cleanText);
    });
    
    const isNegative = negativePatterns.some(pattern => {
      // Exact match
      if (cleanText === pattern) return true;
      
      // Word boundary matching to avoid false positives
      const wordBoundaryRegex = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      return wordBoundaryRegex.test(cleanText);
    });
    
    console.log('🔍 Enhanced Processor: Pattern matching results:', { isPositive, isNegative, transcript: cleanText });
    
    if (isPositive) {
      console.log('✅ Enhanced Processor: Positive confirmation received');
      const confirmedCommand = { 
        ...this.pendingConfirmation, 
        parameters: { ...this.pendingConfirmation.parameters, confirmed: true },
        needsConfirmation: false,
        conversationalResponse: `Confirmed! ${this.pendingConfirmation.action === 'delete_entry' ? 'Deleting entry now.' : 'Processing your request now.'}`
      };
      this.clearConfirmationState();
      return confirmedCommand;
    }
    
    if (isNegative) {
      console.log('❌ Enhanced Processor: Negative confirmation received');
      const cancelCommand = {
        intent: 'cancel' as const,
        action: 'cancel',
        parameters: { confirmed: false },
        confidence: 0.9,
        conversationalResponse: "Okay, I've cancelled that action."
      };
      this.clearConfirmationState();
      return cancelCommand;
    }
    
    // Check if this is a completely different command instead of unclear confirmation
    const isNewCommand = this.isLikelyNewCommand(cleanText);
    if (isNewCommand && context) {
      console.log('🎯 Enhanced Processor: User gave new command during confirmation, clearing and processing:', cleanText);
      this.clearConfirmationState();
      return this.parseCommand(transcript, context);
    }
    
    // If unclear response, ask again but don't clear the confirmation state
    console.log('❓ Enhanced Processor: Unclear confirmation response, asking again');
    return {
      intent: 'clarification',
      action: 'request_clarification',
      parameters: {},
      confidence: 0.3,
      conversationalResponse: "I didn't understand that. Please say 'yes' to confirm or 'no' to cancel.",
      needsConfirmation: true
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
      console.log('🗑️ Enhanced Processor: Processing explicit delete command');
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
        this.startConfirmationTimeout();
        return this.pendingConfirmation;
      }
    }

    // Edit/Open commands - CHECK THESE FIRST before generic entry matching
    if (cleanText.includes('edit') || cleanText.includes('open') || cleanText.includes('modify')) {
      console.log('🔍 Enhanced Processor: Edit/Open command detected:', {
        cleanText,
        hasEdit: cleanText.includes('edit'),
        hasOpen: cleanText.includes('open'),
        hasModify: cleanText.includes('modify')
      });
      
      const entryMatch = this.extractEntryReference(cleanText, context);
      console.log('🔍 Enhanced Processor: Entry match result in edit/open block:', {
        entryMatch,
        contextEntries: context.availableEntries?.length || 0,
        firstEntry: context.availableEntries?.[0]?.title || 'none'
      });
      
      if (entryMatch) {
        console.log('✅ Enhanced Processor: Found entry match in edit/open block, returning edit action:', entryMatch);
        return {
          intent: 'edit',
          action: 'open_entry',
          parameters: { entryId: entryMatch.id, title: entryMatch.title },
          confidence: 0.8,
          conversationalResponse: `Opening "${entryMatch.title}" for editing`
        };
      } else {
        console.log('❌ Enhanced Processor: No entry match found in edit/open block');
        // Try to extract entry name from the command
        const entryName = cleanText.replace(/edit|open|modify/g, '').trim();
        if (entryName) {
          console.log('🔍 Enhanced Processor: Extracted entry name from command:', entryName);
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

    // Check if user is mentioning an entry name directly (could be delete intent)
    // Only do this for very short utterances that don't contain explicit commands
    const entryMatch = this.extractEntryReference(cleanText, context);
    if (entryMatch && cleanText.trim().length < 15 && 
        !cleanText.includes('open') && !cleanText.includes('edit') && 
        !cleanText.includes('create') && !cleanText.includes('search')) {
      console.log('🎯 Enhanced Processor: Entry reference detected, offering delete option:', entryMatch);
      this.pendingConfirmation = {
        intent: 'delete',
        action: 'delete_entry',
        parameters: { entryId: entryMatch.id, title: entryMatch.title },
        confidence: 0.7,
        needsConfirmation: true,
        conversationalResponse: `Do you want to delete "${entryMatch.title}"? Say yes to confirm or no to cancel.`
      };
      this.startConfirmationTimeout();
      return this.pendingConfirmation;
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
    const cleanText = text.toLowerCase().trim().replace(/[.,!?]/g, '');
    const words = cleanText.split(' ');
    
    for (const entry of context.availableEntries) {
      const entryTitle = entry.title.toLowerCase();
      const titleWords = entryTitle.split(' ');
      
      // Exact match first
      if (entryTitle === cleanText) {
        console.log('🎯 Exact entry match found:', entry.title);
        return { id: entry.id, title: entry.title };
      }
      
      // Check if any significant words from the entry title appear in the command
      const hasMatch = titleWords.some(titleWord => 
        titleWord.length > 2 && words.some(word => word.includes(titleWord) || titleWord.includes(word))
      );
      
      // Also check if the entire clean text is contained in the entry title
      const isContained = entryTitle.includes(cleanText) && cleanText.length > 2;
      
      if (hasMatch || isContained) {
        console.log('🎯 Entry match found:', entry.title, { hasMatch, isContained });
        return { id: entry.id, title: entry.title };
      }
    }
    
    console.log('🔍 No entry match found for:', cleanText);
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

}

export const voiceProcessor = new EnhancedVoiceProcessor();
