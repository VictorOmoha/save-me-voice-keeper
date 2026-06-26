import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { useBrainDumpCapture } from "@/hooks/useBrainDumpCapture";
import { useAuth } from "@/contexts/AuthContext";
import "@/styles/app-preview.css"; // ap-micpulse / ap-softglow / ap-spin / ap-itemin keyframes

/**
 * VoiceCapture — the dedicated voice screen from the SaveMe design, wired to the
 * REAL pipeline: useBrainDumpCapture handles mic + VAD + transcription + Nova,
 * and surfaces a `savedEntry` whenever Nova files a structured memory. Those
 * land in the Memory panel here. No mock data — this is the live capture flow.
 */

type Mode = "idle" | "listening" | "processing" | "result";

interface MemItem {
  kind: string;
  title: string;
  note: string;
}

const SUB_TEXT: Record<Mode, string> = {
  idle: "Speak naturally — tap the mic to begin.",
  listening: "Nova is listening — say what is on your mind.",
  processing: "Structuring your thought into memory…",
  result: "Here's what Nova captured for you.",
};
const KICKER: Record<Mode, string> = {
  idle: "NOVA · READY",
  listening: "NOVA · LISTENING",
  processing: "NOVA · THINKING",
  result: "NOVA · SAVED",
};

const MONO = "'JetBrains Mono'";

