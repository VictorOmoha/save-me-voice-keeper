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
    editEntry: baseEditEntry,
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

  // Enhanced editEntry function that directly manages state with proper TTS feedback
  const editEntry = (entry: SavedEntry) => {
    console.log('🔧 Dashboard editEntry called with:', entry.title);
    
    // Directly manage state to avoid stale closure issues
    setFillingEntry(null);
    setEditingEntry(entry);
    setShowAddEntry(true);
    
    console.log('✅ Dashboard editEntry - state updated directly');
    
    // Provide immediate TTS feedback
    const openMessage = `Opening ${entry.title} for editing`;
    console.log('🔊 Speaking feedback:', openMessage);
    
    // Use setTimeout to ensure TTS happens after state updates
    setTimeout(() => {
      speak(openMessage);
      toast.success(openMessage);
    }, 200);
  };

  // Enhanced voice input processing with conversation support
  const handleEnhancedVoiceInput = async (text: string) => {
    console.log('🎤 Dashboard handleEnhancedVoiceInput called with:', text);
    
    if (!text || text.trim().length === 0) {
      console.log('❌ Empty voice input, ignoring');
      return;
    }
    
    try {
      console.log('🔄 Processing voice command with enhanced processor...');
      
      // Import the enhanced voice processor
      const { voiceProcessor } = await import('@/utils/enhancedVoiceProcessor');
      
      // Build context for the voice processor
      const context = {
        currentView: 'dashboard',
        availableEntries: savedEntries.map(entry => ({
          id: entry.id,
          title: entry.title,
          category: entry.fields.category || 'Personal'
        })),
        currentEntry: editingEntry ? { id: editingEntry.id, title: editingEntry.title } : undefined,
        previousCommands: [],
        isFormOpen: showAddEntry || !!editingEntry || !!fillingEntry,
        editingEntry,
        fillingEntry
      };
      
      // Process the command with context
      const enhancedCommand = await voiceProcessor.processVoiceCommand(text, context);
      console.log('🔄 Enhanced command result:', enhancedCommand);
      
      // Skip TTS feedback blocks
      if (enhancedCommand.action === 'tts_feedback_blocked') {
        console.log('🚫 Skipping TTS feedback block');
        return;
      }
      
      // Execute the enhanced command
      await executeEnhancedVoiceCommand(enhancedCommand);
      
      console.log('✅ Enhanced voice command processing completed successfully');
    } catch (error) {
      console.error('❌ Error in handleEnhancedVoiceInput:', error);
      const errorMessage = 'Sorry, I could not process that command';
      toast.error('Failed to process voice command');
      setTimeout(() => speak(errorMessage), 100);
    }
  };

  // Execute enhanced voice command with comprehensive handling
  const executeEnhancedVoiceCommand = async (command: any) => {
    console.log('🎯 Executing enhanced voice command:', command);
    
    try {
      switch (command.intent) {
        case 'create':
          if (command.action === 'create_entry' || command.action === 'create_entry_with_content') {
            console.log('📝 Creating new entry...');
            setShowAddEntry(true);
            setEditingEntry(null);
            setFillingEntry(null);
            
            toast.success(command.conversationalResponse);
            setTimeout(() => speak(command.conversationalResponse), 100);
          } else if (command.action === 'save_current_entry') {
            if (showAddEntry || editingEntry || fillingEntry) {
              const saveMessage = 'Please complete the form and click save to save the entry';
              toast.info(saveMessage);
              setTimeout(() => speak(saveMessage), 100);
            } else {
              toast.info(command.conversationalResponse);
              setTimeout(() => speak(command.conversationalResponse), 100);
            }
          }
          break;
          
        case 'edit':
          if (command.action === 'open_entry') {
            const searchTerm = command.parameters.entryTitle || command.parameters.searchTerm;
            
            if (searchTerm) {
              console.log('🔍 Searching for entry with term:', searchTerm);
              
              const entryToOpen = savedEntries.find(entry => {
                const entryTitle = entry.title.toLowerCase();
                const searchLower = searchTerm.toLowerCase();
                
                return entryTitle.includes(searchLower) ||
                       entryTitle.split(/\s+/).some(word => word.includes(searchLower)) ||
                       searchLower.split(/\s+/).some(word => entryTitle.includes(word));
              });
              
              if (entryToOpen) {
                console.log('📄 Found entry to open:', entryToOpen.title);
                editEntry(entryToOpen);
              } else {
                const errorMessage = `Entry "${searchTerm}" not found. Please check your entries.`;
                console.log('🔊 Speaking error message:', errorMessage);
                toast.error(errorMessage);
                setTimeout(() => speak(errorMessage), 100);
              }
            } else {
              const helpMessage = 'Please specify which entry you want to open';
              toast.info(helpMessage);
              setTimeout(() => speak(helpMessage), 100);
            }
          }
          break;
          
        case 'delete':
          if (command.action === 'delete_entry') {
            const searchTerm = command.parameters.entryTitle || command.parameters.searchTerm;
            
            if (searchTerm) {
              const matchingEntries = savedEntries.filter(entry => 
                entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                Object.values(entry.fields).some(value => 
                  typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
                )
              );
              
              if (matchingEntries.length === 1) {
                if (command.needsConfirmation && !command.parameters.confirmed) {
                  toast.info(command.conversationalResponse);
                  setTimeout(() => speak(command.conversationalResponse), 100);
                } else {
                  const entryToDelete = matchingEntries[0];
                  await deleteEntry(entryToDelete.id);
                  const deleteMessage = `Deleted entry: ${entryToDelete.title}`;
                  toast.success(deleteMessage);
                  setTimeout(() => speak(deleteMessage), 100);
                }
              } else if (matchingEntries.length > 1) {
                const matches = matchingEntries.slice(0, 3).map(entry => entry.title).join(', ');
                const multipleMessage = `Found ${matchingEntries.length} entries: ${matches}. Please be more specific.`;
                toast.info(multipleMessage);
                setTimeout(() => speak(multipleMessage), 100);
              } else {
                const notFoundMessage = `No entries found matching "${searchTerm}".`;
                toast.info(notFoundMessage);
                setTimeout(() => speak(notFoundMessage), 100);
              }
            }
          }
          break;
          
        case 'navigate':
          if (command.action === 'show_all_entries') {
            toast.success(command.conversationalResponse);
            setTimeout(() => speak(command.conversationalResponse), 100);
          } else if (command.action === 'cancel_operation') {
            console.log('❌ Cancel/Close command - resetting all forms');
            
            setShowAddEntry(false);
            setEditingEntry(null);
            setFillingEntry(null);
            handleCancelEdit();
            
            if ((window as any).__stopAllVoiceRecognition) {
              (window as any).__stopAllVoiceRecognition();
            }
            
            toast.success(command.conversationalResponse);
            setTimeout(() => speak(command.conversationalResponse), 100);
            
            window.dispatchEvent(new CustomEvent('voice-close-command', { 
              detail: { timestamp: Date.now(), source: 'dashboard' } 
            }));
          }
          break;
          
        case 'search':
          if (command.action === 'search_entries') {
            const query = command.parameters.query;
            if (query) {
              setSearchQuery(query);
              toast.success(command.conversationalResponse);
              setTimeout(() => speak(command.conversationalResponse), 100);
            } else {
              const helpMessage = 'Please specify what you want to search for';
              toast.info(helpMessage);
              setTimeout(() => speak(helpMessage), 100);
            }
          }
          break;
          
        case 'form_fill':
          if (command.action === 'add_form_content') {
            // This would be handled by the form components directly
            toast.success(command.conversationalResponse);
            setTimeout(() => speak(command.conversationalResponse), 100);
          }
          break;
          
        case 'conversation':
          toast.info(command.conversationalResponse);
          setTimeout(() => speak(command.conversationalResponse), 100);
          break;
          
        default:
          console.log('❓ Unknown enhanced command:', command.intent);
          const helpMessage = 'I can help you with commands like: Create new entry, Open entry, Delete entry, Search entries, or Close forms.';
          toast.info('Voice command not recognized');
          setTimeout(() => speak(helpMessage), 100);
      }
    } catch (error) {
      console.error('❌ Error executing enhanced voice command:', error);
      const errorMessage = 'Sorry, I could not process that command';
      toast.error('Failed to process voice command');
      setTimeout(() => speak(errorMessage), 100);
    }
  };

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
    // Enhanced Voice interface with conversation support
    handleEnhancedVoiceInput,
    isVoiceProcessing: false,
    lastVoiceCommand: null,
    conversationState: 'idle' as 'listening' | 'confirming' | 'idle',
    hasPendingConfirmation: false,
    cancelCurrentOperation: () => {
      console.log('Voice operation cancelled');
      executeEnhancedVoiceCommand({ 
        intent: 'navigate', 
        action: 'cancel_operation',
        conversationalResponse: 'Operation cancelled',
        parameters: {},
        needsConfirmation: false,
        confidence: 1.0,
        originalTranscript: 'cancel'
      });
    },
    conversationData: { isActive: false },
  };
};
