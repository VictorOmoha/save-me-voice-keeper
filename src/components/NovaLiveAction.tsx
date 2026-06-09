import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2, FileText, Tag, AlignLeft, List,
  Search, Brain, Trash2, Bell, ListChecks, Pencil, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const asNumber = (v: unknown): number => (typeof v === "number" ? v : 0);

export type NovaActionType =
  | "save_entry" | "update_entry" | "delete_entry"
  | "search" | "remember" | "forget"
  | "update_task" | "set_reminder";

export interface NovaActionPayload {
  actionType: NovaActionType;
  actionData: Record<string, unknown>;
}

interface NovaLiveActionProps {
  action: NovaActionPayload;
  onComplete: (action: NovaActionPayload) => void;
}

// ── Config per action type ────────────────────────────────────────────────────
const ACTION_CONFIG: Record<NovaActionType, {
  icon: React.ElementType;
  activeLabel: string;
  doneLabel: string;
  color: string;
  doneColor: string;
}> = {
  save_entry:    { icon: FileText,   activeLabel: "Nova is creating an entry...",  doneLabel: "Entry saved",           color: "bg-violet-500", doneColor: "text-emerald-600 dark:text-emerald-400" },
  update_entry:  { icon: Pencil,     activeLabel: "Nova is updating the entry...", doneLabel: "Entry updated",         color: "bg-blue-500",   doneColor: "text-blue-600 dark:text-blue-400" },
  delete_entry:  { icon: Trash2,     activeLabel: "Nova is deleting the entry...", doneLabel: "Entry deleted",         color: "bg-red-500",    doneColor: "text-red-600 dark:text-red-400" },
  search:        { icon: Search,     activeLabel: "Nova is searching...",          doneLabel: "Search complete",       color: "bg-amber-500",  doneColor: "text-amber-600 dark:text-amber-400" },
  remember:      { icon: Brain,      activeLabel: "Nova is storing a memory...",   doneLabel: "Memory stored",         color: "bg-purple-500", doneColor: "text-purple-600 dark:text-purple-400" },
  forget:        { icon: XCircle,    activeLabel: "Nova is removing memories...",  doneLabel: "Memory removed",        color: "bg-slate-500",  doneColor: "text-slate-600 dark:text-slate-400" },
  update_task:   { icon: ListChecks, activeLabel: "Nova is updating a task...",    doneLabel: "Task updated",          color: "bg-teal-500",   doneColor: "text-teal-600 dark:text-teal-400" },
  set_reminder:  { icon: Bell,       activeLabel: "Nova is setting a reminder...", doneLabel: "Reminder set",          color: "bg-orange-500", doneColor: "text-orange-600 dark:text-orange-400" },
};

