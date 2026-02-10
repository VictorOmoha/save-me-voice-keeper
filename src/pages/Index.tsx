import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, Mic, Mail, ArrowRight, Sun, Moon, Keyboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { WaitingListModal } from "@/components/WaitingListModal";
import { VideoModal } from "@/components/VideoModal";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { CanvidVideoPlayer } from "@/components/CanvidVideoPlayer";
import { ConversationalVoiceDemo } from "@/components/landing/ConversationalVoiceDemo";
import { logError } from "@/utils/logger";

const Index = () => {
  const [isComponentReady, setIsComponentReady] = useState(false);
  const { isAuthenticated } = useAuth();
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeDemoVideo, setActiveDemoVideo] = useState<{ url: string; title: string } | null>(null);
  const [activeCanvidVideo, setActiveCanvidVideo] = useState<{ url: string; title: string } | null>(null);

  const theme = globalTheme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : globalTheme;

  const toggleTheme = () => setGlobalTheme(theme === 'dark' ? 'light' : 'dark');

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
      } catch (error) { logError('Error fetching videos:', error); }
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
          <div className="scan-line"></div>
          <p className="font-mono text-zinc-500 text-sm tracking-[0.2em] uppercase">LOADING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden transition-colors ${theme} ${theme === 'dark' ? 'bg-zinc-950 text-zinc-300 selection:bg-accent/30 selection:text-white' : 'bg-white text-zinc-700 selection:bg-blue-200'}`}>
      <div className="grid-blueprint" />

      <div className={`max-w-[1400px] mx-auto px-4 md:px-8 min-h-screen flex flex-col ${theme === 'dark' ? 'border-l border-r border-zinc-800/50' : 'border-l border-r border-zinc-200'}`}>
        {/* Navigation */}
        <nav className={`grid grid-cols-2 md:grid-cols-3 items-center h-20 uppercase font-mono text-[10px] tracking-[0.2em] ${theme === 'dark' ? 'border-b border-zinc-800/50' : 'border-b border-zinc-200'}`}>
          <div className="flex items-center gap-3">
            <img src="/saveme-logo.svg" alt="SAVEME.SPACE" className="w-8 h-8 object-contain" />
            <span className={`font-bold text-sm tracking-widest hidden sm:inline ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>SAVEME.SPACE</span>
          </div>
          <div className={`hidden md:flex justify-center ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>[ THE VOICE-NATIVE VAULT ]</div>
          <div className={`flex items-center justify-end gap-6 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>
            <div className="hidden lg:flex items-center"><span className="status-dot"></span>ONLINE</div>
            <button onClick={toggleTheme} className={`p-2 rounded transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'}`} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-galvanized btn-galvanized-primary px-4 py-2 text-[10px]">DASHBOARD</Link>
            ) : (
              <Link to="/login" className="btn-galvanized btn-galvanized-secondary px-4 py-2 text-[10px]">SIGN IN</Link>
            )}
          </div>
        </nav>

        {/* VOICE-FIRST HERO */}
        <section className="py-16 md:py-24 lg:py-32 flex flex-col items-center justify-center text-center">
          <div className={`protocol-tag reveal mb-6 ${theme === 'dark' ? '' : 'border-zinc-300 text-zinc-600'}`}>THE VOICE-NATIVE KNOWLEDGE APP</div>
          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 reveal stagger-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            STOP TYPING.<br /><span className="text-primary">START TALKING.</span>
          </h1>
          <p className={`text-lg md:text-xl max-w-xl mb-12 reveal stagger-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Just speak. We organize, categorize, and remember — so you don't have to.
          </p>
          <div className="w-full max-w-lg mb-8 reveal stagger-3">
            <ConversationalVoiceDemo onSignupClick={() => setIsWaitingListModalOpen(true)} theme={theme} />
          </div>
          <p className={`text-xs font-mono tracking-wider reveal stagger-4 ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>NO SIGNUP REQUIRED TO TRY • YOUR VOICE STAYS PRIVATE</p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 reveal stagger-4">
            <button className="btn-galvanized btn-galvanized-secondary" onClick={() => setIsVideoModalOpen(true)} disabled={!activeDemoVideo}>
              {activeDemoVideo ? "WATCH DEMO" : "DEMO COMING SOON"}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-galvanized btn-galvanized-primary"><span>GO TO DASHBOARD</span><ArrowRight className="w-4 h-4" /></Link>
            ) : (
              <button className="btn-galvanized btn-galvanized-primary" onClick={() => setIsWaitingListModalOpen(true)}><span>GET EARLY ACCESS</span><ArrowRight className="w-4 h-4" /></button>
            )}
          </div>
        </section>

        {/* Voice vs Typing Comparison */}
        <section className={`py-16 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className={`p-8 rounded-2xl ${theme === 'dark' ? 'bg-zinc-900/30 border border-zinc-800/50' : 'bg-zinc-50 border border-zinc-200'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                    <Keyboard className={`w-5 h-5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  </div>
                  <div>
                    <p className={`font-mono text-xs tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>THE OLD WAY</p>
                    <p className={`font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Typing Notes</p>
                  </div>
                </div>
                <ul className={`space-y-3 text-sm ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  <li className="flex items-start gap-2"><span className="text-red-400">✗</span>Open app, find the right folder</li>
                  <li className="flex items-start gap-2"><span className="text-red-400">✗</span>Type everything out manually</li>
                  <li className="flex items-start gap-2"><span className="text-red-400">✗</span>Decide on tags and categories</li>
                  <li className="flex items-start gap-2"><span className="text-red-400">✗</span>Hope you can find it later</li>
                </ul>
                <p className={`mt-6 font-mono text-xs ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>⏱ ~2-3 minutes per note</p>
              </div>
              <div className={`p-8 rounded-2xl border-2 border-primary/30 ${theme === 'dark' ? 'bg-primary/5' : 'bg-primary/5'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><Mic className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-mono text-xs tracking-wider text-primary">THE SAVEME WAY</p>
                    <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Voice-First</p>
                  </div>
                </div>
                <ul className={`space-y-3 text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  <li className="flex items-start gap-2"><span className="text-primary">✓</span>Just speak naturally</li>
                  <li className="flex items-start gap-2"><span className="text-primary">✓</span>AI auto-categorizes instantly</li>
                  <li className="flex items-start gap-2"><span className="text-primary">✓</span>Action items detected automatically</li>
                  <li className="flex items-start gap-2"><span className="text-primary">✓</span>Smart search finds anything</li>
                </ul>
                <p className="mt-6 font-mono text-xs text-primary">⏱ ~10 seconds per note</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          {[
            { num: "01/", title: "VOICE CAPTURE", desc: "Just speak naturally. Capture notes, ideas, contacts, and reminders without typing a single word." },
            { num: "02/", title: "AI ORGANIZATION", desc: "Your data is automatically sorted into categories. No folders to manage, no tags to remember." },
            { num: "03/", title: "INSTANT SEARCH", desc: "Find anything in seconds. Search by keyword, category, or just describe what you're looking for." },
            { num: "04/", title: "YOUR DATA, PRIVATE", desc: "End-to-end encryption. Your information stays yours. We never sell or share your data." }
          ].map((feature, i) => (
            <div key={i} className={`p-10 border-b md:border-b-0 md:border-r last:border-r-0 transition-colors group reveal ${theme === 'dark' ? 'border-zinc-800/50 hover:bg-zinc-900/40' : 'border-zinc-200 hover:bg-zinc-50'}`} style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
              <span className="font-mono text-accent text-xs mb-6 block tracking-widest">{feature.num}</span>
              <h3 className={`font-bold text-sm tracking-wider mb-4 uppercase ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{feature.title}</h3>
              <p className={`text-xs leading-relaxed transition-colors ${theme === 'dark' ? 'text-zinc-500 group-hover:text-zinc-400' : 'text-zinc-600 group-hover:text-zinc-700'}`}>{feature.desc}</p>
            </div>
          ))}
        </section>

        {/* Demo Section */}
        <section className={`py-24 px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-5xl mx-auto text-center">
            <div className={`protocol-tag justify-center mb-8 reveal ${theme === 'dark' ? '' : 'border-zinc-300 text-zinc-600'}`}>SEE IT IN ACTION</div>
            <h2 className={`archive-title text-3xl md:text-5xl mb-8 reveal stagger-1 opacity-90 ${theme === 'dark' ? '' : 'text-zinc-900'}`}>PURE VOICE. ZERO FRICTION.</h2>
            <p className={`mb-16 max-w-2xl mx-auto text-lg reveal stagger-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>Watch how SaveMe transforms your voice into organized, searchable knowledge — in seconds</p>
            <div className="galvanized-card p-2 reveal stagger-3 relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>
              {activeCanvidVideo ? (
                <video src={activeCanvidVideo.url} autoPlay loop muted playsInline className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity" poster="/saveme-logo.svg" />
              ) : (
                <CanvidVideoPlayer canvidUrl="https://app.canvid.com/" title="Interactive Demo" loading={false} />
              )}
              <div className="scan-line opacity-20 pointer-events-none"></div>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className={`py-24 px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="galvanized-card p-12 md:p-20 relative overflow-hidden">
              <h2 className={`archive-title text-2xl md:text-4xl mb-16 text-center reveal ${theme === 'dark' ? '' : 'text-zinc-900'}`}>SOUND FAMILIAR?</h2>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                {[
                  { title: "SCATTERED INFO", desc: "Important stuff spread across notes, emails, texts, and sticky notes" },
                  { title: "CAN'T FIND IT", desc: "You know you saved it somewhere... but where?" },
                  { title: "WRONG DEVICE", desc: "The info you need is always on your other phone/laptop" },
                  { title: "NO TIME TO ORGANIZE", desc: "Life's too busy to maintain complex systems" },
                  { title: "INFO OVERLOAD", desc: "Drowning in data with no way to make sense of it" },
                  { title: "FORGOT AGAIN", desc: "Important details slipping through the cracks" }
                ].map((pain, i) => (
                  <div key={i} className="flex items-start gap-4 group reveal stagger-1" style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
                    <div className="status-dot mt-2 shrink-0"></div>
                    <div>
                      <span className="font-mono text-[10px] text-accent font-bold uppercase tracking-widest block mb-1">{pain.title}:</span>
                      <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-zinc-500 group-hover:text-zinc-400' : 'text-zinc-600 group-hover:text-zinc-700'}`}>{pain.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`text-center mt-20 pt-12 border-t ${theme === 'dark' ? 'border-zinc-800/20' : 'border-zinc-200'}`}>
                <p className={`font-mono text-xs mb-8 uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>IF THIS IS YOU → JUST START TALKING</p>
                <button className="btn-galvanized btn-galvanized-primary px-10" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>TRY VOICE CAPTURE NOW</button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className={`py-24 px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className={`protocol-tag justify-center mb-8 reveal ${theme === 'dark' ? '' : 'border-zinc-300 text-zinc-600'}`}>SIMPLE PRICING</div>
              <h2 className={`archive-title text-3xl md:text-5xl mb-8 reveal stagger-1 ${theme === 'dark' ? '' : 'text-zinc-900'}`}>CHOOSE YOUR PLAN</h2>
              <p className={`font-mono text-[10px] tracking-[0.3em] uppercase reveal stagger-2 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>START FREE • UPGRADE ANYTIME • CANCEL ANYTIME</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, i) => (
                <div key={i} className={`category-card-skeletal group reveal ${plan.popular ? 'border-accent/40 bg-zinc-900/30 glow-accent' : ''}`} style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="badge-skeletal bg-accent text-zinc-950 font-bold border-accent px-4">MOST POPULAR</span></div>}
                  <div className="text-center mb-10 pt-4">
                    <h3 className={`font-mono text-sm font-bold mb-4 tracking-widest ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mb-4">
                      <span className="text-5xl font-bold tracking-tighter" style={{ color: 'hsl(199, 89%, 48%)' }}>{plan.price}</span>
                      <span className={`font-mono text-[10px] uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>/{plan.period === "Forever" ? "free" : "mo"}</span>
                    </div>
                    <p className={`text-xs font-mono uppercase tracking-[0.1em] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>{plan.description}</p>
                  </div>
                  <ul className={`space-y-4 mb-10 border-t pt-8 ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
                    {plan.features.map((feature, j) => (
                      <li key={j} className={`flex items-center gap-3 text-[11px] font-mono tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        <Check className="w-3.5 h-3.5 text-accent shrink-0" />{feature}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full btn-galvanized ${plan.popular ? 'btn-galvanized-primary' : 'btn-galvanized-secondary'}`} onClick={() => setIsWaitingListModalOpen(true)}>
                    {plan.price === "$0" ? "START FREE" : "GET STARTED"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={`py-24 px-8 border-t text-center ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Ready to <span className="text-primary">stop typing</span>?</h2>
          <p className={`text-lg mb-8 max-w-xl mx-auto ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>Join thousands who've switched to voice-first knowledge management.</p>
          <button className="btn-galvanized btn-galvanized-primary text-lg px-12 py-4" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Mic className="w-5 h-5 mr-2" />TRY IT NOW — FREE
          </button>
        </section>

        {/* Footer */}
        <footer className={`mt-auto border-t py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-8 font-mono text-[10px] tracking-[0.2em] ${theme === 'dark' ? 'border-zinc-800/50 text-zinc-600' : 'border-zinc-200 text-zinc-500'}`}>
          <div className="uppercase">© 2024 SAVEME.SPACE — THE VOICE-NATIVE VAULT</div>
          <div className="flex items-center gap-8 uppercase">
            <a href="mailto:info@saveme.space" className="hover:text-accent transition-colors flex items-center gap-2"><Mail className="w-3 h-3" />CONTACT</a>
            <Link to="/privacy" className="hover:text-accent transition-colors">PRIVACY</Link>
            <Link to="/terms" className="hover:text-accent transition-colors">TERMS</Link>
          </div>
          <div className="flex items-center gap-2"><span className="status-dot w-1.5 h-1.5 opacity-50"></span>SECURE & ENCRYPTED</div>
        </footer>
      </div>

      <WaitingListModal open={isWaitingListModalOpen} onOpenChange={setIsWaitingListModalOpen} />
      {activeDemoVideo && <VideoModal open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen} videoUrl={activeDemoVideo.url} title={activeDemoVideo.title} />}
    </div>
  );
};

export default Index;
