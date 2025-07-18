
import { useDashboardState } from "./useDashboardState";
import { useDashboardActions } from "./useDashboardActions";
import { useVoiceFormContext } from "@/contexts/VoiceFormContext";
import { SavedEntry } from "@/types/dashboard";
import { processVoiceCommand, VoiceCommand } from "@/utils/voiceCommandProcessor";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";

export const useDashboard = () => {
  const {
    searchQuery,
    setSearchQuery,
    savedEntries,
    setSavedEntries,
    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,
    filteredEntries,
    isLoading,
    loadEntries,
  } = useDashboardState();

  const {
    saveEntry,
    deleteEntry,
    bulkDeleteEntries,
    editEntry,
    fillEntry,
    handleCancelEdit,
    handleAddEntry,
  } = useDashboardActions({
    savedEntries,
    setSavedEntries,
    editingEntry,
    setEditingEntry,
    setFillingEntry,
    setShowAddEntry,
    loadEntries,
  });

  // Direct voice command execution - bypassing the complex conversation system
  const executeVoiceCommand = (command: VoiceCommand) => {
    console.log('🎯 Executing voice command directly:', command);
    
    switch (command.type) {
      case 'create_entry':
        console.log('📝 Creating new entry...');
        setShowAddEntry(true);
        const createMessage = 'Creating a new entry';
        toast.success(createMessage);
        speak(createMessage);
        break;
        
      case 'open_entry':
        if (command.params?.entryTitle === 'all_entries') {
          console.log('📂 Opening all entries view...');
          const allEntriesMessage = 'Showing all entries';
          toast.success(allEntriesMessage);
          speak(allEntriesMessage);
        } else if (command.params?.entryTitle) {
          const entryToOpen = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToOpen) {
            console.log('📄 Opening entry:', entryToOpen.title);
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
        
      case 'delete_entry':
        if (command.params?.entryTitle) {
          const searchTerm = command.params.entryTitle;
          const matchingEntries = savedEntries.filter(entry => 
            entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            Object.values(entry.fields).some(value => 
              typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
            )
          );
          
          if (matchingEntries.length === 1) {
            const entryToDelete = matchingEntries[0];
            console.log('🗑️ Deleting entry:', entryToDelete.title);
            deleteEntry(entryToDelete.id);
            const deleteMessage = `Deleted entry: ${entryToDelete.title}`;
            toast.success(deleteMessage);
            speak(deleteMessage);
          } else if (matchingEntries.length > 1) {
            const matches = matchingEntries.slice(0, 3).map(entry => entry.title).join(', ');
            const multipleMessage = `Found ${matchingEntries.length} entries: ${matches}. Please be more specific.`;
            toast.info(multipleMessage);
            speak(multipleMessage);
          } else {
            const notFoundMessage = `No entries found matching "${searchTerm}".`;
            toast.info(notFoundMessage);
            speak(notFoundMessage);
          }
        }
        break;
        
      case 'fill_form':
        if (command.params?.entryTitle) {
          const entryToFill = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToFill) {
            console.log('📋 Filling form:', entryToFill.title);
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
        if (showAddEntry || editingEntry || fillingEntry) {
          const saveMessage = 'Please complete the form and click save to save the entry';
          toast.info(saveMessage);
          speak(saveMessage);
        } else {
          const noEntryMessage = 'No entry form is currently open';
          toast.info(noEntryMessage);
          speak(noEntryMessage);
        }
        break;
        
      case 'cancel':
        console.log('❌ Cancel/Close command - resetting all forms');
        
        // Reset all form states immediately
        setShowAddEntry(false);
        setEditingEntry(null);
        setFillingEntry(null);
        
        // Call the proper cancel handler
        handleCancelEdit();
        
        // Stop any ongoing voice recognition
        if ((window as any).__stopAllVoiceRecognition) {
          (window as any).__stopAllVoiceRecognition();
        }
        
        const closeMessage = 'All forms closed';
        toast.success(closeMessage);
        speak(closeMessage);
        
        // Dispatch event for UI components
        window.dispatchEvent(new CustomEvent('voice-close-command', { 
          detail: { timestamp: Date.now(), source: 'dashboard' } 
        }));
        break;
        
      default:
        console.log('❓ Unknown command:', command.type);
        const helpMessage = 'I can help you with commands like: Create new entry, Show all entries, Delete entry, Close form, or Fill form.';
        toast.info('Voice command not recognized');
        speak(helpMessage);
    }
  };

  // Enhanced voice input processing with better logging and error handling
  const handleEnhancedVoiceInput = async (text: string) => {
    console.log('🎤 Dashboard received voice input:', text);
    
    if (!text || text.trim().length === 0) {
      console.log('❌ Empty voice input, ignoring');
      return;
    }
    
    try {
      // Process the command directly
      const command = processVoiceCommand(text);
      console.log('🔄 Processed command:', command);
      
      // Execute the command immediately (now supports async for multi-commands)
      console.log('⚡ Executing command now...');
      await executeVoiceCommand(command);
      
      // Log successful processing
      console.log('✅ Voice command processing completed');
    } catch (error) {
      console.error('❌ Error processing voice command:', error);
      toast.error('Failed to process voice command');
      speak('Sorry, I could not process that command');
    }
  };

  // Enhanced saveEntry function that passes fillingEntry context
  const enhancedSaveEntry = (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    saveEntry(entry, fillingEntry);
  };

  const getFormMode = () => {
    if (editingEntry) return 'edit';
    if (fillingEntry) return 'fill';
    return 'create';
  };

  const getFormTitle = () => {
    if (editingEntry) return 'Edit Entry';
    if (fillingEntry) return `Fill Form: ${fillingEntry.title}`;
    return 'Add New Entry';
  };

  return {
    searchQuery,
    setSearchQuery,
    savedEntries,
    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,
    saveEntry: enhancedSaveEntry,
    deleteEntry,
    bulkDeleteEntries,
    editEntry,
    fillEntry,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    filteredEntries,
    handleAddEntry,
    isLoading,
    loadEntries,
    // Simplified Voice interface
    handleEnhancedVoiceInput,
    isVoiceProcessing: false,
    lastVoiceCommand: null,
    conversationState: 'idle' as 'listening' | 'confirming' | 'idle',
    hasPendingConfirmation: false,
    cancelCurrentOperation: () => {
      console.log('Voice operation cancelled');
      executeVoiceCommand({ type: 'cancel' });
    },
    conversationData: { isActive: false },
  };
};
