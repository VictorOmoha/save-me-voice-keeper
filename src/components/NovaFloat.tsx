import React, {useEffect, useRef, useState} from "react";
import {ChevronDown, Maximize2, Mic, Square, X} from "lucide-react";
import {useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "@/contexts/AuthContext";
import {useVoiceSession} from "@/contexts/VoiceSessionContext";
import {NovaVoiceAgent} from "@/components/NovaVoiceAgent";

/** Compact and expanded controls for the app-owned voice session. */
export const NovaFloat = () => {
  const {user} = useAuth();
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const voice = useVoiceSession();
  const {microphoneActive, startListening} = voice;
  const [expanded, setExpanded] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const collapse = useRef<HTMLButtonElement>(null);
  const active = voice.isConnected || voice.status !== "idle";

  useEffect(() => { setExpanded(false); }, [pathname]);
  useEffect(() => {
    const handoff = () => {
      setExpanded(true);
      if (!microphoneActive) startListening();
    };
    window.addEventListener("nova:voice-handoff", handoff);
    return () => window.removeEventListener("nova:voice-handoff", handoff);
  }, [microphoneActive, startListening]);
  useEffect(() => { if (expanded) collapse.current?.focus(); }, [expanded]);

  // The capture page already displays these controls and this transcript.
  if (!user || pathname === "/voice-capture") return null;

  const minimize = () => { setExpanded(false); trigger.current?.focus(); };
  const end = () => { voice.stopListening(); minimize(); };
  const stateLabel = voice.error ? "Connection interrupted" : voice.status === "connecting" ? "Connecting…"
    : voice.status === "speaking" ? "Nova is speaking" : voice.status === "acting" ? "Working on your request"
    : voice.status === "thinking" ? "Nova is thinking" : voice.microphoneActive ? "Listening" : active ? "Connected" : "Talk to Nova";

  return (
    <section aria-label="Nova conversation" className="nova-conversation fixed bottom-4 right-3 left-3 sm:left-auto sm:right-6 z-50" onKeyDown={(event) => {
      if (event.key === "Escape" && expanded) { event.stopPropagation(); minimize(); }
    }}>
      {expanded && (
        <div data-testid="nova-float-panel" className="mb-3 w-full sm:w-[440px] max-w-[calc(100vw-24px)] h-[min(580px,calc(100dvh-120px))] flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
            <h2 className="text-sm font-semibold">Nova · Your conversation</h2>
            <div className="flex items-center">
              <button onClick={() => navigate("/voice-capture")} aria-label="Open full voice capture" className="h-10 w-10 grid place-items-center rounded-lg hover:bg-muted"><Maximize2 className="h-4 w-4" /></button>
              <button ref={collapse} onClick={minimize} aria-label="Minimize conversation" className="h-10 w-10 grid place-items-center rounded-lg hover:bg-muted"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={end} aria-label="End session and close" className="h-10 w-10 grid place-items-center rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex-1 min-h-0"><NovaVoiceAgent /></div>
        </div>
      )}
      <div className="flex justify-end">
        <div data-testid="nova-voice-dock" className="max-w-full flex items-center gap-1 rounded-2xl border border-primary/20 bg-card px-2 py-1.5 shadow-xl shadow-black/20">
          <button ref={trigger} onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Minimize Nova conversation" : "Open Nova conversation"} aria-expanded={expanded}
            className="flex min-w-0 items-center gap-3 text-left px-2 py-1 rounded-xl hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary">
            <span className={`h-9 w-9 rounded-full grid place-items-center ${voice.microphoneActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}><Mic className="h-4 w-4" /></span>
            <span className={`min-w-0 ${!active && !expanded ? "hidden sm:block" : ""}`}>
              <span className="block text-sm font-semibold" role="status">{stateLabel}</span>
              <span className="block text-xs text-muted-foreground">{voice.microphoneActive ? "Microphone on · continues across pages" : active ? "Microphone off" : voice.conversationHistory.length ? "Conversation kept · microphone off" : "Voice and text, anywhere"}</span>
            </span>
          </button>
          {active && <button onClick={end} aria-label="End voice session" className="shrink-0 h-11 px-3 rounded-xl text-sm font-medium hover:bg-destructive/10 hover:text-destructive flex items-center gap-2"><Square className="h-3.5 w-3.5" />End</button>}
        </div>
      </div>
    </section>
  );
};

export default NovaFloat;
