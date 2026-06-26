
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Heart,
  Users,
  DollarSign,
  User,
  Plus,
  Settings,
  Brain,
  X
} from "lucide-react";
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

export const Sidebar: React.FC<SidebarProps> = ({
  savedEntriesCount,
  onAddEntry,
  onCategorySelect,
  onAllEntriesSelect,
  entries,
  isMobileOpen,
  onMobileClose,
  activeSection
}) => {
  const location = useLocation();
  const { filterEntriesByCategory } = useCategoryFilter();
  const { user } = useAuth();
  const displayName = user?.displayName || user?.email?.split("@")[0] || "You";
  const initial = displayName.charAt(0).toUpperCase();

  const categories = [
    { name: "Documents", icon: FileText },
    { name: "Health", icon: Heart },
    { name: "Contacts", icon: Users },
    { name: "Finance", icon: DollarSign },
    { name: "Personal", icon: User },
  ];

  const handleNavClick = () => {
    onMobileClose?.();
  };

  const isAddEntryActive = activeSection === "add-entry";
  const navItemClass = (isActive: boolean) =>
    `nav-item-skeletal w-full flex items-center gap-3 ${isActive ? 'active' : ''}`;

  const sidebarContent = (
    <>
      {/* Logo - Skeletal */}
      <div className="p-6 border-b border-galvanized flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SAVEME" className="w-6 h-6 object-contain" />
          <span className="mono text-foreground font-bold text-sm tracking-wider">
            SAVEME
          </span>
        </div>
        {isMobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileClose}
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 overflow-y-auto">
        <nav className="space-y-1">
          <Link to="/dashboard" onClick={handleNavClick}>
            <div className={navItemClass(activeSection ? activeSection === "dashboard" : location.pathname === "/dashboard")}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </Link>

          <Link to="/all-entries" onClick={handleNavClick}>
            <div className={navItemClass(activeSection ? activeSection === "all-entries" : location.pathname === "/all-entries")}>
              <FileText className="w-4 h-4" />
              <span>All entries</span>
              <span className="badge-skeletal ml-auto">
                {savedEntriesCount}
              </span>
            </div>
          </Link>

          <Link to="/brain-dump" onClick={handleNavClick}>
            <div className={navItemClass(activeSection ? activeSection === "brain-dump" : location.pathname === "/brain-dump")}>
              <Brain className="w-4 h-4" />
              <span>Start Voice Dump</span>
            </div>
          </Link>

          <button
            onClick={() => {
              onAddEntry();
              handleNavClick();
            }}
            className={navItemClass(isAddEntryActive)}
          >
            <Plus className="w-4 h-4" />
            <span>Save Manually</span>
          </button>

          <Link to="/settings" onClick={handleNavClick}>
            <div className={navItemClass(activeSection ? activeSection === "settings" : location.pathname === "/settings")}>
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </div>
          </Link>
        </nav>

        {/* Categories */}
        <div className="mt-8 pt-6 border-t border-galvanized">
          <h3 className="mono text-xs text-muted-foreground tracking-wider mb-4 px-4">
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              const categoryEntries = filterEntriesByCategory(entries, category.name);
              const count = categoryEntries.length;

              return (
                <Link key={category.name} to={`/category/${category.name}`} onClick={handleNavClick}>
                  <div className={navItemClass(location.pathname === `/category/${category.name}`)}>
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                    <span className="badge-skeletal ml-auto">
                      {count}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="p-3 border-t border-galvanized">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-border">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
            style={{ background: "linear-gradient(135deg,#2dd4ff,#0b8fc4)", color: "#04222e" }}
          >
            {initial}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-[13px] font-semibold text-foreground truncate">{displayName}</div>
            <div className="mono text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" style={{ boxShadow: "0 0 7px #34d399" }} />
              all data encrypted
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="w-64 bg-sidebar-background border-r border-galvanized h-full flex flex-col sidebar-skeletal">
      {sidebarContent}
    </div>
  );
};

// Mobile Sidebar wrapper component
export const MobileSidebar: React.FC<SidebarProps & { isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
  ...props
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
        <Sidebar {...props} isMobileOpen={true} onMobileClose={onClose} />
      </div>
    </>
  );
};
