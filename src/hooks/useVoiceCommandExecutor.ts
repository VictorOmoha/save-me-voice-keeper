
import { useCallback } from 'react';
import { SimpleVoiceCommand } from '@/utils/simpleVoiceProcessor';
import { SavedEntry } from '@/types/dashboard';
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';

interface VoiceCommandExecutorProps {
  savedEntries: SavedEntry[];
  onAddEntry: () => void;
  onEditEntry: (entry: SavedEntry) => void;
  onDeleteEntry: (id: string) => void;
  onCancelEdit: () => void;
  showAddEntry: boolean;
  editingEntry?: SavedEntry | null;
}

export const useVoiceCommandExecutor = ({
  savedEntries,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onCancelEdit,
  showAddEntry,
  editingEntry,
}: VoiceCommandExecutorProps) => {
  
  const executeCommand = useCallback((command: SimpleVoiceCommand) => {
    console.log('🚀 Executing voice command:', command);
    
    // Enhanced confidence thresholds for different command types
    const confidenceThresholds = {
      'create_entry': 0.8,
      'cancel': 0.7,
      'show_all': 0.8,
      'open_entry': 0.75,
      'delete_entry': 0.8,
      'save_entry': 0.8
    };
    
    const requiredConfidence = confidenceThresholds[command.type] || 0.7;
    
    if (command.confidence < requiredConfidence) {
      console.log(`🚫 Command confidence ${command.confidence} below threshold ${requiredConfidence}`);
      return;
    }
    
    switch (command.type) {
      case 'create_entry':
        onAddEntry();
        toast.success('Creating new entry');
        speak('Creating a new entry');
        break;
        
      case 'show_all':
        toast.success('Showing all entries');
        speak('Here are all your entries');
        break;
        
      case 'open_entry':
        if (command.target) {
          const matchingEntry = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.target!.toLowerCase())
          );
          
          if (matchingEntry) {
            onEditEntry(matchingEntry);
            toast.success(`Opening ${matchingEntry.title}`);
            speak(`Opening ${matchingEntry.title}`);
          } else {
            // More conservative feedback to prevent loops
            console.log(`No entry found matching "${command.target}"`);
            toast.info(`No entry found matching "${command.target}"`);
            // Only speak if the command was very specific to avoid feedback loops
            if (command.confidence > 0.85) {
              speak(`I couldn't find an entry matching ${command.target}`);
            }
          }
        } else {
          toast.info('Please specify which entry to open');
          speak('Which entry would you like to open?');
        }
        break;
        
      case 'delete_entry':
        if (command.target) {
          const matchingEntry = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.target!.toLowerCase())
          );
          
          if (matchingEntry) {
            toast.info(`Would you like to delete "${matchingEntry.title}"? Say "confirm delete" to proceed.`);
            // Don't speak deletion confirmations to avoid accidental triggers
          } else {
            console.log(`No entry found for deletion: "${command.target}"`);
            toast.info(`No entry found matching "${command.target}"`);
          }
        } else {
          toast.info('Please specify which entry to delete');
          if (command.confidence > 0.85) {
            speak('Which entry would you like to delete?');
          }
        }
        break;
        
      case 'cancel':
        if (showAddEntry || editingEntry) {
          onCancelEdit();
          toast.success('Cancelled and closed forms');
          speak('Forms closed');
        } else {
          toast.info('Nothing to cancel');
          // Only speak if very confident to avoid noise
          if (command.confidence > 0.9) {
            speak('There\'s nothing to cancel right now');
          }
        }
        break;
        
      case 'save_entry':
        if (showAddEntry || editingEntry) {
          toast.info('Please complete the form and click save');
        } else {
          toast.info('No entry form is currently open');
        }
        break;
        
      default:
        console.log('Voice command not recognized or filtered out:', command);
    }
  }, [savedEntries, onAddEntry, onEditEntry, onDeleteEntry, onCancelEdit, showAddEntry, editingEntry]);
  
  return { executeCommand };
};
