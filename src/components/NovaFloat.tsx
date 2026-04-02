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
  const hasGreetedRef = useRef(false);

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
      navigate(`/all-entries?search=${encodeURIComponent(actionData.query)}`);
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
        className={cn(
          "fixed z-50 w-full sm:w-[420px] sm:right-6",
          "bg-background border shadow-2xl",
          "transition-all duration-300 ease-out",
          isMinimized
            ? "bottom-0 sm:bottom-20 rounded-t-2xl sm:rounded-2xl"
            : "bottom-0 sm:bottom-20 rounded-t-2xl sm:rounded-2xl",
          isVisible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-6 opacity-0 pointer-events-none"
        )}
        style={{
          height: isMinimized ? "48px" : "clamp(420px, 60vh, 600px)",
          overflow: "hidden",
        }}
      >
        {/* Minimized header bar */}
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
            <span className="font-semibold text-sm">Nova</span>
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
              title={isMinimized ? "Expand Nova" : "Minimize — scroll freely"}
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
              title="Close Nova"
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
            autoGreet={shouldGreet}
            displayName={user?.displayName || user?.email?.split("@")[0] || "there"}
          />
        </div>
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
        aria-label="Open Nova AI"
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
