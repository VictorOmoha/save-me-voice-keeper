import { useState, useCallback, useRef } from "react";
import { useSavedEntries } from "./useSavedEntries";
import { SavedEntry } from "@/types/dashboard";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";
import { voiceProcessor, EnhancedVoiceCommand } from "@/utils/enhancedVoiceProcessor";

export const useDashboard = () => {
  const {
    savedEntries,
    isLoading,
    saveEntry: baseSaveEntry,
    deleteEntry: baseDeleteEntry,
    searchQuery,
    setSearchQuery,
  } = useSavedEntries();

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [fillingEntry, setFillingEntry] = useState<SavedEntry | null>(null);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<EnhancedVoiceCommand | null>(null);
  const [conversationState, setConversationState] = useState<'listening' | 'confirming' | 'idle'>('idle');
  const [hasPendingConfirmation, setHasPendingConfirmation] = useState(false);
  const [conversationData, setConversationData] = useState({ isActive: false });

  const processingRef = useRef(false);

  // Enhanced voice input handler that supports brain dumps and structured data
  const handleEnhancedVoiceInput = useCallback(async (text: string) => {
    if (processingRef.current) {
      console.log('Already processing voice input, skipping...');
      return;
    }

    processingRef.current = true;
    setIsVoiceProcessing(true);
    setConversationState('listening');

    try {
      console.log('🎤 Dashboard: Processing enhanced voice input:', text);
      console.log('🎯 Dashboard Voice Handler: Called with text:', text);
      console.log('🎯 Dashboard Voice Handler: Current state - showAddEntry:', showAddEntry);

      // CRITICAL: Check if we're in conversation mode first
      // If the VoiceGuidedEntryWizard is active (showAddEntry is true), 
      // we should route voice input to the unified processor instead of command processing
      const isInWizardConversation = showAddEntry && text !== 'Create a new entry.' && text !== 'create a new entry';
      
      if (isInWizardConversation) {
        console.log('🧙 Dashboard: In wizard conversation mode - routing to unified processor');
        // Use the unified processor directly instead of dispatching event
        // We'll need access to the unified processor here
        console.log('🧙 Dashboard: Voice input should be processed as conversation step:', text);
        // For now, just return and let the parent handle this differently
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
      console.log('🎯 Dashboard: Processed command:', command);

      setLastVoiceCommand(command);

      // Handle confirmation prompts
      if (command.needsConfirmation) {
        console.log('🤔 Dashboard: Command needs confirmation, setting up confirmation state');
        setHasPendingConfirmation(true);
        setConversationState('confirming');
        setLastVoiceCommand(command);
        if (command.conversationalResponse) {
          speak(command.conversationalResponse);
        }
        return;
      }

      // Execute the command
      console.log('🚀 Dashboard: Executing voice command:', command);
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
      console.error('❌ Dashboard: Error processing voice input:', error);
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
      
      console.log('🧠 Dashboard: Creating structured entry from brain dump:', parsed);

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
      console.error('Error creating structured entry:', error);
      toast.error('Failed to process brain dump into structured entry');
      speak('Sorry, I had trouble organizing your brain dump. Could you try again?');
    }
  }, []);

  // Execute voice commands
  const executeVoiceCommand = useCallback(async (command: EnhancedVoiceCommand) => {
    console.log('🚀 Dashboard: Executing command:', command.action);
    console.log('🚀 Dashboard: Current state before command:', { showAddEntry, editingEntry, fillingEntry });

    switch (command.action) {
      case 'create_entry':
      case 'initiate_create':
        console.log('🟢 EXECUTING CREATE ENTRY COMMAND - Setting showAddEntry to TRUE');
        setShowAddEntry(true);
        setEditingEntry(null);
        setFillingEntry(null);
        console.log('🟢 CREATE ENTRY STATE CHANGES DISPATCHED');
        break;

      case 'create_entry_with_content':
        await handleCreateEntryWithContent(command.parameters);
        break;

      case 'open_entry':
        await handleOpenEntry(command.parameters);
        break;

      case 'delete_entry':
        console.log('🗑️ Dashboard: Delete entry command with params:', command.parameters);
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
        console.log('Unknown command action:', command.action);
    }
  }, [showAddEntry, editingEntry, fillingEntry]);

  // Handle creating entry with content
  const handleCreateEntryWithContent = useCallback(async (params: any) => {
    try {
      const newEntry = {
        title: params.title || `New Entry - ${new Date().toLocaleDateString()}`,
        fields: {
          category: params.category || 'Personal',
          description: params.description || '',
          ...params.additionalFields,
        },
        fieldDefinitions: [
          { id: 'category', name: 'category', type: 'text' as const },
          { id: 'description', name: 'Description', type: 'textarea' as const },
        ],
        category: params.category || 'Personal',
      };

      await saveEntry(newEntry);
      toast.success(`Created: "${newEntry.title}"`);
    } catch (error) {
      console.error('Error creating entry with content:', error);
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

  // Handle deleting entry
  const handleDeleteEntry = useCallback(async (params: any) => {
    console.log('🗑️ Dashboard: handleDeleteEntry called with params:', params);
    const { entryId, entryTitle, title, searchTerm, confirmed } = params;
    
    // Use entryId if available, otherwise fall back to title matching
    if (entryId) {
      console.log('🗑️ Dashboard: Using entryId for deletion:', entryId);
      if (confirmed) {
        console.log('🗑️ Dashboard: Deletion confirmed, proceeding with delete');
        await deleteEntry(entryId);
        const entryName = title || entryTitle || 'entry';
        // Clear confirmation state
        setHasPendingConfirmation(false);
        setConversationState('idle');
        voiceProcessor.clearPendingConfirmation();
        speak(`Successfully deleted ${entryName}.`);
      } else {
        console.log('🗑️ Dashboard: Deletion cancelled by user');
        setHasPendingConfirmation(false);
        setConversationState('idle');
        voiceProcessor.clearPendingConfirmation();
        toast.info(`Deletion cancelled.`);
        speak('Deletion cancelled.');
      }
      return;
    }
    
    // Fallback to title matching
    const searchText = entryTitle || title || searchTerm;

    if (!searchText) {
      toast.info('Please specify which entry to delete');
      return;
    }

    const matchingEntries = savedEntries.filter(entry =>
      entry.title.toLowerCase().includes(searchText.toLowerCase())
    );

    if (matchingEntries.length === 1) {
      if (confirmed) {
        await deleteEntry(matchingEntries[0].id);
        toast.success(`Deleted: "${matchingEntries[0].title}"`);
        setHasPendingConfirmation(false);
        speak(`Successfully deleted ${matchingEntries[0].title}.`);
      } else {
        // This shouldn't happen as confirmation is handled at command level
        toast.info(`Are you sure you want to delete "${matchingEntries[0].title}"?`);
      }
    } else if (matchingEntries.length > 1) {
      const matches = matchingEntries.slice(0, 3).map(entry => entry.title).join(', ');
      toast.info(`Found ${matchingEntries.length} matches: ${matches}. Please be more specific.`);
    } else {
      toast.info(`No entries found matching "${searchText}"`);
    }
  }, [savedEntries]);

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
      await baseSaveEntry(entry);
      setShowAddEntry(false);
      setEditingEntry(null);
      setFillingEntry(null);
      toast.success('Entry saved successfully!');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    }
  }, [baseSaveEntry]);

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
  };
};
