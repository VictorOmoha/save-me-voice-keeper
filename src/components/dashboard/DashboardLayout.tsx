
import React, { useState } from "react";
import { SavedEntry } from "@/types/dashboard";
import { SearchHeader } from "../SearchHeader";
import { Sidebar, MobileSidebar } from "../Sidebar";
import { Menu, Search } from "lucide-react";
import "@/styles/workspace.css";

interface DashboardLayoutProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  savedEntries: SavedEntry[];
  onAddEntry: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAllEntriesSelect: () => void;
  onEditEntry: (entry: SavedEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSaveEntry: (entry: Omit<SavedEntry, "id" | "createdAt" | "updatedAt">) => void;
  onCancelEdit: () => void;
  onFillEntry?: (entry: SavedEntry) => void;
  onUseAsTemplate?: (entry: SavedEntry) => void;
  activeSection?: "dashboard" | "add-entry" | "all-entries" | "brain-dump" | "settings";
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  searchQuery,
  onSearchChange,
  userName,
  savedEntries,
  onAddEntry,
  onCategorySelect,
  onAllEntriesSelect,
  onEditEntry,
  onDeleteEntry,
  onSaveEntry,
  onCancelEdit,
  onFillEntry,
  onUseAsTemplate,
  activeSection,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="workspace-shell min-h-screen flex">

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          savedEntriesCount={savedEntries.length}
          onAddEntry={onAddEntry}
          onCategorySelect={onCategorySelect}
          onAllEntriesSelect={onAllEntriesSelect}
          entries={savedEntries}
          activeSection={activeSection}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        savedEntriesCount={savedEntries.length}
        onAddEntry={onAddEntry}
        onCategorySelect={onCategorySelect}
        onAllEntriesSelect={onAllEntriesSelect}
        entries={savedEntries}
        activeSection={activeSection}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex flex-wrap items-center gap-y-3 p-4 border-b bg-background sticky top-0 z-30">
          <button
            id="workspace-menu-toggle"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="mr-3 w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <img src="/logo.png" alt="SaveMe" className="w-7 h-7 object-contain" />
            <span className="text-foreground font-semibold">
              SaveMe
            </span>
          </div>
          <label className="relative basis-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input type="search" aria-label="Search memories" placeholder="Search your memories…" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} className="h-10 w-full rounded-xl border border-border/70 bg-muted/20 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </label>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            userName={userName}
            savedEntries={savedEntries}
            onAddEntry={onAddEntry}
            onCategorySelect={onCategorySelect}
            onAllEntriesSelect={onAllEntriesSelect}
            onEditEntry={onEditEntry}
            onFillEntry={onFillEntry}
            onUseAsTemplate={onUseAsTemplate}
          />
        </div>

        {/* Main Content */}
        <div
          data-testid="dashboard-content-shell"
          className="flex-1 w-full max-w-[1500px] mx-auto px-4 md:px-8 lg:px-10 pt-6 md:pt-9 pb-28"
        >
          {children}
        </div>
      </div>
    </div>
  );
};
