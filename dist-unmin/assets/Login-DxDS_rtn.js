import { j as jsxRuntimeExports, a as reactExports } from "./vendor-ui-CLSr_GWM.js";
import { B as Button, L as LoaderCircle, u as useAuth, b as useNavigate, a as Link, J as Jt } from "./index-CT7EzYyk.js";
import { I as Input } from "./input-B1KmmYia.js";
import { L as Label } from "./label-Leg8N3DR.js";
import "./vendor-charts-hYiuCXaC.js";
import "./vendor-firebase-N64baH19.js";
const GoogleSignInButton = ({ onSignIn, isLoading, text = "Continue with Google" }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Button,
    {
      type: "button",
      variant: "outline",
      className: "w-full bg-background hover:bg-accent text-foreground border-border",
      onClick: onSignIn,
      disabled: isLoading,
      children: [
        isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "mr-2 h-4 w-4", viewBox: "0 0 24 24", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              fill: "#4285F4",
              d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              fill: "#34A853",
              d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              fill: "#FBBC05",
              d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              fill: "#EA4335",
              d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            }
          )
        ] }),
        text
      ]
    }
  );
};
const Login = () => {
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [isGoogleLoading, setIsGoogleLoading] = reactExports.useState(false);
  const { login, signInWithGoogle, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.error) {
      Jt.error(result.error);
    } else {
      Jt.success("Welcome back!");
      navigate("/dashboard");
    }
  };
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      Jt.error(result.error);
      setIsGoogleLoading(false);
    } else {
      Jt.success("Signing in with Google...");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background flex", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid-blueprint" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden lg:flex lg:w-1/2 border-r border-galvanized flex-col justify-between p-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/logo.png", alt: "SAVEME.SPACE", className: "w-8 h-8 object-contain" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mono text-foreground font-bold tracking-wider", children: "SAVEME.SPACE" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "reveal", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "protocol-tag mb-6", children: "PROTOCOL: AUTHENTICATION" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "archive-title text-4xl mb-6", children: [
          "ACCESS",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "YOUR",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "ARCHIVE"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-md", children: "Secure entry point to your galvanized data framework. All transmissions encrypted end-to-end." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mono text-xs text-muted-foreground flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "status-dot" }),
        "SECURE_CONNECTION_ESTABLISHED"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lg:hidden flex items-center justify-center gap-3 mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/logo.png", alt: "SAVEME.SPACE", className: "w-8 h-8 object-contain" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mono text-foreground font-bold tracking-wider", children: "SAVEME.SPACE" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "galvanized-card p-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mono text-xl font-bold text-foreground mb-2", children: "AUTHENTICATE" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Sign in to access your archive" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          GoogleSignInButton,
          {
            onSignIn: handleGoogleSignIn,
            isLoading: isGoogleLoading,
            text: "SIGN_IN_WITH_GOOGLE"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative my-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full border-t border-galvanized" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-card px-4 mono text-xs text-muted-foreground", children: "OR_CONTINUE_WITH" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "email", className: "mono text-xs text-muted-foreground uppercase tracking-wider", children: "EMAIL_ADDRESS" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "email",
                type: "email",
                placeholder: "user@domain.com",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                required: true,
                disabled: isLoading,
                className: "input-skeletal h-12"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "password", className: "mono text-xs text-muted-foreground uppercase tracking-wider", children: "PASSWORD" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "password",
                type: "password",
                placeholder: "••••••••",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                required: true,
                disabled: isLoading,
                className: "input-skeletal h-12"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "submit",
              disabled: isLoading,
              className: "w-full btn-galvanized btn-galvanized-primary justify-center",
              children: isLoading ? "AUTHENTICATING..." : "INITIATE_LOGIN"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/reset-password",
            className: "mono text-xs text-primary hover:underline",
            children: "FORGOT_PASSWORD?"
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 pt-6 border-t border-galvanized text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "No archive yet? " }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signup", className: "mono text-sm text-primary hover:underline", children: "CREATE_ACCOUNT" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mono text-xs text-muted-foreground hover:text-primary transition-colors", children: "← RETURN_TO_HOME" }) })
    ] }) })
  ] });
};
export {
  Login as default
};
