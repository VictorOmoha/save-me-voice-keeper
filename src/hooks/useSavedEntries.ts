
import { useState, useEffect, useCallback } from "react";
import { SavedEntry } from "@/types/dashboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSavedEntries = () => {
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch entries from Supabase
  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('saved_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        toast.error('Failed to fetch entries');
        return;
      }

      // Transform the data to match our SavedEntry type
      const transformedEntries: SavedEntry[] = (data || []).map(entry => ({
        id: entry.id,
        title: entry.title,
        fields: entry.fields || {},
        fieldDefinitions: entry.field_definitions || [],
        category: entry.category || 'Personal',
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at),
      }));

      setSavedEntries(transformedEntries);
    } catch (error) {
      console.error('Error in fetchEntries:', error);
      toast.error('Failed to fetch entries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save entry to Supabase
  const saveEntry = useCallback(async (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const entryData = {
        title: entry.title,
        fields: entry.fields,
        field_definitions: entry.fieldDefinitions,
        category: entry.category,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('saved_entries')
        .insert([entryData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Add the new entry to local state
      const newEntry: SavedEntry = {
        id: data.id,
        title: data.title,
        fields: data.fields || {},
        fieldDefinitions: data.field_definitions || [],
        category: data.category || 'Personal',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setSavedEntries(prev => [newEntry, ...prev]);
      toast.success('Entry saved successfully!');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
      throw error;
    }
  }, []);

  // Delete entry from Supabase
  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_entries')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Remove from local state
      setSavedEntries(prev => prev.filter(entry => entry.id !== id));
      toast.success('Entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
      throw error;
    }
  }, []);

  // Filter entries based on search query
  const filteredEntries = savedEntries.filter(entry => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      entry.title.toLowerCase().includes(query) ||
      entry.category.toLowerCase().includes(query) ||
      Object.values(entry.fields).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(query)
      )
    );
  });

  // Load entries on mount
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    savedEntries: filteredEntries,
    isLoading,
    searchQuery,
    setSearchQuery,
    saveEntry,
    deleteEntry,
    refreshEntries: fetchEntries,
  };
};
