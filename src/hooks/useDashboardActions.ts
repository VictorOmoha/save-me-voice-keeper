
import { SavedEntry } from "@/types/dashboard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { zapierService } from "@/services/zapierService";
import { webhookService } from "@/services/webhookService";

interface UseDashboardActionsProps {
  savedEntries: SavedEntry[];
  setSavedEntries: (entries: SavedEntry[]) => void;
  editingEntry: SavedEntry | null;
  setEditingEntry: (entry: SavedEntry | null) => void;
  setFillingEntry: (entry: SavedEntry | null) => void;
  setShowAddEntry: (show: boolean) => void;
  loadEntries: () => Promise<void>;
}

// Get webhook URL from localStorage or settings
const getWebhookUrl = () => {
  return localStorage.getItem('zapierWebhookUrl') || 'https://hooks.zapier.com/hooks/catch/23790183/u2t2vvq/';
};

// Get user email from auth context
const getUserEmail = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email || 'omohavictor@gmail.com';
};

const showStorageExceededToast = () => {
  toast.error("Storage limit reached for your plan. Please delete some entries/files or upgrade your plan.");
};

export const useDashboardActions = ({
  savedEntries,
  setSavedEntries,
  editingEntry,
  setEditingEntry,
  setFillingEntry,
  setShowAddEntry,
  loadEntries,
}: UseDashboardActionsProps) => {
  const saveEntry = async (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>, fillingEntry?: SavedEntry | null) => {
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
      console.log('Filling entry:', fillingEntry);

      let savedEntryData: SavedEntry | null = null;

      if (editingEntry) {
        // Update existing entry
        const { data, error } = await supabase
          .from('entries')
          .update({
            title: entry.title,
            fields: entry.fields as any,
            field_definitions: entry.fieldDefinitions as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEntry.id)
          .select()
          .single();

        if (error) {
          const exceeded = error.message?.includes('storage_limit_exceeded') || (error as any)?.details?.includes?.('storage_limit_exceeded');
          if (exceeded) {
            showStorageExceededToast();
            return;
          }
          console.error('Error updating entry:', error);
          toast.error("Failed to update entry: " + error.message);
          return;
        }

        savedEntryData = {
          id: data.id,
          title: data.title,
          fields: data.fields as Record<string, any>,
          fieldDefinitions: data.field_definitions as any,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };

        // Trigger webhook for entry update
        try {
          const webhookUrl = getWebhookUrl();
          const userEmail = await getUserEmail();
          
          await zapierService.sendEntryCreatedWebhook(webhookUrl, savedEntryData, userEmail);
          console.log('Webhook triggered for entry update');
        } catch (webhookError) {
          console.error('Failed to trigger webhook for entry update:', webhookError);
          // Don't show error to user as the main operation succeeded
        }

        toast.success("Entry updated successfully!");
        setEditingEntry(null);
      } else if (fillingEntry) {
        // When filling, update the template entry instead of creating a new one
        const { data, error } = await supabase
          .from('entries')
          .update({
            title: entry.title,
            fields: entry.fields as any,
            field_definitions: entry.fieldDefinitions as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', fillingEntry.id)
          .select()
          .single();

        if (error) {
          const exceeded = error.message?.includes('storage_limit_exceeded') || (error as any)?.details?.includes?.('storage_limit_exceeded');
          if (exceeded) {
            showStorageExceededToast();
            return;
          }
          console.error('Error updating filled entry:', error);
          toast.error("Failed to update entry: " + error.message);
          return;
        }

        savedEntryData = {
          id: data.id,
          title: data.title,
          fields: data.fields as Record<string, any>,
          fieldDefinitions: data.field_definitions as any,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };

        // Trigger webhook for entry fill/update
        try {
          const webhookUrl = getWebhookUrl();
          const userEmail = await getUserEmail();
          
          await zapierService.sendEntryCreatedWebhook(webhookUrl, savedEntryData, userEmail);
          console.log('Webhook triggered for entry fill');
        } catch (webhookError) {
          console.error('Failed to trigger webhook for entry fill:', webhookError);
        }

        console.log('Entry updated successfully (fill mode)');
        toast.success("Entry data updated successfully!");
        setFillingEntry(null);
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
          const exceeded = error.message?.includes('storage_limit_exceeded') || (error as any)?.details?.includes?.('storage_limit_exceeded');
          if (exceeded) {
            showStorageExceededToast();
            return;
          }
          console.error('Error creating entry:', error);
          toast.error("Failed to save entry: " + error.message);
          return;
        }

        savedEntryData = {
          id: data.id,
          title: data.title,
          fields: data.fields as Record<string, any>,
          fieldDefinitions: data.field_definitions as any,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };

        // Trigger webhook for new entry creation
        try {
          const webhookUrl = getWebhookUrl();
          const userEmail = await getUserEmail();
          
          await zapierService.sendEntryCreatedWebhook(webhookUrl, savedEntryData, userEmail);
          console.log('Webhook triggered for new entry creation');
        } catch (webhookError) {
          console.error('Failed to trigger webhook for new entry:', webhookError);
        }

        console.log('Entry created successfully:', data);
        toast.success("Entry saved successfully!");
      }
      
      setShowAddEntry(false);
      await loadEntries(); // Reload entries from database
    } catch (error) {
      const err = error as any;
      const exceeded = err?.message?.includes?.('storage_limit_exceeded') || err?.details?.includes?.('storage_limit_exceeded');
      if (exceeded) {
        showStorageExceededToast();
        return;
      }
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
