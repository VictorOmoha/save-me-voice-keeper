
import { useDashboardState } from "./useDashboardState";
import { useDashboardActions } from "./useDashboardActions";
import { useVoiceConversation } from "./useVoiceConversation";
import { useVoiceFormContext } from "@/contexts/VoiceFormContext";
import { SavedEntry } from "@/types/dashboard";

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

  const { formTitleSetter, formCategorySetter, formAddFieldFunction } = useVoiceFormContext();

  const {
    handleVoiceCommand,
    handleVoiceResult,
    conversationState,
    cancelConversation,
  } = useVoiceConversation({
    savedEntries,
    showAddEntry,
    setShowAddEntry,
    setEditingEntry,
    setFillingEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    handleCancelEdit,
    saveEntry,
    formTitleSetter: formTitleSetter || undefined,
    formCategorySetter: formCategorySetter || undefined,
    formAddFieldFunction: formAddFieldFunction || undefined,
  });

  // Enhanced voice input processing with proper cleanup
  const handleEnhancedVoiceInput = (text: string) => {
    console.log('Dashboard received voice input:', text);
    if (!text || text.trim().length === 0) {
      console.log('Empty voice input, ignoring');
      return;
    }
    handleVoiceResult(text);
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

  // Simplified conversation state management
  const isVoiceActive = conversationState.isActive;
  const voiceState = isVoiceActive ? 'listening' : 'idle';

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
    handleVoiceCommand,
    handleAddEntry,
    handleVoiceResult,
    isLoading,
    loadEntries,
    // Enhanced Voice - cleaned up interface
    handleEnhancedVoiceInput,
    isVoiceProcessing: false,
    lastVoiceCommand: isVoiceActive ? { conversationState } : null,
    conversationState: voiceState as 'listening' | 'confirming' | 'idle',
    hasPendingConfirmation: isVoiceActive,
    cancelCurrentOperation: cancelConversation,
    conversationData: conversationState,
  };
};
