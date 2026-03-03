import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, FileText, Tag, AlignLeft, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LiveEntryData } from "@/hooks/useVoiceAgent";

interface LiveEntryExecutionProps {
  data: LiveEntryData;
  onComplete: () => void;
}

type Phase = "title" | "category" | "content" | "fields" | "saving" | "done";

export const LiveEntryExecution = ({ data, onComplete }: LiveEntryExecutionProps) => {
  const [phase, setPhase] = useState<Phase>("title");
  const [typedTitle, setTypedTitle] = useState("");
  const [showCategory, setShowCategory] = useState(false);
  const [typedContent, setTypedContent] = useState("");
  const [visibleFields, setVisibleFields] = useState(0);
  const [showCheck, setShowCheck] = useState(false);

  // Phase 1: Type the title
  useEffect(() => {
    if (phase !== "title") return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedTitle(data.title.slice(0, i));
      if (i >= data.title.length) {
        clearInterval(interval);
        setTimeout(() => {
          setPhase(data.category ? "category" : data.content ? "content" : data.fields?.length ? "fields" : "saving");
        }, 300);
      }
    }, 35);
    return () => clearInterval(interval);
  }, [phase, data.title, data.category, data.content, data.fields]);

  // Phase 2: Show category badge
  useEffect(() => {
    if (phase !== "category") return;
    const t = setTimeout(() => {
      setShowCategory(true);
      setTimeout(() => {
        setPhase(data.content ? "content" : data.fields?.length ? "fields" : "saving");
      }, 400);
    }, 200);
    return () => clearTimeout(t);
  }, [phase, data.content, data.fields]);

  // Phase 3: Type content
  useEffect(() => {
    if (phase !== "content" || !data.content) return;
    const text = data.content;
    let i = 0;
    const interval = setInterval(() => {
      i += 2; // Faster for content
      setTypedContent(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setTimeout(() => {
          setPhase(data.fields?.length ? "fields" : "saving");
        }, 300);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [phase, data.content, data.fields]);

  // Phase 4: Reveal fields one by one
  useEffect(() => {
    if (phase !== "fields" || !data.fields?.length) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleFields(i);
      if (i >= data.fields!.length) {
        clearInterval(interval);
        setTimeout(() => setPhase("saving"), 300);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, data.fields]);

  // Phase 5: Saving animation
  useEffect(() => {
    if (phase !== "saving") return;
    const t = setTimeout(() => {
      setShowCheck(true);
      setPhase("done");
    }, 600);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase 6: Auto-dismiss
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(onComplete, 1800);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  const handleDismiss = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleDismiss}
    >
      <div
        className="w-full max-w-sm mx-4 bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className={cn(
            "w-2 h-2 rounded-full transition-colors duration-300",
            phase === "done" ? "bg-emerald-500" : "bg-violet-500 animate-pulse"
          )} />
          <span className="text-xs font-medium text-muted-foreground">
            {phase === "done" ? "Entry saved" : "Nova is creating an entry..."}
          </span>
        </div>

        {/* Form body */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <FileText className="w-3 h-3" />
              Title
            </label>
            <div className="px-3 py-2 rounded-md border border-border bg-background min-h-[36px] text-sm">
              {typedTitle}
              {phase === "title" && (
                <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
              )}
            </div>
          </div>

          {/* Category */}
          {data.category && (
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <Tag className="w-3 h-3" />
                Category
              </label>
              <div className="px-3 py-2 rounded-md border border-border bg-background min-h-[36px]">
                {showCategory ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary animate-in zoom-in-50 duration-200">
                    {data.category}
                  </span>
                ) : phase === "category" ? (
                  <span className="inline-block w-16 h-5 rounded-full bg-muted animate-pulse" />
                ) : null}
              </div>
            </div>
          )}

          {/* Content */}
          {data.content && (
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <AlignLeft className="w-3 h-3" />
                Content
              </label>
              <div className="px-3 py-2 rounded-md border border-border bg-background min-h-[36px] text-sm text-muted-foreground">
                {typedContent}
                {phase === "content" && (
                  <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
                )}
              </div>
            </div>
          )}

          {/* Structured Fields */}
          {data.fields && data.fields.length > 0 && (
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <List className="w-3 h-3" />
                Fields
              </label>
              <div className="space-y-1.5">
                {data.fields.slice(0, visibleFields).map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background text-sm animate-in slide-in-from-left-2 duration-200"
                  >
                    <span className="font-medium text-xs text-muted-foreground min-w-[80px]">{f.key}</span>
                    <span className="text-foreground">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — save indicator */}
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-center">
          {showCheck ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Saved to vault</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              <span className="text-xs">Saving...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
