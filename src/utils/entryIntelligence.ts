import { SavedEntry } from "@/types/dashboard";

export interface EntryIntelligenceSignals {
  summary: string;
  tags: string[];
  linkedCount: number;
  actionItemCount: number;
  reminderLikeCount: number;
  isEnriched: boolean;
}

export const getEntryIntelligenceSignals = (entry: SavedEntry): EntryIntelligenceSignals => {
  const summary = ((entry as SavedEntry & { summary?: string }).summary || "").trim();
  const tags = (((entry as SavedEntry & { tags?: string[] }).tags || []).filter(Boolean) as string[]);
  const linkedCount = (((entry as SavedEntry & { linked_entries?: string[] }).linked_entries || []).filter(Boolean) as string[]).length;
  const actionItemCount = Array.isArray((entry as SavedEntry & { action_items?: unknown[] }).action_items)
    ? (((entry as SavedEntry & { action_items?: unknown[] }).action_items || []).filter(Boolean) as unknown[]).length
    : 0;

  const reminderLikeCount = Object.entries(entry.fields || {}).filter(([key, value]) => {
    if (!value) return false;
    const normalized = key.toLowerCase();
    return normalized.includes("remind") || normalized.includes("due") || normalized.includes("deadline");
  }).length;

  const isEnriched = Boolean(summary || tags.length || linkedCount || actionItemCount || reminderLikeCount);

  return {
    summary,
    tags,
    linkedCount,
    actionItemCount,
    reminderLikeCount,
    isEnriched,
  };
};
