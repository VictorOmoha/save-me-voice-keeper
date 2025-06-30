
import { Card, CardContent } from "@/components/ui/card";
import { FileText, FolderOpen, HardDrive, Activity } from "lucide-react";

interface StatsCardsProps {
  totalEntries: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ totalEntries }) => {
  const stats = [
    {
      title: "Total Entries",
      value: totalEntries.toString(),
      subtitle: "+2 13% from last month",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Categories",
      value: "5",
      subtitle: "Organized collections",
      icon: FolderOpen,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Storage Used",
      value: "2.4 GB",
      subtitle: "of 10 GB available",
      icon: HardDrive,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Recent Activity",
      value: "8",
      value_subtitle: "entries this week",
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
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
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">
                    {stat.subtitle || stat.value_subtitle}
                  </p>
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
