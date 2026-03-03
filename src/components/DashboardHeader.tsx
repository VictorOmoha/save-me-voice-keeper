
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sun,
  Moon,
  LogOut,
  Settings,
  User,
  CreditCard,
  HelpCircle
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { useTheme } from "@/components/ThemeProvider";
import { SmartSearchWithBoundary as SmartSearch } from "@/components/SmartSearch";
import { SavedEntry } from "@/types/dashboard";
import { EntryViewDialog } from "@/components/recentEntries/EntryViewDialog";
import { NotificationsPanel } from "@/components/NotificationsPanel";

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  savedEntries?: SavedEntry[];
  onEditEntry?: (entry: SavedEntry) => void;
  onFillEntry?: (entry: SavedEntry) => void;
}

export const DashboardHeader = ({
  searchQuery,
  onSearchChange,
  userName,
  savedEntries = [],
  onEditEntry,
  onFillEntry,
}: DashboardHeaderProps) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      window.location.href = '/login';
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

  const handleSuggestionSelect = (suggestion: unknown) => {
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
            {/* Settings Icon */}
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
            <NotificationsPanel />

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Manage your account
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/subscription')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/user-guide')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Guide</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

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
