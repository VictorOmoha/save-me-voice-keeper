import { a as reactExports, j as jsxRuntimeExports } from "./vendor-ui-CLSr_GWM.js";
import { c as createLucideIcon, B as Button, C as Card, e as CardHeader, f as CardTitle, h as CardContent, m as Brain, g as CardDescription, b as useNavigate, G as useToast, L as LoaderCircle } from "./index-CT7EzYyk.js";
import { B as Badge } from "./badge-CRUpIyW6.js";
import { H as Heart, T as TrendingUp } from "./trending-up-F9qFPeih.js";
import { C as CircleAlert } from "./circle-alert-6cY5Ije4.js";
import { L as Lightbulb } from "./lightbulb-10xgXUYR.js";
import { U as Users } from "./users-C124q9JP.js";
import { u as useDashboard } from "./useDashboard-Bdz-0Z01.js";
import { A as ArrowLeft } from "./arrow-left-CCcLkmU5.js";
import "./vendor-charts-hYiuCXaC.js";
import "./vendor-firebase-N64baH19.js";
import "./useSavedEntries-BbNCU1rB.js";
const Target = createLucideIcon("Target", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["circle", { cx: "12", cy: "12", r: "6", key: "1vlfrh" }],
  ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }]
]);
const TrendingDown = createLucideIcon("TrendingDown", [
  ["polyline", { points: "22 17 13.5 8.5 8.5 13.5 2 7", key: "1r2t7k" }],
  ["polyline", { points: "16 17 22 17 22 11", key: "11uiuu" }]
]);
function PatternInsightsPanel({
  analysis,
  onInsightClick
}) {
  const [selectedPeriod, setSelectedPeriod] = reactExports.useState("week");
  const getInsightIcon = (type) => {
    switch (type) {
      case "emotion":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "h-4 w-4" });
      case "topic":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "h-4 w-4" });
      case "person":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" });
      case "action":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-4 w-4" });
      case "frequency":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { className: "h-4 w-4" });
    }
  };
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-50 border-green-200";
      case "negative":
        return "bg-red-50 border-red-200";
      case "mixed":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };
  const getTrendIcon = (direction) => {
    switch (direction) {
      case "increasing":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-3 w-3 text-red-500" });
      case "decreasing":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "h-3 w-3 text-green-500" });
      default:
        return null;
    }
  };
  const emotionalToneColor = analysis.emotionalTone.primary === "positive" ? "bg-green-100 text-green-900" : analysis.emotionalTone.primary === "negative" ? "bg-red-100 text-red-900" : "bg-slate-100 text-slate-900";
  const emotionalToneIntensity = analysis.emotionalTone.intensity === "high" ? "🔴 High" : analysis.emotionalTone.intensity === "medium" ? "🟡 Medium" : "🟢 Low";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: selectedPeriod === "today" ? "default" : "outline",
          size: "sm",
          onClick: () => setSelectedPeriod("today"),
          children: "Today"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: selectedPeriod === "week" ? "default" : "outline",
          size: "sm",
          onClick: () => setSelectedPeriod("week"),
          children: "This Week"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: selectedPeriod === "month" ? "default" : "outline",
          size: "sm",
          onClick: () => setSelectedPeriod("month"),
          children: "This Month"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: emotionalToneColor, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Your Vibe" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "h-5 w-5" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Primary Emotion:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: analysis.emotionalTone.primary })
        ] }),
        analysis.emotionalTone.secondary && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Also feeling:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: analysis.emotionalTone.secondary })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Intensity:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold", children: emotionalToneIntensity })
        ] })
      ] }) })
    ] }),
    analysis.summary && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground leading-relaxed", children: [
      "💡 ",
      analysis.summary
    ] }) }) }),
    analysis.insights.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "h-5 w-5" }),
          "Key Patterns"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "What I've noticed in your entries" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: analysis.insights.map((insight, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => onInsightClick?.(insight),
          className: `w-full text-left p-3 rounded-lg border-2 transition-colors hover:shadow-md ${getSentimentColor(
            insight.sentiment
          )}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: getInsightIcon(insight.type) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium capitalize", children: insight.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "text-xs", children: [
                    insight.occurrences,
                    "x"
                  ] }),
                  insight.trendDirection && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                    getTrendIcon(insight.trendDirection),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground capitalize", children: insight.trendDirection })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                  insight.type === "emotion" && `You've mentioned this ${insight.occurrences} times in your entries`,
                  insight.type === "topic" && `This topic appears in ${insight.occurrences} of your entries`,
                  insight.type === "person" && `${insight.label} was mentioned ${insight.occurrences} times`,
                  insight.type === "action" && `Tagged "${insight.label}" ${insight.occurrences} times`
                ] }),
                insight.lastSeen && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-2", children: [
                  "Last seen:",
                  " ",
                  new Date(insight.lastSeen).toLocaleDateString()
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold",
                title: `${Math.round(insight.confidence * 100)}% confidence`,
                children: [
                  Math.round(insight.confidence * 100),
                  "%"
                ]
              }
            ) })
          ] })
        },
        idx
      )) }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Need more entries to find patterns. Keep brain dumping!" })
    ] }) }) })
  ] });
}
const EMOTIONS = {
  anxiety: ["anxious", "anxiou", "worried", "nervous", "stressed", "stress", "overwhelmed", "panic", "tense", "uneasy"],
  frustration: ["frustrated", "frustrated", "annoyed", "irritated", "angry", "mad", "upset", "fed up"],
  excitement: ["excited", "thrilled", "amazing", "awesome", "great", "wonderful", "fantastic", "pumped"],
  confidence: ["confident", "assured", "certain", "determined", "strong", "capable", "powerful"],
  sadness: ["sad", "depressed", "down", "unhappy", "miserable", "disappointed", "heartbroken"],
  joy: ["happy", "joyful", "delighted", "pleased", "content", "grateful", "blessed"],
  exhaustion: ["tired", "exhausted", "drained", "burnt out", "fatigued", "sleepy", "worn out"],
  productivity: ["accomplished", "productive", "finished", "completed", "done", "shipped", "launched"]
};
const TOPICS = {
  health: ["health", "exercise", "workout", "sleep", "diet", "nutrition", "doctor", "medical", "ill", "sick", "pain"],
  work: ["work", "project", "deadline", "meeting", "boss", "team", "client", "code", "bug", "feature", "deploy"],
  relationships: ["partner", "spouse", "friend", "family", "relationship", "love", "conflict", "conversation"],
  finance: ["money", "budget", "expense", "invoice", "payment", "salary", "bills", "debt", "invest", "cost"],
  learning: ["learn", "study", "course", "book", "skill", "improve", "tutorial", "practice", "master"],
  creativity: ["idea", "create", "design", "write", "art", "music", "inspire", "imagine", "vision"],
  goals: ["goal", "target", "aim", "plan", "strategy", "roadmap", "milestone", "objective"],
  decision: ["decide", "choice", "option", "dilemma", "question", "unsure", "consider", "think about"]
};
function analyzePatterns(entries, daysBack = 7) {
  const now = /* @__PURE__ */ new Date();
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1e3);
  const relevantEntries = entries.filter((e) => e.createdAt >= startDate);
  if (relevantEntries.length === 0) {
    return {
      timeRange: { start: startDate, end: now, daysAnalyzed: daysBack },
      insights: [],
      summary: `No entries in the last ${daysBack} days.`,
      emotionalTone: { primary: "neutral", intensity: "low" }
    };
  }
  const insights = [];
  const allText = relevantEntries.map((e) => (e.title + " " + e.notes).toLowerCase()).join(" ");
  for (const [emotion, keywords] of Object.entries(EMOTIONS)) {
    const matches = findKeywordMatches(allText, keywords, relevantEntries);
    if (matches.count > 0) {
      insights.push({
        type: "emotion",
        label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        pattern: emotion,
        occurrences: matches.count,
        entries: matches.entries,
        sentiment: getEmotionSentiment(emotion),
        confidence: Math.min(matches.count / relevantEntries.length, 1),
        firstSeen: matches.first,
        lastSeen: matches.last,
        trendDirection: calculateTrend(matches.entries)
      });
    }
  }
  for (const [topic, keywords] of Object.entries(TOPICS)) {
    const matches = findKeywordMatches(allText, keywords, relevantEntries);
    if (matches.count >= 2) {
      insights.push({
        type: "topic",
        label: topic.charAt(0).toUpperCase() + topic.slice(1),
        pattern: topic,
        occurrences: matches.count,
        entries: matches.entries,
        confidence: Math.min(matches.count / relevantEntries.length, 1),
        firstSeen: matches.first,
        lastSeen: matches.last
      });
    }
  }
  const personCounts = {};
  relevantEntries.forEach((e) => {
    (e.people || []).forEach((person) => {
      if (!personCounts[person]) {
        personCounts[person] = { count: 0, entries: [] };
      }
      personCounts[person].count++;
      personCounts[person].entries.push(e.id);
    });
  });
  for (const [person, data] of Object.entries(personCounts)) {
    if (data.count >= 2) {
      insights.push({
        type: "person",
        label: person,
        pattern: person,
        occurrences: data.count,
        entries: data.entries,
        confidence: Math.min(data.count / relevantEntries.length, 1)
      });
    }
  }
  const tagCounts = {};
  relevantEntries.forEach((e) => {
    (e.tags || []).forEach((tag) => {
      if (!tagCounts[tag]) {
        tagCounts[tag] = { count: 0, entries: [] };
      }
      tagCounts[tag].count++;
      tagCounts[tag].entries.push(e.id);
    });
  });
  for (const [tag, data] of Object.entries(tagCounts)) {
    if (data.count >= 2) {
      insights.push({
        type: "action",
        label: tag,
        pattern: tag,
        occurrences: data.count,
        entries: data.entries,
        confidence: Math.min(data.count / relevantEntries.length, 1)
      });
    }
  }
  insights.sort((a, b) => {
    if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
    return b.confidence - a.confidence;
  });
  const summary = generateSummary(insights, daysBack, relevantEntries.length);
  const emotionalInsights = insights.filter((i) => i.type === "emotion");
  const emotionalTone = analyzeEmotionalTone(emotionalInsights);
  return {
    timeRange: { start: startDate, end: now, daysAnalyzed: daysBack },
    insights: insights.slice(0, 10),
    // Top 10 insights
    summary,
    emotionalTone
  };
}
function findKeywordMatches(text, keywords, entries) {
  const matchedEntries = /* @__PURE__ */ new Set();
  let count = 0;
  let firstDate;
  let lastDate;
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}`, "g");
    const matches = text.match(regex) || [];
    count += matches.length;
    for (const entry of entries) {
      const entryText = entry.title + " " + entry.notes;
      if (entryText.toLowerCase().includes(keyword)) {
        matchedEntries.add(entry.id);
        if (!firstDate || entry.createdAt < firstDate) firstDate = entry.createdAt;
        if (!lastDate || entry.createdAt > lastDate) lastDate = entry.createdAt;
      }
    }
  }
  return {
    count,
    entries: Array.from(matchedEntries),
    first: firstDate,
    last: lastDate
  };
}
function getEmotionSentiment(emotion) {
  const positive = ["excitement", "confidence", "joy", "productivity"];
  const negative = ["anxiety", "frustration", "sadness", "exhaustion"];
  if (positive.includes(emotion)) return "positive";
  if (negative.includes(emotion)) return "negative";
  return "neutral";
}
function calculateTrend(entryIds, pattern) {
  if (entryIds.length < 2) return "stable";
  const firstHalf = Math.floor(entryIds.length / 2);
  const recentCount = entryIds.length - firstHalf;
  if (recentCount > firstHalf * 1.2) return "increasing";
  if (recentCount < firstHalf * 0.8) return "decreasing";
  return "stable";
}
function analyzeEmotionalTone(insights) {
  if (insights.length === 0) {
    return { primary: "neutral", intensity: "low" };
  }
  const sorted = [...insights].sort((a, b) => b.occurrences - a.occurrences);
  const primary = sorted[0].label;
  const secondary = sorted[1]?.label;
  const totalMentions = sorted.reduce((sum, i) => sum + i.occurrences, 0);
  const intensity = totalMentions > 10 ? "high" : totalMentions > 5 ? "medium" : "low";
  return { primary, secondary, intensity };
}
function generateSummary(insights, daysBack, entryCount) {
  if (insights.length === 0) {
    return `You created ${entryCount} entries in the last ${daysBack} days.`;
  }
  insights[0];
  const emotionInsights = insights.filter((i) => i.type === "emotion").slice(0, 2);
  const topicInsights = insights.filter((i) => i.type === "topic").slice(0, 2);
  const parts = [];
  parts.push(`Over the last ${daysBack} days, you created ${entryCount} entries.`);
  if (emotionInsights.length > 0) {
    const emotion = emotionInsights[0];
    parts.push(`You mentioned "${emotion.pattern}" ${emotion.occurrences} times.`);
  }
  if (topicInsights.length > 0) {
    const topics = topicInsights.map((t) => t.pattern).join(" and ");
    parts.push(`Your main focus areas: ${topics}.`);
  }
  return parts.join(" ");
}
function getInsightsForPeriod(entries, period) {
  const daysMap = {
    today: 1,
    week: 7,
    month: 30,
    quarter: 90,
    year: 365
  };
  return analyzePatterns(entries, daysMap[period]);
}
const InsightsPage = () => {
  const navigate = useNavigate();
  const { entries, isLoading: isDashboardLoading } = useDashboard();
  const { toast } = useToast();
  const [analysis, setAnalysis] = reactExports.useState(null);
  const [isAnalyzing, setIsAnalyzing] = reactExports.useState(false);
  const [period, setPeriod] = reactExports.useState("week");
  reactExports.useEffect(() => {
    document.title = "Insights | SaveMe Voice Keeper";
  }, []);
  reactExports.useEffect(() => {
    if (entries && entries.length > 0) {
      setIsAnalyzing(true);
      try {
        const formattedEntries = entries.map((e) => ({
          id: e.id || Math.random().toString(),
          title: e.title || "",
          notes: e.fields?.notes || e.fields?.originalText || "",
          people: e.fields?.people ? typeof e.fields.people === "string" ? e.fields.people.split(",").map((p) => p.trim()) : Array.isArray(e.fields.people) ? e.fields.people : [] : [],
          tags: e.fields?.tags ? typeof e.fields.tags === "string" ? e.fields.tags.split(",").map((t) => t.trim()) : Array.isArray(e.fields.tags) ? e.fields.tags : [] : [],
          createdAt: e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt || Date.now()),
          fields: e.fields || {}
        }));
        const result = getInsightsForPeriod(formattedEntries, period);
        setAnalysis(result);
      } catch (error) {
        console.error("Error analyzing patterns:", error);
        toast({
          title: "Analysis Error",
          description: "Failed to analyze patterns. Try again later.",
          variant: "destructive"
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [entries, period, toast]);
  const handleBackClick = () => {
    navigate("/dashboard");
  };
  const handleInsightClick = (insight) => {
    const query = `insight=${insight.pattern}`;
    navigate(`/dashboard?${query}`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "container mx-auto px-4 py-2 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: handleBackClick, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
        "Back to Dashboard"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold", children: "Insights" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "container mx-auto px-4 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "space-y-6 max-w-4xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold", children: "It Read Your Mind" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Patterns and insights from your brain dumps. What's been on your mind?" })
      ] }),
      isDashboardLoading || isAnalyzing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 flex items-center justify-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Analyzing your entries..." })
      ] }) }) : entries && entries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 text-center space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "No entries yet. Brain dump something to get started!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => navigate("/brain-dump"), children: "Create Your First Brain Dump" })
      ] }) }) : analysis ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground text-center", children: [
          "Analyzing ",
          analysis.timeRange.daysAnalyzed,
          " days of entries (",
          entries?.length,
          " total entries)"
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PatternInsightsPanel,
          {
            analysis,
            onInsightClick: handleInsightClick
          }
        ),
        analysis.insights.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-purple-200 bg-purple-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "💡 Recommendation" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-2", children: [
            analysis.emotionalTone.intensity === "high" && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm", children: [
              "You've been feeling pretty ",
              analysis.emotionalTone.primary.toLowerCase(),
              " lately. Maybe it's time for a break or a check-in with someone you trust?"
            ] }),
            analysis.insights.some((i) => i.type === "emotion" && i.pattern === "anxiety") && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "You've mentioned anxiety several times. Consider: What's one small thing you can control today?" }),
            analysis.insights.some((i) => i.trendDirection === "increasing" && i.type === "emotion") && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "Your emotional intensity is increasing. Journaling more might help you work through it." }),
            analysis.insights.filter((i) => i.type === "topic").length > 3 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "A lot on your plate! Breaking things into smaller chunks might help you feel less overwhelmed." })
          ] })
        ] }),
        false
      ] }) : null
    ] }) })
  ] });
};
export {
  InsightsPage as default
};
