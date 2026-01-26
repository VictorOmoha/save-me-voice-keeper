
import React, { useState, useEffect, useCallback } from "react";
import { SavedEntry } from "@/types/dashboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSavedEntries = () => {
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching entries:', error);
        toast.error('Failed to fetch entries');
        return;
      }

      // Transform the data to match our SavedEntry type
      const transformedEntries: SavedEntry[] = (data || []).map(entry => {
        const fields = entry.fields as Record<string, any> || {};
        const fieldDefinitions = entry.field_definitions as any[] || [];
        
        return {
          id: entry.id,
          title: entry.title,
          fields,
          fieldDefinitions,
          category: fields?.category || 'Personal',
          createdAt: new Date(entry.created_at),
          updatedAt: new Date(entry.updated_at),
        };
      });

      setSavedEntries(transformedEntries);
    } catch (error) {
      console.error('Error in fetchEntries:', error);
      toast.error('Failed to fetch entries');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save entry to Supabase with debouncing and duplicate prevention
  const saveEntry = useCallback(async (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>, editingEntry?: SavedEntry | null) => {
    // Prevent concurrent saves
    if (isSaving) {
      console.log('Save already in progress, skipping duplicate save attempt');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const entryData = {
        title: entry.title,
        fields: entry.fields as any, // Cast to Json-compatible type
        field_definitions: entry.fieldDefinitions as any || null, // Cast to Json-compatible type
        user_id: user.id,
      };

      let data, error;

      if (editingEntry) {
        // Update existing entry
        const result = await supabase
          .from('entries')
          .update(entryData)
          .eq('id', editingEntry.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Insert new entry
        const result = await supabase
          .from('entries')
          .insert(entryData)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        throw error;
      }

      // Transform the data
      const fields = data.fields as Record<string, any> || {};
      const fieldDefinitions = data.field_definitions as any[] || [];
      
      const savedEntry: SavedEntry = {
        id: data.id,
        title: data.title,
        fields,
        fieldDefinitions,
        category: fields?.category || 'Personal',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      if (editingEntry) {
        // Update existing entry in local state
        setSavedEntries(prev => prev.map(e => e.id === editingEntry.id ? savedEntry : e));
        toast.success('Entry updated successfully!');
      } else {
        // Add new entry to local state
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
  }, [isSaving]);

  // Delete entry from Supabase
  const deleteEntry = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('entries')
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

  // Load entries on mount
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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
