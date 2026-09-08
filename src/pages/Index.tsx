import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { trackActivationEvent } from "@/lib/analytics";
import { AppMock } from "@/components/landing/AppMock";
import { publicPlanCards } from "@/config/plans/publicPlans";
import "@/styles/landing.css";

const GRAD = "linear-gradient(135deg,#2dd4ff,#0b8fc4)";
const ACCENT = "#5fd6f0";
const MONO = "'JetBrains Mono'";

const ctaPrimary: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  borderRadius: 13,
  background: GRAD,
  color: "#04222e",
  boxShadow: "0 0 34px rgba(45,212,255,.4)",
  fontFamily: "Manrope",
  fontWeight: 700,
};

const cardBase: CSSProperties = {
  borderRadius: 18,
  background: "rgba(255,255,255,.022)",
  border: "1px solid rgba(125,165,205,.09)",
};

const eyebrow: CSSProperties = {
  font: `600 12px ${MONO}`,
  letterSpacing: ".2em",
  color: ACCENT,
};

const CheckRow = ({ text, color = "#c4cedb" }: { text: ReactNode; color?: string }): JSX.Element => (
  <div style={{ display: "flex", gap: 10, font: "500 13.5px Manrope", color }}>
    <span style={{ color: "#39e0a8" }}>✓</span>
    {text}
  </div>
);

const FEATURES = [
  {
    title: "Just talk",
    desc: "Capture notes, ideas, contacts, and reminders by speaking naturally — no typing, no friction.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </svg>
    ),
  },
  {
    title: "Nova organizes",
    desc: "Every thought is auto-sorted into notes, tasks, events, and contacts. No folders, no tags to manage.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={ACCENT}>
        <path d="M12 2l1.7 4.8L18.5 8.5l-4.8 1.7L12 15l-1.7-4.8L5.5 8.5l4.8-1.7z" />
        <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />
      </svg>
    ),
  },
  {
    title: "Find it instantly",
    desc: "Search by keyword, category, or just describe what you're looking for. Answers in seconds.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4-4" />
      </svg>
    ),
  },
  {
    title: "Yours, private",
    desc: "Encrypted in transit and protected by account-level access. Connected agents and processors receive data only for the functions you authorize.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 4.6-3 7.7-7 9-4-1.3-7-4.4-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

const STEPS = [
  { n: "01", title: "Speak naturally", desc: "Brain-dump raw thoughts out loud. No structure required — just talk." },
  { n: "02", title: "Nova organizes", desc: "Your words become searchable facts, tasks, events, and context — sorted automatically." },
  { n: "03", title: "Retrieve anywhere", desc: "Find anything in seconds — and let trusted AI agents use the same memory when you allow it." },
];

const PRIVACY = [
  {
    title: "Encrypted in transit",
    desc: "Your captures are protected on the way to your vault.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4.5" y="10" width="15" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
  {
    title: "Account-level access",
    desc: "Only you — and the agents you explicitly authorize — can read your memory.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="4.5" />
        <path d="M11 11l9 9M17 17l2-2M14 14l2-2" />
      </svg>
    ),
  },
  {
    title: "Your data stays yours",
    desc: "Review how processors, connected agents, exports, retention, and deletion currently work in our Privacy Policy.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="8" r="4" />
        <path d="M3 21a7 7 0 0 1 11-5.7" />
        <path d="M16 18l2 2 4-4" />
      </svg>
    ),
  },
];

const featureIconWrap: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 12,
  background: "rgba(45,212,255,.09)",
  border: "1px solid rgba(45,212,255,.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 18,
};

