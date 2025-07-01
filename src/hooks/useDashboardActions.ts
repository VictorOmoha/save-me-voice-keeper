
import { SavedEntry } from "@/pages/Dashboard";
import { toast } from "sonner";

interface UseDashboardActionsProps {
  savedEntries: SavedEntry[];
  setSavedEntries: (entries: SavedEntry[]) => void;
  editingEntry: SavedEntry | null;
  setEditingEntry: (entry: SavedEntry | null) => void;
  setFillingEntry: (entry: SavedEntry | null) => void;
  setShowAddEntry: (show: boolean) => void;
}

export const useDashboardActions = ({
  savedEntries,
  setSavedEntries,
  editingEntry,
  setEditingEntry,
  setFillingEntry,
  setShowAddEntry,
}: UseDashboardActionsProps) => {
  const saveEntry = (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingEntry) {
      // Update existing entry
      const updatedEntry: SavedEntry = {
        ...editingEntry,
        ...entry,
        updatedAt: new Date()
      };
      
      const updatedEntries = savedEntries.map(e => 
        e.id === editingEntry.id ? updatedEntry : e
      );
      setSavedEntries(updatedEntries);
      localStorage.setItem('savedEntries', JSON.stringify(updatedEntries));
      toast.success("Entry updated successfully!");
      setEditingEntry(null);
    } else {
      // Create new entry
      const newEntry: SavedEntry = {
        ...entry,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedEntries = [newEntry, ...savedEntries];
      setSavedEntries(updatedEntries);
      localStorage.setItem('savedEntries', JSON.stringify(updatedEntries));
      toast.success("Entry saved successfully!");
    }
    setShowAddEntry(false);
  };

  const deleteEntry = (id: string) => {
    const updatedEntries = savedEntries.filter(entry => entry.id !== id);
    setSavedEntries(updatedEntries);
    localStorage.setItem('savedEntries', JSON.stringify(updatedEntries));
    toast.success("Entry deleted successfully!");
  };

  const bulkDeleteEntries = (ids: string[]) => {
    const updatedEntries = savedEntries.filter(entry => !ids.includes(entry.id));
    setSavedEntries(updatedEntries);
    localStorage.setItem('savedEntries', JSON.stringify(updatedEntries));
    toast.success(`${ids.length} entries deleted successfully!`);
  };

  const editEntry = (entry: SavedEntry) => {
    setEditingEntry(entry);
    setFillingEntry(null);
    setShowAddEntry(true);
  };

  const fillEntry = (entry: SavedEntry) => {
    setFillingEntry(entry);
    setEditingEntry(null);
    setShowAddEntry(true);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setFillingEntry(null);
    setShowAddEntry(false);
  };

  const handleAddEntry = () => {
    setShowAddEntry(true);
  };

  return {
    saveEntry,
    deleteEntry,
    bulkDeleteEntries,
    editEntry,
    fillEntry,
    handleCancelEdit,
    handleAddEntry,
  };
};
