export interface ToolValidationResult {
  valid: boolean;
  error?: string;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function validateToolArgs(toolName: string, args: Record<string, any>): ToolValidationResult {
  switch (toolName) {
  case "navigateApp":
      return isNonEmptyString(args.route) ? {valid: true} : {valid: false, error: "navigateApp requires route"};

  case "navigateToCategory":
      return isNonEmptyString(args.category) ? {valid: true} : {valid: false, error: "navigateToCategory requires category"};

  case "openEntry":
      return (isNonEmptyString(args.id) || isNonEmptyString(args.title)) ? {valid: true} : {valid: false, error: "openEntry requires id or title"};

  case "printEntry":
      return (isNonEmptyString(args.id) || isNonEmptyString(args.title) || isNonEmptyString(args.category))
        ? {valid: true}
        : {valid: false, error: "printEntry requires id, title, or category"};

  case "saveEntry":
      return isNonEmptyString(args.title) ? {valid: true} : {valid: false, error: "saveEntry requires title"};

  case "searchEntries":
  case "recallMemories":
  case "forgetMemory":
  case "getEntityGraph":
      return isNonEmptyString(args.query) ? {valid: true} : {valid: false, error: `${toolName} requires query`};

  case "rememberFact":
      return isNonEmptyString(args.content) ? {valid: true} : {valid: false, error: "rememberFact requires content"};

  case "updateEntry":
      return isNonEmptyString(args.id) ? {valid: true} : {valid: false, error: "updateEntry requires id"};

  case "deleteEntry":
      return isNonEmptyString(args.id) ? {valid: true} : {valid: false, error: "deleteEntry requires id"};

  case "updateTheme":
      return isNonEmptyString(args.theme) ? {valid: true} : {valid: false, error: "updateTheme requires theme"};

  case "toggleNotification":
      return isNonEmptyString(args.type) && typeof args.enabled === "boolean"
        ? {valid: true}
        : {valid: false, error: "toggleNotification requires type and enabled boolean"};

  case "prepareBriefing":
      return isNonEmptyString(args.subject) ? {valid: true} : {valid: false, error: "prepareBriefing requires subject"};

  case "getRelatedEntries":
      return (isNonEmptyString(args.topic) || isNonEmptyString(args.entryId))
        ? {valid: true}
        : {valid: false, error: "getRelatedEntries requires topic or entryId"};

  case "getActivitySummary":
  case "getUpcomingDeadlines":
      return isNonEmptyString(args.timeframe) ? {valid: true} : {valid: false, error: `${toolName} requires timeframe`};

  case "updateActionItem":
      return isNonEmptyString(args.query) && isNonEmptyString(args.status)
        ? {valid: true}
        : {valid: false, error: "updateActionItem requires query and status"};

  case "setReminder":
      return isNonEmptyString(args.text) && isNonEmptyString(args.when)
        ? {valid: true}
        : {valid: false, error: "setReminder requires text and when"};

  default:
      return {valid: true};
  }
}

export function summarizeToolArgs(args: Record<string, any>): Record<string, any> {
  const summary: Record<string, any> = {};

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
