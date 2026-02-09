
import React, { useState } from "react";
import { SearchHeader } from "../SearchHeader";
import { ConversationalVoiceInterface } from "../ConversationalVoiceInterface";
import { Sidebar, MobileSidebar } from "../Sidebar";
import { FloatingVoiceInput } from "../FloatingVoiceInput";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  savedEntries: any[];
  onAddEntry: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAllEntriesSelect: () => void;
  onEditEntry: (entry: any) => void;
  onDeleteEntry: (id: string) => void;
  onSaveEntry: (entry: any) => void;
  onCancelEdit: () => void;
  onFillEntry?: (entry: any) => void;
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
        {/* Mobile Header - Skeletal */}
        <div className="md:hidden flex items-center p-3 border-b border-galvanized bg-background sticky top-0 z-30">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="mr-3 w-9 h-9 border border-galvanized flex items-center justify-center hover:border-primary transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <img src="/saveme-logo.svg" alt="SAVEME" className="w-6 h-6 object-contain" />
            <span className="mono text-foreground font-bold text-sm tracking-wider">
              SAVEME
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

        {/* Content with Voice Interface - Skeletal Grid */}
        <div className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 galvanized-card p-4 md:p-6">
            {/* Voice Interface - Always visible on the left on desktop */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-6">
                <ConversationalVoiceInterface
                  savedEntries={savedEntries}
                  onCreateEntry={onAddEntry}
                  onEditEntry={onEditEntry}
                  onDeleteEntry={onDeleteEntry}
                  onSaveEntry={onSaveEntry}
                  onCancelEdit={onCancelEdit}
                  onEnhancedVoiceInput={onEnhancedVoiceInput as any}
                />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {children}
            </div>
          </div>
          {/* Floating mic for small screens */}
          <div className="lg:hidden">
            <FloatingVoiceInput
              savedEntries={savedEntries}
              onCreateEntry={onAddEntry}
              onEditEntry={onEditEntry}
              onDeleteEntry={onDeleteEntry}
              onSaveEntry={onSaveEntry}
              onCancelEdit={onCancelEdit}
              onEnhancedVoiceInput={(text) => onEnhancedVoiceInput?.(text)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
