import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import "@/styles/app-preview.css";

/**
 * AppPreview — a faithful, self-contained implementation of the Claude Design
 * `SaveMe.dc.html` app mockup (sidebar + Voice capture / Dashboard / Brain dump
 * screens). This is a design PROTOTYPE mounted at /preview/app; it deliberately
 * does NOT touch the real authenticated Dashboard/BrainDump pages, which carry
 * live auth, Firestore data, and voice processing.
 *
 * The Voice capture screen ports the design's interactive state machine: a
 * mode-driven voice-print waveform (real mic via WebAudio with a synthetic
 * fallback), a simulated transcript, a processing beat, then a staggered reveal
 * of auto-categorized memory items.
 */

const GRAD = "linear-gradient(135deg,#2dd4ff,#0b8fc4)";
const MONO = "'JetBrains Mono'";

type Screen = "voice" | "dashboard" | "braindump";
type Mode = "idle" | "listening" | "processing" | "result";

interface MemItem {
  kind: string;
  title: string;
  note: string;
}

const SCRIPT =
  "Remind me to prepare the Q3 budget breakdown and follow up with Sarah from marketing about the review on Tuesday at 3pm, and pick up the dry cleaning on the way home.";

const ITEMS: MemItem[] = [
  { kind: "CONTACT", title: "Sarah (Marketing)", note: "Follow up about the Q3 review" },
  { kind: "CALENDAR", title: "Q3 Budget Review · Tue 3pm", note: "Added to your week" },
  { kind: "ACTION ITEM", title: "Prepare budget breakdown", note: "High priority" },
  { kind: "REMINDER", title: "Pick up dry cleaning", note: "On the way home" },
];

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

const fmt = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const cardStyle: CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: "rgba(255,255,255,.022)",
  border: "1px solid rgba(125,165,205,.10)",
};

const MicIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#06283a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2.5" width="6" height="11.5" rx="3" fill="#06283a" stroke="none" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
    <path d="M12 17.5V21" />
    <path d="M8.5 21h7" />
  </svg>
);

