import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { JSX, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Heart, Users, DollarSign, User, Briefcase, Lightbulb, Plane, ShoppingCart, GraduationCap, Sparkles, Radio, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { useVoiceAgent, MAX_RECORDING_SECONDS, type AgentStatus } from "@/hooks/useVoiceAgent";
import { useAuth } from "@/contexts/AuthContext";
import type { SavedEntry } from "@/types/dashboard";
import "@/styles/app-preview.css"; // ap-micpulse / ap-softglow / ap-spin / ap-itemin / ap-badgein keyframes

const DataEntryForm = lazy(() => import("@/components/DataEntryForm").then((m) => ({ default: m.DataEntryForm })));
const EnhancedDocumentViewer = lazy(() => import("@/components/documents/EnhancedDocumentViewer").then((m) => ({ default: m.EnhancedDocumentViewer })));

/**
 * VoiceCapture — the live conversational voice screen. Driven by useVoiceAgent,
 * the user talks to Nova; auto-categorized memories land in the Memory panel,
 * and when Nova opens a form or an entry, that UI surfaces inline below the mic.
 */

interface MemItem {
  kind: string;
  title: string;
  note: string;
  category: string;
}

const KICKER: Record<AgentStatus, string> = {
  idle: "NOVA · READY",
  listening: "NOVA · LISTENING",
  thinking: "NOVA · THINKING",
  acting: "NOVA · SAVING",
  speaking: "NOVA · SPEAKING",
};
const SUB_TEXT: Record<AgentStatus, string> = {
  idle: "Tap the mic and talk to Nova — it captures and files what matters.",
  listening: "Nova is listening — pause when you're done and it sends automatically.",
  thinking: "Nova is understanding your thought…",
  acting: "Nova is filing it into your memory…",
  speaking: "Nova is responding — tap the mic to interrupt.",
};

const MONO = "'JetBrains Mono'";
const SAVE_TOOLS = new Set(["saveEntry"]);

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
        const t = performance.now() / 1000;
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
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
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

  const { status, transcript, error, actions, conversationHistory, continuous, setContinuous, startListening, stopListening, sendText, resetConversation, inputLevelRef } = useVoiceAgent({
    continuous: true,
    onNavigate: (route) => navigate(route),
    onOpenEntryForm: () => handleAddEntry(),
    onStartBrainDump: () => navigate("/brain-dump"),
    onProcessBrainDump: () => navigate("/brain-dump"),
    onSaveBrainDump: () => navigate("/brain-dump"),
    onGoBack: () => navigate(-1),
    onOpenEntry: (id, title) => {
      const match = savedEntries.find((e) => e.id === id || e.title === title);
      if (match) setViewerEntry(match);
      else navigate("/all-entries");
    },
  });

  const [items, setItems] = useState<MemItem[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [textInput, setTextInput] = useState("");
  const seenRef = useRef<Set<string>>(new Set());
  const threadRef = useRef<HTMLDivElement>(null);

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

  const isSupported = typeof window !== "undefined" && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia;
  const formActive = showAddEntry || !!editingEntry || !!fillingEntry || !!templateEntry;

  useEffect(() => {
    if (status !== "listening") {
      setSeconds(0);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Accumulate each memory Nova files into the panel (actions reset per turn).
  useEffect(() => {
    for (const a of actions) {
      if (a.status !== "done" || !SAVE_TOOLS.has(a.tool)) continue;
      const result = (a.result || {}) as Record<string, unknown>;
      const title = String(a.args?.title || result.title || "Saved memory");
      const category = String(a.args?.category || result.category || "Memory");
      const key = `${title}::${category}`;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);
      setItems((prev) => [{ kind: category.toUpperCase(), title, note: "Saved to your vault", category }, ...prev].slice(0, 10));
      window.dispatchEvent(new CustomEvent("nova:entries-changed"));
    }
  }, [actions]);

  // Manual form save → persist, surface in Memory panel, refresh counts.
  const handleFormSave = async (entry: Omit<SavedEntry, "id" | "createdAt" | "updatedAt">) => {
    await saveEntry(entry);
    const category = entry.category || "Memory";
    setItems((prev) => [{ kind: category.toUpperCase(), title: entry.title, note: "Saved to your vault", category }, ...prev].slice(0, 10));
    window.dispatchEvent(new CustomEvent("nova:entries-changed"));
  };

  const micClick = () => {
    if (status === "idle" || status === "speaking") startListening(); // speaking → barge-in
    else if (status === "listening") stopListening();
  };

  const submitText = (e: FormEvent) => {
    e.preventDefault();
    const text = textInput.trim();
    if (!text || status !== "idle") return;
    setTextInput("");
    sendText(text);
  };

  const openMemoryItem = (item: MemItem) => {
    const match = savedEntries.find((e) => e.title === item.title);
    if (match) setViewerEntry(match);
    else navigate("/all-entries");
  };

  const clearSession = () => {
    resetConversation();
    seenRef.current.clear();
    setItems([]);
  };

  const micDisabled = !isSupported || status === "thinking" || status === "acting";
  const showRings = status === "listening" || status === "speaking";
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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-px min-h-[74vh] -m-4 md:-m-6 rounded-2xl overflow-hidden">
        {/* Capture */}
        <div className={`flex flex-col items-center ${formActive ? "justify-start" : "justify-center"} text-center p-6 md:p-10 bg-card/40`}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: "rgba(45,212,255,.07)", border: "1px solid rgba(45,212,255,.16)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2dd4ff", boxShadow: "0 0 10px #2dd4ff" }} />
            <span style={{ font: `600 11px ${MONO}`, color: "#7fd9f0", letterSpacing: "0.16em" }}>{KICKER[status]}</span>
          </div>
          {!formActive && <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">Voice capture</h1>}
          <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-md min-h-[1.5rem]" aria-live="polite">
            {isSupported ? SUB_TEXT[status] : "Voice capture needs a modern browser with microphone access. Try Chrome, Edge, or Safari."}
          </p>

          <div className={`relative w-full max-w-[680px] mt-2 flex items-center justify-center transition-all ${formActive ? "h-[130px]" : "h-[220px]"}`}>
            <Waveform status={status} compact={formActive} levelRef={inputLevelRef} />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {showRings && [0, 1, 2].map((i) => (
                <div key={i} className="absolute left-1/2 top-1/2 w-[120px] h-[120px] rounded-full" style={{ border: `1px solid rgba(45,212,255,${0.34 - i * 0.06})`, animation: "ap-micpulse 3s ease-out infinite", animationDelay: `${i}s` }} />
              ))}
              <button
                onClick={micClick}
                disabled={micDisabled}
                aria-label={status === "listening" ? "Stop and send" : status === "speaking" ? "Interrupt Nova and speak" : "Start voice capture"}
                className={`relative flex items-center justify-center rounded-full border-none cursor-pointer disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4ff] focus-visible:ring-offset-2 focus-visible:ring-offset-background ${formActive ? "w-[84px] h-[84px]" : "w-[108px] h-[108px]"}`}
                style={{ background: "radial-gradient(circle at 50% 36%,#8eecff,#1cb8e8 58%,#0b8fc4)", animation: showRings ? "ap-softglow 2.8s ease-in-out infinite" : undefined, boxShadow: "0 0 0 1px rgba(45,212,255,.4), 0 0 38px rgba(45,212,255,.4)", opacity: micDisabled && !showRings ? 0.7 : 1 }}
              >
                {status === "thinking" || status === "acting" ? (
                  <span className="w-7 h-7 rounded-full border-[3px] border-[#06283a]/30 border-t-[#06283a]" style={{ animation: "ap-spin .8s linear infinite" }} />
                ) : (
                  <svg width={formActive ? 26 : 34} height={formActive ? 26 : 34} viewBox="0 0 24 24" fill="none" stroke="#06283a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2.5" width="6" height="11.5" rx="3" fill="#06283a" stroke="none" />
                    <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
                    <path d="M12 17.5V21" />
                    <path d="M8.5 21h7" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => setContinuous(!continuous)}
            className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={continuous ? { background: "rgba(52,211,153,.12)", color: "#34d399", border: "1px solid rgba(52,211,153,.3)" } : { background: "rgba(255,255,255,.04)", color: "#8ea0b3", border: "1px solid rgba(125,165,205,.14)" }}
            title={continuous ? "Nova keeps listening after each reply" : "Tap the mic for each turn"}
          >
            <Radio className={`w-3 h-3 ${continuous ? "animate-pulse" : ""}`} />
            {continuous ? "Auto-listen on" : "Manual mode"}
          </button>

          {status === "listening" && (
            <div className="mt-1 flex items-center gap-3" style={{ font: `600 12px ${MONO}` }}>
              <span className="flex items-center gap-2 text-[#7fd9f0]">
                <span className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: "0 0 10px #ff5d6c" }} />
                REC {fmt(seconds)} / {fmt(MAX_RECORDING_SECONDS)}
              </span>
              <span className="text-muted-foreground">· pause to send, or tap the mic</span>
            </div>
          )}

          {/* Conversation thread — the full back-and-forth with Nova this session */}
          {(thread.length > 0 || pendingUserTurn || status === "thinking" || status === "acting") && (
            <div ref={threadRef} aria-live="polite" className={`mt-4 w-full max-w-xl flex flex-col gap-2.5 overflow-y-auto text-left ${formActive ? "max-h-[160px]" : "max-h-[300px]"}`}>
              {thread.map((turn, i) =>
                turn.role === "user" ? (
                  <div key={i} className="self-end max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-card border">
                    <span className="text-sm md:text-[15px] leading-relaxed text-foreground/90">{turn.text}</span>
                  </div>
                ) : (
                  <div key={i} className="self-start max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md" style={{ background: "rgba(45,212,255,.06)", border: "1px solid rgba(45,212,255,.16)" }}>
                    <span style={{ font: `600 10.5px ${MONO}`, color: "#5fd6f0", letterSpacing: "0.12em" }}>NOVA</span>
                    <p className="text-sm leading-relaxed text-foreground/90 mt-0.5">{turn.text}</p>
                  </div>
                )
              )}
              {pendingUserTurn && (
                <div className="self-end max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-md bg-card border">
                  <span className="text-sm md:text-[15px] leading-relaxed text-foreground/90">{transcript}</span>
                </div>
              )}
              {(status === "thinking" || status === "acting") && (
                <div className="self-start px-4 py-2.5 rounded-2xl rounded-bl-md" style={{ background: "rgba(45,212,255,.06)", border: "1px solid rgba(45,212,255,.16)" }}>
                  <span className="inline-flex gap-1 items-center" aria-label="Nova is thinking">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#5fd6f0] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-3">
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={startListening} className="text-sm font-semibold text-foreground underline underline-offset-2 hover:text-primary transition-colors">
                Try again
              </button>
            </div>
          )}

          {/* Text fallback — for quiet places, or when the mic isn't an option */}
          {!formActive && isSupported && (
            <form onSubmit={submitText} className="mt-4 w-full max-w-xl flex gap-2">
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Or type to Nova instead…"
                aria-label="Type a message to Nova"
                disabled={status !== "idle"}
                className="flex-1 h-10 px-3.5 rounded-xl bg-card border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status !== "idle" || !textInput.trim()}
                className="h-10 px-4 rounded-xl border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
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
                    onSave={handleFormSave}
                    onCancel={handleCancelEdit}
                    isVoiceActive={status === "listening"}
                    isSaving={isSaving}
                  />
                </Suspense>
              </div>
            </div>
          )}

          {status === "idle" && !formActive && (items.length > 0 || thread.length > 0) && (
            <button onClick={clearSession} className="mt-5 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Start a new session</button>
          )}
        </div>

        {/* Memory panel */}
        <aside className="bg-card/20 border-l border-border p-6 md:p-7 flex flex-col">
          <div className="text-xl font-bold text-foreground">Memory</div>
          <div className="text-[13px] text-muted-foreground mt-1">Auto-categorized items</div>
          <div className="flex flex-col gap-3 mt-5 flex-1" aria-live="polite">
            {items.length === 0 ? (
              <div className="flex flex-col gap-3">
                {[0.16, 0.13, 0.1].map((op, i) => (
                  <div key={i} className="h-[76px] rounded-2xl" style={{ border: `1px dashed rgba(125,165,205,${op})` }} />
                ))}
                <div className="text-center text-[12.5px] text-muted-foreground mt-1.5">Items appear here as Nova listens and files your thoughts.</div>
              </div>
            ) : (
              items.map((item, i) => (
                <button
                  key={`${item.title}-${i}`}
                  type="button"
                  onClick={() => openMemoryItem(item)}
                  aria-label={`Open saved entry ${item.title}`}
                  className="relative w-full text-left cursor-pointer rounded-2xl border bg-card px-4 py-3.5 overflow-hidden transition-colors hover:border-[#2dd4ff]/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2dd4ff]/60"
                  style={{ animation: "ap-itemin .5s cubic-bezier(.2,.8,.2,1) both" }}
                >
                  <div className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full" style={{ background: "#2dd4ff", boxShadow: "0 0 9px rgba(45,212,255,.7)" }} />
                  <div className="flex items-center justify-between mb-2 pl-2">
                    <span className="flex items-center gap-1.5 text-[#5fd6f0]" style={{ font: `600 10.5px ${MONO}`, letterSpacing: "0.13em" }}>
                      {categoryIcon(item.category)}
                      {item.kind}
                    </span>
                    <span className="flex items-center gap-1.5" style={{ font: `600 9.5px ${MONO}`, letterSpacing: "0.1em", color: "#34d399", animation: "ap-badgein .3s ease both" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 7px #34d399" }} />
                      SAVED
                    </span>
                  </div>
                  <div className="text-[15px] font-semibold text-foreground pl-2">{item.title}</div>
                  <div className="text-[12.5px] text-muted-foreground mt-0.5 pl-2">{item.note}</div>
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
