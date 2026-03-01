
import React, { useState } from "react";
import { SavedEntry } from "@/types/dashboard";
import { SearchHeader } from "../SearchHeader";
import { Sidebar, MobileSidebar } from "../Sidebar";
import { Menu } from "lucide-react";

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
  onEnhancedVoiceInput?: (transcript: string) => Promise<void> | void;
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
  onEnhancedVoiceInput,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Grid Blueprint Background */}
      <div className="grid-blueprint" />

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          savedEntriesCount={savedEntries.length}
          onAddEntry={onAddEntry}
          onCategorySelect={onCategorySelect}
          onAllEntriesSelect={onAllEntriesSelect}
          entries={savedEntries}
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b bg-background sticky top-0 z-30">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
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
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="p-6 rounded-2xl border bg-card/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
