
import { SavedEntry } from "@/types/dashboard";
import { VoiceCommand } from "@/utils/voiceCommandProcessor";
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
}: UseDashboardVoiceProps) => {
  const handleVoiceCommand = (command: VoiceCommand) => {
    console.log('Executing voice command:', command);
    
    switch (command.type) {
      case 'create_field':
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
        const createMessage = `Created entry with field "${fieldName}"`;
        toast.success(createMessage);
        speak(createMessage);
        break;
        
      case 'create_entry':
        // Create a new entry with the specified title and category
        const entryTitle = command.params?.entryTitle || `New Entry - ${new Date().toLocaleDateString()}`;
        const entryCategory = command.params?.entryCategory || 'Personal';
        
        const basicEntry = {
          title: entryTitle,
          fields: {
            category: entryCategory,
            description: ''
          },
          fieldDefinitions: [
            { id: 'category', name: 'category', type: 'text' as const },
            { id: Date.now().toString(), name: 'description', type: 'textarea' as const }
          ]
        };
        
        saveEntry(basicEntry);
        const entryMessage = `Created entry "${entryTitle}" in ${entryCategory}`;
        toast.success(entryMessage);
        speak(entryMessage);
        break;
        
      case 'delete_entry':
        if (command.params?.entryTitle) {
          const entryToDelete = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToDelete) {
            deleteEntry(entryToDelete.id);
            const deleteMessage = `Deleted entry: ${entryToDelete.title}`;
            toast.success(deleteMessage);
            speak(deleteMessage);
          } else {
            const errorMessage = `Entry "${command.params.entryTitle}" not found`;
            toast.error(errorMessage);
            speak(errorMessage);
          }
        }
        break;
        
      case 'open_entry':
        if (command.params?.entryTitle) {
          const entryToOpen = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToOpen) {
            editEntry(entryToOpen);
            const openMessage = `Opening entry: ${entryToOpen.title}`;
            toast.success(openMessage);
            speak(openMessage);
          } else {
            const errorMessage = `Entry "${command.params.entryTitle}" not found`;
            toast.error(errorMessage);
            speak(errorMessage);
          }
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
        if (showAddEntry) {
          handleCancelEdit();
          const cancelMessage = 'Cancelled current action';
          toast.success('Voice command: Cancelled current action');
          speak(cancelMessage);
        } else {
          const noCancelMessage = 'No action to cancel';
          toast.info(noCancelMessage);
          speak(noCancelMessage);
        }
        break;
        
      default:
        console.log('Unknown command received, providing help message');
        const helpMessage = 'I can help you with commands like: Create field, Delete entry, Open entry, or Fill form. You can also say specific entry names like "Open Address Info".';
        toast.info('Voice command not recognized');
        speak(helpMessage);
    }
  };

  const handleVoiceResult = (text: string) => {
    toast.success(`Voice input received: "${text}"`);
    setShowAddEntry(true);
  };

  return {
    handleVoiceCommand,
    handleVoiceResult,
  };
};
