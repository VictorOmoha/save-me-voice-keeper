import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { SavedEntry } from '@/types/dashboard';
import { useVoiceConversationManager } from './useVoiceConversationManager';
import { speak } from '@/utils/textToSpeech';
import { logVoice, logDebug } from '@/utils/logger';

interface OptimizedVoiceProcessorProps {
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

export const useOptimizedVoiceProcessor = (props: OptimizedVoiceProcessorProps) => {
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<SavedEntry | null>(null);
  const pendingDeleteEntryRef = useRef<SavedEntry | null>(null);
  const lastProcessedTranscript = useRef<string>('');
  const processingLock = useRef<boolean>(false);

  // Keep ref in sync with state
  pendingDeleteEntryRef.current = pendingDeleteEntry;

  const {
    conversationState,
    startCreateEntryConversation,
    endConversation,
    processConversationStep,
    getConversationState,
  } = useVoiceConversationManager({
    onCreateEntry: props.onCreateEntry,
    onSaveEntry: props.onSaveEntry,
    formTitleSetter: props.formTitleSetter,
    formCategorySetter: props.formCategorySetter,
    formAddFieldFunction: props.formAddFieldFunction,
  });

  const processVoiceInput = useCallback(async (transcript: string): Promise<boolean> => {
    // Prevent duplicate processing
    if (processingLock.current || !transcript?.trim()) {
      return false;
    }

    // Check for duplicate transcript
    if (transcript === lastProcessedTranscript.current) {
      return false;
    }

    processingLock.current = true;
    lastProcessedTranscript.current = transcript;

    try {
      // Process conversation if in conversation
      // IMPORTANT: Use getConversationState() to get current state, not stale closure value
      const currentConversationState = getConversationState();

      logDebug('Checking conversation state', {
        isInConversation: currentConversationState.isInConversation,
        currentStep: currentConversationState.currentStep?.type,
        staleState: conversationState.isInConversation,
        transcript
      }, { emoji: '🎯', context: 'Voice Processor' });

      if (currentConversationState.isInConversation) {
        logDebug('In conversation, processing step', currentConversationState.currentStep?.type, { emoji: '🎯', context: 'Voice Processor' });
        const handled = processConversationStep(transcript);
        logDebug('Conversation step result', handled, { emoji: '🎯', context: 'Voice Processor' });
        if (handled) {
          return true;
        }
      }

      // Process simple commands
      const lowerTranscript = transcript.toLowerCase().trim();

      logVoice('Processing command', lowerTranscript);

      // Close/cancel entry form command
      if (lowerTranscript.includes('close entry') || lowerTranscript.includes('close form') ||
          lowerTranscript.includes('cancel entry') || lowerTranscript.includes('go back')) {
        if (currentConversationState.isInConversation) {
          endConversation();
        }
        props.onCancelEdit();
        toast.info("Form closed");
        // Dispatch event to close form
        window.dispatchEvent(new CustomEvent('voice-close-form'));
        return true;
      }

      // Create entry command
      if (lowerTranscript.includes('create') && (lowerTranscript.includes('entry') || lowerTranscript.includes('new'))) {
        logVoice('Starting create entry conversation');
        startCreateEntryConversation();
        return true;
      }

      // Open entry command
      const openMatch = lowerTranscript.match(/open\s+(.+)/);
      if (openMatch) {
        const titleToOpen = openMatch[1].replace(/[.,!?]$/g, '').trim();
        logVoice('Looking for entry', titleToOpen);
        const entry = props.savedEntries.find(e =>
          e.title.toLowerCase().includes(titleToOpen.toLowerCase())
        );
        if (entry) {
          props.onEditEntry(entry);
          const openMsg = `Opening ${entry.title}`;
          toast.success(openMsg);
          speak(openMsg);
          return true;
        } else {
          const notFoundMsg = `Entry "${titleToOpen}" not found`;
          toast.error(notFoundMsg);
          speak(notFoundMsg);
          return false;
        }
      }

      // Edit entry command
      const editMatch = lowerTranscript.match(/edit\s+(.+)/);
      if (editMatch) {
        const titleToEdit = editMatch[1].replace(/[.,!?]$/g, '').trim();
        logVoice('Looking for entry to edit', titleToEdit);
        const entry = props.savedEntries.find(e =>
          e.title.toLowerCase().includes(titleToEdit.toLowerCase())
        );
        if (entry) {
          props.onEditEntry(entry);
          const editMsg = `Editing ${entry.title}`;
          toast.success(editMsg);
          speak(editMsg);
          return true;
        } else {
          const notFoundMsg = `Entry "${titleToEdit}" not found`;
          toast.error(notFoundMsg);
          speak(notFoundMsg);
          return false;
        }
      }

      // Confirm delete - check this BEFORE delete command to avoid matching "confirm delete X" as "delete X"
      // Use ref to get current value and avoid stale closure
      const currentPendingDelete = pendingDeleteEntryRef.current;
      logVoice('Checking confirm delete, pendingEntry', currentPendingDelete?.title);
      if (lowerTranscript.includes('confirm delete') && currentPendingDelete) {
        props.onDeleteEntry(currentPendingDelete.id);
        const deletedMsg = `Deleted ${currentPendingDelete.title}`;
        toast.success(deletedMsg);
        speak(deletedMsg);
        setPendingDeleteEntry(null);
        pendingDeleteEntryRef.current = null;
        return true;
      }

      // Delete entry command with confirmation
      const deleteMatch = lowerTranscript.match(/delete\s+(.+)/);
      if (deleteMatch) {
        const titleToDelete = deleteMatch[1].replace(/[.,!?]$/g, '').trim();
        logVoice('Looking for entry to delete', titleToDelete);
        const entry = props.savedEntries.find(e =>
          e.title.toLowerCase().includes(titleToDelete.toLowerCase())
        );
        if (entry) {
          setPendingDeleteEntry(entry);
          pendingDeleteEntryRef.current = entry;
          const confirmMsg = `Say "confirm delete" to delete ${entry.title}`;
          toast.info(confirmMsg);
          speak(confirmMsg);
          return true;
        } else {
          const notFoundMsg = `Entry "${titleToDelete}" not found`;
          logVoice('Entry not found', titleToDelete);
          toast.error(notFoundMsg);
          speak(notFoundMsg);
          return false;
        }
      }

      // Cancel operations
      if (lowerTranscript.includes('cancel')) {
        if (conversationState.isInConversation) {
          endConversation();
          props.onCancelEdit();
          toast.info("Operation cancelled");
          return true;
        }
        if (pendingDeleteEntryRef.current) {
          setPendingDeleteEntry(null);
          pendingDeleteEntryRef.current = null;
          toast.info("Delete cancelled");
          return true;
        }
      }

      logVoice('No command matched');
      return false;

    } finally {
      // Release lock after a short delay to prevent rapid-fire processing
      setTimeout(() => {
        processingLock.current = false;
      }, 300);
    }
  }, [
    getConversationState,
    processConversationStep,
    startCreateEntryConversation,
    endConversation,
    props.savedEntries,
    props.onEditEntry,
    props.onDeleteEntry,
    props.onCancelEdit,
    conversationState.isInConversation // Still include for re-render triggers
    // Note: pendingDeleteEntry removed - using ref to avoid stale closure
  ]);

  return {
    conversationState,
    processVoiceInput,
    pendingDeleteEntry,
    startCreateEntryConversation,
    endConversation,
  };
};