
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface SidebarProps {
  savedEntriesCount: number;
  onAddEntry: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAllEntriesSelect: () => void;
  entries: SavedEntry[];
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  savedEntriesCount,
  onAddEntry,
  onCategorySelect,
  onAllEntriesSelect,
  entries,
  isMobileOpen,
  onMobileClose
}) => {
  const location = useLocation();
  const { filterEntriesByCategory } = useCategoryFilter();

  const categories = [
    { name: "Documents", icon: FileText, color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" },
    { name: "Health", icon: Heart, color: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" },
    { name: "Contacts", icon: Users, color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300" },
    { name: "Finance", icon: DollarSign, color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300" },
    { name: "Personal", icon: User, color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300" },
  ];

  const handleNavClick = () => {
    // Close mobile menu when navigating
    onMobileClose?.();
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 md:p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src="/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png"
            alt="Save Me Logo"
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
          />
          <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Save Me
          </span>
        </div>
        {/* Close button for mobile */}
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
      <div className="flex-1 px-3 md:px-4 py-4 md:py-6 overflow-y-auto">
        <nav className="space-y-1 md:space-y-2">
          <Link to="/dashboard" onClick={handleNavClick}>
            <Button
              variant={location.pathname === "/dashboard" ? "default" : "ghost"}
              className="w-full justify-start transition-colors duration-200 hover:bg-muted h-10 md:h-10"
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
          </Link>


          <Link to="/all-entries" onClick={handleNavClick}>
            <Button
              variant={location.pathname === "/all-entries" ? "default" : "ghost"}
              className="w-full justify-start transition-colors duration-200 hover:bg-muted h-10 md:h-10"
            >
              <FileText className="w-4 h-4 mr-3" />
              All Entries
              <Badge variant="secondary" className="ml-auto text-xs">
                {savedEntriesCount}
              </Badge>
            </Button>
          </Link>

          <Link to="/brain-dump" onClick={handleNavClick}>
            <Button
              variant={location.pathname === "/brain-dump" ? "default" : "ghost"}
              className="w-full justify-start transition-colors duration-200 hover:bg-muted h-10 md:h-10"
            >
              <Brain className="w-4 h-4 mr-3" />
              Brain Dump
            </Button>
          </Link>

          <Button
            onClick={() => {
              onAddEntry();
              handleNavClick();
            }}
            variant="ghost"
            className="w-full justify-start h-10 md:h-10"
          >
            <Plus className="w-4 h-4 mr-3" />
            Add Entry
          </Button>

          {/* Settings Button in main nav for better visibility */}
          <Link to="/settings" onClick={handleNavClick}>
            <Button
              variant={location.pathname === "/settings" ? "default" : "ghost"}
              className="w-full justify-start transition-colors duration-200 hover:bg-muted h-10 md:h-10"
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Button>
          </Link>
        </nav>

        {/* Categories */}
        <div className="mt-6 md:mt-8">
          <h3 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 md:mb-4 px-1">
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              const categoryEntries = filterEntriesByCategory(entries, category.name);
              const count = categoryEntries.length;

              return (
                <Link key={category.name} to={`/category/${category.name}`} onClick={handleNavClick}>
                  <Button
                    variant={location.pathname === `/category/${category.name}` ? "default" : "ghost"}
                    className="w-full justify-start transition-colors duration-200 hover:bg-muted h-9 md:h-10 text-sm"
                  >
                    <div className={`w-4 h-4 mr-3 rounded-sm ${category.color} flex items-center justify-center`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    {category.name}
                    <Badge variant="outline" className="ml-auto text-xs">
                      {count}
                    </Badge>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Access Info - hide on mobile */}
      <div className="hidden md:block p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <p>Quick access to settings above</p>
          <p>or via header menu</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="w-64 bg-background border-r border-border h-full flex flex-col">
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
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
        <Sidebar {...props} isMobileOpen={true} onMobileClose={onClose} />
      </div>
    </>
  );
};
