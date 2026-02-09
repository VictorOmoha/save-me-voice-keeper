import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/GoogleSignInButton";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, signInWithGoogle, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await signInWithGoogle();

    if (result.error) {
      toast.error(result.error);
      setIsGoogleLoading(false);
    } else {
      toast.success("Signing in with Google...");
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
            <img src="/saveme-logo.svg" alt="SAVEME.SPACE" className="w-8 h-8 object-contain" />
            <span className="mono text-foreground font-bold tracking-wider">
              SAVEME.SPACE
            </span>
          </div>
        </div>

        <div className="reveal">
          <div className="protocol-tag mb-6">PROTOCOL: AUTHENTICATION</div>
          <h1 className="archive-title text-4xl mb-6">
            ACCESS<br />
            YOUR<br />
            ARCHIVE
          </h1>
          <p className="text-muted-foreground max-w-md">
            Secure entry point to your galvanized data framework.
            All transmissions encrypted end-to-end.
          </p>
        </div>

        <div className="mono text-xs text-muted-foreground flex items-center gap-2">
          <span className="status-dot" />
          SECURE_CONNECTION_ESTABLISHED
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/saveme-logo.svg" alt="SAVEME.SPACE" className="w-8 h-8 object-contain" />
            <span className="mono text-foreground font-bold tracking-wider">
              SAVEME.SPACE
            </span>
          </div>

          <div className="galvanized-card p-8">
            <div className="text-center mb-8">
              <h2 className="mono text-xl font-bold text-foreground mb-2">AUTHENTICATE</h2>
              <p className="text-sm text-muted-foreground">Sign in to access your archive</p>
            </div>

            <GoogleSignInButton
              onSignIn={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              text="SIGN_IN_WITH_GOOGLE"
            />

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-galvanized" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 mono text-xs text-muted-foreground">
                  OR_CONTINUE_WITH
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="mono text-xs text-muted-foreground uppercase tracking-wider">
                  EMAIL_ADDRESS
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-skeletal h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="mono text-xs text-muted-foreground uppercase tracking-wider">
                  PASSWORD
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-skeletal h-12"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-galvanized btn-galvanized-primary justify-center"
              >
                {isLoading ? "AUTHENTICATING..." : "INITIATE_LOGIN"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/reset-password"
                className="mono text-xs text-primary hover:underline"
              >
                FORGOT_PASSWORD?
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-galvanized text-center">
              <span className="text-sm text-muted-foreground">No archive yet? </span>
              <Link to="/signup" className="mono text-sm text-primary hover:underline">
                CREATE_ACCOUNT
              </Link>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <Link to="/" className="mono text-xs text-muted-foreground hover:text-primary transition-colors">
              ← RETURN_TO_HOME
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
