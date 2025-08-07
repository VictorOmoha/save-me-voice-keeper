
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, FolderOpen, HardDrive, Activity } from "lucide-react";
import { SavedEntry } from "@/types/dashboard";
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
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="transform transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className="hover:shadow-xl transition-all duration-300 ease-in-out border hover:border-primary/30 group cursor-pointer animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 transition-all duration-300 ease-in-out">
                    <p className="text-sm font-medium text-muted-foreground mb-1 transition-colors duration-200 group-hover:text-primary">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-card-foreground mb-1 transition-all duration-300 ease-in-out group-hover:scale-105">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground transition-colors duration-200 group-hover:text-foreground/80">
                      {stat.subtitle || stat.value_subtitle}
                    </p>
                    {stat.showProgress && (
                      <div className="mt-2 transition-all duration-300 ease-in-out">
                        <Progress value={stat.progress} className="h-2 transition-all duration-500 ease-in-out" />
                        <p className="text-xs text-muted-foreground mt-1 transition-colors duration-200 group-hover:text-foreground/70">
                          {stat.progress}% used
                        </p>
                      </div>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`w-6 h-6 ${stat.color} transition-all duration-300 ease-in-out group-hover:scale-110`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};
