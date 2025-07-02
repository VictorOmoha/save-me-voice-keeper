
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Heart, Users, DollarSign, User, ChevronRight } from "lucide-react";
import { SavedEntry } from "@/pages/Dashboard";
import { useCategoryFilter } from "./categoryView/useCategoryFilter";

interface CategoriesPanelProps {
  onCategorySelect: (categoryName: string) => void;
  entries: SavedEntry[];
}

export const CategoriesPanel: React.FC<CategoriesPanelProps> = ({ onCategorySelect, entries }) => {
  const { filterEntriesByCategory } = useCategoryFilter();

  const categories = [
    { name: "Documents", icon: FileText, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { name: "Health", icon: Heart, color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
    { name: "Contacts", icon: Users, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
    { name: "Finance", icon: DollarSign, color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { name: "Personal", icon: User, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Categories</CardTitle>
        <p className="text-sm text-muted-foreground">Organize your information</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const categoryEntries = filterEntriesByCategory(entries, category.name);
            const count = categoryEntries.length;
            
            return (
              <div
                key={category.name}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors group"
                onClick={() => onCategorySelect(category.name)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-card-foreground">{category.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {count}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-card-foreground transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
