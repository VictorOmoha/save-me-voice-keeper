import { useRelatedEntries } from "@/hooks/useRelatedEntries";

interface RelatedEntriesPanelProps {
  entryId: string | null;
  onOpenEntry?: (id: string) => void;
}

export const RelatedEntriesPanel = ({ entryId, onOpenEntry }: RelatedEntriesPanelProps) => {
  const { relatedEntries, loading } = useRelatedEntries(entryId);

  if (loading || relatedEntries.length === 0) return null;

  return (
    <div className="mt-4 border-t pt-3">
      <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <span className="inline-block w-3 h-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </span>
        Related Entries
      </h4>
      <div className="space-y-1">
        {relatedEntries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => onOpenEntry?.(entry.id)}
            className="w-full text-left text-sm px-2 py-1.5 rounded-md hover:bg-accent transition-colors truncate text-foreground/80 hover:text-foreground"
          >
            <span className="font-medium">{entry.title}</span>
            {entry.category && (
              <span className="ml-2 text-xs text-muted-foreground">{entry.category}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
