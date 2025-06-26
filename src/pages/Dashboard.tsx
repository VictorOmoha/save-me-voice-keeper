
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DataEntryForm } from "@/components/DataEntryForm";
import { EntriesTable } from "@/components/EntriesTable";
import { QuickActions } from "@/components/QuickActions";
import { WelcomeSection } from "@/components/WelcomeSection";
import { SearchBar } from "@/components/SearchBar";
import { useDashboard } from "@/hooks/useDashboard";

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
    editingEntry,
    fillingEntry,
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomeSection userName={user?.name} />

        <QuickActions
          savedEntriesCount={savedEntries.length}
          onAddEntry={handleAddEntry}
          onVoiceResult={handleVoiceResult}
          onVoiceCommand={handleVoiceCommand}
        />

        <SearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

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

        <EntriesTable 
          entries={filteredEntries}
          onDelete={deleteEntry}
          onEdit={editEntry}
          onFill={fillEntry}
          onBulkDelete={bulkDeleteEntries}
        />
      </div>
    </div>
  );
};

export default Dashboard;
