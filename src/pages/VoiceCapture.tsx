import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { JSX, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Heart, Users, DollarSign, User, Briefcase, Lightbulb, Plane, ShoppingCart, GraduationCap, Sparkles, Radio, X, Mic, Square, Plus, ArrowUpRight, ArrowUp, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import type { AgentStatus } from "@/hooks/voiceAgentTypes";
import { useVoiceSession, type SessionMemory } from "@/contexts/VoiceSessionContext";
import { useAuth } from "@/contexts/AuthContext";
import type { SavedEntry } from "@/types/dashboard";
import "@/styles/app-preview.css"; // ap-micpulse / ap-softglow / ap-spin / ap-itemin / ap-badgein keyframes

const DataEntryForm = lazy(() => import("@/components/DataEntryForm").then((m) => ({ default: m.DataEntryForm })));
const EnhancedDocumentViewer = lazy(() => import("@/components/documents/EnhancedDocumentViewer").then((m) => ({ default: m.EnhancedDocumentViewer })));

/**
 * Expanded view of the app-owned Nova conversation and confirmed save receipts.
 * Manual forms and entry previews can still open inline below the microphone.
 */

type MemItem = SessionMemory;

const KICKER: Record<AgentStatus, string> = {
  connecting: "NOVA · CONNECTING",
  idle: "NOVA · READY",
  listening: "NOVA · LISTENING",
  thinking: "NOVA · THINKING",
  acting: "NOVA · WORKING",
  speaking: "NOVA · SPEAKING",
};
const SUB_TEXT: Record<AgentStatus, string> = {
  connecting: "Connecting realtime voice…",
  idle: "Ask Nova to save a thought, find a memory, or take you to another page.",
  listening: "Speak naturally — Nova replies when you finish, and you can interrupt.",
  thinking: "Nova is understanding your thought…",
  acting: "Nova is working on your request…",
  speaking: "Nova is responding — tap the mic to interrupt.",
};

const MONO = "'JetBrains Mono'";

const CATEGORY_ICON: Record<string, JSX.Element> = {
  documents: <FileText className="w-3.5 h-3.5" />,
  health: <Heart className="w-3.5 h-3.5" />,
  contacts: <Users className="w-3.5 h-3.5" />,
  finance: <DollarSign className="w-3.5 h-3.5" />,
  personal: <User className="w-3.5 h-3.5" />,
  work: <Briefcase className="w-3.5 h-3.5" />,
  ideas: <Lightbulb className="w-3.5 h-3.5" />,
  travel: <Plane className="w-3.5 h-3.5" />,
  shopping: <ShoppingCart className="w-3.5 h-3.5" />,
  learning: <GraduationCap className="w-3.5 h-3.5" />,
};
const categoryIcon = (cat: string) => CATEGORY_ICON[cat.toLowerCase()] || <Sparkles className="w-3.5 h-3.5" />;

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

const Waveform = ({ status, compact, levelRef }: { status: AgentStatus; compact: boolean; levelRef?: { current: number } }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<AgentStatus>(status);
  const energyRef = useRef<number | null>(null);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const accent = "#2dd4ff";
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w && h) {
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const mid = h / 2;
        const cx = w / 2;
        const t = motionPreference.matches ? 0 : performance.now() / 1000;
        const s = statusRef.current;
        let energy: number;
        const liveLevel = levelRef?.current ?? 0;
        // While listening, the wave follows the actual mic input; other states animate.
        if (s === "listening") energy = 0.16 + Math.min(1, liveLevel * 6.5);
        else if (s === "speaking") energy = 0.38 + 0.2 * Math.abs(Math.sin(t * 3.4));
        else if (s === "thinking" || s === "acting") energy = 0.24 + 0.14 * Math.sin(t * 5);
        else energy = 0.12;
        energyRef.current = energyRef.current == null ? energy : energyRef.current + (energy - energyRef.current) * 0.2;
        const e = energyRef.current;
        const gap = 58;
        const drawWave = (freqScale: number, phase: number, ampScale: number, width: number, color: string, blur: number) => {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.shadowColor = accent;
          ctx.shadowBlur = blur;
          for (const dir of [1, -1]) {
            ctx.beginPath();
            let started = false;
            for (let d = gap; d <= w / 2; d += 2) {
              const x = cx + dir * d;
              const edge = Math.max(0, 1 - d / (w / 2.02));
              const ramp = Math.min(1, (d - gap) / 56);
              const amp = h * 0.36 * e * ampScale * edge * ramp;
              const wv = Math.sin(d * freqScale - t * 5 + phase) * 0.62 + Math.sin(d * freqScale * 2.1 + t * 7 + phase) * 0.38;
              const y = mid + wv * amp;
              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        };
        drawWave(0.05, 0, 1, 2.8, accent, 16);
        drawWave(0.05, 0, 1, 1.3, "rgba(200,247,255,.92)", 0);
        ctx.globalAlpha = 0.4;
        drawWave(0.083, 1.4, 0.6, 1.4, accent, 8);
        ctx.globalAlpha = 1;
      }
      if (!motionPreference.matches) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const redraw = () => { cancelAnimationFrame(raf); draw(); };
    motionPreference.addEventListener("change", redraw);
    window.addEventListener("resize", redraw);
    return () => {
      cancelAnimationFrame(raf);
      motionPreference.removeEventListener("change", redraw);
      window.removeEventListener("resize", redraw);
    };
  }, [levelRef]);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: compact ? 0.7 : 1 }} aria-hidden="true" />;
};