// ── Entry form animation (save_entry / update_entry) ──────────────────────────
const EntryFormBody = ({ data, actionType, onPhaseDone }: {
  data: Record<string, unknown>;
  actionType: "save_entry" | "update_entry";
  onPhaseDone: () => void;
}) => {
  const [typedTitle, setTypedTitle] = useState("");
  const [showCategory, setShowCategory] = useState(false);
  const [typedContent, setTypedContent] = useState("");
  const [visibleFields, setVisibleFields] = useState(0);
  const [phase, setPhase] = useState<"title" | "category" | "content" | "fields" | "done">("title");

  const title = asString(data.title);
  const category = asString(data.category);
  const content = asString(data.content);
  const fields = Array.isArray(data.fields) ? data.fields as Array<{ key: string; value: string }> : null;

  useEffect(() => {
    if (phase !== "title" || !title) { if (!title) { setPhase("done"); setTimeout(onPhaseDone, 100); } return; }
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTypedTitle(title.slice(0, i));
      if (i >= title.length) { clearInterval(iv); setTimeout(() => setPhase(category ? "category" : content ? "content" : fields?.length ? "fields" : "done"), 250); }
    }, 35);
    return () => clearInterval(iv);
  }, [phase, title, category, content, fields, onPhaseDone]);

  useEffect(() => {
    if (phase !== "category") return;
    const t = setTimeout(() => { setShowCategory(true); setTimeout(() => setPhase(content ? "content" : fields?.length ? "fields" : "done"), 350); }, 200);
    return () => clearTimeout(t);
  }, [phase, content, fields]);

  useEffect(() => {
    if (phase !== "content" || !content) return;
    let i = 0;
    const iv = setInterval(() => { i += 2; setTypedContent(content.slice(0, i)); if (i >= content.length) { clearInterval(iv); setTimeout(() => setPhase(fields?.length ? "fields" : "done"), 250); } }, 15);
    return () => clearInterval(iv);
  }, [phase, content, fields]);

  useEffect(() => {
    if (phase !== "fields" || !fields?.length) return;
    let i = 0;
    const iv = setInterval(() => { i++; setVisibleFields(i); if (i >= fields.length) { clearInterval(iv); setTimeout(() => setPhase("done"), 250); } }, 200);
    return () => clearInterval(iv);
  }, [phase, fields]);

  useEffect(() => { if (phase === "done") onPhaseDone(); }, [phase, onPhaseDone]);

  return (
    <div className="p-4 space-y-3">
      {title && (
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <FileText className="w-3 h-3" /> Title
          </label>
          <div className="px-3 py-2 rounded-md border border-border bg-background min-h-[36px] text-sm">
            {typedTitle}
            {phase === "title" && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />}
          </div>
        </div>
      )}
      {category && (
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <Tag className="w-3 h-3" /> Category
          </label>
          <div className="px-3 py-2 rounded-md border border-border bg-background min-h-[36px]">
            {showCategory ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary animate-in zoom-in-50 duration-200">{category}</span>
            ) : phase === "category" ? (
              <span className="inline-block w-16 h-5 rounded-full bg-muted animate-pulse" />
            ) : null}
          </div>
        </div>
      )}
      {content && (
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <AlignLeft className="w-3 h-3" /> Content
          </label>
          <div className="px-3 py-2 rounded-md border border-border bg-background min-h-[36px] text-sm text-muted-foreground">
            {typedContent}
            {phase === "content" && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />}
          </div>
        </div>
      )}
      {fields && fields.length > 0 && (
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <List className="w-3 h-3" /> Fields
          </label>
          <div className="space-y-1.5">
            {fields.slice(0, visibleFields).map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-background text-sm animate-in slide-in-from-left-2 duration-200">
                <span className="font-medium text-xs text-muted-foreground min-w-[80px]">{f.key}</span>
                <span className="text-foreground">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Delete animation ──────────────────────────────────────────────────────────
const DeleteBody = ({ data, onPhaseDone }: { data: Record<string, unknown>; onPhaseDone: () => void }) => {
  const [struck, setStruck] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setStruck(true), 400);
    const t2 = setTimeout(onPhaseDone, 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onPhaseDone]);

  return (
    <div className="p-4 flex items-center justify-center">
      <div className={cn("text-base font-medium transition-all duration-500", struck ? "line-through opacity-40 scale-95" : "opacity-100")}>
        {asString(data.title) || "Entry"}
      </div>
    </div>
  );
};

// ── Search results animation ──────────────────────────────────────────────────
const SearchBody = ({ data, onPhaseDone }: { data: Record<string, unknown>; onPhaseDone: () => void }) => {
  const results = useMemo(
    () => (Array.isArray(data.results)
      ? data.results as Array<{ title: string; category?: string }>
      : []),
    [data.results]
  );
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (results.length === 0) { onPhaseDone(); return; }
    let i = 0;
    const iv = setInterval(() => { i++; setVisible(i); if (i >= results.length) { clearInterval(iv); setTimeout(onPhaseDone, 400); } }, 200);
    return () => clearInterval(iv);
  }, [results, onPhaseDone]);

  return (
    <div className="p-4 space-y-1.5">
      {results.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-2">No results found</div>
      ) : results.slice(0, visible).map((r, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background text-sm animate-in slide-in-from-left-2 duration-200">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{r.title}</span>
          {r.category && <span className="ml-auto text-xs text-muted-foreground shrink-0">{r.category}</span>}
        </div>
      ))}
      <div className="text-xs text-muted-foreground text-center pt-1">{asNumber(data.count)} result{asNumber(data.count) !== 1 ? "s" : ""} found</div>
    </div>
  );
};

