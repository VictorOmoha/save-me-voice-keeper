import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { trackActivationEvent } from "@/lib/analytics";
import { resolvePostAuthDestination } from "@/utils/authRedirect";
import "@/styles/auth.css";

const GRAD = "linear-gradient(135deg,#2dd4ff,#0b8fc4)";
const MONO = "'JetBrains Mono'";

const labelStyle: CSSProperties = {
  display: "block",
  font: `600 11px ${MONO}`,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "#8593a6",
  marginBottom: 8,
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, signInWithGoogle, isLoading, isAuthenticated } = useAuth();
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
    trackActivationEvent("login_started", { source: "email_form", requested_plan: requestedPlan || "none" });
    const result = await login(email, password);

    if (result.error) {
      toast.error(result.error);
    } else {
      trackActivationEvent("login_completed", { method: "email", requested_plan: requestedPlan || "none" });
      toast.success("Welcome back!");
      navigate(postAuthDestination);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    trackActivationEvent("login_started", { source: "google", requested_plan: requestedPlan || "none" });
    const result = await signInWithGoogle();

    if (result.error) {
      toast.error(result.error);
      setIsGoogleLoading(false);
    } else {
      trackActivationEvent("login_completed", { method: "google", requested_plan: requestedPlan || "none" });
      toast.success("Signing in with Google...");
    }
  };

  const signupHref = nextDestination
    ? `/signup?next=${encodeURIComponent(nextDestination)}`
    : requestedPlan
      ? `/signup?plan=${requestedPlan}`
      : "/signup";

  return (
    <div className="auth-root min-h-screen flex">
      {/* Left panel — branding (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative" style={{ borderRight: "1px solid rgba(125,165,205,.08)" }}>
        <div className="auth-orb" style={{ top: "-12%", left: "8%", width: 460, height: 460, background: "radial-gradient(circle,rgba(45,212,255,.16),transparent 64%)", animation: "auth-orbA 19s ease-in-out infinite" }} />
        <div className="auth-orb" style={{ bottom: "-16%", left: "30%", width: 420, height: 420, background: "radial-gradient(circle,rgba(36,120,220,.14),transparent 66%)", animation: "auth-orbB 23s ease-in-out infinite" }} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 11 }}>
          <img src="/logo.png" alt="SaveMe" width={34} height={34} style={{ display: "block", objectFit: "contain", filter: "drop-shadow(0 0 14px rgba(45,212,255,.35))" }} />
          <span style={{ font: "700 16px Sora", letterSpacing: ".16em", color: "#eaf3fa" }}>SAVEME.SPACE</span>
        </div>

        <div style={{ position: "relative", maxWidth: 460 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 13px", borderRadius: 999, background: "rgba(45,212,255,.07)", border: "1px solid rgba(45,212,255,.16)", marginBottom: 22 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2dd4ff", boxShadow: "0 0 10px #2dd4ff" }} />
            <span style={{ font: `600 11px ${MONO}`, letterSpacing: ".16em", color: "#7fd9f0" }}>NOVA · SECURE SESSION</span>
          </div>
          <h1 style={{ font: "700 clamp(34px,3.2vw,46px)/1.08 Sora", letterSpacing: "-.02em", margin: 0, color: "#f1f7fc" }}>
            Welcome back to<br />your memory.
          </h1>
          <p style={{ font: "500 15.5px/1.65 Manrope", color: "#8ea0b3", margin: "18px 0 0" }}>
            Your second brain is right where you left it — encrypted in transit, organized by Nova, and ready for you and your agents.
          </p>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 9, font: `500 12px ${MONO}`, letterSpacing: ".06em", color: "#566375" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#39e0a8", boxShadow: "0 0 9px #39e0a8" }} />
          Secure connection active
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">
        <div className="auth-orb lg:hidden" style={{ top: "-10%", right: "-10%", width: 360, height: 360, background: "radial-gradient(circle,rgba(45,212,255,.12),transparent 64%)" }} />

        <div className="w-full" style={{ maxWidth: 420, position: "relative" }}>
          {/* Mobile logo */}
          <div className="flex lg:hidden" style={{ alignItems: "center", justifyContent: "center", gap: 11, marginBottom: 28 }}>
            <img src="/logo.png" alt="SaveMe" width={32} height={32} style={{ display: "block", objectFit: "contain" }} />
            <span style={{ font: "700 15px Sora", letterSpacing: ".16em", color: "#eaf3fa" }}>SAVEME.SPACE</span>
          </div>

          <div style={{ borderRadius: 20, padding: "32px 28px", background: "rgba(255,255,255,.022)", border: "1px solid rgba(125,165,205,.10)", boxShadow: "0 30px 80px -40px rgba(0,0,0,.8)" }}>
            <div style={{ marginBottom: 26 }}>
              <h2 style={{ font: "700 24px Sora", letterSpacing: "-.01em", color: "#f1f7fc", margin: 0 }}>Sign in</h2>
              <p style={{ font: "500 13.5px Manrope", color: "#8ea0b3", margin: "7px 0 0" }}>Access your secure knowledge vault.</p>
            </div>

            <div className="auth-google">
              <GoogleSignInButton onSignIn={handleGoogleSignIn} isLoading={isGoogleLoading} text="Continue with Google" />
            </div>

            <div style={{ position: "relative", margin: "24px 0" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
                <div style={{ width: "100%", borderTop: "1px solid rgba(125,165,205,.10)" }} />
              </div>
              <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                <span style={{ padding: "0 14px", background: "#0a0e16", font: `600 10.5px ${MONO}`, letterSpacing: ".14em", color: "#566375" }}>OR USE EMAIL</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="email" style={labelStyle}>Email address</label>
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="user@domain.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                <input
                  id="password"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="auth-cta"
                style={{ width: "100%", height: 48, borderRadius: 11, border: "none", cursor: "pointer", background: GRAD, color: "#04222e", font: "700 14.5px Manrope", boxShadow: "0 0 28px rgba(45,212,255,.35)" }}
              >
                {isLoading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div style={{ marginTop: 18, textAlign: "center" }}>
              <Link to="/reset-password" className="auth-link" style={{ font: "600 13px Manrope", color: "#5fd6f0", textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(125,165,205,.10)", textAlign: "center" }}>
              <span style={{ font: "500 13.5px Manrope", color: "#8ea0b3" }}>No account yet? </span>
              <Link to={signupHref} className="auth-link" style={{ font: "700 13.5px Manrope", color: "#5fd6f0", textDecoration: "none" }}>
                Create account
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Link to="/" className="auth-home" style={{ font: `600 11px ${MONO}`, letterSpacing: ".08em", color: "#566375", textDecoration: "none", transition: "color .15s" }}>
              ← RETURN HOME
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
