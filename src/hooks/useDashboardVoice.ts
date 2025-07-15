
import { SavedEntry } from "@/types/dashboard";
import { VoiceCommand, processVoiceCommand } from "@/utils/voiceCommandProcessor";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";

interface UseDashboardVoiceProps {
  savedEntries: SavedEntry[];
  showAddEntry: boolean;
  setShowAddEntry: (show: boolean) => void;
  setEditingEntry: (entry: SavedEntry | null) => void;
  setFillingEntry: (entry: SavedEntry | null) => void;
  deleteEntry: (id: string) => void;
  editEntry: (entry: SavedEntry) => void;
  fillEntry: (entry: SavedEntry) => void;
  handleCancelEdit: () => void;
  saveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingEntry?: SavedEntry | null;
  fillingEntry?: SavedEntry | null;
}

export const useDashboardVoice = ({
  savedEntries,
  showAddEntry,
  setShowAddEntry,
  setEditingEntry,
  setFillingEntry,
  deleteEntry,
  editEntry,
  fillEntry,
  handleCancelEdit,
  saveEntry,
  editingEntry,
  fillingEntry,
}: UseDashboardVoiceProps) => {
  const handleVoiceCommand = (command: VoiceCommand) => {
    console.log('Executing voice command:', command);
    
    switch (command.type) {
      case 'create_entry':
        console.log('Creating new entry...');
        // Open the add entry form
        setShowAddEntry(true);
        const createMessage = 'Creating a new entry';
        toast.success(createMessage);
        speak(createMessage);
        break;
        
      case 'open_entry':
        if (command.params?.entryTitle === 'all_entries') {
          console.log('Opening all entries view...');
          // This would need to be handled by the parent component
          // For now, just show a message
          const allEntriesMessage = 'Showing all entries';
          toast.success(allEntriesMessage);
          speak(allEntriesMessage);
        } else if (command.params?.entryTitle) {
          const entryToOpen = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToOpen) {
            editEntry(entryToOpen);
            const openMessage = `Opening entry: ${entryToOpen.title}`;
            toast.success(openMessage);
            speak(openMessage);
          } else {
            const errorMessage = `Entry "${command.params.entryTitle}" not found. Showing available entries instead.`;
            toast.info(errorMessage);
            speak(errorMessage);
          }
        }
        break;
        
      case 'open_file':
        // Enhanced file search with fuzzy matching
        if (command.params?.entryTitle) {
          const searchTerm = command.params.entryTitle;
          const searchResults = savedEntries.filter(entry => {
            const searchLower = searchTerm.toLowerCase();
            const titleMatch = entry.title.toLowerCase().includes(searchLower);
            const fieldMatch = Object.values(entry.fields).some(value => 
              typeof value === 'string' && value.toLowerCase().includes(searchLower)
            );
            return titleMatch || fieldMatch;
          });
          
          if (searchResults.length === 1) {
            editEntry(searchResults[0]);
            const openMessage = `Opening: ${searchResults[0].title}`;
            toast.success(openMessage);
            speak(openMessage);
          } else if (searchResults.length > 1) {
            const matches = searchResults.slice(0, 3).map(entry => entry.title).join(', ');
            const multipleMessage = `Found ${searchResults.length} matches: ${matches}. Please be more specific.`;
            toast.info(multipleMessage);
            speak(multipleMessage);
          } else {
            const noMatchMessage = `No files found matching "${searchTerm}". Try "show all entries" to see available files.`;
            toast.info(noMatchMessage);
            speak(noMatchMessage);
          }
        }
        break;
        
      case 'create_field':
        console.log('Creating field...');
        // Actually create an entry with the specified field
        const fieldName = command.params?.fieldName || 'New Field';
        const fieldType = command.params?.fieldType || 'text';
        
        const newEntry = {
          title: `${fieldName} Entry - ${new Date().toLocaleDateString()}`,
          fields: {
            category: 'Personal',
            [fieldName]: ''
          },
          fieldDefinitions: [
            { id: 'category', name: 'category', type: 'text' as const },
            { id: Date.now().toString(), name: fieldName, type: fieldType as 'text' | 'number' | 'date' | 'textarea' }
          ]
        };
        
        saveEntry(newEntry);
        const createFieldMessage = `Created entry with field "${fieldName}"`;
        toast.success(createFieldMessage);
        speak(createFieldMessage);
        break;
        
      case 'delete_entry':
        if (command.params?.entryTitle) {
          // Enhanced delete with confirmation
          const searchTerm = command.params.entryTitle;
          const matchingEntries = savedEntries.filter(entry => 
            entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            Object.values(entry.fields).some(value => 
              typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
            )
          );
          
          if (matchingEntries.length === 1) {
            const entryToDelete = matchingEntries[0];
            const confirmMessage = `Are you sure you want to delete "${entryToDelete.title}"? Say "confirm delete" to proceed or "cancel" to abort.`;
            toast.info(confirmMessage);
            speak(confirmMessage);
          } else if (matchingEntries.length > 1) {
            const matches = matchingEntries.slice(0, 3).map(entry => entry.title).join(', ');
            const multipleMessage = `Found ${matchingEntries.length} entries: ${matches}. Please be more specific.`;
            toast.info(multipleMessage);
            speak(multipleMessage);
          } else {
            const notFoundMessage = `No entries found matching "${searchTerm}". Try "show all entries" to see available items.`;
            toast.info(notFoundMessage);
            speak(notFoundMessage);
          }
        } else {
          const noTargetMessage = 'Please specify what to delete. Try "delete medical records" or "delete invoice".';
          toast.info(noTargetMessage);
          speak(noTargetMessage);
        }
        break;
        
      case 'fill_form':
        if (command.params?.entryTitle) {
          const entryToFill = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToFill) {
            fillEntry(entryToFill);
            const fillMessage = `Filling form: ${entryToFill.title}`;
            toast.success(fillMessage);
            speak(fillMessage);
          } else {
            const errorMessage = `Template "${command.params.entryTitle}" not found`;
            toast.error(errorMessage);
            speak(errorMessage);
          }
        }
        break;
        
      case 'save_entry':
        if (showAddEntry) {
          const saveMessage = 'Please fill out the form and click save to save the entry';
          toast.success('Voice command: Save the current entry');
          speak(saveMessage);
        } else {
          const noEntryMessage = 'No entry form is currently open';
          toast.info(noEntryMessage);
          speak(noEntryMessage);
        }
        break;
        
      case 'cancel':
        console.log('Close/Cancel command received in dashboard');
        
        // Enhanced close functionality - check for any open forms
        let formClosed = false;
        let closeMessage = '';
        
        if (showAddEntry) {
          console.log('Closing add entry form');
          setShowAddEntry(false);
          closeMessage = 'Add entry form closed';
          formClosed = true;
        } else if (editingEntry) {
          console.log('Closing edit entry form');
          setEditingEntry(null);
          closeMessage = 'Edit entry form closed';
          formClosed = true;
        } else if (fillingEntry) {
          console.log('Closing fill entry form');
          setFillingEntry(null);
          closeMessage = 'Fill entry form closed';
          formClosed = true;
        }
        
        // If we found and closed a form, use handleCancelEdit to ensure proper cleanup
        if (formClosed) {
          handleCancelEdit();
          toast.success(closeMessage);
          speak(closeMessage);
        } else {
          // No specific form to close, general close action
          const generalCloseMessage = 'Nothing to close';
          toast.info(generalCloseMessage);
          speak(generalCloseMessage);
        }
        
        // Trigger a custom event that components can listen to for closing
        window.dispatchEvent(new CustomEvent('voice-close-command', { 
          detail: { timestamp: Date.now(), source: 'dashboard' } 
        }));
        break;
        
      default:
        console.log('Unknown command received, providing help message');
        const helpMessage = 'I can help you with commands like: Create new entry, Show all entries, Delete entry, or Fill form. Try saying "create a new entry" or "show all my documents".';
        toast.info('Voice command not recognized');
        speak(helpMessage);
    }
  };

  const handleVoiceResult = (text: string) => {
    console.log('Processing voice text:', text);
    // Process the text as a voice command
    const command = processVoiceCommand(text);
    handleVoiceCommand(command);
  };

  return {
    handleVoiceCommand,
    handleVoiceResult,
  };
};
