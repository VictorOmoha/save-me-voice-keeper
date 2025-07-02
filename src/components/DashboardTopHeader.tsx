
import { SearchBar } from "./SearchBar";
import { VoiceInput } from "./VoiceInput";
import { EnhancedVoiceInput } from "./EnhancedVoiceInput";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VoiceCommand } from "@/utils/voiceCommandProcessor";
import { EnhancedVoiceCommand } from "@/utils/enhancedVoiceProcessor";

interface DashboardTopHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  onVoiceResult: (result: string) => void;
  onVoiceCommand: (command: VoiceCommand) => void;
  onEnhancedVoiceInput: (input: string) => void;
  isVoiceProcessing: boolean;
  lastVoiceCommand: EnhancedVoiceCommand | null;
  conversationState: any;
  hasPendingConfirmation: boolean;
  onCancel: () => void;
}

export const DashboardTopHeader = ({
  searchQuery,
  onSearchChange,
  userName,
  onVoiceResult,
  onVoiceCommand,
  onEnhancedVoiceInput,
  isVoiceProcessing,
  lastVoiceCommand,
  conversationState,
  hasPendingConfirmation,
  onCancel,
}: DashboardTopHeaderProps) => {
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast.error("Failed to sign out");
      } else {
        toast.success("Signed out successfully");
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SearchBar 
            searchQuery={searchQuery} 
            onSearchChange={onSearchChange}
          />
        </div>
        
        <div className="flex items-center space-x-4 ml-6">
          <VoiceInput 
            onVoiceResult={onVoiceResult}
            onVoiceCommand={onVoiceCommand}
          />
          
          <EnhancedVoiceInput
            onVoiceInput={onEnhancedVoiceInput}
            isProcessing={isVoiceProcessing}
            lastCommand={lastVoiceCommand}
            conversationState={conversationState}
            hasPendingConfirmation={hasPendingConfirmation}
            onCancel={onCancel}
          />
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{userName || 'User'}</span>
          </div>
          
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            size="sm"
            className="flex items-center space-x-1"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
