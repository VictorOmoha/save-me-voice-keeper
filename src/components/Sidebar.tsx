import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Heart, Users, DollarSign, User, Plus, Settings, Brain, Mic, ArrowUpRight, Sunrise, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { SavedEntry } from "@/types/dashboard";
import { useCategoryFilter } from "./categoryView/useCategoryFilter";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  savedEntriesCount: number;
  onAddEntry: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAllEntriesSelect: () => void;
  entries: SavedEntry[];
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  activeSection?: "dashboard" | "add-entry" | "all-entries" | "brain-dump" | "settings";
}

const categories = [
  { name: "Documents", icon: FileText }, { name: "Health", icon: Heart },
  { name: "Contacts", icon: Users }, { name: "Finance", icon: DollarSign }, { name: "Personal", icon: User },
];
const pages = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "dashboard" },
  { to: "/voice-capture", label: "Voice capture", icon: Mic, section: "voice-capture" },
  { to: "/all-entries", label: "All entries", icon: FileText, section: "all-entries" },
  { to: "/brain-dump", label: "Brain dump", icon: Brain, section: "brain-dump" },
  { to: "/briefing", label: "Daily briefing", icon: Sunrise, section: "briefing" },
  { to: "/insights", label: "Insights", icon: Sparkles, section: "insights" },
];

export const Sidebar: React.FC<SidebarProps> = ({savedEntriesCount, onAddEntry, entries, onMobileClose, isMobileOpen, activeSection}) => {
  const {pathname} = useLocation();
  const {filterEntriesByCategory} = useCategoryFilter();
  const {user} = useAuth();
  const displayName = user?.displayName || user?.email?.split("@")[0] || "You";

  return (
    <aside className={`flex w-full md:w-[232px] flex-col border-r border-border/60 bg-card/40 ${isMobileOpen ? "h-full" : "sticky top-0 h-dvh"}`} aria-label="Workspace sidebar">
      <Link to="/dashboard" onClick={onMobileClose} className="flex h-[76px] shrink-0 items-center gap-3 px-6" aria-label="SaveMe dashboard">
        <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
        <span className="text-lg font-bold tracking-tight">SaveMe<span className="text-primary">.</span></span>
      </Link>
      <div className="flex-1 overflow-y-auto px-3 pb-5">
        <p className="workspace-eyebrow px-3 pb-3 pt-5">Workspace</p>
        <nav aria-label="Main navigation" className="space-y-1">
          {pages.map(({to, label, icon: Icon, section}) => {
            const active = activeSection ? activeSection === section : pathname === to || (to === "/all-entries" && pathname.startsWith(to + "/"));
            return <Link key={to} to={to} onClick={onMobileClose} className="workspace-nav-link" aria-current={active ? "page" : undefined}>
              <Icon className="h-[18px] w-[18px] shrink-0" /><span>{label}</span>
              {to === "/all-entries" && <span className="ml-auto text-xs tabular-nums text-muted-foreground">{savedEntriesCount}</span>}
            </Link>;
          })}
        </nav>
        <button type="button" onClick={() => {onAddEntry(); onMobileClose?.();}} className="workspace-nav-link mt-3 w-full border border-border/70 text-foreground" aria-current={activeSection === "add-entry" ? "page" : undefined}>
          <Plus className="h-[18px] w-[18px]" />New memory
        </button>
        <p className="workspace-eyebrow px-3 pb-3 pt-9">Collections</p>
        <nav aria-label="Collections" className="space-y-1">
          {categories.map(({name, icon: Icon}) => {
            const count = filterEntriesByCategory(entries, name).length;
            return <Link key={name} to={`/category/${name}`} onClick={onMobileClose} className="workspace-nav-link" aria-current={pathname === `/category/${name}` ? "page" : undefined}>
              <Icon className="h-[17px] w-[17px] shrink-0" /><span>{name}</span>
              {count > 0 && <span className="ml-auto text-xs tabular-nums">{count}</span>}
            </Link>;
          })}
        </nav>
      </div>
      <div className="shrink-0 px-3 pb-3">
        <Link to="/settings" onClick={onMobileClose} className="workspace-nav-link" aria-current={pathname === "/settings" ? "page" : undefined}><Settings className="h-[18px] w-[18px]" />Settings</Link>
        <div className="mt-3 flex items-center gap-3 border-t border-border/60 px-3 pt-5 pb-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{displayName.charAt(0).toUpperCase()}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{displayName}</p><p className="mt-0.5 text-xs text-muted-foreground">Personal workspace</p></div>
          <Link to="/settings" onClick={onMobileClose} aria-label="Open workspace settings" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"><ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </aside>
  );
};

export const MobileSidebar: React.FC<SidebarProps & {isOpen: boolean; onClose: () => void}> = ({isOpen, onClose, ...props}) => (
  <Sheet open={isOpen} onOpenChange={(open) => {if (!open) onClose();}}>
    <SheetContent side="left" className="workspace-shell w-[280px] max-w-[85vw] p-0" onCloseAutoFocus={(event) => {event.preventDefault(); document.getElementById("workspace-menu-toggle")?.focus();}}>
      <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
      <SheetDescription className="sr-only">Navigate your memories and workspace.</SheetDescription>
      <Sidebar {...props} isMobileOpen onMobileClose={onClose} />
    </SheetContent>
  </Sheet>
);
