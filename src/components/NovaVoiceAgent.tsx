/**
 * NovaVoiceAgent.tsx
 * Conversational AI interface — live action feed + continuous listening.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, RotateCcw, Send, Sparkles, CheckCircle2, XCircle, Loader2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceAgent, UseVoiceAgentOptions, AgentStatus } from "@/hooks/useVoiceAgent";
import { cn } from "@/lib/utils";

const STATUS_TEXT: Record<AgentStatus, string> = {
  idle: "Not listening. Tap the mic to start.",
  listening: "Stop recording to save",
  thinking: "Processing your memory...",
  acting: "Saving this to your archive...",
  speaking: "Nova is speaking...",
};

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle: "bg-primary",
  listening: "bg-red-600",
  thinking: "bg-amber-500",
  acting: "bg-violet-500",
  speaking: "bg-emerald-500",
};

const formatNovaError = (message: string) => {
  const lower = message.toLowerCase();

  if (lower.includes("voice agent failed")) {
    return "Nova couldn't start voice capture. Check microphone access and try again.";
  }

  if (lower.includes("not authenticated")) {
    return "Sign in again so Nova can save this memory securely.";
  }

  if (lower.includes("mic error") || lower.includes("microphone") || lower.includes("permission") || lower.includes("denied")) {
    return message;
  }

  return "Nova hit a problem while processing this memory. Try again in a moment.";
};

// Tool name → friendly label
const ACTION_ICON: Record<string, string> = {
  saveEntry: "💾",
  searchEntries: "🔍",
  getRecentEntries: "📋",
  updateEntry: "✏️",
  deleteEntry: "🗑️",
  navigateApp: "🧭",
  navigateToCategory: "📂",
  openEntryForm: "➕",
  openEntry: "📄",
  updateTheme: "🎨",
  updateProfile: "👤",
  toggleNotification: "🔔",
  updateVoiceSettings: "🎙️",
  exportUserData: "📦",
  rememberFact: "🧠",
  recallMemories: "💭",
  forgetMemory: "🗑️",
  printEntry: "🖨️",
  scrollPage: "📜",
};

type NovaVoiceAgentProps = UseVoiceAgentOptions & {
  autoGreet?: boolean;
  autoStartListeningToken?: number;
  displayName?: string;
};

export const NovaVoiceAgent: React.FC<NovaVoiceAgentProps> = ({
  autoGreet,
  autoStartListeningToken,
  displayName,
  ...props
}) => {
  const {
    status, transcript, responseText, error,
    actions, conversationHistory, continuous, setContinuous,
    startListening, stopListening, sendText, resetConversation,
  } = useVoiceAgent(props);

  const [textInput, setTextInput] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);
  const lastAutoStartTokenRef = useRef<number | undefined>(undefined);

  // ── Auto-greet on first open ──────────────────────────────────────────────
  useEffect(() => {
    if (
      autoGreet &&
      !hasGreetedRef.current &&
      conversationHistory.length === 0 &&
      status === "idle"
    ) {
      hasGreetedRef.current = true;
      // Small delay so the panel animation completes first
      setTimeout(() => {
        sendText(`__nova_greet__:${displayName || "there"}`);
      }, 400);
    }
  }, [autoGreet, conversationHistory.length, status, sendText, displayName]);

  // ── Auto-listen when another surface hands off an active Nova conversation ─
  useEffect(() => {
    if (
      autoStartListeningToken &&
      autoStartListeningToken !== lastAutoStartTokenRef.current &&
      status === "idle"
    ) {
      lastAutoStartTokenRef.current = autoStartListeningToken;
      startListening();
    }
  }, [autoStartListeningToken, status, startListening]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversationHistory, actions, status]);

  useEffect(() => {
    if (status !== "listening") {
      setRecordingSeconds(0);
      return;
    }

    const timer = window.setInterval(() => {
      setRecordingSeconds(seconds => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [status]);

  const recordingTime = `${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, "0")}`;

  const handleMicClick = () => {
    if (status === "idle") startListening();
    else if (status === "listening") stopListening();
  };

  const handleSend = async () => {
    const text = textInput.trim();
    if (!text || status !== "idle") return;
    setTextInput("");
    await sendText(text);
  };

  const isDisabled = status === "thinking" || status === "acting" || status === "speaking";
  const displayTurns = conversationHistory.filter(t => t.parts?.some(p => p.text));

  return (
    <div className="flex flex-col h-full">

      {/* Controls bar — continuous mode + reset */}
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-b shrink-0">
        <button
          onClick={() => setContinuous(!continuous)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors",
            continuous
              ? "bg-emerald-500/15 text-emerald-600"
              : "bg-muted text-muted-foreground"
          )}
          title={continuous ? "Continuous mode ON — Nova auto-listens after each response" : "Continuous mode OFF"}
        >
          <Radio className={cn("h-3 w-3", continuous && "animate-pulse")} />
          {continuous ? "Auto-listen on" : "Manual"}
        </button>

        {conversationHistory.length > 0 && (
          <button
            onClick={resetConversation}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">

        {displayTurns.length === 0 && actions.length === 0 && status === "idle" && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Hey, I'm Nova</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
                {continuous
                  ? "Auto-listen is on, but the mic is off until Nova finishes responding or you tap the mic."
                  : "Tap the mic when you want Nova to hear you, or type below."}
              </p>
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {displayTurns.map((turn, i) => {
          const text = turn.parts.find(p => p.text)?.text || "";
          const isUser = turn.role === "user";
          return (
            <div key={i} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                isUser
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              )}>
                {text}
              </div>
            </div>
          );
        })}

        {/* Live action feed */}
        {actions.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-muted/60 border rounded-xl px-3 py-2 space-y-1.5 max-w-[85%]">
              {actions.map((action, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span>{ACTION_ICON[action.tool] || "⚡"}</span>
                  <span className={cn(
                    "flex-1",
                    action.status === "done" ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {action.label.replace("...", action.status === "done" ? "" : "...")}
                  </span>
                  {action.status === "done" && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
                  {action.status === "error" && <XCircle className="h-3 w-3 text-destructive shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thinking / acting indicator */}
        {(status === "thinking" || status === "acting") && actions.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {status === "thinking" ? "Processing your memory..." : "Saving this to your archive..."}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center">
            {formatNovaError(error)}
          </div>
        )}
      </div>

      {/* Live transcript */}
      {status === "listening" && (
        <div className="mx-4 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">Listening now</p>
              <p className="text-xs text-muted-foreground">Tap Stop when you are finished. Nova will process the memory after this.</p>
            </div>
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white tabular-nums animate-pulse">
              {recordingTime}
            </span>
          </div>
          {transcript && (
            <p className="mt-2 rounded-lg bg-background/70 px-3 py-2 text-xs text-foreground italic">
              {transcript}
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="px-4 pb-4 pt-2 space-y-2.5 border-t shrink-0">

        {/* Status + Mic */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleMicClick}
            disabled={isDisabled}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
              STATUS_COLOR[status], "text-white",
              status === "listening" && "ring-4 ring-red-300 scale-110 animate-pulse",
              status === "speaking" && "ring-4 ring-emerald-300",
              isDisabled && "opacity-60 cursor-not-allowed scale-100"
            )}
            title={status === "listening" ? "Stop recording" : "Start recording"}
            aria-label={status === "listening" ? "Stop Nova recording" : "Start Nova recording"}
          >
            {status === "listening"
              ? <Square className="h-4 w-4 fill-white" />
              : <Mic className="h-4 w-4" />}
          </button>
          <span className={cn(
            "text-xs min-w-[140px]",
            status === "listening" ? "font-semibold text-red-700 dark:text-red-300" : "text-muted-foreground"
          )}>
            {continuous && status === "idle"
              ? "Mic is off. Auto-listen is on after Nova responds."
              : STATUS_TEXT[status]}
          </span>
        </div>

        {/* Text input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Or type here..."
            disabled={isDisabled}
            className={cn(
              "flex-1 h-9 rounded-lg border bg-background px-3 text-sm outline-none",
              "placeholder:text-muted-foreground focus:ring-1 focus:ring-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          <Button size="sm" onClick={handleSend} disabled={isDisabled || !textInput.trim()} className="h-9 px-3">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NovaVoiceAgent;
