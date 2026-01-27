
import React, { useState, useEffect, useCallback } from "react";
import { SavedEntry } from "@/types/dashboard";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { toast } from "sonner";

export const useSavedEntries = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch entries from Firebase Firestore
  const fetchEntries = useCallback(async () => {
    // Don't fetch if auth is still loading or no user
    if (authLoading) return;

    if (!user) {
      console.log('No user found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const entriesRef = collection(db, 'entries');
      const q = query(
        entriesRef,
        where('user_id', '==', user!.uid),
        orderBy('updated_at', 'desc')
      );

      const querySnapshot = await getDocs(q);

      // Transform the data to match our SavedEntry type
      const transformedEntries: SavedEntry[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const fields = data.fields || {};
        const fieldDefinitions = data.field_definitions || [];

        return {
          id: docSnap.id,
          title: data.title,
          fields,
          fieldDefinitions,
          category: fields?.category || 'Personal',
          createdAt: data.created_at?.toDate() || new Date(),
          updatedAt: data.updated_at?.toDate() || new Date(),
        };
      });

      setSavedEntries(transformedEntries);
    } catch (error) {
      console.error('Error in fetchEntries:', error);
      toast.error('Failed to fetch entries');
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Save entry to Firebase Firestore with debouncing and duplicate prevention
  const saveEntry = useCallback(async (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>, editingEntry?: SavedEntry | null) => {
    // Prevent concurrent saves
    if (isSaving) {
      console.log('Save already in progress, skipping duplicate save attempt');
      return;
    }

    if (!user) {
      throw new Error('No authenticated user');
    }

    setIsSaving(true);
    try {

      if (editingEntry) {
        // Update existing entry
        const entryRef = doc(db, 'entries', editingEntry.id);
        await updateDoc(entryRef, {
          title: entry.title,
          fields: entry.fields,
          field_definitions: entry.fieldDefinitions || null,
          updated_at: serverTimestamp(),
        });

        // Update local state
        const updatedEntry: SavedEntry = {
          ...editingEntry,
          title: entry.title,
          fields: entry.fields,
          fieldDefinitions: entry.fieldDefinitions || [],
          category: entry.fields?.category || 'Personal',
          updatedAt: new Date(),
        };

        setSavedEntries(prev => prev.map(e => e.id === editingEntry.id ? updatedEntry : e));
        toast.success('Entry updated successfully!');
      } else {
        // Insert new entry
        const entriesRef = collection(db, 'entries');
        const docRef = await addDoc(entriesRef, {
          title: entry.title,
          fields: entry.fields,
          field_definitions: entry.fieldDefinitions || null,
          user_id: user.uid,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });

        // Add to local state
        const savedEntry: SavedEntry = {
          id: docRef.id,
          title: entry.title,
          fields: entry.fields,
          fieldDefinitions: entry.fieldDefinitions || [],
          category: entry.fields?.category || 'Personal',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setSavedEntries(prev => [savedEntry, ...prev]);
        toast.success('Entry saved successfully!');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, user]);

  // Delete entry from Firebase Firestore
  const deleteEntry = useCallback(async (id: string) => {
    try {
      const entryRef = doc(db, 'entries', id);
      await deleteDoc(entryRef);

      // Remove from local state
      setSavedEntries(prev => prev.filter(entry => entry.id !== id));
      toast.success('Entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
      throw error;
    }
  }, []);

  // Filter entries based on search query - memoized to prevent recalculation on every render
  const filteredEntries = React.useMemo(() => {
    if (!searchQuery) return savedEntries;

    const query = searchQuery.toLowerCase();
    return savedEntries.filter(entry =>
      entry.title.toLowerCase().includes(query) ||
      (entry.category && entry.category.toLowerCase().includes(query)) ||
      Object.values(entry.fields).some(value =>
        typeof value === 'string' && value.toLowerCase().includes(query)
      )
    );
  }, [savedEntries, searchQuery]);

  // Load entries when user is ready
  useEffect(() => {
    if (!authLoading && user) {
      fetchEntries();
    }
  }, [user, authLoading, fetchEntries]);

  return {
    savedEntries: filteredEntries,
    isLoading,
    isSaving,
    searchQuery,
    setSearchQuery,
    saveEntry,
    deleteEntry,
    refreshEntries: fetchEntries,
  };
};
