import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DataEntryForm } from "@/components/DataEntryForm";
import { Sidebar } from "@/components/Sidebar";
import { StatsCards } from "@/components/StatsCards";
import { RecentEntries } from "@/components/RecentEntries";
import { CategoriesPanel } from "@/components/CategoriesPanel";
import { CategoryView } from "@/components/CategoryView";
import { NewQuickActions } from "@/components/NewQuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Bell, Moon, User as UserIcon, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";
import { DocumentCreator } from "@/components/DocumentCreator";

export interface FieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea';
}

export interface SavedEntry {
  id: string;
  title: string;
  fields: Record<string, any>;
  fieldDefinitions?: FieldDefinition[]; // Add this to store form structure
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
    bulkDeleteEntries,
    editEntry,
    fillEntry,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    filteredEntries,
    handleVoiceCommand,
    handleAddEntry,
    handleVoiceResult,
  } = useDashboard();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDocumentCreator, setShowDocumentCreator] = useState(false);

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

  const handleCreateEntryForCategory = (categoryName: string) => {
    if (categoryName === "Documents") {
      setShowDocumentCreator(true);
    } else {
      // For other categories, use the regular add entry form with category pre-filled
      setFillingEntry({
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
      });
      setEditingEntry(null);
      setShowAddEntry(true);
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
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search your entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Mic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Moon className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
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
            <>
              {/* Welcome Section */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-gray-600">Here's what's happening with your information today.</p>
              </div>

              {/* Stats Cards */}
              <StatsCards totalEntries={savedEntries.length} />

              {/* Document Creator */}
              {showDocumentCreator && (
                <div className="mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <DocumentCreator 
                        onSave={handleDocumentSave}
                        onCancel={handleDocumentCancel}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Add/Edit Entry Form */}
              {showAddEntry && (
                <div className="mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>{getFormTitle()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DataEntryForm 
                        onSave={saveEntry}
                        onCancel={handleCancelEdit}
                        editEntry={editingEntry}
                        templateEntry={fillingEntry}
                        mode={getFormMode()}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Entries */}
                <div className="lg:col-span-2">
                  <RecentEntries entries={savedEntries} />
                </div>

                {/* Categories Panel */}
                <div>
                  <CategoriesPanel onCategorySelect={handleCategorySelect} />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <NewQuickActions 
                  onAddEntry={handleAddEntry}
                  onCreateDocument={handleCreateDocument}
                  onVoiceInput={() => handleVoiceResult("")}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
