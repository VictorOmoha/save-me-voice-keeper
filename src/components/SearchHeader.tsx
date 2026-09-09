
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, CreditCard, HelpCircle, ChevronRight } from "lucide-react";
import { SmartSearchWithBoundary as SmartSearch } from "./SmartSearch";
import { SavedEntry } from "@/types/dashboard";
import { EntryViewDialog } from "@/components/recentEntries/EntryViewDialog";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { revokeExtensionCredentials } from "@/services/extensionCredentialService";
import { toast } from "sonner";

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userName?: string;
  savedEntries: SavedEntry[];
  onAddEntry: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAllEntriesSelect: () => void;
  onEditEntry?: (entry: SavedEntry) => void;
  onFillEntry?: (entry: SavedEntry) => void;
  onUseAsTemplate?: (entry: SavedEntry) => void;
  showSettingsShortcut?: boolean;
}


export const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  userName,
  savedEntries,
  onCategorySelect,
  onAllEntriesSelect,
  onEditEntry,
  onFillEntry,
  onUseAsTemplate,
}) => {
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);
  const navigate = useNavigate();

  const handleEntrySelect = (entry: SavedEntry) => {
    setViewingEntry(entry);
  };

  const handleSignOut = async () => {
    try {
      await revokeExtensionCredentials();
      await signOut(auth);
      toast.success("Signed out successfully");
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Failed to sign out");
    }
  };

  const userInitials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const location = useLocation();
  const breadcrumbs = (() => {
    const path = location.pathname;
    const items: { label: string; to?: string }[] = [{ label: "Dashboard", to: "/dashboard" }];
    if (path.includes("/all-entries")) items.push({ label: "All Entries" });
    if (path.startsWith("/category/")) {
      const name = decodeURIComponent(path.split("/category/")[1] || "");
      items.push({ label: "Category", to: "/dashboard" });
      if (name) items.push({ label: name });
    }
    if (path.startsWith("/voice-capture")) items.push({ label: "Voice capture" });
    if (path.startsWith("/brain-dump")) items.push({ label: "Brain dump" });
    if (path.startsWith("/insights")) items.push({ label: "Insights" });
    if (path.startsWith("/briefing")) items.push({ label: "Briefing" });
    if (path.startsWith("/settings")) items.push({ label: "Settings" });
    if (path.startsWith("/subscription")) items.push({ label: "Subscription" });
    return items;
  })();
  return (
    <div className="border-b border-border/60 bg-background/95 px-8 lg:px-10 py-4">
      <div className="flex min-h-11 items-center justify-between gap-5 max-w-[1420px] mx-auto">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((item, idx) => <React.Fragment key={item.label}>
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />}
            {item.to && idx !== breadcrumbs.length - 1
              ? <Link to={item.to} className="hover:text-foreground">{item.label}</Link>
              : <span className="truncate font-medium text-foreground" aria-current="page">{item.label}</span>}
          </React.Fragment>)}
        </nav>

        {/* Smart Search Bar - Skeletal */}
        <div className="flex-1 max-w-md ml-auto">
          <SmartSearch
            entries={savedEntries}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onEntrySelect={handleEntrySelect}
            placeholder="Search your memories…"
            className="w-full workspace-search"
          />
        </div>

        {/* Actions - keep capture CTAs in the dashboard body to avoid duplication */}
        <div className="flex items-center gap-3">
          <button
            onClick={onAllEntriesSelect}
            className="h-11 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            All entries
          </button>

          {/* User Menu Dropdown - Skeletal */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open account menu"
                className="w-10 h-10 rounded-full border border-galvanized bg-card flex items-center justify-center hover:border-primary transition-colors"
              >
                <User className="w-4 h-4 text-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border border-galvanized" align="end" forceMount>
              <DropdownMenuLabel className="font-normal border-b border-galvanized pb-2">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground">{userName || 'User'}</p>
                  <p className="text-xs text-muted-foreground">
                    Account management
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-galvanized" />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="text-sm cursor-pointer hover:bg-primary/10">
                <User className="mr-2 h-4 w-4" />
                <span>Profile settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/subscription')} className="text-sm cursor-pointer hover:bg-primary/10">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Subscription</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/user-guide')} className="text-sm cursor-pointer hover:bg-primary/10">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help guide</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-galvanized" />
              <DropdownMenuItem onClick={handleSignOut} className="text-sm cursor-pointer text-red-500 hover:text-red-400 hover:bg-red-500/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <EntryViewDialog
        entry={viewingEntry}
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        onEdit={onEditEntry}
        onFill={onFillEntry}
        onUseAsTemplate={onUseAsTemplate}
      />
    </div>
  );
};
