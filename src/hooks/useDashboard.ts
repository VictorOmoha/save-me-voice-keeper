/**
 * useDashboard Hook
 * Main dashboard hook - composes smaller focused hooks for better organization
 */

import { useState, useCallback } from "react";
import { useSavedEntries } from "./useSavedEntries";
import { SavedEntry } from "@/types/dashboard";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";
import { useDashboardVoiceHandler } from "./useDashboardVoiceHandler";

export const useDashboard = () => {
  // Core data management
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

  // Form state
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [fillingEntry, setFillingEntry] = useState<SavedEntry | null>(null);

  // Entry save handler
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

  // Entry delete handler
  const deleteEntry = useCallback(async (id: string) => {
    try {
      console.log('🗑️ Dashboard: deleteEntry called for ID:', id);
      await baseDeleteEntry(id);
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  }, [baseDeleteEntry]);

  // Voice handling - composed from dedicated hook
  const {
    isVoiceProcessing,
    lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    conversationData,
    handleEnhancedVoiceInput,
    cancelCurrentOperation,
  } = useDashboardVoiceHandler({
    savedEntries,
    showAddEntry,
    editingEntry,
    fillingEntry,
    setShowAddEntry,
    setEditingEntry,
    setFillingEntry,
    setSearchQuery,
    deleteEntry,
    saveEntry,
  });

  // Entry edit handler
  const editEntry = useCallback((entry: SavedEntry) => {
    setEditingEntry(entry);
    setShowAddEntry(false);
    setFillingEntry(null);
  }, []);

  // Entry fill handler
  const fillEntry = useCallback((entry: SavedEntry) => {
    setFillingEntry(entry);
    setShowAddEntry(false);
    setEditingEntry(null);
  }, []);

  // Cancel edit handler
  const handleCancelEdit = useCallback(() => {
    setEditingEntry(null);
    setFillingEntry(null);
    setShowAddEntry(false);
  }, []);

  // Get form mode
  const getFormMode = useCallback((): 'create' | 'edit' | 'fill' => {
    if (fillingEntry) return 'fill';
    if (editingEntry) return 'edit';
    return 'create';
  }, [editingEntry, fillingEntry]);

  // Get form title
  const getFormTitle = useCallback((): string => {
    if (fillingEntry) return `Fill: ${fillingEntry.title}`;
    if (editingEntry) return `Edit: ${editingEntry.title}`;
    return 'Create New Entry';
  }, [editingEntry, fillingEntry]);

  // Add entry handler
  const handleAddEntry = useCallback(() => {
    setShowAddEntry(true);
    setEditingEntry(null);
    setFillingEntry(null);
  }, []);

  return {
    // Data
    savedEntries,
    isLoading,
    isSaving,
    searchQuery,
    setSearchQuery,

    // Form state
    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,

    // Voice state
    isVoiceProcessing,
    lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    conversationData,

    // Actions
    saveEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    handleAddEntry,
    handleEnhancedVoiceInput,
    cancelCurrentOperation,
    refreshEntries,
  };
};
