
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
    
    switch (command.type) {
      case 'create_entry':
        onAddEntry();
        toast.success('Creating new entry');
        speak('Creating a new entry');
        break;
        
      case 'show_all':
        // This would typically navigate to show all entries
        toast.success('Showing all entries');
        speak('Showing all your entries');
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
            toast.info(`No entry found matching "${command.target}"`);
            speak(`I couldn't find an entry matching ${command.target}`);
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
            // For now, just show confirmation - implement confirmation dialog later
            toast.info(`Would you like to delete "${matchingEntry.title}"? Say "confirm delete" to proceed.`);
            speak(`Are you sure you want to delete ${matchingEntry.title}? Say confirm delete to proceed.`);
          } else {
            toast.info(`No entry found matching "${command.target}"`);
            speak(`I couldn't find an entry matching ${command.target}`);
          }
        } else {
          toast.info('Please specify which entry to delete');
          speak('Which entry would you like to delete?');
        }
        break;
        
      case 'cancel':
        if (showAddEntry || editingEntry) {
          onCancelEdit();
          toast.success('Cancelled and closed forms');
          speak('Forms closed');
        } else {
          toast.info('Nothing to cancel');
          speak('There\'s nothing to cancel right now');
        }
        break;
        
      case 'save_entry':
        if (showAddEntry || editingEntry) {
          toast.info('Please fill out the form and click save');
          speak('Please complete the form and click save');
        } else {
          toast.info('No entry form is currently open');
          speak('There\'s no form open to save');
        }
        break;
        
      default:
        toast.info('Voice command not recognized');
        speak('I didn\'t understand that. Try saying create new entry, or cancel.');
    }
  }, [savedEntries, onAddEntry, onEditEntry, onDeleteEntry, onCancelEdit, showAddEntry, editingEntry]);
  
  return { executeCommand };
};
