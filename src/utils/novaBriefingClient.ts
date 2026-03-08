import { auth } from "@/lib/firebase";

const VOICE_AGENT_URL = `${import.meta.env.VITE_CLOUD_FUNCTIONS_URL}/voiceAgent`;

type BriefingToolName = "prepareBriefing" | "getActivitySummary" | "getUpcomingDeadlines" | "getRelatedEntries";

interface VoiceAgentAction {
  tool: string;
  args: Record<string, any>;
  result: Record<string, any>;
}

interface VoiceAgentResponse {
  transcript?: string;
  responseText?: string;
  actionsExecuted?: VoiceAgentAction[];
  conversationHistory?: any[];
  appCommands?: any[];
  sessionId?: string;
}

const getAuthToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required");
  return user.getIdToken();
};

const extractToolResult = (response: VoiceAgentResponse, toolName: BriefingToolName) => {
  const action = response.actionsExecuted?.find((item) => item.tool === toolName);
  return action?.result || null;
};

const callBriefingTool = async (
  toolName: BriefingToolName,
  args: Record<string, any>,
  sessionId?: string | null
) => {
  const token = await getAuthToken();

  const transcriptMap: Record<BriefingToolName, string> = {
    prepareBriefing: `prepare a briefing about ${args.subject}`,
    getActivitySummary: `show my ${args.timeframe || "this_week"} activity summary`,
    getUpcomingDeadlines: `what is due ${args.timeframe || "this_week"}`,
    getRelatedEntries: `find related entries for ${args.topic}`,
  };

  const response = await fetch(VOICE_AGENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      transcript: transcriptMap[toolName],
      conversationHistory: [],
      sessionId: sessionId || null,
      debugToolOverride: {
        tool: toolName,
        args,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Voice agent request failed (${response.status})`);
  }

  const data: VoiceAgentResponse = await response.json();
  return {
    raw: data,
    toolResult: extractToolResult(data, toolName),
    sessionId: data.sessionId || sessionId || null,
  };
};

export interface PreparedBriefingResult {
  briefing: string;
  entriesUsed: number;
  memoriesUsed: number;
  openActionItems: number;
  sessionId?: string | null;
}

export interface ActivitySummaryResult {
  totalEntries: number;
  categoryCounts: Record<string, number>;
  recentTitles: string[];
  openActionItems: number;
  timeframe: string;
  sessionId?: string | null;
}

export interface UpcomingDeadlinesResult {
  items: Array<{
    id: string;
    text: string;
    priority?: string;
    status?: string;
    due_date?: string | null;
    entry_id?: string | null;
  }>;
  count: number;
  timeframe: string;
  sessionId?: string | null;
}

export interface RelatedEntriesResult {
  entries: Array<{
    id: string;
    title: string;
    summary?: string | null;
    category?: string | null;
    action_items?: any[];
    tags?: string[];
    updated_at?: any;
  }>;
  count: number;
  sessionId?: string | null;
}

export const novaBriefingClient = {
  async prepareBriefing(subject: string, type: string = "general", sessionId?: string | null): Promise<PreparedBriefingResult> {
    const { toolResult, sessionId: nextSessionId } = await callBriefingTool("prepareBriefing", { subject, type }, sessionId);
    return {
      briefing: toolResult?.briefing || "I couldn't prepare a briefing right now.",
      entriesUsed: toolResult?.entriesUsed || 0,
      memoriesUsed: toolResult?.memoriesUsed || 0,
      openActionItems: toolResult?.openActionItems || 0,
      sessionId: nextSessionId,
    };
  },

  async getActivitySummary(timeframe: string = "this_week", sessionId?: string | null): Promise<ActivitySummaryResult> {
    const { toolResult, sessionId: nextSessionId } = await callBriefingTool("getActivitySummary", { timeframe }, sessionId);
    return {
      totalEntries: toolResult?.totalEntries || 0,
      categoryCounts: toolResult?.categoryCounts || {},
      recentTitles: toolResult?.recentTitles || [],
      openActionItems: toolResult?.openActionItems || 0,
      timeframe: toolResult?.timeframe || timeframe,
      sessionId: nextSessionId,
    };
  },

  async getUpcomingDeadlines(timeframe: string = "this_week", sessionId?: string | null): Promise<UpcomingDeadlinesResult> {
    const { toolResult, sessionId: nextSessionId } = await callBriefingTool("getUpcomingDeadlines", { timeframe }, sessionId);
    return {
      items: toolResult?.items || [],
      count: toolResult?.count || 0,
      timeframe: toolResult?.timeframe || timeframe,
      sessionId: nextSessionId,
    };
  },

  async getRelatedEntries(topic: string, limit: number = 10, sessionId?: string | null): Promise<RelatedEntriesResult> {
    const { toolResult, sessionId: nextSessionId } = await callBriefingTool("getRelatedEntries", { topic, limit }, sessionId);
    return {
      entries: toolResult?.entries || [],
      count: toolResult?.count || 0,
      sessionId: nextSessionId,
    };
  },
};
