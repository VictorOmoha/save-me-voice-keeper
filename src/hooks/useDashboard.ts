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

  // Enhanced voice input processing
  const handleEnhancedVoiceInput = (text: string) => {
    console.log('Dashboard received voice input:', text);
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
    // Enhanced Voice - with conversation support
    handleEnhancedVoiceInput,
    isVoiceProcessing: false,
    lastVoiceCommand: conversationState.isActive ? { conversationState } : null,
    conversationState: (conversationState.isActive ? 'listening' : 'idle') as 'listening' | 'confirming' | 'idle',
    hasPendingConfirmation: conversationState.isActive,
    cancelCurrentOperation: cancelConversation,
    conversationData: conversationState, // Add the full conversation data
  };
};
