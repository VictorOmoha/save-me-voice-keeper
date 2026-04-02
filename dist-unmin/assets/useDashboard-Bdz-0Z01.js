import { a as reactExports } from "./vendor-ui-CLSr_GWM.js";
import { u as useSavedEntries } from "./useSavedEntries-BbNCU1rB.js";
import { J as Jt } from "./index-CT7EzYyk.js";
const useDashboard = () => {
  const {
    savedEntries,
    isLoading,
    isSaving,
    saveEntry: baseSaveEntry,
    deleteEntry: baseDeleteEntry,
    searchQuery,
    setSearchQuery,
    refreshEntries
  } = useSavedEntries();
  const [showAddEntry, setShowAddEntry] = reactExports.useState(false);
  const [editingEntry, setEditingEntry] = reactExports.useState(null);
  const [fillingEntry, setFillingEntry] = reactExports.useState(null);
  const [templateEntry, setTemplateEntry] = reactExports.useState(null);
  const saveEntry = reactExports.useCallback(async (entry) => {
    try {
      await baseSaveEntry(entry, editingEntry || fillingEntry);
      setShowAddEntry(false);
      setEditingEntry(null);
      setFillingEntry(null);
      setTemplateEntry(null);
      const isUpdate = !!(editingEntry || fillingEntry);
      Jt.success(isUpdate ? "Entry updated successfully!" : "Entry saved successfully!");
    } catch (error) {
      console.error("Error saving entry:", error);
      Jt.error("Failed to save entry");
    }
  }, [baseSaveEntry, editingEntry, fillingEntry]);
  const deleteEntry = reactExports.useCallback(async (id) => {
    try {
      console.log("🗑️ Dashboard: deleteEntry called for ID:", id);
      await baseDeleteEntry(id);
    } catch (error) {
      console.error("Error deleting entry:", error);
      Jt.error("Failed to delete entry");
    }
  }, [baseDeleteEntry]);
  const editEntry = reactExports.useCallback((entry) => {
    setEditingEntry(entry);
    setShowAddEntry(false);
    setFillingEntry(null);
    setTemplateEntry(null);
  }, []);
  const fillEntry = reactExports.useCallback((entry) => {
    setFillingEntry(entry);
    setShowAddEntry(false);
    setEditingEntry(null);
    setTemplateEntry(null);
  }, []);
  const useAsTemplate = reactExports.useCallback((entry) => {
    setTemplateEntry(entry);
    setShowAddEntry(false);
    setEditingEntry(null);
    setFillingEntry(null);
  }, []);
  const handleCancelEdit = reactExports.useCallback(() => {
    setEditingEntry(null);
    setFillingEntry(null);
    setTemplateEntry(null);
    setShowAddEntry(false);
  }, []);
  const getFormMode = reactExports.useCallback(() => {
    if (templateEntry) return "template";
    if (fillingEntry) return "fill";
    if (editingEntry) return "edit";
    return "create";
  }, [editingEntry, fillingEntry, templateEntry]);
  const getFormTitle = reactExports.useCallback(() => {
    if (templateEntry) return `New from: ${templateEntry.title}`;
    if (fillingEntry) return `Fill: ${fillingEntry.title}`;
    if (editingEntry) return `Edit: ${editingEntry.title}`;
    return "Create New Entry";
  }, [editingEntry, fillingEntry, templateEntry]);
  const handleAddEntry = reactExports.useCallback(() => {
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
    refreshEntries
  };
};
export {
  useDashboard as u
};