const Waveform = ({ mode }: { mode: Mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<Mode>(mode);
  const energyRef = useRef<number | null>(null);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

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
        const m = modeRef.current;
        let energy: number;
        if (m === "listening") energy = 0.42 + 0.45 * Math.abs(Math.sin(t * 2.1) * Math.sin(t * 0.6)) + Math.random() * 0.08;
        else if (m === "processing") energy = 0.28 + 0.16 * Math.sin(t * 5);
        else if (m === "idle") energy = 0.13;
        else energy = 0.08;
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
  const {
    savedEntries,
    searchQuery,
    setSearchQuery,
    saveEntry,
    editEntry,
    deleteEntry,
    handleCancelEdit,
    handleAddEntry,
  } = useDashboard();

  const { isSupported, isListening, isProcessingVoice, transcript, savedEntry, voiceError, start, stop, reset } = useBrainDumpCapture();

  const [items, setItems] = useState<MemItem[]>([]);

  // Accumulate each memory Nova files into the panel.
  const lastSavedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!savedEntry) return;
    const key = `${savedEntry.title}::${savedEntry.category}`;
    if (lastSavedRef.current === key) return;
    lastSavedRef.current = key;
    setItems((prev) => [
      { kind: (savedEntry.category || "Memory").toUpperCase(), title: savedEntry.title, note: "Saved to your vault" },
      ...prev,
    ].slice(0, 8));
  }, [savedEntry]);

  const mode: Mode = isListening ? "listening" : isProcessingVoice ? "processing" : items.length > 0 || savedEntry ? "result" : "idle";

  const micClick = () => {
    if (isListening) stop();
    else start();
  };

  const captureAnother = () => {
    reset();
    lastSavedRef.current = null;
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-px min-h-[72vh] -m-4 md:-m-6 rounded-2xl overflow-hidden">
        {/* Capture */}
        <div className="flex flex-col items-center justify-center text-center p-6 md:p-10 bg-card/40">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: "rgba(45,212,255,.07)", border: "1px solid rgba(45,212,255,.16)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2dd4ff", boxShadow: "0 0 10px #2dd4ff" }} />
            <span className="font-semibold tracking-[0.16em]" style={{ font: `600 11px ${MONO}`, color: "#7fd9f0" }}>{KICKER[mode]}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">Voice capture</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-md">
            {isSupported ? SUB_TEXT[mode] : "Voice capture needs a modern browser with microphone access. Try Chrome, Edge, or Safari."}
          </p>

          <div className="relative w-full max-w-[680px] h-[220px] mt-2 flex items-center justify-center">
            <Waveform mode={mode} />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {mode === "listening" && [0, 1, 2].map((i) => (
                <div key={i} className="absolute left-1/2 top-1/2 w-[120px] h-[120px] rounded-full" style={{ border: `1px solid rgba(45,212,255,${0.34 - i * 0.06})`, animation: "ap-micpulse 3s ease-out infinite", animationDelay: `${i}s` }} />
              ))}
              <button
                onClick={micClick}
                disabled={!isSupported || isProcessingVoice}
                aria-label={isListening ? "Stop voice capture" : "Start voice capture"}
                className="relative flex items-center justify-center w-[108px] h-[108px] rounded-full border-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "radial-gradient(circle at 50% 36%,#8eecff,#1cb8e8 58%,#0b8fc4)", animation: isListening ? "ap-softglow 2.8s ease-in-out infinite" : undefined, boxShadow: "0 0 0 1px rgba(45,212,255,.4), 0 0 38px rgba(45,212,255,.4)" }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#06283a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2.5" width="6" height="11.5" rx="3" fill="#06283a" stroke="none" />
                  <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
                  <path d="M12 17.5V21" />
                  <path d="M8.5 21h7" />
                </svg>
              </button>
            </div>
          </div>

          {transcript && (
            <div className="mt-2 max-w-xl px-4 py-3.5 rounded-xl bg-card border">
              <span className="text-sm md:text-[15px] leading-relaxed text-foreground/90">“{transcript}”</span>
            </div>
          )}

          {voiceError && <p className="mt-4 text-sm text-red-400">{voiceError}</p>}

          {mode === "processing" && (
            <div className="mt-5 flex items-center gap-3">
              <span className="w-[18px] h-[18px] rounded-full border-2 border-primary/25 border-t-primary" style={{ animation: "ap-spin .8s linear infinite" }} />
              <span style={{ font: `600 13px ${MONO}` }} className="tracking-wider text-[#9fdcef]">Nova is structuring your thought…</span>
            </div>
          )}

          {mode === "idle" && isSupported && (
            <div className="mt-5 text-[13px] text-muted-foreground">Press the mic, then speak — Nova turns it into structured memory.</div>
          )}

          {mode === "result" && !isListening && !isProcessingVoice && (
            <button onClick={captureAnother} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ border: "1px solid rgba(45,212,255,.25)", background: "rgba(45,212,255,.08)", color: "#9fdcef" }}>
              Capture another thought
            </button>
          )}
        </div>

        {/* Memory panel */}
        <aside className="bg-card/20 border-l border-border p-6 md:p-7 flex flex-col">
          <div className="text-xl font-bold text-foreground">Memory</div>
          <div className="text-[13px] text-muted-foreground mt-1">Auto-categorized items</div>
          <div className="flex flex-col gap-3 mt-5">
            {items.length === 0 ? (
              <div className="flex flex-col gap-3">
                {[0.16, 0.13, 0.1].map((op, i) => (
                  <div key={i} className="h-[74px] rounded-2xl" style={{ border: `1px dashed rgba(125,165,205,${op})` }} />
                ))}
                <div className="text-center text-[12.5px] text-muted-foreground mt-1.5">Items appear here as Nova listens and sorts your thought.</div>
              </div>
            ) : (
              items.map((item, i) => (
                <div key={i} className="relative rounded-2xl border bg-card px-4 py-3.5 overflow-hidden" style={{ animation: "ap-itemin .5s cubic-bezier(.2,.8,.2,1) both" }}>
                  <div className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full" style={{ background: "#2dd4ff", boxShadow: "0 0 9px rgba(45,212,255,.7)" }} />
                  <div style={{ font: `600 10.5px ${MONO}` }} className="tracking-[0.14em] text-[#5fd6f0] mb-2 pl-2">{item.kind}</div>
                  <div className="text-[15px] font-semibold text-foreground pl-2">{item.title}</div>
                  <div className="text-[12.5px] text-muted-foreground mt-0.5 pl-2">{item.note}</div>
                </div>
              ))
            )}
          </div>
          {items.length > 0 && (
            <button onClick={() => navigate("/all-entries")} className="mt-auto pt-5 text-[13px] font-semibold text-primary text-left hover:underline">
              View all entries →
            </button>
          )}
        </aside>
      </div>
    </DashboardLayout>
  );
};

export default VoiceCapture;
