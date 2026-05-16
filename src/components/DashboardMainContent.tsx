
import React, { useMemo } from "react";
import { FileText, Users, Shield, Zap, Star, Table, Grid3X3, Heart, DollarSign, User, LucideIcon } from "lucide-react";
import { EnhancedRecentEntries } from "@/components/entries";
import { StatsCards } from "@/components/StatsCards";
import { NewQuickActions } from "@/components/NewQuickActions";
import { SavedEntry } from "@/types/dashboard";
import { DashboardIntelligencePanel } from "@/components/dashboard/DashboardIntelligencePanel";
import { SharedMemoryPanel } from "@/components/dashboard/SharedMemoryPanel";
import { SharedMemoryDevPanel } from "@/components/dev/SharedMemoryDevPanel";
import { TaskReminderCard } from "@/components/task-reminders/TaskReminderCard";

interface DashboardMainContentProps {
  userName?: string;
  userTier?: string;
  savedEntries: SavedEntry[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCategorySelect: (category: string) => void;
  onAddEntry: () => void;
  onCreateDocument: () => void;
  onEditEntry: (entry: SavedEntry) => void;
  onFillEntry: (entry: SavedEntry) => void;
  onUseAsTemplate: (entry: SavedEntry) => void;
  onDeleteEntry: (id: string) => void;
  onViewAllEntries: () => void;
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
      <h2 className="text-lg font-semibold text-foreground mb-6">Browse by Category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category, index) => (
          <div
            key={category.name}
            className="p-6 rounded-xl border cursor-pointer group reveal transition-all hover:shadow-lg"
            onClick={() => onCategorySelect(category.name)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <category.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {category.name}
            </h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 hidden sm:block">
              {category.description}
            </p>
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
              {categoryCounts[category.name] || 0} {(categoryCounts[category.name] || 0) === 1 ? 'item' : 'items'}
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
  onCategorySelect,
  onAddEntry,
  onCreateDocument,
  onEditEntry,
  onFillEntry,
  onUseAsTemplate,
  onDeleteEntry,
  onViewAllEntries,
  onViewDocument,
}) => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center reveal">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}
        </h1>
        {userTier && (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            {userTier} Plan
          </span>
        )}
        <p className="text-sm text-muted-foreground mt-3">
          Your secure knowledge vault — all data encrypted
        </p>
      </div>

      {/* Quick Actions */}
      <NewQuickActions
        onAddEntry={onAddEntry}
        onCreateDocument={onCreateDocument}
        entries={savedEntries}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onEntrySelect={onViewDocument}
      />

      <TaskReminderCard />

      {/* Stats Cards */}
      <StatsCards
        totalEntries={savedEntries.length}
        entries={savedEntries}
        userTier={userTier}
      />

      {/* Intelligence Layer */}
      <DashboardIntelligencePanel entries={savedEntries} />

      <SharedMemoryPanel />
      {import.meta.env.DEV && <SharedMemoryDevPanel />}

      {/* View All Entries */}
      {savedEntries.length > 0 && (
        <div className="p-6 rounded-xl border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Table className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">View All Entries</h3>
                <p className="text-sm text-muted-foreground">Browse and manage your saved data</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {savedEntries.length} {savedEntries.length === 1 ? 'record' : 'records'}
              </span>
              <button
                onClick={onViewAllEntries}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Table className="w-4 h-4" />
                Open Table View
              </button>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Grid3X3 className="w-4 h-4" />
              <span>Sortable</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Bulk Actions</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Export</span>
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
        onUseAsTemplate={onUseAsTemplate}
        onDelete={onDeleteEntry}
        onView={onViewDocument}
        onViewAll={onViewAllEntries}
        title="Recent Entries"
        showViewToggle={true}
      />

      {/* Features Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t">
        <div className="p-6 rounded-xl border bg-card text-center reveal transition-all hover:shadow-lg">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Secure Storage</h3>
          <p className="text-xs text-muted-foreground">
            Your data is encrypted and stored securely
          </p>
        </div>

        <div className="p-6 rounded-xl border bg-card text-center reveal transition-all hover:shadow-lg" style={{ animationDelay: '100ms' }}>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Quick Access</h3>
          <p className="text-xs text-muted-foreground">
            Find what you need instantly with powerful search
          </p>
        </div>

        <div className="p-6 rounded-xl border bg-card text-center reveal transition-all hover:shadow-lg" style={{ animationDelay: '200ms' }}>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Star className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Smart Features</h3>
          <p className="text-xs text-muted-foreground">
            Voice commands, templates, and auto organization
          </p>
        </div>
      </div>

      {/* Nova AI handles voice — see NovaFloat in App.tsx */}
    </div>
  );
};
