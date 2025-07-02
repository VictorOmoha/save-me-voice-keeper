import { ReactNode } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SavedEntry } from '@/types/dashboard';

interface DashboardLayoutProps {
  children: ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  savedEntries: SavedEntry[];
  onAddEntry: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAllEntriesSelect: () => void;
}

export const DashboardLayout = ({
  children,
  searchQuery,
  onSearchChange,
  userName,
  savedEntries,
  onAddEntry,
  onCategorySelect,
  onAllEntriesSelect,
}: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        savedEntriesCount={savedEntries.length} 
        onAddEntry={onAddEntry}
        onCategorySelect={onCategorySelect}
        onAllEntriesSelect={onAllEntriesSelect}
        entries={savedEntries}
      />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          userName={userName}
        />

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};