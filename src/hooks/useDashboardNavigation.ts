import { useState } from 'react';
import { SavedEntry } from '@/types/dashboard';

export const useDashboardNavigation = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDocumentCreator, setShowDocumentCreator] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);

  const handleCategorySelect = (
    categoryName: string,
    setShowAddEntry: (show: boolean) => void,
    setEditingEntry: (entry: SavedEntry | null) => void,
    setFillingEntry: (entry: SavedEntry | null) => void
  ) => {
    console.log('DIAGNOSTIC: Category select triggered for:', categoryName);
    
    // Reset all form states when switching categories
    setShowDocumentCreator(false);
    setShowAddEntry(false);
    setEditingEntry(null);
    setFillingEntry(null);
    setShowAllEntries(false);
    
    setSelectedCategory(categoryName);
  };

  const handleAllEntriesSelect = (
    setShowAddEntry: (show: boolean) => void,
    setEditingEntry: (entry: SavedEntry | null) => void,
    setFillingEntry: (entry: SavedEntry | null) => void
  ) => {
    console.log('DIAGNOSTIC: All Entries select triggered');
    
    // Reset all form states when switching to all entries
    setShowDocumentCreator(false);
    setShowAddEntry(false);
    setEditingEntry(null);
    setFillingEntry(null);
    setSelectedCategory(null);
    
    setShowAllEntries(true);
  };

  const handleBackToMain = (
    setShowAddEntry: (show: boolean) => void,
    setEditingEntry: (entry: SavedEntry | null) => void,
    setFillingEntry: (entry: SavedEntry | null) => void
  ) => {
    console.log('DIAGNOSTIC: Back to main dashboard triggered');
    
    setSelectedCategory(null);
    setShowAllEntries(false);
    // Reset form states when going back to main
    setShowDocumentCreator(false);
    setShowAddEntry(false);
    setEditingEntry(null);
    setFillingEntry(null);
  };

  const handleCreateDocument = () => {
    console.log('DIAGNOSTIC: Create document triggered');
    setShowDocumentCreator(true);
  };

  return {
    selectedCategory,
    showDocumentCreator,
    showAllEntries,
    setSelectedCategory,
    setShowDocumentCreator,
    setShowAllEntries,
    handleCategorySelect,
    handleAllEntriesSelect,
    handleBackToMain,
    handleCreateDocument,
  };
};