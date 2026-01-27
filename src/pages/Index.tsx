
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, Mic, RefreshCcw, Zap, Users, Briefcase, User, Brain, Mail, ArrowRight, ImageIcon, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { WaitingListModal } from "@/components/WaitingListModal";
import { VideoModal } from "@/components/VideoModal";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { CanvidVideoPlayer } from "@/components/CanvidVideoPlayer";

const Index = () => {
  const [isComponentReady, setIsComponentReady] = useState(false);
  const { isAuthenticated } = useAuth();
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeDemoVideo, setActiveDemoVideo] = useState<{ url: string; title: string } | null>(null);
  const [activeCanvidVideo, setActiveCanvidVideo] = useState<{ url: string; title: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const heroVisualRef = useRef<HTMLDivElement>(null);
  const skeletonRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    setIsComponentReady(true);
  }, []);

  useEffect(() => {
    const fetchActiveVideos = async () => {
      try {
        const videosRef = collection(db, 'public_demo_videos');
        const querySnapshot = await getDocs(videosRef);

        querySnapshot.forEach((docSnap) => {
          const video = docSnap.data();
          if (video.video_type === 'demo') {
            setActiveDemoVideo({ url: video.video_url, title: video.title });
          } else if (video.video_type === 'canvid_replacement') {
            setActiveCanvidVideo({ url: video.video_url, title: video.title });
          }
        });
      } catch (error) {
        console.error('Error fetching active videos:', error);
      }
    };

    fetchActiveVideos();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroVisualRef.current || !skeletonRef.current) return;

    const rect = heroVisualRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = (y - rect.height / 2) / 20;
    const rotateY = (x - rect.width / 2) / -20;

    skeletonRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (skeletonRef.current) {
      skeletonRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    }
  };

  const plains = [
    {
      name: "FREE",
      price: "$0",
      period: "Forever",
      description: "Perfect for getting started",
      features: [
        "Up to 50 entries",
        "Basic search",
        "Web access only",
        "Standard support"
      ],
      popular: false
    },
    {
      name: "BASIC",
      price: "$9",
      period: "per month",
      description: "For personal power users",
      features: [
        "Unlimited entries",
        "Advanced search & filters",
        "All platforms",
        "Voice input & commands",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "PREMIUM",
      price: "$19",
      period: "per month",
      description: "For teams and professionals",
      features: [
        "Everything in Basic",
        "Data export & backup",
        "Advanced encryption",
        "API access",
        "Custom integrations",
        "24/7 support"
      ],
      popular: false
    }
  ];

  if (!isComponentReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center relative">
          <div className="scan-line"></div>
          <p className="font-mono text-zinc-500 text-sm tracking-[0.2em] uppercase">INITIALIZING_ARCHIVE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans overflow-x-hidden transition-colors ${theme} ${
      theme === 'dark'
        ? 'bg-zinc-950 text-zinc-300 selection:bg-accent/30 selection:text-white'
        : 'bg-white text-zinc-700 selection:bg-blue-200'
    }`}>
      {/* Grid Blueprint Background */}
      <div className="grid-blueprint" />

      <div className={`max-w-[1400px] mx-auto px-4 md:px-8 min-h-screen flex flex-col ${
        theme === 'dark' ? 'border-l border-r border-zinc-800/50' : 'border-l border-r border-zinc-200'
      }`}>
        {/* Navigation: Modular Unit */}
        <nav className={`grid grid-cols-2 md:grid-cols-3 items-center h-20 uppercase font-mono text-[10px] tracking-[0.2em] ${
          theme === 'dark' ? 'border-b border-zinc-800/50' : 'border-b border-zinc-200'
        }`}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="SAVEME.SPACE" className="w-8 h-8 object-contain" />
            <span className={`font-bold text-sm tracking-widest hidden sm:inline ${
              theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
            }`}>SAVEME.SPACE</span>
          </div>

          <div className={`hidden md:flex justify-center ${
            theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
          }`}>
            [ ARCHIVE_VERSION_2.0 ]
          </div>

          <div className={`flex items-center justify-end gap-6 ${
            theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'
          }`}>
            <div className="hidden lg:flex items-center">
              <span className="status-dot"></span>
              SYSTEM: OPTIMAL
            </div>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-galvanized btn-galvanized-primary px-4 py-2 text-[10px]">
                DASHBOARD
              </Link>
            ) : (
              <button
                onClick={() => setIsWaitingListModalOpen(true)}
                className="btn-galvanized btn-galvanized-primary px-4 py-2 text-[10px]"
              >
                JOIN ARCHIVE
              </button>
            )}
          </div>
        </nav>

        {/* Hero: Modular Skeleton */}
        <section className="grid lg:grid-cols-2 flex-grow">
          <div className={`p-8 md:p-16 lg:p-24 border-b lg:border-b-0 lg:border-r flex flex-col justify-center ${
            theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'
          }`}>
            <div className={`protocol-tag reveal stagger-1 mb-8 ${
              theme === 'dark' ? '' : 'border-zinc-300 text-zinc-600'
            }`}>
              PROTOCOL: DATA_PRESERVATION
            </div>

            <h1 className={`archive-title reveal stagger-2 mb-8 leading-[0.85] ${
              theme === 'dark' ? '' : 'text-zinc-900'
            }`}>
              EXPORT<br />THE VOID
            </h1>

            <p className={`text-lg md:text-xl mb-12 max-w-lg leading-relaxed reveal stagger-3 ${
              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              A galvanized framework for personal information management.
              Voice-powered. AI-organized. Securely archived across all your devices.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 reveal stagger-4">
              <button
                className="btn-galvanized btn-galvanized-primary"
                onClick={() => isAuthenticated ? window.location.href = '/dashboard' : setIsWaitingListModalOpen(true)}
              >
                <span>INITIATE ARCHIVE</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                className="btn-galvanized btn-galvanized-secondary"
                onClick={() => setIsVideoModalOpen(true)}
                disabled={!activeDemoVideo}
              >
                {activeDemoVideo ? "VIEW_DEMO" : "DEMO_PENDING"}
              </button>
            </div>
          </div>

          {/* Right Visual: Data Skeleton */}
          <div
            className="p-12 md:p-24 flex items-center justify-center relative bg-radial-accent overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={heroVisualRef}
            style={{
              background: 'radial-gradient(circle at 70% 30%, hsla(199, 89%, 48%, 0.05) 0%, transparent 50%)'
            }}
          >
            <div
              ref={skeletonRef}
              className="data-skeleton w-full max-w-md aspect-square reveal stagger-3 transition-transform duration-200 ease-out"
            >
              <div className="scan-line"></div>
              <div className="skeleton-cell" data-id="0x001">ARCHIVING_VOICE...</div>
              <div className="skeleton-cell" data-id="0x002"></div>
              <div className="skeleton-cell" data-id="0x003" style={{ color: 'hsl(var(--primary))' }}>[ENTRY_DETECTED]</div>
              <div className="skeleton-cell" data-id="0x004"></div>
              <div className="skeleton-cell" data-id="0x005">
                <div className="w-full h-px bg-zinc-800 mt-4"></div>
                <div className="w-3/5 h-px bg-zinc-800 mt-2"></div>
              </div>
              <div className="skeleton-cell" data-id="0x006"></div>
              <div className="skeleton-cell" data-id="0x007">SYNC_NODE_ACTIVE</div>
              <div className="skeleton-cell" data-id="0x008"></div>
              <div className="skeleton-cell" data-id="0x009">01101101</div>
            </div>
          </div>
        </section>

        {/* Features: Galvanized Grid */}
        <section className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t ${
          theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'
        }`}>
          {[
            { num: "01/", title: "VOICE EXTRACTION", desc: "Capture data using natural voice commands. Hands-free archiving through our modular voice API." },
            { num: "02/", title: "SCHEMA MAPPING", desc: "Data is organized into clean structures, ready for retrieval. AI-powered categorization." },
            { num: "03/", title: "SKELETAL SEARCH", desc: "Lightning fast indexing. Find any archived data in milliseconds using our galvanized search engine." },
            { num: "04/", title: "ZERO RETENTION", desc: "Your data remains your property. End-to-end encryption. We preserve, never store." }
          ].map((feature, i) => (
            <div
              key={i}
              className={`p-10 border-b md:border-b-0 md:border-r last:border-r-0 transition-colors group reveal ${
                theme === 'dark'
                  ? 'border-zinc-800/50 hover:bg-zinc-900/40'
                  : 'border-zinc-200 hover:bg-zinc-50'
              }`}
              style={{ animationDelay: `${0.5 + i * 0.1}s` }}
            >
              <span className="font-mono text-accent text-xs mb-6 block tracking-widest">{feature.num}</span>
              <h3 className={`font-bold text-sm tracking-wider mb-4 uppercase ${
                theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
              }`}>{feature.title}</h3>
              <p className={`text-xs leading-relaxed transition-colors ${
                theme === 'dark'
                  ? 'text-zinc-500 group-hover:text-zinc-400'
                  : 'text-zinc-600 group-hover:text-zinc-700'
              }`}>{feature.desc}</p>
            </div>
          ))}
        </section>

        {/* Visual Demo Section */}
        <section className={`py-24 px-8 border-t ${
          theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'
        }`}>
          <div className="max-w-5xl mx-auto text-center">
            <div className={`protocol-tag justify-center mb-8 reveal ${
              theme === 'dark' ? '' : 'border-zinc-300 text-zinc-600'
            }`}>VISUAL_DEMO</div>
            <h2 className={`archive-title text-3xl md:text-5xl mb-8 reveal stagger-1 opacity-90 ${
              theme === 'dark' ? '' : 'text-zinc-900'
            }`}>
              ARCHIVE IN ACTION
            </h2>
            <p className={`mb-16 max-w-2xl mx-auto text-lg reveal stagger-2 ${
              theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              Watch how SaveMe transforms the way you capture, organize, and retrieve your important information
            </p>

            <div className="galvanized-card p-2 reveal stagger-3 relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>
              {activeCanvidVideo ? (
                <video
                  src={activeCanvidVideo.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity"
                  poster="/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png"
                />
              ) : (
                <CanvidVideoPlayer
                  canvidUrl="https://app.canvid.com/"
                  title="Interactive Demo"
                  loading={false}
                />
              )}
              <div className="scan-line opacity-20 pointer-events-none"></div>
            </div>
          </div>
        </section>

        {/* Pain Points: familiar_errors */}
        <section className={`py-24 px-8 border-t ${
          theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'
        }`}>
          <div className="max-w-5xl mx-auto">
            <div className="galvanized-card p-12 md:p-20 relative overflow-hidden">
              <div className={`absolute top-0 right-0 p-4 font-mono text-[10px] select-none ${
                theme === 'dark' ? 'text-zinc-800' : 'text-zinc-300'
              }`}>ERROR_LOG_V2.0.4</div>

              <h2 className={`archive-title text-2xl md:text-4xl mb-16 text-center reveal ${
                theme === 'dark' ? '' : 'text-zinc-900'
              }`}>
                FAMILIAR_ERRORS?
              </h2>

              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                {[
                  { title: "DATA_SCATTERED", desc: "Information in multiple apps, emails, sticky notes" },
                  { title: "SEARCH_FAILED", desc: "Time lost searching through folders and apps" },
                  { title: "DEVICE_MISMATCH", desc: "Information saved on wrong device" },
                  { title: "NO_TIME_TO_ORGANIZE", desc: "Too busy to learn complex systems" },
                  { title: "INFORMATION_OVERLOAD", desc: "Drowning in data with no structure" },
                  { title: "MEMORY_LEAK", desc: "Missing deadlines and key information" }
                ].map((pain, i) => (
                  <div key={i} className="flex items-start gap-4 group reveal stagger-1" style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
                    <div className="status-dot mt-2 shrink-0"></div>
                    <div>
                      <span className="font-mono text-[10px] text-accent font-bold uppercase tracking-widest block mb-1">{pain.title}:</span>
                      <p className={`text-sm transition-colors ${
                        theme === 'dark'
                          ? 'text-zinc-500 group-hover:text-zinc-400'
                          : 'text-zinc-600 group-hover:text-zinc-700'
                      }`}>{pain.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`text-center mt-20 pt-12 border-t ${
                theme === 'dark' ? 'border-zinc-800/20' : 'border-zinc-200'
              }`}>
                <p className={`font-mono text-xs mb-8 uppercase tracking-[0.2em] ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'
                }`}>
                  IF_RECOGNIZED → SAVEME_IS_FOR_YOU
                </p>
                <button
                  className="btn-galvanized btn-galvanized-primary px-10"
                  onClick={() => setIsWaitingListModalOpen(true)}
                >
                  JOIN_WAITING_LIST
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Matrix */}
        <section className={`py-24 px-8 border-t ${
          theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <div className={`protocol-tag justify-center mb-8 reveal ${
                theme === 'dark' ? '' : 'border-zinc-300 text-zinc-600'
              }`}>PRICING_MATRIX</div>
              <h2 className={`archive-title text-3xl md:text-5xl mb-8 reveal stagger-1 ${
                theme === 'dark' ? '' : 'text-zinc-900'
              }`}>
                PLANNED_TIERS
              </h2>
              <p className={`font-mono text-[10px] tracking-[0.3em] uppercase reveal stagger-2 ${
                theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'
              }`}>
                MONTHLY_BILLING • CANCEL_ANYTIME • NO_HIDDEN_FEES • 14_DAY_TRIAL
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {plains.map((plan, i) => (
                <div
                  key={i}
                  className={`category-card-skeletal group reveal ${plan.popular ? 'border-accent/40 bg-zinc-900/30 glow-accent' : ''}`}
                  style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="badge-skeletal bg-accent text-zinc-950 font-bold border-accent px-4">RECOMMENDED</span>
                    </div>
                  )}

                  <div className="text-center mb-10 pt-4">
                    <h3 className={`font-mono text-sm font-bold mb-4 tracking-widest ${
                      theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
                    }`}>{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mb-4">
                      <span className="text-5xl font-bold tracking-tighter" style={{ color: 'hsl(199, 89%, 48%)' }}>{plan.price}</span>
                      <span className={`font-mono text-[10px] uppercase tracking-widest ${
                        theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'
                      }`}>
                        /{plan.period === "Forever" ? "once" : "mo"}
                      </span>
                    </div>
                    <p className={`text-xs font-mono uppercase tracking-[0.1em] ${
                      theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'
                    }`}>{plan.description}</p>
                  </div>

                  <ul className={`space-y-4 mb-10 border-t pt-8 ${
                    theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'
                  }`}>
                    {plan.features.map((feature, j) => (
                      <li key={j} className={`flex items-center gap-3 text-[11px] font-mono tracking-wider ${
                        theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                      }`}>
                        <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full btn-galvanized ${plan.popular ? 'btn-galvanized-primary' : 'btn-galvanized-secondary'}`}
                    onClick={() => setIsWaitingListModalOpen(true)}
                  >
                    SELECT_NODE
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer: Skeletal Archive */}
        <footer className={`mt-auto border-t py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-8 font-mono text-[10px] tracking-[0.2em] ${
          theme === 'dark'
            ? 'border-zinc-800/50 text-zinc-600'
            : 'border-zinc-200 text-zinc-500'
        }`}>
          <div className="uppercase">
            © 2024 SAVEME.SPACE // ALL_SYSTEMS_OPERATIONAL
          </div>

          <div className="flex items-center gap-8 uppercase">
            <a href="mailto:info@saveme.space" className="hover:text-accent transition-colors flex items-center gap-2">
              <Mail className="w-3 h-3" />
              CONTACT
            </a>
            <Link to="/privacy" className="hover:text-accent transition-colors">PRIVACY</Link>
            <Link to="/terms" className="hover:text-accent transition-colors">TERMS</Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="status-dot w-1.5 h-1.5 opacity-50"></span>
            SECURE_HANDSHAKE_ESTABLISHED
          </div>
        </footer>
      </div>

      <WaitingListModal
        open={isWaitingListModalOpen}
        onOpenChange={setIsWaitingListModalOpen}
      />

      {activeDemoVideo && (
        <VideoModal
          open={isVideoModalOpen}
          onOpenChange={setIsVideoModalOpen}
          videoUrl={activeDemoVideo.url}
          title={activeDemoVideo.title}
        />
      )}
    </div>
  );
};

export default Index;
