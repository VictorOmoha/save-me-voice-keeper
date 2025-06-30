import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const Index = () => {
  const { theme, setTheme } = useTheme();
  
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

  const plans = [
    {
      name: "Free",
      price: "$0",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SM</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Save Me
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-foreground hover:text-foreground"
              >
                {getThemeIcon()}
              </Button>
              <Link to="/login">
                <Button variant="ghost" className="text-foreground hover:text-foreground">Login</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            Never Lose Important Information Again
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Save Me is your AI-powered personal information manager. Store, organize, and retrieve any data with voice commands across all your devices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-8 py-3 text-lg">
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-3 text-lg border-gray-300 dark:border-gray-600 text-foreground hover:bg-accent">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Why Choose Save Me?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎤</span>
                </div>
                <CardTitle className="text-card-foreground">Voice-First Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Add and search your data using natural voice commands. No typing required.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <CardTitle className="text-card-foreground">Universal Sync</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access your information seamlessly across mobile, desktop, and web platforms.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow bg-card border-border">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <CardTitle className="text-card-foreground">Smart Organization</CardTitle>
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
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">Choose Your Plan</h2>
          <p className="text-muted-foreground text-center mb-12">Start free, upgrade when you need more power</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative hover:shadow-lg transition-shadow bg-card border-border ${
                plan.popular ? 'border-blue-500 shadow-lg scale-105' : ''
              }`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-card-foreground">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{plan.price}</div>
                  <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-sm text-card-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup">
                    <Button className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700' 
                        : ''
                    }`} variant={plan.popular ? 'default' : 'outline'}>
                      {plan.name === 'Free' ? 'Get Started Free' : 'Start Free Trial'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <span className="text-xl font-bold">Save Me</span>
          </div>
          <p className="text-gray-400 mb-4">Your personal information, perfectly organized.</p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
