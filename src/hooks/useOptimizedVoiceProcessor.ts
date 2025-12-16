import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { SavedEntry } from '@/types/dashboard';
import { useVoiceConversationManager } from './useVoiceConversationManager';

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
  const lastProcessedTranscript = useRef<string>('');
  const processingLock = useRef<boolean>(false);

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

      console.log('🎯 Voice Processor: Checking conversation state:', {
        isInConversation: currentConversationState.isInConversation,
        currentStep: currentConversationState.currentStep?.type,
        staleState: conversationState.isInConversation,
        transcript
      });

      if (currentConversationState.isInConversation) {
        console.log('🎯 Voice Processor: In conversation, processing step for:', currentConversationState.currentStep?.type);
        const handled = processConversationStep(transcript);
        console.log('🎯 Voice Processor: Conversation step result:', handled);
        if (handled) {
          return true;
        }
      }

      // Process simple commands
      const lowerTranscript = transcript.toLowerCase().trim();

      console.log('🎯 Voice Processor: Processing command:', lowerTranscript);

      // Close/cancel entry form command
      if (lowerTranscript.includes('close entry') || lowerTranscript.includes('close form') ||
          lowerTranscript.includes('cancel entry') || lowerTranscript.includes('go back')) {
        if (conversationState.isInConversation) {
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
        console.log('🎯 Voice Processor: Starting create entry conversation');
        startCreateEntryConversation();
        return true;
      }

      // Open entry command
      const openMatch = lowerTranscript.match(/open\s+(.+)/);
      if (openMatch) {
        const titleToOpen = openMatch[1].replace(/[.,!?]$/g, '').trim();
        console.log('🎯 Voice Processor: Looking for entry:', titleToOpen);
        const entry = props.savedEntries.find(e =>
          e.title.toLowerCase().includes(titleToOpen.toLowerCase())
        );
        if (entry) {
          props.onEditEntry(entry);
          toast.success(`Opening: ${entry.title}`);
          return true;
        } else {
          toast.error(`Entry "${titleToOpen}" not found`);
          return false;
        }
      }

      // Edit entry command
      const editMatch = lowerTranscript.match(/edit\s+(.+)/);
      if (editMatch) {
        const titleToEdit = editMatch[1].replace(/[.,!?]$/g, '').trim();
        const entry = props.savedEntries.find(e =>
          e.title.toLowerCase().includes(titleToEdit.toLowerCase())
        );
        if (entry) {
          props.onEditEntry(entry);
          toast.success(`Editing: ${entry.title}`);
          return true;
        } else {
          toast.error(`Entry "${titleToEdit}" not found`);
          return false;
        }
      }

      // Delete entry command with confirmation
      const deleteMatch = lowerTranscript.match(/delete\s+(.+)/);
      if (deleteMatch) {
        const titleToDelete = deleteMatch[1].replace(/[.,!?]$/g, '').trim();
        const entry = props.savedEntries.find(e =>
          e.title.toLowerCase().includes(titleToDelete.toLowerCase())
        );
        if (entry) {
          setPendingDeleteEntry(entry);
          toast.info(`Say "confirm delete" to delete: ${entry.title}`);
          return true;
        } else {
          toast.error(`Entry "${titleToDelete}" not found`);
          return false;
        }
      }

      // Confirm delete
      if (lowerTranscript.includes('confirm delete') && pendingDeleteEntry) {
        props.onDeleteEntry(pendingDeleteEntry.id);
        toast.success(`Deleted: ${pendingDeleteEntry.title}`);
        setPendingDeleteEntry(null);
        return true;
      }

      // Cancel operations
      if (lowerTranscript.includes('cancel')) {
        if (conversationState.isInConversation) {
          endConversation();
          props.onCancelEdit();
          toast.info("Operation cancelled");
          return true;
        }
        if (pendingDeleteEntry) {
          setPendingDeleteEntry(null);
          toast.info("Delete cancelled");
          return true;
        }
      }

      console.log('🎯 Voice Processor: No command matched');
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
    pendingDeleteEntry,
    props.savedEntries,
    props.onEditEntry,
    props.onDeleteEntry,
    props.onCancelEdit,
    conversationState.isInConversation // Still include for re-render triggers
  ]);

  return {
    conversationState,
    processVoiceInput,
    pendingDeleteEntry,
    startCreateEntryConversation,
    endConversation,
  };
};