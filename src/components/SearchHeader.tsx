
import React, { useState } from "react";
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
import { Plus, Settings, Brain, LogOut, User, CreditCard, HelpCircle, Search } from "lucide-react";
import { SmartSearchWithBoundary as SmartSearch } from "./SmartSearch";
import { SavedEntry } from "@/types/dashboard";
import { EntryViewDialog } from "@/components/recentEntries/EntryViewDialog";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { MobileNavigation } from "./MobileNavigation";
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
  showSettingsShortcut?: boolean;
}


export const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  userName,
  savedEntries,
  onAddEntry,
  onCategorySelect,
  onAllEntriesSelect,
  onEditEntry,
  onFillEntry,
}) => {
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);
  const navigate = useNavigate();

  const handleEntrySelect = (entry: SavedEntry) => {
    setViewingEntry(entry);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast.error("Failed to sign out");
      } else {
        toast.success("Signed out successfully");
        navigate('/login');
      }
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
    <div className="bg-background border-b border-border px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-2 sm:gap-4">
        {/* Mobile Navigation + Logo */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Navigation Trigger */}
          <MobileNavigation
            savedEntriesCount={savedEntries.length}
            onAddEntry={onAddEntry}
            onCategorySelect={onCategorySelect}
            onAllEntriesSelect={onAllEntriesSelect}
            entries={savedEntries}
          />

          {/* Logo/Title */}
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">SaveMe</h1>
          {userName && (
            <span className="hidden lg:inline text-muted-foreground">Welcome, {userName}</span>
          )}
        </div>

        {/* Smart Search Bar - Hidden on mobile, show search icon instead */}
        <div className="hidden sm:flex flex-1 max-w-md mx-2 sm:mx-6">
          <SmartSearch
            entries={savedEntries}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onEntrySelect={handleEntrySelect}
            placeholder="Search with AI intelligence..."
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden min-h-[44px] min-w-[44px]"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          <ThemeToggle />

          {/* Desktop-only buttons */}
          <Button asChild variant="outline" size="sm" className="hidden md:flex">
            <Link to="/brain-dump" className="flex items-center gap-2" aria-label="Open Brain Dump">
              <Brain className="w-4 h-4" />
              <span className="hidden lg:inline">Brain Dump</span>
            </Link>
          </Button>
          <Button
            onClick={onAllEntriesSelect}
            variant="outline"
            size="sm"
            className="hidden lg:flex"
          >
            All Entries
          </Button>
          <Button
            onClick={onAddEntry}
            size="sm"
            className="hidden sm:flex items-center space-x-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Add Entry</span>
          </Button>

          {/* User Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 sm:h-9 sm:w-9 rounded-full min-h-[44px] min-w-[44px]">
                <Avatar className="h-9 w-9">
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
              <DropdownMenuItem onClick={() => navigate('/settings')} className="min-h-[44px]">
                <User className="mr-2 h-4 w-4" />
                <span>Profile & Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/subscription')} className="min-h-[44px]">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Subscription</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/user-guide')} className="min-h-[44px]">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Guide</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 min-h-[44px]">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Breadcrumbs - hidden on mobile */}
      <div className="hidden sm:block max-w-7xl mx-auto mt-2 overflow-x-auto">
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap">
            {breadcrumbs.map((item, idx) => (
              <span key={`${item.label}-${idx}`} className="contents">
                <BreadcrumbItem className="whitespace-nowrap">
                  {item.to && idx !== breadcrumbs.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link to={item.to}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {idx < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator />
                )}
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <EntryViewDialog
        entry={viewingEntry}
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        onEdit={onEditEntry}
        onFill={onFillEntry}
      />
    </div>
  );
};
