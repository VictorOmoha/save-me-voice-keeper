/**
 * NovaFloat.tsx
 * Floating Nova button + slide-up panel. Lives globally in App.tsx.
 * Only visible when the user is authenticated.
 *
 * States:
 *  - closed: just the floating trigger button
 *  - minimized: slim header bar only (page is fully scrollable)
 *  - open: full panel
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, X, Mic, ChevronDown, ChevronUp } from "lucide-react";
import { NovaVoiceAgent } from "@/components/NovaVoiceAgent";
import { NovaLiveAction } from "@/components/NovaLiveAction";
import type { NovaActionPayload } from "@/components/NovaLiveAction";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { printProfessionally } from "@/components/entries/ProfessionalPrintView";
import type { NovaActionPayload as HookPayload } from "@/hooks/useVoiceAgent";
import type { SavedEntry } from "@/types/dashboard";

type PanelState = "closed" | "minimized" | "open";

/**
 * Canonical Nova orchestration shell.
 *
 * Ownership boundary:
 * - UI shell / panel state lives here
 * - conversational transport lives in NovaVoiceAgent/useVoiceAgent
 * - backend tool execution lives in Firebase voiceAgent
 * - app-wide reactions are emitted as stable window events for pages/dialogs to consume
 *
 * Do not add alternate assistant execution paths here.
 */
