import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';
import { SavedEntry } from '@/types/dashboard';

export interface VoiceCommand {
  action: 'create_entry' | 'delete_entry' | 'edit_entry' | 'close_modal' | 'search' | 'unknown';
  parameters: Record<string, any>;
  confidence: number;
  needsConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface VoiceProcessorState {
  pendingCommand: VoiceCommand | null;
  awaitingConfirmation: boolean;
  lastCommand: string;
}

class SimplifiedVoiceProcessor {
  private state: VoiceProcessorState = {
    pendingCommand: null,
    awaitingConfirmation: false,
    lastCommand: ''
  };

  private confirmationTimeout: NodeJS.Timeout | null = null;
  private lastTTSPrompt: string = '';

  // Clear all state
  public reset(): void {
    console.log('🔄 Voice Processor: Resetting all state');
    this.state = {
      pendingCommand: null,
      awaitingConfirmation: false,
      lastCommand: ''
    };
    this.clearConfirmationTimeout();
  }

  public setLastTTSPrompt(prompt: string): void {
    this.lastTTSPrompt = prompt;
  }

  public getState(): VoiceProcessorState {
    return { ...this.state };
  }

  private clearConfirmationTimeout(): void {
    if (this.confirmationTimeout) {
      clearTimeout(this.confirmationTimeout);
      this.confirmationTimeout = null;
    }
  }

  private startConfirmationTimeout(): void {
    this.clearConfirmationTimeout();
    this.confirmationTimeout = setTimeout(() => {
      console.log('⏰ Voice Processor: Confirmation timeout');
      this.reset();
      speak("Confirmation timeout. Please try your command again.");
    }, 15000); // 15 second timeout
  }

  // Check if input is TTS feedback
  private isTTSFeedback(text: string): boolean {
    const cleanText = text.toLowerCase().trim();
    
    // Block if TTS is currently speaking
    if ((window as any).__tts_is_speaking) {
      console.log('🚫 Voice Processor: TTS currently speaking, blocking input');
      return true;
    }

    // Check against last TTS prompt
    if (this.lastTTSPrompt && cleanText.includes(this.lastTTSPrompt.toLowerCase().slice(0, 10))) {
      console.log('🚫 Voice Processor: Detected TTS feedback');
      return true;
    }

    // Block known TTS patterns
    const ttsPatterns = [
      /voice mode activated/,
      /how can i help/,
      /are you sure you want to delete/,
      /entry created successfully/,
      /entry deleted successfully/
    ];

    return ttsPatterns.some(pattern => pattern.test(cleanText));
  }

  // Process voice input
  public async processCommand(
    transcript: string,
    context: {
      savedEntries: SavedEntry[];
      onCreateEntry: () => void;
      onDeleteEntry: (id: string) => void;
      onEditEntry: (entry: SavedEntry) => void;
      onCloseModal: () => void;
    }
  ): Promise<void> {
    const cleanTranscript = transcript.trim();
    console.log('🎤 Voice Processor: Processing:', cleanTranscript);

    // Skip empty or very short inputs
    if (cleanTranscript.length < 2) {
      console.log('🚫 Voice Processor: Input too short');
      return;
    }

    // Filter TTS feedback
    if (this.isTTSFeedback(cleanTranscript)) {
      console.log('🚫 Voice Processor: Blocked TTS feedback');
      return;
    }

    this.state.lastCommand = cleanTranscript;

    // Handle confirmation responses
    if (this.state.awaitingConfirmation) {
      await this.handleConfirmation(cleanTranscript, context);
      return;
    }

    // Parse and execute command
    const command = this.parseCommand(cleanTranscript, context.savedEntries);
    await this.executeCommand(command, context);
  }

  private parseCommand(transcript: string, savedEntries: SavedEntry[]): VoiceCommand {
    const lower = transcript.toLowerCase().trim();

    // Create entry commands
    if (lower.match(/\b(create|add|new)\s+(entry|item|record)\b/) || 
        lower.match(/\b(create|add|make)\s+a\s+new\b/) ||
        lower === 'create entry') {
      return {
        action: 'create_entry',
        parameters: {},
        confidence: 0.9
      };
    }

    // Delete commands
    const deleteMatch = lower.match(/\b(delete|remove)\s+(.+)/);
    if (deleteMatch) {
      const searchTerm = deleteMatch[2].replace(/\s*(entry|item|record)\s*$/, '').trim();
      const matchedEntry = this.findEntryByTitle(searchTerm, savedEntries);
      
      if (matchedEntry) {
        return {
          action: 'delete_entry',
          parameters: { entryId: matchedEntry.id, entryTitle: matchedEntry.title },
          confidence: 0.8,
          needsConfirmation: true,
          confirmationMessage: `Are you sure you want to delete "${matchedEntry.title}"?`
        };
      }
    }

    // Close commands
    if (lower.match(/\b(close|cancel|dismiss|exit)\b/)) {
      return {
        action: 'close_modal',
        parameters: {},
        confidence: 0.9
      };
    }

    // Edit commands
    const editMatch = lower.match(/\b(edit|modify|update)\s+(.+)/);
    if (editMatch) {
      const searchTerm = editMatch[2].replace(/\s*(entry|item|record)\s*$/, '').trim();
      const matchedEntry = this.findEntryByTitle(searchTerm, savedEntries);
      
      if (matchedEntry) {
        return {
          action: 'edit_entry',
          parameters: { entry: matchedEntry },
          confidence: 0.8
        };
      }
    }

    return {
      action: 'unknown',
      parameters: { originalText: transcript },
      confidence: 0.1
    };
  }