// ── Quick action animation (memory, task, reminder) ───────────────────────────
const QuickActionBody = ({ data, actionType, onPhaseDone }: {
  data: Record<string, unknown>;
  actionType: NovaActionType;
  onPhaseDone: () => void;
}) => {
  const [typed, setTyped] = useState("");
  const text = actionType === "remember" ? asString(data.content)
    : actionType === "forget" ? `Removed ${data.count || 0} memor${(data.count || 0) === 1 ? "y" : "ies"}`
    : actionType === "update_task" ? `"${data.text || "Task"}" → ${data.status || "updated"}`
    : actionType === "set_reminder" ? (asString(data.text) || "Reminder")
    : "";

  const when = data.when;
  const subtext = actionType === "set_reminder" && (typeof when === "string" || typeof when === "number" || when instanceof Date)
    ? new Date(when).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : actionType === "remember" && data.category ? asString(data.category)
    : null;

  useEffect(() => {
    if (!text) { onPhaseDone(); return; }
    let i = 0;
    const iv = setInterval(() => { i += 2; setTyped(text.slice(0, i)); if (i >= text.length) { clearInterval(iv); setTimeout(onPhaseDone, 500); } }, 25);
    return () => clearInterval(iv);
  }, [text, onPhaseDone]);

  return (
    <div className="p-4 space-y-2">
      <div className="px-3 py-2 rounded-md border border-border bg-background min-h-[36px] text-sm">
        {typed}
        {typed.length < text.length && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />}
      </div>
      {subtext && (
        <div className="text-xs text-muted-foreground text-center">{subtext}</div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export const NovaLiveAction = ({ action, onComplete }: NovaLiveActionProps) => {
  const [done, setDone] = useState(false);
  const config = ACTION_CONFIG[action.actionType];
  const Icon = config.icon;

  const handlePhaseDone = useCallback(() => {
    setTimeout(() => setDone(true), 300);
  }, []);

  // Auto-dismiss after done
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => onComplete(action), 1500);
    return () => clearTimeout(t);
  }, [done, onComplete, action]);

  const renderBody = () => {
    const { actionType, actionData } = action;
    if (actionType === "save_entry" || actionType === "update_entry") {
      return <EntryFormBody data={actionData} actionType={actionType} onPhaseDone={handlePhaseDone} />;
    }
    if (actionType === "delete_entry") {
      return <DeleteBody data={actionData} onPhaseDone={handlePhaseDone} />;
    }
    if (actionType === "search") {
      return <SearchBody data={actionData} onPhaseDone={handlePhaseDone} />;
    }
    return <QuickActionBody data={actionData} actionType={actionType} onPhaseDone={handlePhaseDone} />;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => onComplete(action)}
    >
      <div
        className="w-full max-w-sm mx-4 bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className={cn("w-2 h-2 rounded-full transition-colors duration-300", done ? "bg-emerald-500" : `${config.color} animate-pulse`)} />
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {done ? config.doneLabel : config.activeLabel}
          </span>
        </div>

        {/* Body */}
        {renderBody()}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-center">
          {done ? (
            <div className={cn("flex items-center gap-2 animate-in zoom-in-50 duration-300", config.doneColor)}>
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">{config.doneLabel}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              <span className="text-xs">Working...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
