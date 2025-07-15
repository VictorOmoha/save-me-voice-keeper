
import { ReactNode } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Sidebar } from "@/components/Sidebar";
import { SavedEntry } from "@/types/dashboard";
import { VoiceCommand } from "@/utils/voiceCommandProcessor";

interface DashboardLayoutProps {
  children: ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  savedEntries: SavedEntry[];
  onAddEntry: () => void;
  onCategorySelect: (category: string) => void;
  onAllEntriesSelect: () => void;
  onEnhancedVoiceInput?: (text: string) => void;
  isVoiceProcessing?: boolean;
  lastVoiceCommand?: any;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
  onCancelVoice?: () => void;
  conversationData?: { isActive: boolean; currentStep?: { question: string } };
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
  onEnhancedVoiceInput,
  isVoiceProcessing,
  lastVoiceCommand,
  conversationState,
  hasPendingConfirmation,
  onCancelVoice,
  conversationData,
}: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        savedEntriesCount={savedEntries.length}
        entries={savedEntries}
        onAddEntry={onAddEntry}
        onCategorySelect={onCategorySelect}
        onAllEntriesSelect={onAllEntriesSelect}
      />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          userName={userName}
          savedEntries={savedEntries}
          onEnhancedVoiceInput={onEnhancedVoiceInput}
          isVoiceProcessing={isVoiceProcessing}
          lastVoiceCommand={lastVoiceCommand}
          conversationState={conversationState}
          hasPendingConfirmation={hasPendingConfirmation}
          onCancelVoice={onCancelVoice}
          conversationData={conversationData}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
