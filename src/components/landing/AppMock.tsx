import { useEffect, useRef, useState } from "react";

/**
 * AppMock — the hero product window. A symmetric voice-print waveform painted
 * on a canvas (rAF loop), alongside a Memory panel whose four category cards
 * auto-cycle: every couple of seconds one card flips to a new value and flashes
 * a "SAVED" badge, illustrating Nova capturing and filing speech in real time.
 *
 * Honors prefers-reduced-motion (static frame, no cycling) and pauses both the
 * canvas loop and the cycle timer while scrolled offscreen.
 */

type CategoryKey = "contact" | "calendar" | "action" | "reminder";

const POOLS: Record<CategoryKey, string[]> = {
  contact: ["Sarah (Marketing)", "Daniel (Engineering)", "Maya (Design)", "Tom (Finance)"],
  calendar: ["Q3 Budget Review · Tue 3pm", "Standup · Mon 9am", "1:1 with Daniel · Wed 2pm", "Design crit · Thu 4pm"],
  action: ["Prepare budget breakdown", "Redesign homepage CTA", "Test onboarding flow", "Follow up with Daniel"],
  reminder: ["Pick up dry cleaning", "Call the client back", "Renew the domain", "Book the flights"],
};

const ORDER: CategoryKey[] = ["contact", "calendar", "action", "reminder"];

const ICON: Record<CategoryKey, JSX.Element> = {
  contact: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5fd6f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  calendar: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5fd6f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </svg>
  ),
  action: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5fd6f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h13M4 12h13M4 17h9" />
      <path d="M19.5 15.5l1.6 1.6 2.4-2.6" />
    </svg>
  ),
  reminder: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5fd6f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
};

const LABEL: Record<CategoryKey, string> = {
  contact: "CONTACT",
  calendar: "CALENDAR",
  action: "ACTION ITEM",
  reminder: "REMINDER",
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Waveform = ({ running }: { running: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const energyRef = useRef<number | null>(null);

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

        const energy = 0.45 + 0.42 * Math.abs(Math.sin(t * 2.1) * Math.sin(t * 0.6)) + Math.random() * 0.07;
        energyRef.current = energyRef.current == null ? energy : energyRef.current + (energy - energyRef.current) * 0.2;
        const e = energyRef.current;

        const gap = 54;
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
              const ramp = Math.min(1, (d - gap) / 52);
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
        drawWave(0.05, 0, 1, 2.6, accent, 15);
        drawWave(0.05, 0, 1, 1.2, "rgba(200,247,255,.92)", 0);
        ctx.globalAlpha = 0.4;
        drawWave(0.083, 1.4, 0.6, 1.3, accent, 8);
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(draw);
    };

    if (running) {
      raf = requestAnimationFrame(draw);
    } else {
      // Paint one still frame so the panel isn't blank when paused/reduced.
      energyRef.current = 0.7;
      draw();
      cancelAnimationFrame(raf);
    }

    return () => cancelAnimationFrame(raf);
  }, [running]);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true" />;
};

