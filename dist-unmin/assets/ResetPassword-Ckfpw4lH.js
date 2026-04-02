import { a as reactExports, j as jsxRuntimeExports } from "./vendor-ui-CLSr_GWM.js";
import { u as useAuth, C as Card, e as CardHeader, f as CardTitle, g as CardDescription, h as CardContent, B as Button, a as Link, J as Jt } from "./index-CT7EzYyk.js";
import { I as Input } from "./input-B1KmmYia.js";
import { L as Label } from "./label-Leg8N3DR.js";
import "./vendor-charts-hYiuCXaC.js";
import "./vendor-firebase-N64baH19.js";
const ResetPassword = () => {
  const [email, setEmail] = reactExports.useState("");
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const { resetPassword } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await resetPassword(email);
    if (result.error) {
      Jt.error(result.error);
    } else {
      Jt.success("Password reset email sent! Check your inbox.");
    }
    setIsLoading(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md bg-card border-border", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center space-x-1 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: "/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png",
            alt: "Save Me Logo",
            className: "w-16 h-16 object-contain"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent", children: "Save Me" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl text-card-foreground", children: "Reset Password" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-muted-foreground", children: "Enter your email to receive a password reset link" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "email", className: "text-foreground", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "email",
              type: "email",
              placeholder: "Enter your email",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              required: true,
              disabled: isLoading,
              className: "bg-background border-border text-foreground"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "submit",
            variant: "gradient",
            className: "w-full",
            disabled: isLoading,
            children: isLoading ? "Sending..." : "Send Reset Link"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 text-center text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Remember your password? " }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "text-primary hover:underline font-medium", children: "Sign in" })
      ] })
    ] })
  ] }) });
};
export {
  ResetPassword as default
};