const AppPreview = () => {
  const [screen, setScreen] = useState<Screen>("voice");
  const [mode, setMode] = useState<Mode>("idle");
  const [transcript, setTranscript] = useState("");
  const [memItems, setMemItems] = useState<MemItem[]>([]);
  const [duration, setDuration] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<Mode>("idle");
  const energyRef = useRef<number | null>(null);

  // Audio
  const streamRef = useRef<MediaStream | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqRef = useRef<Uint8Array | null>(null);
  const micOnRef = useRef(false);

  // Timers
  const typeTimer = useRef<ReturnType<typeof setInterval>>();
  const durTimer = useRef<ReturnType<typeof setInterval>>();
  const procTimer = useRef<ReturnType<typeof setTimeout>>();
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const stopMic = useCallback(() => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch { /* noop */ }
    try {
      acRef.current?.close();
    } catch { /* noop */ }
    streamRef.current = null;
    acRef.current = null;
    analyserRef.current = null;
    micOnRef.current = false;
  }, []);

  const clearAllTimers = useCallback(() => {
    clearInterval(typeTimer.current);
    clearInterval(durTimer.current);
    clearTimeout(procTimer.current);
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
  }, []);

  // Waveform draw loop
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
        if (m === "listening") {
          if (micOnRef.current && analyserRef.current && freqRef.current) {
            analyserRef.current.getByteFrequencyData(freqRef.current);
            let sum = 0;
            for (let i = 0; i < freqRef.current.length; i++) sum += freqRef.current[i];
            energy = Math.min(1, (sum / freqRef.current.length / 255) * 2.6);
          } else {
            energy = 0.42 + 0.45 * Math.abs(Math.sin(t * 2.1) * Math.sin(t * 0.6)) + Math.random() * 0.08;
          }
        } else if (m === "processing") {
          energy = 0.28 + 0.16 * Math.sin(t * 5);
        } else if (m === "idle") {
          energy = 0.13;
        } else {
          energy = 0.08;
        }
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
              } else {
                ctx.lineTo(x, y);
              }
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

  // Cleanup on unmount
  useEffect(
    () => () => {
      clearAllTimers();
      stopMic();
    },
    [clearAllTimers, stopMic],
  );

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC();
      acRef.current = ac;
      const src = ac.createMediaStreamSource(stream);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;
      src.connect(analyser);
      analyserRef.current = analyser;
      freqRef.current = new Uint8Array(analyser.frequencyBinCount);
      micOnRef.current = true;
    } catch {
      micOnRef.current = false;
    }
  }, []);

  const startTyping = useCallback(() => {
    const words = SCRIPT.split(" ");
    let w = 0;
    let cur = "";
    clearInterval(typeTimer.current);
    typeTimer.current = setInterval(() => {
      if (w >= words.length) {
        clearInterval(typeTimer.current);
        return;
      }
      cur += (w === 0 ? "" : " ") + words[w];
      w++;
      setTranscript(cur);
    }, 155);
  }, []);

  const startListening = useCallback(async () => {
    setMode("listening");
    setTranscript("");
    setMemItems([]);
    setDuration(0);
    await startMic();
    startTyping();
    clearInterval(durTimer.current);
    durTimer.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }, [startMic, startTyping]);

  const reveal = useCallback(() => {
    setMode("result");
    setMemItems([]);
    revealTimers.current = ITEMS.map((it, idx) =>
      setTimeout(() => setMemItems((prev) => [...prev, it]), 260 * idx + 150),
    );
  }, []);

  const finish = useCallback(() => {
    stopMic();
    clearInterval(typeTimer.current);
    clearInterval(durTimer.current);
    setMode("processing");
    clearTimeout(procTimer.current);
    procTimer.current = setTimeout(reveal, 2100);
  }, [reveal, stopMic]);

  const reset = useCallback(() => {
    stopMic();
    clearAllTimers();
    setMode("idle");
    setTranscript("");
    setMemItems([]);
    setDuration(0);
  }, [clearAllTimers, stopMic]);

  const micClick = useCallback(() => {
    if (modeRef.current === "idle") startListening();
    else if (modeRef.current === "listening") finish();
    else if (modeRef.current === "result") reset();
  }, [startListening, finish, reset]);

  const startVoiceDump = useCallback(() => {
    setScreen("voice");
    setTimeout(() => {
      if (modeRef.current === "idle") startListening();
    }, 450);
  }, [startListening]);

  const navItem = (key: Screen, glyph: string, label: string) => {
    const active = screen === key;
    return (
      <div
        onClick={() => setScreen(key)}
        className="ap-hover-row"
        style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 11, cursor: "pointer", font: "600 14.5px Manrope", color: "#c4cedb", marginBottom: 4 }}
      >
        {active && <div style={{ position: "absolute", inset: 0, background: "rgba(45,212,255,.10)", border: "1px solid rgba(45,212,255,.24)", borderRadius: 11 }} />}
        {active && <div style={{ position: "absolute", left: 0, top: 9, bottom: 9, width: 3, background: "#2dd4ff", borderRadius: 3, boxShadow: "0 0 10px #2dd4ff" }} />}
        <span style={{ position: "relative", display: "inline-flex", width: 18, justifyContent: "center", color: "#7fd9f0" }}>{glyph}</span>
        <span style={{ position: "relative" }}>{label}</span>
      </div>
    );
  };

  const mutedNav = (glyph: string, label: string) => (
    <div className="ap-hover-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 11, cursor: "pointer", font: "600 14.5px Manrope", color: "#9aa6b6" }}>
      <span style={{ display: "inline-flex", width: 18, justifyContent: "center", color: "#6f8294" }}>{glyph}</span>
      <span>{label}</span>
    </div>
  );

  const category = (name: string, count: string) => (
    <div className="ap-hover-row-soft" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderRadius: 10, cursor: "pointer", font: "500 14px Manrope", color: "#aab6c5" }}>
      <span>{name}</span>
      <span style={{ font: `500 11px ${MONO}`, color: "#566375" }}>{count}</span>
    </div>
  );

  const statCard = (label: string, value: string, sub: string, bar?: number) => (
    <div style={cardStyle}>
      <div style={{ font: `600 11px ${MONO}`, letterSpacing: ".1em", color: "#8593a6" }}>{label}</div>
      <div style={{ font: `600 38px ${MONO}`, color: "#5fd6f0", margin: "8px 0 4px" }}>{value}</div>
      <div style={{ font: "500 12px Manrope", color: "#5d6a7b" }}>{sub}</div>
      {bar !== undefined && (
        <div style={{ height: 4, borderRadius: 3, background: "rgba(125,165,205,.14)", marginTop: 10 }}>
          <div style={{ width: `${bar}%`, height: "100%", borderRadius: 3, background: "#2dd4ff" }} />
        </div>
      )}
    </div>
  );

  return (
    <div className="ap-root">
      {/* SIDEBAR */}
      <aside className="ap-sidebar">
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 8px 22px" }}>
          <div style={{ width: 24, height: 24, background: GRAD, transform: "rotate(45deg)", borderRadius: 6, boxShadow: "0 0 18px rgba(45,212,255,.5)" }} />
          <span style={{ font: "700 17px Sora", letterSpacing: ".16em", color: "#eaf3fa" }}>SAVEME</span>
        </div>

        {navItem("dashboard", "▦", "Dashboard")}
        {navItem("voice", "◉", "Voice capture")}
        {navItem("braindump", "✎", "Brain dump")}
        {mutedNav("＋", "Save manually")}
        {mutedNav("⚙", "Settings")}

        <div style={{ font: `600 11px ${MONO}`, letterSpacing: ".18em", color: "#566375", margin: "26px 14px 12px" }}>CATEGORIES</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {category("Documents", "0")}
          {category("Health", "0")}
          {category("Contacts", "1")}
          {category("Finance", "2")}
          {category("Personal", "0")}
        </div>

        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 11, padding: 12, borderRadius: 12, background: "rgba(255,255,255,.025)", border: "1px solid rgba(125,165,205,.08)" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", font: "700 14px Sora", color: "#04222e" }}>V</div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ font: "600 13.5px Manrope", color: "#e7eef6" }}>Victor</div>
            <div style={{ font: `500 11px ${MONO}`, color: "#566375" }}>all data encrypted</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="ap-main">
        {/* TOP BAR */}
        <header style={{ flex: "none", height: 64, display: "flex", alignItems: "center", gap: 20, padding: "0 28px", borderBottom: "1px solid rgba(125,165,205,.08)", background: "rgba(8,11,18,.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <div className="ap-topbar-id" style={{ font: `600 12px ${MONO}`, letterSpacing: ".14em", color: "#6f8294" }}>SAVEME :: VICTOR</div>
          <div className="ap-mobile-switch" style={{ alignItems: "center", gap: 6 }}>
            {(["dashboard", "voice", "braindump"] as Screen[]).map((s) => (
              <button key={s} onClick={() => setScreen(s)} style={{ padding: "6px 11px", borderRadius: 9, border: "1px solid rgba(125,165,205,.12)", background: screen === s ? "rgba(45,212,255,.12)" : "rgba(255,255,255,.03)", color: screen === s ? "#9fdcef" : "#c2cedb", font: "600 12px Manrope", cursor: "pointer" }}>
                {s === "dashboard" ? "▦" : s === "voice" ? "◉" : "✎"}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, maxWidth: 520, margin: "0 auto", display: "flex", alignItems: "center", gap: 10, height: 40, padding: "0 14px", borderRadius: 11, background: "rgba(255,255,255,.03)", border: "1px solid rgba(125,165,205,.10)" }}>
            <span style={{ color: "#566375" }}>⌕</span>
            <input placeholder="Search saved information…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#cdd8e4", font: "500 14px Manrope" }} />
            <span style={{ color: "#5fd6f0", fontSize: 13 }}>✦</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 999, background: "rgba(45,212,255,.08)", border: "1px solid rgba(45,212,255,.18)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#39e0a8", boxShadow: "0 0 9px #39e0a8" }} />
            <span style={{ font: `600 12px ${MONO}`, letterSpacing: ".08em", color: "#9fdcef" }}>NOVA ONLINE</span>
          </div>
        </header>

        {/* SCROLL AREA */}
        <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          {/* VOICE CAPTURE */}
          {screen === "voice" && (
            <section className="ap-voice-grid">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 22, padding: "6px 13px", borderRadius: 999, background: "rgba(45,212,255,.07)", border: "1px solid rgba(45,212,255,.16)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2dd4ff", boxShadow: "0 0 10px #2dd4ff" }} />
                  <span style={{ font: `600 11px ${MONO}`, letterSpacing: ".16em", color: "#7fd9f0" }}>{KICKER[mode]}</span>
                </div>
                <h1 style={{ font: "700 clamp(32px,5vw,46px) Sora", letterSpacing: "-.02em", margin: 0, color: "#f1f7fc" }}>Voice capture</h1>
                <p style={{ font: "500 17px Manrope", color: "#8ea0b3", margin: "14px 0 0", maxWidth: 440 }}>{SUB_TEXT[mode]}</p>

                <div style={{ position: "relative", width: "100%", maxWidth: 720, height: 248, margin: "14px auto 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true" />
                  <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 130, height: 130, borderRadius: "50%", border: `1px solid rgba(45,212,255,${0.35 - i * 0.05})`, animation: "ap-micpulse 3s ease-out infinite", animationDelay: `${i}s` }} />
                    ))}
                    <button onClick={micClick} aria-label="Toggle voice capture" className="ap-hover-bright" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 118, height: 118, borderRadius: "50%", border: "none", cursor: "pointer", background: "radial-gradient(circle at 50% 36%,#8eecff,#1cb8e8 58%,#0b8fc4)", animation: "ap-softglow 2.8s ease-in-out infinite" }}>
                      <MicIcon />
                    </button>
                  </div>
                </div>

                {transcript && (
                  <div style={{ marginTop: 8, maxWidth: 560, minHeight: 48, padding: "14px 18px", borderRadius: 13, background: "rgba(255,255,255,.025)", border: "1px solid rgba(125,165,205,.10)" }}>
                    <span style={{ font: "500 15px/1.5 Manrope", color: "#c2cedb" }}>“{transcript}”</span>
                  </div>
                )}

                {mode === "listening" && (
                  <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14, font: `600 12px ${MONO}`, letterSpacing: ".08em", color: "#7fd9f0" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5d6c", boxShadow: "0 0 10px #ff5d6c" }} />
                      REC {fmt(duration)}
                    </span>
                    <span style={{ color: "#566375" }}>·</span>
                    <span style={{ color: "#8ea0b3" }}>Tap the mic again to organize</span>
                  </div>
                )}

                {mode === "processing" && (
                  <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(45,212,255,.25)", borderTopColor: "#2dd4ff", animation: "ap-spin .8s linear infinite" }} />
                    <span style={{ font: `600 13px ${MONO}`, letterSpacing: ".06em", color: "#9fdcef" }}>Nova is structuring your thought…</span>
                  </div>
                )}

                {mode === "idle" && <div style={{ marginTop: 22, font: "500 13px Manrope", color: "#5d6a7b" }}>Press the mic, then speak — Nova turns it into structured memory.</div>}

                {mode === "result" && (
                  <button onClick={reset} className="ap-hover-accent" style={{ marginTop: 22, padding: "11px 22px", borderRadius: 11, border: "1px solid rgba(45,212,255,.25)", background: "rgba(45,212,255,.08)", color: "#9fdcef", font: "600 13.5px Manrope", cursor: "pointer" }}>
                    Capture another thought
                  </button>
                )}
              </div>

              {/* memory panel */}
              <aside className="ap-voice-memory" style={{ borderLeft: "1px solid rgba(125,165,205,.08)", background: "rgba(255,255,255,.012)", padding: "34px 28px", display: "flex", flexDirection: "column" }}>
                <div style={{ font: "700 22px Sora", color: "#f1f7fc" }}>Memory</div>
                <div style={{ font: "500 13px Manrope", color: "#7d8a9c", marginTop: 4 }}>Auto-categorized items</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
                  {memItems.map((item, i) => (
                    <div key={i} style={{ position: "relative", background: "rgba(255,255,255,.028)", border: "1px solid rgba(120,160,200,.11)", borderRadius: 15, padding: "15px 17px", overflow: "hidden", animation: "ap-itemin .5s cubic-bezier(.2,.8,.2,1) both" }}>
                      <div style={{ position: "absolute", left: 0, top: 14, bottom: 14, width: 3, background: "#2dd4ff", borderRadius: 3, boxShadow: "0 0 9px rgba(45,212,255,.7)" }} />
                      <div style={{ font: `600 10.5px ${MONO}`, letterSpacing: ".14em", color: "#5fd6f0", marginBottom: 8, paddingLeft: 8 }}>{item.kind}</div>
                      <div style={{ font: "600 15.5px Manrope", color: "#eaf1f8", paddingLeft: 8 }}>{item.title}</div>
                      <div style={{ font: "500 12.5px Manrope", color: "#7d8a9c", marginTop: 3, paddingLeft: 8 }}>{item.note}</div>
                    </div>
                  ))}
                  {memItems.length === 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[0.16, 0.13, 0.1].map((op, i) => (
                        <div key={i} style={{ height: 74, borderRadius: 15, border: `1px dashed rgba(125,165,205,${op})`, background: `rgba(255,255,255,${0.012 - i * 0.002})` }} />
                      ))}
                      <div style={{ textAlign: "center", font: "500 12.5px Manrope", color: "#566375", marginTop: 6 }}>Items appear here as Nova listens and sorts your thought.</div>
                    </div>
                  )}
                </div>
              </aside>
            </section>
          )}

          {/* DASHBOARD */}
          {screen === "dashboard" && (
            <section style={{ maxWidth: 1080, margin: "0 auto", padding: "46px 40px 80px" }}>
              <div style={{ textAlign: "center", marginBottom: 38 }}>
                <h1 style={{ font: "700 clamp(28px,4vw,40px) Sora", letterSpacing: "-.02em", margin: 0, color: "#f1f7fc" }}>Welcome back, Victor</h1>
                <p style={{ font: "500 15px Manrope", color: "#7d8a9c", margin: "10px 0 0" }}>Your secure knowledge vault — all data encrypted</p>
              </div>

              <div style={{ borderRadius: 20, padding: 28, marginBottom: 22, background: "linear-gradient(180deg,rgba(45,212,255,.07),rgba(45,212,255,.01))", border: "1px solid rgba(45,212,255,.18)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ font: `600 11px ${MONO}`, letterSpacing: ".14em", color: "#5fd6f0", marginBottom: 10 }}>✦ FIRST MEMORY PATH</div>
                    <div style={{ font: "700 25px Sora", color: "#f1f7fc" }}>Say one thing you don't want to forget.</div>
                    <div style={{ font: "500 14.5px Manrope", color: "#8ea0b3", marginTop: 7 }}>Speak. Nova will turn it into structured memory you own.</div>
                  </div>
                  <button onClick={startVoiceDump} className="ap-hover-bright" style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 22px", borderRadius: 12, border: "none", cursor: "pointer", background: GRAD, color: "#04222e", font: "700 14px Manrope", boxShadow: "0 0 28px rgba(45,212,255,.4)" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="#04222e"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="#04222e" strokeWidth="2" /><path d="M12 18v3" stroke="#04222e" strokeWidth="2" /></svg>
                    Start voice dump
                  </button>
                </div>
                <div className="ap-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 22 }}>
                  {["1. Speak naturally", "2. Review the structured memory", "3. Search and open it later"].map((s) => (
                    <div key={s} style={{ padding: "13px 16px", borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid rgba(125,165,205,.10)", font: "600 13px Manrope", color: "#c2cedb" }}>{s}</div>
                  ))}
                </div>
              </div>

              <h2 style={{ font: "700 21px Sora", color: "#eaf1f8", margin: "34px 0 4px" }}>Quick actions</h2>
              <p style={{ font: "500 13.5px Manrope", color: "#7d8a9c", margin: "0 0 16px" }}>Capture by voice first. Use manual save only when you already know the details.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="ap-hover-btn" style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid rgba(125,165,205,.12)", color: "#dbe4ee", font: "600 13.5px Manrope", cursor: "pointer" }}><span style={{ color: "#5fd6f0" }}>＋</span>Save a memory manually</button>
                <button className="ap-hover-btn" style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid rgba(125,165,205,.12)", color: "#dbe4ee", font: "600 13.5px Manrope", cursor: "pointer" }}><span style={{ color: "#5fd6f0" }}>▤</span>Upload document</button>
                <div style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 10, height: 48, padding: "0 16px", borderRadius: 12, background: "rgba(255,255,255,.03)", border: "1px solid rgba(125,165,205,.10)" }}><span style={{ color: "#566375" }}>⌕</span><input placeholder="Search entries…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#cdd8e4", font: "500 14px Manrope" }} /><span style={{ color: "#5fd6f0" }}>✦</span></div>
              </div>

              <div style={{ borderRadius: 18, padding: 26, marginTop: 30, background: "rgba(255,255,255,.022)", border: "1px solid rgba(125,165,205,.10)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 6 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(45,212,255,.10)", border: "1px solid rgba(45,212,255,.2)", color: "#5fd6f0", fontSize: 19 }}>⏰</div>
                  <div>
                    <div style={{ font: `600 11px ${MONO}`, letterSpacing: ".12em", color: "#5fd6f0" }}>TASK REMINDERS</div>
                    <div style={{ font: "700 19px Sora", color: "#eaf1f8" }}>Set a task alarm</div>
                  </div>
                </div>
                <p style={{ font: "500 13.5px Manrope", color: "#8ea0b3", margin: "6px 0 18px" }}>Add what you need to do, choose the date and time, and SaveMe will surface the reminder in notifications.</p>
                <div className="ap-alarm-grid" style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 16, alignItems: "end" }}>
                  <div>
                    <div style={{ font: "600 12.5px Manrope", color: "#aab6c5", marginBottom: 7 }}>Task</div>
                    <div style={{ height: 48, borderRadius: 11, background: "rgba(255,255,255,.025)", border: "1px solid rgba(125,165,205,.12)", display: "flex", alignItems: "center", padding: "0 14px", font: "500 14px Manrope", color: "#c2cedb" }}>Remind me to call the client</div>
                  </div>
                  <div>
                    <div style={{ font: "600 12.5px Manrope", color: "#aab6c5", marginBottom: 7 }}>Reminder time</div>
                    <div style={{ height: 48, borderRadius: 11, background: "rgba(255,255,255,.025)", border: "1px solid rgba(125,165,205,.12)", display: "flex", alignItems: "center", padding: "0 14px", font: `500 13.5px ${MONO}`, color: "#c2cedb" }}>06/25/2026 08:00 PM</div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                  <button className="ap-hover-bright" style={{ padding: "11px 22px", borderRadius: 11, border: "none", background: GRAD, color: "#04222e", font: "700 13.5px Manrope", cursor: "pointer" }}>Set reminder</button>
                </div>
              </div>

              <div className="ap-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 24 }}>
                {statCard("TOTAL ENTRIES", "3", "Saved in your archive")}
                {statCard("CATEGORIES", "5", "Organized collections")}
                {statCard("STORAGE USED", "2 KB", "of 500 MB available", 6)}
                {statCard("RECENT ACTIVITY", "1", "Entries this week")}
              </div>

              <div style={{ borderRadius: 16, padding: "22px 24px", marginTop: 24, background: "rgba(255,255,255,.022)", border: "1px solid rgba(125,165,205,.10)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, font: "700 16px Sora", color: "#eaf1f8" }}><span style={{ color: "#5fd6f0" }}>◎</span>Daily briefing</div>
                <div style={{ font: "500 14px Manrope", color: "#8ea0b3", marginTop: 8 }}>Nova is carrying 10 active memories for continuity.</div>
              </div>

              <h2 style={{ font: "700 21px Sora", color: "#eaf1f8", margin: "34px 0 4px", display: "flex", alignItems: "center", gap: 9 }}><span style={{ color: "#5fd6f0" }}>✦</span>Intelligence layer</h2>
              <p style={{ font: "500 13.5px Manrope", color: "#7d8a9c", margin: "0 0 16px" }}>What Nova knows, what needs attention, and what is connected.</p>
              <div className="ap-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                <div style={{ ...cardStyle, minHeight: 150 }}>
                  <div style={{ font: "700 14px Sora", color: "#eaf1f8", marginBottom: 10 }}>🔔 Upcoming reminders</div>
                  <div style={{ font: "500 13px Manrope", color: "#7d8a9c" }}>No active reminders yet.</div>
                </div>
                <div style={{ ...cardStyle, minHeight: 150 }}>
                  <div style={{ font: "700 14px Sora", color: "#eaf1f8", marginBottom: 10 }}>✓ Extracted action items</div>
                  <div style={{ font: "500 13px Manrope", color: "#7d8a9c" }}>No extracted action items yet.</div>
                </div>
                <div style={{ ...cardStyle, minHeight: 150 }}>
                  <div style={{ font: "700 14px Sora", color: "#eaf1f8", marginBottom: 14 }}>◈ Nova memory & connections</div>
                  {[["Memories stored", "Personal facts Nova can recall", "10"], ["Linked entry graph", "Known relationships", "0"]].map(([t, s, v], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", borderRadius: 11, background: "rgba(255,255,255,.025)", marginBottom: i === 0 ? 8 : 0 }}>
                      <div>
                        <div style={{ font: "600 13px Manrope", color: "#dbe4ee" }}>{t}</div>
                        <div style={{ font: "500 11.5px Manrope", color: "#7d8a9c" }}>{s}</div>
                      </div>
                      <div style={{ font: `600 14px ${MONO}`, color: "#5fd6f0" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* BRAIN DUMP */}
          {screen === "braindump" && (
            <section style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 40px 80px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
                <button onClick={() => setScreen("dashboard")} className="ap-hover-btn" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(125,165,205,.12)", color: "#c2cedb", font: "600 13px Manrope", cursor: "pointer" }}>← Back</button>
                <button onClick={() => setScreen("dashboard")} className="ap-hover-btn" style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(125,165,205,.12)", color: "#c2cedb", font: "600 13px Manrope", cursor: "pointer" }}>▦ Dashboard</button>
              </div>

              <h1 style={{ font: "700 clamp(28px,4vw,38px) Sora", letterSpacing: "-.02em", margin: 0, color: "#f1f7fc" }}>Start with one messy thought</h1>
              <p style={{ font: "500 15px Manrope", color: "#8ea0b3", margin: "12px 0 28px" }}>Tap start speaking, say what is in your head, then save the organized version to your external memory.</p>

              <div className="ap-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
                {[["STEP 1", "Start speaking", "Say tasks, ideas, reminders, or half-finished thoughts. Messy is the point."], ["STEP 2", "Nova structures it", "Your dump becomes a title, category, notes, tags, and action items."], ["STEP 3", "Review and save", "Save it so your memory and trusted agents can use it later."]].map(([step, title, desc]) => (
                  <div key={step} style={cardStyle}>
                    <div style={{ font: `600 11px ${MONO}`, letterSpacing: ".12em", color: "#5fd6f0" }}>{step}</div>
                    <div style={{ font: "700 16px Sora", color: "#eaf1f8", margin: "8px 0 6px" }}>{title}</div>
                    <div style={{ font: "500 13px Manrope", color: "#8ea0b3" }}>{desc}</div>
                  </div>
                ))}
              </div>

              <div className="ap-brain-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 24 }}>
                <div style={{ borderRadius: 18, padding: 26, background: "rgba(255,255,255,.022)", border: "1px solid rgba(125,165,205,.10)" }}>
                  <div style={{ font: "700 21px Sora", color: "#eaf1f8" }}>Capture</div>
                  <div style={{ font: "500 13px Manrope", color: "#8ea0b3", margin: "6px 0 18px" }}>Record for 10 to 30 seconds, or type if the mic is blocked. Then organize and save.</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {["Here's everything I need to do this week.", "Let me dump the ideas before I lose them.", "Errands, follow-ups, random reminders."].map((chip) => (
                      <div key={chip} style={{ padding: "8px 13px", borderRadius: 999, background: "rgba(45,212,255,.07)", border: "1px solid rgba(45,212,255,.16)", font: "500 12.5px Manrope", color: "#9fdcef" }}>{chip}</div>
                    ))}
                  </div>
                  <div style={{ minHeight: 200, borderRadius: 13, background: "rgba(255,255,255,.022)", border: "1px solid rgba(125,165,205,.12)", padding: 16, font: "500 14.5px/1.6 Manrope", color: "#6f7d8e" }}>What's on your mind right now? Dump tasks, ideas, reminders, meeting notes, or half-formed thoughts here…</div>
                  <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                    <button onClick={startVoiceDump} className="ap-hover-bright" style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 18px", borderRadius: 11, border: "none", background: GRAD, color: "#04222e", font: "700 13.5px Manrope", cursor: "pointer", boxShadow: "0 0 24px rgba(45,212,255,.35)" }}>◉ Start speaking</button>
                    <button className="ap-hover-btn" style={{ padding: "12px 18px", borderRadius: 11, background: "rgba(255,255,255,.03)", border: "1px solid rgba(125,165,205,.12)", color: "#c2cedb", font: "600 13.5px Manrope", cursor: "pointer" }}>Organize typed dump</button>
                    <button className="ap-hover-violet" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderRadius: 11, background: "rgba(124,108,255,.12)", border: "1px solid rgba(124,108,255,.3)", color: "#c3b9ff", font: "600 13.5px Manrope", cursor: "pointer" }}>✦ Enhance with AI</button>
                  </div>
                  <div style={{ font: "500 12.5px Manrope", color: "#7d8a9c", marginTop: 16 }}>Status: <span style={{ color: "#9fdcef" }}>✎ Nova is ready. Keep going until your thought is out.</span></div>
                </div>

                <div style={{ borderRadius: 18, padding: 26, background: "rgba(255,255,255,.022)", border: "1px solid rgba(125,165,205,.10)" }}>
                  <div style={{ font: "700 21px Sora", color: "#eaf1f8" }}>Nova capture</div>
                  <div style={{ marginTop: 18, padding: 18, borderRadius: 13, background: "rgba(255,255,255,.022)", border: "1px solid rgba(125,165,205,.12)" }}>
                    <div style={{ font: "600 14.5px Manrope", color: "#dbe4ee" }}>Your organized capture will appear here.</div>
                    <div style={{ font: "500 13px/1.6 Manrope", color: "#8ea0b3", marginTop: 8 }}>Record or type one thought, then tap organize. Nova will turn it into a title, category, notes, tags, and action items before you save.</div>
                  </div>
                  <div style={{ marginTop: 14, padding: "16px 18px", borderRadius: 13, background: "rgba(45,212,255,.05)", border: "1px solid rgba(45,212,255,.14)" }}>
                    <div style={{ font: "600 13.5px Manrope", color: "#9fdcef" }}>Save stays locked until Nova has something real.</div>
                    <div style={{ font: "500 12.5px/1.6 Manrope", color: "#7d8a9c", marginTop: 6 }}>This prevents empty memories or placeholder titles from being saved to your vault.</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* floating mic FAB on non-voice screens */}
          {screen !== "voice" && (
            <button onClick={startVoiceDump} aria-label="Start voice capture" className="ap-hover-bright" style={{ position: "fixed", right: 30, bottom: 30, width: 58, height: 58, borderRadius: "50%", border: "none", cursor: "pointer", background: "radial-gradient(circle at 50% 36%,#8eecff,#1cb8e8 60%,#0b8fc4)", boxShadow: "0 0 28px rgba(45,212,255,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
              <MicIcon size={24} />
            </button>
          )}
        </main>
      </div>

      {/* Unobtrusive exit back to site */}
      <Link to="/" style={{ position: "fixed", left: 14, bottom: 12, font: `600 10px ${MONO}`, letterSpacing: ".12em", color: "#3c4658", textDecoration: "none", zIndex: 60 }}>← SAVEME.SPACE</Link>
    </div>
  );
};

export default AppPreview;
