/**
 * useDashboardVoiceHandler Hook
 * Handles voice input processing for the dashboard
 */

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';
import { SavedEntry } from '@/types/dashboard';
import { voiceProcessor, EnhancedVoiceCommand } from '@/voice';
import { logDashboard, logVoice, logError } from '@/utils/logger';
import { useDashboardVoiceState } from './useDashboardVoiceState';

interface UseDashboardVoiceHandlerProps {
  savedEntries: SavedEntry[];
  showAddEntry: boolean;
  editingEntry: SavedEntry | null;
  fillingEntry: SavedEntry | null;
  setShowAddEntry: (show: boolean) => void;
  setEditingEntry: (entry: SavedEntry | null) => void;
  setFillingEntry: (entry: SavedEntry | null) => void;
  setSearchQuery: (query: string) => void;
  deleteEntry: (id: string) => Promise<void>;
  saveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>, fillingEntry?: SavedEntry | null) => Promise<void>;
}

export function useDashboardVoiceHandler({
  savedEntries,
  showAddEntry,
  editingEntry,
  fillingEntry,
  setShowAddEntry,
  setEditingEntry,
  setFillingEntry,
  setSearchQuery,
  deleteEntry,
  saveEntry,
}: UseDashboardVoiceHandlerProps) {
  const {
    isVoiceProcessing,
    lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    conversationData,
    setLastVoiceCommand,
    startVoiceProcessing,
    endVoiceProcessing,
    setConfirmationState,
    clearConfirmationState,
    setFollowUpState,
    isProcessing,
  } = useDashboardVoiceState();

  /**
   * Handle enhanced voice input
   */
  const handleEnhancedVoiceInput = useCallback(
    async (text: string) => {
      if (!startVoiceProcessing()) {
        logVoice('Already processing voice input, skipping...');
        return;
      }

      try {
        logVoice('Processing enhanced voice input', text);
        logDashboard('Voice handler state', { showAddEntry });

        // Check if in wizard conversation mode
        const isInWizardConversation =
          showAddEntry && text !== 'Create a new entry.' && text !== 'create a new entry';

        if (isInWizardConversation) {
          logDashboard('In wizard conversation mode - routing to unified processor');
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
            category: entry.fields?.category || 'Personal',
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
          setConfirmationState(command);
          if (command.conversationalResponse) {
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
        setFollowUpState(command.expectsFollowUp || command.followUpExpected || false);
      } catch (error) {
        logError('Error processing voice input', error);
        toast.error('Sorry, I had trouble understanding that command.');
        speak('Sorry, I had trouble understanding that. Could you try again?');
        clearConfirmationState();
      } finally {
        endVoiceProcessing();
      }
    },
    [
      savedEntries,
      showAddEntry,
      editingEntry,
      fillingEntry,
      hasPendingConfirmation,
      conversationState,
      startVoiceProcessing,
      endVoiceProcessing,
      setConfirmationState,
      clearConfirmationState,
      setFollowUpState,
    ]
  );

  /**
   * Handle structured entry creation from brain dumps
   */
  const handleStructuredEntryCreation = useCallback(
    async (structuredData: string) => {
      try {
        const jsonData = structuredData.replace('CREATE_STRUCTURED_ENTRY:', '').trim();
        const parsed = JSON.parse(jsonData);

        logDashboard('Creating structured entry from brain dump', parsed);

        const fieldDefinitions = [
          { id: 'category', name: 'category', type: 'text' as const },
          { id: 'originalText', name: 'Original Text', type: 'textarea' as const },
        ];

        if (parsed.content.actionItems?.length > 0) {
          fieldDefinitions.push({
            id: 'actionItems',
            name: 'Action Items',
            type: 'textarea' as const,
          });
        }

        if (parsed.content.keyPoints?.length > 0) {
          fieldDefinitions.push({
            id: 'keyPoints',
            name: 'Key Points',
            type: 'textarea' as const,
          });
        }

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
        speak(
          `Perfect! I've organized your brain dump into a structured entry called "${parsed.title}". What would you like to do next?`
        );
      } catch (error) {
        logError('Error creating structured entry', error);
        toast.error('Failed to process brain dump into structured entry');
        speak('Sorry, I had trouble organizing your brain dump. Could you try again?');
      }
    },
    [saveEntry]
  );

  /**
   * Execute voice commands
   */
  const executeVoiceCommand = useCallback(
    async (command: EnhancedVoiceCommand) => {
      logDashboard('Executing command', {
        action: command.action,
        showAddEntry,
        editingEntry,
        fillingEntry,
      });

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
          toast.success('Showing all entries');
          break;

        case 'search_entries':
          if (command.parameters.query) {
            setSearchQuery(command.parameters.query);
            toast.success(`Searching for: "${command.parameters.query}"`);
          }
          break;

        case 'save_current_entry':
          if (showAddEntry || editingEntry || fillingEntry) {
            toast.info('Please complete the form and click save to save the entry');
          }
          break;

        default:
          logDashboard('Unknown command action', command.action);
      }
    },
    [showAddEntry, editingEntry, fillingEntry, setShowAddEntry, setEditingEntry, setFillingEntry, setSearchQuery]
  );

  /**
   * Handle creating entry with content
   */
  const handleCreateEntryWithContent = useCallback(
    async (params: any) => {
      try {
        const newEntry = {
          title: params.title || `New Entry - ${new Date().toLocaleDateString()}`,
          fields: {
            category: params.category || 'Personal',
            ...(params.description && params.description.trim()
              ? { description: params.description }
              : {}),
            ...params.additionalFields,
          },
          fieldDefinitions: [
            { id: 'category', name: 'category', type: 'text' as const },
            ...(params.description && params.description.trim()
              ? [{ id: 'description', name: 'Description', type: 'textarea' as const }]
              : []),
          ],
          category: params.category || 'Personal',
        };

        await saveEntry(newEntry);
        toast.success(`Created: "${newEntry.title}"`);
      } catch (error) {
        logError('Error creating entry with content', error);
        toast.error('Failed to create entry');
      }
    },
    [saveEntry]
  );

  /**
   * Handle opening entry
   */
  const handleOpenEntry = useCallback(
    async (params: any) => {
      const { entryTitle, searchTerm } = params;

      if (entryTitle === 'all_entries' || entryTitle === 'all') {
        toast.success('Opening all entries view');
        return;
      }

      const searchText = entryTitle || searchTerm;
      if (!searchText) {
        toast.info('Please specify which entry to open');
        return;
      }

      const matchingEntries = savedEntries.filter(
        entry =>
          entry.title.toLowerCase().includes(searchText.toLowerCase()) ||
          Object.values(entry.fields).some(
            value =>
              typeof value === 'string' && value.toLowerCase().includes(searchText.toLowerCase())
          )
      );

      if (matchingEntries.length === 1) {
        setEditingEntry(matchingEntries[0]);
        setShowAddEntry(false);
        setFillingEntry(null);
        toast.success(`Opened: "${matchingEntries[0].title}"`);
      } else if (matchingEntries.length > 1) {
        const matches = matchingEntries
          .slice(0, 3)
          .map(entry => entry.title)
          .join(', ');
        toast.info(`Found ${matchingEntries.length} matches: ${matches}. Please be more specific.`);
      } else {
        toast.info(`No entries found matching "${searchText}"`);
      }
    },
    [savedEntries, setEditingEntry, setShowAddEntry, setFillingEntry]
  );

  /**
   * Handle deleting entry
   */
  const handleDeleteEntry = useCallback(
    async (params: any) => {
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

        clearConfirmationState();
        return;
      }

      // Handle cancelled deletion
      if (confirmed === false) {
        logDashboard('Deletion cancelled');
        clearConfirmationState();
        toast.info('Deletion cancelled.');
        speak('Deletion cancelled.');
        return;
      }

      // Process initial delete request
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
          const matches = matchingEntries
            .slice(0, 3)
            .map(entry => entry.title)
            .join(', ');
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

        const confirmationCommand: EnhancedVoiceCommand = {
          intent: 'delete',
          action: 'delete_entry',
          parameters: { entryId: targetEntryId, title: targetEntryTitle },
          confidence: 0.8,
          needsConfirmation: true,
          conversationalResponse: `Are you sure you want to delete "${targetEntryTitle}"? Please say yes to confirm or no to cancel.`,
        };

        setConfirmationState(confirmationCommand);
        speak(confirmationCommand.conversationalResponse!);
      }
    },
    [savedEntries, deleteEntry, hasPendingConfirmation, conversationState, clearConfirmationState, setConfirmationState]
  );

  /**
   * Handle cancel operation
   */
  const handleCancelOperation = useCallback(() => {
    setShowAddEntry(false);
    setEditingEntry(null);
    setFillingEntry(null);
    clearConfirmationState();
    voiceProcessor.clearPendingConfirmation();
    toast.success('All operations cancelled');
  }, [setShowAddEntry, setEditingEntry, setFillingEntry, clearConfirmationState]);

  /**
   * Cancel current operation (for UI)
   */
  const cancelCurrentOperation = useCallback(() => {
    handleCancelOperation();
    speak('Cancelled. What would you like to do next?');
  }, [handleCancelOperation]);

  return {
    // State
    isVoiceProcessing,
    lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    conversationData,

    // Actions
    handleEnhancedVoiceInput,
    cancelCurrentOperation,
  };
}
