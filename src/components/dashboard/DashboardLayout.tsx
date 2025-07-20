
import React from "react";
import { SearchHeader } from "../SearchHeader";
import { ConversationalVoiceInterface } from "../ConversationalVoiceInterface";

interface DashboardLayoutProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  savedEntries: any[];
  onAddEntry: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAllEntriesSelect: () => void;
  onEnhancedVoiceInput: (text: string) => void;
  isVoiceProcessing?: boolean;
  lastVoiceCommand?: any;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
  onCancelVoice?: () => void;
  conversationData?: { isActive: boolean };
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
  onEnhancedVoiceInput,
  isVoiceProcessing,
  lastVoiceCommand,
  conversationState,
  hasPendingConfirmation,
  onCancelVoice,
  conversationData,
  children,
}) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        userName={userName}
        savedEntries={savedEntries}
        onAddEntry={onAddEntry}
        onCategorySelect={onCategorySelect}
        onAllEntriesSelect={onAllEntriesSelect}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Voice Interface - Always visible on the left */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ConversationalVoiceInterface
                onEnhancedVoiceInput={onEnhancedVoiceInput}
                className="mb-4"
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
  );
};
