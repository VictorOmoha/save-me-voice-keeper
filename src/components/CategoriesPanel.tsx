
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Heart, Users, DollarSign, User, ChevronRight } from "lucide-react";
import { SavedEntry } from "@/types/dashboard";
import { useCategoryFilter } from "./categoryView/useCategoryFilter";

interface CategoriesPanelProps {
  onCategorySelect: (categoryName: string) => void;
  entries: SavedEntry[];
}

export const CategoriesPanel: React.FC<CategoriesPanelProps> = ({ onCategorySelect, entries }) => {
  const { filterEntriesByCategory } = useCategoryFilter();

  const categories = [
    { name: "Documents", icon: FileText, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" },
    { name: "Health", icon: Heart, color: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" },
    { name: "Contacts", icon: Users, color: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20" },
    { name: "Finance", icon: DollarSign, color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20" },
    { name: "Personal", icon: User, color: "bg-primary/10 text-primary border border-primary/20" },
  ];

  return (
    <Card className="glass-skeletal border-border shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold tracking-tight">Categories</CardTitle>
        <p className="text-sm text-muted-foreground">Organize your information</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const categoryEntries = filterEntriesByCategory(entries, category.name);
            const count = categoryEntries.length;

            return (
              <div
                key={category.name}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 cursor-pointer transition-all duration-200 group border border-transparent hover:border-border/50"
                onClick={() => onCategorySelect(category.name)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-lg ${category.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">{category.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs bg-background/50 border-border/50 font-mono">
                    {count.toString().padStart(2, '0')}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
