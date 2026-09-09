import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Mic, Plus, Upload, ArrowUpRight, ArrowRight, FolderOpen} from "lucide-react";
import {EnhancedRecentEntries} from "@/components/entries";
import {StatsCards} from "@/components/StatsCards";
import {SavedEntry} from "@/types/dashboard";
import {DashboardIntelligencePanel} from "@/components/dashboard/DashboardIntelligencePanel";
import {SharedMemoryPanel} from "@/components/dashboard/SharedMemoryPanel";
import {TaskReminderCard} from "@/components/task-reminders/TaskReminderCard";
import {useCategoryFilter} from "@/components/categoryView/useCategoryFilter";
import {trackActivationEvent} from "@/lib/analytics";

interface DashboardMainContentProps {
  userName?: string;
  userTier?: string;
  savedEntries: SavedEntry[];
  allEntries?: SavedEntry[];
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


export const DashboardMainContent: React.FC<DashboardMainContentProps> = ({
  userName, userTier, savedEntries, allEntries = savedEntries, searchQuery, onSearchChange, onCategorySelect, onAddEntry, onCreateDocument,
  onEditEntry, onFillEntry, onUseAsTemplate, onDeleteEntry, onViewAllEntries, onViewDocument,
}) => {
  const navigate = useNavigate();
  const [showWorkspaceDetails, setShowWorkspaceDetails] = useState(false);
  const {filterEntriesByCategory} = useCategoryFilter();
  const openVoice = () => {
    trackActivationEvent("brain_dump_start_clicked", {source: "dashboard_first_memory_path"});
    navigate("/voice-capture");
  };
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="workspace-eyebrow mb-2">Your space to remember</p>
          <h1 className="text-2xl md:text-[30px] font-semibold tracking-tight leading-tight">Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}.</h1>
          <p className="mt-2 text-sm text-muted-foreground">A little less to hold in your head.</p>
        </div>
        {userTier && <span className="rounded-full border border-border/70 px-3 py-1.5 text-xs text-muted-foreground">{userTier} plan</span>}
      </header>

      <section aria-labelledby="capture-heading" className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.09] to-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="max-w-lg">
            <h2 id="capture-heading" className="text-xl md:text-2xl font-semibold tracking-tight leading-snug">Make room for your next thought.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Save a thought or find a memory. Nova stays with you as you browse.</p>
          </div>
          <button type="button" onClick={openVoice} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2.5 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <Mic className="h-[18px] w-[18px]" />Talk to Nova<ArrowRight className="ml-3 h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-primary/10 pt-4">
          <span className="text-xs text-muted-foreground">Prefer to write?</span>
          <button type="button" onClick={onAddEntry} className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-foreground hover:text-primary"><Plus className="h-4 w-4" />New memory</button>
          <button type="button" onClick={onCreateDocument} className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-foreground hover:text-primary"><Upload className="h-4 w-4" />Upload document</button>
        </div>
      </section>

      <div className="grid items-start gap-6 min-[1180px]:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <EnhancedRecentEntries entries={savedEntries} maxEntries={searchQuery ? 20 : 5} onEdit={onEditEntry} onFill={onFillEntry} onUseAsTemplate={onUseAsTemplate} onDelete={onDeleteEntry} onView={onViewDocument} onViewAll={onViewAllEntries} title={searchQuery ? "Search results" : "Recent memories"} showViewToggle searchQuery={searchQuery} onClearSearch={() => onSearchChange("")} />
          <section aria-labelledby="collections-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="collections-heading" className="text-sm font-semibold">Browse your collections</h2>
              <button type="button" onClick={onViewAllEntries} className="inline-flex min-h-9 items-center gap-1 text-xs text-muted-foreground hover:text-primary">All entries<ArrowUpRight className="h-3.5 w-3.5" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Documents", "Health", "Contacts", "Finance", "Personal"].map((name) => <button type="button" key={name} onClick={() => onCategorySelect(name)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border/70 bg-card px-3 text-xs font-medium hover:border-primary/40 hover:bg-primary/5">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />{name}<span className="ml-1 text-muted-foreground tabular-nums">{filterEntriesByCategory(allEntries, name).length}</span>
              </button>)}
            </div>
          </section>
        </div>
        <aside aria-label="Your day" className="min-w-0 space-y-4">
          <DashboardIntelligencePanel entries={allEntries} compact />
          <details className="workspace-panel group">
            <summary className="cursor-pointer px-5 py-4 text-sm font-medium marker:text-muted-foreground">Create a reminder</summary>
            <div className="px-3 pb-3"><TaskReminderCard compact /></div>
          </details>
          <div className="px-1 text-xs leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">One ongoing conversation.</span> Open Nova from any page to pick up where you left off.</div>
        </aside>
      </div>

      <details className="border-t border-border/60 pt-5" onToggle={(event) => setShowWorkspaceDetails(event.currentTarget.open)}>
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground marker:text-muted-foreground">Workspace details & connected memory</summary>
        {showWorkspaceDetails && <div className="mt-5 space-y-6"><StatsCards totalEntries={allEntries.length} entries={allEntries} userTier={userTier} /><SharedMemoryPanel /></div>}
      </details>
    </div>
  );
};
