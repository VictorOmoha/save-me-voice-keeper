import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Heart, Users, DollarSign, User, Briefcase, Lightbulb, Plane, ShoppingCart, GraduationCap, Sparkles, Radio } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { useVoiceAgent, type AgentStatus } from "@/hooks/useVoiceAgent";
import { useAuth } from "@/contexts/AuthContext";
import "@/styles/app-preview.css"; // ap-micpulse / ap-softglow / ap-spin / ap-itemin / ap-badgein keyframes

/**
 * VoiceCapture — the live conversational voice screen. Driven by useVoiceAgent
 * (mic → transcribe → Nova → tool execution), it lets the user talk to Nova and
 * watch auto-categorized memories land in the Memory panel as Nova files them.
 * Animated to match the landing hero: reactive voice-print waveform, pulsing
 * mic, and cards that slide in with a SAVED badge.
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
  listening: "Nova is listening — say what's on your mind.",
  thinking: "Nova is understanding your thought…",
  acting: "Nova is filing it into your memory…",
  speaking: "Nova is responding…",
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

const Waveform = ({ status }: { status: AgentStatus }) => {
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
        if (s === "listening") energy = 0.42 + 0.45 * Math.abs(Math.sin(t * 2.1) * Math.sin(t * 0.6)) + Math.random() * 0.08;
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
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true" />;
};

const VoiceCapture = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savedEntries, searchQuery, setSearchQuery, saveEntry, editEntry, deleteEntry, handleCancelEdit, handleAddEntry } = useDashboard();

  const { status, transcript, responseText, error, actions, continuous, setContinuous, startListening, stopListening, resetConversation } = useVoiceAgent({
    continuous: true,
    onNavigate: (route) => navigate(route),
  });

  const [items, setItems] = useState<MemItem[]>([]);
  const [seconds, setSeconds] = useState(0);
  const seenRef = useRef<Set<string>>(new Set());

  const isSupported = typeof window !== "undefined" && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia;

  // Recording timer
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

  const micClick = () => {
    if (status === "idle") startListening();
    else if (status === "listening") stopListening();
  };

  const clearSession = () => {
    resetConversation();
    seenRef.current.clear();
    setItems([]);
  };

  const micDisabled = !isSupported || status === "thinking" || status === "acting" || status === "speaking";
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
        <div className="flex flex-col items-center justify-center text-center p-6 md:p-10 bg-card/40">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: "rgba(45,212,255,.07)", border: "1px solid rgba(45,212,255,.16)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2dd4ff", boxShadow: "0 0 10px #2dd4ff" }} />
            <span style={{ font: `600 11px ${MONO}`, color: "#7fd9f0", letterSpacing: "0.16em" }}>{KICKER[status]}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">Voice capture</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-md min-h-[1.5rem]">
            {isSupported ? SUB_TEXT[status] : "Voice capture needs a modern browser with microphone access. Try Chrome, Edge, or Safari."}
          </p>

          <div className="relative w-full max-w-[680px] h-[220px] mt-2 flex items-center justify-center">
            <Waveform status={status} />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {showRings && [0, 1, 2].map((i) => (
                <div key={i} className="absolute left-1/2 top-1/2 w-[120px] h-[120px] rounded-full" style={{ border: `1px solid rgba(45,212,255,${0.34 - i * 0.06})`, animation: "ap-micpulse 3s ease-out infinite", animationDelay: `${i}s` }} />
              ))}
              <button
                onClick={micClick}
                disabled={micDisabled}
                aria-label={status === "listening" ? "Stop voice capture" : "Start voice capture"}
                className="relative flex items-center justify-center w-[108px] h-[108px] rounded-full border-none cursor-pointer disabled:cursor-not-allowed"
                style={{ background: "radial-gradient(circle at 50% 36%,#8eecff,#1cb8e8 58%,#0b8fc4)", animation: showRings ? "ap-softglow 2.8s ease-in-out infinite" : undefined, boxShadow: "0 0 0 1px rgba(45,212,255,.4), 0 0 38px rgba(45,212,255,.4)", opacity: micDisabled && !showRings ? 0.7 : 1 }}
              >
                {status === "thinking" || status === "acting" ? (
                  <span className="w-8 h-8 rounded-full border-[3px] border-[#06283a]/30 border-t-[#06283a]" style={{ animation: "ap-spin .8s linear infinite" }} />
                ) : (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#06283a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2.5" width="6" height="11.5" rx="3" fill="#06283a" stroke="none" />
                    <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
                    <path d="M12 17.5V21" />
                    <path d="M8.5 21h7" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Continuous toggle */}
          <button
            onClick={() => setContinuous(!continuous)}
            className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={continuous ? { background: "rgba(52,211,153,.12)", color: "#34d399", border: "1px solid rgba(52,211,153,.3)" } : { background: "rgba(255,255,255,.04)", color: "#8ea0b3", border: "1px solid rgba(125,165,205,.14)" }}
            title={continuous ? "Nova keeps listening after each reply" : "Tap the mic for each turn"}
          >
            <Radio className={`w-3 h-3 ${continuous ? "animate-pulse" : ""}`} />
            {continuous ? "Auto-listen on" : "Manual mode"}
          </button>

          {/* Live transcript */}
          {transcript && (
            <div className="mt-4 max-w-xl px-4 py-3 rounded-xl bg-card border">
              <span className="text-sm md:text-[15px] leading-relaxed text-foreground/90">“{transcript}”</span>
            </div>
          )}

          {/* Nova response */}
          {responseText && status !== "listening" && (
            <div className="mt-3 max-w-xl px-4 py-3 rounded-xl" style={{ background: "rgba(45,212,255,.06)", border: "1px solid rgba(45,212,255,.16)" }}>
              <span style={{ font: `600 11px ${MONO}`, color: "#5fd6f0", letterSpacing: "0.12em" }}>NOVA</span>
              <p className="text-sm leading-relaxed text-foreground/90 mt-1">{responseText}</p>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          {status === "listening" && (
            <div className="mt-4 flex items-center gap-3" style={{ font: `600 12px ${MONO}` }}>
              <span className="flex items-center gap-2 text-[#7fd9f0]">
                <span className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: "0 0 10px #ff5d6c" }} />
                REC {fmt(seconds)}
              </span>
              <span className="text-muted-foreground">· tap the mic to send</span>
            </div>
          )}

          {status === "idle" && items.length > 0 && (
            <button onClick={clearSession} className="mt-5 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Start a new session</button>
          )}
        </div>

        {/* Memory panel */}
        <aside className="bg-card/20 border-l border-border p-6 md:p-7 flex flex-col">
          <div className="text-xl font-bold text-foreground">Memory</div>
          <div className="text-[13px] text-muted-foreground mt-1">Auto-categorized items</div>
          <div className="flex flex-col gap-3 mt-5 flex-1">
            {items.length === 0 ? (
              <div className="flex flex-col gap-3">
                {[0.16, 0.13, 0.1].map((op, i) => (
                  <div key={i} className="h-[76px] rounded-2xl" style={{ border: `1px dashed rgba(125,165,205,${op})` }} />
                ))}
                <div className="text-center text-[12.5px] text-muted-foreground mt-1.5">Items appear here as Nova listens and files your thoughts.</div>
              </div>
            ) : (
              items.map((item, i) => (
                <div key={`${item.title}-${i}`} className="relative rounded-2xl border bg-card px-4 py-3.5 overflow-hidden" style={{ animation: "ap-itemin .5s cubic-bezier(.2,.8,.2,1) both" }}>
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
                </div>
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
    </DashboardLayout>
  );
};

export default VoiceCapture;
