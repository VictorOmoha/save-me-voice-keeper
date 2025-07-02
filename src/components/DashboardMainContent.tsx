
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/StatsCards";
import { RecentEntries } from "@/components/RecentEntries";
import { CategoriesPanel } from "@/components/CategoriesPanel";
import { NewQuickActions } from "@/components/NewQuickActions";
import { DocumentCreator } from "@/components/DocumentCreator";
import { DataEntryForm } from "@/components/DataEntryForm";
import { SearchBar } from "@/components/SearchBar";
import { VoiceInput } from "@/components/VoiceInput";
import { EnhancedVoiceInput } from "@/components/EnhancedVoiceInput";
import { useTheme } from "@/components/ThemeProvider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Sun, Moon, User, LogOut, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SavedEntry } from "@/pages/Dashboard";

interface DashboardMainContentProps {
  userName?: string;
  userTier?: string;
  savedEntries: SavedEntry[];
  showDocumentCreator: boolean;
  showAddEntry: boolean;
  editingEntry: SavedEntry | null;
  fillingEntry: SavedEntry | null;
  getFormTitle: () => string;
  getFormMode: () => 'create' | 'edit' | 'fill';
  onDocumentSave: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDocumentCancel: () => void;
  onSaveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancelEdit: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAddEntry: () => void;
  onCreateDocument: () => void;
  onVoiceResult: (text: string) => void;
  onVoiceCommand: (command: any) => void;
  onEditEntry: (entry: SavedEntry) => void;
  onFillEntry: (entry: SavedEntry) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onEnhancedVoiceInput: (input: string) => void;
  isVoiceProcessing: boolean;
  lastVoiceCommand: any;
  conversationState: any;
  hasPendingConfirmation: boolean;
  onCancel: () => void;
}

export const DashboardMainContent = ({
  userName,
  userTier = 'free',
  savedEntries,
  showDocumentCreator,
  showAddEntry,
  editingEntry,
  fillingEntry,
  getFormTitle,
  getFormMode,
  onDocumentSave,
  onDocumentCancel,
  onSaveEntry,
  onCancelEdit,
  onCategorySelect,
  onAddEntry,
  onCreateDocument,
  onVoiceResult,
  onVoiceCommand,
  onEditEntry,
  onFillEntry,
  searchQuery,
  onSearchChange,
  onEnhancedVoiceInput,
  isVoiceProcessing,
  lastVoiceCommand,
  conversationState,
  hasPendingConfirmation,
  onCancel,
}: DashboardMainContentProps) => {
  const { theme, setTheme } = useTheme();

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
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your information today.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="max-w-md">
            <SearchBar 
              searchQuery={searchQuery} 
              onSearchChange={onSearchChange}
            />
          </div>
          
          {/* Voice Input (Compact) */}
          <Button variant="ghost" size="sm" className="p-2">
            <Mic className="w-5 h-5" />
          </Button>
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="p-2 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
          </Button>
          
          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" className="p-2" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          
          {/* Profile */}
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden md:block">{userName}</span>
          </div>
          
          {/* Sign Out */}
          <Button 
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards totalEntries={savedEntries.length} entries={savedEntries} userTier={userTier} />

      {/* Document Creator */}
      {showDocumentCreator && (
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <DocumentCreator 
                onSave={onDocumentSave}
                onCancel={onDocumentCancel}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Entry Form */}
      {showAddEntry && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{getFormTitle()}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataEntryForm 
                onSave={onSaveEntry}
                onCancel={onCancelEdit}
                editEntry={editingEntry}
                templateEntry={fillingEntry}
                mode={getFormMode()}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Entries */}
        <div className="lg:col-span-2">
          <RecentEntries 
            entries={savedEntries} 
            onEdit={onEditEntry}
            onFill={onFillEntry}
          />
        </div>

        {/* Categories Panel */}
        <div>
          <CategoriesPanel 
            onCategorySelect={onCategorySelect} 
            entries={savedEntries}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <NewQuickActions 
          onAddEntry={onAddEntry}
          onCreateDocument={onCreateDocument}
          onVoiceInput={() => console.log('Voice quick action - consider implementing VoiceInput component here')}
          onVoiceResult={onVoiceResult}
          onVoiceCommand={onVoiceCommand}
        />
      </div>

      {/* Hidden Voice Components for Functionality */}
      <div className="hidden">
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
      </div>
    </div>
  );
};
