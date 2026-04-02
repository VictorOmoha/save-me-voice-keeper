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
  idle: "Tap to speak",
  listening: "Listening...",
  thinking: "Nova is thinking...",
  acting: "Nova is acting...",
  speaking: "Nova is speaking...",
};

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle: "bg-primary",
  listening: "bg-red-500",
  thinking: "bg-amber-500",
  acting: "bg-violet-500",
  speaking: "bg-emerald-500",
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
  displayName?: string;
};

export const NovaVoiceAgent: React.FC<NovaVoiceAgentProps> = ({
  autoGreet,
  displayName,
  ...props
}) => {
  const {
    status, transcript, responseText, error,
    actions, conversationHistory, continuous, setContinuous,
    startListening, stopListening, sendText, resetConversation,
  } = useVoiceAgent(props);

  const [textInput, setTextInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);

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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversationHistory, actions, status]);

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
          {continuous ? "Live" : "Manual"}
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
                  ? "I'm always listening after I respond. Just talk."
                  : "Tap the mic and talk. I'll handle the rest."}
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
                {status === "thinking" ? "Nova is thinking..." : "Working on it..."}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Live transcript */}
      {status === "listening" && transcript && (
        <div className="mx-4 mb-1 px-3 py-1.5 bg-muted/40 rounded-lg text-xs text-muted-foreground italic shrink-0">
          {transcript}
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
              status === "listening" && "ring-4 ring-red-300 scale-110",
              status === "speaking" && "ring-4 ring-emerald-300",
              isDisabled && "opacity-60 cursor-not-allowed scale-100"
            )}
          >
            {status === "listening"
              ? <Square className="h-4 w-4 fill-white" />
              : <Mic className="h-4 w-4" />}
          </button>
          <span className="text-xs text-muted-foreground min-w-[110px]">
            {STATUS_TEXT[status]}
            {continuous && status === "idle" && " · auto-on"}
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
