
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

interface SidebarProps {
  savedEntriesCount: number;
  onAddEntry: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ savedEntriesCount, onAddEntry }) => {
  const location = useLocation();

  const categories = [
    { name: "Documents", icon: FileText, count: 12, color: "bg-blue-100 text-blue-600" },
    { name: "Health", icon: Heart, count: 8, color: "bg-red-100 text-red-600" },
    { name: "Contacts", icon: Users, count: 24, color: "bg-green-100 text-green-600" },
    { name: "Finance", icon: DollarSign, count: 6, color: "bg-yellow-100 text-yellow-600" },
    { name: "Personal", icon: User, count: 15, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SM</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
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
          
          <Button variant="ghost" className="w-full justify-start">
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
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.name}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <div className={`w-4 h-4 mr-3 rounded-sm ${category.color} flex items-center justify-center`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  {category.name}
                  <Badge variant="outline" className="ml-auto text-xs">
                    {category.count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="w-4 h-4 mr-3" />
          Settings
        </Button>
      </div>
    </div>
  );
};
