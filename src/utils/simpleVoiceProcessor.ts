
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';

export interface SimpleVoiceCommand {
  type: 'create_entry' | 'open_entry' | 'delete_entry' | 'cancel' | 'save_entry' | 'show_all' | 'unknown';
  target?: string;
  confidence: number;
}

export class SimpleVoiceProcessor {
  processCommand(transcript: string): SimpleVoiceCommand {
    const lowerTranscript = transcript.toLowerCase().trim();
    console.log('🎯 Simple Voice Processor: Processing:', lowerTranscript);
    
    // Cancel/Close commands - highest priority
    if (this.isCancelCommand(lowerTranscript)) {
      return { type: 'cancel', confidence: 0.95 };
    }
    
    // Create entry commands
    if (this.isCreateCommand(lowerTranscript)) {
      return { type: 'create_entry', confidence: 0.9 };
    }
    
    // Show all entries
    if (this.isShowAllCommand(lowerTranscript)) {
      return { type: 'show_all', confidence: 0.9 };
    }
    
    // Open specific entry
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
  
  private isCancelCommand(text: string): boolean {
    const cancelWords = ['cancel', 'close', 'stop', 'exit', 'back', 'dismiss', 'done'];
    return cancelWords.some(word => text.includes(word));
  }
  
  private isCreateCommand(text: string): boolean {
    return (text.includes('create') || text.includes('add') || text.includes('new')) &&
           (text.includes('entry') || text.includes('record') || text.includes('document'));
  }
  
  private isShowAllCommand(text: string): boolean {
    return (text.includes('show') || text.includes('view') || text.includes('display')) &&
           (text.includes('all') || text.includes('entries') || text.includes('everything'));
  }
  
  private isOpenCommand(text: string): boolean {
    return text.includes('open') || text.includes('edit') || text.includes('view');
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
