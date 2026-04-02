/**
 * QuickCaptureOverlay
 *
 * Command-palette style instant capture. Opens anywhere in the app
 * without navigating away — just press C (or Ctrl+Enter).
 *
 * Flow:
 *  1. User presses C (or shortcut) → overlay slides in
 *  2. Title auto-focused, Tab to content
 *  3. Nova predicts category live as user types (debounced, dryRun)
 *  4. Enter to save → calls quickSave API → shows confirmation
 *  5. Auto-closes after 1.5s — user is back exactly where they were
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcutsContext";

const QUICK_SAVE_URL = `${import.meta.env.VITE_CLOUD_FUNCTIONS_URL}/quickSave`;

const CATEGORY_COLORS: Record<string, string> = {
  Work: "#3b82f6",
  Health: "#22c55e",
  Finance: "#f59e0b",
  Contacts: "#a78bfa",
  Ideas: "#f472b6",
  Books: "#fb923c",
  Personal: "#64748b",
  Notes: "#06b6d4",
};

type SaveState = "idle" | "predicting" | "saving" | "saved" | "error";

interface Prediction {
  category: string;
  predicted: boolean;
  confidence: number;
}

export const QuickCaptureOverlay: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [prediction, setPrediction] = useState<Prediction>({ category: "Personal", predicted: false, confidence: 0 });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedCategory, setSavedCategory] = useState("");

  const titleRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const predictTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { registerShortcut } = useKeyboardShortcuts();

  // ── Register shortcut: C to open ─────────────────────────────────────────
  useEffect(() => {
    registerShortcut({
      key: "c",
      description: "Quick Capture — save anything instantly",
      action: () => setOpen(true),
      category: "Actions",
    });
    // Also listen for Ctrl+N dispatched from useGlobalShortcuts
    const handleCtrlN = () => setOpen(true);
    window.addEventListener("saveme:quick-capture", handleCtrlN);
    return () => window.removeEventListener("saveme:quick-capture", handleCtrlN);
  }, [registerShortcut]);

  // ── Focus title on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => titleRef.current?.focus(), 50);
    } else {
      // Reset on close
      setTitle("");
      setContent("");
      setPrediction({ category: "Personal", predicted: false, confidence: 0 });
      setSaveState("idle");
    }
  }, [open]);

  // ── Escape / Nova close to close ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    const handleNovaClose = () => setOpen(false);
    window.addEventListener("keydown", handler, true);
    window.addEventListener("nova:close", handleNovaClose);
    return () => {
      window.removeEventListener("keydown", handler, true);
      window.removeEventListener("nova:close", handleNovaClose);
    };
  }, [open]);

  // ── Backdrop click to close ───────────────────────────────────────────────
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setOpen(false);
  }, []);

  // ── Live category prediction (debounced 500ms) ────────────────────────────
  useEffect(() => {
    if (!open || (!title.trim() && !content.trim())) {
      setPrediction({ category: "Personal", predicted: false, confidence: 0 });
      return;
    }

    if (predictTimerRef.current) clearTimeout(predictTimerRef.current);
    setSaveState("predicting");

    predictTimerRef.current = setTimeout(async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) return;

        const res = await fetch(QUICK_SAVE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: title.trim(), content: content.trim(), dryRun: true }),
        });

        if (res.ok) {
          const data = await res.json();
          setPrediction({
            category: data.category || "Personal",
            predicted: data.categoryPredicted || false,
            confidence: data.categoryConfidence || 0,
          });
        }
      } catch {
        // Prediction failure is non-fatal
      } finally {
        setSaveState("idle");
      }
    }, 500);

    return () => {
      if (predictTimerRef.current) clearTimeout(predictTimerRef.current);
    };
  }, [title, content, open]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const t = title.trim();
    if (!t || saveState === "saving" || saveState === "saved") return;

    setSaveState("saving");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) { setSaveState("error"); return; }

      const res = await fetch(QUICK_SAVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: t, content: content.trim() }),
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      setSavedCategory(data.category || "Personal");
      setSaveState("saved");

      window.dispatchEvent(new CustomEvent('nova:entries-changed', {
        detail: { actionType: 'save_entry', id: data.id }
      }));

      // Auto-close after showing confirmation
      setTimeout(() => setOpen(false), 1500);

    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2000);
    }
  }, [title, content, saveState]);

  // ── Enter to save (not inside textarea) ──────────────────────────────────
  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  const handleContentKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  if (!open) return null;

  const catColor = CATEGORY_COLORS[prediction.category] || "#64748b";
  const isBusy = saveState === "saving";
  const isSaved = saveState === "saved";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "w-full max-w-lg bg-background border rounded-2xl shadow-2xl",
          "animate-in slide-in-from-top-4 fade-in duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Quick Capture</span>
            <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">C</kbd>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Saved confirmation */}
        {isSaved ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="font-semibold text-sm">Saved</p>
            <p className="text-xs text-muted-foreground">
              Filed under <span className="font-medium" style={{ color: catColor }}>{savedCategory}</span>
            </p>
          </div>
        ) : (
          <>
            {/* Form */}
            <div className="p-4 space-y-3">
              {/* Title */}
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                placeholder="What do you want to save?"
                disabled={isBusy}
                className={cn(
                  "w-full text-base font-medium bg-transparent border-0 outline-none",
                  "placeholder:text-muted-foreground/50",
                  "disabled:opacity-50"
                )}
                maxLength={200}
                autoComplete="off"
              />

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Content */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleContentKeyDown}
                placeholder="Notes, context, details... (optional)"
                disabled={isBusy}
                rows={3}
                className={cn(
                  "w-full text-sm bg-transparent border-0 outline-none resize-none",
                  "placeholder:text-muted-foreground/40 leading-relaxed",
                  "disabled:opacity-50"
                )}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 pb-4 gap-3">
              {/* Nova category badge */}
              <div className="flex items-center gap-2 min-w-0">
                {saveState === "predicting" ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Predicting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: catColor }}
                    />
                    <span className="text-muted-foreground truncate">{prediction.category}</span>
                    {prediction.predicted && (
                      <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Nova
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Save button */}
              <div className="flex items-center gap-2">
                {saveState === "error" && (
                  <span className="text-xs text-destructive">Save failed</span>
                )}
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || isBusy}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90 transition-all",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {isBusy ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                  ) : (
                    <>Save <kbd className="text-[10px] opacity-70 ml-1">↵</kbd></>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuickCaptureOverlay;
