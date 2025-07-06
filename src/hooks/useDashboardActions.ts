import { SavedEntry } from "@/types/dashboard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UseDashboardActionsProps {
  savedEntries: SavedEntry[];
  setSavedEntries: (entries: SavedEntry[]) => void;
  editingEntry: SavedEntry | null;
  setEditingEntry: (entry: SavedEntry | null) => void;
  setFillingEntry: (entry: SavedEntry | null) => void;
  setShowAddEntry: (show: boolean) => void;
  loadEntries: () => Promise<void>;
}

export const useDashboardActions = ({
  savedEntries,
  setSavedEntries,
  editingEntry,
  setEditingEntry,
  setFillingEntry,
  setShowAddEntry,
  loadEntries,
}: UseDashboardActionsProps) => {
  const saveEntry = async (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        toast.error("You must be logged in to save entries");
        return;
      }

      console.log('Authenticated user:', user.id);
      console.log('Saving entry:', entry);

      if (editingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('entries')
          .update({
            title: entry.title,
            fields: entry.fields as any,
            field_definitions: entry.fieldDefinitions as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEntry.id);

        if (error) {
          console.error('Error updating entry:', error);
          toast.error("Failed to update entry: " + error.message);
          return;
        }

        toast.success("Entry updated successfully!");
        setEditingEntry(null);
      } else {
        // Create new entry - explicitly set user_id and let trigger handle validation
        const { data, error } = await supabase
          .from('entries')
          .insert({
            title: entry.title,
            fields: entry.fields as any,
            field_definitions: entry.fieldDefinitions as any,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating entry:', error);
          toast.error("Failed to save entry: " + error.message);
          return;
        }

        console.log('Entry created successfully:', data);
        toast.success("Entry saved successfully!");
      }
      
      setShowAddEntry(false);
      await loadEntries(); // Reload entries from database
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error("Failed to save entry: " + (error as Error).message);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting entry:', error);
        toast.error("Failed to delete entry");
        return;
      }

      toast.success("Entry deleted successfully!");
      await loadEntries(); // Reload entries from database
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error("Failed to delete entry");
    }
  };

  const bulkDeleteEntries = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error deleting entries:', error);
        toast.error("Failed to delete entries");
        return;
      }

      toast.success(`${ids.length} entries deleted successfully!`);
      await loadEntries(); // Reload entries from database
    } catch (error) {
      console.error('Error deleting entries:', error);
      toast.error("Failed to delete entries");
    }
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
