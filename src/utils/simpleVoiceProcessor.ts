
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';

export interface SimpleVoiceCommand {
  type: 'create_entry' | 'open_entry' | 'delete_entry' | 'cancel' | 'save_entry' | 'show_all' | 'confirm' | 'deny' | 'unknown';
  target?: string;
  confidence: number;
}

export class SimpleVoiceProcessor {
  processCommand(transcript: string): SimpleVoiceCommand {
    const lowerTranscript = transcript.toLowerCase().trim();
    console.log('🎯 Simple Voice Processor: Processing:', lowerTranscript);
    
    // Skip TTS feedback - filter out common TTS response patterns
    if (this.isTTSFeedback(lowerTranscript)) {
      console.log('🚫 Filtering out TTS feedback:', lowerTranscript);
      return { type: 'unknown', confidence: 0.0 };
    }
    
    // Skip if currently speaking to prevent feedback loops
    if ((window as any).__tts_is_speaking) {
      console.log('🚫 Skipping command while TTS is speaking');
      return { type: 'unknown', confidence: 0.0 };
    }
    
    // Confirmation responses - highest priority
    if (this.isConfirmCommand(lowerTranscript)) {
      return { type: 'confirm', confidence: 0.95 };
    }
    
    if (this.isDenyCommand(lowerTranscript)) {
      return { type: 'deny', confidence: 0.95 };
    }
    
    // Cancel/Close commands - high priority
    if (this.isCancelCommand(lowerTranscript)) {
      return { type: 'cancel', confidence: 0.95 };
    }
    
    // Create entry commands - must be explicit
    if (this.isCreateCommand(lowerTranscript)) {
      return { type: 'create_entry', confidence: 0.9 };
    }
    
    // Show all entries
    if (this.isShowAllCommand(lowerTranscript)) {
      return { type: 'show_all', confidence: 0.9 };
    }
    
    // Open specific entry - now more specific
    if (this.isOpenCommand(lowerTranscript)) {
      const target = this.extractTarget(lowerTranscript, 'open');
      return { type: 'open_entry', target, confidence: target ? 0.8 : 0.4 };
    }
    
    // Delete entry
    if (this.isDeleteCommand(lowerTranscript)) {
      const target = this.extractTarget(lowerTranscript, 'delete');
      return { type: 'delete_entry', target, confidence: target ? 0.8 : 0.4 };
    }
    
    // Save entry
    if (this.isSaveCommand(lowerTranscript)) {
      return { type: 'save_entry', confidence: 0.9 };
    }
    
    return { type: 'unknown', confidence: 0.1 };
  }
  
  private isTTSFeedback(text: string): boolean {
    // Common TTS response patterns that should be filtered out
    const ttsPatterns = [
      'i couldn\'t find',
      'couldn\'t find an entry',
      'matching',
      'no entry found',
      'voice mode activated',
      'how can i help',
      'creating new entry',
      'creating a new entry',
      'opening',
      'showing all',
      'forms closed',
      'there\'s nothing to cancel',
      'which entry would you like',
      'are you sure you want to delete',
      'say confirm delete',
      'please complete the form',
      'no form open to save'
    ];
    
    return ttsPatterns.some(pattern => text.includes(pattern));
  }
  
  private isConfirmCommand(text: string): boolean {
    const confirmWords = ['yes', 'confirm', 'proceed', 'ok', 'okay', 'sure', 'correct', 'right'];
    return confirmWords.some(word => text === word || text.startsWith(word + ' ') || text.endsWith(' ' + word));
  }
  
  private isDenyCommand(text: string): boolean {
    const denyWords = ['no', 'cancel', 'stop', 'abort', 'never mind', 'nevermind'];
    return denyWords.some(word => text === word || text.startsWith(word + ' ') || text.endsWith(' ' + word));
  }
  
  private isCancelCommand(text: string): boolean {
    const cancelWords = ['cancel', 'close', 'stop', 'exit', 'back', 'dismiss', 'done'];
    return cancelWords.some(word => text.includes(word));
  }
  
  private isCreateCommand(text: string): boolean {
    // Must explicitly mention creating/adding something
    return (text.includes('create') || text.includes('add') || text.includes('new')) &&
           (text.includes('entry') || text.includes('record') || text.includes('document'));
  }
  
  private isShowAllCommand(text: string): boolean {
    return (text.includes('show') || text.includes('view') || text.includes('display')) &&
           (text.includes('all') || text.includes('entries') || text.includes('everything'));
  }
  
  private isOpenCommand(text: string): boolean {
    // Make this much more specific - only trigger on explicit "open X" patterns
    const hasOpenWord = text.includes('open');
    const hasEditWord = text.includes('edit');
    
    // Don't trigger on TTS responses that mention "opening"
    if (text.includes('opening') && !hasOpenWord) {
      return false;
    }
    
    // Must have explicit open/edit command structure
    return (hasOpenWord || hasEditWord) && 
           !text.includes('couldn\'t find') && // Filter out error responses
           !text.includes('no entry found') &&
           text.length > 4; // Avoid single word false positives
  }
  
  private isDeleteCommand(text: string): boolean {
    return text.includes('delete') || text.includes('remove') || text.includes('trash');
  }
  
  private isSaveCommand(text: string): boolean {
    return text.includes('save') || text.includes('submit');
  }
  
  private extractTarget(text: string, action: string): string {
    // Remove the action word and common articles
    let cleaned = text.replace(new RegExp(`\\b${action}\\b`, 'gi'), '');
    cleaned = cleaned.replace(/\b(the|a|an|my|entry|record|document)\b/gi, '');
    cleaned = cleaned.trim();
    
    return cleaned.length > 2 ? cleaned : '';
  }
}

export const simpleVoiceProcessor = new SimpleVoiceProcessor();
