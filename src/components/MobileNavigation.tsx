import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  Menu
} from "lucide-react";
import { SavedEntry } from "@/types/dashboard";
import { useCategoryFilter } from "./categoryView/useCategoryFilter";

interface MobileNavigationProps {
  savedEntriesCount: number;
  onAddEntry: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAllEntriesSelect: () => void;
  entries: SavedEntry[];
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  savedEntriesCount,
  onAddEntry,
  onCategorySelect,
  onAllEntriesSelect,
  entries
}) => {
  const [open, setOpen] = useState(false);
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
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden min-h-[44px] min-w-[44px]"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 overflow-y-auto">
        <SheetHeader className="p-4 sm:p-6 border-b border-border">
          <SheetTitle className="flex items-center space-x-3">
            <img
              src="/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png"
              alt="Save Me Logo"
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Save Me
            </span>
          </SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <div className="flex-1 px-3 sm:px-4 py-4 sm:py-6">
          <nav className="space-y-1 sm:space-y-2">
            <Link to="/dashboard" onClick={handleNavClick}>
              <Button
                variant={location.pathname === "/dashboard" ? "default" : "ghost"}
                className="w-full justify-start min-h-[44px] text-base"
              >
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Dashboard
              </Button>
            </Link>

            <Link to="/all-entries" onClick={handleNavClick}>
              <Button
                variant={location.pathname === "/all-entries" ? "default" : "ghost"}
                className="w-full justify-start min-h-[44px] text-base"
              >
                <FileText className="w-5 h-5 mr-3" />
                All Entries
                <Badge variant="secondary" className="ml-auto">
                  {savedEntriesCount}
                </Badge>
              </Button>
            </Link>

            <Link to="/brain-dump" onClick={handleNavClick}>
              <Button
                variant={location.pathname === "/brain-dump" ? "default" : "ghost"}
                className="w-full justify-start min-h-[44px] text-base"
              >
                <Brain className="w-5 h-5 mr-3" />
                Brain Dump
              </Button>
            </Link>

            <Button
              onClick={() => { onAddEntry(); handleNavClick(); }}
              variant="ghost"
              className="w-full justify-start min-h-[44px] text-base"
            >
              <Plus className="w-5 h-5 mr-3" />
              Add Entry
            </Button>

            <Link to="/settings" onClick={handleNavClick}>
              <Button
                variant={location.pathname === "/settings" ? "default" : "ghost"}
                className="w-full justify-start min-h-[44px] text-base"
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </Button>
            </Link>
          </nav>

          {/* Categories */}
          <div className="mt-6 sm:mt-8">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 sm:mb-4 px-1">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon;
                const categoryEntries = filterEntriesByCategory(entries, category.name);
                const count = categoryEntries.length;

                return (
                  <Link
                    key={category.name}
                    to={`/category/${category.name}`}
                    onClick={handleNavClick}
                  >
                    <Button
                      variant={location.pathname === `/category/${category.name}` ? "default" : "ghost"}
                      className="w-full justify-start min-h-[44px] text-base"
                    >
                      <div className={`w-5 h-5 mr-3 rounded-sm ${category.color} flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5" />
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

        {/* Footer */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="text-xs text-muted-foreground text-center">
            <p>Quick access to settings above</p>
            <p>or via header menu</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
