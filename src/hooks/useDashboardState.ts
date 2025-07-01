
import { useState, useEffect } from "react";
import { SavedEntry } from "@/pages/Dashboard";

export const useDashboardState = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [fillingEntry, setFillingEntry] = useState<SavedEntry | null>(null);

  useEffect(() => {
    // Load saved entries from localStorage
    const entries = localStorage.getItem('savedEntries');
    if (entries) {
      setSavedEntries(JSON.parse(entries));
    }
  }, []);

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
  };
};
