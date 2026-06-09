import { getCloudFunctionUrl, getFirebaseIdToken } from "@/utils/cloudFunctions";

const VOICE_AGENT_URL = getCloudFunctionUrl('voiceAgent');

type BriefingToolName = "prepareBriefing" | "getActivitySummary" | "getUpcomingDeadlines" | "getRelatedEntries";

interface VoiceAgentAction {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

interface VoiceAgentResponse {
  transcript?: string;
  responseText?: string;
  actionsExecuted?: VoiceAgentAction[];
  conversationHistory?: unknown[];
  appCommands?: unknown[];
  sessionId?: string;
}

interface BriefingToolEnvelope<T = Record<string, unknown>> {
  success: boolean;
  data: T;
  error?: string | null;
}

const getAuthToken = async (): Promise<string> => {
  return getFirebaseIdToken();
};

const extractToolResult = (response: VoiceAgentResponse, toolName: BriefingToolName) => {
  const action = response.actionsExecuted?.find((item) => item.tool === toolName);
  return action?.result || null;
};

const extractEnvelope = <T = Record<string, unknown>>(
  response: VoiceAgentResponse,
  toolName: BriefingToolName
): BriefingToolEnvelope<T> => {
  const result = extractToolResult(response, toolName);
  if (!result) {
    return {
      success: false,
      data: {} as T,
      error: `Tool result missing for ${toolName}`,
    };
  }

  if (result.success === false) {
    return {
      success: false,
      data: (result.data || {}) as T,
      error: typeof result.error === "string" && result.error ? result.error : `Tool ${toolName} failed`,
    };
  }

  return {
    success: true,
    data: (result.data || result) as T,
    error: null,
  };
};

const callBriefingTool = async <T = Record<string, unknown>>(
  toolName: BriefingToolName,
  args: Record<string, unknown>,
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
    envelope: extractEnvelope<T>(data, toolName),
    sessionId: data.sessionId || sessionId || null,
  };
};

export interface PreparedBriefingResult {
  success: boolean;
  briefing: string;
  entriesUsed: number;
  memoriesUsed: number;
  openActionItems: number;
  error?: string | null;
  sessionId?: string | null;
}

export interface ActivitySummaryResult {
  success: boolean;
  totalEntries: number;
  categoryCounts: Record<string, number>;
  recentTitles: string[];
  openActionItems: number;
  timeframe: string;
  error?: string | null;
  sessionId?: string | null;
}

export interface UpcomingDeadlinesResult {
  success: boolean;
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
  error?: string | null;
  sessionId?: string | null;
}

export interface RelatedEntriesResult {
  success: boolean;
  entries: Array<{
    id: string;
    title: string;
    summary?: string | null;
    category?: string | null;
    action_items?: unknown[];
    tags?: string[];
    updated_at?: unknown;
  }>;
  count: number;
  error?: string | null;
  sessionId?: string | null;
}

interface PreparedBriefingData {
  briefing?: string;
  entriesUsed?: number;
  memoriesUsed?: number;
  openActionItems?: number;
}

interface ActivitySummaryData {
  totalEntries?: number;
  categoryCounts?: Record<string, number>;
  recentTitles?: string[];
  openActionItems?: number;
  timeframe?: string;
}

interface UpcomingDeadlinesData {
  items?: UpcomingDeadlinesResult["items"];
  count?: number;
  timeframe?: string;
}

interface RelatedEntriesData {
  entries?: RelatedEntriesResult["entries"];
  count?: number;
}

export const novaBriefingClient = {
  async prepareBriefing(subject: string, type: string = "general", sessionId?: string | null): Promise<PreparedBriefingResult> {
    const { envelope, sessionId: nextSessionId } = await callBriefingTool<PreparedBriefingData>("prepareBriefing", { subject, type }, sessionId);
    return {
      success: envelope.success,
      briefing: envelope.data?.briefing || "I couldn't prepare a briefing right now.",
      entriesUsed: envelope.data?.entriesUsed || 0,
      memoriesUsed: envelope.data?.memoriesUsed || 0,
      openActionItems: envelope.data?.openActionItems || 0,
      error: envelope.error,
      sessionId: nextSessionId,
    };
  },

  async getActivitySummary(timeframe: string = "this_week", sessionId?: string | null): Promise<ActivitySummaryResult> {
    const { envelope, sessionId: nextSessionId } = await callBriefingTool<ActivitySummaryData>("getActivitySummary", { timeframe }, sessionId);
    return {
      success: envelope.success,
      totalEntries: envelope.data?.totalEntries || 0,
      categoryCounts: envelope.data?.categoryCounts || {},
      recentTitles: envelope.data?.recentTitles || [],
      openActionItems: envelope.data?.openActionItems || 0,
      timeframe: envelope.data?.timeframe || timeframe,
      error: envelope.error,
      sessionId: nextSessionId,
    };
  },

  async getUpcomingDeadlines(timeframe: string = "this_week", sessionId?: string | null): Promise<UpcomingDeadlinesResult> {
    const { envelope, sessionId: nextSessionId } = await callBriefingTool<UpcomingDeadlinesData>("getUpcomingDeadlines", { timeframe }, sessionId);
    return {
      success: envelope.success,
      items: envelope.data?.items || [],
      count: envelope.data?.count || 0,
      timeframe: envelope.data?.timeframe || timeframe,
      error: envelope.error,
      sessionId: nextSessionId,
    };
  },

  async getRelatedEntries(topic: string, limit: number = 10, sessionId?: string | null): Promise<RelatedEntriesResult> {
    const { envelope, sessionId: nextSessionId } = await callBriefingTool<RelatedEntriesData>("getRelatedEntries", { topic, limit }, sessionId);
    return {
      success: envelope.success,
      entries: envelope.data?.entries || [],
      count: envelope.data?.count || 0,
      error: envelope.error,
      sessionId: nextSessionId,
    };
  },
};
