
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { CategoryView } from "@/components/CategoryView";
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
  } = useDashboard();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDocumentCreator, setShowDocumentCreator] = useState(false);

  console.log('Dashboard state:', {
    selectedCategory,
    showDocumentCreator,
    showAddEntry,
    editingEntry: editingEntry?.title,
    fillingEntry: fillingEntry?.title
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleCategorySelect = (categoryName: string) => {
    console.log('Category selected:', categoryName);
    setSelectedCategory(categoryName);
  };

  const handleBackToMain = () => {
    console.log('Back to main dashboard');
    setSelectedCategory(null);
  };

  const handleCreateDocument = () => {
    console.log('Create document triggered');
    setShowDocumentCreator(true);
  };

  const handleDocumentSave = (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Document save triggered:', entry.title);
    saveEntry(entry);
    setShowDocumentCreator(false);
  };

  const handleDocumentCancel = () => {
    console.log('Document creation cancelled');
    setShowDocumentCreator(false);
  };

  const handleCreateEntryForCategory = (categoryName: string) => {
    console.log('Creating entry for category:', categoryName);
    
    if (categoryName === "Documents") {
      console.log('Opening document creator');
      setShowDocumentCreator(true);
    } else {
      console.log('Setting up form for category:', categoryName);
      // For other categories, use the regular add entry form with category pre-filled
      const templateEntry = {
        id: 'template',
        title: `New ${categoryName.slice(0, -1)}`,
        fields: {
          category: categoryName,
          // Add default fields based on category
          ...(categoryName === "Health" && {
            doctor: '',
            condition: '',
            medication: '',
            date: '',
            notes: ''
          }),
          ...(categoryName === "Contacts" && {
            name: '',
            phone: '',
            email: '',
            address: '',
            relationship: ''
          }),
          ...(categoryName === "Finance" && {
            accountType: '',
            institution: '',
            accountNumber: '',
            balance: '',
            notes: ''
          }),
          ...(categoryName === "Personal" && {
            type: '',
            description: '',
            value: '',
            location: '',
            notes: ''
          })
        },
        fieldDefinitions: [
          { id: '1', name: 'category', type: 'text' as const },
          // Add field definitions based on category
          ...(categoryName === "Health" ? [
            { id: '2', name: 'doctor', type: 'text' as const },
            { id: '3', name: 'condition', type: 'text' as const },
            { id: '4', name: 'medication', type: 'text' as const },
            { id: '5', name: 'date', type: 'date' as const },
            { id: '6', name: 'notes', type: 'textarea' as const }
          ] : []),
          ...(categoryName === "Contacts" ? [
            { id: '2', name: 'name', type: 'text' as const },
            { id: '3', name: 'phone', type: 'text' as const },
            { id: '4', name: 'email', type: 'text' as const },
            { id: '5', name: 'address', type: 'textarea' as const },
            { id: '6', name: 'relationship', type: 'text' as const }
          ] : []),
          ...(categoryName === "Finance" ? [
            { id: '2', name: 'accountType', type: 'text' as const },
            { id: '3', name: 'institution', type: 'text' as const },
            { id: '4', name: 'accountNumber', type: 'text' as const },
            { id: '5', name: 'balance', type: 'number' as const },
            { id: '6', name: 'notes', type: 'textarea' as const }
          ] : []),
          ...(categoryName === "Personal" ? [
            { id: '2', name: 'type', type: 'text' as const },
            { id: '3', name: 'description', type: 'textarea' as const },
            { id: '4', name: 'value', type: 'text' as const },
            { id: '5', name: 'location', type: 'text' as const },
            { id: '6', name: 'notes', type: 'textarea' as const }
          ] : [])
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Template entry created:', templateEntry);
      setFillingEntry(templateEntry);
      setEditingEntry(null);
      setShowAddEntry(true);
      console.log('State updated - showAddEntry:', true, 'fillingEntry set');
    }
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
              onCreateEntry={handleCreateEntryForCategory}
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
