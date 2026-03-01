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

import React, { useState } from "react";
import { Sparkles, X, Mic, ChevronDown, ChevronUp } from "lucide-react";
import { NovaVoiceAgent } from "@/components/NovaVoiceAgent";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type PanelState = "closed" | "minimized" | "open";

export const NovaFloat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [panelState, setPanelState] = useState<PanelState>("closed");

  if (!user) return null;

  const handleNavigate = (route: string) => {
    navigate(route);
    setPanelState("closed");
  };

  const handleOpenEntryForm = (category?: string | null) => {
    const params = category ? `?action=create&category=${encodeURIComponent(category)}` : "?action=create";
    navigate(`/dashboard${params}`);
    setPanelState("closed");
  };

  const handleOpenEntry = (id?: string | null, title?: string | null) => {
    if (id) navigate(`/all-entries/${id}`);
    else if (title) navigate(`/all-entries?search=${encodeURIComponent(title || "")}`);
    setPanelState("closed");
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleStartBrainDump = () => {
    sessionStorage.setItem("brain_dump_auto_start", JSON.stringify({ autoStart: true, autoSpeak: false }));
    navigate("/brain-dump");
    setPanelState("minimized");
  };

  const handleProcessBrainDump = () => {
    window.dispatchEvent(new CustomEvent("brain-dump:process"));
  };

  const handleSaveBrainDump = (category?: string | null) => {
    window.dispatchEvent(new CustomEvent("brain-dump:save", { detail: { category: category || undefined } }));
  };

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
          // Position: anchored to bottom on mobile, above FAB on desktop
          isMinimized
            ? "bottom-0 sm:bottom-20 rounded-t-2xl sm:rounded-2xl"
            : "bottom-0 sm:bottom-20 rounded-t-2xl sm:rounded-2xl",
          // Visibility
          isVisible
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-6 opacity-0 pointer-events-none"
        )}
        style={{
          height: isMinimized ? "48px" : "clamp(420px, 60vh, 600px)",
          overflow: "hidden",
        }}
      >
        {/* Minimized header bar — always rendered, acts as drag handle / title */}
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
            {/* Minimize / expand toggle */}
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
            {/* Close button */}
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

        {/* Full panel content — only visible when open */}
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
          />
        </div>
      </div>

      {/* Floating trigger button — hidden when panel is visible */}
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
