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

import React, { useState, useCallback } from "react";
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

type PanelState = "closed" | "minimized" | "open";

export const NovaFloat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [panelState, setPanelState] = useState<PanelState>("closed");
  const [liveAction, setLiveAction] = useState<NovaActionPayload | null>(null);

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

  const handleSettingsUpdated = useCallback((setting: string, value?: any) => {
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
    navigate("/settings");
    toast.info(`Opening data management to export as ${format.toUpperCase()}...`);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("nova:export-data", { detail: { format } }));
    }, 500);
  }, [navigate]);

  const handlePrintEntry = useCallback((entries: any[]) => {
    if (!entries.length) {
      toast.error("No entries found to print");
      return;
    }
    // Convert backend entry shape to SavedEntry shape for printProfessionally
    const printable = entries.map((e: any) => ({
      id: e.id,
      title: e.title || "Untitled",
      fields: e.fields || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    printProfessionally(printable, {
      title: entries.length === 1 ? entries[0].title : `${entries.length} Entries`,
      includeMetadata: true,
    });
    toast.success(`Print dialog opened for ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`);
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
            onStartBrainDump={handleStartBrainDump}
            onProcessBrainDump={handleProcessBrainDump}
            onSaveBrainDump={handleSaveBrainDump}
            onUpdateTheme={handleUpdateTheme}
            onSettingsUpdated={handleSettingsUpdated}
            onExportData={handleExportData}
            onPrintEntry={handlePrintEntry}
            onNovaAction={handleNovaAction}
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
