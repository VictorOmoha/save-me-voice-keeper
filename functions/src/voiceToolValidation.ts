export interface ToolValidationResult {
  valid: boolean;
  error?: string;
  sanitizedArgs?: Record<string, any>;
}

const MAX_STRING_LENGTH = 5000;
const MAX_QUERY_LENGTH = 500;
const MAX_CONTENT_LENGTH = 10000;

const VALID_ROUTES = [
  "/dashboard", "/all-entries", "/insights", "/briefing",
  "/subscription", "/settings", "/user-guide", "/brain-dump",
  "/onboarding", "/terms", "/privacy",
];

const VALID_THEMES = ["light", "dark", "system"];

const VALID_NOTIFICATION_TYPES = [
  "email", "push", "reminder", "automation",
];

const VALID_ACTION_STATUSES = [
  "open", "in_progress", "completed", "cancelled",
];

const VALID_TIMEFRAMES = [
  "today", "week", "month", "all",
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function sanitizeString(value: unknown, max = MAX_STRING_LENGTH): string | undefined {
  if (typeof value !== "string") return undefined;
  return truncate(value.trim(), max);
}

export function validateToolArgs(toolName: string, args: Record<string, unknown>): ToolValidationResult {
  const sanitized: Record<string, any> = {};

  switch (toolName) {
  case "navigateApp": {
    if (!isNonEmptyString(args.route)) return { valid: false, error: "navigateApp requires route" };
    const route = args.route.trim();
    if (!VALID_ROUTES.includes(route) && !route.startsWith("/category/")) {
      return { valid: false, error: `navigateApp: invalid route "${route}"` };
    }
    sanitized.route = route;
    return { valid: true, sanitizedArgs: sanitized };
  }

  case "navigateToCategory":
    if (!isNonEmptyString(args.category)) return { valid: false, error: "navigateToCategory requires category" };
    sanitized.category = truncate(args.category.trim(), 100);
    return { valid: true, sanitizedArgs: sanitized };

  case "openEntry":
    if (!isNonEmptyString(args.id) && !isNonEmptyString(args.title)) return { valid: false, error: "openEntry requires id or title" };
    if (isNonEmptyString(args.id)) sanitized.id = truncate(args.id.trim(), 200);
    if (isNonEmptyString(args.title)) sanitized.title = truncate(args.title.trim(), 500);
    return { valid: true, sanitizedArgs: sanitized };

  case "printEntry":
    if (!isNonEmptyString(args.id) && !isNonEmptyString(args.title) && !isNonEmptyString(args.category)) {
      return { valid: false, error: "printEntry requires id, title, or category" };
    }
    if (isNonEmptyString(args.id)) sanitized.id = truncate(args.id.trim(), 200);
    if (isNonEmptyString(args.title)) sanitized.title = truncate(args.title.trim(), 500);
    if (isNonEmptyString(args.category)) sanitized.category = truncate(args.category.trim(), 100);
    return { valid: true, sanitizedArgs: sanitized };

  case "saveEntry":
    if (!isNonEmptyString(args.title)) return { valid: false, error: "saveEntry requires title" };
    sanitized.title = truncate(args.title.trim(), 500);
    if (args.content) sanitized.content = sanitizeString(args.content, MAX_CONTENT_LENGTH);
    if (args.category) sanitized.category = truncate(String(args.category).trim(), 100);
    return { valid: true, sanitizedArgs: sanitized };

  case "searchEntries":
  case "getEntityGraph":
    if (!isNonEmptyString(args.query)) return { valid: false, error: `${toolName} requires query` };
    sanitized.query = truncate(args.query.trim(), MAX_QUERY_LENGTH);
    if (args.limit != null) sanitized.limit = Math.min(Math.max(1, Number(args.limit) || 10), 50);
    return { valid: true, sanitizedArgs: sanitized };

  case "recallMemories":
  case "forgetMemory":
    if (!isNonEmptyString(args.query)) return { valid: false, error: `${toolName} requires query` };
    sanitized.query = truncate(args.query.trim(), MAX_QUERY_LENGTH);
    return { valid: true, sanitizedArgs: sanitized };

  case "rememberFact":
    if (!isNonEmptyString(args.content)) return { valid: false, error: "rememberFact requires content" };
    sanitized.content = truncate(args.content.trim(), MAX_CONTENT_LENGTH);
    if (args.category) sanitized.category = truncate(String(args.category).trim(), 100);
    return { valid: true, sanitizedArgs: sanitized };

  case "updateEntry":
    if (!isNonEmptyString(args.id)) return { valid: false, error: "updateEntry requires id" };
    sanitized.id = truncate(args.id.trim(), 200);
    if (isNonEmptyString(args.title)) sanitized.title = truncate(args.title.trim(), 500);
    if (args.content) sanitized.content = sanitizeString(args.content, MAX_CONTENT_LENGTH);
    return { valid: true, sanitizedArgs: sanitized };

  case "deleteEntry":
    if (!isNonEmptyString(args.id)) return { valid: false, error: "deleteEntry requires id" };
    sanitized.id = truncate(args.id.trim(), 200);
    return { valid: true, sanitizedArgs: sanitized };

  case "updateTheme":
    if (!isNonEmptyString(args.theme)) return { valid: false, error: "updateTheme requires theme" };
    if (!VALID_THEMES.includes(args.theme.trim())) {
      return { valid: false, error: `updateTheme: invalid theme "${args.theme}" (expected: ${VALID_THEMES.join(", ")})` };
    }
    sanitized.theme = args.theme.trim();
    return { valid: true, sanitizedArgs: sanitized };

  case "toggleNotification":
    if (!isNonEmptyString(args.type) || typeof args.enabled !== "boolean") {
      return { valid: false, error: "toggleNotification requires type and enabled boolean" };
    }
    if (!VALID_NOTIFICATION_TYPES.includes(args.type.trim())) {
      return { valid: false, error: `toggleNotification: invalid type "${args.type}"` };
    }
    sanitized.type = args.type.trim();
    return { valid: true, sanitizedArgs: sanitized };

  case "prepareBriefing":
    if (!isNonEmptyString(args.subject)) return { valid: false, error: "prepareBriefing requires subject" };
    sanitized.subject = truncate(args.subject.trim(), MAX_QUERY_LENGTH);
    return { valid: true, sanitizedArgs: sanitized };

  case "getRelatedEntries":
    if (!isNonEmptyString(args.topic) && !isNonEmptyString(args.entryId)) {
      return { valid: false, error: "getRelatedEntries requires topic or entryId" };
    }
    if (isNonEmptyString(args.topic)) sanitized.topic = truncate(args.topic.trim(), MAX_QUERY_LENGTH);
    if (isNonEmptyString(args.entryId)) sanitized.entryId = truncate(args.entryId.trim(), 200);
    return { valid: true, sanitizedArgs: sanitized };

  case "getActivitySummary":
  case "getUpcomingDeadlines":
    if (!isNonEmptyString(args.timeframe)) return { valid: false, error: `${toolName} requires timeframe` };
    if (!VALID_TIMEFRAMES.includes(args.timeframe.trim())) {
      return { valid: false, error: `${toolName}: invalid timeframe "${args.timeframe}" (expected: ${VALID_TIMEFRAMES.join(", ")})` };
    }
    sanitized.timeframe = args.timeframe.trim();
    return { valid: true, sanitizedArgs: sanitized };

  case "updateActionItem":
    if (!isNonEmptyString(args.query) || !isNonEmptyString(args.status)) {
      return { valid: false, error: "updateActionItem requires query and status" };
    }
    if (!VALID_ACTION_STATUSES.includes(args.status.trim())) {
      return { valid: false, error: `updateActionItem: invalid status "${args.status}"` };
    }
    sanitized.query = truncate(args.query.trim(), MAX_QUERY_LENGTH);
    sanitized.status = args.status.trim();
    return { valid: true, sanitizedArgs: sanitized };

  case "setReminder":
    if (!isNonEmptyString(args.text) || !isNonEmptyString(args.when)) {
      return { valid: false, error: "setReminder requires text and when" };
    }
    sanitized.text = truncate(args.text.trim(), 1000);
    sanitized.when = truncate(args.when.trim(), 200);
    return { valid: true, sanitizedArgs: sanitized };

  default:
    return { valid: true, sanitizedArgs: sanitized };
  }
}

export function summarizeToolArgs(args: Record<string, unknown>): Record<string, unknown> {
  const summary: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(args || {})) {
    if (value == null) continue;

    if (typeof value === "string") {
      summary[key] = value.length > 120 ? `${value.slice(0, 117)}...` : value;
    } else if (Array.isArray(value)) {
      summary[key] = `[array:${value.length}]`;
    } else if (typeof value === "object") {
      summary[key] = `[object:${Object.keys(value).length}]`;
    } else {
      summary[key] = value;
    }
  }

  return summary;
}
