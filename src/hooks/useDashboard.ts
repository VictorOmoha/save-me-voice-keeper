import { useDashboardState } from "./useDashboardState";
import { useDashboardActions } from "./useDashboardActions";
import { useDashboardVoice } from "./useDashboardVoice";

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

  const {
    handleVoiceCommand,
    handleVoiceResult,
  } = useDashboardVoice({
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
  });

  // Enhanced voice input processing
  const handleEnhancedVoiceInput = (text: string) => {
    console.log('Dashboard received voice input:', text);
    handleVoiceResult(text);
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
    saveEntry,
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
    // Enhanced Voice - simplified
    handleEnhancedVoiceInput,
    isVoiceProcessing: false,
    lastVoiceCommand: null,
    conversationState: 'idle' as const,
    hasPendingConfirmation: false,
    cancelCurrentOperation: () => {},
  };
};