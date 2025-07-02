
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, FolderOpen, HardDrive, Activity } from "lucide-react";
import { SavedEntry } from "@/pages/Dashboard";
import { useStorageStats } from "@/hooks/useStorageStats";
import { getRecentActivityCount } from "@/utils/storageUtils";

interface StatsCardsProps {
  totalEntries: number;
  entries: SavedEntry[];
  userTier?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ totalEntries, entries, userTier = 'free' }) => {
  const storageStats = useStorageStats(entries, userTier);
  const recentActivityCount = getRecentActivityCount(entries);
  const stats = [
    {
      title: "Total Entries",
      value: totalEntries.toString(),
      subtitle: "+2 13% from last month",
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Categories",
      value: "5",
      subtitle: "Organized collections",
      icon: FolderOpen,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Storage Used",
      value: storageStats.totalUsedFormatted,
      subtitle: `of ${storageStats.limitFormatted} available`,
      icon: HardDrive,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      showProgress: true,
      progress: storageStats.percentage
    },
    {
      title: "Recent Activity",
      value: recentActivityCount.toString(),
      value_subtitle: "entries this week",
      icon: Activity,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-card-foreground mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stat.subtitle || stat.value_subtitle}
                  </p>
                  {stat.showProgress && (
                    <div className="mt-2">
                      <Progress value={stat.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.progress}% used
                      </p>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
