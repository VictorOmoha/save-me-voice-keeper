import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { CategoryView } from "@/components/CategoryView";
import { AllEntriesView } from "@/components/AllEntriesView";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardTopHeader } from "@/components/DashboardTopHeader";
import { DashboardMainContent } from "@/components/DashboardMainContent";

export interface FieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea';
}

export interface SavedEntry {
  id: string;
  title: string;
  fields: Record<string, any>;
  fieldDefinitions?: FieldDefinition[];
  createdAt: Date;
  updatedAt: Date;
}

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    savedEntries,
    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,
    saveEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    handleAddEntry,
    handleVoiceResult,
    handleVoiceCommand,
    handleEnhancedVoiceInput,
    isVoiceProcessing,
    lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    cancelCurrentOperation,
    isLoading,
  } = useDashboard();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDocumentCreator, setShowDocumentCreator] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);

  console.log('Dashboard state:', {
    selectedCategory,
    showDocumentCreator,
    showAddEntry,
    showAllEntries,
    editingEntry: editingEntry?.title,
    fillingEntry: fillingEntry?.title,
    totalEntries: savedEntries.length,
    isLoading
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state while entries are being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your entries...</p>
        </div>
      </div>
    );
  }

  const handleCategorySelect = (categoryName: string) => {
    console.log('DIAGNOSTIC: Category select triggered for:', categoryName);
    
    // Reset all form states when switching categories
    setShowDocumentCreator(false);
    setShowAddEntry(false);
    setEditingEntry(null);
    setFillingEntry(null);
    setShowAllEntries(false);
    
    setSelectedCategory(categoryName);
  };

  const handleAllEntriesSelect = () => {
    console.log('DIAGNOSTIC: All Entries select triggered');
    
    // Reset all form states when switching to all entries
    setShowDocumentCreator(false);
    setShowAddEntry(false);
    setEditingEntry(null);
    setFillingEntry(null);
    setSelectedCategory(null);
    
    setShowAllEntries(true);
  };

  const handleBackToMain = () => {
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

  // Update the regular handleAddEntry to support general entry creation
  const handleAddEntryWithCategory = () => {
    console.log('DIAGNOSTIC: General add entry triggered');
    setFillingEntry(null);
    setEditingEntry(null);
    setShowAddEntry(true);
    setShowDocumentCreator(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        savedEntriesCount={savedEntries.length} 
        onAddEntry={handleAddEntryWithCategory}
        onCategorySelect={handleCategorySelect}
        onAllEntriesSelect={handleAllEntriesSelect}
        entries={savedEntries}
      />
      
      <div className="flex-1 flex flex-col">
        <DashboardTopHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          userName={user?.full_name || user?.email}
          entries={savedEntries}
          onVoiceResult={handleVoiceResult}
          onVoiceCommand={handleVoiceCommand}
          onEnhancedVoiceInput={handleEnhancedVoiceInput}
          isVoiceProcessing={isVoiceProcessing}
          lastVoiceCommand={lastVoiceCommand}
          conversationState={conversationState}
          hasPendingConfirmation={hasPendingConfirmation}
          onCancelVoiceOperation={cancelCurrentOperation}
        />

        <main className="flex-1 p-6">
          {showAllEntries ? (
            <AllEntriesView
              entries={savedEntries}
              onBack={handleBackToMain}
              onEdit={editEntry}
              onDelete={deleteEntry}
              onFill={fillEntry}
              showAddEntry={showAddEntry}
              editingEntry={editingEntry}
              fillingEntry={fillingEntry}
              onSaveEntry={saveEntry}
              onCancelEdit={handleCancelEdit}
              getFormTitle={getFormTitle}
              getFormMode={getFormMode}
            />
          ) : selectedCategory ? (
            <CategoryView
              categoryName={selectedCategory}
              entries={savedEntries}
              onBack={handleBackToMain}
              onEdit={editEntry}
              onDelete={deleteEntry}
              onFill={fillEntry}
              onCreateEntry={handleCreateEntryForCategory}
              showDocumentCreator={showDocumentCreator}  
              showAddEntry={showAddEntry}
              editingEntry={editingEntry}
              fillingEntry={fillingEntry}
              onDocumentSave={handleDocumentSave}
              onDocumentCancel={handleDocumentCancel}
              onSaveEntry={saveEntry}
              onCancelEdit={handleCancelEdit}
              getFormTitle={getFormTitle}
              getFormMode={getFormMode}
            />
          ) : (
            <DashboardMainContent
              userName={user?.full_name || user?.email}
              userTier={user?.subscriptionTier}
              savedEntries={savedEntries}
              showDocumentCreator={showDocumentCreator}
              showAddEntry={showAddEntry}
              editingEntry={editingEntry}
              fillingEntry={fillingEntry}
              getFormTitle={getFormTitle}
              getFormMode={getFormMode}
              onDocumentSave={handleDocumentSave}
              onDocumentCancel={handleDocumentCancel}
              onSaveEntry={saveEntry}
              onCancelEdit={handleCancelEdit}
              onCategorySelect={handleCategorySelect}
              onAddEntry={handleAddEntryWithCategory}
              onCreateDocument={handleCreateDocument}
              onVoiceResult={handleVoiceResult}
              onVoiceCommand={handleVoiceCommand}
              onEditEntry={editEntry}
              onFillEntry={fillEntry}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
