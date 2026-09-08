export type AgentStatus = "connecting" | "idle" | "listening" | "thinking" | "acting" | "speaking";

export interface ActionEvent {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  label: string;
  status: "running" | "done" | "error";
}

export interface ConversationTurn {
  role: "user" | "model";
  parts: { text?: string }[];
}

export interface NovaActionPayload {
  actionType: string;
  actionData: Record<string, unknown>;
}

/**
 * Canonical frontend command contract emitted by backend voiceAgent tool execution.
 *
 * Architecture boundary:
 *   backend tool result -> optional appCommand payload -> frontend callback/event execution
 *
 * Rules:
 * - `success` must always be present.
 * - `appCommand` identifies the single UI action to perform.
 * - command-specific fields must be self-contained; frontend should not infer from tool names.
 * - live-action animations flow separately via `novaAction`.
 */
export interface AppCommand {
  success: boolean;
  appCommand: "navigate" | "openEntryForm" | "openEntry" | "goBack" | "scrollPage" | "startBrainDump" | "processBrainDump" | "saveBrainDump" | "updateTheme" | "settingsUpdated" | "exportData" | "novaAction" | "printEntry";
  route?: string;
  category?: string | null;
  id?: string | null;
  title?: string | null;
  theme?: string;
  setting?: string;
  value?: unknown;
  updates?: Record<string, unknown>;
  format?: string;
  entries?: Record<string, unknown>[];
  direction?: string;
  actionType?: string;
  actionData?: Record<string, unknown>;
  error?: string;
}

export interface UseVoiceAgentOptions {
  onNavigate?: (route: string) => void;
  onOpenEntryForm?: (category?: string | null) => void;
  onOpenEntry?: (id?: string | null, title?: string | null) => void;
  onGoBack?: () => void;
  onScrollPage?: (direction: string) => void;
  onStartBrainDump?: () => void;
  onProcessBrainDump?: () => void;
  onSaveBrainDump?: (category?: string | null) => void;
  onUpdateTheme?: (theme: string) => void;
  onSettingsUpdated?: (setting: string, value?: unknown, updates?: Record<string, unknown>) => void;
  onExportData?: (format: string) => void;
  onPrintEntry?: (entries: Record<string, unknown>[]) => void;
  onNovaAction?: (payload: NovaActionPayload) => void;
  continuous?: boolean;
}

export const toolLabel = (name: string, args: Record<string, unknown>): string => {
  switch (name) {
    case "saveEntry":        return `Saving "${args.title || "entry"}"...`;
    case "searchEntries":    return `Searching for "${args.query}"...`;
    case "getRecentEntries": return "Fetching recent entries...";
    case "updateEntry":      return "Updating entry...";
    case "deleteEntry":      return "Deleting entry...";
    case "navigateApp":      return "Opening the requested page...";
    case "navigateToCategory": return `Opening ${args.category}...`;
    case "openEntryForm":    return "Opening entry form...";
    case "openEntry":        return `Opening "${args.title || args.id}"...`;
    case "updateTheme":      return `Switching to ${args.theme} theme...`;
    case "updateProfile":    return "Updating profile...";
    case "toggleNotification": return `${args.enabled ? "Enabling" : "Disabling"} ${args.type}...`;
    case "updateVoiceSettings": return "Updating voice settings...";
    case "exportUserData":   return "Exporting data...";
    case "rememberFact":     return "Remembering that...";
    case "recallMemories":   return `Recalling memories about "${args.query}"...`;
    case "forgetMemory":     return "Forgetting...";
    case "getEntityGraph":   return `Looking up "${args.query}"...`;
    case "getRelatedEntries": return `Finding related entries...`;
    case "prepareBriefing":  return `Preparing briefing on "${args.subject}"...`;
    case "getActivitySummary": return `Reviewing ${args.timeframe} activity...`;
    case "getUpcomingDeadlines": return "Checking deadlines...";
    case "updateActionItem": return `Updating task "${args.query}"...`;
    case "setReminder":      return `Setting reminder: "${args.text}"...`;
    case "printEntry":       return `Printing "${args.title || args.category || "entry"}"...`;
    case "scrollPage":       return `Scrolling ${args.direction || "down"}...`;
    case "closeEntry":       return "Closing the current view...";
    default:                 return `${name}...`;
  }
};

