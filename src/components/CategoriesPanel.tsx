import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Heart, Users, DollarSign, User, ChevronRight } from "lucide-react";

interface CategoriesPanelProps {
  onCategorySelect: (categoryName: string) => void;
}

export const CategoriesPanel: React.FC<CategoriesPanelProps> = ({ onCategorySelect }) => {
  const categories = [
    { name: "Documents", icon: FileText, count: 12, color: "bg-blue-100 text-blue-600" },
    { name: "Health", icon: Heart, count: 8, color: "bg-red-100 text-red-600" },
    { name: "Contacts", icon: Users, count: 24, color: "bg-green-100 text-green-600" },
    { name: "Finance", icon: DollarSign, count: 6, color: "bg-yellow-100 text-yellow-600" },
    { name: "Personal", icon: User, count: 15, color: "bg-purple-100 text-purple-600" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Categories</CardTitle>
        <p className="text-sm text-gray-600">Organize your information</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.name}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                onClick={() => onCategorySelect(category.name)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {category.count}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
