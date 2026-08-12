import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { trackActivationEvent } from "@/lib/analytics";
import { resolvePostAuthDestination } from "@/utils/authRedirect";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signup, signInWithGoogle, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedPlan = searchParams.get("plan");
  const nextDestination = searchParams.get("next");
  const postAuthDestination = resolvePostAuthDestination({
    next: nextDestination,
    requestedPlan,
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(postAuthDestination, { replace: true });
    }
  }, [isAuthenticated, navigate, postAuthDestination]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackActivationEvent("signup_started", { source: "email_form", requested_plan: requestedPlan || "none" });
    const result = await signup(email, password, name);

    if (result.error) {
      toast.error(result.error);
    } else {
      trackActivationEvent("signup_completed", { method: "email", requested_plan: requestedPlan || "none" });
      toast.success("Account created successfully!");
      navigate(postAuthDestination);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    trackActivationEvent("signup_started", { source: "google", requested_plan: requestedPlan || "none" });
    const result = await signInWithGoogle();

    if (result.error) {
      toast.error(result.error);
      setIsGoogleLoading(false);
    } else {
      trackActivationEvent("signup_completed", { method: "google", requested_plan: requestedPlan || "none" });
      toast.success("Creating account with Google...");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Grid Blueprint Background */}
      <div className="grid-blueprint" />

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 border-r border-galvanized flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="SAVEME.SPACE" className="w-8 h-8 object-contain" />
            <span className="mono text-foreground font-bold tracking-wider">
              SAVEME.SPACE
            </span>
          </div>
        </div>

        <div className="reveal">
          <div className="protocol-tag mb-6">PROTOCOL: REGISTRATION</div>
          <h1 className="archive-title text-4xl mb-6">
            CREATE<br />
            YOUR<br />
            ARCHIVE
          </h1>
          <p className="text-muted-foreground max-w-md">
            Your voice-powered external memory, ready in seconds.
            Speak. It captures. AI organizes.
          </p>
        </div>

        <div className="mono text-xs text-muted-foreground flex items-center gap-2">
          <span className="status-dot" />
          Secure connection active
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/logo.png" alt="SAVEME.SPACE" className="w-8 h-8 object-contain" />
            <span className="mono text-foreground font-bold tracking-wider">
              SAVEME.SPACE
            </span>
          </div>

          <div className="galvanized-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-foreground mb-2">Create account</h2>
              <p className="text-sm text-muted-foreground">Start your external memory</p>
            </div>

            <GoogleSignInButton
              onSignIn={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              text="Continue with Google"
            />
            <p className="mt-3 text-xs text-muted-foreground text-center leading-relaxed">
              By continuing, you acknowledge the <Link className="underline underline-offset-2" to="/terms">Terms of Service</Link> and confirm you have read the <Link className="underline underline-offset-2" to="/privacy">Privacy Policy</Link>. Both are engineering drafts pending legal approval.
            </p>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-galvanized" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 mono text-xs text-muted-foreground">
                  Or use email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="mono text-xs text-muted-foreground uppercase tracking-wider">
                  Full name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-skeletal h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="mono text-xs text-muted-foreground uppercase tracking-wider">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@domain.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-skeletal h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="mono text-xs text-muted-foreground uppercase tracking-wider">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="input-skeletal h-12"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-galvanized btn-galvanized-primary justify-center"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-galvanized text-center">
              <span className="text-sm text-muted-foreground">Already have an account? </span>
              <Link to={nextDestination ? `/login?next=${encodeURIComponent(nextDestination)}` : requestedPlan ? `/login?plan=${requestedPlan}` : "/login"} className="mono text-sm text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <Link to="/" className="mono text-xs text-muted-foreground hover:text-primary transition-colors">
              ← Return home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
