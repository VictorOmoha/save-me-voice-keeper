/**
 * NovaVoiceAgent.tsx
 * Conversational AI interface — live action feed + continuous listening.
 * Terminal-style UI matching VoiceDemoAnimation.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, RotateCcw, Send, Sparkles, CheckCircle2, XCircle, Loader2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceAgent, UseVoiceAgentOptions, AgentStatus } from "@/hooks/useVoiceAgent";
import { cn } from "@/lib/utils";

const STATUS_TEXT: Record<AgentStatus, string> = {
  idle: "",
  listening: "",
  thinking: "PROCESSING",
  acting: "SAVING",
  speaking: "SPEAKING",
};

const formatNovaError = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes("voice agent failed"))
    return "Anam couldn't start voice capture. Check microphone access and try again.";
  if (lower.includes("not authenticated"))
    return "Sign in again so Anam can save this memory securely.";
  if (lower.includes("provider") || lower.includes("temporarily unavailable") || lower.includes("timed out") || lower.includes("timeout"))
    return "The AI provider is busy. I saved your message and will retry when you send again.";
  if (lower.includes("mic error") || lower.includes("microphone") || lower.includes("permission") || lower.includes("denied"))
    return message;
  return "Anam hit a problem while processing this memory. Try again in a moment.";
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

  // ── Auto-greet on first open ──
  useEffect(() => {
    if (autoGreet && !hasGreetedRef.current && conversationHistory.length === 0 && status === "idle") {
      hasGreetedRef.current = true;
      setTimeout(() => { sendText(`__nova_greet__:${displayName || "there"}`); }, 400);
    }
  }, [autoGreet, conversationHistory.length, status, sendText, displayName]);

  // ── Auto-listen ──
  useEffect(() => {
    if (autoStartListeningToken && autoStartListeningToken !== lastAutoStartTokenRef.current && status === "idle") {
      lastAutoStartTokenRef.current = autoStartListeningToken;
      startListening();
    }
  }, [autoStartListeningToken, status, startListening]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversationHistory, actions, status]);

  useEffect(() => {
    if (status !== "listening") { setRecordingSeconds(0); return; }
    const timer = window.setInterval(() => { setRecordingSeconds(s => s + 1); }, 1000);
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

      {/* ── Controls bar ── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Anam</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setContinuous(!continuous)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-colors",
              continuous ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
            )}
            title={continuous ? "Continuous mode ON" : "Continuous mode OFF"}
          >
            <Radio className={cn("h-2.5 w-2.5", continuous && "animate-pulse")} />
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
      </div>

      {/* ── Conversation area ── */}
      <div ref={scrollRef} className={cn("flex-1 overflow-y-auto px-4 py-3 space-y-3", status === "listening" && "hidden")}>

        {/* Empty state */}
        {displayTurns.length === 0 && actions.length === 0 && status === "idle" && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Hey, I'm Anam</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
                {continuous
                  ? "Auto-listen is on, but the mic is off until Anam finishes responding."
                  : "Tap the mic when you want Anam to hear you, or type below."}
              </p>
            </div>
          </div>
        )}

        {/* Terminal-style messages */}
        {displayTurns.map((turn, i) => {
          const text = turn.parts.find(p => p.text)?.text || "";
          const isUser = turn.role === "user";
          return (
            <div key={i} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[88%] px-3.5 py-2 text-sm leading-relaxed",
                isUser
                  ? "bg-primary/10 text-foreground rounded-xl"
                  : "text-foreground"
              )}>
                {isUser ? (
                  <div className="flex items-start gap-2">
                    <Mic className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="font-mono text-xs sm:text-sm">{text}</span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm">{text}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Live action feed — styled as checkmarked result cards */}
        {actions.length > 0 && (
          <div className="space-y-1.5">
            {actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {action.status === "done" && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />}
                {action.status === "error" && <XCircle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />}
                {action.status === "pending" && <Loader2 className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5 animate-spin" />}
                <span className={cn(
                  "flex-1",
                  action.status === "done" ? "text-foreground" : "text-muted-foreground"
                )}>
                  {action.label.replace("...", action.status === "done" ? "" : "...")}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Thinking / acting indicator */}
        {(status === "thinking" || status === "acting") && actions.length === 0 && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {status === "thinking" ? "PROCESSING" : "SAVING"}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center">
            {formatNovaError(error)}
          </div>
        )}
      </div>

      {/* ── Live transcript + waveform (expanded) ── */}
      {status === "listening" && (
        <div className="mx-3 mb-2 rounded-xl bg-primary/5 border-2 border-primary/20 px-5 py-5 shrink-0 flex-1 flex flex-col justify-center min-h-[0]">
          {/* Mic icon + pulse + timer row */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                <Square className="h-5 w-5 fill-white text-white" />
              </div>
              <span className="absolute -inset-1.5 rounded-full border border-red-500/40 animate-ping" />
            </div>

            {/* Waveform bars (bigger) */}
            <div className="flex items-center gap-[4px] h-10 flex-1">
              {[30, 55, 80, 100, 70, 45, 65, 90, 50, 75, 35, 60].map((h, i) => (
                <span
                  key={i}
                  className="w-[5px] rounded-full bg-primary/50"
                  style={{
                    height: `${h}%`,
                    animation: `waveform-pulse 1s ease-in-out ${i * 0.1}s infinite`,
                  }}
                />
              ))}
            </div>

            {/* Timer */}
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white tabular-nums animate-pulse shrink-0">
              {recordingTime}
            </span>
          </div>

          {/* Live transcription (larger text, prominent) */}
          <div className="rounded-xl bg-background/70 px-5 py-4 border border-primary/10">
            {transcript ? (
              <p className="text-base sm:text-lg text-foreground font-mono leading-relaxed">
                "{transcript}"
                <span className="inline-block w-[3px] h-[1.1em] ml-1 align-text-bottom animate-pulse bg-primary" />
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
                <span className="text-sm text-muted-foreground font-mono tracking-wider uppercase">
                  Listening...
                </span>
              </div>
            )}
          </div>

          {/* Hint */}
          <p className="text-[11px] text-muted-foreground/60 text-center mt-3">
            Tap the red stop button when you're done
          </p>
        </div>
      )}

      {/* ── Speaking indicator ── */}
      {(status === "speaking") && (
        <div className="mx-4 mb-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="uppercase tracking-wider">Anam is speaking</span>
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="px-4 pb-4 pt-2 space-y-2.5 border-t shrink-0">

        {/* Status + Mic */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleMicClick}
            disabled={isDisabled}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-md",
              status === "listening"
                ? "bg-red-600 text-white ring-4 ring-red-300 scale-110 animate-pulse"
                : status === "speaking"
                  ? "bg-emerald-600 text-white ring-4 ring-emerald-300"
                  : "bg-primary text-white hover:bg-primary/90",
              isDisabled && "opacity-60 cursor-not-allowed scale-100"
            )}
            aria-label={status === "listening" ? "Stop Anam recording" : "Start Anam recording"}
          >
            {status === "listening"
              ? <Square className="h-4 w-4 fill-white" />
              : <Mic className="h-4 w-4" />}
          </button>
          <span className={cn(
            "text-xs min-w-[120px] tracking-wider",
            status === "listening" ? "font-semibold text-red-600" : "text-muted-foreground"
          )}>
            {STATUS_TEXT[status] || (continuous && status === "idle"
              ? "Auto-listen on — tap mic to start"
              : "Tap mic or type below")}
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

      {/* Keyframes */}
      <style>{`
        @keyframes waveform-pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
        }
      `}</style>
    </div>
  );
};

export default NovaVoiceAgent;