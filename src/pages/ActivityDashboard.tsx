
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useSavedEntries } from "@/hooks/useSavedEntries";
import { useStorageStats } from "@/hooks/useStorageStats";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Mic,
  FileText,
  Database,
  Activity,
  BarChart3,
  Clock,
} from "lucide-react";

const ActivityDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { entries } = useSavedEntries();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const now = new Date();
  const rangeMs = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    'all': Infinity,
  };

  const filteredEntries = useMemo(() => {
    if (timeRange === 'all') return entries;
    const cutoff = now.getTime() - rangeMs[timeRange];
    return entries.filter(e => {
      const created = e.createdAt instanceof Date ? e.createdAt.getTime() :
        (e.createdAt as any)?.seconds ? (e.createdAt as any).seconds * 1000 :
        typeof e.createdAt === 'string' ? new Date(e.createdAt).getTime() : 0;
      return created >= cutoff;
    });
  }, [entries, timeRange]);

  // Compute stats
  const totalEntries = filteredEntries.length;

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEntries.forEach(e => {
      const cat = (e as any).category || e.fields?.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [filteredEntries]);

  const brainDumpCount = useMemo(() => {
    return filteredEntries.filter(e => e.fields?.source === 'brain_dump').length;
  }, [filteredEntries]);

  const voiceEntryCount = useMemo(() => {
    return filteredEntries.filter(e =>
      e.fields?.source === 'brain_dump' ||
      e.fields?.source === 'voice' ||
      e.title?.toLowerCase().includes('brain dump')
    ).length;
  }, [filteredEntries]);

  // Entries per day for the last 7 days
  const dailyActivity = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const count = entries.filter(e => {
        const created = e.createdAt instanceof Date ? e.createdAt.getTime() :
          (e.createdAt as any)?.seconds ? (e.createdAt as any).seconds * 1000 : 0;
        return created >= dayStart && created < dayEnd;
      }).length;

      days.push({
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count,
      });
    }
    return days;
  }, [entries]);

  const maxDailyCount = Math.max(...dailyActivity.map(d => d.count), 1);

  // Recent entries
  const recentEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() :
          (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds * 1000 : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() :
          (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds * 1000 : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [entries]);

  // Entries with action items
  const actionItemEntries = useMemo(() => {
    return filteredEntries.filter(e =>
      e.fields?.actionItems && String(e.fields.actionItems).trim().length > 0
    ).length;
  }, [filteredEntries]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
        <nav className="container mx-auto px-4 py-2 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              Activity
            </h1>
            <p className="text-muted-foreground mt-1">Track your usage and productivity trends</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono uppercase text-muted-foreground">Total Entries</span>
                </div>
                <p className="text-3xl font-bold">{totalEntries}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <Mic className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-mono uppercase text-muted-foreground">Voice Entries</span>
                </div>
                <p className="text-3xl font-bold">{voiceEntryCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-mono uppercase text-muted-foreground">Brain Dumps</span>
                </div>
                <p className="text-3xl font-bold">{brainDumpCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-mono uppercase text-muted-foreground">Action Items</span>
                </div>
                <p className="text-3xl font-bold">{actionItemEntries}</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Daily Activity (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {dailyActivity.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-mono text-muted-foreground">{day.count}</span>
                    <div
                      className="w-full bg-primary/80 transition-all"
                      style={{
                        height: `${Math.max((day.count / maxDailyCount) * 120, 4)}px`,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{day.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-500" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No entries yet</p>
                ) : (
                  <div className="space-y-3">
                    {categoryBreakdown.map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{category}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${(count / totalEntries) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-500" />
                  Recent Entries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No entries yet</p>
                ) : (
                  <div className="space-y-2">
                    {recentEntries.map((entry) => {
                      const created = entry.createdAt instanceof Date ? entry.createdAt :
                        (entry.createdAt as any)?.seconds ? new Date((entry.createdAt as any).seconds * 1000) :
                        typeof entry.createdAt === 'string' ? new Date(entry.createdAt) : new Date();

                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-2 bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/all-entries/${entry.id}`)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{entry.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {created.toLocaleDateString()} {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {entry.fields?.source === 'brain_dump' && (
                            <Badge variant="secondary" className="text-xs ml-2">Brain Dump</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActivityDashboard;
