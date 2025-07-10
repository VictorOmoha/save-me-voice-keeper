
import { useState, useEffect } from "react";
import { SavedEntry } from "@/types/dashboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDashboardState = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [fillingEntry, setFillingEntry] = useState<SavedEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      console.log('Starting to load entries...');
      setIsLoading(true);
      
      const { data: entries, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response - entries:', entries, 'error:', error);

      if (error) {
        console.error('Error loading entries:', error);
        toast.error('Failed to load entries');
        setSavedEntries([]);
        return;
      }

      // Handle the case where entries is null or undefined
      const entriesArray = entries || [];
      console.log('Processing entries array:', entriesArray);

      const formattedEntries: SavedEntry[] = entriesArray.map(entry => ({
        id: entry.id,
        title: entry.title,
        fields: (entry.fields as Record<string, any>) || {},
        fieldDefinitions: entry.field_definitions as any || undefined,
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at)
      }));

      console.log('Formatted entries:', formattedEntries);
      setSavedEntries(formattedEntries);
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
