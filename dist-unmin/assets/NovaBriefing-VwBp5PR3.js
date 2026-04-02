import { a as reactExports, j as jsxRuntimeExports } from "./vendor-ui-CLSr_GWM.js";
import { c as createLucideIcon, P as getFirebaseIdToken, Q as getCloudFunctionUrl, b as useNavigate, u as useAuth, B as Button, C as Card, e as CardHeader, f as CardTitle, h as CardContent, S as Sparkles, M as Mic, m as Brain } from "./index-CT7EzYyk.js";
import { B as Badge } from "./badge-CRUpIyW6.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-D07uVuEF.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CyBQ8QTa.js";
import { u as useSavedEntries } from "./useSavedEntries-BbNCU1rB.js";
import { g as getEntryIntelligenceSignals } from "./entryIntelligence-oCqMJs6N.js";
import { A as ArrowLeft } from "./arrow-left-CCcLkmU5.js";
import { R as Radar, B as BellRing } from "./radar-Ch-ViE1I.js";
import { S as SquareCheckBig, L as Link2 } from "./square-check-big-Clnf_GY-.js";
import { A as ArrowRight } from "./arrow-right-BytWGEK7.js";
import "./vendor-charts-hYiuCXaC.js";
import "./vendor-firebase-N64baH19.js";
import "./check-CZQFmZAj.js";
const CirclePlus = createLucideIcon("CirclePlus", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M8 12h8", key: "1wcyev" }],
  ["path", { d: "M12 8v8", key: "napkw2" }]
]);
const VOICE_AGENT_URL = getCloudFunctionUrl("voiceAgent");
const getAuthToken = async () => {
  return getFirebaseIdToken();
};
const extractToolResult = (response, toolName) => {
  const action = response.actionsExecuted?.find((item) => item.tool === toolName);
  return action?.result || null;
};
const extractEnvelope = (response, toolName) => {
  const result = extractToolResult(response, toolName);
  if (!result) {
    return {
      success: false,
      data: {},
      error: `Tool result missing for ${toolName}`
    };
  }
  if (result.success === false) {
    return {
      success: false,
      data: result.data || {},
      error: result.error || `Tool ${toolName} failed`
    };
  }
  return {
    success: true,
    data: result.data || result,
    error: null
  };
};
const callBriefingTool = async (toolName, args, sessionId) => {
  const token = await getAuthToken();
  const transcriptMap = {
    prepareBriefing: `prepare a briefing about ${args.subject}`,
    getActivitySummary: `show my ${args.timeframe || "this_week"} activity summary`,
    getUpcomingDeadlines: `what is due ${args.timeframe || "this_week"}`,
    getRelatedEntries: `find related entries for ${args.topic}`
  };
  const response = await fetch(VOICE_AGENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      transcript: transcriptMap[toolName],
      conversationHistory: [],
      sessionId: sessionId || null,
      debugToolOverride: {
        tool: toolName,
        args
      }
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Voice agent request failed (${response.status})`);
  }
  const data = await response.json();
  return {
    raw: data,
    toolResult: extractToolResult(data, toolName),
    envelope: extractEnvelope(data, toolName),
    sessionId: data.sessionId || sessionId || null
  };
};
const novaBriefingClient = {
  async prepareBriefing(subject, type = "general", sessionId) {
    const { envelope, sessionId: nextSessionId } = await callBriefingTool("prepareBriefing", { subject, type }, sessionId);
    return {
      success: envelope.success,
      briefing: envelope.data?.briefing || "I couldn't prepare a briefing right now.",
      entriesUsed: envelope.data?.entriesUsed || 0,
      memoriesUsed: envelope.data?.memoriesUsed || 0,
      openActionItems: envelope.data?.openActionItems || 0,
      error: envelope.error,
      sessionId: nextSessionId
    };
  },
  async getActivitySummary(timeframe = "this_week", sessionId) {
    const { envelope, sessionId: nextSessionId } = await callBriefingTool("getActivitySummary", { timeframe }, sessionId);
    return {
      success: envelope.success,
      totalEntries: envelope.data?.totalEntries || 0,
      categoryCounts: envelope.data?.categoryCounts || {},
      recentTitles: envelope.data?.recentTitles || [],
      openActionItems: envelope.data?.openActionItems || 0,
      timeframe: envelope.data?.timeframe || timeframe,
      error: envelope.error,
      sessionId: nextSessionId
    };
  },
  async getUpcomingDeadlines(timeframe = "this_week", sessionId) {
    const { envelope, sessionId: nextSessionId } = await callBriefingTool("getUpcomingDeadlines", { timeframe }, sessionId);
    return {
      success: envelope.success,
      items: envelope.data?.items || [],
      count: envelope.data?.count || 0,
      timeframe: envelope.data?.timeframe || timeframe,
      error: envelope.error,
      sessionId: nextSessionId
    };
  },
  async getRelatedEntries(topic, limit = 10, sessionId) {
    const { envelope, sessionId: nextSessionId } = await callBriefingTool("getRelatedEntries", { topic, limit }, sessionId);
    return {
      success: envelope.success,
      entries: envelope.data?.entries || [],
      count: envelope.data?.count || 0,
      error: envelope.error,
      sessionId: nextSessionId
    };
  }
};
const rangeDaysMap = {
  today: 1,
  week: 7,
  month: 30,
  all: Infinity
};
const scopeToBackendTimeframe = {
  today: "today",
  week: "this_week",
  month: "this_month",
  all: "this_month"
};
const NovaBriefing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedEntries } = useSavedEntries();
  const [scope, setScope] = reactExports.useState("week");
  const [focus, setFocus] = reactExports.useState("overview");
  const [backendBriefing, setBackendBriefing] = reactExports.useState(null);
  const [backendDeadlines, setBackendDeadlines] = reactExports.useState([]);
  const [backendActivitySummary, setBackendActivitySummary] = reactExports.useState(null);
  const [backendRelatedEntries, setBackendRelatedEntries] = reactExports.useState([]);
  const [isBackendLoading, setIsBackendLoading] = reactExports.useState(false);
  const [backendError, setBackendError] = reactExports.useState(null);
  const [backendMode, setBackendMode] = reactExports.useState("loading");
  const [clientSessionId, setClientSessionId] = reactExports.useState(null);
  const scopedEntries = reactExports.useMemo(() => {
    if (scope === "all") return savedEntries;
    const now = Date.now();
    const cutoff = now - rangeDaysMap[scope] * 24 * 60 * 60 * 1e3;
    return savedEntries.filter((entry) => new Date(entry.updatedAt).getTime() >= cutoff);
  }, [savedEntries, scope]);
  const enrichedEntries = reactExports.useMemo(() => {
    return scopedEntries.map((entry) => ({ entry, intelligence: getEntryIntelligenceSignals(entry) })).filter(({ intelligence }) => intelligence.isEnriched).slice(0, 12);
  }, [scopedEntries]);
  const topActionEntries = reactExports.useMemo(() => {
    return [...enrichedEntries].sort((a, b) => b.intelligence.actionItemCount - a.intelligence.actionItemCount).filter(({ intelligence }) => intelligence.actionItemCount > 0).slice(0, 5);
  }, [enrichedEntries]);
  const linkedEntries = reactExports.useMemo(() => {
    return [...enrichedEntries].sort((a, b) => b.intelligence.linkedCount - a.intelligence.linkedCount).filter(({ intelligence }) => intelligence.linkedCount > 0).slice(0, 5);
  }, [enrichedEntries]);
  const deadlineEntries = reactExports.useMemo(() => {
    return enrichedEntries.filter(({ intelligence }) => intelligence.reminderLikeCount > 0).slice(0, 5);
  }, [enrichedEntries]);
  reactExports.useEffect(() => {
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
          novaBriefingClient.getRelatedEntries(subject, 5, clientSessionId)
        ]);
        const results = [briefingResult, activityResult, deadlinesResult, relatedResult];
        const successCount = results.filter((result) => result.success).length;
        const errorMessages = results.map((result) => result.error).filter((error) => Boolean(error));
        if (briefingResult.success) {
          setBackendBriefing(briefingResult.briefing || null);
        } else {
          setBackendBriefing(null);
        }
        if (activityResult.success) {
          setBackendActivitySummary({
            totalEntries: activityResult.totalEntries,
            openActionItems: activityResult.openActionItems,
            recentTitles: activityResult.recentTitles
          });
        } else {
          setBackendActivitySummary(null);
        }
        setBackendDeadlines(deadlinesResult.success ? deadlinesResult.items || [] : []);
        setBackendRelatedEntries(relatedResult.success ? relatedResult.entries || [] : []);
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
          briefingResult.sessionId || activityResult.sessionId || deadlinesResult.sessionId || relatedResult.sessionId || clientSessionId
        );
      } catch (error) {
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
  const recommendedMoves = reactExports.useMemo(() => {
    const moves = [];
    if (topActionEntries[0]) {
      moves.push({
        title: `Resolve action pressure in ${topActionEntries[0].entry.title}`,
        description: `${topActionEntries[0].intelligence.actionItemCount} action items are sitting in this entry.`,
        target: `/all-entries/${topActionEntries[0].entry.id}`,
        actionLabel: "Open entry"
      });
    }
    if (backendDeadlines[0]?.entry_id) {
      moves.push({
        title: `Review backend deadline: ${backendDeadlines[0].text}`,
        description: backendDeadlines[0].due_date ? `Due ${new Date(backendDeadlines[0].due_date).toLocaleString()}` : "Backend flagged this as upcoming.",
        target: `/all-entries/${backendDeadlines[0].entry_id}`,
        actionLabel: "Review deadline"
      });
    } else if (deadlineEntries[0]) {
      moves.push({
        title: `Check deadline context in ${deadlineEntries[0].entry.title}`,
        description: `This entry contains due/reminder-like signals that may need an explicit next step.`,
        target: `/all-entries/${deadlineEntries[0].entry.id}`,
        actionLabel: "Review deadline"
      });
    }
    if (linkedEntries[0]) {
      moves.push({
        title: `Review connected context around ${linkedEntries[0].entry.title}`,
        description: `${linkedEntries[0].intelligence.linkedCount} linked relationships suggest this entry anchors a broader thread.`,
        target: `/all-entries/${linkedEntries[0].entry.id}`,
        actionLabel: "Open cluster"
      });
    }
    if (moves.length === 0) {
      moves.push({
        title: "Capture more context",
        description: "Nova needs more active signals before it can recommend stronger next moves.",
        target: "/dashboard?action=create",
        actionLabel: "Create entry"
      });
    }
    return moves.slice(0, 3);
  }, [topActionEntries, deadlineEntries, linkedEntries, backendDeadlines]);
  const briefingSummary = reactExports.useMemo(() => {
    const lines = [];
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
    { label: "Open Insights", description: "Switch to deeper analytics.", onClick: () => navigate("/insights") }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-40 bg-background/80 backdrop-blur border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "container mx-auto px-4 py-3 flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: () => navigate("/dashboard"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
        "Dashboard"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "border-primary/30 text-primary", children: "Nova Briefing" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: scope, onValueChange: (value) => setScope(value), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[140px] h-9", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Scope" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "today", children: "Today" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "week", children: "This Week" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "month", children: "This Month" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "All Time" })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "container mx-auto px-4 py-8 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Radar, { className: "h-8 w-8 text-primary" }),
          user?.displayName ? `${user.displayName.split(" ")[0]}'s` : "Your",
          " Nova Briefing"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "A synthesized view of pressure, action, memory, and connection across your vault." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Today’s Synthesis" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
          isBackendLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading backend briefing intelligence…" }),
          backendMode === "ready" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-emerald-600", children: "Backend briefing online." }),
          backendMode === "partial" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-600", children: "Backend briefing partially available." }),
          backendMode === "fallback" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-600", children: "Backend briefing unavailable — using local fallback signals." }),
          backendBriefing && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground leading-relaxed", children: backendBriefing }),
          briefingSummary.map((line, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-foreground", children: line }, index)),
          backendError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-amber-600", children: backendError })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5 text-primary" }),
          "Recommended Next Moves"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: recommendedMoves.map((move) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: move.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2", children: move.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "mt-4 w-full", size: "sm", onClick: () => move.target && navigate(move.target), children: move.actionLabel })
        ] }, move.title)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Briefing Actions" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "justify-start h-auto py-4", onClick: () => navigate("/dashboard?action=create"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CirclePlus, { className: "w-4 h-4 mr-2" }),
            "Create follow-up entry"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "justify-start h-auto py-4", onClick: () => navigate("/settings?tab=data-management"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BellRing, { className: "w-4 h-4 mr-2" }),
            "Review reminders & exports"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "justify-start h-auto py-4", onClick: () => navigate("/brain-dump"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "w-4 h-4 mr-2" }),
            "Start brain dump"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Quick Brief Intents" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: quickIntents.map((intent) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "rounded-xl border p-4 text-left hover:bg-muted/50 transition-colors", onClick: intent.onClick, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: intent.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-2", children: intent.description })
        ] }, intent.label)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: focus, onValueChange: (value) => setFocus(value), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid grid-cols-4 w-full max-w-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "overview", children: "Overview" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "action", children: "Action" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "connections", children: "Connections" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "deadlines", children: "Deadlines" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "overview", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "h-5 w-5 text-primary" }),
            "Backend Related Context"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: backendRelatedEntries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No backend-related context available yet." }) : backendRelatedEntries.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "w-full rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors", onClick: () => navigate(`/all-entries/${entry.id}`), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: entry.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground line-clamp-2 mt-2", children: entry.summary || "Related context surfaced from backend intelligence." })
          ] }, entry.id)) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "action", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SquareCheckBig, { className: "h-5 w-5 text-green-500" }),
            "Action Pressure"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: topActionEntries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No action-heavy entries yet." }) : topActionEntries.map(({ entry, intelligence }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors", onClick: () => navigate(`/all-entries/${entry.id}`), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: entry.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
              intelligence.actionItemCount,
              " action item",
              intelligence.actionItemCount > 1 ? "s" : ""
            ] })
          ] }, entry.id)) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "connections", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "h-5 w-5 text-primary" }),
            "Most Connected"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: linkedEntries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No strong graph links surfaced yet." }) : linkedEntries.map(({ entry, intelligence }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors", onClick: () => navigate(`/all-entries/${entry.id}`), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: entry.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
              intelligence.linkedCount,
              " linked entr",
              intelligence.linkedCount > 1 ? "ies" : "y"
            ] })
          ] }, entry.id)) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "deadlines", className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BellRing, { className: "h-5 w-5 text-amber-500" }),
            "Deadlines & Reminders"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: backendDeadlines.length > 0 ? backendDeadlines.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors", onClick: () => item.entry_id ? navigate(`/all-entries/${item.entry_id}`) : void 0, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: item.text }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: item.due_date ? new Date(item.due_date).toLocaleString() : "Upcoming from backend deadline feed." })
          ] }, item.id)) : deadlineEntries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No deadline-weighted entries detected." }) : deadlineEntries.map(({ entry }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: "w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors", onClick: () => navigate(`/all-entries/${entry.id}`), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground", children: entry.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Deadline signal detected in saved fields." })
          ] }, entry.id)) })
        ] }) })
      ] })
    ] })
  ] });
};
export {
  NovaBriefing as default
};
