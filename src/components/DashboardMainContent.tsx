
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Users, Shield, Zap, Star, Table, Grid3X3 } from "lucide-react";
import { RecentEntries } from "@/components/RecentEntries";
import { StatsCards } from "@/components/StatsCards";
import { DataEntryForm } from "@/components/DataEntryForm";
import { DocumentCreator } from "@/components/DocumentCreator";
import { NewQuickActions } from "@/components/NewQuickActions";
import { FloatingVoiceInput } from "@/components/FloatingVoiceInput";
import { SavedEntry } from "@/types/dashboard";

interface DashboardMainContentProps {
  userName?: string;
  userTier?: string;
  savedEntries: SavedEntry[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showDocumentCreator: boolean;
  showAddEntry: boolean;
  editingEntry: SavedEntry | null;
  fillingEntry: SavedEntry | null;
  getFormTitle: () => string;
  getFormMode: () => 'create' | 'edit' | 'fill';
  onDocumentSave: (document: any) => void;
  onDocumentCancel: () => void;
  onSaveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancelEdit: () => void;
  onCategorySelect: (category: string) => void;
  onAddEntry: () => void;
  onCreateDocument: () => void;
  onEnhancedVoiceInput: (text: string) => void;
  onEditEntry: (entry: SavedEntry) => void;
  onFillEntry: (entry: SavedEntry) => void;
  onDeleteEntry: (id: string) => void;
  onViewAllEntries: () => void;
  isVoiceProcessing?: boolean;
  isSaving?: boolean;
  lastVoiceCommand?: any;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
  onCancelVoice?: () => void;
  conversationData?: { isActive: boolean; currentStep?: { question: string } };
  onViewDocument?: (entry: SavedEntry) => void;
}

const categories = [
  { name: 'Documents', icon: '📄', description: 'Official papers, certificates, contracts' },
  { name: 'Health', icon: '🏥', description: 'Medical records, prescriptions, appointments' },
  { name: 'Contacts', icon: '👥', description: 'People, businesses, emergency contacts' },
  { name: 'Finance', icon: '💰', description: 'Bank info, investments, insurance' },
  { name: 'Personal', icon: '👤', description: 'Personal notes, memories, goals' },
];

export const DashboardMainContent: React.FC<DashboardMainContentProps> = ({
  userName,
  userTier,
  savedEntries,
  searchQuery,
  onSearchChange,
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
  onEnhancedVoiceInput,
  onEditEntry,
  onFillEntry,
  onDeleteEntry,
  onViewAllEntries,
  isVoiceProcessing,
  isSaving,
  lastVoiceCommand,
  conversationState,
  hasPendingConfirmation,
  onCancelVoice,
  conversationData,
  onViewDocument,
}) => {
  if (showDocumentCreator) {
    return (
      <DocumentCreator
        onSave={onDocumentSave}
        onCancel={onDocumentCancel}
      />
    );
  }

  if (showAddEntry || editingEntry || fillingEntry) {
    return (
      <DataEntryForm
        mode={getFormMode()}
        editEntry={editingEntry}
        templateEntry={fillingEntry}
        onSave={onSaveEntry}
        onCancel={onCancelEdit}
        isSaving={isSaving}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}! 
          {userTier && (
            <Badge variant="secondary" className="ml-2">
              {userTier}
            </Badge>
          )}
        </h1>
        <p className="text-lg text-muted-foreground">
          Securely store and manage your important information
        </p>
      </div>

      {/* Quick Actions */}
<NewQuickActions
  onAddEntry={onAddEntry}
  onVoiceInput={() => {}}
  onEnhancedVoiceInput={onEnhancedVoiceInput}
  onCreateDocument={onCreateDocument}
  isVoiceProcessing={isVoiceProcessing}
  lastVoiceCommand={lastVoiceCommand}
  conversationState={conversationState}
  hasPendingConfirmation={hasPendingConfirmation}
  onCancelVoice={onCancelVoice}
  conversationData={conversationData}
  entries={savedEntries}
  searchQuery={searchQuery}
  onSearchChange={onSearchChange}
  onEntrySelect={onViewDocument}
/>

      {/* Stats Cards */}
      <StatsCards 
        totalEntries={savedEntries.length}
        entries={savedEntries}
        userTier={userTier}
      />

      {/* View All Entries - Prominent Access */}
      {savedEntries.length > 0 && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Table className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">View All Entries</CardTitle>
                  <p className="text-sm text-muted-foreground">Browse, search, and manage all your saved data in a comprehensive table</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {savedEntries.length} entries
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Grid3X3 className="h-4 w-4" />
                  <span>Sortable columns</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>Bulk actions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Export options</span>
                </div>
              </div>
              <Button 
                onClick={onViewAllEntries}
                className="bg-primary hover:bg-primary/90"
              >
                <Table className="h-4 w-4 mr-2" />
                Open Table View
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Grid */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-6">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {categories.map((category) => {
            const categoryEntries = savedEntries.filter(entry => {
              const entryCategory = entry.fields.category || 'Personal';
              return entryCategory === category.name;
            });

            return (
              <Card 
                key={category.name}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50"
                onClick={() => onCategorySelect(category.name)}
              >
                <CardHeader className="text-center pb-2">
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                  <Badge variant="outline" className="text-xs">
                    {categoryEntries.length} entries
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Entries */}
      <RecentEntries 
        entries={savedEntries.slice(0, 6)}
        onEdit={onEditEntry}
        onFill={onFillEntry}
        onView={onViewDocument}
        onViewAll={onViewAllEntries}
      />

      {/* Features Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-border">
        <Card className="text-center">
          <CardHeader>
            <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">Secure Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your data is encrypted and stored securely in the cloud
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Find what you need instantly with powerful search and organization
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Star className="h-8 w-8 text-primary mx-auto mb-2" />
            <CardTitle className="text-lg">Smart Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Voice commands, smart templates, and automated organization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Floating Voice Input - Always Available */}
      <FloatingVoiceInput
        savedEntries={savedEntries}
        onCreateEntry={onAddEntry}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
        onSaveEntry={onSaveEntry}
        onCancelEdit={onCancelEdit}
        onEnhancedVoiceInput={onEnhancedVoiceInput}
        isVoiceProcessing={isVoiceProcessing}
        lastVoiceCommand={lastVoiceCommand}
        conversationState={conversationState}
        hasPendingConfirmation={hasPendingConfirmation}
        onCancelVoice={onCancelVoice}
        conversationData={conversationData}
      />
    </div>
  );
};
