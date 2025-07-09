
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
  Settings
} from "lucide-react";
import { SavedEntry } from "@/types/dashboard";
import { useCategoryFilter } from "./categoryView/useCategoryFilter";

interface SidebarProps {
  savedEntriesCount: number;
  onAddEntry: () => void;
  onCategorySelect: (categoryName: string) => void;
  onAllEntriesSelect: () => void;
  entries: SavedEntry[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  savedEntriesCount, 
  onAddEntry, 
  onCategorySelect,
  onAllEntriesSelect,
  entries 
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

  return (
    <div className="w-64 bg-background border-r border-border h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-1">
          <img 
            src="/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png" 
            alt="Save Me Logo" 
            className="w-12 h-12 object-contain"
          />
          <span className="text-xl font-bold text-primary">
            Save Me
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          <Link to="/dashboard">
            <Button 
              variant={location.pathname === "/dashboard" ? "default" : "ghost"} 
              className="w-full justify-start"
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
          </Link>
          
          <Button 
            onClick={onAllEntriesSelect}
            variant="ghost" 
            className="w-full justify-start"
          >
            <FileText className="w-4 h-4 mr-3" />
            All Entries
            <Badge variant="secondary" className="ml-auto">
              {savedEntriesCount}
            </Badge>
          </Button>
          
          <Button onClick={onAddEntry} variant="ghost" className="w-full justify-start">
            <Plus className="w-4 h-4 mr-3" />
            Add Entry
          </Button>
        </nav>

        {/* Categories */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              const categoryEntries = filterEntriesByCategory(entries, category.name);
              const count = categoryEntries.length;
              
              return (
                <Button
                  key={category.name}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => onCategorySelect(category.name)}
                >
                  <div className={`w-4 h-4 mr-3 rounded-sm ${category.color} flex items-center justify-center`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  {category.name}
                  <Badge variant="outline" className="ml-auto text-xs">
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-border">
        <Link to="/settings">
          <Button 
            variant={location.pathname === "/settings" ? "default" : "ghost"} 
            className="w-full justify-start"
          >
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  );
};
