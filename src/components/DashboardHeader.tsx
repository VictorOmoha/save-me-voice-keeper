
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Mic, 
  Bell, 
  Sun, 
  Moon,
  LogOut,
  Settings
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/components/ThemeProvider";
import { VoiceInputFixed } from "@/components/VoiceInputFixed";
import { SmartSearch } from "@/components/SmartSearch";
import { SavedEntry } from "@/types/dashboard";
import { EntryViewDialog } from "@/components/recentEntries/EntryViewDialog";

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  onEnhancedVoiceInput?: (text: string) => void;
  isVoiceProcessing?: boolean;
  lastVoiceCommand?: any;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
  onCancelVoice?: () => void;
  conversationData?: { isActive: boolean; currentStep?: { question: string } };
  savedEntries?: SavedEntry[];
  onEditEntry?: (entry: SavedEntry) => void;
  onFillEntry?: (entry: SavedEntry) => void;
}

export const DashboardHeader = ({
  searchQuery,
  onSearchChange,
  userName,
  onEnhancedVoiceInput,
  isVoiceProcessing,
  lastVoiceCommand,
  conversationState,
  hasPendingConfirmation,
  onCancelVoice,
  conversationData,
  savedEntries = [],
  onEditEntry,
  onFillEntry,
}: DashboardHeaderProps) => {
  const { theme, setTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);

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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const userInitials = userName 
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  const handleSuggestionSelect = (suggestion: any) => {
    console.log('Selected suggestion:', suggestion);
    // You can add additional logic here if needed
  };

  const handleEntrySelect = (entry: SavedEntry) => {
    setViewingEntry(entry);
  };

  return (
    <>
      <header className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Smart Search Bar */}
          <div className="flex items-center flex-1 max-w-md">
            <SmartSearch
              entries={savedEntries}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              onSuggestionSelect={handleSuggestionSelect}
              onEntrySelect={handleEntrySelect}
              placeholder="Search your entries..."
              className="w-full"
            />
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-2">
            {/* Mic Icon */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setShowVoiceInput(!showVoiceInput)}
            >
              <Mic className="w-5 h-5" />
            </Button>

            {/* Settings Icon - More Prominent */}
            <Link to="/settings">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </Link>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
            </Button>

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* User Avatar */}
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            {/* Sign Out */}
            <Button 
              variant="ghost" 
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Voice Input Modal/Panel */}
      {showVoiceInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Voice Commands</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowVoiceInput(false)}
              >
                ✕
              </Button>
            </div>
            <VoiceInputFixed 
              onEnhancedVoiceInput={onEnhancedVoiceInput || (() => {})}
              isVoiceProcessing={isVoiceProcessing || false}
              lastVoiceCommand={lastVoiceCommand}
              conversationState={conversationState || 'idle'}
              hasPendingConfirmation={hasPendingConfirmation || false}
              onCancelVoice={onCancelVoice || (() => {})}
              conversationData={{ isActive: false }}
            />
          </div>
        </div>
      )}

      {/* Entry View Dialog */}
      <EntryViewDialog
        entry={viewingEntry}
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        onEdit={onEditEntry}
        onFill={onFillEntry}
      />
    </>
  );
};
