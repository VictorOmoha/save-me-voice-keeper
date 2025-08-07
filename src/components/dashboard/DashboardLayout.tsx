
import React from "react";
import { SearchHeader } from "../SearchHeader";
import { ConversationalVoiceInterface } from "../ConversationalVoiceInterface";
import { Sidebar } from "../Sidebar";

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
  children,
}) => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar
        savedEntriesCount={savedEntries.length}
        onAddEntry={onAddEntry}
        onCategorySelect={onCategorySelect}
        onAllEntriesSelect={onAllEntriesSelect}
        entries={savedEntries}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
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

        {/* Content with Voice Interface */}
        <div className="flex-1 container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Voice Interface - Always visible on the left */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <ConversationalVoiceInterface
                  savedEntries={savedEntries}
                  onCreateEntry={onAddEntry}
                  onEditEntry={onEditEntry}
                  onDeleteEntry={onDeleteEntry}
                  onSaveEntry={onSaveEntry}
                  onCancelEdit={onCancelEdit}
                />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
