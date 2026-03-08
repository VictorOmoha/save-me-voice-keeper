import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SavedEntry } from "@/types/dashboard";
import { Brain, CheckSquare, Link2, Tags } from "lucide-react";

interface EntryIntelligencePanelProps {
  entry: SavedEntry;
  allEntries?: SavedEntry[];
  onOpenEntry?: (entry: SavedEntry) => void;
}

const normalizeActionItems = (entry: SavedEntry): string[] => {
  const extracted = Array.isArray((entry as SavedEntry & { action_items?: unknown[] }).action_items)
    ? ((entry as SavedEntry & { action_items?: unknown[] }).action_items || []).map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "text" in item) {
          return String((item as { text?: string }).text || "").trim();
        }
        return "";
      })
    : [];

  const fieldBased = typeof entry.fields?.actionItems === "string"
    ? String(entry.fields.actionItems)
        .split(/\n|•/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return [...extracted, ...fieldBased].filter(Boolean).slice(0, 5);
};

export const EntryIntelligencePanel: React.FC<EntryIntelligencePanelProps> = ({
  entry,
  allEntries = [],
  onOpenEntry,
}) => {
  const summary = (entry as SavedEntry & { summary?: string }).summary || "";
  const tags = ((entry as SavedEntry & { tags?: string[] }).tags || []).filter(Boolean);
  const linkedEntryIds = ((entry as SavedEntry & { linked_entries?: string[] }).linked_entries || []).filter(Boolean);
  const actionItems = useMemo(() => normalizeActionItems(entry), [entry]);

  const relatedEntries = useMemo(() => {
    if (!allEntries.length) return [];

    const explicit = allEntries.filter((candidate) => linkedEntryIds.includes(candidate.id));
    if (explicit.length > 0) return explicit.slice(0, 4);

    const entryTerms = new Set(
      [entry.title, ...(tags || [])]
        .flatMap((value) => String(value).toLowerCase().split(/\s+/))
        .map((term) => term.replace(/[^a-z0-9]/gi, ""))
        .filter((term) => term.length > 2)
    );

    return allEntries
      .filter((candidate) => candidate.id !== entry.id)
      .map((candidate) => {
        const haystack = `${candidate.title} ${Object.values(candidate.fields).join(" ")}`.toLowerCase();
        let score = 0;
        entryTerms.forEach((term) => {
          if (haystack.includes(term)) score += 1;
        });
        return { candidate, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.candidate);
  }, [allEntries, entry.id, entry.title, entry.fields, linkedEntryIds, tags]);

  if (!summary && tags.length === 0 && actionItems.length === 0 && relatedEntries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Entry Intelligence
        </h3>
      </div>

      {summary && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Brain className="w-4 h-4 text-primary" />
            Summary
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
        </div>
      )}

      {tags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Tags className="w-4 h-4 text-primary" />
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 8).map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {actionItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CheckSquare className="w-4 h-4 text-green-500" />
            Action Items
          </div>
          <div className="space-y-2">
            {actionItems.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-lg border bg-background/80 p-3 text-sm text-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {relatedEntries.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Link2 className="w-4 h-4 text-primary" />
            Related Entries
          </div>
          <div className="flex flex-wrap gap-2">
            {relatedEntries.map((related) => (
              <Button
                key={related.id}
                type="button"
                variant="outline"
                size="sm"
                className="max-w-full"
                onClick={() => onOpenEntry?.(related)}
              >
                <span className="truncate max-w-[180px]">{related.title}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntryIntelligencePanel;
