import {WorkspacePage, WorkspacePageHeader} from '@/components/workspace/WorkspacePage';
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
  const [backendMode, setBackendMode] = useState<"loading" | "ready" | "partial" | "fallback">("loading");
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
        setBackendMode("loading");

        const subject = topActionEntries[0]?.entry.title || linkedEntries[0]?.entry.title || "my work";
        const timeframe = scopeToBackendTimeframe[scope];

        const [briefingResult, activityResult, deadlinesResult, relatedResult] = await Promise.all([
          novaBriefingClient.prepareBriefing(subject, "general", clientSessionId),
          novaBriefingClient.getActivitySummary(timeframe, clientSessionId),
          novaBriefingClient.getUpcomingDeadlines(timeframe, clientSessionId),
          novaBriefingClient.getRelatedEntries(subject, 5, clientSessionId),
        ]);

        const results = [briefingResult, activityResult, deadlinesResult, relatedResult];
        const successCount = results.filter((result) => result.success).length;
        const errorMessages = results
          .map((result) => result.error)
          .filter((error): error is string => Boolean(error));

        if (briefingResult.success) {
          setBackendBriefing(briefingResult.briefing || null);
        } else {
          setBackendBriefing(null);
        }

        if (activityResult.success) {
          setBackendActivitySummary({
            totalEntries: activityResult.totalEntries,
            openActionItems: activityResult.openActionItems,
            recentTitles: activityResult.recentTitles,
          });
        } else {
          setBackendActivitySummary(null);
        }

        setBackendDeadlines(deadlinesResult.success ? (deadlinesResult.items || []) : []);
        setBackendRelatedEntries(relatedResult.success ? (relatedResult.entries || []) : []);

        if (successCount === results.length) {
          setBackendMode("ready");
          setBackendError(null);
        } else if (successCount > 0) {
          setBackendMode("partial");
          setBackendError(errorMessages.join(" • ") || "Some backend briefing systems are unavailable.");
        } else {
          setBackendMode("fallback");
          setBackendError(errorMessages.join(" • ") || "Failed to load backend briefing intelligence.");
        }

        setClientSessionId(
          briefingResult.sessionId ||
          activityResult.sessionId ||
          deadlinesResult.sessionId ||
          relatedResult.sessionId ||
          clientSessionId
        );
      } catch (error: unknown) {
        console.error("[NovaBriefing] backend briefing load failed", error);
        setBackendMode("fallback");
        setBackendError(error instanceof Error ? error.message : "Failed to load backend briefing intelligence.");
        setBackendBriefing(null);
        setBackendActivitySummary(null);
        setBackendDeadlines([]);
        setBackendRelatedEntries([]);
      } finally {
        setIsBackendLoading(false);
      }
    };

    loadBackendBriefing();
  }, [user, scope, topActionEntries, linkedEntries, clientSessionId]);

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
      lines.push("Save a few more memories with tasks or reminders to build your briefing.");
    }
    return lines;
  }, [topActionEntries, linkedEntries, deadlineEntries, enrichedEntries, scope, backendActivitySummary, backendDeadlines]);

  const quickIntents = [
    { label: "Action Focus", description: "Show me what needs to move next.", onClick: () => setFocus("action") },
    { label: "Relationship Focus", description: "Show the most connected entries.", onClick: () => setFocus("connections") },
    { label: "Deadline Focus", description: "See upcoming reminders and due dates.", onClick: () => setFocus("deadlines") },
    { label: "Open Insights", description: "Explore patterns in your memories.", onClick: () => navigate("/insights") },
  ];

  return (
    <WorkspacePage>
      <WorkspacePageHeader title="Daily briefing" description="Your next steps, upcoming reminders, and useful connections in one place." actions={
        <Select value={scope} onValueChange={value => setScope(value as BriefingScope)}>
          <SelectTrigger aria-label="Briefing period" className="w-36 min-h-11"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="week">This week</SelectItem><SelectItem value="month">This month</SelectItem><SelectItem value="all">All time</SelectItem></SelectContent>
        </Select>} />
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background">
          <CardHeader><CardTitle>At a glance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isBackendLoading && <p className="text-sm text-muted-foreground">Preparing your briefing…</p>}
            {backendMode === "ready" && <p className="text-xs text-emerald-600">Briefing up to date.</p>}
            {backendMode === "partial" && <p className="text-xs text-amber-600">Some updates are still unavailable.</p>}
            {backendMode === "fallback" && <p className="text-xs text-amber-600">Live briefing is unavailable. Here is what your saved memories show.</p>}
            {backendBriefing && <p className="text-sm text-foreground leading-relaxed">{backendBriefing}</p>}
            {briefingSummary.map((line, index) => (
              <p key={index} className="text-sm text-foreground">{line}</p>
            ))}

          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" />Suggested next steps</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-lg">Quick actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto py-4" onClick={() => navigate('/dashboard?action=create')}><PlusCircle className="w-4 h-4 mr-2" />Create follow-up entry</Button>
            <Button variant="outline" className="justify-start h-auto py-4" onClick={() => navigate('/settings?tab=data-management')}><BellRing className="w-4 h-4 mr-2" />Review reminders & exports</Button>
            <Button variant="outline" className="justify-start h-auto py-4" onClick={() => navigate('/brain-dump')}><Mic className="w-4 h-4 mr-2" />Start brain dump</Button>
          </CardContent>
        </Card>

        <Tabs value={focus} onValueChange={(value) => setFocus(value as BriefingFocus)}>
          <TabsList className="grid h-auto grid-cols-2 sm:grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="action">Action</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Brain className="h-5 w-5 text-primary" />Related memories</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {backendRelatedEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No related memories in this period yet.</p>
                ) : backendRelatedEntries.map((entry) => (
                  <button key={entry.id} type="button" className="w-full rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors" onClick={() => navigate(`/all-entries/${entry.id}`)}>
                    <p className="text-sm font-medium text-foreground">{entry.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{entry.summary || 'Open this memory to see its details.'}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="action" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CheckSquare className="h-5 w-5 text-green-500" />Next actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {topActionEntries.length === 0 ? <p className="text-sm text-muted-foreground">No action items in this period yet.</p> : topActionEntries.map(({ entry, intelligence }) => (
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
      </div>
    </WorkspacePage>
  );
};

export default NovaBriefing;
