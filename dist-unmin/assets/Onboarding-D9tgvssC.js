import { j as jsxRuntimeExports, a as reactExports } from "./vendor-ui-CLSr_GWM.js";
import { c as createLucideIcon, C as Card, h as CardContent, i as cn, S as Sparkles, A as Search, M as Mic, b as useNavigate, B as Button, u as useAuth, X, d as db } from "./index-CT7EzYyk.js";
import { P as Plus } from "./plus-DJOOR5Wx.js";
import { F as FolderOpen } from "./folder-open-C92-D7ty.js";
import { d as doc, m as setDoc, n as serverTimestamp } from "./vendor-firebase-N64baH19.js";
import { C as ChevronLeft } from "./chevron-left-cv4Egzj6.js";
import { C as ChevronRight } from "./chevron-right-fa0SEsLi.js";
import "./vendor-charts-hYiuCXaC.js";
const BookOpen = createLucideIcon("BookOpen", [
  ["path", { d: "M12 7v14", key: "1akyts" }],
  [
    "path",
    {
      d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
      key: "ruj8y"
    }
  ]
]);
const House = createLucideIcon("House", [
  ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
  [
    "path",
    {
      d: "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      key: "1d0kgt"
    }
  ]
]);
const Rocket = createLucideIcon("Rocket", [
  [
    "path",
    {
      d: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
      key: "m3kijz"
    }
  ],
  [
    "path",
    {
      d: "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
      key: "1fmvmk"
    }
  ],
  ["path", { d: "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0", key: "1f8sc4" }],
  ["path", { d: "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5", key: "qeys4" }]
]);
function OnboardingStep({
  icon,
  title,
  description,
  children,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: cn("w-full max-w-2xl mx-auto border-0 shadow-none bg-transparent", className), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-6 flex flex-col items-center text-center space-y-6", children: [
    icon && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-6xl mb-2", children: icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-bold tracking-tight", children: title }),
      description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-lg max-w-md", children: description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full pt-4", children })
  ] }) });
}
function WelcomeStep() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    OnboardingStep,
    {
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-20 h-20 text-primary" }),
      title: "Welcome to SaveMe",
      description: "You're about to change how you remember everything.",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg text-foreground", children: [
          "Think of SaveMe as your ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-primary", children: "second brain" }),
          " — a place where everything important lives, organized and searchable."
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-xl bg-gradient-to-b from-primary/10 to-transparent", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl mb-3", children: "🎤" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-1", children: "Speak" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Just talk — we'll capture it" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-xl bg-gradient-to-b from-primary/10 to-transparent", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl mb-3", children: "✨" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-1", children: "Auto-Organize" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "AI sorts it for you" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-xl bg-gradient-to-b from-primary/10 to-transparent", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl mb-3", children: "🔍" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-1", children: "Find Instantly" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Search anything, anytime" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-muted-foreground text-sm", children: "Takes about 1 minute. Let's show you around!" })
      ] })
    }
  );
}
function DashboardStep() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    OnboardingStep,
    {
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "w-20 h-20 text-primary" }),
      title: "Your Command Center",
      description: "Everything you need, one glance away.",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-1", children: "Search Everything" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Type or speak — find anything in seconds" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-1", children: "Voice Button" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Click to speak — your fastest way in" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-1", children: "Quick Add" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Add entries manually when you prefer" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "w-5 h-5 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold mb-1", children: "Recent Activity" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Your latest entries, front and center" })
          ] })
        ] })
      ] }) })
    }
  );
}
const categories = [
  { icon: "📄", name: "Documents", examples: "IDs, contracts, certificates" },
  { icon: "🏥", name: "Health", examples: "Meds, doctors, appointments" },
  { icon: "👥", name: "Contacts", examples: "People, businesses, emergency" },
  { icon: "💰", name: "Finance", examples: "Accounts, cards, insurance" },
  { icon: "👤", name: "Personal", examples: "Notes, ideas, memories" }
];
function EntriesStep() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    OnboardingStep,
    {
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(FolderOpen, { className: "w-20 h-20 text-primary" }),
      title: "Smart Categories",
      description: "We organize. You just save.",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-muted-foreground", children: "When you save something, AI automatically puts it in the right place:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2", children: categories.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl w-10 text-center", children: cat.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: cat.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground mx-2", children: "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: cat.examples })
              ] })
            ]
          },
          cat.name
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center", children: "Don't like where something landed? Move it with one click." })
      ] })
    }
  );
}
const examples = [
  {
    say: "Save my doctor's number: 555-1234",
    result: "→ Saved to Contacts"
  },
  {
    say: "My passport expires December 2025",
    result: "→ Saved to Documents"
  },
  {
    say: "Find my wifi password",
    result: "→ Searches all entries"
  },
  {
    say: "What's my dentist's address?",
    result: "→ Finds matching entry"
  }
];
function VoiceStep() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    OnboardingStep,
    {
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "w-20 h-20 text-primary" }),
      title: "Just Talk",
      description: "No buttons. No menus. Just say what you need.",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: examples.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "p-4 rounded-xl bg-muted/50",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: "🎤" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-left", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-foreground", children: [
                  '"',
                  item.say,
                  '"'
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-primary mt-1", children: item.result })
              ] })
            ] })
          },
          index
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-primary", children: "💡 Pro tip:" }),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Talk naturally — SaveMe understands context, not just keywords." })
        ] }) })
      ] })
    }
  );
}
function CompleteStep() {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    OnboardingStep,
    {
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Rocket, { className: "w-20 h-20 text-primary" }),
      title: "You're Ready!",
      description: "Your second brain is set up. Let's fill it.",
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-xl bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-green-600 dark:text-green-400 mb-4 text-center", children: "🎯 Quick Start Challenge" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-muted-foreground mb-4", children: "Try saving one thing right now:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-lg bg-background/50 text-center", children: '🎤 "Save my wifi password: [your password]"' }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-lg bg-background/50 text-center", children: '🎤 "My emergency contact is [name], [number]"' }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-lg bg-background/50 text-center", children: '🎤 "Remember: [anything on your mind]"' })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => navigate("/user-guide"),
            className: "gap-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-4 h-4" }),
              "Full User Guide"
            ]
          }
        ) })
      ] })
    }
  );
}
const steps = [
  { id: "welcome", component: WelcomeStep },
  { id: "dashboard", component: DashboardStep },
  { id: "entries", component: EntriesStep },
  { id: "voice", component: VoiceStep },
  { id: "complete", component: CompleteStep }
];
function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = reactExports.useState(0);
  const [isCompleting, setIsCompleting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };
  const handleSkip = async () => {
    await completeOnboarding();
  };
  const handleComplete = async () => {
    await completeOnboarding();
  };
  const completeOnboarding = async () => {
    if (!user || isCompleting) return;
    setIsCompleting(true);
    try {
      const prefsRef = doc(db, "user_preferences", user.uid);
      await setDoc(prefsRef, {
        user_id: user.uid,
        has_completed_onboarding: true,
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Error completing onboarding:", err);
    } finally {
      setIsCompleting(false);
      navigate("/dashboard");
    }
  };
  const CurrentStepComponent = steps[currentStep].component;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen flex flex-col bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-4 right-4 z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: handleSkip,
        disabled: isCompleting,
        className: "text-muted-foreground hover:text-foreground",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-4 h-4 mr-1" }),
          "Skip"
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-2xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CurrentStepComponent, {}) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 border-t", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center gap-2 mb-6", children: steps.map((step, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setCurrentStep(index),
          className: cn(
            "w-2.5 h-2.5 rounded-full transition-colors",
            index === currentStep ? "bg-primary" : index < currentStep ? "bg-primary/50" : "bg-muted-foreground/30"
          ),
          "aria-label": `Go to step ${index + 1}`
        },
        step.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            onClick: handleBack,
            disabled: isFirstStep || isCompleting,
            className: cn(isFirstStep && "invisible"),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "w-4 h-4 mr-1" }),
              "Back"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
          currentStep + 1,
          " of ",
          steps.length
        ] }),
        isLastStep ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleComplete, disabled: isCompleting, children: isCompleting ? "Starting..." : "Get Started" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleNext, disabled: isCompleting, children: [
          "Next",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "w-4 h-4 ml-1" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Onboarding as default
};
