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
  const [templateEntry, setTemplateEntry] = useState<SavedEntry | null>(null);

  const saveEntry = useCallback(async (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Both edit and fill modes update the same entry; template mode creates new (no second arg)
      await baseSaveEntry(entry, editingEntry || fillingEntry);
      setShowAddEntry(false);
      setEditingEntry(null);
      setFillingEntry(null);
      setTemplateEntry(null);
      const isUpdate = !!(editingEntry || fillingEntry);
      toast.success(isUpdate ? 'Entry updated successfully!' : 'Entry saved successfully!');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    }
  }, [baseSaveEntry, editingEntry, fillingEntry]);

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
    setTemplateEntry(null);
  }, []);

  const fillEntry = useCallback((entry: SavedEntry) => {
    setFillingEntry(entry);
    setShowAddEntry(false);
    setEditingEntry(null);
    setTemplateEntry(null);
  }, []);

  const useAsTemplate = useCallback((entry: SavedEntry) => {
    setTemplateEntry(entry);
    setShowAddEntry(false);
    setEditingEntry(null);
    setFillingEntry(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingEntry(null);
    setFillingEntry(null);
    setTemplateEntry(null);
    setShowAddEntry(false);
  }, []);

  const getFormMode = useCallback((): 'create' | 'edit' | 'fill' | 'template' => {
    if (templateEntry) return 'template';
    if (fillingEntry) return 'fill';
    if (editingEntry) return 'edit';
    return 'create';
  }, [editingEntry, fillingEntry, templateEntry]);

  const getFormTitle = useCallback((): string => {
    if (templateEntry) return `New from: ${templateEntry.title}`;
    if (fillingEntry) return `Fill: ${fillingEntry.title}`;
    if (editingEntry) return `Edit: ${editingEntry.title}`;
    return 'Create New Entry';
  }, [editingEntry, fillingEntry, templateEntry]);

  const handleAddEntry = useCallback(() => {
    setShowAddEntry(true);
    setEditingEntry(null);
    setFillingEntry(null);
    setTemplateEntry(null);
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
    templateEntry,
    setTemplateEntry,

    saveEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    useAsTemplate,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    handleAddEntry,
    refreshEntries,
  };
};
