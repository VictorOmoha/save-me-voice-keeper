
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { CategoryView } from "@/components/CategoryView";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardTopHeader } from "@/components/DashboardTopHeader";
import { DashboardMainContent } from "@/components/DashboardMainContent";
import { CategoryEntryCreator } from "@/components/CategoryEntryCreator";

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
  } = useDashboard();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDocumentCreator, setShowDocumentCreator] = useState(false);

  const categoryEntryCreator = CategoryEntryCreator({
    categoryName: selectedCategory || '',
    onShowDocumentCreator: () => setShowDocumentCreator(true),
    onSetFillingEntry: setFillingEntry,
    onSetEditingEntry: setEditingEntry,
    onSetShowAddEntry: setShowAddEntry,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  const handleBackToMain = () => {
    setSelectedCategory(null);
  };

  const handleCreateDocument = () => {
    setShowDocumentCreator(true);
  };

  const handleDocumentSave = (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    saveEntry(entry);
    setShowDocumentCreator(false);
  };

  const handleDocumentCancel = () => {
    setShowDocumentCreator(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        savedEntriesCount={savedEntries.length} 
        onAddEntry={handleAddEntry}
        onCategorySelect={handleCategorySelect}
      />
      
      <div className="flex-1 flex flex-col">
        <DashboardTopHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          userName={user?.name}
        />

        <main className="flex-1 p-6">
          {selectedCategory ? (
            <CategoryView
              categoryName={selectedCategory}
              entries={savedEntries}
              onBack={handleBackToMain}
              onEdit={editEntry}
              onDelete={deleteEntry}
              onFill={fillEntry}
              onCreateEntry={categoryEntryCreator.handleCreateEntryForCategory}
            />
          ) : (
            <DashboardMainContent
              userName={user?.name}
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
              onAddEntry={handleAddEntry}
              onCreateDocument={handleCreateDocument}
              onVoiceResult={() => handleVoiceResult("")}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
