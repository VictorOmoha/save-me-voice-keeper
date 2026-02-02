/**
 * useVoiceProcessor Hook
 * Main hook for voice processing - replaces useUnifiedVoiceProcessor and useOptimizedVoiceProcessor
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';
import { SavedEntry } from '@/types/dashboard';
import { VoiceCommand, VoiceContext } from '../types';
import { voiceProcessor } from '../processors/VoiceProcessor';
import { useConversation } from './useConversation';
import { cleanVoiceInput } from '../core/TextCleaner';

interface UseVoiceProcessorProps {
  savedEntries: SavedEntry[];
  onCreateEntry: () => void;
  onEditEntry: (entry: SavedEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSaveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancelEdit: () => void;
  formTitleSetter?: (title: string) => void;
  formCategorySetter?: (category: string) => void;
  formAddFieldFunction?: (fieldName?: string, fieldType?: string) => void;
}

interface ConfirmDialogData {
  title: string;
  description: string;
  onConfirm: () => void;
}

export function useVoiceProcessor({
  savedEntries,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
  onSaveEntry,
  onCancelEdit,
  formTitleSetter,
  formCategorySetter,
  formAddFieldFunction,
}: UseVoiceProcessorProps) {
  // Pending delete entry ref
  const pendingDeleteEntry = useRef<SavedEntry | null>(null);

  // Visual confirmation fallback state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<ConfirmDialogData | null>(null);

  // Conversation management
  const {
    conversationState,
    startConversation,
    endConversation,
    processStep: processConversationStep,
    getState: getConversationState,
    isInConversation,
  } = useConversation({
    onCreateEntry,
    onSaveEntry,
    formTitleSetter,
    formCategorySetter,
    formAddFieldFunction,
  });

  /**
   * Process voice input
   */
  const processVoiceInput = useCallback(
    async (transcript: string) => {
      console.log('🎙️ useVoiceProcessor: Voice input received:', transcript);

      const cleanInput = cleanVoiceInput(transcript);
      console.log('🧹 useVoiceProcessor: Cleaned input:', cleanInput);

      // Handle pending delete confirmation first
      if (pendingDeleteEntry.current) {
        console.log('🔍 useVoiceProcessor: Handling delete confirmation for:', pendingDeleteEntry.current.title);
        const confirmationText = cleanInput.toLowerCase();

        if (
          confirmationText.includes('yes') ||
          confirmationText.includes('confirm') ||
          confirmationText.includes('delete')
        ) {
          console.log('✅ useVoiceProcessor: User confirmed deletion');
          const entryToDelete = pendingDeleteEntry.current;

          // Clear pending state first
          pendingDeleteEntry.current = null;
          voiceProcessor.clearConfirmationState();

          // Execute deletion
          try {
            onDeleteEntry(entryToDelete.id);
            const successMessage = `"${entryToDelete.title}" has been deleted.`;
            voiceProcessor.setLastTTSPrompt(successMessage);
            speak(successMessage);
            toast.success(`🗑️ Deleted: ${entryToDelete.title}`);
          } catch (error) {
            console.error('❌ useVoiceProcessor: Error deleting entry:', error);
            speak('Sorry, there was an error deleting the entry.');
            toast.error('❌ Error deleting entry');
          }
          return;
        } else if (confirmationText.includes('no') || confirmationText.includes('cancel')) {
          console.log('❌ useVoiceProcessor: User cancelled deletion');
          const entry = pendingDeleteEntry.current;
          pendingDeleteEntry.current = null;
          voiceProcessor.clearConfirmationState();
          const cancelMessage = `Deletion of "${entry.title}" cancelled.`;
          voiceProcessor.setLastTTSPrompt(cancelMessage);
          speak(cancelMessage);
          toast.info(`❌ Cancelled: Deletion of "${entry.title}"`);
          return;
        } else {
          // User said something else - treat as new command
          console.log('🔄 useVoiceProcessor: User gave new command during confirmation, clearing state');
          pendingDeleteEntry.current = null;
          voiceProcessor.clearConfirmationState();
          // Continue processing as new command
        }
      }

      // Check if we're in a conversation flow
      const currentConversationState = getConversationState();
      if (currentConversationState.isInConversation && currentConversationState.currentStep) {
        console.log('🔄 useVoiceProcessor: Processing conversation step:', currentConversationState.currentStep.type);
        await processConversationStep(cleanInput);
        return;
      }

      // Process as command using the voice processor
      try {
        const context: VoiceContext = {
          currentView: 'dashboard',
          availableEntries: savedEntries.map(entry => ({
            id: entry.id,
            title: entry.title,
            category: entry.fields?.category || 'Personal',
          })),
          previousCommands: [],
        };

        const command = await voiceProcessor.processVoiceCommand(transcript, context);
        console.log('🎯 useVoiceProcessor: Processed command:', command);

        if (command.intent === 'unknown' && command.parameters?.action === 'tts_feedback_blocked') {
          console.log('🚫 useVoiceProcessor: Ignoring TTS feedback');
          return;
        }

        // Execute the command
        await executeCommand(command);
      } catch (error) {
        console.error('useVoiceProcessor: Voice processing error:', error);
        speak('Sorry, I had trouble understanding that. Please try again.');
        toast.error('❌ Voice processing error');
      }
    },
    [savedEntries, getConversationState, processConversationStep, onDeleteEntry]
  );

  /**
   * Execute a voice command
   */
  const executeCommand = useCallback(
    async (command: VoiceCommand) => {
      console.log('🎯 useVoiceProcessor: Executing command:', command.type, command.intent);

      switch (command.type) {
        case 'create_entry':
          console.log('🆕 useVoiceProcessor: Starting create entry conversation');
          startConversation();
          break;

        case 'open_entry':
          handleOpenEntry(command);
          break;

        case 'delete_entry':
          handleDeleteEntry(command);
          break;

        case 'cancel':
          handleCancel(command);
          break;

        case 'search':
          if (command.conversationalResponse) {
            speak(command.conversationalResponse);
            toast.info(command.conversationalResponse);
          }
          // Dispatch search event
          window.dispatchEvent(
            new CustomEvent('voice-search', {
              detail: { query: command.parameters?.query },
            })
          );
          break;

        case 'navigate':
          handleNavigate(command);
          break;

        case 'save_entry':
          // Trigger form save
          window.dispatchEvent(new CustomEvent('voice-save-form'));
          speak('Saving entry...');
          break;

        case 'show_all':
          window.dispatchEvent(
            new CustomEvent('voice-navigate', {
              detail: { destination: 'all-entries' },
            })
          );
          speak('Showing all entries.');
          break;

        case 'confirm':
        case 'deny':
          // These should be handled by the pending delete flow above
          break;

        default:
          if (command.conversationalResponse && command.intent !== 'unknown') {
            speak(command.conversationalResponse);
            toast.info(command.conversationalResponse);
          }
      }
    },
    [savedEntries, startConversation, onEditEntry, onDeleteEntry, onCancelEdit]
  );

  /**
   * Handle open entry command
   */
  const handleOpenEntry = useCallback(
    (command: VoiceCommand) => {
      const { entryId, entryTitle, searchTerm } = command.parameters || {};

      if (entryId) {
        const entry = savedEntries?.find(e => e.id === entryId);
        if (entry) {
          onEditEntry(entry);
          const successMessage = `Opening "${entry.title}" for editing`;
          setTimeout(() => {
            voiceProcessor.setLastTTSPrompt(successMessage);
            speak(successMessage);
            toast.success(`📂 Opening: ${entry.title}`);
          }, 300);
          return;
        }
      }

      // Try to find by title
      const searchText = entryTitle || searchTerm;
      if (searchText) {
        const entry = savedEntries?.find(e =>
          e.title.toLowerCase().includes(searchText.toLowerCase())
        );
        if (entry) {
          onEditEntry(entry);
          const successMessage = `Opening "${entry.title}" for editing`;
          setTimeout(() => {
            voiceProcessor.setLastTTSPrompt(successMessage);
            speak(successMessage);
            toast.success(`📂 Opening: ${entry.title}`);
          }, 300);
          return;
        }
      }

      // Not found
      const errorMessage = `Entry "${searchText || 'unknown'}" not found`;
      setTimeout(() => {
        voiceProcessor.setLastTTSPrompt(errorMessage);
        speak(errorMessage);
        toast.error(`❌ ${errorMessage}`);
      }, 300);
    },
    [savedEntries, onEditEntry]
  );

  /**
   * Handle delete entry command
   */
  const handleDeleteEntry = useCallback(
    (command: VoiceCommand) => {
      const { entryId, entryTitle, searchTerm } = command.parameters || {};

      let entry: SavedEntry | undefined;

      if (entryId) {
        entry = savedEntries?.find(e => e.id === entryId);
      } else if (entryTitle || searchTerm) {
        const searchText = entryTitle || searchTerm;
        entry = savedEntries?.find(e =>
          e.title.toLowerCase().includes(searchText.toLowerCase())
        );
      }

      if (entry) {
        pendingDeleteEntry.current = entry;
        const confirmMessage =
          command.conversationalResponse ||
          `Are you sure you want to delete "${entry.title}"? Say yes to confirm or no to cancel.`;

        voiceProcessor.setLastTTSPrompt(confirmMessage);
        speak(confirmMessage);
        toast.info(`🗑️ Confirm deletion: "${entry.title}" - Say "yes" or "no"`);
      } else {
        const errorMessage = `Entry "${entryTitle || searchTerm || 'unknown'}" not found`;
        speak(errorMessage);
        toast.error(`❌ ${errorMessage}`);
      }
    },
    [savedEntries]
  );

  /**
   * Handle cancel command
   */
  const handleCancel = useCallback(
    (command: VoiceCommand) => {
      const { action } = command.parameters || {};

      if (isInConversation) {
        endConversation();
        onCancelEdit();
        speak('Conversation cancelled. What else can I help you with?');
        toast.info('❌ Voice conversation cancelled');
        return;
      }

      if (pendingDeleteEntry.current) {
        pendingDeleteEntry.current = null;
        voiceProcessor.clearConfirmationState();
        speak('Deletion cancelled.');
        toast.info('❌ Deletion cancelled');
        return;
      }

      // Close modal/form
      onCancelEdit();
      const closeMessage = command.conversationalResponse || 'Closing.';
      setTimeout(() => {
        voiceProcessor.setLastTTSPrompt(closeMessage);
        speak(closeMessage);
        toast.info('📄 Closed');
      }, 300);
    },
    [isInConversation, endConversation, onCancelEdit]
  );

  /**
   * Handle navigate command
   */
  const handleNavigate = useCallback((command: VoiceCommand) => {
    const { destination } = command.parameters || {};

    if (destination) {
      window.dispatchEvent(
        new CustomEvent('voice-navigate', {
          detail: { destination },
        })
      );

      setTimeout(() => {
        voiceProcessor.setLastTTSPrompt(`Opening ${destination}`);
        speak(`Opening ${destination}`);
        toast.success(`📊 Opening ${destination}`);
      }, 300);
    }
  }, []);

  /**
   * Cancel the current conversation
   */
  const cancelConversation = useCallback(() => {
    pendingDeleteEntry.current = null;
    voiceProcessor.clearConfirmationState();
    endConversation();
    speak('Conversation cancelled. What else can I help you with?');
    toast.info('❌ Voice conversation cancelled');
  }, [endConversation]);

  /**
   * Process hybrid selection (button clicks during voice conversation)
   */
  const processHybridSelection = useCallback(
    (value: string) => {
      console.log('🔘 useVoiceProcessor: Processing button selection:', value);
      processConversationStep(value);
    },
    [processConversationStep]
  );

  // Handle voice restart failures with visual fallback
  useEffect(() => {
    const handleVoiceRestartFailed = () => {
      if (pendingDeleteEntry.current) {
        const entry = pendingDeleteEntry.current;
        setConfirmDialogData({
          title: 'Confirm Deletion',
          description: `Are you sure you want to delete "${entry.title}"?`,
          onConfirm: () => {
            onDeleteEntry(entry.id);
            toast.success(`🗑️ Deleted: ${entry.title}`);
            pendingDeleteEntry.current = null;
            setShowConfirmDialog(false);
            setConfirmDialogData(null);
          },
        });
        setShowConfirmDialog(true);
      }
    };

    window.addEventListener('voice-restart-failed', handleVoiceRestartFailed);
    return () => window.removeEventListener('voice-restart-failed', handleVoiceRestartFailed);
  }, [onDeleteEntry]);

  return {
    processVoiceInput,
    conversationState,
    cancelConversation,
    processHybridSelection,
    isInConversation,
    startConversation,
    endConversation: cancelConversation, // Alias for backwards compatibility
    startCreateEntryConversation: startConversation, // Alias for backwards compatibility
    pendingDeleteEntry: pendingDeleteEntry.current,

    // Visual confirmation fallback
    showConfirmDialog,
    confirmDialogData,
    onCancelConfirm: () => {
      pendingDeleteEntry.current = null;
      setShowConfirmDialog(false);
      setConfirmDialogData(null);
      toast.info('Deletion cancelled');
    },
  };
}
