
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
    if (path.startsWith("/settings")) items.push({ label: "Settings" });
    if (path.startsWith("/subscription")) items.push({ label: "Subscription" });
    return items;
  })();
  return (
    <div className="bg-background border-b border-galvanized px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo/Title - Skeletal */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SAVEME" className="w-6 h-6 object-contain" />
            <span className="mono text-foreground font-bold text-sm tracking-wider">
              SAVEME
            </span>
          </div>
          {userName && (
            <span className="mono text-xs text-muted-foreground tracking-wide">
              :: {userName.split(' ')[0].toUpperCase()}
            </span>
          )}
        </div>

        {/* Smart Search Bar - Skeletal */}
        <div className="flex-1 max-w-md mx-6">
          <SmartSearch
            entries={savedEntries}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onEntrySelect={handleEntrySelect}
            placeholder="Search saved information..."
            className="w-full input-skeletal"
          />
        </div>

        {/* Actions - keep capture CTAs in the dashboard body to avoid duplication */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(45,212,255,.08)", border: "1px solid rgba(45,212,255,.18)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px #34d399" }} />
            <span className="mono text-[11px] tracking-[0.08em] text-[#9fdcef]">NOVA ONLINE</span>
          </div>
          <button
            onClick={onAllEntriesSelect}
            className="btn-galvanized btn-galvanized-secondary"
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
                  <p className="mono text-sm font-bold text-foreground">{userName || 'User'}</p>
                  <p className="mono text-xs text-muted-foreground">
                    Account management
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-galvanized" />
              <DropdownMenuItem onClick={() => navigate('/settings')} className="mono text-xs cursor-pointer hover:bg-primary/10">
                <User className="mr-2 h-4 w-4" />
                <span>Profile settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/subscription')} className="mono text-xs cursor-pointer hover:bg-primary/10">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Subscription</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/user-guide')} className="mono text-xs cursor-pointer hover:bg-primary/10">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help guide</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-galvanized" />
              <DropdownMenuItem onClick={handleSignOut} className="mono text-xs cursor-pointer text-red-500 hover:text-red-400 hover:bg-red-500/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Breadcrumbs - Skeletal */}
      <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-galvanized">
        <div className="flex items-center gap-2 mono text-xs text-muted-foreground">
          {breadcrumbs.map((item, idx) => (
            <span key={`${item.label}-${idx}`} className="flex items-center gap-2">
              {item.to && idx !== breadcrumbs.length - 1 ? (
                <Link to={item.to} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground">{item.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && (
                <ChevronRight className="w-3 h-3" />
              )}
            </span>
          ))}
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
