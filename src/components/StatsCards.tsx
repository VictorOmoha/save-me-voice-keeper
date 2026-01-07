
import React from "react";
import { FileText, FolderOpen, HardDrive, Activity } from "lucide-react";
import { SavedEntry } from "@/types/dashboard";
import { useStorageStats } from "@/hooks/useStorageStats";
import { getRecentActivityCount } from "@/utils/storageUtils";
import { toast } from "@/components/ui/use-toast";

interface StatsCardsProps {
  totalEntries: number;
  entries: SavedEntry[];
  userTier?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ totalEntries, entries, userTier = 'free' }) => {
  const storageStats = useStorageStats(entries, userTier);
  const recentActivityCount = getRecentActivityCount(entries);

  React.useEffect(() => {
    try {
      const pct = storageStats.percentage;
      if (pct >= 90) {
        const key = 'quotaWarnedAt';
        const lastShown = Number(localStorage.getItem(key) || '0');
        const bucket = Math.floor(pct / 5) * 5;
        if (bucket > lastShown) {
          toast({
            title: "Storage nearly full",
            description: `You're using ${storageStats.totalUsedFormatted} of ${storageStats.limitFormatted} (${pct}%). Consider cleaning up or upgrading.`,
          });
          localStorage.setItem(key, String(bucket));
        }
      }
    } catch (e) {
      // no-op
    }
  }, [storageStats.percentage, storageStats.totalUsedFormatted, storageStats.limitFormatted]);

  const stats = [
    {
      id: "0x001",
      title: "TOTAL_ENTRIES",
      value: totalEntries.toString(),
      subtitle: "RECORDS_IN_ARCHIVE",
      icon: FileText,
    },
    {
      id: "0x002",
      title: "CATEGORIES",
      value: "5",
      subtitle: "ORGANIZED_COLLECTIONS",
      icon: FolderOpen,
    },
    {
      id: "0x003",
      title: "STORAGE_USED",
      value: storageStats.totalUsedFormatted,
      subtitle: `OF ${storageStats.limitFormatted} AVAILABLE`,
      icon: HardDrive,
      showProgress: true,
      progress: storageStats.percentage
    },
    {
      id: "0x004",
      title: "RECENT_ACTIVITY",
      value: recentActivityCount.toString(),
      subtitle: "ENTRIES_THIS_WEEK",
      icon: Activity,
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className="skeleton-cell group cursor-pointer reveal"
            data-id={stat.id}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="mono text-xs text-muted-foreground mb-2 tracking-wider">
                  {stat.title}
                </p>
                <p className="mono text-2xl md:text-3xl font-bold text-primary mb-1 group-hover:animate-pulse">
                  {stat.value}
                </p>
                <p className="mono text-xs text-muted-foreground">
                  {stat.subtitle}
                </p>
                {stat.showProgress && (
                  <div className="mt-3">
                    <div className="h-1 bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${stat.progress}%` }}
                      />
                    </div>
                    <p className="mono text-xs text-muted-foreground mt-1">
                      {stat.progress}%
                    </p>
                  </div>
                )}
              </div>
              <div className="w-10 h-10 border border-galvanized flex items-center justify-center shrink-0 group-hover:border-primary transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