const Index = () => {
  const { isAuthenticated } = useAuth();

  const getPlanHref = (planId: string) => {
    if (planId === "free") return isAuthenticated ? "/dashboard" : "/signup?plan=free";
    return isAuthenticated ? `/subscription?plan=${planId}` : `/signup?plan=${planId}`;
  };

  const brainDumpHref = isAuthenticated ? "/brain-dump" : "/signup?next=%2Fbrain-dump";
  const trackBrainDump = (source: string) =>
    trackActivationEvent(isAuthenticated ? "brain_dump_start_clicked" : "signup_started", { source });

  const PLANS = publicPlanCards();

  return (
    <div className="lp-root" style={{ minHeight: "100vh", width: "100%" }}>
      {/* NAV */}
      <nav
        className="lp-nav"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 40px",
          background: "rgba(5,7,11,.72)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(125,165,205,.07)",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <img src="/logo.png" alt="SaveMe" width={36} height={36} style={{ display: "block", objectFit: "contain", filter: "drop-shadow(0 0 14px rgba(45,212,255,.35))" }} />
          <span style={{ font: "700 18px Sora", color: "#eaf3fa" }}>SaveMe</span>
        </Link>
        <div className="lp-nav-links" style={{ display: "flex", alignItems: "center", gap: 34 }}>
          <a href="#features" className="lp-navlink" style={{ font: "600 14px Manrope", textDecoration: "none" }}>Product</a>
          <a href="#how" className="lp-navlink" style={{ font: "600 14px Manrope", textDecoration: "none" }}>How it works</a>
          <a href="#agents" className="lp-navlink" style={{ font: "600 14px Manrope", textDecoration: "none" }}>For agents</a>
          <a href="#pricing" className="lp-navlink" style={{ font: "600 14px Manrope", textDecoration: "none" }}>Pricing</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Link to={isAuthenticated ? "/dashboard" : "/login"} className="lp-login" style={{ font: "600 14px Manrope", textDecoration: "none" }}>
            {isAuthenticated ? "Dashboard" : "Log in"}
          </Link>
          <Link to={isAuthenticated ? "/dashboard" : "/signup"} className="lp-cta" onClick={() => !isAuthenticated && trackActivationEvent("signup_started", { source: "landing_nav" })} style={{ padding: "9px 18px", borderRadius: 10, background: GRAD, color: "#04222e", font: "700 14px Manrope", boxShadow: "0 0 22px rgba(45,212,255,.35)", textDecoration: "none" }}>
            Start free
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <header style={{ position: "relative", padding: "74px 24px 90px", textAlign: "center", overflow: "hidden", background: "#05070b" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }} aria-hidden="true">
          <div style={{ position: "absolute", top: "-22%", left: "18%", width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle,rgba(45,212,255,.20),transparent 64%)", filter: "blur(34px)", animation: "lp-orbA 17s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: "-8%", right: "12%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle,rgba(36,120,220,.18),transparent 64%)", filter: "blur(40px)", animation: "lp-orbB 21s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "-26%", left: "38%", width: 680, height: 680, borderRadius: "50%", background: "radial-gradient(circle,rgba(45,212,255,.13),transparent 66%)", filter: "blur(46px)", animation: "lp-orbC 25s ease-in-out infinite" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(125,165,205,.10) 1px,transparent 1px)", backgroundSize: "26px 26px", WebkitMaskImage: "radial-gradient(720px 500px at 50% 10%,#000,transparent 72%)", maskImage: "radial-gradient(720px 500px at 50% 10%,#000,transparent 72%)", animation: "lp-gridpan 26s linear infinite" }} aria-hidden="true" />

        <div style={{ position: "relative", maxWidth: 920, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 16px", borderRadius: 999, background: "rgba(45,212,255,.07)", border: "1px solid rgba(45,212,255,.18)", marginBottom: 30 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <path d="M12 18v3" />
            </svg>
            <span style={{ font: "600 13px Manrope", color: "#9fdcef" }}>Voice-powered memory · powered by Nova</span>
          </div>
          <h1 style={{ font: "800 clamp(34px,6vw,64px)/1.04 Sora", letterSpacing: "-.025em", margin: 0 }}>
            Speak it once. SaveMe<br />remembers everything.
          </h1>
          <p style={{ font: "700 18px Manrope", color: "#aebaca", margin: "26px 0 0" }}>Your brain wasn't built to remember everything.</p>
          <p style={{ font: "500 17px/1.6 Manrope", color: "#7d8a9c", margin: "6px auto 0", maxWidth: 600 }}>
            Talk naturally and Nova captures, categorizes, and organizes every idea, task, and note into searchable memory — and lets your AI agents use it too.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 38 }}>
            <Link to={brainDumpHref} onClick={() => trackBrainDump("landing_hero")} className="lp-cta" style={{ ...ctaPrimary, padding: "15px 26px", fontSize: 15 }}>
              Start free — no card needed <span style={{ fontSize: 16 }}>→</span>
            </Link>
            <a href="#how" className="lp-ghost" style={{ display: "flex", alignItems: "center", padding: "15px 24px", borderRadius: 13, background: "rgba(255,255,255,.04)", border: "1px solid rgba(125,165,205,.14)", color: "#dbe4ee", font: "700 15px Manrope", textDecoration: "none" }}>
              See how it works
            </a>
          </div>
        </div>

        <AppMock />
      </header>

      {/* LOGOS */}
      <section className="lp-section" style={{ padding: "54px 24px 64px", textAlign: "center" }}>
        <div style={{ font: `600 12px ${MONO}`, letterSpacing: ".22em", color: "#5a6679" }}>ONE MEMORY LAYER FOR THE AGENTS YOU ALREADY USE</div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 46, marginTop: 26 }}>
          {["Claude", "Cursor", "Codex", "OpenClaw", "Hermes"].map((name) => (
            <span key={name} className="lp-logoword" style={{ font: "700 22px Sora" }}>{name}</span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="lp-section" style={{ padding: "60px 40px", maxWidth: 1200, margin: "0 auto", scrollMarginTop: 84 }}>
        <div style={eyebrow}>WHAT YOU'LL UNLOCK</div>
        <h2 style={{ font: "700 clamp(26px,4vw,40px)/1.15 Sora", letterSpacing: "-.02em", margin: "14px 0 36px", maxWidth: 620 }}>
          Speak freely. Stay organized without lifting a finger.
        </h2>
        <div className="lp-feat-grid">
          {FEATURES.map((f) => (
            <div key={f.title} style={{ ...cardBase, padding: 24 }}>
              <div style={featureIconWrap}>{f.icon}</div>
              <div style={{ font: "700 17px Sora", color: "#eaf1f8", marginBottom: 9 }}>{f.title}</div>
              <div style={{ font: "500 13.5px/1.6 Manrope", color: "#8593a6" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="lp-section" style={{ padding: "70px 40px", textAlign: "center", background: "radial-gradient(700px 360px at 50% 0%,rgba(45,212,255,.05),transparent 65%)", scrollMarginTop: 84 }}>
        <div style={eyebrow}>PURE VOICE. ZERO FRICTION.</div>
        <h2 style={{ font: "700 clamp(28px,4.5vw,42px)/1.12 Sora", letterSpacing: "-.02em", margin: "14px auto 44px", maxWidth: 560 }}>
          From spoken thought to durable memory.
        </h2>
        <div className="lp-3grid" style={{ maxWidth: 1140, margin: "0 auto", textAlign: "left" }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ ...cardBase, padding: 28 }}>
              <div style={{ font: `700 14px ${MONO}`, color: ACCENT, marginBottom: 18 }}>{s.n}</div>
              <div style={{ font: "700 20px Sora", color: "#eaf1f8", marginBottom: 10 }}>{s.title}</div>
              <div style={{ font: "500 14px/1.6 Manrope", color: "#8593a6" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AGENTS */}
      <section id="agents" className="lp-section" style={{ padding: "70px 40px", maxWidth: 1200, margin: "0 auto", scrollMarginTop: 84 }}>
        <div className="lp-agents-grid">
          <div>
            <div style={{ font: `600 12px ${MONO}`, letterSpacing: ".18em", color: ACCENT }}>HUMAN MEMORY. AGENT MEMORY. ONE PLACE.</div>
            <h2 style={{ font: "700 clamp(26px,4vw,38px)/1.16 Sora", letterSpacing: "-.02em", margin: "14px 0 16px" }}>
              Your AI agents should remember what you already told them.
            </h2>
            <p style={{ font: "500 15px/1.65 Manrope", color: "#8593a6", margin: "0 0 22px", maxWidth: 480 }}>
              Voice-dump your thoughts into SaveMe, then let trusted agents search the same memory before they work — so you never re-explain context again.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 28 }}>
              <CheckRow text="One durable memory layer, not another scattered chat history" />
              <CheckRow text="Per-agent API keys with read/write scopes you control" />
              <CheckRow text="Works with Claude, Cursor, Codex, OpenClaw, and Hermes" />
            </div>
            <Link
              to={isAuthenticated ? "/settings#connect-agent" : "/signup"}
              onClick={() => trackActivationEvent(isAuthenticated ? "agent_connect_clicked" : "signup_started", { source: "agent_memory_teaser" })}
              className="lp-cta"
              style={{ display: "inline-flex", padding: "13px 22px", borderRadius: 12, background: GRAD, color: "#04222e", font: "700 14px Manrope", boxShadow: "0 0 26px rgba(45,212,255,.34)", textDecoration: "none" }}
            >
              Connect an agent
            </Link>
          </div>
          <div style={{ borderRadius: 16, background: "#080b12", border: "1px solid rgba(125,165,205,.12)", overflow: "hidden", boxShadow: "0 30px 80px -40px rgba(0,0,0,.8)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, height: 42, padding: "0 16px", borderBottom: "1px solid rgba(125,165,205,.08)" }}>
              <div style={{ display: "flex", gap: 7 }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3a4252" }} />
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3a4252" }} />
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3a4252" }} />
              </div>
              <span style={{ font: `500 12.5px ${MONO}`, color: "#7d8a9c" }}>memory.search</span>
            </div>
            <div style={{ padding: 22, font: `500 13px/1.9 ${MONO}`, color: "#9aa6b6" }}>
              <div><span style={{ color: ACCENT }}>POST</span> <span style={{ color: "#c4cedb" }}>/v1/memory/search</span></div>
              <div><span style={{ color: ACCENT }}>Authorization:</span> Bearer sk_agent_•••</div>
              <div style={{ height: 14 }} />
              <div>{"{"}</div>
              <div>&nbsp;&nbsp;<span style={{ color: "#8fd0ff" }}>"query"</span>: <span style={{ color: "#7fe0b0" }}>"Q3 budget owner"</span>,</div>
              <div>&nbsp;&nbsp;<span style={{ color: "#8fd0ff" }}>"scopes"</span>: [<span style={{ color: "#7fe0b0" }}>"read"</span>]</div>
              <div>{"}"}</div>
              <div style={{ height: 14 }} />
              <div><span style={{ color: "#39e0a8" }}>200 OK</span></div>
              <div>{"{"}</div>
              <div>&nbsp;&nbsp;<span style={{ color: "#8fd0ff" }}>"contact"</span>: <span style={{ color: "#7fe0b0" }}>"Sarah (Marketing)"</span>,</div>
              <div>&nbsp;&nbsp;<span style={{ color: "#8fd0ff" }}>"event"</span>: <span style={{ color: "#7fe0b0" }}>"Q3 Budget Review · Tue 3pm"</span></div>
              <div>{"}"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="lp-section" style={{ padding: "70px 40px", textAlign: "center", scrollMarginTop: 84 }}>
        <div style={eyebrow}>SIMPLE PRICING</div>
        <h2 style={{ font: "700 clamp(28px,4.5vw,42px)/1.12 Sora", letterSpacing: "-.02em", margin: "14px 0 8px" }}>Start free. Upgrade when you're ready.</h2>
        <p style={{ font: "500 15px Manrope", color: "#7d8a9c", margin: "0 0 42px" }}>No lock-in. No card needed to begin.</p>
        <div className="lp-pricing-grid">
          {PLANS.map((plan) => {
            const accentText = plan.popular ? "#dbe4ee" : "#c4cedb";
            return (
              <div
                key={plan.id}
                style={{
                  position: "relative",
                  borderRadius: 18,
                  padding: 28,
                  display: "flex",
                  flexDirection: "column",
                  background: plan.popular ? "linear-gradient(180deg,rgba(45,212,255,.07),rgba(45,212,255,.01))" : "rgba(255,255,255,.022)",
                  border: plan.popular ? "1px solid rgba(45,212,255,.4)" : "1px solid rgba(125,165,205,.10)",
                  boxShadow: plan.popular ? "0 0 50px -12px rgba(45,212,255,.4)" : undefined,
                }}
              >
                {plan.popular && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", padding: "5px 14px", borderRadius: 999, background: GRAD, color: "#04222e", font: "700 11px Manrope" }}>Most popular</div>
                )}
                <div style={{ font: `600 11px ${MONO}`, letterSpacing: ".14em", color: plan.popular ? "#9fdcef" : "#8593a6" }}>{plan.name}</div>
                <div style={{ margin: "14px 0 4px" }}>
                  <span style={{ font: "800 38px Sora", color: plan.popular ? "#f1f7fc" : "#eaf1f8" }}>{plan.price}</span>{" "}
                  <span style={{ font: "500 14px Manrope", color: plan.popular ? "#9fdcef" : "#7d8a9c" }}>{plan.period}</span>
                </div>
                <div style={{ font: "500 13.5px Manrope", color: plan.popular ? "#8ea0b3" : "#8593a6", marginBottom: 22 }}>{plan.blurb}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
                  {plan.features.map((feat) => <CheckRow key={feat} text={feat} color={accentText} />)}
                </div>
                <Link
                  to={getPlanHref(plan.id)}
                  onClick={() => trackActivationEvent("subscription_clicked", { source: "landing_pricing", plan: plan.id })}
                  className={plan.popular ? "lp-cta" : "lp-ghost"}
                  style={{
                    marginTop: 24,
                    textAlign: "center",
                    padding: 12,
                    borderRadius: 11,
                    font: "700 13.5px Manrope",
                    textDecoration: "none",
                    ...(plan.popular
                      ? { background: GRAD, color: "#04222e", boxShadow: "0 0 24px rgba(45,212,255,.4)" }
                      : { background: "rgba(255,255,255,.04)", border: "1px solid rgba(125,165,205,.14)", color: "#dbe4ee" }),
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* PRIVACY */}
      <section className="lp-section" style={{ padding: "70px 40px", textAlign: "center", maxWidth: 1140, margin: "0 auto" }}>
        <div style={eyebrow}>PRIVACY & SECURITY</div>
        <h2 style={{ font: "700 clamp(28px,4.5vw,42px)/1.12 Sora", letterSpacing: "-.02em", margin: "14px 0 44px" }}>Your second brain, kept private.</h2>
        <div className="lp-3grid" style={{ textAlign: "left" }}>
          {PRIVACY.map((p) => (
            <div key={p.title} style={{ ...cardBase, padding: 26 }}>
              <div style={{ ...featureIconWrap, width: 44, height: 44 }}>{p.icon}</div>
              <div style={{ font: "700 17px Sora", color: "#eaf1f8", marginBottom: 9 }}>{p.title}</div>
              <div style={{ font: "500 13.5px/1.6 Manrope", color: "#8593a6" }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ position: "relative", padding: "96px 24px", textAlign: "center", overflow: "hidden", background: "radial-gradient(700px 420px at 50% 60%,rgba(45,212,255,.13),transparent 66%)" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(125,165,205,.10) 1px,transparent 1px)", backgroundSize: "26px 26px", WebkitMaskImage: "radial-gradient(560px 320px at 50% 50%,#000,transparent 72%)", maskImage: "radial-gradient(560px 320px at 50% 50%,#000,transparent 72%)" }} aria-hidden="true" />
        <div style={{ position: "relative" }}>
          <h2 style={{ font: "800 clamp(30px,5.5vw,50px)/1.1 Sora", letterSpacing: "-.025em", margin: 0 }}>Ready to offload your brain?</h2>
          <p style={{ font: "500 16px/1.6 Manrope", color: "#8593a6", margin: "18px auto 0", maxWidth: 520 }}>
            Your external memory is one voice command away. Start free — no card needed.
          </p>
          <Link to={brainDumpHref} onClick={() => trackBrainDump("landing_final_cta")} className="lp-cta" style={{ ...ctaPrimary, marginTop: 34, padding: "16px 30px", fontSize: 16 }}>
            Start free <span style={{ fontSize: 17 }}>→</span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "56px 40px 34px", borderTop: "1px solid rgba(125,165,205,.07)" }}>
        <div className="lp-foot-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
              <img src="/logo.png" alt="SaveMe" width={32} height={32} style={{ display: "block", objectFit: "contain" }} />
              <span style={{ font: "700 17px Sora", color: "#eaf3fa" }}>SaveMe</span>
            </div>
            <p style={{ font: "500 13.5px/1.6 Manrope", color: "#7d8a9c", maxWidth: 300, margin: 0 }}>
              Your voice-powered memory. Speak it once — SaveMe captures, organizes, and recalls every idea, task, and note.
            </p>
          </div>
          <div>
            <div style={{ font: "700 13px Sora", color: "#c4cedb", marginBottom: 16 }}>Product</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <a href="#how" className="lp-foot" style={{ font: "500 13.5px Manrope", textDecoration: "none" }}>How it works</a>
              <a href="#agents" className="lp-foot" style={{ font: "500 13.5px Manrope", textDecoration: "none" }}>For agents</a>
              <a href="#pricing" className="lp-foot" style={{ font: "500 13.5px Manrope", textDecoration: "none" }}>Pricing</a>
            </div>
          </div>
          <div>
            <div style={{ font: "700 13px Sora", color: "#c4cedb", marginBottom: 16 }}>Company</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <Link to="/privacy" className="lp-foot" style={{ font: "500 13.5px Manrope", textDecoration: "none" }}>Privacy</Link>
              <Link to="/terms" className="lp-foot" style={{ font: "500 13.5px Manrope", textDecoration: "none" }}>Terms</Link>
              <a href="mailto:info@saveme.space" className="lp-foot" style={{ font: "500 13.5px Manrope", textDecoration: "none" }}>Contact</a>
            </div>
          </div>
          <div>
            <div style={{ font: "700 13px Sora", color: "#c4cedb", marginBottom: 16 }}>Resources</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <Link to="/user-guide" className="lp-foot" style={{ font: "500 13.5px Manrope", textDecoration: "none" }}>Docs</Link>
              <a href="mailto:info@saveme.space" className="lp-foot" style={{ font: "500 13.5px Manrope", textDecoration: "none" }}>Support</a>
              <Link to="/privacy" className="lp-foot" style={{ font: "500 13.5px Manrope", textDecoration: "none" }}>Security</Link>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: "40px auto 0", paddingTop: 22, borderTop: "1px solid rgba(125,165,205,.07)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span style={{ font: "500 12.5px Manrope", color: "#5d6a7b" }}>© 2026 SaveMe. Your external memory.</span>
          <span style={{ font: "500 12.5px Manrope", color: "#5d6a7b" }}>Encrypted in transit · We never sell your data.</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
