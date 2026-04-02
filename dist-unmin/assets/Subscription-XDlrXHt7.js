import { a as reactExports, j as jsxRuntimeExports, P as Primitive, m as createContextScope, h as useCallbackRef, o as useLayoutEffect2 } from "./vendor-ui-CLSr_GWM.js";
import { i as cn, x as useAuthState, d as db, B as Button, y as Bell, S as Sparkles, X, z as useTheme, b as useNavigate, a as Link, l as auth, J as Jt, u as useAuth, N as Navigate, C as Card, e as CardHeader, f as CardTitle, g as CardDescription, h as CardContent, L as LoaderCircle } from "./index-CT7EzYyk.js";
import { B as Badge } from "./badge-CRUpIyW6.js";
import { h as SmartSearchWithBoundary, a as DropdownMenu, b as DropdownMenuTrigger, c as DropdownMenuContent, m as DropdownMenuLabel, e as DropdownMenuSeparator, d as DropdownMenuItem, L as LogOut, j as EntryViewDialog } from "./EntryViewDialog-p97oVngN.js";
import { t as query, y as limit, x as orderBy, w as where, p as collection, e as onSnapshot, z as updateDoc, d as doc, D as writeBatch, f as signOut } from "./vendor-firebase-N64baH19.js";
import { S as Settings } from "./settings-B0Fe-YOB.js";
import { S as Sun, M as Moon } from "./sun-ClaBTJnm.js";
import { U as User, C as CreditCard, b as CircleHelp } from "./user-CWEc4l4g.js";
import { C as Check } from "./check-CZQFmZAj.js";
import "./vendor-charts-hYiuCXaC.js";
import "./chevron-right-fa0SEsLi.js";
import "./input-B1KmmYia.js";
import "./zap-CZIUQ85z.js";
import "./trending-up-F9qFPeih.js";
import "./dialog-qADkFQn2.js";
import "./users-C124q9JP.js";
import "./chevron-left-cv4Egzj6.js";
import "./square-check-big-Clnf_GY-.js";
var AVATAR_NAME = "Avatar";
var [createAvatarContext] = createContextScope(AVATAR_NAME);
var [AvatarProvider, useAvatarContext] = createAvatarContext(AVATAR_NAME);
var Avatar$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAvatar, ...avatarProps } = props;
    const [imageLoadingStatus, setImageLoadingStatus] = reactExports.useState("idle");
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      AvatarProvider,
      {
        scope: __scopeAvatar,
        imageLoadingStatus,
        onImageLoadingStatusChange: setImageLoadingStatus,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.span, { ...avatarProps, ref: forwardedRef })
      }
    );
  }
);
Avatar$1.displayName = AVATAR_NAME;
var IMAGE_NAME = "AvatarImage";
var AvatarImage$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAvatar, src, onLoadingStatusChange = () => {
    }, ...imageProps } = props;
    const context = useAvatarContext(IMAGE_NAME, __scopeAvatar);
    const imageLoadingStatus = useImageLoadingStatus(src, imageProps.referrerPolicy);
    const handleLoadingStatusChange = useCallbackRef((status) => {
      onLoadingStatusChange(status);
      context.onImageLoadingStatusChange(status);
    });
    useLayoutEffect2(() => {
      if (imageLoadingStatus !== "idle") {
        handleLoadingStatusChange(imageLoadingStatus);
      }
    }, [imageLoadingStatus, handleLoadingStatusChange]);
    return imageLoadingStatus === "loaded" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.img, { ...imageProps, ref: forwardedRef, src }) : null;
  }
);
AvatarImage$1.displayName = IMAGE_NAME;
var FALLBACK_NAME = "AvatarFallback";
var AvatarFallback$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeAvatar, delayMs, ...fallbackProps } = props;
    const context = useAvatarContext(FALLBACK_NAME, __scopeAvatar);
    const [canRender, setCanRender] = reactExports.useState(delayMs === void 0);
    reactExports.useEffect(() => {
      if (delayMs !== void 0) {
        const timerId = window.setTimeout(() => setCanRender(true), delayMs);
        return () => window.clearTimeout(timerId);
      }
    }, [delayMs]);
    return canRender && context.imageLoadingStatus !== "loaded" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Primitive.span, { ...fallbackProps, ref: forwardedRef }) : null;
  }
);
AvatarFallback$1.displayName = FALLBACK_NAME;
function useImageLoadingStatus(src, referrerPolicy) {
  const [loadingStatus, setLoadingStatus] = reactExports.useState("idle");
  useLayoutEffect2(() => {
    if (!src) {
      setLoadingStatus("error");
      return;
    }
    let isMounted = true;
    const image = new window.Image();
    const updateStatus = (status) => () => {
      if (!isMounted) return;
      setLoadingStatus(status);
    };
    setLoadingStatus("loading");
    image.onload = updateStatus("loaded");
    image.onerror = updateStatus("error");
    image.src = src;
    if (referrerPolicy) {
      image.referrerPolicy = referrerPolicy;
    }
    return () => {
      isMounted = false;
    };
  }, [src, referrerPolicy]);
  return loadingStatus;
}
var Root = Avatar$1;
var Image = AvatarImage$1;
var Fallback = AvatarFallback$1;
const Avatar = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root,
  {
    ref,
    className: cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    ),
    ...props
  }
));
Avatar.displayName = Root.displayName;
const AvatarImage = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Image,
  {
    ref,
    className: cn("aspect-square h-full w-full", className),
    ...props
  }
));
AvatarImage.displayName = Image.displayName;
const AvatarFallback = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Fallback,
  {
    ref,
    className: cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    ),
    ...props
  }
));
AvatarFallback.displayName = Fallback.displayName;
const INSIGHT_ICON = {
  connection: "🔗",
  pattern: "🧩",
  gap: "🕳️",
  reminder: "💡"
};
const getInsightIcon = (insightType) => insightType ? INSIGHT_ICON[insightType] ?? "✨" : "✨";
const useNotifications = () => {
  const { user } = useAuthState();
  const [notifications, setNotifications] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const unreadCount = notifications.filter((n) => n.status === "pending").length;
  const insights = notifications.filter((n) => n.type === "nova_insight");
  const systemNotifs = notifications.filter((n) => n.type !== "nova_insight");
  reactExports.useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "pending_notifications"),
      where("user_id", "==", user.uid),
      where("status", "==", "pending"),
      orderBy("created_at", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setNotifications(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              type: data.type || "reminder",
              text: data.text,
              entryId: data.entry_id || null,
              entryIds: data.entry_ids || [],
              insightType: data.insight_type,
              status: data.status,
              createdAt: data.created_at?.toDate() || /* @__PURE__ */ new Date()
            };
          })
        );
        setLoading(false);
      },
      (err) => {
        console.warn("[useNotifications] Snapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);
  const dismiss = reactExports.useCallback(async (notificationId) => {
    try {
      await updateDoc(doc(db, "pending_notifications", notificationId), {
        status: "dismissed"
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.warn("[useNotifications] Failed to dismiss:", err);
    }
  }, []);
  const dismissAll = reactExports.useCallback(async () => {
    if (!notifications.length) return;
    const batch = writeBatch(db);
    for (const n of notifications) {
      batch.update(doc(db, "pending_notifications", n.id), { status: "dismissed" });
    }
    try {
      await batch.commit();
      setNotifications([]);
    } catch (err) {
      console.warn("[useNotifications] Failed to dismiss all:", err);
    }
  }, [notifications]);
  return {
    notifications,
    insights,
    systemNotifs,
    unreadCount,
    loading,
    dismiss,
    dismissAll
  };
};
const INSIGHT_COLOR = {
  connection: "text-blue-500",
  pattern: "text-violet-500",
  gap: "text-amber-500",
  reminder: "text-emerald-500"
};
const NotificationsPanel = () => {
  const { notifications, insights, systemNotifs, unreadCount, dismiss, dismissAll } = useNotifications();
  const [open, setOpen] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: "ghost",
        size: "icon",
        className: "relative",
        onClick: () => setOpen(!open),
        "aria-label": `Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-5 w-5" }),
          unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center", children: unreadCount > 9 ? "9+" : unreadCount })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "fixed inset-0 z-40",
          onClick: () => setOpen(false)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-full mt-2 w-84 max-h-[480px] overflow-y-auto rounded-xl border bg-popover shadow-xl z-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-popover z-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold", children: "Notifications" }),
          notifications.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "text-xs h-6 text-muted-foreground hover:text-foreground",
              onClick: dismissAll,
              children: "Clear all"
            }
          )
        ] }),
        notifications.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center gap-2 py-10 px-4 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-6 w-6 text-muted-foreground/40" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "All clear — Nova's watching" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          insights.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 pt-3 pb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mb-2 px-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5 text-primary" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-primary tracking-wide uppercase", children: "Nova Insights" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: insights.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-start gap-2.5 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 hover:bg-primary/10 transition-colors",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: cn(
                        "text-sm mt-0.5 shrink-0",
                        n.insightType ? INSIGHT_COLOR[n.insightType] : "text-primary"
                      ),
                      children: getInsightIcon(n.insightType)
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-snug", children: n.text }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                      n.insightType && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "capitalize mr-1.5", children: n.insightType }),
                      "· ",
                      n.createdAt.toLocaleDateString()
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      className: "shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted transition-colors mt-0.5",
                      onClick: () => dismiss(n.id),
                      "aria-label": "Dismiss insight",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3 text-muted-foreground" })
                    }
                  )
                ]
              },
              n.id
            )) })
          ] }),
          systemNotifs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("px-3 pb-3", insights.length > 0 && "pt-3"), children: [
            insights.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground tracking-wide uppercase px-1 mb-2", children: "Other" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: systemNotifs.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-start gap-2 rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm mt-0.5 shrink-0", children: n.type === "reminder" ? "🔔" : n.type === "action_due" ? "⏰" : "📋" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: n.text }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: n.createdAt.toLocaleDateString() })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      className: "shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted transition-colors mt-0.5",
                      onClick: () => dismiss(n.id),
                      "aria-label": "Dismiss notification",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3 text-muted-foreground" })
                    }
                  )
                ]
              },
              n.id
            )) })
          ] })
        ] })
      ] })
    ] })
  ] });
};
const DashboardHeader = ({
  searchQuery,
  onSearchChange,
  userName,
  savedEntries = [],
  onEditEntry,
  onFillEntry
}) => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [viewingEntry, setViewingEntry] = reactExports.useState(null);
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Jt.success("Signed out successfully");
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
      Jt.error("Failed to sign out");
    }
  };
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  const userInitials = userName ? userName.split(" ").map((n) => n[0]).join("").toUpperCase() : "U";
  const handleSuggestionSelect = (suggestion) => {
    console.log("Selected suggestion:", suggestion);
  };
  const handleEntrySelect = (entry) => {
    setViewingEntry(entry);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-background border-b border-border px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center flex-1 max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        SmartSearchWithBoundary,
        {
          entries: savedEntries,
          searchQuery,
          onSearchChange,
          onSuggestionSelect: handleSuggestionSelect,
          onEntrySelect: handleEntrySelect,
          placeholder: "Search your entries...",
          className: "w-full"
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/settings", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "text-muted-foreground hover:text-foreground",
            title: "Settings",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "w-5 h-5" })
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationsPanel, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            className: "text-muted-foreground hover:text-foreground",
            onClick: toggleTheme,
            children: theme === "dark" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Sun, { className: "w-5 h-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Moon, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenu, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", className: "relative h-8 w-8 rounded-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { className: "h-8 w-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "bg-primary text-primary-foreground text-sm", children: userInitials }) }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuContent, { className: "w-56", align: "end", forceMount: true, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuLabel, { className: "font-normal", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium leading-none", children: userName || "User" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-none text-muted-foreground", children: "Manage your account" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => navigate("/settings"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "mr-2 h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Profile" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => navigate("/subscription"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "mr-2 h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Subscription" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: () => navigate("/user-guide"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleHelp, { className: "mr-2 h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Help & Guide" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DropdownMenuSeparator, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DropdownMenuItem, { onClick: handleSignOut, className: "text-red-600 focus:text-red-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "mr-2 h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sign out" })
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      EntryViewDialog,
      {
        entry: viewingEntry,
        isOpen: !!viewingEntry,
        onClose: () => setViewingEntry(null),
        onEdit: onEditEntry,
        onFill: onFillEntry
      }
    )
  ] });
};
const CLOUD_FUNCTIONS_URL = "https://us-central1-saveme-f5af0.cloudfunctions.net";
const STRIPE_PRICES = {
  basic: "price_basic_monthly",
  premium: "price_premium_monthly"
};
const Subscription = () => {
  const { user, isAuthenticated, session } = useAuth();
  const [loadingPlan, setLoadingPlan] = reactExports.useState(null);
  const [loadingPortal, setLoadingPortal] = reactExports.useState(false);
  if (!isAuthenticated) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/login", replace: true });
  }
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
      current: user?.subscriptionTier === "free"
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
      current: user?.subscriptionTier === "basic"
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
      current: user?.subscriptionTier === "premium"
    }
  ];
  const handleUpgrade = async (planName) => {
    console.log("handleUpgrade called with:", planName);
    if (planName === "Free") {
      console.log("Free plan selected, returning early");
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Jt.error("Please sign in to upgrade your plan");
      return;
    }
    setLoadingPlan(planName);
    try {
      const token = await currentUser.getIdToken();
      const priceId = STRIPE_PRICES[planName.toLowerCase()];
      if (!priceId) {
        Jt.error("Invalid plan selected");
        return;
      }
      const response = await fetch(`${CLOUD_FUNCTIONS_URL}/createCheckout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/subscription`
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create checkout session");
      }
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout exception:", err);
      Jt.error("An error occurred. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };
  const handleManageBilling = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Jt.error("Please sign in to manage billing");
      return;
    }
    setLoadingPortal(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${CLOUD_FUNCTIONS_URL}/customerPortal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings`
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create portal session");
      }
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err) {
      console.error("Portal error:", err);
      Jt.error("An error occurred. Please try again.");
    } finally {
      setLoadingPortal(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardHeader,
      {
        searchQuery: "",
        onSearchChange: () => {
        },
        userName: "User"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "Subscription Management" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-700", children: "Manage your plan and billing preferences" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "mb-8 bg-white border border-gray-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-gray-900", children: "Current Plan" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-gray-600", children: "Your subscription details" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "default", className: "bg-blue-600 text-white font-semibold", children: [
                user?.subscriptionTier?.toUpperCase(),
                " PLAN"
              ] }),
              user?.subscriptionActive && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-green-700 border-green-600 bg-green-50 font-medium", children: "Active" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-700", children: [
              user?.subscriptionTier === "free" && "You're on our free plan with basic features.",
              user?.subscriptionTier === "basic" && "Enjoy unlimited entries and voice features.",
              user?.subscriptionTier === "premium" && "Access to all premium features and priority support."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleManageBilling, variant: "outline", disabled: loadingPortal, className: "border-gray-300 text-gray-700 hover:bg-gray-100", children: loadingPortal ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
            "Loading..."
          ] }) : "Open Billing Portal" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-3 gap-8", children: plans.map((plan, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `relative hover:shadow-lg transition-shadow bg-white border ${plan.current ? "border-blue-500 border-2 shadow-lg" : "border-gray-200"}`, children: [
        plan.current && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white font-semibold", children: "Current Plan" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-2xl text-gray-900", children: plan.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-center mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl font-bold text-blue-600", children: plan.price }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-lg text-gray-600 ml-1", children: [
              "/",
              plan.period === "Forever" ? "forever" : "month"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-gray-600 font-medium", children: plan.period === "Forever" ? "No recurring charges" : "Billed monthly" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "mt-2 text-gray-600", children: plan.description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3 mb-6", children: plan.features.map((feature, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-5 h-5 text-green-600 mr-3 flex-shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-800", children: feature })
          ] }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              className: `w-full font-medium ${plan.current ? "bg-gray-400 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`,
              disabled: plan.current || loadingPlan === plan.name || plan.name === "Free",
              onClick: (e) => {
                e.preventDefault();
                console.log("Button clicked for plan:", plan.name, "current:", plan.current, "loading:", loadingPlan);
                handleUpgrade(plan.name);
              },
              children: loadingPlan === plan.name ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
                "Opening..."
              ] }) : plan.current ? "Current Plan" : plan.name === "Free" ? "Free Plan" : `Open ${plan.name}`
            }
          ),
          !plan.current && plan.name !== "Free" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-600 text-center mt-2", children: "14-day free trial included" })
        ] })
      ] }, index)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "mt-8 bg-white border border-gray-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-gray-900", children: "Billing Information" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-gray-600", children: "Pricing details and payment terms" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700", children: "Billing Cycle:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900", children: "Monthly (cancel anytime)" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700", children: "Free Trial:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900", children: "14 days on paid plans" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700", children: "Payment Methods:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900", children: "Credit/Debit Cards, PayPal" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-gray-700", children: "Refund Policy:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-gray-900", children: "Pro-rated refunds available" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "mt-8 bg-white border border-gray-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-gray-900", children: "Billing History" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-gray-600", children: "Your recent transactions" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-700", children: "No billing history available" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: "Transaction history will appear here once you upgrade" })
        ] }) })
      ] })
    ] })
  ] });
};
export {
  Subscription as default
};
