
import { useState, useEffect } from "react";
import { SavedEntry } from "@/types/dashboard";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useDashboardState = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [fillingEntry, setFillingEntry] = useState<SavedEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadEntries();
    } else if (!authLoading && !user) {
      setIsLoading(false);
      setSavedEntries([]);
    }
  }, [user, authLoading]);

  const loadEntries = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Starting to load entries...');
      setIsLoading(true);

      const entriesRef = collection(db, 'entries');
      const q = query(
        entriesRef,
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const entries: SavedEntry[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          id: docSnap.id,
          title: data.title || '',
          fields: data.fields || {},
          fieldDefinitions: data.field_definitions || undefined,
          createdAt: data.created_at?.toDate?.() || new Date(),
          updatedAt: data.updated_at?.toDate?.() || new Date()
        });
      });

      console.log('Loaded entries:', entries.length);
      setSavedEntries(entries);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error('Failed to load entries');
      setSavedEntries([]);
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const filteredEntries = savedEntries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.values(entry.fields).some(value =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return {
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
  };
};
