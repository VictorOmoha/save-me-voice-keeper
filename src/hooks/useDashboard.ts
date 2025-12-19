import { useState, useCallback, useRef, useEffect } from "react";
import { useSavedEntries } from "./useSavedEntries";
import { SavedEntry } from "@/types/dashboard";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";
import { voiceProcessor, EnhancedVoiceCommand } from "@/utils/enhancedVoiceProcessor";
import { logDashboard, logVoice, logError } from "@/utils/logger";

export const useDashboard = () => {
  const {
    savedEntries,
    isLoading,
    isSaving,
    saveEntry: baseSaveEntry,
    deleteEntry: baseDeleteEntry,
    searchQuery,
    setSearchQuery,
    refreshEntries,
  } = useSavedEntries();

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [fillingEntry, setFillingEntry] = useState<SavedEntry | null>(null);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<EnhancedVoiceCommand | null>(null);
  const [conversationState, setConversationState] = useState<'listening' | 'confirming' | 'idle'>('idle');
  const [hasPendingConfirmation, setHasPendingConfirmation] = useState(false);
  const [conversationData, setConversationData] = useState<{ isActive: boolean; currentStep?: { question: string } }>({ isActive: false });
  
  // Clear any stuck state on mount
  useEffect(() => {
    logDashboard('Clearing any stuck voice processor state on mount');
    voiceProcessor.clearConfirmationState();
    setHasPendingConfirmation(false);
    setConversationState('idle');
  }, []);

  const processingRef = useRef(false);

  // Enhanced voice input handler that supports brain dumps and structured data
  const handleEnhancedVoiceInput = useCallback(async (text: string) => {
    if (processingRef.current) {
      logVoice('Already processing voice input, skipping...');
      return;
    }

    processingRef.current = true;
    setIsVoiceProcessing(true);
    setConversationState('listening');

    try {
      logVoice('Processing enhanced voice input', text);
      logDashboard('Voice handler state', { showAddEntry });

      // CRITICAL: Check if we're in conversation mode first
      // If the VoiceGuidedEntryWizard is active (showAddEntry is true), 
      // we should route voice input to the unified processor instead of command processing
      const isInWizardConversation = showAddEntry && text !== 'Create a new entry.' && text !== 'create a new entry';
      
      if (isInWizardConversation) {
        logDashboard('In wizard conversation mode - routing to unified processor');
        logVoice('Voice input should be processed as conversation step', text);
        return;
      }

      // Handle structured entry creation from brain dumps
      if (text.startsWith('CREATE_STRUCTURED_ENTRY:')) {
        await handleStructuredEntryCreation(text);
        return;
      }

      // Process voice command with context
      const context = {
        currentView: 'dashboard',
        availableEntries: savedEntries.map(entry => ({
          id: entry.id,
          title: entry.title,
          category: entry.category || 'Personal'
        })),
        previousCommands: [],
        isFormOpen: showAddEntry || !!editingEntry || !!fillingEntry,
        editingEntry,
        fillingEntry,
        hasPendingConfirmation,
        conversationState,
      };

      const command = await voiceProcessor.processVoiceCommand(text, context);
      logDashboard('Processed command', command);

      setLastVoiceCommand(command);

      // Handle confirmation prompts
      if (command.needsConfirmation && !command.parameters.confirmed) {
        logDashboard('Command needs confirmation, setting up confirmation state');
        setHasPendingConfirmation(true);
        setConversationState('confirming');
        setLastVoiceCommand(command);
        // Track the TTS prompt for better filtering
        if (command.conversationalResponse) {
          voiceProcessor.setLastTTSPrompt(command.conversationalResponse);
          speak(command.conversationalResponse);
        }
        return;
      }

      // Execute the command
      logDashboard('Executing voice command', command);
      await executeVoiceCommand(command);

      // Provide conversational response
      if (command.conversationalResponse) {
        speak(command.conversationalResponse);
      }

      // Handle follow-up expectations
      if (command.expectsFollowUp || command.followUpExpected) {
        setConversationData({ isActive: true });
        setTimeout(() => {
          setConversationState('listening');
        }, 2000);
      } else {
        setConversationState('idle');
        setConversationData({ isActive: false });
      }

    } catch (error) {
      logError('Error processing voice input', error);
      toast.error('Sorry, I had trouble understanding that command.');
      speak('Sorry, I had trouble understanding that. Could you try again?');
      setConversationState('idle');
    } finally {
      setIsVoiceProcessing(false);
      processingRef.current = false;
    }
  }, [savedEntries, showAddEntry, editingEntry, fillingEntry, hasPendingConfirmation, conversationState]);

  // Handle structured entry creation from brain dumps
  const handleStructuredEntryCreation = useCallback(async (structuredData: string) => {
    try {
      const jsonData = structuredData.replace('CREATE_STRUCTURED_ENTRY:', '').trim();
      const parsed = JSON.parse(jsonData);

      logDashboard('Creating structured entry from brain dump', parsed);

      // Create field definitions based on the structured content
      const fieldDefinitions = [
        { id: 'category', name: 'category', type: 'text' as const },
        { id: 'originalText', name: 'Original Text', type: 'textarea' as const },
      ];

      // Add fields for action items if they exist
      if (parsed.content.actionItems?.length > 0) {
        fieldDefinitions.push({
          id: 'actionItems',
          name: 'Action Items',
          type: 'textarea' as const,
        });
      }

      // Add fields for key points if they exist
      if (parsed.content.keyPoints?.length > 0) {
        fieldDefinitions.push({
          id: 'keyPoints',
          name: 'Key Points',
          type: 'textarea' as const,
        });
      }

      // Create the new entry
      const newEntry = {
        title: parsed.title,
        fields: {
          category: parsed.category,
          originalText: parsed.content.originalText,
          actionItems: parsed.content.actionItems?.join('\n• ') || '',
          keyPoints: parsed.content.keyPoints?.join('\n• ') || '',
          notes: parsed.content.notes?.join('\n\n') || '',
          ...parsed.content.structuredFields,
        },
        fieldDefinitions,
        category: parsed.category,
      };

      await saveEntry(newEntry);
      
      toast.success(`🧠 Brain dump organized into: "${parsed.title}"`);
      speak(`Perfect! I've organized your brain dump into a structured entry called "${parsed.title}". What would you like to do next?`);
      
    } catch (error) {
      logError('Error creating structured entry', error);
      toast.error('Failed to process brain dump into structured entry');
      speak('Sorry, I had trouble organizing your brain dump. Could you try again?');
    }
  }, []);

  // Execute voice commands
  const executeVoiceCommand = useCallback(async (command: EnhancedVoiceCommand) => {
    logDashboard('Executing command', { action: command.action, showAddEntry, editingEntry, fillingEntry });

    switch (command.action) {
      case 'create_entry':
      case 'initiate_create':
        logDashboard('Setting showAddEntry to TRUE');
        setShowAddEntry(true);
        setEditingEntry(null);
        setFillingEntry(null);
        break;

      case 'create_entry_with_content':
        await handleCreateEntryWithContent(command.parameters);
        break;

      case 'open_entry':
        await handleOpenEntry(command.parameters);
        break;

      case 'delete_entry':
        logDashboard('Delete entry command', command.parameters);
        await handleDeleteEntry(command.parameters);
        break;

      case 'cancel_operation':
        handleCancelOperation();
        break;

      case 'show_all_entries':
        // This would typically navigate to all entries view
        toast.success('Showing all entries');
        break;

      case 'search_entries':
        if (command.parameters.query) {
          setSearchQuery(command.parameters.query);
          toast.success(`Searching for: "${command.parameters.query}"`);
        }
        break;

      case 'save_current_entry':
        // Handle saving current form if one is open
        if (showAddEntry || editingEntry || fillingEntry) {
          toast.info('Please complete the form and click save to save the entry');
        }
        break;

      default:
        logDashboard('Unknown command action', command.action);
    }
  }, [showAddEntry, editingEntry, fillingEntry]);

  // Handle creating entry with content
  const handleCreateEntryWithContent = useCallback(async (params: any) => {
    try {
      const newEntry = {
        title: params.title || `New Entry - ${new Date().toLocaleDateString()}`,
        fields: {
          category: params.category || 'Personal',
          ...(params.description && params.description.trim() ? { description: params.description } : {}),
          ...params.additionalFields,
        },
        fieldDefinitions: [
          { id: 'category', name: 'category', type: 'text' as const },
          ...(params.description && params.description.trim() ? [{ id: 'description', name: 'Description', type: 'textarea' as const }] : []),
        ],
        category: params.category || 'Personal',
      };

      await saveEntry(newEntry);
      toast.success(`Created: "${newEntry.title}"`);
    } catch (error) {
      logError('Error creating entry with content', error);
      toast.error('Failed to create entry');
    }
  }, []);

  // Handle opening entry
  const handleOpenEntry = useCallback(async (params: any) => {
    const { entryTitle, searchTerm } = params;
    
    if (entryTitle === 'all_entries' || entryTitle === 'all') {
      // Navigate to all entries view
      toast.success('Opening all entries view');
      return;
    }

    const searchText = entryTitle || searchTerm;
    if (!searchText) {
      toast.info('Please specify which entry to open');
      return;
    }

    const matchingEntries = savedEntries.filter(entry =>
      entry.title.toLowerCase().includes(searchText.toLowerCase()) ||
      Object.values(entry.fields).some(value =>
        typeof value === 'string' && value.toLowerCase().includes(searchText.toLowerCase())
      )
    );

    if (matchingEntries.length === 1) {
      setEditingEntry(matchingEntries[0]);
      setShowAddEntry(false);
      setFillingEntry(null);
      toast.success(`Opened: "${matchingEntries[0].title}"`);
    } else if (matchingEntries.length > 1) {
      const matches = matchingEntries.slice(0, 3).map(entry => entry.title).join(', ');
      toast.info(`Found ${matchingEntries.length} matches: ${matches}. Please be more specific.`);
    } else {
      toast.info(`No entries found matching "${searchText}"`);
    }
  }, [savedEntries]);

  // Handle deleting entry with improved state management
  const handleDeleteEntry = useCallback(async (params: any) => {
    logDashboard('handleDeleteEntry called', { params, hasPendingConfirmation, conversationState });
    
    const { entryId, entryTitle, title, searchTerm, confirmed } = params;
    
    // Handle confirmed deletion
    if (confirmed === true) {
      logDashboard('Deletion confirmed, executing delete');
      
      try {
        if (entryId) {
          await deleteEntry(entryId);
          const entryName = title || entryTitle || 'entry';
          toast.success(`Deleted: "${entryName}"`);
          speak(`Successfully deleted ${entryName}.`);
        } else {
          const searchText = entryTitle || title || searchTerm;
          const matchingEntries = savedEntries.filter(entry =>
            entry.title.toLowerCase().includes(searchText.toLowerCase())
          );
          
          if (matchingEntries.length === 1) {
            await deleteEntry(matchingEntries[0].id);
            toast.success(`Deleted: "${matchingEntries[0].title}"`);
            speak(`Successfully deleted ${matchingEntries[0].title}.`);
          } else {
            toast.error('Could not find a unique entry to delete');
            speak('Could not find a unique entry to delete.');
          }
        }
      } catch (error) {
        logError('Delete operation failed', error);
        toast.error('Failed to delete the entry');
        speak('Sorry, the deletion failed. Please try again.');
      }
      
      // Clear all states
      setHasPendingConfirmation(false);
      setConversationState('idle');
      setConversationData({ isActive: false });
      return;
    }
    
    // Handle cancelled deletion
    if (confirmed === false) {
      logDashboard('Deletion cancelled');
      setHasPendingConfirmation(false);
      setConversationState('idle');
      setConversationData({ isActive: false });
      toast.info('Deletion cancelled.');
      speak('Deletion cancelled.');
      return;
    }
    
    // Process initial delete request - find and confirm target
    logDashboard('Processing initial delete request');
    
    let targetEntryId = entryId;
    let targetEntryTitle = title || entryTitle;
    
    if (!targetEntryId) {
      const searchText = entryTitle || title || searchTerm;
      if (!searchText) {
        toast.info('Please specify which entry to delete');
        speak('Please specify which entry you want to delete.');
        return;
      }
      
      const matchingEntries = savedEntries.filter(entry =>
        entry.title.toLowerCase().includes(searchText.toLowerCase())
      );
      
      if (matchingEntries.length === 1) {
        targetEntryId = matchingEntries[0].id;
        targetEntryTitle = matchingEntries[0].title;
      } else if (matchingEntries.length > 1) {
        const matches = matchingEntries.slice(0, 3).map(entry => entry.title).join(', ');
        toast.info(`Found ${matchingEntries.length} matches: ${matches}. Please be more specific.`);
        speak(`I found ${matchingEntries.length} matching entries. Please be more specific.`);
        return;
      } else {
        toast.info(`No entries found matching "${searchText}"`);
        speak(`I couldn't find any entries matching ${searchText}.`);
        return;
      }
    }
    
    if (targetEntryId && targetEntryTitle) {
      logDashboard('Setting up deletion confirmation for', targetEntryTitle);
      
      // CRITICAL: Set conversation as active for TTS restart mechanism
      setHasPendingConfirmation(true);
      setConversationState('confirming');
      setConversationData({ 
        isActive: true,
        currentStep: { question: `Are you sure you want to delete "${targetEntryTitle}"?` }
      });
      
      // Store command for confirmation processing
      const confirmationCommand = {
        intent: 'delete' as const,
        action: 'delete_entry',
        parameters: { entryId: targetEntryId, title: targetEntryTitle },
        confidence: 0.8,
        needsConfirmation: true,
        conversationalResponse: `Are you sure you want to delete "${targetEntryTitle}"? Please say yes to confirm or no to cancel.`
      };
      
      setLastVoiceCommand(confirmationCommand);

      // Speak confirmation and track TTS for filtering
      logDashboard('Speaking confirmation prompt');
      voiceProcessor.setLastTTSPrompt(confirmationCommand.conversationalResponse);
      speak(confirmationCommand.conversationalResponse);
    }
  }, [savedEntries, hasPendingConfirmation, conversationState]);

  // Handle cancel operation
  const handleCancelOperation = useCallback(() => {
    setShowAddEntry(false);
    setEditingEntry(null);
    setFillingEntry(null);
    setHasPendingConfirmation(false);
    setConversationState('idle');
    
    // Clear any pending voice confirmations
    voiceProcessor.clearPendingConfirmation();
    
    toast.success('All operations cancelled');
  }, []);

  // Cancel current operation (for UI)
  const cancelCurrentOperation = useCallback(() => {
    handleCancelOperation();
    speak('Cancelled. What would you like to do next?');
  }, [handleCancelOperation]);

  const saveEntry = useCallback(async (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await baseSaveEntry(entry, editingEntry);
      setShowAddEntry(false);
      setEditingEntry(null);
      setFillingEntry(null);
      toast.success(editingEntry ? 'Entry updated successfully!' : 'Entry saved successfully!');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    }
  }, [baseSaveEntry, editingEntry]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Dashboard: deleteEntry called for ID:', id);
      await baseDeleteEntry(id);
      // Don't show duplicate toast here since it's shown in handleDeleteEntry
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  }, [baseDeleteEntry]);

  const editEntry = useCallback((entry: SavedEntry) => {
    setEditingEntry(entry);
    setShowAddEntry(false);
    setFillingEntry(null);
  }, []);

  const fillEntry = useCallback((entry: SavedEntry) => {
    setFillingEntry(entry);
    setShowAddEntry(false);
    setEditingEntry(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingEntry(null);
    setFillingEntry(null);
    setShowAddEntry(false);
  }, []);

  const getFormMode = useCallback((): 'create' | 'edit' | 'fill' => {
    if (fillingEntry) return 'fill';
    if (editingEntry) return 'edit';
    return 'create';
  }, [editingEntry, fillingEntry]);

  const getFormTitle = useCallback((): string => {
    if (fillingEntry) return `Fill: ${fillingEntry.title}`;
    if (editingEntry) return `Edit: ${editingEntry.title}`;
    return 'Create New Entry';
  }, [editingEntry, fillingEntry]);

  const handleAddEntry = useCallback(() => {
    setShowAddEntry(true);
    setEditingEntry(null);
    setFillingEntry(null);
  }, []);

  return {
    savedEntries,
    isLoading,
    isSaving,
    searchQuery,
    setSearchQuery,
    
    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,
    
    isVoiceProcessing,
    lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    conversationData,
    
    saveEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    handleAddEntry,
    handleEnhancedVoiceInput,
    cancelCurrentOperation,
    refreshEntries,
  };
};