export const NovaFloat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [liveAction, setLiveAction] = useState<NovaActionPayload | null>(null);
  const [shouldGreet, setShouldGreet] = useState(false);
  const [autoStartListeningToken, setAutoStartListeningToken] = useState(0);
  const hasGreetedRef = useRef(false);

  // ── Resizable panel ──────────────────────────────────────────────────────
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelSize, setPanelSize] = useState({ width: 560, height: 500 });
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    resizeStartRef.current = {
      x: clientX,
      y: clientY,
      width: panelSize.width,
      height: panelSize.height,
    };

    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
  }, [panelSize]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = resizeStartRef.current.x - clientX;
      const deltaY = resizeStartRef.current.y - clientY;

      setPanelSize({
        width: Math.max(340, resizeStartRef.current.width + deltaX),
        height: Math.max(300, resizeStartRef.current.height + deltaY),
      });
    };

    const handleUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, []);

  const isPrintableEntry = (entry: Record<string, unknown>): entry is Partial<SavedEntry> & { id: string } => {
    return typeof entry.id === "string";
  };

  // Fire greeting the first time the panel opens
  useEffect(() => {
    if (panelState === "open" && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      setShouldGreet(true);
      // Reset flag so NovaVoiceAgent can consume it
      setTimeout(() => setShouldGreet(false), 200);
    }
  }, [panelState]);

  // Brain Dump can hand an active voice session to the global Nova panel.
  // Open Nova and auto-start the mic so the user does not have to tap again.
  useEffect(() => {
    const handleVoiceHandoff = () => {
      hasGreetedRef.current = true;
      setShouldGreet(false);
      setPanelState("open");
      setAutoStartListeningToken((token) => token + 1);
    };

    window.addEventListener("nova:voice-handoff", handleVoiceHandoff);
    return () => window.removeEventListener("nova:voice-handoff", handleVoiceHandoff);
  }, []);

  const handleNavigate = useCallback((route: string) => {
    navigate(route);
    setPanelState("closed");
  }, [navigate]);

  const handleOpenEntryForm = useCallback((category?: string | null) => {
    const params = category ? `?action=create&category=${encodeURIComponent(category)}` : "?action=create";
    navigate(`/dashboard${params}`);
    setPanelState("closed");
  }, [navigate]);

  const handleOpenEntry = useCallback((id?: string | null, title?: string | null) => {
    if (id) navigate(`/all-entries/${id}`);
    else if (title) navigate(`/all-entries?search=${encodeURIComponent(title || "")}`);
    setPanelState("closed");
  }, [navigate]);

  const handleGoBack = useCallback(() => {
    // Dispatch event so the current page can close any open form/dialog first
    window.dispatchEvent(new CustomEvent("nova:close"));
  }, []);

  const handleScrollPage = useCallback((direction: string) => {
    const scrollContainer = document.querySelector("main") || document.documentElement;
    const viewportHeight = window.innerHeight;

    switch (direction) {
      case "down":
        scrollContainer.scrollBy({ top: viewportHeight * 0.8, behavior: "smooth" });
        break;
      case "up":
        scrollContainer.scrollBy({ top: -viewportHeight * 0.8, behavior: "smooth" });
        break;
      case "top":
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "bottom":
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: "smooth" });
        break;
    }
  }, []);

  const handleStartBrainDump = useCallback(() => {
    sessionStorage.setItem("brain_dump_auto_start", JSON.stringify({ autoStart: true, autoSpeak: false }));
    navigate("/brain-dump");
    setPanelState("minimized");
  }, [navigate]);

  const handleProcessBrainDump = useCallback(() => {
    window.dispatchEvent(new CustomEvent("brain-dump:process"));
  }, []);

  const handleSaveBrainDump = useCallback((category?: string | null) => {
    window.dispatchEvent(new CustomEvent("brain-dump:save", { detail: { category: category || undefined } }));
  }, []);

  const handleUpdateTheme = useCallback((theme: string) => {
    if (theme === "light" || theme === "dark" || theme === "system") {
      setTheme(theme);
      toast.success(`Theme switched to ${theme}`);
    }
  }, [setTheme]);

  const handleSettingsUpdated = useCallback((setting: string, value?: unknown) => {
    const labels: Record<string, string> = {
      profile: "Profile updated",
      email_notifications: `Email notifications ${value ? "enabled" : "disabled"}`,
      push_notifications: `Push notifications ${value ? "enabled" : "disabled"}`,
      reminder_notifications: `Reminders ${value ? "enabled" : "disabled"}`,
      automation_notifications: `Automation alerts ${value ? "enabled" : "disabled"}`,
      voice: "Voice settings updated",
    };
    toast.success(labels[setting] || "Settings updated");
    window.dispatchEvent(new CustomEvent("nova:settings-updated", { detail: { setting, value } }));
  }, []);

  const handleExportData = useCallback((format: string) => {
    navigate("/settings?tab=data-management");
    toast.info(`Opening data management to export as ${format.toUpperCase()}...`);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("nova:export-data", { detail: { format } }));
    }, 500);
    setPanelState("minimized");
  }, [navigate]);

  const handlePrintEntry = useCallback((entries: Record<string, unknown>[]) => {
    if (!entries.length) {
      toast.error("No entries found to print");
      return;
    }

    const printable: SavedEntry[] = entries.filter(isPrintableEntry).map((entry) => ({
      id: entry.id,
      title: typeof entry.title === "string" ? entry.title : "Untitled",
      fields: entry.fields && typeof entry.fields === "object" ? entry.fields as SavedEntry["fields"] : {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    if (!printable.length) {
      toast.error("No printable entries found");
      return;
    }

    printProfessionally(printable, {
      title: printable.length === 1 ? printable[0].title : `${printable.length} Entries`,
      includeMetadata: true,
    });
    toast.success(`Print dialog opened for ${printable.length} ${printable.length === 1 ? "entry" : "entries"}`);
  }, []);

  // ── Unified Nova action handler ──────────────────────────────────────────
  const handleNovaAction = useCallback((payload: HookPayload) => {
    setLiveAction({ actionType: payload.actionType, actionData: payload.actionData } as NovaActionPayload);
  }, []);

  // ── After live action animation completes, execute post-action UI update ─
  const handleActionComplete = useCallback((action: NovaActionPayload) => {
    setLiveAction(null);
    const { actionType, actionData } = action;

    // Notify the app that entries changed (dashboard/all-entries can listen to refresh)
    if (["save_entry", "update_entry", "delete_entry"].includes(actionType)) {
      window.dispatchEvent(new CustomEvent("nova:entries-changed", { detail: { actionType, id: actionData.id } }));
    }

    // Navigate to show the entry after save/update
    if ((actionType === "save_entry" || actionType === "update_entry") && actionData.id) {
      navigate(`/all-entries/${actionData.id}`);
      setPanelState("minimized");
    }

    // After search, navigate to all-entries with search query
    if (actionType === "search" && actionData.query) {
      navigate(`/all-entries?search=${encodeURIComponent(String(actionData.query))}`);
      setPanelState("minimized");
    }

    // After delete, refresh the current page
    if (actionType === "delete_entry") {
      navigate("/all-entries");
      setPanelState("minimized");
    }
  }, [navigate]);

  // Early return AFTER all hooks
  if (!user) return null;

  const isOpen = panelState === "open";
  const isMinimized = panelState === "minimized";
  const isVisible = isOpen || isMinimized;

  return (
    <>
      {/* Panel */}
      <div
        ref={panelRef}
        data-testid="nova-float-panel"
        className={cn(
          "fixed z-50 sm:right-6 lg:right-8",
          "bg-background/95 border shadow-2xl backdrop-blur-md",
          "transition-[opacity,transform] duration-300 ease-out",
          isMinimized
            ? "bottom-0 sm:bottom-24 rounded-t-2xl sm:rounded-2xl"
            : "bottom-0 sm:bottom-24 rounded-t-2xl sm:rounded-2xl",
          isVisible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-6 opacity-0 pointer-events-none"
        )}
        style={{
          width: isMinimized ? undefined : `${panelSize.width}px`,
          height: isMinimized ? "48px" : `${panelSize.height}px`,
          minWidth: isMinimized ? undefined : "340px",
          minHeight: isMinimized ? undefined : "300px",
          overflow: isMinimized ? "hidden" : "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
        <div
          className={cn(
            "flex items-center justify-between px-4 shrink-0",
            "h-12 border-b cursor-pointer select-none",
            isMinimized ? "border-transparent" : "border-border"
          )}
          onClick={() => setPanelState(isMinimized ? "open" : "minimized")}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Anam</span>
            {isMinimized && (
              <span className="text-xs text-muted-foreground">· tap to expand</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPanelState(isMinimized ? "open" : "minimized");
              }}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              title={isMinimized ? "Expand Anam" : "Minimize — scroll freely"}
            >
              {isMinimized
                ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPanelState("closed");
              }}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              title="Close Anam"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Full panel content */}
        <div
          className={cn(
            "h-[calc(100%-48px)] transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <NovaVoiceAgent
            onNavigate={handleNavigate}
            onOpenEntryForm={handleOpenEntryForm}
            onOpenEntry={handleOpenEntry}
            onGoBack={handleGoBack}
            onScrollPage={handleScrollPage}
            onStartBrainDump={handleStartBrainDump}
            onProcessBrainDump={handleProcessBrainDump}
            onSaveBrainDump={handleSaveBrainDump}
            onUpdateTheme={handleUpdateTheme}
            onSettingsUpdated={handleSettingsUpdated}
            onExportData={handleExportData}
            onPrintEntry={handlePrintEntry}
            onNovaAction={handleNovaAction}
            continuous={true}
            autoGreet={shouldGreet}
            autoStartListeningToken={autoStartListeningToken}
            displayName={user?.displayName || user?.email?.split("@")[0] || "there"}
          />
        </div>

        {/* Resize handle — drag bottom-right corner */}
        {!isMinimized && (
          <div
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize group z-10"
            style={{ touchAction: "none" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="absolute bottom-1 right-1 text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors"
            >
              <path d="M14 2L14 14L2 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 14L14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Nova live action overlay */}
      {liveAction && (
        <NovaLiveAction
          action={liveAction}
          onComplete={handleActionComplete}
        />
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setPanelState("open")}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full shadow-lg",
          "flex items-center justify-center",
          "bg-primary text-primary-foreground",
          "transition-all duration-200 hover:scale-105 active:scale-95",
          isVisible ? "opacity-0 pointer-events-none scale-90" : "opacity-100"
        )}
        aria-label="Open Anam"
      >
        <div className="relative">
          <Mic className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
        </div>
      </button>
    </>
  );
};

export default NovaFloat;