const VoiceCapture = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    savedEntries, searchQuery, setSearchQuery, saveEntry, editEntry, deleteEntry,
    handleAddEntry, handleCancelEdit, getFormMode, getFormTitle, isSaving,
    showAddEntry, editingEntry, fillingEntry, templateEntry,
  } = useDashboard();

  const [viewerEntry, setViewerEntry] = useState<SavedEntry | null>(null);

  const { status, isConnected, connectedAt, microphoneActive, transcript, error, conversationHistory, continuous, setContinuous, startListening, stopListening, sendText, resetConversation, inputLevelRef, savedMemories: items, draft: textInput, setDraft: setTextInput } = useVoiceSession();
  const [seconds, setSeconds] = useState(0);
  const threadRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);

  // Conversation thread: full history plus the in-flight user turn (text sends
  // show up before the backend echoes them back in conversationHistory).
  const thread = conversationHistory
    .map((turn) => ({ role: turn.role, text: turn.parts.map((p) => p.text || "").join(" ").trim() }))
    .filter((turn) => turn.text);
  const lastUserText = [...thread].reverse().find((t) => t.role === "user")?.text;
  const pendingUserTurn = (status === "thinking" || status === "acting") && transcript && transcript !== lastUserText;

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length, status]);

  const isSupported = typeof window !== "undefined" && !!window.RTCPeerConnection && !!navigator.mediaDevices?.getUserMedia;
  const formActive = showAddEntry || !!editingEntry || !!fillingEntry || !!templateEntry;

  useEffect(() => {
    if (!connectedAt) {
      setSeconds(0);
      return;
    }
    const update = () => setSeconds(Math.floor((Date.now() - connectedAt) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [connectedAt]);

  const micClick = () => {
    if (status === "idle" || status === "speaking") startListening(); // speaking → barge-in
    else stopListening();
  };

  const submitText = (e: FormEvent) => {
    e.preventDefault();
    const text = textInput.trim();
    if (!text || status === "connecting" || status === "acting") return;
    setTextInput("");
    sendText(text);
  };

  const openMemoryItem = (item: MemItem) => {
    const match = savedEntries.find((e) => e.id === item.id);
    if (match) setViewerEntry(match);
    else navigate(`/all-entries/${encodeURIComponent(item.id)}`);
  };

  const clearSession = resetConversation;

  const micDisabled = !isSupported;
  const userName = user?.displayName || user?.email || "User";

  return (
    <DashboardLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      userName={userName}
      savedEntries={savedEntries}
      onAddEntry={handleAddEntry}
      onCategorySelect={(c) => navigate(`/category/${encodeURIComponent(c)}`)}
      onAllEntriesSelect={() => navigate("/all-entries")}
      onEditEntry={editEntry}
      onDeleteEntry={deleteEntry}
      onSaveEntry={saveEntry}
      onCancelEdit={handleCancelEdit}
    >
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div><p className="workspace-eyebrow mb-2">Your conversation with Nova</p><h1 className="text-2xl md:text-[30px] font-semibold tracking-tight">Voice capture</h1><p className="mt-2 text-sm text-muted-foreground">Think out loud. Pick up anywhere.</p></div>
        {(items.length > 0 || thread.length > 0) && status === "idle" && <button onClick={clearSession} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border/70 px-4 text-sm font-medium hover:bg-muted"><Plus className="h-4 w-4" />New conversation</button>}
      </header>
      <div className="grid grid-cols-1 min-[1180px]:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <section aria-label="Conversation with Nova" className="workspace-panel flex md:min-h-[620px] min-w-0 flex-col overflow-hidden">
          <div className="order-first flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-2.5 text-sm font-medium">
              <span className={`h-2 w-2 rounded-full ${microphoneActive ? "bg-emerald-400" : "bg-muted-foreground/60"}`} />
              <span role="status">{KICKER[status].replace("NOVA · ", "").toLowerCase().replace(/^./, (c) => c.toUpperCase())}</span>
              {isConnected && <span className="text-xs tabular-nums text-muted-foreground">{fmt(seconds)}</span>}
            </div>
            <button onClick={() => setContinuous(!continuous)} aria-pressed={continuous} title={continuous ? "Nova keeps listening after each reply" : "Tap the mic for each turn"} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted">
              <Radio className={`h-3.5 w-3.5 ${continuous ? "text-primary" : ""}`} />{continuous ? "Auto-listen on" : "Manual mode"}
            </button>
          </div>
          <div className="flex md:min-h-[300px] flex-1 flex-col px-5 py-5 md:py-6 md:px-8">
            {thread.length === 0 && !pendingUserTurn && !formActive && status !== "thinking" && status !== "acting" && (
              <div className="m-auto w-full max-w-md py-2 md:py-6 text-center">
                <span className="mx-auto mb-5 hidden md:grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></span>
                <h2 className="text-2xl font-semibold tracking-tight">What’s on your mind?</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{isSupported ? SUB_TEXT[status] : "Type below to talk with Nova. Voice capture needs a browser with microphone access."}</p>
                <div className="mt-6 grid gap-2 text-left">
                  {["Remember an idea…", "Find a memory…", "Take me to my dashboard"].map((prompt) => <button key={prompt} type="button" onClick={() => {setTextInput(prompt.endsWith("…") ? prompt.slice(0, -1) + " " : prompt); composerRef.current?.focus();}} className="flex min-h-11 items-center justify-between rounded-xl border border-border/70 px-4 text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground">{prompt}<ArrowUpRight className="h-3.5 w-3.5" /></button>)}
                </div>
              </div>
            )}
            {(thread.length > 0 || pendingUserTurn || status === "thinking" || status === "acting") && (
              <div ref={threadRef} role="log" aria-label="Conversation history" aria-live="polite" className="flex max-h-[440px] flex-col gap-5 overflow-y-auto pr-1 text-left">
                {thread.map((turn, i) => <div key={i} className={`max-w-[90%] ${turn.role === "user" ? "self-end rounded-2xl rounded-br-md bg-muted/50 px-4 py-3" : "self-start"}`}>
                  <span className={`mb-1.5 block text-xs font-semibold ${turn.role === "user" ? "text-muted-foreground" : "text-primary"}`}>{turn.role === "user" ? "You" : "Nova"}</span>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{turn.text}</p>
                </div>)}
                {pendingUserTurn && <div className="max-w-[90%] self-end rounded-2xl bg-muted/50 px-4 py-3 text-sm leading-relaxed">{transcript}</div>}
                {(status === "thinking" || status === "acting") && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />{status === "acting" ? "Working on your request…" : "Nova is thinking…"}</div>}
              </div>
            )}
          {/* Inline action surface — the form Nova (or you) opens, right here below the mic */}
          {formActive && (
            <div className="mt-6 w-full max-w-2xl text-left rounded-2xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b">
                <div>
                  <p className="font-semibold text-foreground">{getFormTitle()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Fill it in and save — or keep talking to Nova.</p>
                </div>
                <button onClick={handleCancelEdit} aria-label="Close form" className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 md:p-5">
                <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading form…</div>}>
                  <DataEntryForm
                    mode={getFormMode()}
                    editEntry={editingEntry || fillingEntry}
                    templateEntry={templateEntry}
                    onSave={saveEntry}
                    onCancel={handleCancelEdit}
                    isVoiceActive={status === "listening"}
                    isSaving={isSaving}
                  />
                </Suspense>
              </div>
            </div>
          )}


          </div>
          <div className="order-[-1] md:order-none border-b md:border-b-0 md:border-t border-border/60 bg-muted/10 px-5 pt-3 pb-5 md:px-8">
            <div className="relative mx-auto flex h-[96px] max-w-lg items-center justify-center">
              <Waveform status={status} compact levelRef={inputLevelRef} />
              <button onClick={micClick} disabled={micDisabled} aria-label={status === "speaking" ? "Interrupt Nova and speak" : status !== "idle" ? "End voice session" : "Start voice capture"} className="relative z-10 grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/10 transition-transform hover:scale-105 disabled:opacity-50">
                {status === "connecting" || status === "thinking" || status === "acting" ? <Loader2 className="h-6 w-6 animate-spin" /> : microphoneActive && status !== "speaking" ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-6 w-6" />}
              </button>
            </div>
            <div className="mb-4 flex min-h-5 flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
              <span>{microphoneActive ? `LIVE ${fmt(seconds)} · Microphone on` : isConnected ? "Microphone off · Conversation connected" : "Tap the microphone to start"}</span>
              {(isConnected || status === "connecting") && <button type="button" onClick={stopListening} className="min-h-9 font-medium text-foreground underline underline-offset-4">End session</button>}
            </div>
            {error && <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm"><p>{error}</p><button onClick={startListening} className="mt-2 font-semibold underline">Try again</button></div>}
            {!formActive && <form onSubmit={submitText} className="flex gap-2">
              <input ref={composerRef} value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Or type a message to Nova…" aria-label="Type a message to Nova" disabled={status === "connecting" || status === "acting"} className="min-w-0 flex-1 h-12 px-4 rounded-xl bg-card border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50" />
              <button type="submit" aria-label="Send message" disabled={status === "connecting" || status === "acting" || !textInput.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"><ArrowUp className="h-5 w-5" /></button>
            </form>}
            <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">Audio and relevant memory context are sent to OpenAI. <Link to="/privacy" className="underline underline-offset-2">Privacy details</Link></p>
          </div>
        </section>
        {/* Memory panel */}
        <aside className="workspace-panel p-5 flex flex-col">
          <div className="text-base font-semibold text-foreground">Saved this conversation</div>
          <div className="text-[13px] text-muted-foreground mt-1">{items.length} confirmed {items.length === 1 ? "save" : "saves"}</div>
          <div className="flex flex-col gap-3 mt-4 flex-1" aria-live="polite">
            {items.length === 0 ? (
              <div className="py-6 text-left">
                <Sparkles className="h-5 w-5 text-primary mb-3" />
                <p className="text-sm font-medium">Your next memory starts here</p>
                <p className="text-sm text-muted-foreground mt-2">Ask Nova to remember something. Confirmed saves appear here and stay with you as you browse.</p>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openMemoryItem(item)}
                  aria-label={`Open saved entry ${item.title}`}
                  className="relative w-full text-left cursor-pointer rounded-xl border border-border/70 bg-muted/20 px-4 py-3.5 overflow-hidden transition-colors hover:border-primary/40"
                  style={{ animation: "ap-itemin .5s cubic-bezier(.2,.8,.2,1) both" }}
                >
                  <div className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full" style={{ background: "#2dd4ff", boxShadow: "0 0 9px rgba(45,212,255,.7)" }} />
                  <div className="flex items-center justify-between mb-2 pl-2">
                    <span className="flex items-center gap-1.5 text-[#5fd6f0]" style={{ font: `600 10.5px ${MONO}`, letterSpacing: "0.13em" }}>
                      {categoryIcon(item.category)}
                      {item.category.toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1.5" style={{ font: `600 9.5px ${MONO}`, letterSpacing: "0.1em", color: "#34d399", animation: "ap-badgein .3s ease both" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 7px #34d399" }} />
                      SAVED
                    </span>
                  </div>
                  <div className="text-[15px] font-semibold text-foreground pl-2">{item.title}</div>
                  <div className="text-[12.5px] text-muted-foreground mt-0.5 pl-2">Saved to your vault</div>
                </button>
              ))
            )}
          </div>
          {items.length > 0 && (
            <button onClick={() => navigate("/all-entries")} className="mt-4 text-[13px] font-semibold text-primary text-left hover:underline">
              View all entries →
            </button>
          )}
        </aside>
      </div>

      {/* Entry/document viewer Nova opens via "open entry" */}
      <Suspense fallback={null}>
        {viewerEntry && (
          <EnhancedDocumentViewer
            isOpen={!!viewerEntry}
            onClose={() => setViewerEntry(null)}
            entry={viewerEntry}
            onEdit={(e: SavedEntry) => {
              setViewerEntry(null);
              editEntry(e);
            }}
            allEntries={savedEntries}
            onOpenRelatedEntry={(e: SavedEntry) => setViewerEntry(e)}
          />
        )}
      </Suspense>
    </DashboardLayout>
  );
};

export default VoiceCapture;
