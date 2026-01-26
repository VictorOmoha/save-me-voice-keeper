
import React from "react";
import { SavedEntry } from "@/types/dashboard";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { zapierService } from "@/services/zapierService";
import { webhookService } from "@/services/webhookService";
import { useState } from "react";

interface UseDashboardActionsProps {
  savedEntries: SavedEntry[];
  setSavedEntries: React.Dispatch<React.SetStateAction<SavedEntry[]>>;
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
  const user = auth.currentUser;
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
  const [isSaving, setIsSaving] = useState(false);

  const saveEntry = async (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>, fillingEntry?: SavedEntry | null) => {
    // Prevent concurrent saves
    if (isSaving) {
      console.log('Save already in progress, skipping duplicate save attempt');
      return;
    }

    setIsSaving(true);
    try {
      // Check if user is authenticated
      const user = auth.currentUser;

      if (!user) {
        console.error('Authentication error: No user logged in');
        toast.error("You must be logged in to save entries");
        return;
      }

      console.log('Authenticated user:', user.uid);
      console.log('Saving entry:', entry);
      console.log('Filling entry:', fillingEntry);

      let savedEntryData: SavedEntry | null = null;

      if (editingEntry) {
        // Update existing entry
        const entryRef = doc(db, 'entries', editingEntry.id);
        await updateDoc(entryRef, {
          title: entry.title,
          fields: entry.fields,
          field_definitions: entry.fieldDefinitions || null,
          updated_at: serverTimestamp()
        });

        savedEntryData = {
          id: editingEntry.id,
          title: entry.title,
          fields: entry.fields,
          fieldDefinitions: entry.fieldDefinitions,
          createdAt: editingEntry.createdAt,
          updatedAt: new Date()
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

        // Update local state immediately to prevent duplication
        setSavedEntries(prevEntries =>
          prevEntries.map(e => e.id === editingEntry.id ? savedEntryData! : e)
        );

        toast.success("Entry updated successfully!");
        setEditingEntry(null);
      } else if (fillingEntry) {
        // When filling, update the template entry instead of creating a new one
        const entryRef = doc(db, 'entries', fillingEntry.id);
        await updateDoc(entryRef, {
          title: entry.title,
          fields: entry.fields,
          field_definitions: entry.fieldDefinitions || null,
          updated_at: serverTimestamp()
        });

        savedEntryData = {
          id: fillingEntry.id,
          title: entry.title,
          fields: entry.fields,
          fieldDefinitions: entry.fieldDefinitions,
          createdAt: fillingEntry.createdAt,
          updatedAt: new Date()
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

        // Update local state immediately to prevent duplication
        setSavedEntries(prevEntries =>
          prevEntries.map(e => e.id === fillingEntry.id ? savedEntryData! : e)
        );

        console.log('Entry updated successfully (fill mode)');
        toast.success("Entry data updated successfully!");
        setFillingEntry(null);
      } else {
        // Create new entry
        const entriesRef = collection(db, 'entries');
        const docRef = await addDoc(entriesRef, {
          title: entry.title,
          fields: entry.fields,
          field_definitions: entry.fieldDefinitions || null,
          user_id: user.uid,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });

        savedEntryData = {
          id: docRef.id,
          title: entry.title,
          fields: entry.fields,
          fieldDefinitions: entry.fieldDefinitions,
          createdAt: new Date(),
          updatedAt: new Date()
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

        // Add new entry to local state immediately to prevent duplication
        setSavedEntries(prevEntries => [savedEntryData!, ...prevEntries]);

        console.log('Entry created successfully:', docRef.id);
        toast.success("Entry saved successfully!");
      }

      setShowAddEntry(false);
    } catch (error) {
      const err = error as any;
      const exceeded = err?.message?.includes?.('storage_limit_exceeded') || err?.details?.includes?.('storage_limit_exceeded');
      if (exceeded) {
        showStorageExceededToast();
        return;
      }
      console.error('Error saving entry:', error);
      toast.error("Failed to save entry: " + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const entryRef = doc(db, 'entries', id);
      await deleteDoc(entryRef);

      toast.success("Entry deleted successfully!");
      await loadEntries(); // Reload entries from database
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error("Failed to delete entry");
    }
  };

  const bulkDeleteEntries = async (ids: string[]) => {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        const entryRef = doc(db, 'entries', id);
        batch.delete(entryRef);
      });
      await batch.commit();

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
    isSaving,
  };
};
