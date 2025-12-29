
import React, { useState } from "react";
import { SearchHeader } from "../SearchHeader";
import { ConversationalVoiceInterface } from "../ConversationalVoiceInterface";
import { Sidebar, MobileSidebar } from "../Sidebar";
import { FloatingVoiceInput } from "../FloatingVoiceInput";
import { Button } from "@/components/ui/button";
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
        {/* Mobile Header with hamburger */}
        <div className="md:hidden flex items-center p-3 border-b border-border bg-background sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="mr-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-2 flex-1">
            <img
              src="/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png"
              alt="Save Me Logo"
              className="w-7 h-7 object-contain"
            />
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Save Me
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

        {/* Content with Voice Interface */}
        <div className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 bg-card rounded-lg p-3 md:p-6">
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
