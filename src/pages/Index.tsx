import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Mic, Mail, ArrowRight, Sun, Moon, Sparkles, Bot, PlugZap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { VideoModal } from "@/components/VideoModal";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ConversationalVoiceDemo } from "@/components/landing/ConversationalVoiceDemo";
import { trackActivationEvent } from "@/lib/analytics";

const SAVEME_DEMO_VIDEO = "/videos/saveme-demo.mp4";

const Index = () => {
  const [isComponentReady, setIsComponentReady] = useState(false);
  const { isAuthenticated } = useAuth();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const navigate = useNavigate();
  const [activeDemoVideo, setActiveDemoVideo] = useState<{ url: string; title: string } | null>(null);
  const [activeCanvidVideo, setActiveCanvidVideo] = useState<{ url: string; title: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const getPlanHref = (planName: string) => {
    const normalizedPlan = planName.toLowerCase();

    if (normalizedPlan === 'free') {
      return isAuthenticated ? '/dashboard' : '/signup?plan=free';
    }

    return isAuthenticated
      ? `/subscription?plan=${normalizedPlan}`
      : `/signup?plan=${normalizedPlan}`;
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => { setIsComponentReady(true); }, []);

  useEffect(() => {
    const fetchActiveVideos = async () => {
      try {
        const videosRef = collection(db, 'public_demo_videos');
        const querySnapshot = await getDocs(videosRef);
        querySnapshot.forEach((docSnap) => {
          const video = docSnap.data();
          if (video.video_type === 'demo') setActiveDemoVideo({ url: video.video_url, title: video.title });
          else if (video.video_type === 'canvid_replacement') setActiveCanvidVideo({ url: video.video_url, title: video.title });
        });
      } catch (error) { console.error('Error fetching videos:', error); }
    };
    fetchActiveVideos();
  }, []);

  const plans = [
    { name: "FREE", price: "$0", period: "Forever", description: "Perfect for getting started", features: ["Up to 50 entries", "Basic search", "Web access only", "Standard support"], popular: false },
    { name: "BASIC", price: "$9", period: "per month", description: "For personal power users", features: ["Unlimited entries", "Advanced search & filters", "All platforms", "Voice input & commands", "Priority support"], popular: true },
    { name: "PREMIUM", price: "$19", period: "per month", description: "For teams and professionals", features: ["Everything in Basic", "Data export & backup", "Advanced encryption", "API access", "Custom integrations", "24/7 support"], popular: false }
  ];

  if (!isComponentReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center relative">
          <p className="text-zinc-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden transition-colors ${theme} ${theme === 'dark' ? 'bg-zinc-950 text-zinc-300 selection:bg-accent/30 selection:text-white' : 'bg-white text-zinc-700 selection:bg-blue-200'}`}>
      <div className="grid-blueprint" />

      <div className={`max-w-[1400px] mx-auto px-4 md:px-8 min-h-screen flex flex-col ${theme === 'dark' ? 'border-l border-r border-zinc-800/50' : 'border-l border-r border-zinc-200'}`}>
        {/* Navigation */}
        <nav className={`grid grid-cols-2 md:grid-cols-3 items-center h-20 text-sm ${theme === 'dark' ? 'border-b border-zinc-800/50' : 'border-b border-zinc-200'}`}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SaveMe.Space" className="w-8 h-8 object-contain" />
            <span className={`hidden sm:inline font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>SaveMe.Space</span>
          </div>
          <div className={`hidden md:flex justify-center text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-400'}`}>Voice-first external memory, powered by AI</div>
          <div className={`flex items-center justify-end gap-4 ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-600'}`}>
            <button onClick={toggleTheme} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'}`} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className={`px-5 py-2.5 rounded-lg font-medium transition-all ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>Dashboard</Link>
            ) : (
              <Link to="/login" className={`px-5 py-2.5 rounded-lg font-medium transition-all ${theme === 'dark' ? 'border border-zinc-600 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800/80' : 'border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'}`}>Sign In</Link>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-16 md:py-24 lg:py-32 flex flex-col items-center justify-center text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide mb-8 reveal ${theme === 'dark' ? 'bg-primary/12 text-primary border border-primary/30' : 'bg-primary/10 text-primary border border-primary/20'}`}>
            <Mic className="w-3 h-3" />
            Capture voice. Get structured memory.
          </div>
          <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 reveal stagger-1 leading-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Your brain wasn't built<br />
            <span className="text-primary">to remember everything.</span>
          </h1>
          <p className={`text-lg md:text-xl max-w-2xl mb-8 reveal stagger-2 leading-relaxed ${theme === 'dark' ? 'text-zinc-200 md:text-zinc-300' : 'text-zinc-600'}`}>
            Speak your thoughts out loud. SaveMe captures, categorizes, and organizes them automatically, so you never lose an idea, task, or insight again.
          </p>
          <div className={`mb-10 max-w-2xl rounded-2xl border p-4 text-left reveal stagger-3 ${theme === 'dark' ? 'border-zinc-800/70 bg-zinc-900/40' : 'border-zinc-200 bg-zinc-50'}`}>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className={`text-sm font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Best place to start: Brain Dump</p>
                <p className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  Speak freely. Nova will organize your thoughts into structured notes, action items, and searchable memory.
                </p>
              </div>
            </div>
          </div>
          <div className="w-full max-w-lg mb-8 reveal stagger-3">
            <ConversationalVoiceDemo onSignupClick={() => navigate("/signup")} theme={theme} />
          </div>
          <p className={`text-sm font-medium mb-8 reveal stagger-4 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-400'}`}>Try the demo above, then start a voice dump. No signup needed for the demo.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 reveal stagger-4">
            {activeDemoVideo && (
              <button
                className={`px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2 ${theme === 'dark' ? 'border border-zinc-600 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800/80' : 'border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'}`}
                onClick={() => setIsVideoModalOpen(true)}
              >
                Watch Demo
              </button>
            )}
            {isAuthenticated ? (
              <Link to="/brain-dump" onClick={() => trackActivationEvent("brain_dump_start_clicked", { source: "landing_hero_authenticated" })} className={`px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center gap-2 ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm hover:shadow-md' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                Start voice dump
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link to="/signup?next=%2Fbrain-dump" onClick={() => trackActivationEvent("signup_started", { source: "landing_hero_brain_dump" })} className={`px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center gap-2 ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm hover:shadow-md' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                Start voice dump
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          {[
            { num: "01", title: "Voice Capture", desc: "Just speak naturally. Capture notes, ideas, contacts, and reminders without typing a single word." },
            { num: "02", title: "AI Organization", desc: "Your data is automatically sorted into categories. No folders to manage, no tags to remember." },
            { num: "03", title: "Instant Search", desc: "Find anything in seconds. Search by keyword, category, or just describe what you're looking for." },
            { num: "04", title: "Your Data, Private", desc: "End-to-end encryption. Your information stays yours. We never sell or share your data." }
          ].map((feature, i) => (
            <div key={i} className={`p-10 border-b md:border-b-0 md:border-r last:border-r-0 transition-all group reveal ${theme === 'dark' ? 'border-zinc-800/50 hover:bg-zinc-900/40' : 'border-zinc-200 hover:bg-zinc-50'}`} style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
              <span className="text-primary text-2xl font-bold mb-6 block">{feature.num}</span>
              <h3 className={`font-semibold text-base mb-4 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{feature.title}</h3>
              <p className={`text-sm leading-relaxed transition-colors ${theme === 'dark' ? 'text-zinc-300 group-hover:text-zinc-200' : 'text-zinc-600 group-hover:text-zinc-700'}`}>{feature.desc}</p>
            </div>
          ))}
        </section>

        {/* Agent Memory Teaser */}
        <section className={`py-20 px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className={`max-w-5xl mx-auto rounded-3xl border p-8 md:p-12 ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6 ${theme === 'dark' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                  <Bot className="w-3 h-3" />
                  Human memory. Agent memory. One place.
                </div>
                <h2 className={`text-3xl md:text-4xl font-bold mb-5 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Your AI agents should remember what you already told them.</h2>
                <p className={`text-base md:text-lg leading-relaxed mb-6 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  Voice dump your thoughts into SaveMe, then let trusted agents like Hermes, OpenClaw, Claude, Codex, or Cursor search the same memory before they work. It stays your memory layer, not another scattered chat history.
                </p>
                <Link to={isAuthenticated ? "/settings#connect-agent" : "/signup"} onClick={() => trackActivationEvent(isAuthenticated ? "agent_connect_clicked" : "signup_started", { source: "agent_memory_teaser" })} className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                  Connect an agent
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className={`rounded-2xl border p-5 space-y-4 ${theme === 'dark' ? 'bg-black/30 border-zinc-800/70' : 'bg-white border-zinc-200'}`}>
                {[
                  ['1', 'Speak naturally', 'Brain Dump captures raw thoughts.'],
                  ['2', 'Nova organizes', 'Memories become searchable facts, tasks, and context.'],
                  ['3', 'Agents retrieve', 'Your tools use the same durable context when you allow it.'],
                ].map(([num, title, desc]) => (
                  <div key={num} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">{num}</div>
                    <div>
                      <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>{desc}</p>
                    </div>
                  </div>
                ))}
                <div className={`pt-4 border-t flex items-center gap-2 text-xs ${theme === 'dark' ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`}>
                  <PlugZap className="w-4 h-4 text-primary" />
                  API keys are created per agent with read/write scopes.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className={`py-24 px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-5xl mx-auto text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8 reveal ${theme === 'dark' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
              Pure voice. Zero friction.
            </div>
            <h2 className={`text-3xl md:text-5xl font-bold mb-8 reveal stagger-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>See It in Action</h2>
            <p className={`mb-16 max-w-2xl mx-auto text-lg reveal stagger-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>Watch how SaveMe transforms your voice into organized, searchable knowledge — in seconds</p>
            <div className={`p-3 md:p-4 reveal stagger-3 relative group rounded-3xl overflow-hidden border shadow-2xl ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800/50 shadow-black/30' : 'bg-white border-zinc-200 shadow-zinc-200/60'}`}>
              <div className={`absolute inset-0 pointer-events-none opacity-60 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]' : 'bg-[radial-gradient(circle_at_top,rgba(24,24,27,0.05),transparent_45%)]'}`} />
              <div className={`relative overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-zinc-800/70 bg-black' : 'border-zinc-200 bg-zinc-950'}`}>
                <video
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-auto rounded-2xl bg-black"
                  poster="/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png"
                >
                  <source src={SAVEME_DEMO_VIDEO} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <p className={`relative mt-4 text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                If the video does not load immediately, use the play controls to start the SaveMe.Space demo.
              </p>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className={`py-24 px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-5xl mx-auto">
            <div className={`p-12 md:p-20 relative overflow-hidden rounded-2xl ${theme === 'dark' ? 'bg-zinc-900/30 border border-zinc-800/50' : 'bg-zinc-50 border border-zinc-200'}`}>
              <h2 className={`text-3xl md:text-4xl font-bold mb-16 text-center reveal ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Sound familiar?</h2>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                {[
                  { title: "Scattered Info", desc: "Important stuff spread across notes, emails, texts, and sticky notes" },
                  { title: "Can't Find It", desc: "You know you saved it somewhere... but where?" },
                  { title: "Wrong Device", desc: "The info you need is always on your other phone/laptop" },
                  { title: "No Time to Organize", desc: "Life moves too fast for manual tagging and folder sorting" },
                  { title: "Info Overload", desc: "Too much data, no system to make it actionable" },
                  { title: "Lost Ideas", desc: "That insight from the shower is gone forever" }
                ].map((pain, i) => (
                  <div key={i} className="flex items-start gap-4 group reveal stagger-1" style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                    <div>
                      <span className="text-sm font-semibold text-primary block mb-1">{pain.title}</span>
                      <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-zinc-300 group-hover:text-zinc-200' : 'text-zinc-600 group-hover:text-zinc-700'}`}>{pain.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`text-center mt-20 pt-12 border-t ${theme === 'dark' ? 'border-zinc-800/20' : 'border-zinc-200'}`}>
                <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>If this is you — just start talking</p>
                <Link to={isAuthenticated ? "/brain-dump" : "/signup?next=%2Fbrain-dump"} onClick={() => trackActivationEvent(isAuthenticated ? "brain_dump_start_clicked" : "signup_started", { source: "landing_pain_cta" })} className={`inline-flex px-8 py-3 rounded-lg font-medium transition-all ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>Try Voice Capture Now</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className={`py-24 px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8 reveal ${theme === 'dark' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                Simple Pricing
              </div>
              <h2 className={`text-3xl md:text-5xl font-bold mb-8 reveal stagger-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Choose your plan</h2>
              <p className={`text-sm reveal stagger-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>Start free. Upgrade when you're ready. No lock-in.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, i) => (
                <div key={i} className={`p-8 rounded-2xl relative transition-all group reveal ${plan.popular ? 'border-2 border-primary/40 shadow-lg shadow-primary/10' : 'border'} ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300'}`} style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="px-4 py-1 bg-primary text-white text-xs font-semibold rounded-full">Most Popular</span></div>}
                  <div className="text-center mb-10 pt-4">
                    <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mb-4">
                      <span className="text-5xl font-bold tracking-tight text-primary">{plan.price}</span>
                      <span className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>/{plan.period === "Forever" ? "free" : "mo"}</span>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{plan.description}</p>
                  </div>
                  <ul className={`space-y-4 mb-10 border-t pt-8 ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
                    {plan.features.map((feature, j) => (
                      <li key={j} className={`flex items-center gap-3 text-sm ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-600'}`}>
                        <Check className="w-4 h-4 text-primary shrink-0" />{feature}
                      </li>
                    ))}
                  </ul>
                  <Link to={getPlanHref(plan.name)} onClick={() => trackActivationEvent("subscription_clicked", { source: "landing_pricing", plan: plan.name.toLowerCase() })} className={`block w-full px-6 py-3 rounded-lg font-medium text-center transition-all ${plan.popular ? (theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm hover:shadow-md' : 'bg-zinc-900 text-white hover:bg-zinc-800') : (theme === 'dark' ? 'border border-zinc-600 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800/80' : 'border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50')}`}>
                    {plan.price === "$0" ? "Start Free" : "Get Started"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={`py-24 px-8 border-t text-center ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Ready to <span className="text-primary">offload your brain?</span></h2>
          <p className={`text-lg mb-8 max-w-xl mx-auto ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>Your external memory is one voice command away.</p>
          <Link to="/signup?next=%2Fbrain-dump" onClick={() => trackActivationEvent("signup_started", { source: "landing_final_cta" })} className={`inline-flex items-center gap-2 px-8 py-4 text-lg rounded-lg font-semibold transition-all ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm hover:shadow-md' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
            <Mic className="w-5 h-5" />
            Start Free — No Card Needed
          </Link>
        </section>

        {/* Footer */}
        <footer className={`mt-auto border-t py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-8 text-sm ${theme === 'dark' ? 'border-zinc-800/50 text-zinc-300' : 'border-zinc-200 text-zinc-500'}`}>
          <div>© 2026 SaveMe.Space — Your External Memory</div>
          <div className="flex items-center gap-8">
            <a href="mailto:info@saveme.space" className={`hover:text-primary transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-zinc-200' : ''}`}><Mail className="w-4 h-4" />Contact</a>
            <Link to="/privacy" className={`hover:text-primary transition-colors ${theme === 'dark' ? 'text-zinc-200' : ''}`}>Privacy</Link>
            <Link to="/terms" className={`hover:text-primary transition-colors ${theme === 'dark' ? 'text-zinc-200' : ''}`}>Terms</Link>
          </div>
          <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-zinc-200' : ''}`}><span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>Secure & Encrypted</div>
        </footer>
      </div>

      {activeDemoVideo && <VideoModal open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen} videoUrl={activeDemoVideo.url} title={activeDemoVideo.title} />}
    </div>
  );
};

export default Index;
