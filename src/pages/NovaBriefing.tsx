import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSavedEntries } from "@/hooks/useSavedEntries";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Radar, CheckSquare, Link2, Brain, BellRing, Sparkles, ArrowRight, PlusCircle, Mic } from "lucide-react";
import { getEntryIntelligenceSignals } from "@/utils/entryIntelligence";
import { novaBriefingClient } from "@/utils/novaBriefingClient";

type BriefingScope = "today" | "week" | "month" | "all";
type BriefingFocus = "overview" | "action" | "connections" | "deadlines";

const rangeDaysMap: Record<BriefingScope, number> = {
  today: 1,
  week: 7,
  month: 30,
  all: Infinity,
};

const scopeToBackendTimeframe: Record<BriefingScope, string> = {
  today: "today",
  week: "this_week",
  month: "this_month",
  all: "this_month",
};

const NovaBriefing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedEntries } = useSavedEntries();
  const [scope, setScope] = useState<BriefingScope>("week");
  const [focus, setFocus] = useState<BriefingFocus>("overview");
  const [backendBriefing, setBackendBriefing] = useState<string | null>(null);
  const [backendDeadlines, setBackendDeadlines] = useState<Array<{ id: string; text: string; due_date?: string | null; entry_id?: string | null }>>([]);
  const [backendActivitySummary, setBackendActivitySummary] = useState<{ totalEntries: number; openActionItems: number; recentTitles: string[] } | null>(null);
  const [backendRelatedEntries, setBackendRelatedEntries] = useState<Array<{ id: string; title: string; summary?: string | null }>>([]);
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [clientSessionId, setClientSessionId] = useState<string | null>(null);

  const scopedEntries = useMemo(() => {
    if (scope === "all") return savedEntries;
    const now = Date.now();
    const cutoff = now - rangeDaysMap[scope] * 24 * 60 * 60 * 1000;
    return savedEntries.filter((entry) => new Date(entry.updatedAt).getTime() >= cutoff);
  }, [savedEntries, scope]);

  const enrichedEntries = useMemo(() => {
    return scopedEntries
      .map((entry) => ({ entry, intelligence: getEntryIntelligenceSignals(entry) }))
      .filter(({ intelligence }) => intelligence.isEnriched)
      .slice(0, 12);
  }, [scopedEntries]);

  const topActionEntries = useMemo(() => {
    return [...enrichedEntries]
      .sort((a, b) => b.intelligence.actionItemCount - a.intelligence.actionItemCount)
      .filter(({ intelligence }) => intelligence.actionItemCount > 0)
      .slice(0, 5);
  }, [enrichedEntries]);

  const linkedEntries = useMemo(() => {
    return [...enrichedEntries]
      .sort((a, b) => b.intelligence.linkedCount - a.intelligence.linkedCount)
      .filter(({ intelligence }) => intelligence.linkedCount > 0)
      .slice(0, 5);
  }, [enrichedEntries]);

  const deadlineEntries = useMemo(() => {
    return enrichedEntries
      .filter(({ intelligence }) => intelligence.reminderLikeCount > 0)
      .slice(0, 5);
  }, [enrichedEntries]);

  useEffect(() => {
    const loadBackendBriefing = async () => {
      if (!user) return;

      try {
        setIsBackendLoading(true);
        setBackendError(null);

        const subject = topActionEntries[0]?.entry.title || linkedEntries[0]?.entry.title || "my work";
        const timeframe = scopeToBackendTimeframe[scope];

        const [briefingResult, activityResult, deadlinesResult, relatedResult] = await Promise.all([
          novaBriefingClient.prepareBriefing(subject, "general", clientSessionId),
          novaBriefingClient.getActivitySummary(timeframe, clientSessionId),
          novaBriefingClient.getUpcomingDeadlines(timeframe, clientSessionId),
          novaBriefingClient.getRelatedEntries(subject, 5, clientSessionId),
        ]);

        setBackendBriefing(briefingResult.briefing || null);
        setBackendActivitySummary({
          totalEntries: activityResult.totalEntries,
          openActionItems: activityResult.openActionItems,
          recentTitles: activityResult.recentTitles,
        });
        setBackendDeadlines(deadlinesResult.items || []);
        setBackendRelatedEntries(relatedResult.entries || []);
        setClientSessionId(
          briefingResult.sessionId ||
          activityResult.sessionId ||
          deadlinesResult.sessionId ||
          relatedResult.sessionId ||
          clientSessionId
        );
      } catch (error: any) {
        console.error("[NovaBriefing] backend briefing load failed", error);
        setBackendError(error?.message || "Failed to load backend briefing intelligence.");
      } finally {
        setIsBackendLoading(false);
      }
    };

    loadBackendBriefing();
  }, [user, scope, topActionEntries, linkedEntries]);

  const recommendedMoves = useMemo(() => {
    const moves: { title: string; description: string; target?: string; actionLabel: string }[] = [];

    if (topActionEntries[0]) {
      moves.push({
        title: `Resolve action pressure in ${topActionEntries[0].entry.title}`,
        description: `${topActionEntries[0].intelligence.actionItemCount} action items are sitting in this entry.`,
        target: `/all-entries/${topActionEntries[0].entry.id}`,
        actionLabel: "Open entry",
      });
    }

    if (backendDeadlines[0]?.entry_id) {
      moves.push({
        title: `Review backend deadline: ${backendDeadlines[0].text}`,
        description: backendDeadlines[0].due_date ? `Due ${new Date(backendDeadlines[0].due_date).toLocaleString()}` : "Backend flagged this as upcoming.",
        target: `/all-entries/${backendDeadlines[0].entry_id}`,
        actionLabel: "Review deadline",
      });
    } else if (deadlineEntries[0]) {
      moves.push({
        title: `Check deadline context in ${deadlineEntries[0].entry.title}`,
        description: `This entry contains due/reminder-like signals that may need an explicit next step.`,
        target: `/all-entries/${deadlineEntries[0].entry.id}`,
        actionLabel: "Review deadline",
      });
    }

    if (linkedEntries[0]) {
      moves.push({
        title: `Review connected context around ${linkedEntries[0].entry.title}`,
        description: `${linkedEntries[0].intelligence.linkedCount} linked relationships suggest this entry anchors a broader thread.`,
        target: `/all-entries/${linkedEntries[0].entry.id}`,
        actionLabel: "Open cluster",
      });
    }

    if (moves.length === 0) {
      moves.push({
        title: "Capture more context",
        description: "Nova needs more active signals before it can recommend stronger next moves.",
        target: "/dashboard?action=create",
        actionLabel: "Create entry",
      });
    }

    return moves.slice(0, 3);
  }, [topActionEntries, deadlineEntries, linkedEntries, backendDeadlines]);

  const briefingSummary = useMemo(() => {
    const lines: string[] = [];
    if (backendActivitySummary) {
      lines.push(`Backend summary: ${backendActivitySummary.totalEntries} entries in scope, ${backendActivitySummary.openActionItems} open action items.`);
    }
    if (topActionEntries.length > 0) {
      lines.push(`${topActionEntries.length} entries contain actionable follow-up in the current ${scope} scope.`);
    }
    if (linkedEntries.length > 0) {
      lines.push(`${linkedEntries.length} entries are strongly connected to other context.`);
    }
    if (deadlineEntries.length > 0 || backendDeadlines.length > 0) {
      lines.push(`${Math.max(deadlineEntries.length, backendDeadlines.length)} entries or tasks carry deadline/reminder pressure.`);
    }
    if (enrichedEntries.length > 0) {
      lines.push(`${enrichedEntries.length} enriched entries are active in your knowledge graph.`);
    }
    if (lines.length === 0) {
      lines.push("Nova needs more structured context before a meaningful briefing can be assembled.");
    }
    return lines;
  }, [topActionEntries, linkedEntries, deadlineEntries, enrichedEntries, scope, backendActivitySummary, backendDeadlines]);

  const quickIntents = [
    { label: "Action Focus", description: "Show me what needs to move next.", onClick: () => setFocus("action") },
    { label: "Relationship Focus", description: "Show the most connected entries.", onClick: () => setFocus("connections") },
    { label: "Deadline Focus", description: "Surface reminder and due pressure.", onClick: () => setFocus("deadlines") },
    { label: "Open Insights", description: "Switch to deeper analytics.", onClick: () => navigate("/insights") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
        <nav className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">Nova Briefing</Badge>
            <Select value={scope} onValueChange={(value) => setScope(value as BriefingScope)}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Scope" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Radar className="h-8 w-8 text-primary" />
            {user?.displayName ? `${user.displayName.split(' ')[0]}'s` : 'Your'} Nova Briefing
          </h1>
          <p className="text-muted-foreground mt-2">
            A synthesized view of pressure, action, memory, and connection across your vault.
          </p>
        </div>

        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background">
          <CardHeader><CardTitle>Today’s Synthesis</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isBackendLoading && <p className="text-sm text-muted-foreground">Loading backend briefing intelligence…</p>}
            {backendBriefing && <p className="text-sm text-foreground leading-relaxed">{backendBriefing}</p>}
            {briefingSummary.map((line, index) => (
              <p key={index} className="text-sm text-foreground">{line}</p>
            ))}
            {backendError && <p className="text-xs text-amber-600">Backend briefing fallback active: {backendError}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" />Recommended Next Moves</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedMoves.map((move) => (
              <div key={move.title} className="rounded-xl border p-4">
                <p className="text-sm font-medium text-foreground">{move.title}</p>
                <p className="text-xs text-muted-foreground mt-2">{move.description}</p>
                <Button className="mt-4 w-full" size="sm" onClick={() => move.target && navigate(move.target)}>{move.actionLabel}</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Briefing Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto py-4" onClick={() => navigate('/dashboard?action=create')}><PlusCircle className="w-4 h-4 mr-2" />Create follow-up entry</Button>
            <Button variant="outline" className="justify-start h-auto py-4" onClick={() => navigate('/settings?tab=data-management')}><BellRing className="w-4 h-4 mr-2" />Review reminders & exports</Button>
            <Button variant="outline" className="justify-start h-auto py-4" onClick={() => navigate('/brain-dump')}><Mic className="w-4 h-4 mr-2" />Start brain dump</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Quick Brief Intents</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickIntents.map((intent) => (
              <button key={intent.label} type="button" className="rounded-xl border p-4 text-left hover:bg-muted/50 transition-colors" onClick={intent.onClick}>
                <p className="text-sm font-medium text-foreground">{intent.label}</p>
                <p className="text-xs text-muted-foreground mt-2">{intent.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Tabs value={focus} onValueChange={(value) => setFocus(value as BriefingFocus)}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="action">Action</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Brain className="h-5 w-5 text-primary" />Backend Related Context</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {backendRelatedEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No backend-related context available yet.</p>
                ) : backendRelatedEntries.map((entry) => (
                  <button key={entry.id} type="button" className="w-full rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors" onClick={() => navigate(`/all-entries/${entry.id}`)}>
                    <p className="text-sm font-medium text-foreground">{entry.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{entry.summary || 'Related context surfaced from backend intelligence.'}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="action" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CheckSquare className="h-5 w-5 text-green-500" />Action Pressure</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {topActionEntries.length === 0 ? <p className="text-sm text-muted-foreground">No action-heavy entries yet.</p> : topActionEntries.map(({ entry, intelligence }) => (
                  <button key={entry.id} type="button" className="w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors" onClick={() => navigate(`/all-entries/${entry.id}`)}>
                    <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">{entry.title}</p><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                    <p className="text-xs text-muted-foreground mt-1">{intelligence.actionItemCount} action item{intelligence.actionItemCount > 1 ? 's' : ''}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Link2 className="h-5 w-5 text-primary" />Most Connected</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {linkedEntries.length === 0 ? <p className="text-sm text-muted-foreground">No strong graph links surfaced yet.</p> : linkedEntries.map(({ entry, intelligence }) => (
                  <button key={entry.id} type="button" className="w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors" onClick={() => navigate(`/all-entries/${entry.id}`)}>
                    <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">{entry.title}</p><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                    <p className="text-xs text-muted-foreground mt-1">{intelligence.linkedCount} linked entr{intelligence.linkedCount > 1 ? 'ies' : 'y'}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deadlines" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BellRing className="h-5 w-5 text-amber-500" />Deadlines & Reminders</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {backendDeadlines.length > 0 ? backendDeadlines.map((item) => (
                  <button key={item.id} type="button" className="w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors" onClick={() => item.entry_id ? navigate(`/all-entries/${item.entry_id}`) : undefined}>
                    <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">{item.text}</p><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                    <p className="text-xs text-muted-foreground mt-1">{item.due_date ? new Date(item.due_date).toLocaleString() : 'Upcoming from backend deadline feed.'}</p>
                  </button>
                )) : deadlineEntries.length === 0 ? <p className="text-sm text-muted-foreground">No deadline-weighted entries detected.</p> : deadlineEntries.map(({ entry }) => (
                  <button key={entry.id} type="button" className="w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors" onClick={() => navigate(`/all-entries/${entry.id}`)}>
                    <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">{entry.title}</p><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
                    <p className="text-xs text-muted-foreground mt-1">Deadline signal detected in saved fields.</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default NovaBriefing;
