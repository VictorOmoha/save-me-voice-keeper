import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, Mic, Mail, ArrowRight, Sun, Moon, Keyboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { WaitingListModal } from "@/components/WaitingListModal";
import { VideoModal } from "@/components/VideoModal";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { CanvidVideoPlayer } from "@/components/CanvidVideoPlayer";
import { ConversationalVoiceDemo } from "@/components/landing/ConversationalVoiceDemo";

const Index = () => {
  const [isComponentReady, setIsComponentReady] = useState(false);
  const { isAuthenticated } = useAuth();
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeDemoVideo, setActiveDemoVideo] = useState<{ url: string; title: string } | null>(null);
  const [activeCanvidVideo, setActiveCanvidVideo] = useState<{ url: string; title: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

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
            <span className={`font-semibold hidden sm:inline ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>SaveMe.Space</span>
          </div>
          <div className={`hidden md:flex justify-center text-xs ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-500'}`}>Voice-First Knowledge</div>
          <div className={`flex items-center justify-end gap-4 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
            <button onClick={toggleTheme} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'}`} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className={`px-5 py-2.5 rounded-lg font-medium transition-all ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>Dashboard</Link>
            ) : (
              <Link to="/login" className={`px-5 py-2.5 rounded-lg font-medium transition-all ${theme === 'dark' ? 'border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800' : 'border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'}`}>Sign In</Link>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-16 md:py-24 lg:py-32 flex flex-col items-center justify-center text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8 reveal ${theme === 'dark' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
            <Mic className="w-3 h-3" />
            The Voice-Native Knowledge App
          </div>
          <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 reveal stagger-1 leading-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
            Stop typing.<br />
            <span className="text-primary">Start talking.</span>
          </h1>
          <p className={`text-lg md:text-xl max-w-3xl mb-12 reveal stagger-2 leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
            SaveMe.Space helps you capture ideas, thoughts, and voice notes instantly — then organize and retrieve them whenever you need them.
          </p>
          <div className="w-full max-w-lg mb-8 reveal stagger-3">
            <ConversationalVoiceDemo onSignupClick={() => setIsWaitingListModalOpen(true)} theme={theme} />
          </div>
          <p className={`text-xs mb-8 reveal stagger-4 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-500'}`}>No signup required to try • Your voice stays private</p>
          <div className="flex flex-wrap items-center justify-center gap-4 reveal stagger-4">
            <button 
              className={`px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2 ${theme === 'dark' ? 'border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800' : 'border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'}`}
              onClick={() => setIsVideoModalOpen(true)} 
              disabled={!activeDemoVideo}
            >
              {activeDemoVideo ? "Watch Demo" : "Demo Coming Soon"}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className={`px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2 ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}>
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button className={`px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2 ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`} onClick={() => setIsWaitingListModalOpen(true)}>
                Join the Beta
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className={`py-20 px-4 md:px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6 reveal ${theme === 'dark' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                How It Works
              </div>
              <h2 className={`text-3xl md:text-5xl font-bold mb-6 reveal stagger-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>From quick thought to clear retrieval</h2>
              <p className={`text-base md:text-lg max-w-3xl mx-auto reveal stagger-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                Capture instantly, keep what matters, and come back to your ideas without digging through notes apps, tabs, or old voice memos.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  num: "01",
                  title: "Speak naturally",
                  desc: "Capture ideas, reminders, reflections, and voice notes in seconds — exactly when they arrive."
                },
                {
                  num: "02",
                  title: "Save what matters",
                  desc: "Turn scattered thoughts into organized knowledge you can keep instead of losing them across tools."
                },
                {
                  num: "03",
                  title: "Find it later",
                  desc: "Retrieve what you said whenever you need it, with search and structure that keeps your thinking usable."
                }
              ].map((step, i) => (
                <div key={i} className={`p-8 rounded-2xl border reveal ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'} transition-all`} style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                  <span className="text-primary text-2xl font-bold mb-6 block">{step.num}</span>
                  <h3 className={`font-semibold text-lg mb-3 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>{step.title}</h3>
                  <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visual Proof */}
        <section className={`py-20 px-4 md:px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6 reveal ${theme === 'dark' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                Visual Proof
              </div>
              <h2 className={`text-3xl md:text-5xl font-bold mb-6 reveal stagger-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>See the product, not just the promise</h2>
              <p className={`text-base md:text-lg max-w-3xl mx-auto reveal stagger-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                SaveMe.Space gives you a clean home for voice capture, organized entries, and quick retrieval — built to feel calm, fast, and usable.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div className={`rounded-3xl overflow-hidden border reveal ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200'}`}>
                <img src="/lovable-uploads/a98a0b41-8946-445c-97c4-379ad69e55bd.png" alt="SaveMe.Space dashboard in dark mode" className="w-full h-auto object-cover" />
                <div className="p-6">
                  <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Your knowledge, organized at a glance</h3>
                  <p className={`${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'} text-sm leading-relaxed`}>
                    Get a clear view of your entries, categories, storage, and recent activity without digging through clutter.
                  </p>
                </div>
              </div>

              <div className="grid gap-8">
                <div className={`rounded-3xl overflow-hidden border reveal ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200'}`}>
                  <img src="/lovable-uploads/bc240c60-e282-4d87-8e60-f2af2366f886.png" alt="SaveMe.Space dashboard in light mode" className="w-full h-auto object-cover" />
                  <div className="p-6">
                    <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Built to feel clean in every mode</h3>
                    <p className={`${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'} text-sm leading-relaxed`}>
                      Whether you prefer dark mode or light mode, the experience stays polished, focused, and easy to navigate.
                    </p>
                  </div>
                </div>

                <div className={`p-8 rounded-3xl border reveal ${theme === 'dark' ? 'bg-primary/5 border-primary/20' : 'bg-primary/5 border-primary/20'}`}>
                  <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>What happens after you speak?</h3>
                  <p className={`${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'} text-sm md:text-base leading-relaxed`}>
                    SaveMe.Space turns voice into something you can actually use later: captured thoughts, organized entries, searchable knowledge, and a dashboard that helps you return to what matters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Voice vs Typing Comparison */}
        <section className={`py-16 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className={`p-8 rounded-2xl ${theme === 'dark' ? 'bg-zinc-900/30 border border-zinc-800/50' : 'bg-zinc-50 border border-zinc-200'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                    <Keyboard className={`w-6 h-6 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>The Old Way</p>
                    <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Typing Notes</p>
                  </div>
                </div>
                <ul className={`space-y-3 text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  <li className="flex items-start gap-2"><span className="text-red-400 text-lg">✗</span>Open app, find the right folder</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 text-lg">✗</span>Type everything out manually</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 text-lg">✗</span>Decide on tags and categories</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 text-lg">✗</span>Hope you can find it later</li>
                </ul>
                <p className={`mt-6 text-xs font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-500'}`}>⏱ ~2-3 minutes per note</p>
              </div>
              <div className={`p-8 rounded-2xl border-2 ${theme === 'dark' ? 'border-primary/30 bg-primary/5' : 'border-primary/30 bg-primary/5'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center"><Mic className="w-6 h-6 text-primary" /></div>
                  <div>
                    <p className="text-xs font-medium text-primary">The SaveMe Way</p>
                    <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Voice-First</p>
                  </div>
                </div>
                <ul className={`space-y-3 text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  <li className="flex items-start gap-2"><span className="text-primary text-lg font-bold">✓</span>Just speak naturally</li>
                  <li className="flex items-start gap-2"><span className="text-primary text-lg font-bold">✓</span>AI auto-categorizes instantly</li>
                  <li className="flex items-start gap-2"><span className="text-primary text-lg font-bold">✓</span>Action items detected automatically</li>
                  <li className="flex items-start gap-2"><span className="text-primary text-lg font-bold">✓</span>Smart search finds anything</li>
                </ul>
                <p className="mt-6 text-xs font-medium text-primary">⏱ ~10 seconds per note</p>
              </div>
            </div>
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
              <p className={`text-sm leading-relaxed transition-colors ${theme === 'dark' ? 'text-zinc-500 group-hover:text-zinc-400' : 'text-zinc-600 group-hover:text-zinc-700'}`}>{feature.desc}</p>
            </div>
          ))}
        </section>

        {/* Demo Section */}
        <section className={`py-24 px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-5xl mx-auto text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8 reveal ${theme === 'dark' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
              See It in Action
            </div>
            <h2 className={`text-3xl md:text-5xl font-bold mb-8 reveal stagger-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>See what it feels like to think out loud</h2>
            <p className={`mb-16 max-w-3xl mx-auto text-lg reveal stagger-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>From quick voice capture to organized retrieval, SaveMe.Space helps you move from scattered thoughts to usable clarity.</p>
            <div className={`p-2 reveal stagger-3 relative group rounded-2xl overflow-hidden border ${theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-zinc-50 border-zinc-200'}`}>
              {activeCanvidVideo ? (
                <video src={activeCanvidVideo.url} autoPlay loop muted playsInline className="w-full h-auto rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" poster="/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png" />
              ) : (
                <CanvidVideoPlayer canvidUrl="https://app.canvid.com/" title="Interactive Demo" loading={false} />
              )}
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className={`py-24 px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-5xl mx-auto">
            <div className={`p-12 md:p-20 relative overflow-hidden rounded-2xl ${theme === 'dark' ? 'bg-zinc-900/30 border border-zinc-800/50' : 'bg-zinc-50 border border-zinc-200'}`}>
              <h2 className={`text-3xl md:text-4xl font-bold mb-6 text-center reveal ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Your thoughts deserve a better home</h2>
              <p className={`text-center max-w-3xl mx-auto mb-16 reveal stagger-1 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>Too many good ideas disappear into notes apps, screenshots, open tabs, and voice memos. SaveMe.Space gives you one private place to capture what matters and come back to it with clarity.</p>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                {[
                  { title: "Scattered Info", desc: "Important stuff spread across notes, emails, texts, and sticky notes" },
                  { title: "Can't Find It", desc: "You know you saved it somewhere... but where?" },
                  { title: "Wrong Device", desc: "The info you need is always on your other phone/laptop" },
                  { title: "No Time to Organize", desc: "Life's too busy to maintain complex systems" },
                  { title: "Info Overload", desc: "Drowning in data with no way to make sense of it" },
                  { title: "Forgot Again", desc: "Important details slipping through the cracks" }
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
                <p className={`text-sm mb-8 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>If this is you → just start talking</p>
                <button className={`px-8 py-3 rounded-lg font-medium transition-all ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Try Voice Capture Now</button>
              </div>
            </div>
          </div>
        </section>

        {/* Beta Invitation */}
        {!isAuthenticated && (
          <section className={`py-24 px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
            <div className="max-w-5xl mx-auto">
              <div className={`p-12 md:p-16 rounded-3xl border text-center ${theme === 'dark' ? 'bg-primary/5 border-primary/20' : 'bg-primary/5 border-primary/20'}`}>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-6 ${theme === 'dark' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                  Beta Access
                </div>
                <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Join the SaveMe.Space beta</h2>
                <p className={`text-base md:text-lg max-w-3xl mx-auto mb-8 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  I’m inviting a small group of early users to test SaveMe.Space in real life — especially people who constantly capture ideas, notes, and voice thoughts.
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-left max-w-4xl mx-auto mb-10">
                  {[
                    'Use SaveMe.Space over a few real days',
                    'Capture thoughts naturally as they come',
                    'Share honest feedback on what works and what feels confusing'
                  ].map((item, i) => (
                    <div key={i} className={`rounded-2xl p-5 border ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/50 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600'}`}>
                      <div className="flex items-start gap-3 text-sm leading-relaxed">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button className={`px-8 py-4 rounded-lg font-medium transition-all inline-flex items-center gap-2 ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`} onClick={() => setIsWaitingListModalOpen(true)}>
                    Join the Beta
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button className={`px-8 py-4 rounded-lg font-medium transition-all ${theme === 'dark' ? 'border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-200' : 'border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-700'}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Try Voice Capture First
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Pricing */}
        <section className={`py-24 px-8 border-t ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8 reveal ${theme === 'dark' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                Simple Pricing
              </div>
              <h2 className={`text-3xl md:text-5xl font-bold mb-8 reveal stagger-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Choose your plan</h2>
              <p className={`text-sm reveal stagger-2 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>Start free • Upgrade anytime • Cancel anytime</p>
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
                      <li key={j} className={`flex items-center gap-3 text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        <Check className="w-4 h-4 text-primary shrink-0" />{feature}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${plan.popular ? (theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800') : (theme === 'dark' ? 'border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800' : 'border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50')}`} onClick={() => setIsWaitingListModalOpen(true)}>
                    {plan.price === "$0" ? "Join Free Beta" : "Get Started"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={`py-24 px-8 border-t text-center ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
          <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Ready to <span className="text-primary">stop losing good ideas</span>?</h2>
          <p className={`text-lg mb-8 max-w-2xl mx-auto ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>Start capturing your thoughts in real time, keep what matters in one place, and come back to it whenever you need it.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button className={`inline-flex items-center gap-2 px-8 py-4 text-lg rounded-lg font-medium transition-all ${theme === 'dark' ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Mic className="w-5 h-5" />
              Try Voice Capture Now
            </button>
            {!isAuthenticated && (
              <button className={`inline-flex items-center gap-2 px-8 py-4 text-lg rounded-lg font-medium transition-all ${theme === 'dark' ? 'border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800' : 'border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'}`} onClick={() => setIsWaitingListModalOpen(true)}>
                Join the Beta
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className={`mt-auto border-t py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-8 text-sm ${theme === 'dark' ? 'border-zinc-800/50 text-zinc-300' : 'border-zinc-200 text-zinc-500'}`}>
          <div>© 2026 SaveMe.Space — The Voice-Native Vault</div>
          <div className="flex items-center gap-8">
            <a href="mailto:info@saveme.space" className="hover:text-primary transition-colors flex items-center gap-2"><Mail className="w-4 h-4" />Contact</a>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          </div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>Secure & Encrypted</div>
        </footer>
      </div>

      <WaitingListModal open={isWaitingListModalOpen} onOpenChange={setIsWaitingListModalOpen} />
      {activeDemoVideo && <VideoModal open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen} videoUrl={activeDemoVideo.url} title={activeDemoVideo.title} />}
    </div>
  );
};

export default Index;
