
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
      setIsLoading(true);
      const { data: entries, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading entries:', error);
        toast.error('Failed to load entries');
        return;
      }

      const formattedEntries: SavedEntry[] = entries.map(entry => ({
        id: entry.id,
        title: entry.title,
        fields: (entry.fields as Record<string, any>) || {},
        fieldDefinitions: entry.field_definitions as any || undefined,
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at)
      }));

      setSavedEntries(formattedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error('Failed to load entries');
    } finally {
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