export const AppMock = () => {
  const [mem, setMem] = useState<Record<CategoryKey, string>>({
    contact: POOLS.contact[0],
    calendar: POOLS.calendar[0],
    action: POOLS.action[0],
    reminder: POOLS.reminder[0],
  });
  const [saved, setSaved] = useState<CategoryKey | null>(null);
  const [visible, setVisible] = useState(true);

  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<CategoryKey, HTMLDivElement | null>>({
    contact: null,
    calendar: null,
    action: null,
    reminder: null,
  });
  const idxRef = useRef<Record<CategoryKey, number>>({ contact: 0, calendar: 0, action: 0, reminder: 0 });
  const tickRef = useRef(0);

  // Pause everything while offscreen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reduced = prefersReducedMotion();
  const running = visible && !reduced;

  useEffect(() => {
    if (!running) return;

    let savedTimer: ReturnType<typeof setTimeout>;
    const cycle = () => {
      const key = ORDER[tickRef.current % ORDER.length];
      tickRef.current += 1;
      idxRef.current[key] = (idxRef.current[key] + 1) % POOLS[key].length;
      setMem((prev) => ({ ...prev, [key]: POOLS[key][idxRef.current[key]] }));
      setSaved(key);

      const card = cardRefs.current[key];
      if (card) {
        card.style.animation = "none";
        void card.offsetWidth;
        card.style.animation = "lp-memflip .55s cubic-bezier(.2,.8,.2,1)";
      }

      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => setSaved((s) => (s === key ? null : s)), 1500);
    };

    const interval = setInterval(cycle, 2300);
    return () => {
      clearInterval(interval);
      clearTimeout(savedTimer);
    };
  }, [running]);

  return (
    <div ref={rootRef} className="lp-mock">
      <div className="lp-mock-bar">
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div style={{ flex: 1, textAlign: "center", font: "600 13px Manrope", color: "#7d8a9c" }}>SaveMe</div>
        <div style={{ width: 54 }} />
      </div>

      <div className="lp-mock-grid">
        {/* Voice capture */}
        <div className="lp-mock-capture">
          <h3 style={{ font: "700 26px Sora", color: "#eaf1f8", margin: 0 }}>Voice capture</h3>
          <p style={{ font: "500 14px Manrope", color: "#8ea0b3", margin: "9px 0 0" }}>Speak naturally — Nova is listening.</p>
          <div style={{ position: "relative", width: "100%", maxWidth: 480, height: 172, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Waveform running={running} />
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
              {!reduced && <div style={{ position: "absolute", left: "50%", top: "50%", width: 108, height: 108, borderRadius: "50%", border: "1px solid rgba(45,212,255,.35)", animation: "lp-micpulse 3s ease-out infinite" }} />}
              {!reduced && <div style={{ position: "absolute", left: "50%", top: "50%", width: 108, height: 108, borderRadius: "50%", border: "1px solid rgba(45,212,255,.26)", animation: "lp-micpulse 3s ease-out infinite", animationDelay: "1.5s" }} />}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 96, height: 96, borderRadius: "50%", background: "radial-gradient(circle at 50% 36%,#8eecff,#1cb8e8 58%,#0b8fc4)", animation: reduced ? undefined : "lp-softglow 2.8s ease-in-out infinite" }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#06283a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2.5" width="6" height="11.5" rx="3" fill="#06283a" stroke="none" />
                  <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
                  <path d="M12 17.5V21" />
                  <path d="M8.5 21h7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Memory panel */}
        <aside className="lp-mock-memory">
          <div style={{ font: "700 18px Sora", color: "#eaf1f8" }}>Memory</div>
          <div style={{ font: "500 12px Manrope", color: "#7d8a9c", marginTop: 3 }}>Auto-categorized items</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 18 }}>
            {ORDER.map((key) => (
              <div key={key} style={{ position: "relative", background: "rgba(255,255,255,.026)", border: "1px solid rgba(120,160,200,.10)", borderRadius: 13, padding: "13px 15px", overflow: "hidden" }}>
                {saved === key && <div style={{ position: "absolute", inset: 0, borderRadius: 13, border: "1px solid rgba(45,212,255,.45)", boxShadow: "0 0 22px rgba(45,212,255,.22) inset" }} />}
                <div ref={(el) => (cardRefs.current[key] = el)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      {ICON[key]}
                      <span style={{ font: "600 10px 'JetBrains Mono'", letterSpacing: ".13em", color: "#5fd6f0" }}>{LABEL[key]}</span>
                    </div>
                    {saved === key && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, font: "600 9.5px 'JetBrains Mono'", letterSpacing: ".1em", color: "#39e0a8", animation: "lp-badgein .3s ease both" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#39e0a8", boxShadow: "0 0 7px #39e0a8" }} />
                        SAVED
                      </span>
                    )}
                  </div>
                  <div style={{ font: "600 14.5px Manrope", color: "#eaf1f8" }}>{mem[key]}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AppMock;
