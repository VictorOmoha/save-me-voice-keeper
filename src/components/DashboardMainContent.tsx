
import React, { useMemo } from "react";
import { FileText, Users, Shield, Zap, Star, Table, Grid3X3, Heart, DollarSign, User, LucideIcon } from "lucide-react";
import { EnhancedRecentEntries } from "@/components/entries";
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

const categories: { name: string; icon: LucideIcon; description: string }[] = [
  { name: 'Documents', icon: FileText, description: 'Official papers, certificates, contracts' },
  { name: 'Health', icon: Heart, description: 'Medical records, prescriptions, appointments' },
  { name: 'Contacts', icon: Users, description: 'People, businesses, emergency contacts' },
  { name: 'Finance', icon: DollarSign, description: 'Bank info, investments, insurance' },
  { name: 'Personal', icon: User, description: 'Personal notes, memories, goals' },
];

// Memoized categories grid to prevent re-renders
const CategoriesGrid = React.memo(({
  categories,
  savedEntries,
  onCategorySelect
}: {
  categories: typeof categories;
  savedEntries: SavedEntry[];
  onCategorySelect: (category: string) => void;
}) => {
  // Pre-compute category counts once
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of savedEntries) {
      const cat = entry.fields.category || 'Personal';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [savedEntries]);

  return (
    <div>
      <h2 className="mono text-xs text-muted-foreground tracking-wider mb-4">BROWSE_BY_CATEGORY</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category, index) => (
          <div
            key={category.name}
            className="category-card-skeletal group reveal"
            onClick={() => onCategorySelect(category.name)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-10 h-10 border border-galvanized flex items-center justify-center mb-3 group-hover:border-primary transition-colors">
              <category.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="mono text-sm font-bold text-foreground mb-1">
              {category.name.toUpperCase()}
            </h3>
            <p className="mono text-xs text-muted-foreground mb-3 line-clamp-2 hidden sm:block">
              {category.description}
            </p>
            <span className="badge-skeletal">
              {categoryCounts[category.name] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
CategoriesGrid.displayName = 'CategoriesGrid';

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
      {/* Welcome Section - Skeletal */}
      <div className="text-center reveal">
        <div className="protocol-tag mb-4">PROTOCOL: DATA_MANAGEMENT</div>
        <h1 className="archive-title text-2xl md:text-3xl mb-3">
          WELCOME_BACK{userName ? `::${userName.split(' ')[0].toUpperCase()}` : ''}
        </h1>
        {userTier && (
          <span className="badge-skeletal">
            TIER::{userTier.toUpperCase()}
          </span>
        )}
        <p className="mono text-sm text-muted-foreground mt-3">
          SECURE ARCHIVE SYSTEM :: ALL TRANSMISSIONS ENCRYPTED
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

      {/* View All Entries - Skeletal */}
      {savedEntries.length > 0 && (
        <div className="skeleton-cell" data-id="0x100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-galvanized flex items-center justify-center">
                <Table className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="mono text-lg font-bold text-foreground">VIEW_ALL_ENTRIES</h3>
                <p className="mono text-xs text-muted-foreground">BROWSE AND MANAGE YOUR SAVED DATA</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="badge-skeletal">
                {savedEntries.length} RECORDS
              </span>
              <button
                onClick={onViewAllEntries}
                className="btn-galvanized btn-galvanized-primary"
              >
                <Table className="w-4 h-4" />
                OPEN_TABLE_VIEW
              </button>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 mt-4 pt-4 border-t border-galvanized mono text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              <span>SORTABLE</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>BULK_ACTIONS</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>EXPORT</span>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid - Skeletal */}
      <CategoriesGrid
        categories={categories}
        savedEntries={savedEntries}
        onCategorySelect={onCategorySelect}
      />

      {/* Recent Entries - Enhanced Display */}
      <EnhancedRecentEntries
        entries={savedEntries}
        maxEntries={6}
        onEdit={onEditEntry}
        onFill={onFillEntry}
        onDelete={onDeleteEntry}
        onView={onViewDocument}
        onViewAll={onViewAllEntries}
        title="Recent Entries"
        showViewToggle={true}
      />

      {/* Features Preview - Skeletal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-galvanized">
        <div className="skeleton-cell text-center reveal" data-id="F001">
          <div className="w-12 h-12 border border-galvanized flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h3 className="mono text-sm font-bold text-foreground mb-2">SECURE_STORAGE</h3>
          <p className="mono text-xs text-muted-foreground">
            YOUR DATA IS ENCRYPTED AND STORED SECURELY
          </p>
        </div>

        <div className="skeleton-cell text-center reveal" data-id="F002" style={{ animationDelay: '100ms' }}>
          <div className="w-12 h-12 border border-galvanized flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h3 className="mono text-sm font-bold text-foreground mb-2">QUICK_ACCESS</h3>
          <p className="mono text-xs text-muted-foreground">
            FIND WHAT YOU NEED INSTANTLY WITH POWERFUL SEARCH
          </p>
        </div>

        <div className="skeleton-cell text-center reveal" data-id="F003" style={{ animationDelay: '200ms' }}>
          <div className="w-12 h-12 border border-galvanized flex items-center justify-center mx-auto mb-4">
            <Star className="w-6 h-6 text-primary" />
          </div>
          <h3 className="mono text-sm font-bold text-foreground mb-2">SMART_FEATURES</h3>
          <p className="mono text-xs text-muted-foreground">
            VOICE COMMANDS, TEMPLATES, AND AUTO ORGANIZATION
          </p>
        </div>
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
