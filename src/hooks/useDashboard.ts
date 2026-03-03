import { useState, useCallback } from "react";
import { useSavedEntries } from "./useSavedEntries";
import { SavedEntry } from "@/types/dashboard";
import { toast } from "sonner";

export const useDashboard = () => {
  const {
    savedEntries,
    isLoading,
    isSaving,
    saveEntry: baseSaveEntry,
    deleteEntry: baseDeleteEntry,
    searchQuery,
    setSearchQuery,
    refreshEntries,
  } = useSavedEntries();

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [fillingEntry, setFillingEntry] = useState<SavedEntry | null>(null);

  const saveEntry = useCallback(async (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await baseSaveEntry(entry, editingEntry);
      setShowAddEntry(false);
      setEditingEntry(null);
      setFillingEntry(null);
      toast.success(editingEntry ? 'Entry updated successfully!' : 'Entry saved successfully!');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    }
  }, [baseSaveEntry, editingEntry]);

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
    isSaving,
    searchQuery,
    setSearchQuery,

    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,

    saveEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    handleAddEntry,
    refreshEntries,
  };
};
