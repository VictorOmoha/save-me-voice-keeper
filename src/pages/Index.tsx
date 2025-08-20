
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sun, Moon, Mic, RefreshCcw, Zap, Users, Briefcase, User, Brain, Mail } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { WaitingListModal } from "@/components/WaitingListModal";
import { VideoModal } from "@/components/VideoModal";
import { TypewriterText } from "@/components/TypewriterText";
import { supabase } from "@/integrations/supabase/client";
import { CanvidVideoPlayer } from "@/components/CanvidVideoPlayer";

const Index = () => {
  console.log("Index component rendering...");
  
  // Add a simple loading state to ensure proper render
  const [isComponentReady, setIsComponentReady] = useState(false);
  
  useEffect(() => {
    console.log("Index: Component mounted, setting ready state");
    setIsComponentReady(true);
  }, []);
  
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeDemoVideo, setActiveDemoVideo] = useState<{ url: string; title: string } | null>(null);

  // Fetch active demo video
  useEffect(() => {
    const fetchActiveDemoVideo = async () => {
      try {
        console.log("Fetching demo video...");
        const { data, error } = await supabase
          .from('demo_videos')
          .select('video_url, title')
          .eq('is_active', true);

        if (data && data.length > 0 && !error) {
          console.log("Demo video found:", data[0]);
          try {
            const { data: signed, error: signErr } = await supabase.functions.invoke('get-signed-demo-video', {
              body: { url: data[0].video_url, expiresIn: 600 }
            });
            if (signErr) {
              console.warn('Failed to get signed URL, falling back to stored URL', signErr);
              setActiveDemoVideo({ url: data[0].video_url, title: data[0].title });
            } else {
              setActiveDemoVideo({ url: (signed as any)?.signedUrl || data[0].video_url, title: data[0].title });
            }
          } catch (e) {
            console.warn('Signed URL generation error, using stored URL', e);
            setActiveDemoVideo({ url: data[0].video_url, title: data[0].title });
          }
        }
      } catch (error) {
        console.error('Error fetching demo video:', error);
      }
    };

    fetchActiveDemoVideo();
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getThemeIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    return <Sun className="h-4 w-4" />; // system default to sun icon
  };

  const handleWatchDemo = () => {
    if (activeDemoVideo) {
      setIsVideoModalOpen(true);
    }
  };

  const plans = [
    {
      name: "Free",
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
      name: "Basic",
      price: "$9",
      period: "per month",
      description: "For personal power users",
      features: [
        "Unlimited entries",
        "Advanced search & filters",
        "All platforms (Web, Mobile, Desktop)",
        "Voice input & commands",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Premium",
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

  console.log("Rendering Index component");

  // Show a loading state briefly while component initializes
  if (!isComponentReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-gray-200 dark:border-gray-700 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-1 group">
              <img 
                src="/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png" 
                alt="Save Me Logo" 
                className="w-12 h-12 object-contain transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-white dark:to-white bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
                Save Me
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-foreground hover:text-foreground transition-all duration-300 hover:scale-110 hover:rotate-12"
              >
                {getThemeIcon()}
              </Button>
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="gradient" className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant="gradient"
                  onClick={() => setIsWaitingListModalOpen(true)}
                  className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Join Waiting List
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight md:leading-tight pb-2 min-h-[200px] flex items-center justify-center">
            <TypewriterText 
              text="Never Lose Important Information Again"
              speed={80}
              delay={1000}
            />
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto animate-fade-in">
            Save Me is your AI-powered personal information manager. Store, organize, and retrieve any data with voice commands across all your devices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button 
                  size="lg" 
                  variant="gradient"
                  className="px-8 py-3 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1"
                >
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg" 
                variant="gradient"
                className="px-8 py-3 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1"
                onClick={() => setIsWaitingListModalOpen(true)}
              >
                Join Waiting List
              </Button>
            )}
            <Button 
              size="lg" 
              variant="outline" 
              className="px-8 py-3 text-lg border-gray-300 dark:border-gray-600 text-foreground hover:bg-accent transition-all duration-300 hover:scale-105 hover:shadow-lg hover:-translate-y-1"
              onClick={handleWatchDemo}
              disabled={!activeDemoVideo}
            >
              {activeDemoVideo ? "Watch Demo" : "Demo Coming Soon"}
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Video Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground transition-all duration-300 hover:scale-105">
            See Save Me in Action
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Watch how Save Me transforms the way you capture, organize, and retrieve your important information
          </p>
          <CanvidVideoPlayer videoId="fi_01K349ZYVZECRFZJBW1EMC0SFG" />
        </div>
      </section>

      {/* Who Is This For Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground transition-all duration-300 hover:scale-105">
              Who Is Save Me For?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Save Me is designed for anyone who struggles to keep track of important information across their personal and professional life
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Busy Professionals */}
            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-card border-border hover:scale-105 hover:-translate-y-2 group">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
                </div>
                <CardTitle className="text-lg text-card-foreground transition-colors duration-300">Busy Professionals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Executives, consultants, and managers who need to remember client details, meeting notes, and project information on-the-go.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 text-left">
                  <li className="transition-all duration-200 hover:translate-x-1">• Client contact details</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Meeting action items</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Project milestones</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Travel information</li>
                </ul>
              </CardContent>
            </Card>

            {/* Entrepreneurs & Freelancers */}
            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-card border-border hover:scale-105 hover:-translate-y-2 group">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <User className="w-8 h-8 text-green-600 dark:text-green-400 transition-colors duration-300" />
                </div>
                <CardTitle className="text-lg text-card-foreground transition-colors duration-300">Entrepreneurs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Solo entrepreneurs and freelancers juggling multiple clients, projects, and business ideas without a team to help organize.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 text-left">
                  <li className="transition-all duration-200 hover:translate-x-1">• Business ideas</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Client requirements</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Financial records</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Network contacts</li>
                </ul>
              </CardContent>
            </Card>

            {/* Students & Researchers */}
            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-card border-border hover:scale-105 hover:-translate-y-2 group">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
                </div>
                <CardTitle className="text-lg text-card-foreground transition-colors duration-300">Students & Researchers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Students, academics, and researchers who need to organize vast amounts of information, references, and ideas.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 text-left">
                  <li className="transition-all duration-200 hover:translate-x-1">• Research notes</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Book references</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Study materials</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Assignment deadlines</li>
                </ul>
              </CardContent>
            </Card>

            {/* Families & Personal Users */}
            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-card border-border hover:scale-105 hover:-translate-y-2 group">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Users className="w-8 h-8 text-orange-600 dark:text-orange-400 transition-colors duration-300" />
                </div>
                <CardTitle className="text-lg text-card-foreground transition-colors duration-300">Families & Personal Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Parents, caregivers, and individuals managing household information, family schedules, and personal interests.
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 text-left">
                  <li className="transition-all duration-200 hover:translate-x-1">• Family schedules</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Medical information</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Recipe collections</li>
                  <li className="transition-all duration-200 hover:translate-x-1">• Home maintenance</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Common Pain Points */}
          <div className="mt-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg">
            <h3 className="text-2xl font-bold text-center mb-8 text-foreground transition-all duration-300 hover:scale-105">
              Do Any of These Sound Familiar?
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0 transition-all duration-300 group-hover:scale-150"></div>
                  <p className="text-muted-foreground transition-all duration-300 group-hover:translate-x-2">
                    <strong className="text-foreground">Information scattered everywhere:</strong> Notes in different apps, emails, sticky notes, and scraps of paper
                  </p>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0 transition-all duration-300 group-hover:scale-150"></div>
                  <p className="text-muted-foreground transition-all duration-300 group-hover:translate-x-2">
                    <strong className="text-foreground">Can't find what you need:</strong> Spending precious time searching through multiple apps and folders
                  </p>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0 transition-all duration-300 group-hover:scale-150"></div>
                  <p className="text-muted-foreground transition-all duration-300 group-hover:translate-x-2">
                    <strong className="text-foreground">Device switching frustration:</strong> Information saved on one device but needed on another
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0 transition-all duration-300 group-hover:scale-150"></div>
                  <p className="text-muted-foreground transition-all duration-300 group-hover:translate-x-2">
                    <strong className="text-foreground">No time to organize:</strong> Too busy to set up complex systems or learn new tools
                  </p>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0 transition-all duration-300 group-hover:scale-150"></div>
                  <p className="text-muted-foreground transition-all duration-300 group-hover:translate-x-2">
                    <strong className="text-foreground">Information overload:</strong> Drowning in data with no good way to make sense of it all
                  </p>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0 transition-all duration-300 group-hover:scale-150"></div>
                  <p className="text-muted-foreground transition-all duration-300 group-hover:translate-x-2">
                    <strong className="text-foreground">Forgetting important details:</strong> Missing deadlines, appointments, or key information when you need it most
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-lg text-foreground font-semibold mb-4">
                If you nodded along to any of these, Save Me is built for you.
              </p>
              <Button 
                size="lg" 
                variant="gradient"
                className="px-8 py-3 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1"
                onClick={() => setIsWaitingListModalOpen(true)}
              >
                Join the Waiting List
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground transition-all duration-300 hover:scale-105">
              See Save Me in Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience our intuitive dashboard that adapts to your preferences with seamless dark and light modes
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Light Mode Demo */}
            <div className="space-y-4 group">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-yellow-400 rounded-full transition-all duration-300 group-hover:scale-150"></div>
                <span className="text-sm font-medium text-muted-foreground">Light Mode</span>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-primary rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative transition-all duration-300 hover:scale-105">
                  <img 
                    src="/lovable-uploads/bc240c60-e282-4d87-8e60-f2af2366f886.png" 
                    alt="Save Me Dashboard - Light Mode" 
                    className="w-full rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-3xl"
                  />
                </div>
              </div>
            </div>

            {/* Dark Mode Demo */}
            <div className="space-y-4 group">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-indigo-400 rounded-full transition-all duration-300 group-hover:scale-150"></div>
                <span className="text-sm font-medium text-muted-foreground">Dark Mode</span>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative transition-all duration-300 hover:scale-105">
                  <img 
                    src="/lovable-uploads/a98a0b41-8946-445c-97c4-379ad69e55bd.png" 
                    alt="Save Me Dashboard - Dark Mode" 
                    className="w-full rounded-lg shadow-2xl border border-gray-700 transition-all duration-300 hover:shadow-3xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 group transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2 transition-all duration-300 group-hover:scale-105">Smart Dashboard</h3>
              <p className="text-sm text-muted-foreground">Organize your information with an intuitive dashboard that shows everything at a glance</p>
            </div>
            
            <div className="text-center p-6 group transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2 transition-all duration-300 group-hover:scale-105">Category System</h3>
              <p className="text-sm text-muted-foreground">Keep everything organized with smart categories that adapt to your workflow</p>
            </div>
            
            <div className="text-center p-6 group transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2 transition-all duration-300 group-hover:scale-105">Powerful Search</h3>
              <p className="text-sm text-muted-foreground">Find anything instantly with our advanced search that understands your needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground transition-all duration-300 hover:scale-105">Why Choose Save Me?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-card border-border hover:scale-105 hover:-translate-y-2 group">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                  <Mic className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-card-foreground transition-all duration-300 group-hover:scale-105">Voice-First Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Add and search your data using natural voice commands. No typing required.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-card border-border hover:scale-105 hover:-translate-y-2 group">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                  <RefreshCcw className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-card-foreground transition-all duration-300 group-hover:scale-105">Universal Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access your information seamlessly across mobile, desktop, and web platforms.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 bg-card border-border hover:scale-105 hover:-translate-y-2 group">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-card-foreground transition-all duration-300 group-hover:scale-105">Smart Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create custom fields and let AI help you organize everything automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground transition-all duration-300 hover:scale-105">Planned Pricing</h2>
          <p className="text-muted-foreground text-center mb-2">Join our waiting list to get early access when we launch</p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8 max-w-2xl mx-auto transition-all duration-300 hover:scale-105">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
              🚀 <strong>Save Me is coming soon!</strong> These are our planned pricing tiers. Join the waiting list to be notified when we launch and get early access to these features.
            </p>
          </div>
          <p className="text-sm text-muted-foreground text-center mb-12">
            • Monthly billing • Cancel anytime • No hidden fees • 14-day free trial on paid plans
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative hover:shadow-lg transition-all duration-300 bg-card border-border hover:scale-105 hover:-translate-y-2 group ${
                plan.popular ? 'border-blue-500 shadow-lg scale-105' : ''
              }`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-800 text-white transition-all duration-300 group-hover:scale-110">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-card-foreground transition-all duration-300 group-hover:scale-105">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110">{plan.price}</span>
                    <span className="text-lg text-muted-foreground ml-1">/{plan.period === "Forever" ? "forever" : "month"}</span>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {plan.period === "Forever" ? "No recurring charges" : "Billed monthly"}
                  </div>
                  <CardDescription className="text-muted-foreground mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center group">
                        <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0 transition-all duration-300 group-hover:scale-125" />
                        <span className="text-sm text-card-foreground transition-all duration-300 group-hover:translate-x-1">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full transition-all duration-300 hover:scale-105 hover:shadow-lg" 
                    variant={plan.popular ? 'gradient' : 'outline'}
                    onClick={() => setIsWaitingListModalOpen(true)}
                  >
                    Join Waiting List
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Get notified when Save Me launches
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-4">
              Join our waiting list to be the first to know when Save Me launches with these pricing plans.
            </p>
            <p className="text-xs text-muted-foreground">
              Have questions? <a href="mailto:contact@saveme.app" className="text-blue-600 dark:text-blue-400 hover:underline transition-all duration-300 hover:scale-105">Contact us</a> for more information.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 px-4 transition-all duration-300">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-1 mb-4 group">
            <img 
              src="/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png" 
              alt="Save Me Logo" 
              className="w-12 h-12 object-contain transition-all duration-300 group-hover:scale-110"
            />
            <span className="text-xl font-bold transition-all duration-300 group-hover:scale-105">Save Me</span>
          </div>
          <p className="text-gray-400 mb-6">Your personal information, perfectly organized.</p>
          
          {/* Social Links */}
          <div className="flex justify-center items-center space-x-6 mb-6">
            <a 
              href="mailto:info@saveme.space" 
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-105"
            >
              <Mail className="w-5 h-5" />
              <span>info@saveme.space</span>
            </a>
            <a 
              href="https://www.tiktok.com/@saveme.space" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.946-1.316-2.172-1.316-3.453V0h-3.188v16.326c0 .815-.268 1.604-.776 2.252a3.729 3.729 0 0 1-1.946 1.296 3.797 3.797 0 0 1-2.27-.035 3.706 3.706 0 0 1-1.846-1.065 3.618 3.618 0 0 1-1.076-2.573c0-.976.395-1.913 1.098-2.604a3.743 3.743 0 0 1 2.633-1.086c.27 0 .537.026.798.078v-3.29a7.068 7.068 0 0 0-.798-.045c-1.921 0-3.773.76-5.146 2.112A7.222 7.222 0 0 0 2 16.326c0 1.92.768 3.762 2.137 5.123A7.376 7.376 0 0 0 9.282 24c.689 0 1.371-.135 2.01-.396a7.415 7.415 0 0 0 3.196-2.275c.849-.946 1.316-2.172 1.316-3.453V9.828a9.292 9.292 0 0 0 5.196 1.592V8.22c-1.024 0-2.025-.309-2.885-.85-.86-.541-1.553-1.310-1.999-2.218l-.795.41z"/>
              </svg>
              <span>@saveme.space</span>
            </a>
          </div>

          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-all duration-300 hover:scale-105">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-all duration-300 hover:scale-105">Terms of Service</a>
            <a href="#" className="hover:text-white transition-all duration-300 hover:scale-105">Support</a>
          </div>
        </div>
      </footer>

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
