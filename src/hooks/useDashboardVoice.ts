
import { SavedEntry } from "@/pages/Dashboard";
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
}: UseDashboardVoiceProps) => {
  const handleVoiceCommand = (command: VoiceCommand) => {
    console.log('Executing voice command:', command);
    
    switch (command.type) {
      case 'create_field':
        // Open the add entry form
        setShowAddEntry(true);
        setEditingEntry(null);
        setFillingEntry(null);
        const createMessage = `Creating field "${command.params?.fieldName || 'New Field'}"`;
        toast.success(`Voice command: ${createMessage}`);
        speak(createMessage);
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
