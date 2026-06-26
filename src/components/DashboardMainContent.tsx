
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Users, Table, Grid3X3, Heart, DollarSign, User, Mic, Plus, Upload, Search, Sparkles, LucideIcon } from "lucide-react";
import { EnhancedRecentEntries } from "@/components/entries";
import { StatsCards } from "@/components/StatsCards";
import { SavedEntry } from "@/types/dashboard";
import { DashboardIntelligencePanel } from "@/components/dashboard/DashboardIntelligencePanel";
import { SharedMemoryPanel } from "@/components/dashboard/SharedMemoryPanel";
import { SharedMemoryDevPanel } from "@/components/dev/SharedMemoryDevPanel";
import { TaskReminderCard } from "@/components/task-reminders/TaskReminderCard";
import { trackActivationEvent } from "@/lib/analytics";

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
  categories: { name: string; icon: LucideIcon; description: string }[];
  savedEntries: SavedEntry[];
  onCategorySelect: (category: string) => void;
}) => {
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of savedEntries) {
      const cat = typeof entry.fields.category === 'string' && entry.fields.category ? entry.fields.category : 'Personal';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [savedEntries]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-5">Browse by category</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category, index) => (
          <div
            key={category.name}
            className="skeleton-cell cursor-pointer group reveal hover:border-primary/40"
            onClick={() => onCategorySelect(category.name)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <category.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{category.name}</h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 hidden sm:block">{category.description}</p>
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

const STEPS = ["1. Speak naturally", "2. Review the structured memory", "3. Search and open it later"];

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
  const navigate = useNavigate();

  const startVoiceDump = () => {
    trackActivationEvent("brain_dump_start_clicked", { source: "dashboard_first_memory_path" });
    navigate("/brain-dump");
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="text-center reveal">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">Your secure knowledge vault — all data encrypted</p>
        {userTier && (
          <span className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            {userTier} Plan
          </span>
        )}
      </div>

      {/* First memory path */}
      <div className="rounded-2xl p-6 md:p-7 border border-primary/20 bg-gradient-to-b from-primary/[0.07] to-primary/[0.01]">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div className="flex-1 min-w-0">
            <div className="mono text-[11px] tracking-[0.14em] text-primary mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> FIRST MEMORY PATH
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Say one thing you don't want to forget.</h2>
            <p className="text-sm md:text-[15px] text-muted-foreground mt-2">Speak. Nova will turn it into structured memory you own.</p>
          </div>
          <button
            onClick={startVoiceDump}
            className="shrink-0 inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all"
            style={{ boxShadow: "0 0 28px hsla(190,100%,59%,0.4)" }}
          >
            <Mic className="w-4 h-4" />
            Start voice dump
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          {STEPS.map((s) => (
            <div key={s} className="px-4 py-3 rounded-xl bg-card/60 border text-[13px] font-medium text-foreground/90">{s}</div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Quick actions</h2>
        <p className="text-[13px] text-muted-foreground mt-0.5 mb-4">Capture by voice first. Use manual save only when you already know the details.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={onAddEntry} className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border text-sm font-semibold text-foreground hover:border-primary/40 transition-colors">
            <Plus className="w-4 h-4 text-primary" /> Save a memory manually
          </button>
          <button onClick={onCreateDocument} className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border text-sm font-semibold text-foreground hover:border-primary/40 transition-colors">
            <Upload className="w-4 h-4 text-primary" /> Upload document
          </button>
          <div className="flex-1 min-w-[240px] flex items-center gap-2.5 h-12 px-4 rounded-xl bg-card border">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search entries…"
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          </div>
        </div>
      </div>

      {/* Task alarm (real reminder creator) */}
      <TaskReminderCard />

      {/* Stat cards (real data) */}
      <StatsCards totalEntries={savedEntries.length} entries={savedEntries} userTier={userTier} />

      {/* Intelligence layer — includes its own Daily Briefing (real data) */}
      <DashboardIntelligencePanel entries={savedEntries} />

      <SharedMemoryPanel />
      {import.meta.env.DEV && <SharedMemoryDevPanel />}

      {/* View all entries */}
      {savedEntries.length > 0 && (
        <div className="p-6 rounded-2xl border bg-card/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Table className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">View all entries</h3>
                <p className="text-sm text-muted-foreground">Browse and manage your saved data</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {savedEntries.length} {savedEntries.length === 1 ? 'record' : 'records'}
              </span>
              <button
                onClick={onViewAllEntries}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all"
              >
                <Table className="w-4 h-4" />
                Open table view
              </button>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><Grid3X3 className="w-4 h-4" /><span>Sortable</span></div>
            <div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>Bulk actions</span></div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4" /><span>Export</span></div>
          </div>
        </div>
      )}

      {/* Categories */}
      <CategoriesGrid categories={categories} savedEntries={savedEntries} onCategorySelect={onCategorySelect} />

      {/* Recent entries (real data) */}
      <EnhancedRecentEntries
        entries={savedEntries}
        maxEntries={6}
        onEdit={onEditEntry}
        onFill={onFillEntry}
        onUseAsTemplate={onUseAsTemplate}
        onDelete={onDeleteEntry}
        onView={onViewDocument}
        onViewAll={onViewAllEntries}
        title="Recent entries"
        showViewToggle={true}
      />
    </div>
  );
};
