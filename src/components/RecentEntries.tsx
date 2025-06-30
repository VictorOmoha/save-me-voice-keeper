
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SavedEntry } from "@/pages/Dashboard";
import { FileText, Heart, Users, DollarSign, User, ExternalLink } from "lucide-react";

interface RecentEntriesProps {
  entries: SavedEntry[];
}

export const RecentEntries: React.FC<RecentEntriesProps> = ({ entries }) => {
  const getCategoryIcon = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('document') || titleLower.includes('paper')) return FileText;
    if (titleLower.includes('health') || titleLower.includes('medical')) return Heart;
    if (titleLower.includes('contact') || titleLower.includes('people')) return Users;
    if (titleLower.includes('bank') || titleLower.includes('finance')) return DollarSign;
    return User;
  };

  const getCategoryColor = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('document') || titleLower.includes('paper')) return 'bg-blue-100 text-blue-600';
    if (titleLower.includes('health') || titleLower.includes('medical')) return 'bg-red-100 text-red-600';
    if (titleLower.includes('contact') || titleLower.includes('people')) return 'bg-green-100 text-green-600';
    if (titleLower.includes('bank') || titleLower.includes('finance')) return 'bg-yellow-100 text-yellow-600';
    return 'bg-purple-100 text-purple-600';
  };

  const getCategoryName = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('document') || titleLower.includes('paper')) return 'Documents';
    if (titleLower.includes('health') || titleLower.includes('medical')) return 'Health';
    if (titleLower.includes('contact') || titleLower.includes('people')) return 'Contacts';
    if (titleLower.includes('bank') || titleLower.includes('finance')) return 'Finance';
    return 'Personal';
  };

  const recentEntries = entries.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Recent Entries</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Your latest saved information</p>
        </div>
        <Button variant="ghost" size="sm" className="text-blue-600">
          View all <ExternalLink className="w-4 h-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentEntries.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No entries yet</p>
            </div>
          ) : (
            recentEntries.map((entry) => {
              const Icon = getCategoryIcon(entry.title);
              const categoryColor = getCategoryColor(entry.title);
              const categoryName = getCategoryName(entry.title);
              
              return (
                <div key={entry.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-lg ${categoryColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{entry.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {Object.values(entry.fields).slice(0, 2).join(', ')}
                    </p>
                    <div className="flex items-center mt-2 space-x-3">
                      <Badge variant="outline" className="text-xs">
                        {categoryName}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
