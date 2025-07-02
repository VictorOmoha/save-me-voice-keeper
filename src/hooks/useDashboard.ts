
import { useDashboardState } from "./useDashboardState";
import { useDashboardActions } from "./useDashboardActions";
import { useDashboardVoice } from "./useDashboardVoice";
import { useEnhancedVoice } from "./useEnhancedVoice";

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

  // Enhanced Voice System
  const {
    processVoiceInput: handleEnhancedVoiceInput,
    isProcessing: isVoiceProcessing,
    lastCommand: lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    cancelCurrentOperation,
  } = useEnhancedVoice({
    savedEntries,
    currentView: showAddEntry ? 'form' : editingEntry ? 'edit' : 'dashboard',
    currentEntry: editingEntry || fillingEntry,
    onCreateEntry: saveEntry,
    onDeleteEntry: deleteEntry,
    onEditEntry: editEntry,
    onBulkOperation: (operation, criteria) => {
      console.log('Bulk operation:', operation, criteria);
      // Implement bulk operations based on criteria
    },
    onNavigate: (view, params) => {
      console.log('Navigate to:', view, params);
      // Implement navigation logic
    },
    onSearch: (query) => {
      setSearchQuery(query);
    },
    onExport: (format, filter) => {
      console.log('Export:', format, filter);
      // Implement export logic
    },
  });

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
    // Enhanced Voice
    handleEnhancedVoiceInput,
    isVoiceProcessing,
    lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    cancelCurrentOperation,
  };
};
