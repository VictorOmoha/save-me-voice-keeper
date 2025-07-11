
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
      if (operation === 'delete' && criteria) {
        // Implement bulk delete logic
        const entriesToDelete = savedEntries.filter(entry => {
          if (criteria.category) return entry.fields.category === criteria.category;
          if (criteria.dateRange) {
            // Implement date range filtering
            return true;
          }
          return false;
        });
        entriesToDelete.forEach(entry => deleteEntry(entry.id));
      }
    },
    onNavigate: (view, params) => {
      console.log('Navigate to:', view, params);
      if (view === 'show_all_entries' || view === 'all_entries') {
        // This would need to be handled by the parent component
        // For now, just log the intent
        console.log('Should navigate to all entries view');
      } else if (params?.category) {
        // Handle category navigation
        console.log('Should navigate to category:', params.category);
      }
    },
    onSearch: (query) => {
      setSearchQuery(query);
    },
    onExport: (format, filter) => {
      console.log('Export:', format, filter);
      // Basic export implementation
      if (format === 'csv') {
        const dataToExport = filter ? 
          savedEntries.filter(entry => {
            if (filter.category) return entry.fields.category === filter.category;
            return true;
          }) : savedEntries;
        
        // Create CSV content
        const csvContent = [
          'Title,Category,Created,Description',
          ...dataToExport.map(entry => 
            `"${entry.title}","${entry.fields.category || 'Personal'}","${entry.createdAt}","${entry.fields.description || ''}"`
          )
        ].join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'entries.csv';
        a.click();
        URL.revokeObjectURL(url);
      }
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
