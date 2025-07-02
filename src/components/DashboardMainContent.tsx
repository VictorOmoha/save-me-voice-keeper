
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCards } from "@/components/StatsCards";
import { RecentEntries } from "@/components/RecentEntries";
import { CategoriesPanel } from "@/components/CategoriesPanel";
import { NewQuickActions } from "@/components/NewQuickActions";
import { DocumentCreator } from "@/components/DocumentCreator";
import { DataEntryForm } from "@/components/DataEntryForm";
import { SavedEntry } from "@/pages/Dashboard";

interface DashboardMainContentProps {
  userName?: string;
  savedEntries: SavedEntry[];
  showDocumentCreator: boolean;
  showAddEntry: boolean;
  editingEntry: SavedEntry | null;
  fillingEntry: SavedEntry | null;
  getFormTitle: () => string;
  getFormMode: () => 'create' | 'edit' | 'fill';
  onDocumentSave: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDocumentCancel: () => void;
  onSaveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancelEdit: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAddEntry: () => void;
  onCreateDocument: () => void;
  onVoiceResult: (text: string) => void;
  onVoiceCommand: (command: any) => void;
  onEditEntry: (entry: SavedEntry) => void;
  onFillEntry: (entry: SavedEntry) => void;
}

export const DashboardMainContent = ({
  userName,
  savedEntries,
  showDocumentCreator,
  showAddEntry,
  editingEntry,
  fillingEntry,
  getFormTitle,
  getFormMode,
  onDocumentSave,
  onDocumentCancel,
  onSaveEntry,
  onCancelEdit,
  onCategorySelect,
  onAddEntry,
  onCreateDocument,
  onVoiceResult,
  onVoiceCommand,
  onEditEntry,
  onFillEntry,
}: DashboardMainContentProps) => {
  return (
    <>
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Welcome back, {userName}! 👋
        </h1>
        <p className="text-muted-foreground">Here's what's happening with your information today.</p>
      </div>

      {/* Stats Cards */}
      <StatsCards totalEntries={savedEntries.length} entries={savedEntries} />

      {/* Document Creator */}
      {showDocumentCreator && (
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <DocumentCreator 
                onSave={onDocumentSave}
                onCancel={onDocumentCancel}
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
                onSave={onSaveEntry}
                onCancel={onCancelEdit}
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
          <RecentEntries 
            entries={savedEntries} 
            onEdit={onEditEntry}
            onFill={onFillEntry}
          />
        </div>

        {/* Categories Panel */}
        <div>
          <CategoriesPanel 
            onCategorySelect={onCategorySelect} 
            entries={savedEntries}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <NewQuickActions 
          onAddEntry={onAddEntry}
          onCreateDocument={onCreateDocument}
          onVoiceInput={() => console.log('Voice quick action - consider implementing VoiceInput component here')}
          onVoiceResult={onVoiceResult}
          onVoiceCommand={onVoiceCommand}
        />
      </div>
    </>
  );
};