  private findEntryByTitle(searchTerm: string, savedEntries: SavedEntry[]): SavedEntry | null {
    const term = searchTerm.toLowerCase();
    
    // Exact match first
    let match = savedEntries.find(entry => 
      entry.title.toLowerCase() === term
    );
    
    if (match) return match;

    // Partial match
    match = savedEntries.find(entry => 
      entry.title.toLowerCase().includes(term) || 
      term.includes(entry.title.toLowerCase())
    );
    
    return match || null;
  }

  private async executeCommand(
    command: VoiceCommand,
    context: {
      savedEntries: SavedEntry[];
      onCreateEntry: () => void;
      onDeleteEntry: (id: string) => void;
      onEditEntry: (entry: SavedEntry) => void;
      onCloseModal: () => void;
    }
  ): Promise<void> {
    console.log('🚀 Voice Processor: Executing command:', command.action);

    if (command.needsConfirmation) {
      this.state.pendingCommand = command;
      this.state.awaitingConfirmation = true;
      this.startConfirmationTimeout();
      
      const baseMessage = command.confirmationMessage || 'Are you sure?';
      const fullMessage = baseMessage + ' Say yes to confirm or no to cancel.';
      this.setLastTTSPrompt(fullMessage);
      speak(fullMessage);
      return;
    }

    switch (command.action) {
      case 'create_entry':
        console.log('📝 Voice Processor: Creating new entry');
        context.onCreateEntry();
        {
          const msg = 'Opening new entry form';
          this.setLastTTSPrompt(msg);
          speak(msg);
        }
        break;

      case 'delete_entry':
        if (command.parameters.entryId) {
          console.log('🗑️ Voice Processor: Deleting entry:', command.parameters.entryId);
          context.onDeleteEntry(command.parameters.entryId);
          const msg = `Entry "${command.parameters.entryTitle}" deleted successfully`;
          this.setLastTTSPrompt(msg);
          speak(msg);
        }
        break;

      case 'edit_entry':
        if (command.parameters.entry) {
          console.log('✏️ Voice Processor: Editing entry:', command.parameters.entry.title);
          context.onEditEntry(command.parameters.entry);
          const msg = `Opening "${command.parameters.entry.title}" for editing`;
          this.setLastTTSPrompt(msg);
          speak(msg);
        }
        break;

      case 'close_modal':
        console.log('❌ Voice Processor: Closing modal');
        context.onCloseModal();
        {
          const msg = 'Closing';
          this.setLastTTSPrompt(msg);
          speak(msg);
        }
        break;

      case 'unknown':
        console.log('❓ Voice Processor: Unknown command');
        {
          const msg = "I didn't understand that. Try saying 'create entry', 'delete [entry name]', or 'close'.";
          this.setLastTTSPrompt(msg);
          speak(msg);
        }
        break;
    }
  }

  private async handleConfirmation(
    transcript: string,
    context: {
      savedEntries: SavedEntry[];
      onCreateEntry: () => void;
      onDeleteEntry: (id: string) => void;
      onEditEntry: (entry: SavedEntry) => void;
      onCloseModal: () => void;
    }
  ): Promise<void> {
    const lower = transcript.toLowerCase().trim();
    console.log('🤔 Voice Processor: Handling confirmation:', lower);

    if (lower.match(/\b(yes|yeah|yep|confirm|ok|okay)\b/)) {
      console.log('✅ Voice Processor: Confirmation accepted');
      
      if (this.state.pendingCommand) {
        const command = { ...this.state.pendingCommand };
        this.reset();
        await this.executeCommand(command, context);
      }
    } else if (lower.match(/\b(no|nope|cancel|abort|stop)\b/)) {
      console.log('❌ Voice Processor: Confirmation cancelled');
      this.reset();
      {
        const msg = 'Cancelled';
        this.setLastTTSPrompt(msg);
        speak(msg);
      }
    } else {
      console.log('❓ Voice Processor: Invalid confirmation response');
      {
        const msg = 'Please say yes to confirm or no to cancel';
        this.setLastTTSPrompt(msg);
        speak(msg);
      }
    }
  }
}

// Export singleton instance
export const voiceProcessor = new SimplifiedVoiceProcessor();