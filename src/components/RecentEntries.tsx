
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
    if (titleLower.includes('document') || titleLower.includes('paper')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    if (titleLower.includes('health') || titleLower.includes('medical')) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    if (titleLower.includes('contact') || titleLower.includes('people')) return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    if (titleLower.includes('bank') || titleLower.includes('finance')) return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
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
          <p className="text-sm text-muted-foreground mt-1">Your latest saved information</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary">
          View all <ExternalLink className="w-4 h-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentEntries.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No entries yet</p>
            </div>
          ) : (
            recentEntries.map((entry) => {
              const Icon = getCategoryIcon(entry.title);
              const categoryColor = getCategoryColor(entry.title);
              const categoryName = getCategoryName(entry.title);
              
              return (
                <div key={entry.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-accent transition-colors">
                  <div className={`w-10 h-10 rounded-lg ${categoryColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-card-foreground truncate">{entry.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {Object.values(entry.fields).slice(0, 2).join(', ')}
                    </p>
                    <div className="flex items-center mt-2 space-x-3">
                      <Badge variant="outline" className="text-xs">
                        {categoryName}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
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
