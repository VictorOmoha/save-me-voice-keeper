
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

  // Execute voice command with comprehensive logging and proper execution
  const executeVoiceCommand = async (command: VoiceCommand) => {
    console.log('🎯 Executing voice command:', command);
    
    try {
      // Handle multi-command sequences
      if (command.type === 'multi_command' && command.params?.commands) {
        console.log('🔄 Executing multi-command sequence...');
        
        for (let i = 0; i < command.params.commands.length; i++) {
          const sequencedCommand = command.params.commands[i];
          console.log(`⚡ Executing command ${i + 1}/${command.params.commands.length}:`, sequencedCommand.intent);
          
          // Add delay between commands for better UX
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, sequencedCommand.delay || 500));
          }
          
          // Execute individual command from the sequence
          const singleCommand: VoiceCommand = {
            type: 'sequenced_command',
            params: {
              intent: sequencedCommand.intent,
              originalText: command.params.originalText,
              entryTitle: sequencedCommand.intent.parameters.entryTitle || '',
              entryCategory: sequencedCommand.intent.parameters.entryCategory || 'Personal'
            }
          };
          
          await executeVoiceCommand(singleCommand);
        }
        
        const completionMessage = `Completed ${command.params.commands.length} commands successfully`;
        toast.success(completionMessage);
        setTimeout(() => speak(completionMessage), 100);
        return;
      }
      
      // Handle sequenced single commands (enhanced ParsedIntent execution)
      if (command.type === 'sequenced_command' && command.params?.intent) {
        const intent = command.params.intent;
        console.log('🎯 Executing sequenced command:', intent.type);
        
        switch (intent.type) {
          case 'create_entry':
            console.log('📝 Creating new entry...');
            setShowAddEntry(true);
            setEditingEntry(null);
            setFillingEntry(null);
            
            const createMessage = 'Creating a new entry';
            console.log('🔊 Speaking create message:', createMessage);
            toast.success(createMessage);
            setTimeout(() => speak(createMessage), 100);
            break;
            
          case 'open_entry':
            console.log('📂 Opening entry with enhanced search...');
            const searchTerm = intent.parameters.entryTitle;
            
            if (searchTerm === 'all_entries') {
              const allEntriesMessage = 'Showing all entries';
              console.log('🔊 Speaking all entries message:', allEntriesMessage);
              toast.success(allEntriesMessage);
              setTimeout(() => speak(allEntriesMessage), 100);
            } else if (searchTerm) {
              console.log('🔍 Searching for entry with term:', searchTerm);
              console.log('📋 Available entries:', savedEntries.map(e => ({ title: e.title, id: e.id })));
              
              // Enhanced search with fuzzy matching
              const entryToOpen = savedEntries.find(entry => {
                const entryTitle = entry.title.toLowerCase();
                const searchLower = searchTerm.toLowerCase();
                
                console.log(`🔍 Checking "${entryTitle}" against "${searchLower}"`);
                
                // Direct substring match
                if (entryTitle.includes(searchLower)) {
                  console.log(`✅ Direct match found: "${entry.title}" contains "${searchTerm}"`);
                  return true;
                }
                
                // Word-based matching
                const entryWords = entryTitle.split(/\s+/);
                const searchWords = searchLower.split(/\s+/);
                
                const matchingWords = searchWords.filter(searchWord =>
                  entryWords.some(entryWord => 
                    entryWord.includes(searchWord) || 
                    searchWord.includes(entryWord) ||
                    entryWord.startsWith(searchWord) ||
                    searchWord.startsWith(entryWord)
                  )
                );
                
                if (matchingWords.length > 0) {
                  console.log(`✅ Word match found: "${entry.title}" matches words:`, matchingWords);
                  return true;
                }
                
                return false;
              });
              
              if (entryToOpen) {
                console.log('📄 Found entry to open:', entryToOpen.title);
                editEntry(entryToOpen); // This now provides its own TTS feedback
              } else {
                console.log('❌ No matching entry found for:', searchTerm);
                console.log('📋 Available entry titles:', savedEntries.map(e => e.title));
                const errorMessage = `Entry "${searchTerm}" not found. Please check your entries.`;
                console.log('🔊 Speaking error message:', errorMessage);
                toast.error(errorMessage);
                setTimeout(() => speak(errorMessage), 100);
              }
            }
            break;
            
          case 'delete_entry':
            if (intent.parameters.entryTitle) {
              const searchTerm = intent.parameters.entryTitle;
              const matchingEntries = savedEntries.filter(entry => 
                entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                Object.values(entry.fields).some(value => 
                  typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
                )
              );
              
              if (matchingEntries.length === 1) {
                const entryToDelete = matchingEntries[0];
                console.log('🗑️ Deleting entry:', entryToDelete.title);
                await deleteEntry(entryToDelete.id);
                const deleteMessage = `Deleted entry: ${entryToDelete.title}`;
                console.log('🔊 Speaking delete message:', deleteMessage);
                toast.success(deleteMessage);
                setTimeout(() => speak(deleteMessage), 100);
              } else if (matchingEntries.length > 1) {
                const matches = matchingEntries.slice(0, 3).map(entry => entry.title).join(', ');
                const multipleMessage = `Found ${matchingEntries.length} entries: ${matches}. Please be more specific.`;
                console.log('🔊 Speaking multiple matches message:', multipleMessage);
                toast.info(multipleMessage);
                setTimeout(() => speak(multipleMessage), 100);
              } else {
                const notFoundMessage = `No entries found matching "${searchTerm}".`;
                console.log('🔊 Speaking not found message:', notFoundMessage);
                toast.info(notFoundMessage);
                setTimeout(() => speak(notFoundMessage), 100);
              }
            }
            break;
            
          case 'save_entry':
            if (showAddEntry || editingEntry || fillingEntry) {
              const saveMessage = 'Please complete the form and click save to save the entry';
              console.log('🔊 Speaking save message:', saveMessage);
              toast.info(saveMessage);
              setTimeout(() => speak(saveMessage), 100);
            } else {
              const noEntryMessage = 'No entry form is currently open';
              console.log('🔊 Speaking no entry message:', noEntryMessage);
              toast.info(noEntryMessage);
              setTimeout(() => speak(noEntryMessage), 100);
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
            console.log('🔊 Speaking close message:', closeMessage);
            toast.success(closeMessage);
            setTimeout(() => speak(closeMessage), 100);
            
            // Dispatch event for UI components
            window.dispatchEvent(new CustomEvent('voice-close-command', { 
              detail: { timestamp: Date.now(), source: 'dashboard' } 
            }));
            break;
            
          default:
            console.log('❓ Unknown sequenced command:', intent.type);
            const helpMessage = 'I can help you with commands like: Create new entry, Open entry, Delete entry, Close form, or Fill form.';
            console.log('🔊 Speaking help message:', helpMessage);
            toast.info('Voice command not recognized');
            setTimeout(() => speak(helpMessage), 100);
        }
        return;
      }
      
      // Fallback to legacy command handling with improved TTS
      switch (command.type) {
        case 'create_entry':
          console.log('📝 Creating new entry...');
          setShowAddEntry(true);
          setEditingEntry(null);
          setFillingEntry(null);
          
          const createMessage = 'Creating a new entry';
          console.log('🔊 Speaking create message:', createMessage);
          toast.success(createMessage);
          setTimeout(() => speak(createMessage), 100);
          break;
          
        case 'open_entry':
          if (command.params?.entryTitle === 'all_entries') {
            console.log('📂 Opening all entries view...');
            const allEntriesMessage = 'Showing all entries';
            console.log('🔊 Speaking all entries message:', allEntriesMessage);
            toast.success(allEntriesMessage);
            setTimeout(() => speak(allEntriesMessage), 100);
          } else if (command.params?.entryTitle) {
            const entryToOpen = savedEntries.find(entry => 
              entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
            );
            if (entryToOpen) {
              console.log('📄 Opening entry:', entryToOpen.title);
              editEntry(entryToOpen); // This now provides its own TTS feedback
            } else {
              const errorMessage = `Entry "${command.params.entryTitle}" not found. Please check your entries.`;
              console.log('🔊 Speaking error message:', errorMessage);
              toast.error(errorMessage);
              setTimeout(() => speak(errorMessage), 100);
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
              await deleteEntry(entryToDelete.id);
              const deleteMessage = `Deleted entry: ${entryToDelete.title}`;
              console.log('🔊 Speaking delete message:', deleteMessage);
              toast.success(deleteMessage);
              setTimeout(() => speak(deleteMessage), 100);
            } else if (matchingEntries.length > 1) {
              const matches = matchingEntries.slice(0, 3).map(entry => entry.title).join(', ');
              const multipleMessage = `Found ${matchingEntries.length} entries: ${matches}. Please be more specific.`;
              console.log('🔊 Speaking multiple matches message:', multipleMessage);
              toast.info(multipleMessage);
              setTimeout(() => speak(multipleMessage), 100);
            } else {
              const notFoundMessage = `No entries found matching "${searchTerm}".`;
              console.log('🔊 Speaking not found message:', notFoundMessage);
              toast.info(notFoundMessage);
              setTimeout(() => speak(notFoundMessage), 100);
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
              console.log('🔊 Speaking fill message:', fillMessage);
              toast.success(fillMessage);
              setTimeout(() => speak(fillMessage), 100);
            } else {
              const errorMessage = `Template "${command.params.entryTitle}" not found`;
              console.log('🔊 Speaking error message:', errorMessage);
              toast.error(errorMessage);
              setTimeout(() => speak(errorMessage), 100);
            }
          }
          break;
          
        case 'save_entry':
          if (showAddEntry || editingEntry || fillingEntry) {
            const saveMessage = 'Please complete the form and click save to save the entry';
            console.log('🔊 Speaking save message:', saveMessage);
            toast.info(saveMessage);
            setTimeout(() => speak(saveMessage), 100);
          } else {
            const noEntryMessage = 'No entry form is currently open';
            console.log('🔊 Speaking no entry message:', noEntryMessage);
            toast.info(noEntryMessage);
            setTimeout(() => speak(noEntryMessage), 100);
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
          console.log('🔊 Speaking close message:', closeMessage);
          toast.success(closeMessage);
          setTimeout(() => speak(closeMessage), 100);
          
          // Dispatch event for UI components
          window.dispatchEvent(new CustomEvent('voice-close-command', { 
            detail: { timestamp: Date.now(), source: 'dashboard' } 
          }));
          break;
          
        default:
          console.log('❓ Unknown command:', command.type);
          const helpMessage = 'I can help you with commands like: Create new entry, Open entry, Delete entry, Close form, or Fill form.';
          console.log('🔊 Speaking help message:', helpMessage);
          toast.info('Voice command not recognized');
          setTimeout(() => speak(helpMessage), 100);
      }
    } catch (error) {
      console.error('❌ Error executing voice command:', error);
      const errorMessage = 'Sorry, I could not process that command';
      toast.error('Failed to process voice command');
      setTimeout(() => speak(errorMessage), 100);
    }
  };

  // Enhanced voice input processing with better logging and error handling
  const handleEnhancedVoiceInput = async (text: string) => {
    console.log('🎤 Dashboard handleEnhancedVoiceInput called with:', text);
    
    if (!text || text.trim().length === 0) {
      console.log('❌ Empty voice input, ignoring');
      return;
    }
    
    try {
      console.log('🔄 Processing voice command...');
      
      // Process the command directly
      const command = processVoiceCommand(text);
      console.log('🔄 Processed command result:', command);
      
      // Execute the command immediately
      console.log('⚡ Executing command now...');
      await executeVoiceCommand(command);
      
      // Log successful processing
      console.log('✅ Voice command processing completed successfully');
    } catch (error) {
      console.error('❌ Error in handleEnhancedVoiceInput:', error);
      const errorMessage = 'Sorry, I could not process that command';
      toast.error('Failed to process voice command');
      setTimeout(() => speak(errorMessage), 100);
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
    editEntry, // Use the enhanced editEntry function that directly manages state with TTS
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
