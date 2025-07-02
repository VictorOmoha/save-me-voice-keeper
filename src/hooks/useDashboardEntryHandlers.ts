import { SavedEntry } from '@/types/dashboard';

export const useDashboardEntryHandlers = (
  saveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void,
  setShowDocumentCreator: (show: boolean) => void,
  setShowAddEntry: (show: boolean) => void,
  setEditingEntry: (entry: SavedEntry | null) => void,
  setFillingEntry: (entry: SavedEntry | null) => void
) => {
  const handleDocumentSave = (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('DIAGNOSTIC: Document save triggered - RAW ENTRY DATA:', {
      title: entry.title,
      fields: entry.fields,
      fieldKeys: Object.keys(entry.fields),
      category: entry.fields.category,
      documentType: entry.fields.documentType,
      fileName: entry.fields.fileName,
      hasUploadedFile: entry.fields.hasUploadedFile,
      fullFieldsObject: JSON.stringify(entry.fields, null, 2)
    });
    
    // Ensure the category is properly set
    const documentEntry = {
      ...entry,
      fields: {
        ...entry.fields,
        category: 'Documents' // Force the category to be Documents
      }
    };
    
    console.log('DIAGNOSTIC: Processed document entry before save:', {
      title: documentEntry.title,
      category: documentEntry.fields.category,
      allFields: Object.keys(documentEntry.fields)
    });
    
    // Save the entry using the existing saveEntry function
    saveEntry(documentEntry);
    
    // Close the document creator
    setShowDocumentCreator(false);
  };

  const handleDocumentCancel = () => {
    console.log('DIAGNOSTIC: Document creation cancelled');
    setShowDocumentCreator(false);
  };

  const handleCreateEntryForCategory = (categoryName: string) => {
    console.log('DIAGNOSTIC: Creating entry for category:', categoryName);
    
    if (categoryName === "Documents") {
      console.log('DIAGNOSTIC: Opening document creator for Documents category');
      setShowDocumentCreator(true);
      setShowAddEntry(false);
    } else {
      // For other categories, use the regular form with preselected category
      console.log('DIAGNOSTIC: Opening regular form with preselected category:', categoryName);
      setFillingEntry(null);
      setEditingEntry(null);
      setShowAddEntry(true);
      setShowDocumentCreator(false);
    }
  };

  const handleAddEntryWithCategory = () => {
    console.log('DIAGNOSTIC: General add entry triggered');
    setFillingEntry(null);
    setEditingEntry(null);
    setShowAddEntry(true);
    setShowDocumentCreator(false);
  };

  return {
    handleDocumentSave,
    handleDocumentCancel,
    handleCreateEntryForCategory,
    handleAddEntryWithCategory,
  };
};