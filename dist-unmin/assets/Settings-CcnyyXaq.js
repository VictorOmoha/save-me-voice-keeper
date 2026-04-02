import { a as reactExports, j as jsxRuntimeExports, u as useComposedRefs, d as useControllableState, P as Primitive$1, f as composeEventHandlers, x as usePrevious, y as useSize, m as createContextScope$1, i as createCollection, t as useDirection, N as clamp, R as React } from "./vendor-ui-CLSr_GWM.js";
import { c as createLucideIcon, C as Card, e as CardHeader, f as CardTitle, h as CardContent, B as Button, J as Jt, d as db, u as useAuth, l as auth, i as cn, G as useToast, H as useUserPreferences, y as Bell, z as useTheme, L as LoaderCircle, j as Trash2, D as Download, I as Send, R as RefreshCw, M as Mic, g as CardDescription, m as Brain, s as storage, n as useSearchParams, a as Link } from "./index-CT7EzYyk.js";
import { I as Input } from "./input-B1KmmYia.js";
import { d as doc, m as setDoc, n as serverTimestamp, E as EmailAuthProvider, F as reauthenticateWithCredential, H as updatePassword, p as collection, t as query, w as where, x as orderBy, v as getDocs, q as addDoc, r as deleteDoc, y as limit, l as getDoc, z as updateDoc, A as ref, I as deleteObject, B as uploadBytes, C as getDownloadURL } from "./vendor-firebase-N64baH19.js";
import { U as User, C as CreditCard, E as Eye, a as Copy, b as CircleHelp } from "./user-CWEc4l4g.js";
import { B as Badge } from "./badge-CRUpIyW6.js";
import { D as Dialog, f as DialogTrigger, a as DialogContent, b as DialogHeader, c as DialogTitle } from "./dialog-qADkFQn2.js";
import { S as Shield, E as ExternalLink, A as Activity } from "./shield-Bq4K0s6C.js";
import { S as Sun, M as Moon } from "./sun-ClaBTJnm.js";
import { Z as Zap } from "./zap-CZIUQ85z.js";
import { L as Label } from "./label-Leg8N3DR.js";
import { P as Plus } from "./plus-DJOOR5Wx.js";
import { T as Textarea } from "./textarea-f5_v0hBa.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CyBQ8QTa.js";
import { S as Save } from "./save-5MLWtmAS.js";
import { S as Settings$1 } from "./settings-B0Fe-YOB.js";
import { A as AlertDialog, h as AlertDialogTrigger, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-CQNFQ063.js";
import { D as Database } from "./database-CENvM7Pb.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-D07uVuEF.js";
import { p as playEndOfSpeechCue, V as VOICE_OPTIONS, M as MINIMAX_VOICES, G as GOOGLE_VOICES, s as stopCurrentSpeech, a as speak } from "./textToSpeech-BNc-vD0B.js";
import { V as Volume2 } from "./volume-2-CGxA2eie.js";
import { C as CircleAlert } from "./circle-alert-6cY5Ije4.js";
import { L as Lightbulb } from "./lightbulb-10xgXUYR.js";
import { M as MessageSquare } from "./message-square-DXSTRoRr.js";
import { M as Mail } from "./mail-C7YTOEcz.js";
import { U as Upload } from "./upload-B7xhnkmR.js";
import { A as ArrowLeft } from "./arrow-left-CCcLkmU5.js";
import "./vendor-charts-hYiuCXaC.js";
import "./check-CZQFmZAj.js";
const Archive = createLucideIcon("Archive", [
  ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1", key: "1wp1u1" }],
  ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8", key: "1s80jp" }],
  ["path", { d: "M10 12h4", key: "a56b0p" }]
]);
const Bug = createLucideIcon("Bug", [
  ["path", { d: "m8 2 1.88 1.88", key: "fmnt4t" }],
  ["path", { d: "M14.12 3.88 16 2", key: "qol33r" }],
  ["path", { d: "M9 7.13v-1a3.003 3.003 0 1 1 6 0v1", key: "d7y7pr" }],
  [
    "path",
    {
      d: "M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6",
      key: "xs1cw7"
    }
  ],
  ["path", { d: "M12 20v-9", key: "1qisl0" }],
  ["path", { d: "M6.53 9C4.6 8.8 3 7.1 3 5", key: "32zzws" }],
  ["path", { d: "M6 13H2", key: "82j7cp" }],
  ["path", { d: "M3 21c0-2.1 1.7-3.9 3.8-4", key: "4p0ekp" }],
  ["path", { d: "M20.97 5c0 2.1-1.6 3.8-3.5 4", key: "18gb23" }],
  ["path", { d: "M22 13h-4", key: "1jl80f" }],
  ["path", { d: "M17.2 17c2.1.1 3.8 1.9 3.8 4", key: "k3fwyw" }]
]);
const Building = createLucideIcon("Building", [
  ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2", ry: "2", key: "76otgf" }],
  ["path", { d: "M9 22v-4h6v4", key: "r93iot" }],
  ["path", { d: "M8 6h.01", key: "1dz90k" }],
  ["path", { d: "M16 6h.01", key: "1x0f13" }],
  ["path", { d: "M12 6h.01", key: "1vi96p" }],
  ["path", { d: "M12 10h.01", key: "1nrarc" }],
  ["path", { d: "M12 14h.01", key: "1etili" }],
  ["path", { d: "M16 10h.01", key: "1m94wz" }],
  ["path", { d: "M16 14h.01", key: "1gbofw" }],
  ["path", { d: "M8 10h.01", key: "19clt8" }],
  ["path", { d: "M8 14h.01", key: "6423bh" }]
]);
const CircleCheckBig = createLucideIcon("CircleCheckBig", [
  ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335", key: "yps3ct" }],
  ["path", { d: "m9 11 3 3L22 4", key: "1pflzl" }]
]);
const Crown = createLucideIcon("Crown", [
  [
    "path",
    {
      d: "M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",
      key: "1vdc57"
    }
  ],
  ["path", { d: "M5 21h14", key: "11awu3" }]
]);
const EyeOff = createLucideIcon("EyeOff", [
  [
    "path",
    {
      d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
      key: "ct8e1f"
    }
  ],
  ["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242", key: "151rxh" }],
  [
    "path",
    {
      d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
      key: "13bj9a"
    }
  ],
  ["path", { d: "m2 2 20 20", key: "1ooewy" }]
]);
const Globe = createLucideIcon("Globe", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", key: "13o1zl" }],
  ["path", { d: "M2 12h20", key: "9i4pu4" }]
]);
const Key = createLucideIcon("Key", [
  ["path", { d: "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4", key: "g0fldk" }],
  ["path", { d: "m21 2-9.6 9.6", key: "1j0ho8" }],
  ["circle", { cx: "7.5", cy: "15.5", r: "5.5", key: "yqb3hr" }]
]);
const Monitor = createLucideIcon("Monitor", [
  ["rect", { width: "20", height: "14", x: "2", y: "3", rx: "2", key: "48i651" }],
  ["line", { x1: "8", x2: "16", y1: "21", y2: "21", key: "1svkeh" }],
  ["line", { x1: "12", x2: "12", y1: "17", y2: "21", key: "vw1qmm" }]
]);
const Palette = createLucideIcon("Palette", [
  ["circle", { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor", key: "1okk4w" }],
  ["circle", { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor", key: "f64h9f" }],
  ["circle", { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor", key: "fotxhn" }],
  ["circle", { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor", key: "qy21gx" }],
  [
    "path",
    {
      d: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",
      key: "12rzf8"
    }
  ]
]);
const Play = createLucideIcon("Play", [
  ["polygon", { points: "6 3 20 12 6 21 6 3", key: "1oa8hb" }]
]);
const Smartphone = createLucideIcon("Smartphone", [
  ["rect", { width: "14", height: "20", x: "5", y: "2", rx: "2", ry: "2", key: "1yt0o3" }],
  ["path", { d: "M12 18h.01", key: "mhygvu" }]
]);
const TestTube = createLucideIcon("TestTube", [
  ["path", { d: "M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2", key: "125lnx" }],
  ["path", { d: "M8.5 2h7", key: "csnxdl" }],
  ["path", { d: "M14.5 16h-5", key: "1ox875" }]
]);
const Video = createLucideIcon("Video", [
  [
    "path",
    {
      d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
      key: "ftymec"
    }
  ],
  ["rect", { x: "2", y: "6", width: "14", height: "12", rx: "2", key: "158x01" }]
]);
const ProfileSettings = ({ user }) => {
  const [profile, setProfile] = reactExports.useState({
    fullName: user?.displayName || "",
    email: user?.email || "",
    phone: ""
  });
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const handleSaveProfile = async () => {
    if (!user?.uid) {
      Jt.error("User not found");
      return;
    }
    setIsLoading(true);
    try {
      const profileRef = doc(db, "profiles", user.uid);
      await setDoc(profileRef, {
        id: user.uid,
        full_name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        updated_at: serverTimestamp()
      }, { merge: true });
      Jt.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Jt.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "mb-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-5 h-5" }),
        "Profile"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Update your personal information" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-1", children: "Full Name" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: profile.fullName,
            onChange: (e) => setProfile((prev) => ({ ...prev, fullName: e.target.value })),
            placeholder: "Enter your full name"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-1", children: "Email" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: profile.email,
            onChange: (e) => setProfile((prev) => ({ ...prev, email: e.target.value })),
            placeholder: "Enter your email",
            type: "email"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium text-foreground mb-1", children: "Phone" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: profile.phone,
            onChange: (e) => setProfile((prev) => ({ ...prev, phone: e.target.value })),
            placeholder: "Enter your phone number"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: handleSaveProfile,
          disabled: isLoading,
          className: "bg-primary text-primary-foreground hover:bg-primary/90",
          children: isLoading ? "Saving..." : "Save Changes"
        }
      )
    ] })
  ] });
};
const SecuritySettings = () => {
  const { user } = useAuth();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = reactExports.useState(false);
  const [passwordForm, setPasswordForm] = reactExports.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Jt.error("New passwords don't match");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      Jt.error("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
      return;
    }
    if (!user || !user.email) {
      Jt.error("No authenticated user");
      return;
    }
    setIsLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error("No authenticated user");
      }
      const credential = EmailAuthProvider.credential(firebaseUser.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, passwordForm.newPassword);
      Jt.success("Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsPasswordDialogOpen(false);
    } catch (error) {
      console.error("Error updating password:", error);
      const errorCode = error instanceof Error && "code" in error ? error.code : void 0;
      if (errorCode === "auth/wrong-password") {
        Jt.error("Current password is incorrect");
      } else {
        Jt.error("Failed to update password");
      }
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-5 h-5" }),
        "Security"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Manage your account security" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/50 rounded-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm", children: "Two-Factor Authentication" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Add an extra layer of security" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-muted-foreground", children: "Coming Soon" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isPasswordDialogOpen, onOpenChange: setIsPasswordDialogOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "w-full justify-start", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { className: "w-4 h-4 mr-2" }),
          "Change Password"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Change Password" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-1", children: "Current Password" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "password",
                  value: passwordForm.currentPassword,
                  onChange: (e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value })),
                  placeholder: "Enter current password"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-1", children: "New Password" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "password",
                  value: passwordForm.newPassword,
                  onChange: (e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value })),
                  placeholder: "Enter new password"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-1", children: "Confirm New Password" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "password",
                  value: passwordForm.confirmPassword,
                  onChange: (e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value })),
                  placeholder: "Confirm new password"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                onClick: handleChangePassword,
                disabled: isLoading,
                className: "w-full",
                children: isLoading ? "Updating..." : "Update Password"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "w-full justify-start", onClick: () => Jt.info("Device management coming soon"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "w-4 h-4 mr-2" }),
        "Manage Devices"
      ] })
    ] })
  ] });
};
var SWITCH_NAME = "Switch";
var [createSwitchContext] = createContextScope$1(SWITCH_NAME);
var [SwitchProvider, useSwitchContext] = createSwitchContext(SWITCH_NAME);
var Switch$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeSwitch,
      name,
      checked: checkedProp,
      defaultChecked,
      required,
      disabled,
      value = "on",
      onCheckedChange,
      form,
      ...switchProps
    } = props;
    const [button, setButton] = reactExports.useState(null);
    const composedRefs = useComposedRefs(forwardedRef, (node) => setButton(node));
    const hasConsumerStoppedPropagationRef = reactExports.useRef(false);
    const isFormControl = button ? form || !!button.closest("form") : true;
    const [checked = false, setChecked] = useControllableState({
      prop: checkedProp,
      defaultProp: defaultChecked,
      onChange: onCheckedChange
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(SwitchProvider, { scope: __scopeSwitch, checked, disabled, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Primitive$1.button,
        {
          type: "button",
          role: "switch",
          "aria-checked": checked,
          "aria-required": required,
          "data-state": getState(checked),
          "data-disabled": disabled ? "" : void 0,
          disabled,
          value,
          ...switchProps,
          ref: composedRefs,
          onClick: composeEventHandlers(props.onClick, (event) => {
            setChecked((prevChecked) => !prevChecked);
            if (isFormControl) {
              hasConsumerStoppedPropagationRef.current = event.isPropagationStopped();
              if (!hasConsumerStoppedPropagationRef.current) event.stopPropagation();
            }
          })
        }
      ),
      isFormControl && /* @__PURE__ */ jsxRuntimeExports.jsx(
        BubbleInput$1,
        {
          control: button,
          bubbles: !hasConsumerStoppedPropagationRef.current,
          name,
          value,
          checked,
          required,
          disabled,
          form,
          style: { transform: "translateX(-100%)" }
        }
      )
    ] });
  }
);
Switch$1.displayName = SWITCH_NAME;
var THUMB_NAME$1 = "SwitchThumb";
var SwitchThumb = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSwitch, ...thumbProps } = props;
    const context = useSwitchContext(THUMB_NAME$1, __scopeSwitch);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive$1.span,
      {
        "data-state": getState(context.checked),
        "data-disabled": context.disabled ? "" : void 0,
        ...thumbProps,
        ref: forwardedRef
      }
    );
  }
);
SwitchThumb.displayName = THUMB_NAME$1;
var BubbleInput$1 = (props) => {
  const { control, checked, bubbles = true, ...inputProps } = props;
  const ref2 = reactExports.useRef(null);
  const prevChecked = usePrevious(checked);
  const controlSize = useSize(control);
  reactExports.useEffect(() => {
    const input = ref2.current;
    const inputProto = window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(inputProto, "checked");
    const setChecked = descriptor.set;
    if (prevChecked !== checked && setChecked) {
      const event = new Event("click", { bubbles });
      setChecked.call(input, checked);
      input.dispatchEvent(event);
    }
  }, [prevChecked, checked, bubbles]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "input",
    {
      type: "checkbox",
      "aria-hidden": true,
      defaultChecked: checked,
      ...inputProps,
      tabIndex: -1,
      ref: ref2,
      style: {
        ...props.style,
        ...controlSize,
        position: "absolute",
        pointerEvents: "none",
        opacity: 0,
        margin: 0
      }
    }
  );
};
function getState(checked) {
  return checked ? "checked" : "unchecked";
}
var Root$2 = Switch$1;
var Thumb$1 = SwitchThumb;
const Switch = reactExports.forwardRef(({ className, ...props }, ref2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root$2,
  {
    className: cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref: ref2,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Thumb$1,
      {
        className: cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = Root$2.displayName;
const NotificationSettings = () => {
  const { toast } = useToast();
  const { preferences, updatePreferences, isLoading: prefsLoading } = useUserPreferences();
  const [isUpdating, setIsUpdating] = reactExports.useState(false);
  const handleNotificationChange = async (key, value) => {
    setIsUpdating(true);
    const success = await updatePreferences({ [key]: value });
    if (success) {
      toast({
        title: "Settings updated",
        description: "Notification preference has been saved."
      });
    }
    setIsUpdating(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-5 h-5" }),
        "Notifications"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Configure how you receive notifications" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm", children: "Email Notifications" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Receive updates via email" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: preferences.email_notifications,
            onCheckedChange: (checked) => handleNotificationChange("email_notifications", checked),
            disabled: prefsLoading || isUpdating
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm", children: "Push Notifications" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Get browser notifications" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: preferences.push_notifications,
            onCheckedChange: (checked) => handleNotificationChange("push_notifications", checked),
            disabled: prefsLoading || isUpdating
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm", children: "Smart Reminders" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Get reminded about important entries" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: preferences.reminder_notifications,
            onCheckedChange: (checked) => handleNotificationChange("reminder_notifications", checked),
            disabled: prefsLoading || isUpdating
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm", children: "Automation Alerts" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Notifications from automated workflows" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Switch,
          {
            checked: preferences.automation_notifications,
            onCheckedChange: (checked) => handleNotificationChange("automation_notifications", checked),
            disabled: prefsLoading || isUpdating
          }
        )
      ] })
    ] })
  ] });
};
const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const saveThemePreference = async (newTheme) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const prefsRef = doc(db, "user_preferences", user.uid);
      await setDoc(prefsRef, {
        user_id: user.uid,
        theme: newTheme,
        updated_at: serverTimestamp()
      }, { merge: true });
      toast({
        title: "Theme updated",
        description: "Your theme preference has been saved."
      });
    } catch (error) {
      console.error("Error saving theme preference:", error);
      toast({
        title: "Error",
        description: "Failed to save theme preference.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    saveThemePreference(newTheme);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Palette, { className: "w-5 h-5" }),
        "Appearance"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Customize the look and feel" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm", children: "Theme" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Choose your preferred theme" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: theme === "light" ? "default" : "outline",
              size: "sm",
              onClick: () => handleThemeChange("light"),
              disabled: isLoading,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sun, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: theme === "dark" ? "default" : "outline",
              size: "sm",
              onClick: () => handleThemeChange("dark"),
              disabled: isLoading,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Moon, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: theme === "system" ? "default" : "outline",
              size: "sm",
              onClick: () => handleThemeChange("system"),
              disabled: isLoading,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { className: "w-4 h-4" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm", children: "Language" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Select your language" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "w-3 h-3" }),
          "English"
        ] })
      ] })
    ] })
  ] });
};
const SubscriptionSettings = () => {
  const { user } = useAuth();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = reactExports.useState(false);
  const [loadingPlan, setLoadingPlan] = reactExports.useState(null);
  const [loadingPortal, setLoadingPortal] = reactExports.useState(false);
  const currentTier = user?.subscriptionTier || "free";
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "Forever",
      storage: "500 MB",
      features: ["Basic data entry", "CSV export", "Limited templates"],
      icon: CreditCard,
      current: currentTier === "free"
    },
    {
      name: "Basic",
      price: "$9",
      period: "per month",
      storage: "5 GB",
      features: ["Advanced forms", "Voice input", "Custom fields", "Priority support"],
      icon: Zap,
      current: currentTier === "basic"
    },
    {
      name: "Premium",
      price: "$19",
      period: "per month",
      storage: "50 GB",
      features: ["Automation", "API access", "Advanced analytics", "Custom branding"],
      icon: Crown,
      current: currentTier === "premium"
    },
    {
      name: "Enterprise",
      price: "Contact us",
      period: "Custom billing",
      storage: "500 GB",
      features: ["SSO", "Admin controls", "Custom integrations", "Dedicated support"],
      icon: Building,
      current: currentTier === "enterprise"
    }
  ];
  const handleUpgrade = async (planName) => {
    if (planName === "Free") return;
    if (planName === "Enterprise") {
      Jt.info("Please contact us for Enterprise pricing");
      return;
    }
    setLoadingPlan(planName);
    try {
      Jt.info("Billing is not configured in this environment yet.");
    } catch (err) {
      console.error("Checkout exception:", err);
      Jt.error("An error occurred. Please try again.");
    } finally {
      setLoadingPlan(null);
      setIsUpgradeDialogOpen(false);
    }
  };
  const handleManageBilling = async () => {
    setLoadingPortal(true);
    try {
      Jt.info("Billing is not configured in this environment yet.");
    } catch (err) {
      console.error("Portal error:", err);
      Jt.error("An error occurred. Please try again.");
    } finally {
      setLoadingPortal(false);
    }
  };
  const currentPlan = plans.find((plan) => plan.current) || plans[0];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-5 h-5" }),
        "Subscription & Billing"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Manage your subscription and billing information" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 bg-primary/10 rounded-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-medium text-sm", children: [
            currentPlan.name,
            " Plan"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            currentPlan.price,
            currentPlan.period !== "Forever" && currentPlan.period !== "Custom billing" ? `/${currentPlan.period.replace("per ", "")}` : "",
            " • Storage: ",
            currentPlan.storage
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: currentPlan.period === "Forever" ? "No recurring charges" : currentPlan.period === "Custom billing" ? "Custom billing terms" : "Monthly billing" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-primary text-primary-foreground", children: "Current" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isUpgradeDialogOpen, onOpenChange: setIsUpgradeDialogOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", className: "flex-1", children: "Upgrade Plan" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-4xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Choose Your Plan" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Clear pricing • Monthly billing • Cancel anytime • 14-day free trial on paid plans" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: plans.map((plan) => {
              const Icon = plan.icon;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `p-4 border rounded-lg ${plan.current ? "border-primary bg-primary/5" : "border-border"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "w-5 h-5" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: plan.name }),
                      plan.current && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "Current" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline mb-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold", children: plan.price }),
                      plan.period !== "Forever" && plan.period !== "Custom billing" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground ml-1", children: [
                        "/",
                        plan.period.replace("per ", "")
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-2", children: plan.period === "Forever" ? "No recurring charges" : plan.period === "Custom billing" ? "Custom terms" : "Billed monthly" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mb-3", children: [
                      "Storage: ",
                      plan.storage
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1 mb-4", children: plan.features.map((feature, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "text-xs text-muted-foreground", children: [
                      "• ",
                      feature
                    ] }, index)) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: plan.current ? "outline" : "default",
                        size: "sm",
                        className: "w-full",
                        disabled: plan.current || loadingPlan === plan.name || plan.name === "Free",
                        onClick: () => handleUpgrade(plan.name),
                        children: loadingPlan === plan.name ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
                          "Opening..."
                        ] }) : plan.current ? "Current Plan" : plan.name === "Free" ? "Free Plan" : plan.name === "Enterprise" ? "Open Enterprise Contact" : "Open Plan"
                      }
                    ),
                    !plan.current && plan.name !== "Free" && plan.name !== "Enterprise" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground text-center mt-2", children: "14-day free trial" })
                  ]
                },
                plan.name
              );
            }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outline",
            size: "sm",
            className: "flex-1",
            disabled: loadingPortal,
            onClick: handleManageBilling,
            children: loadingPortal ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
              "Loading..."
            ] }) : "Manage Billing"
          }
        )
      ] })
    ] })
  ] });
};
const ApiKeysSettings = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = reactExports.useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = reactExports.useState(false);
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [newKeyName, setNewKeyName] = reactExports.useState("");
  const [generatedKey, setGeneratedKey] = reactExports.useState(null);
  const [showGeneratedKey, setShowGeneratedKey] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user, fetchApiKeys]);
  const fetchApiKeys = reactExports.useCallback(async () => {
    if (!user) return;
    try {
      const apiKeysRef = collection(db, "api_keys");
      const q = query(
        apiKeysRef,
        where("user_id", "==", user.uid),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const keys = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        keys.push({
          id: docSnap.id,
          name: data.name || "",
          key_prefix: data.key_prefix || "",
          permissions: Array.isArray(data.permissions) ? data.permissions : ["read", "write"],
          is_active: data.is_active ?? true,
          last_used_at: data.last_used_at?.toDate?.()?.toISOString() || null,
          created_at: data.created_at?.toDate?.()?.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
        });
      });
      setApiKeys(keys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      Jt.error("Failed to load API keys");
    }
  }, [user]);
  const generateApiKey = () => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "sm_";
    for (let i = 0; i < 32; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  };
  const hashApiKey = async (apiKey) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };
  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      Jt.error("Please enter a name for your API key");
      return;
    }
    if (!user) {
      Jt.error("You must be logged in to create API keys");
      return;
    }
    setIsLoading(true);
    try {
      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);
      const keyPrefix = apiKey.substring(0, 7) + "...";
      const apiKeysRef = collection(db, "api_keys");
      await addDoc(apiKeysRef, {
        user_id: user.uid,
        name: newKeyName.trim(),
        key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions: ["read", "write"],
        is_active: true,
        created_at: serverTimestamp()
      });
      setGeneratedKey(apiKey);
      setNewKeyName("");
      fetchApiKeys();
      Jt.success("API key created successfully");
    } catch (error) {
      console.error("Error creating API key:", error);
      Jt.error("Failed to create API key");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteApiKey = async (id) => {
    try {
      const keyRef = doc(db, "api_keys", id);
      await deleteDoc(keyRef);
      fetchApiKeys();
      Jt.success("API key deleted successfully");
    } catch (error) {
      console.error("Error deleting API key:", error);
      Jt.error("Failed to delete API key");
    }
  };
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Jt.success("Copied to clipboard");
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { className: "w-5 h-5" }),
        "API Keys"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Generate API keys to connect Save Me with Make.com and other automation platforms" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm", children: "Your API Keys" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            apiKeys.length,
            " keys created"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isCreateDialogOpen, onOpenChange: setIsCreateDialogOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-1" }),
            "Create API Key"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Create New API Key" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "keyName", children: "API Key Name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "keyName",
                    value: newKeyName,
                    onChange: (e) => setNewKeyName(e.target.value),
                    placeholder: "e.g., Make.com Integration"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: handleCreateApiKey,
                  className: "w-full",
                  disabled: isLoading,
                  children: isLoading ? "Creating..." : "Create API Key"
                }
              ),
              generatedKey && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-muted rounded-lg space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-green-600", children: "API Key Created!" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      value: showGeneratedKey ? generatedKey : "••••••••••••••••••••••••••••••••••••",
                      readOnly: true,
                      className: "font-mono text-xs"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: () => setShowGeneratedKey(!showGeneratedKey),
                      children: showGeneratedKey ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      variant: "outline",
                      size: "sm",
                      onClick: () => copyToClipboard(generatedKey),
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4" })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Save this API key securely. You won't be able to see it again." })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        apiKeys.map((apiKey) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: apiKey.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Badge,
                {
                  variant: apiKey.is_active ? "secondary" : "outline",
                  className: apiKey.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "",
                  children: apiKey.is_active ? "Active" : "Inactive"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                "Key: ",
                apiKey.key_prefix
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                "Created: ",
                formatDate(apiKey.created_at)
              ] }),
              apiKey.last_used_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                "Last used: ",
                formatDate(apiKey.last_used_at)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => copyToClipboard(`API Key: ${apiKey.key_prefix} (Use the full key from when you created it)`),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-3 h-3" })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => handleDeleteApiKey(apiKey.id),
                className: "text-red-600 hover:text-red-700",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
              }
            )
          ] })
        ] }, apiKey.id)),
        apiKeys.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6 text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { className: "w-8 h-8 mx-auto mb-2 opacity-50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "No API keys created yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", children: "Create your first API key to start automating with Make.com" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm mb-2", children: "How to use with Make.com:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "text-xs text-muted-foreground space-y-1 list-decimal list-inside", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Create an API key above" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "In Make.com, add an HTTP module" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Set the URL to your Firebase Cloud Function endpoint (setup required)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            "Add header: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-background px-1 rounded", children: "Authorization: Bearer YOUR_API_KEY" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Configure your automation triggers and actions" })
        ] })
      ] })
    ] })
  ] });
};
const SavedWebhookConfigs = ({
  currentFields,
  currentWebhookUrl,
  onLoadConfig,
  userTier = "free"
}) => {
  const [savedConfigs, setSavedConfigs] = reactExports.useState(() => {
    const saved = localStorage.getItem("savedWebhookConfigs");
    return saved ? JSON.parse(saved) : [];
  });
  const [isDialogOpen, setIsDialogOpen] = reactExports.useState(false);
  const [configName, setConfigName] = reactExports.useState("");
  const getLimitForTier = (tier) => {
    switch (tier) {
      case "free":
        return 3;
      case "basic":
        return 10;
      case "premium":
        return 20;
      default:
        return 3;
    }
  };
  const limit2 = getLimitForTier(userTier);
  const canSaveMore = savedConfigs.length < limit2;
  const handleSaveConfig = () => {
    if (!configName.trim()) {
      Jt.error("Please enter a configuration name");
      return;
    }
    if (!canSaveMore) {
      Jt.error(`You've reached the limit of ${limit2} saved configurations for your ${userTier} plan`);
      return;
    }
    const newConfig = {
      id: Date.now().toString(),
      name: configName.trim(),
      webhookUrl: currentWebhookUrl,
      fields: currentFields,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem("savedWebhookConfigs", JSON.stringify(updatedConfigs));
    Jt.success(`Configuration "${configName}" saved successfully!`);
    setConfigName("");
    setIsDialogOpen(false);
  };
  const handleDeleteConfig = (configId) => {
    const updatedConfigs = savedConfigs.filter((config) => config.id !== configId);
    setSavedConfigs(updatedConfigs);
    localStorage.setItem("savedWebhookConfigs", JSON.stringify(updatedConfigs));
    Jt.success("Configuration deleted");
  };
  const handleLoadConfig = (config) => {
    onLoadConfig(config);
    Jt.success(`Configuration "${config.name}" loaded`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-5 h-5" }),
          "Saved Webhook Configurations"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", children: [
          savedConfigs.length,
          "/",
          limit2,
          " saved"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Save and reuse webhook testing configurations for different use cases" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
          "Current tier: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "capitalize", children: userTier })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              disabled: !canSaveMore,
              className: "flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4" }),
                "Save Current Config"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Save Webhook Configuration" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "config-name", children: "Configuration Name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "config-name",
                    value: configName,
                    onChange: (e) => setConfigName(e.target.value),
                    placeholder: "e.g., Car Warranty Notifications"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Current Configuration Preview" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground space-y-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Webhook URL:" }),
                    " ",
                    currentWebhookUrl || "Not set"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Fields:" }),
                    " ",
                    currentFields.length,
                    " configured"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-20 overflow-y-auto bg-muted/50 p-2 rounded text-xs", children: currentFields.map((field, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    field.label,
                    " (",
                    field.key,
                    "): ",
                    field.value
                  ] }, index)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSaveConfig, className: "w-full", children: "Save Configuration" })
            ] })
          ] })
        ] })
      ] }),
      !canSaveMore && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-yellow-800 dark:text-yellow-200", children: [
        "You've reached the limit for your ",
        userTier,
        " plan. Upgrade to save more configurations."
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: savedConfigs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-muted-foreground py-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: "No saved configurations yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", children: "Save your current webhook setup to reuse it later" })
      ] }) : savedConfigs.map((config) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-sm", children: config.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
            config.fields.length,
            " fields • Created ",
            new Date(config.createdAt).toLocaleDateString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground truncate max-w-xs", children: config.webhookUrl })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => handleLoadConfig(config),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-3 h-3 mr-1" }),
                "Load"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => handleDeleteConfig(config.id),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3 h-3" })
            }
          )
        ] })
      ] }, config.id)) }),
      userTier === "free" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground text-center", children: "Upgrade to Basic (10 configs) or Premium (20 configs) for more saved configurations" })
    ] })
  ] });
};
const WebhookTesting = () => {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = reactExports.useState("https://hooks.zapier.com/hooks/catch/23790183/u2t2vvq/");
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const [latestEntry, setLatestEntry] = reactExports.useState(null);
  const [userEmail, setUserEmail] = reactExports.useState("omohavictor@gmail.com");
  const [currentConfigName, setCurrentConfigName] = reactExports.useState("Default Configuration");
  const [testFields, setTestFields] = reactExports.useState([
    { key: "entryTitle", type: "text", value: "Sample Car Warranty", label: "Entry Title" },
    { key: "expirationDate", type: "date", value: "2026-08-01", label: "Expiration Date" },
    { key: "userEmail", type: "email", value: "omohavictor@gmail.com", label: "User Email" }
  ]);
  reactExports.useEffect(() => {
    const savedWebhookUrl = localStorage.getItem("zapierWebhookUrl");
    if (savedWebhookUrl) {
      setWebhookUrl(savedWebhookUrl);
    }
    if (user?.email) {
      setUserEmail(user.email);
      setTestFields((prev) => prev.map(
        (field) => field.key === "userEmail" ? { ...field, value: user.email || "" } : field
      ));
    }
    loadLatestEntry();
  }, [user, loadLatestEntry]);
  const loadLatestEntry = reactExports.useCallback(async () => {
    if (!user) return;
    try {
      const entriesRef = collection(db, "entries");
      const q = query(
        entriesRef,
        where("user_id", "==", user.uid),
        orderBy("updated_at", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        const entry = {
          id: docSnap.id,
          title: data.title || "",
          fields: typeof data.fields === "object" && data.fields !== null ? data.fields : {},
          created_at: data.created_at?.toDate?.()?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: data.updated_at?.toDate?.()?.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
        };
        setLatestEntry(entry);
        const expirationDate = entry.fields?.expirationDate || entry.fields?.["Expiration Date"] || entry.fields?.["expiration_date"] || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        setTestFields((prev) => prev.map((field) => {
          if (field.key === "entryTitle") {
            return { ...field, value: entry.title };
          }
          if (field.key === "expirationDate") {
            return { ...field, value: expirationDate };
          }
          return field;
        }));
      }
    } catch (error) {
      console.error("Error loading latest entry:", error);
    }
  }, [user]);
  const handleSaveWebhookUrl = () => {
    localStorage.setItem("zapierWebhookUrl", webhookUrl);
    Jt.success("Webhook URL saved successfully!");
  };
  const handleAddField = () => {
    const newField = {
      key: `field_${Date.now()}`,
      type: "text",
      value: "",
      label: "New Field"
    };
    setTestFields((prev) => [...prev, newField]);
  };
  const handleRemoveField = (index) => {
    setTestFields((prev) => prev.filter((_, i) => i !== index));
  };
  const handleUpdateField = (index, updates) => {
    setTestFields((prev) => prev.map(
      (field, i) => i === index ? { ...field, ...updates } : field
    ));
  };
  const handleLoadConfig = (config) => {
    setWebhookUrl(config.webhookUrl);
    setTestFields(config.fields);
    setCurrentConfigName(config.name);
  };
  const buildTestPayload = () => {
    const payload = {};
    testFields.forEach((field) => {
      payload[field.key] = field.value;
    });
    return {
      ...payload,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      source: "Save Me",
      testMode: true,
      configurationName: currentConfigName
    };
  };
  const handleSendTestPayload = async () => {
    if (!webhookUrl) {
      Jt.error("Please enter a webhook URL");
      return;
    }
    setIsLoading(true);
    console.log("Sending test payload to Zapier webhook:", webhookUrl);
    try {
      const payload = buildTestPayload();
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        mode: "no-cors",
        body: JSON.stringify(payload)
      });
      Jt.success("Test payload sent to Zapier! Check your Zap's history to confirm it was received.");
      console.log("Test payload sent successfully", payload);
    } catch (error) {
      console.error("Error sending test payload:", error);
      Jt.error("Failed to send test payload. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSendActualEntry = async () => {
    if (!webhookUrl) {
      Jt.error("Please enter a webhook URL");
      return;
    }
    if (!latestEntry) {
      Jt.error("No entries available to send");
      return;
    }
    setIsLoading(true);
    console.log("Sending actual entry data to Zapier webhook:", webhookUrl);
    try {
      const expirationDate = latestEntry.fields?.expirationDate || latestEntry.fields?.["Expiration Date"] || latestEntry.fields?.["expiration_date"] || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const payload = {
        entryTitle: latestEntry.title,
        expirationDate,
        userEmail,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        source: "Save Me",
        testMode: false,
        entryData: latestEntry,
        eventType: "entry.created"
      };
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        mode: "no-cors",
        body: JSON.stringify(payload)
      });
      Jt.success("Actual entry data sent to Zapier! Check your Zap's history to confirm it was received.");
      console.log("Actual entry data sent successfully");
    } catch (error) {
      console.error("Error sending actual entry data:", error);
      Jt.error("Failed to send actual entry data. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleRefreshData = async () => {
    await loadLatestEntry();
    Jt.success("Latest entry data refreshed!");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SavedWebhookConfigs,
      {
        currentFields: testFields,
        currentWebhookUrl: webhookUrl,
        onLoadConfig: handleLoadConfig,
        userTier: user?.subscriptionTier || "free"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TestTube, { className: "w-5 h-5" }),
          "Webhook Testing - ",
          currentConfigName
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Test your webhook integration by sending customizable test payloads or actual data" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "webhook-url", children: "Webhook URL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "webhook-url",
                value: webhookUrl,
                onChange: (e) => setWebhookUrl(e.target.value),
                placeholder: "https://hooks.zapier.com/hooks/catch/...",
                className: "flex-1"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSaveWebhookUrl, variant: "outline", size: "sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "w-4 h-4 mr-1" }),
              "Save"
            ] })
          ] })
        ] }),
        latestEntry && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/50 p-4 rounded-lg space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "Latest Entry Data" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleRefreshData, variant: "outline", size: "sm", children: "Refresh" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Title:" }),
            " ",
            latestEntry.title
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Last Updated:" }),
            " ",
            new Date(latestEntry.updated_at).toLocaleString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Expiration Date:" }),
            " ",
            latestEntry.fields?.expirationDate || latestEntry.fields?.["Expiration Date"] || "Not set"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "Test Payload Fields" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleAddField, variant: "outline", size: "sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "w-4 h-4 mr-1" }),
              "Add Field"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: testFields.map((field, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Field Key" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: field.key,
                  onChange: (e) => handleUpdateField(index, { key: e.target.value }),
                  placeholder: "fieldName",
                  className: "text-sm"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Label" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: field.label,
                  onChange: (e) => handleUpdateField(index, { label: e.target.value }),
                  placeholder: "Field Label",
                  className: "text-sm"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: field.type,
                  onValueChange: (value) => handleUpdateField(index, { type: value }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "text", children: "Text" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "email", children: "Email" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "date", children: "Date" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "number", children: "Number" })
                    ] })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Value" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: field.type === "date" ? "date" : field.type === "number" ? "number" : field.type,
                  value: field.value,
                  onChange: (e) => handleUpdateField(index, { value: e.target.value }),
                  placeholder: "Field value",
                  className: "text-sm"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                onClick: () => handleRemoveField(index),
                variant: "outline",
                size: "sm",
                className: "w-full",
                disabled: testFields.length === 1,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
              }
            ) })
          ] }, index)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Payload Preview" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              readOnly: true,
              value: JSON.stringify(buildTestPayload(), null, 2),
              rows: 8,
              className: "font-mono text-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleSendTestPayload,
              disabled: isLoading,
              className: "flex-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-4 h-4 mr-2" }),
                isLoading ? "Sending..." : "Send Test Payload"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleSendActualEntry,
              disabled: isLoading || !latestEntry,
              variant: "outline",
              className: "flex-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-4 h-4 mr-2" }),
                "Send Latest Entry Data"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "• Configure custom fields above to match your webhook requirements" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "• Test payload sends the configured sample data above" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "• Latest Entry Data sends your most recent saved entry" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "• Webhooks are automatically triggered when you create or update entries" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "• Check your webhook destination to see received data" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "• Save different configurations for various webhook testing scenarios" })
        ] })
      ] })
    ] })
  ] });
};
const AutomationSettings = () => {
  const [platforms, setPlatforms] = reactExports.useState([
    { id: "n8n", name: "n8n", connected: false },
    { id: "make", name: "Make.com", connected: false },
    { id: "zapier", name: "Zapier", connected: false },
    { id: "webhook", name: "Custom Webhook", connected: false }
  ]);
  const [selectedPlatform, setSelectedPlatform] = reactExports.useState(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = reactExports.useState(false);
  const [configForm, setConfigForm] = reactExports.useState({ apiKey: "", webhookUrl: "" });
  const handleConnect = (platform) => {
    setSelectedPlatform(platform);
    setConfigForm({ apiKey: platform.apiKey || "", webhookUrl: platform.webhookUrl || "" });
    setIsConfigDialogOpen(true);
  };
  const handleSaveConfig = () => {
    if (!selectedPlatform) return;
    setPlatforms((prev) => prev.map(
      (p) => p.id === selectedPlatform.id ? {
        ...p,
        connected: true,
        apiKey: configForm.apiKey,
        webhookUrl: configForm.webhookUrl
      } : p
    ));
    Jt.success(`${selectedPlatform.name} connected successfully`);
    setIsConfigDialogOpen(false);
    setSelectedPlatform(null);
  };
  const handleDisconnect = (platformId) => {
    setPlatforms((prev) => prev.map(
      (p) => p.id === platformId ? { ...p, connected: false, apiKey: "", webhookUrl: "" } : p
    ));
    Jt.success("Platform disconnected");
  };
  const connectedCount = platforms.filter((p) => p.connected).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ApiKeysSettings, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WebhookTesting, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-5 h-5" }),
          "Platform Connections"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Configure automation and integrations with external platforms" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-sm", children: "Connected Platforms" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              connectedCount,
              " platforms connected"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => window.open("https://www.make.com/en/integrations", "_blank"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-4 h-4 mr-1" }),
                "Browse Integrations"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: platforms.map((platform) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: platform.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Badge,
              {
                variant: platform.connected ? "secondary" : "outline",
                className: platform.connected ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "",
                children: platform.connected ? "Connected" : "Not Connected"
              }
            ),
            platform.connected ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => handleDisconnect(platform.id),
                children: "Disconnect"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => handleConnect(platform),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings$1, { className: "w-3 h-3" })
              }
            )
          ] })
        ] }, platform.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isConfigDialogOpen, onOpenChange: setIsConfigDialogOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: selectedPlatform ? `Configure ${selectedPlatform.name}` : "Select Platform" }) }),
          selectedPlatform && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-1", children: "API Key (Optional)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: configForm.apiKey,
                  onChange: (e) => setConfigForm((prev) => ({ ...prev, apiKey: e.target.value })),
                  placeholder: "Enter API key if required"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-sm font-medium mb-1", children: "Webhook URL" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: configForm.webhookUrl,
                  onChange: (e) => setConfigForm((prev) => ({ ...prev, webhookUrl: e.target.value })),
                  placeholder: "Enter webhook URL"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleSaveConfig, className: "w-full", children: "Connect Platform" })
          ] })
        ] }) })
      ] })
    ] })
  ] });
};
function createContextScope(scopeName, createContextScopeDeps = []) {
  let defaultContexts = [];
  function createContext3(rootComponentName, defaultContext) {
    const BaseContext = reactExports.createContext(defaultContext);
    const index = defaultContexts.length;
    defaultContexts = [...defaultContexts, defaultContext];
    const Provider = (props) => {
      const { scope, children, ...context } = props;
      const Context = scope?.[scopeName]?.[index] || BaseContext;
      const value = reactExports.useMemo(() => context, Object.values(context));
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Context.Provider, { value, children });
    };
    Provider.displayName = rootComponentName + "Provider";
    function useContext2(consumerName, scope) {
      const Context = scope?.[scopeName]?.[index] || BaseContext;
      const context = reactExports.useContext(Context);
      if (context) return context;
      if (defaultContext !== void 0) return defaultContext;
      throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    return [Provider, useContext2];
  }
  const createScope = () => {
    const scopeContexts = defaultContexts.map((defaultContext) => {
      return reactExports.createContext(defaultContext);
    });
    return function useScope(scope) {
      const contexts = scope?.[scopeName] || scopeContexts;
      return reactExports.useMemo(
        () => ({ [`__scope${scopeName}`]: { ...scope, [scopeName]: contexts } }),
        [scope, contexts]
      );
    };
  };
  createScope.scopeName = scopeName;
  return [createContext3, composeContextScopes(createScope, ...createContextScopeDeps)];
}
function composeContextScopes(...scopes) {
  const baseScope = scopes[0];
  if (scopes.length === 1) return baseScope;
  const createScope = () => {
    const scopeHooks = scopes.map((createScope2) => ({
      useScope: createScope2(),
      scopeName: createScope2.scopeName
    }));
    return function useComposedScopes(overrideScopes) {
      const nextScopes = scopeHooks.reduce((nextScopes2, { useScope, scopeName }) => {
        const scopeProps = useScope(overrideScopes);
        const currentScope = scopeProps[`__scope${scopeName}`];
        return { ...nextScopes2, ...currentScope };
      }, {});
      return reactExports.useMemo(() => ({ [`__scope${baseScope.scopeName}`]: nextScopes }), [nextScopes]);
    };
  };
  createScope.scopeName = baseScope.scopeName;
  return createScope;
}
function setRef(ref2, value) {
  if (typeof ref2 === "function") {
    return ref2(value);
  } else if (ref2 !== null && ref2 !== void 0) {
    ref2.current = value;
  }
}
function composeRefs(...refs) {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref2) => {
      const cleanup = setRef(ref2, node);
      if (!hasCleanup && typeof cleanup == "function") {
        hasCleanup = true;
      }
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup == "function") {
            cleanup();
          } else {
            setRef(refs[i], null);
          }
        }
      };
    }
  };
}
// @__NO_SIDE_EFFECTS__
function createSlot(ownerName) {
  const SlotClone = /* @__PURE__ */ createSlotClone(ownerName);
  const Slot2 = reactExports.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    const childrenArray = reactExports.Children.toArray(children);
    const slottable = childrenArray.find(isSlottable);
    if (slottable) {
      const newElement = slottable.props.children;
      const newChildren = childrenArray.map((child) => {
        if (child === slottable) {
          if (reactExports.Children.count(newElement) > 1) return reactExports.Children.only(null);
          return reactExports.isValidElement(newElement) ? newElement.props.children : null;
        } else {
          return child;
        }
      });
      return /* @__PURE__ */ jsxRuntimeExports.jsx(SlotClone, { ...slotProps, ref: forwardedRef, children: reactExports.isValidElement(newElement) ? reactExports.cloneElement(newElement, void 0, newChildren) : null });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(SlotClone, { ...slotProps, ref: forwardedRef, children });
  });
  Slot2.displayName = `${ownerName}.Slot`;
  return Slot2;
}
// @__NO_SIDE_EFFECTS__
function createSlotClone(ownerName) {
  const SlotClone = reactExports.forwardRef((props, forwardedRef) => {
    const { children, ...slotProps } = props;
    if (reactExports.isValidElement(children)) {
      const childrenRef = getElementRef(children);
      const props2 = mergeProps(slotProps, children.props);
      if (children.type !== reactExports.Fragment) {
        props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
      }
      return reactExports.cloneElement(children, props2);
    }
    return reactExports.Children.count(children) > 1 ? reactExports.Children.only(null) : null;
  });
  SlotClone.displayName = `${ownerName}.SlotClone`;
  return SlotClone;
}
var SLOTTABLE_IDENTIFIER = /* @__PURE__ */ Symbol("radix.slottable");
function isSlottable(child) {
  return reactExports.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
}
function mergeProps(slotProps, childProps) {
  const overrideProps = { ...childProps };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args) => {
          const result = childPropValue(...args);
          slotPropValue(...args);
          return result;
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === "style") {
      overrideProps[propName] = { ...slotPropValue, ...childPropValue };
    } else if (propName === "className") {
      overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
    }
  }
  return { ...slotProps, ...overrideProps };
}
function getElementRef(element) {
  let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
  let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.ref;
  }
  getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
  mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.props.ref;
  }
  return element.props.ref || element.ref;
}
var NODES = [
  "a",
  "button",
  "div",
  "form",
  "h2",
  "h3",
  "img",
  "input",
  "label",
  "li",
  "nav",
  "ol",
  "p",
  "select",
  "span",
  "svg",
  "ul"
];
var Primitive = NODES.reduce((primitive, node) => {
  const Slot = /* @__PURE__ */ createSlot(`Primitive.${node}`);
  const Node = reactExports.forwardRef((props, forwardedRef) => {
    const { asChild, ...primitiveProps } = props;
    const Comp = asChild ? Slot : node;
    if (typeof window !== "undefined") {
      window[/* @__PURE__ */ Symbol.for("radix-ui")] = true;
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Comp, { ...primitiveProps, ref: forwardedRef });
  });
  Node.displayName = `Primitive.${node}`;
  return { ...primitive, [node]: Node };
}, {});
var PROGRESS_NAME = "Progress";
var DEFAULT_MAX = 100;
var [createProgressContext] = createContextScope(PROGRESS_NAME);
var [ProgressProvider, useProgressContext] = createProgressContext(PROGRESS_NAME);
var Progress$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeProgress,
      value: valueProp = null,
      max: maxProp,
      getValueLabel = defaultGetValueLabel,
      ...progressProps
    } = props;
    if ((maxProp || maxProp === 0) && !isValidMaxNumber(maxProp)) {
      console.error(getInvalidMaxError(`${maxProp}`, "Progress"));
    }
    const max = isValidMaxNumber(maxProp) ? maxProp : DEFAULT_MAX;
    if (valueProp !== null && !isValidValueNumber(valueProp, max)) {
      console.error(getInvalidValueError(`${valueProp}`, "Progress"));
    }
    const value = isValidValueNumber(valueProp, max) ? valueProp : null;
    const valueLabel = isNumber(value) ? getValueLabel(value, max) : void 0;
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressProvider, { scope: __scopeProgress, value, max, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "aria-valuemax": max,
        "aria-valuemin": 0,
        "aria-valuenow": isNumber(value) ? value : void 0,
        "aria-valuetext": valueLabel,
        role: "progressbar",
        "data-state": getProgressState(value, max),
        "data-value": value ?? void 0,
        "data-max": max,
        ...progressProps,
        ref: forwardedRef
      }
    ) });
  }
);
Progress$1.displayName = PROGRESS_NAME;
var INDICATOR_NAME = "ProgressIndicator";
var ProgressIndicator = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeProgress, ...indicatorProps } = props;
    const context = useProgressContext(INDICATOR_NAME, __scopeProgress);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive.div,
      {
        "data-state": getProgressState(context.value, context.max),
        "data-value": context.value ?? void 0,
        "data-max": context.max,
        ...indicatorProps,
        ref: forwardedRef
      }
    );
  }
);
ProgressIndicator.displayName = INDICATOR_NAME;
function defaultGetValueLabel(value, max) {
  return `${Math.round(value / max * 100)}%`;
}
function getProgressState(value, maxValue) {
  return value == null ? "indeterminate" : value === maxValue ? "complete" : "loading";
}
function isNumber(value) {
  return typeof value === "number";
}
function isValidMaxNumber(max) {
  return isNumber(max) && !isNaN(max) && max > 0;
}
function isValidValueNumber(value, max) {
  return isNumber(value) && !isNaN(value) && value <= max && value >= 0;
}
function getInvalidMaxError(propValue, componentName) {
  return `Invalid prop \`max\` of value \`${propValue}\` supplied to \`${componentName}\`. Only numbers greater than 0 are valid max values. Defaulting to \`${DEFAULT_MAX}\`.`;
}
function getInvalidValueError(propValue, componentName) {
  return `Invalid prop \`value\` of value \`${propValue}\` supplied to \`${componentName}\`. The \`value\` prop must be:
  - a positive number
  - less than the value passed to \`max\` (or ${DEFAULT_MAX} if no \`max\` prop is set)
  - \`null\` or \`undefined\` if the progress is indeterminate.

Defaulting to \`null\`.`;
}
var Root$1 = Progress$1;
var Indicator = ProgressIndicator;
const Progress = reactExports.forwardRef(({ className, value, ...props }, ref2) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root$1,
  {
    ref: ref2,
    className: cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Indicator,
      {
        className: "h-full w-full flex-1 bg-primary transition-all",
        style: { transform: `translateX(-${100 - (value || 0)}%)` }
      }
    )
  }
));
Progress.displayName = Root$1.displayName;
const EnhancedDataManagementSettings = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [storageStats, setStorageStats] = reactExports.useState({
    entries: 0,
    apiKeys: 0,
    totalSize: 0,
    lastBackup: null
  });
  const [isExporting, setIsExporting] = reactExports.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = reactExports.useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (user) {
      loadStorageStats();
    }
  }, [user, loadStorageStats]);
  reactExports.useEffect(() => {
    const handleNovaExport = (e) => {
      const event = e;
      const format = (event.detail?.format || "json").toLowerCase();
      if (format === "json") {
        handleExportAllData();
      } else {
        handleExportAllData();
      }
    };
    window.addEventListener("nova:export-data", handleNovaExport);
    return () => window.removeEventListener("nova:export-data", handleNovaExport);
  }, [handleExportAllData]);
  const loadStorageStats = reactExports.useCallback(async () => {
    if (!user) return;
    try {
      const entriesRef = collection(db, "entries");
      const entriesQuery = query(entriesRef, where("user_id", "==", user.uid));
      const entriesSnapshot = await getDocs(entriesQuery);
      let apiKeysCount = 0;
      try {
        const apiKeysRef = collection(db, "api_keys");
        const apiKeysQuery = query(apiKeysRef, where("user_id", "==", user.uid));
        const apiKeysSnapshot = await getDocs(apiKeysQuery);
        apiKeysCount = apiKeysSnapshot.size;
      } catch (error) {
      }
      setStorageStats({
        entries: entriesSnapshot.size,
        apiKeys: apiKeysCount,
        totalSize: (entriesSnapshot.size + apiKeysCount) * 1024,
        // Rough estimate
        lastBackup: null
      });
    } catch (error) {
      console.error("Error loading storage stats:", error);
    }
  }, [user]);
  const handleExportAllData = reactExports.useCallback(async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const entriesRef = collection(db, "entries");
      const entriesQuery = query(entriesRef, where("user_id", "==", user.uid));
      const entriesSnapshot = await getDocs(entriesQuery);
      const entries = entriesSnapshot.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() }));
      let preferences = {};
      try {
        const prefsRef = doc(db, "user_preferences", user.uid);
        const prefsSnap = await getDoc(prefsRef);
        if (prefsSnap.exists()) {
          preferences = prefsSnap.data();
        }
      } catch (error) {
        console.log("No preferences found");
      }
      let apiKeys = [];
      try {
        const apiKeysRef = collection(db, "api_keys");
        const apiKeysQuery = query(apiKeysRef, where("user_id", "==", user.uid));
        const apiKeysSnapshot = await getDocs(apiKeysQuery);
        apiKeys = apiKeysSnapshot.docs.map((doc2) => {
          const data = doc2.data();
          return {
            id: doc2.id,
            name: data.name,
            key_prefix: data.key_prefix,
            permissions: data.permissions,
            is_active: data.is_active,
            created_at: data.created_at?.toDate?.() || data.created_at,
            last_used_at: data.last_used_at?.toDate?.() || data.last_used_at
          };
        });
      } catch (error) {
        console.log("No API keys found");
      }
      const exportData = {
        exportDate: (/* @__PURE__ */ new Date()).toISOString(),
        user: {
          id: user.uid,
          email: user.email
        },
        entries,
        preferences,
        apiKeys,
        metadata: {
          totalEntries: entries.length,
          totalApiKeys: apiKeys.length
        }
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-export-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Export complete",
        description: "Your data has been exported successfully."
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [user, toast]);
  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await handleExportAllData();
      setStorageStats((prev) => ({ ...prev, lastBackup: /* @__PURE__ */ new Date() }));
      toast({
        title: "Backup created",
        description: "Your data backup has been created and downloaded."
      });
    } catch (error) {
      toast({
        title: "Backup failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };
  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      toast({
        title: "Account deletion requested",
        description: "Please contact support to complete account deletion."
      });
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };
  const storageUsedPercent = Math.min(storageStats.totalSize / (10 * 1024 * 1024) * 100, 100);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "w-5 h-5" }),
        "Data Management"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Manage your data, backups, and account" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium", children: "Storage Overview" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center p-3 bg-muted rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-primary", children: storageStats.entries }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Entries" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center p-3 bg-muted rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold text-primary", children: storageStats.apiKeys }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "API Keys" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center p-3 bg-muted rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-bold text-primary", children: [
              (storageStats.totalSize / 1024).toFixed(1),
              "KB"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Used" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center p-3 bg-muted rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-bold text-primary", children: [
              storageUsedPercent.toFixed(1),
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Of Limit" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Storage Used" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              (storageStats.totalSize / 1024).toFixed(1),
              "KB / 10MB"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: storageUsedPercent, className: "h-2" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium", children: "Data Export" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleExportAllData,
              disabled: isExporting || storageStats.entries === 0,
              className: "flex-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4 mr-2" }),
                isExporting ? "Exporting..." : "Export All Data"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: handleCreateBackup,
              disabled: isCreatingBackup,
              variant: "outline",
              className: "flex-1",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Archive, { className: "w-4 h-4 mr-2" }),
                isCreatingBackup ? "Creating..." : "Create Backup"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Export includes all entries, settings, and API keys (excluding sensitive data)." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium", children: "Data Privacy" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 border rounded-lg space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-4 h-4 text-green-600" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: "Your data is encrypted and secure" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "text-sm text-muted-foreground space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• All data is stored securely with encryption at rest" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• API keys are hashed and cannot be recovered" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• Voice data is processed locally when possible" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "• You can export or delete your data at any time" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium", children: "Account Actions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              onClick: loadStorageStats,
              variant: "outline",
              className: "w-full",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 mr-2" }),
                "Refresh Storage Stats"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialog, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "destructive", className: "w-full", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4 mr-2" }),
              "Delete Account"
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: "Delete Account" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
                  "This action cannot be undone. This will permanently delete your account and remove all your data from our servers.",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "This will delete:" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "list-disc list-inside mt-2 space-y-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      storageStats.entries,
                      " entries"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                      storageStats.apiKeys,
                      " API keys"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "All preferences and settings" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Account information" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { children: "Cancel" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  AlertDialogAction,
                  {
                    onClick: handleDeleteAccount,
                    disabled: isDeletingAccount,
                    className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    children: isDeletingAccount ? "Deleting..." : "Delete Account"
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
var PAGE_KEYS = ["PageUp", "PageDown"];
var ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
var BACK_KEYS = {
  "from-left": ["Home", "PageDown", "ArrowDown", "ArrowLeft"],
  "from-right": ["Home", "PageDown", "ArrowDown", "ArrowRight"],
  "from-bottom": ["Home", "PageDown", "ArrowDown", "ArrowLeft"],
  "from-top": ["Home", "PageDown", "ArrowUp", "ArrowLeft"]
};
var SLIDER_NAME = "Slider";
var [Collection, useCollection, createCollectionScope] = createCollection(SLIDER_NAME);
var [createSliderContext] = createContextScope$1(SLIDER_NAME, [
  createCollectionScope
]);
var [SliderProvider, useSliderContext] = createSliderContext(SLIDER_NAME);
var Slider$1 = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      name,
      min = 0,
      max = 100,
      step = 1,
      orientation = "horizontal",
      disabled = false,
      minStepsBetweenThumbs = 0,
      defaultValue = [min],
      value,
      onValueChange = () => {
      },
      onValueCommit = () => {
      },
      inverted = false,
      form,
      ...sliderProps
    } = props;
    const thumbRefs = reactExports.useRef(/* @__PURE__ */ new Set());
    const valueIndexToChangeRef = reactExports.useRef(0);
    const isHorizontal = orientation === "horizontal";
    const SliderOrientation = isHorizontal ? SliderHorizontal : SliderVertical;
    const [values = [], setValues] = useControllableState({
      prop: value,
      defaultProp: defaultValue,
      onChange: (value2) => {
        const thumbs = [...thumbRefs.current];
        thumbs[valueIndexToChangeRef.current]?.focus();
        onValueChange(value2);
      }
    });
    const valuesBeforeSlideStartRef = reactExports.useRef(values);
    function handleSlideStart(value2) {
      const closestIndex = getClosestValueIndex(values, value2);
      updateValues(value2, closestIndex);
    }
    function handleSlideMove(value2) {
      updateValues(value2, valueIndexToChangeRef.current);
    }
    function handleSlideEnd() {
      const prevValue = valuesBeforeSlideStartRef.current[valueIndexToChangeRef.current];
      const nextValue = values[valueIndexToChangeRef.current];
      const hasChanged = nextValue !== prevValue;
      if (hasChanged) onValueCommit(values);
    }
    function updateValues(value2, atIndex, { commit } = { commit: false }) {
      const decimalCount = getDecimalCount(step);
      const snapToStep = roundValue(Math.round((value2 - min) / step) * step + min, decimalCount);
      const nextValue = clamp(snapToStep, [min, max]);
      setValues((prevValues = []) => {
        const nextValues = getNextSortedValues(prevValues, nextValue, atIndex);
        if (hasMinStepsBetweenValues(nextValues, minStepsBetweenThumbs * step)) {
          valueIndexToChangeRef.current = nextValues.indexOf(nextValue);
          const hasChanged = String(nextValues) !== String(prevValues);
          if (hasChanged && commit) onValueCommit(nextValues);
          return hasChanged ? nextValues : prevValues;
        } else {
          return prevValues;
        }
      });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      SliderProvider,
      {
        scope: props.__scopeSlider,
        name,
        disabled,
        min,
        max,
        valueIndexToChangeRef,
        thumbs: thumbRefs.current,
        values,
        orientation,
        form,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Provider, { scope: props.__scopeSlider, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.Slot, { scope: props.__scopeSlider, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SliderOrientation,
          {
            "aria-disabled": disabled,
            "data-disabled": disabled ? "" : void 0,
            ...sliderProps,
            ref: forwardedRef,
            onPointerDown: composeEventHandlers(sliderProps.onPointerDown, () => {
              if (!disabled) valuesBeforeSlideStartRef.current = values;
            }),
            min,
            max,
            inverted,
            onSlideStart: disabled ? void 0 : handleSlideStart,
            onSlideMove: disabled ? void 0 : handleSlideMove,
            onSlideEnd: disabled ? void 0 : handleSlideEnd,
            onHomeKeyDown: () => !disabled && updateValues(min, 0, { commit: true }),
            onEndKeyDown: () => !disabled && updateValues(max, values.length - 1, { commit: true }),
            onStepKeyDown: ({ event, direction: stepDirection }) => {
              if (!disabled) {
                const isPageKey = PAGE_KEYS.includes(event.key);
                const isSkipKey = isPageKey || event.shiftKey && ARROW_KEYS.includes(event.key);
                const multiplier = isSkipKey ? 10 : 1;
                const atIndex = valueIndexToChangeRef.current;
                const value2 = values[atIndex];
                const stepInDirection = step * multiplier * stepDirection;
                updateValues(value2 + stepInDirection, atIndex, { commit: true });
              }
            }
          }
        ) }) })
      }
    );
  }
);
Slider$1.displayName = SLIDER_NAME;
var [SliderOrientationProvider, useSliderOrientationContext] = createSliderContext(SLIDER_NAME, {
  startEdge: "left",
  endEdge: "right",
  size: "width",
  direction: 1
});
var SliderHorizontal = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      min,
      max,
      dir,
      inverted,
      onSlideStart,
      onSlideMove,
      onSlideEnd,
      onStepKeyDown,
      ...sliderProps
    } = props;
    const [slider, setSlider] = reactExports.useState(null);
    const composedRefs = useComposedRefs(forwardedRef, (node) => setSlider(node));
    const rectRef = reactExports.useRef();
    const direction = useDirection(dir);
    const isDirectionLTR = direction === "ltr";
    const isSlidingFromLeft = isDirectionLTR && !inverted || !isDirectionLTR && inverted;
    function getValueFromPointer(pointerPosition) {
      const rect = rectRef.current || slider.getBoundingClientRect();
      const input = [0, rect.width];
      const output = isSlidingFromLeft ? [min, max] : [max, min];
      const value = linearScale(input, output);
      rectRef.current = rect;
      return value(pointerPosition - rect.left);
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      SliderOrientationProvider,
      {
        scope: props.__scopeSlider,
        startEdge: isSlidingFromLeft ? "left" : "right",
        endEdge: isSlidingFromLeft ? "right" : "left",
        direction: isSlidingFromLeft ? 1 : -1,
        size: "width",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SliderImpl,
          {
            dir: direction,
            "data-orientation": "horizontal",
            ...sliderProps,
            ref: composedRefs,
            style: {
              ...sliderProps.style,
              ["--radix-slider-thumb-transform"]: "translateX(-50%)"
            },
            onSlideStart: (event) => {
              const value = getValueFromPointer(event.clientX);
              onSlideStart?.(value);
            },
            onSlideMove: (event) => {
              const value = getValueFromPointer(event.clientX);
              onSlideMove?.(value);
            },
            onSlideEnd: () => {
              rectRef.current = void 0;
              onSlideEnd?.();
            },
            onStepKeyDown: (event) => {
              const slideDirection = isSlidingFromLeft ? "from-left" : "from-right";
              const isBackKey = BACK_KEYS[slideDirection].includes(event.key);
              onStepKeyDown?.({ event, direction: isBackKey ? -1 : 1 });
            }
          }
        )
      }
    );
  }
);
var SliderVertical = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      min,
      max,
      inverted,
      onSlideStart,
      onSlideMove,
      onSlideEnd,
      onStepKeyDown,
      ...sliderProps
    } = props;
    const sliderRef = reactExports.useRef(null);
    const ref2 = useComposedRefs(forwardedRef, sliderRef);
    const rectRef = reactExports.useRef();
    const isSlidingFromBottom = !inverted;
    function getValueFromPointer(pointerPosition) {
      const rect = rectRef.current || sliderRef.current.getBoundingClientRect();
      const input = [0, rect.height];
      const output = isSlidingFromBottom ? [max, min] : [min, max];
      const value = linearScale(input, output);
      rectRef.current = rect;
      return value(pointerPosition - rect.top);
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      SliderOrientationProvider,
      {
        scope: props.__scopeSlider,
        startEdge: isSlidingFromBottom ? "bottom" : "top",
        endEdge: isSlidingFromBottom ? "top" : "bottom",
        size: "height",
        direction: isSlidingFromBottom ? 1 : -1,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          SliderImpl,
          {
            "data-orientation": "vertical",
            ...sliderProps,
            ref: ref2,
            style: {
              ...sliderProps.style,
              ["--radix-slider-thumb-transform"]: "translateY(50%)"
            },
            onSlideStart: (event) => {
              const value = getValueFromPointer(event.clientY);
              onSlideStart?.(value);
            },
            onSlideMove: (event) => {
              const value = getValueFromPointer(event.clientY);
              onSlideMove?.(value);
            },
            onSlideEnd: () => {
              rectRef.current = void 0;
              onSlideEnd?.();
            },
            onStepKeyDown: (event) => {
              const slideDirection = isSlidingFromBottom ? "from-bottom" : "from-top";
              const isBackKey = BACK_KEYS[slideDirection].includes(event.key);
              onStepKeyDown?.({ event, direction: isBackKey ? -1 : 1 });
            }
          }
        )
      }
    );
  }
);
var SliderImpl = reactExports.forwardRef(
  (props, forwardedRef) => {
    const {
      __scopeSlider,
      onSlideStart,
      onSlideMove,
      onSlideEnd,
      onHomeKeyDown,
      onEndKeyDown,
      onStepKeyDown,
      ...sliderProps
    } = props;
    const context = useSliderContext(SLIDER_NAME, __scopeSlider);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive$1.span,
      {
        ...sliderProps,
        ref: forwardedRef,
        onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
          if (event.key === "Home") {
            onHomeKeyDown(event);
            event.preventDefault();
          } else if (event.key === "End") {
            onEndKeyDown(event);
            event.preventDefault();
          } else if (PAGE_KEYS.concat(ARROW_KEYS).includes(event.key)) {
            onStepKeyDown(event);
            event.preventDefault();
          }
        }),
        onPointerDown: composeEventHandlers(props.onPointerDown, (event) => {
          const target = event.target;
          target.setPointerCapture(event.pointerId);
          event.preventDefault();
          if (context.thumbs.has(target)) {
            target.focus();
          } else {
            onSlideStart(event);
          }
        }),
        onPointerMove: composeEventHandlers(props.onPointerMove, (event) => {
          const target = event.target;
          if (target.hasPointerCapture(event.pointerId)) onSlideMove(event);
        }),
        onPointerUp: composeEventHandlers(props.onPointerUp, (event) => {
          const target = event.target;
          if (target.hasPointerCapture(event.pointerId)) {
            target.releasePointerCapture(event.pointerId);
            onSlideEnd(event);
          }
        })
      }
    );
  }
);
var TRACK_NAME = "SliderTrack";
var SliderTrack = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSlider, ...trackProps } = props;
    const context = useSliderContext(TRACK_NAME, __scopeSlider);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive$1.span,
      {
        "data-disabled": context.disabled ? "" : void 0,
        "data-orientation": context.orientation,
        ...trackProps,
        ref: forwardedRef
      }
    );
  }
);
SliderTrack.displayName = TRACK_NAME;
var RANGE_NAME = "SliderRange";
var SliderRange = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSlider, ...rangeProps } = props;
    const context = useSliderContext(RANGE_NAME, __scopeSlider);
    const orientation = useSliderOrientationContext(RANGE_NAME, __scopeSlider);
    const ref2 = reactExports.useRef(null);
    const composedRefs = useComposedRefs(forwardedRef, ref2);
    const valuesCount = context.values.length;
    const percentages = context.values.map(
      (value) => convertValueToPercentage(value, context.min, context.max)
    );
    const offsetStart = valuesCount > 1 ? Math.min(...percentages) : 0;
    const offsetEnd = 100 - Math.max(...percentages);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Primitive$1.span,
      {
        "data-orientation": context.orientation,
        "data-disabled": context.disabled ? "" : void 0,
        ...rangeProps,
        ref: composedRefs,
        style: {
          ...props.style,
          [orientation.startEdge]: offsetStart + "%",
          [orientation.endEdge]: offsetEnd + "%"
        }
      }
    );
  }
);
SliderRange.displayName = RANGE_NAME;
var THUMB_NAME = "SliderThumb";
var SliderThumb = reactExports.forwardRef(
  (props, forwardedRef) => {
    const getItems = useCollection(props.__scopeSlider);
    const [thumb, setThumb] = reactExports.useState(null);
    const composedRefs = useComposedRefs(forwardedRef, (node) => setThumb(node));
    const index = reactExports.useMemo(
      () => thumb ? getItems().findIndex((item) => item.ref.current === thumb) : -1,
      [getItems, thumb]
    );
    return /* @__PURE__ */ jsxRuntimeExports.jsx(SliderThumbImpl, { ...props, ref: composedRefs, index });
  }
);
var SliderThumbImpl = reactExports.forwardRef(
  (props, forwardedRef) => {
    const { __scopeSlider, index, name, ...thumbProps } = props;
    const context = useSliderContext(THUMB_NAME, __scopeSlider);
    const orientation = useSliderOrientationContext(THUMB_NAME, __scopeSlider);
    const [thumb, setThumb] = reactExports.useState(null);
    const composedRefs = useComposedRefs(forwardedRef, (node) => setThumb(node));
    const isFormControl = thumb ? context.form || !!thumb.closest("form") : true;
    const size = useSize(thumb);
    const value = context.values[index];
    const percent = value === void 0 ? 0 : convertValueToPercentage(value, context.min, context.max);
    const label = getLabel(index, context.values.length);
    const orientationSize = size?.[orientation.size];
    const thumbInBoundsOffset = orientationSize ? getThumbInBoundsOffset(orientationSize, percent, orientation.direction) : 0;
    reactExports.useEffect(() => {
      if (thumb) {
        context.thumbs.add(thumb);
        return () => {
          context.thumbs.delete(thumb);
        };
      }
    }, [thumb, context.thumbs]);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "span",
      {
        style: {
          transform: "var(--radix-slider-thumb-transform)",
          position: "absolute",
          [orientation.startEdge]: `calc(${percent}% + ${thumbInBoundsOffset}px)`
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Collection.ItemSlot, { scope: props.__scopeSlider, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Primitive$1.span,
            {
              role: "slider",
              "aria-label": props["aria-label"] || label,
              "aria-valuemin": context.min,
              "aria-valuenow": value,
              "aria-valuemax": context.max,
              "aria-orientation": context.orientation,
              "data-orientation": context.orientation,
              "data-disabled": context.disabled ? "" : void 0,
              tabIndex: context.disabled ? void 0 : 0,
              ...thumbProps,
              ref: composedRefs,
              style: value === void 0 ? { display: "none" } : props.style,
              onFocus: composeEventHandlers(props.onFocus, () => {
                context.valueIndexToChangeRef.current = index;
              })
            }
          ) }),
          isFormControl && /* @__PURE__ */ jsxRuntimeExports.jsx(
            BubbleInput,
            {
              name: name ?? (context.name ? context.name + (context.values.length > 1 ? "[]" : "") : void 0),
              form: context.form,
              value
            },
            index
          )
        ]
      }
    );
  }
);
SliderThumb.displayName = THUMB_NAME;
var BubbleInput = (props) => {
  const { value, ...inputProps } = props;
  const ref2 = reactExports.useRef(null);
  const prevValue = usePrevious(value);
  reactExports.useEffect(() => {
    const input = ref2.current;
    const inputProto = window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(inputProto, "value");
    const setValue = descriptor.set;
    if (prevValue !== value && setValue) {
      const event = new Event("input", { bubbles: true });
      setValue.call(input, value);
      input.dispatchEvent(event);
    }
  }, [prevValue, value]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("input", { style: { display: "none" }, ...inputProps, ref: ref2, defaultValue: value });
};
function getNextSortedValues(prevValues = [], nextValue, atIndex) {
  const nextValues = [...prevValues];
  nextValues[atIndex] = nextValue;
  return nextValues.sort((a, b) => a - b);
}
function convertValueToPercentage(value, min, max) {
  const maxSteps = max - min;
  const percentPerStep = 100 / maxSteps;
  const percentage = percentPerStep * (value - min);
  return clamp(percentage, [0, 100]);
}
function getLabel(index, totalValues) {
  if (totalValues > 2) {
    return `Value ${index + 1} of ${totalValues}`;
  } else if (totalValues === 2) {
    return ["Minimum", "Maximum"][index];
  } else {
    return void 0;
  }
}
function getClosestValueIndex(values, nextValue) {
  if (values.length === 1) return 0;
  const distances = values.map((value) => Math.abs(value - nextValue));
  const closestDistance = Math.min(...distances);
  return distances.indexOf(closestDistance);
}
function getThumbInBoundsOffset(width, left, direction) {
  const halfWidth = width / 2;
  const halfPercent = 50;
  const offset = linearScale([0, halfPercent], [0, halfWidth]);
  return (halfWidth - offset(left) * direction) * direction;
}
function getStepsBetweenValues(values) {
  return values.slice(0, -1).map((value, index) => values[index + 1] - value);
}
function hasMinStepsBetweenValues(values, minStepsBetweenValues) {
  if (minStepsBetweenValues > 0) {
    const stepsBetweenValues = getStepsBetweenValues(values);
    const actualMinStepsBetweenValues = Math.min(...stepsBetweenValues);
    return actualMinStepsBetweenValues >= minStepsBetweenValues;
  }
  return true;
}
function linearScale(input, output) {
  return (value) => {
    if (input[0] === input[1] || output[0] === output[1]) return output[0];
    const ratio = (output[1] - output[0]) / (input[1] - input[0]);
    return output[0] + ratio * (value - input[0]);
  };
}
function getDecimalCount(value) {
  return (String(value).split(".")[1] || "").length;
}
function roundValue(value, decimalCount) {
  const rounder = Math.pow(10, decimalCount);
  return Math.round(value * rounder) / rounder;
}
var Root = Slider$1;
var Track = SliderTrack;
var Range = SliderRange;
var Thumb = SliderThumb;
const Slider = reactExports.forwardRef(({ className, ...props }, ref2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Root,
  {
    ref: ref2,
    className: cn(
      "relative flex w-full touch-none select-none items-center",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Track, { className: "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Range, { className: "absolute h-full bg-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Thumb, { className: "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" })
    ]
  }
));
Slider.displayName = Root.displayName;
const ELEVENLABS_VOICES = {
  rachel: "pqHfZKP75CvOlQylNhV4",
  adam: "pNInz6obpgDQGcFmaJgB",
  aria: "9BWtsMINqrJLrRacOk9x",
  josh: "TxGEqnHWrfWFTfGW9XjX",
  bella: "XB0fDUnXU5powFXDhCwa",
  elli: "MF3mGyEYCl7XYWbV9V6O",
  sam: "yoZ06aMxZJJ28mfd3POQ",
  sarah: "EXAVITQu4vr4xnSDxMaL",
  antoni: "ErXwobaYiN019PkySvjV",
  domi: "AZnzlk1XvdvUeBnXmlld"
};
let currentAudio = null;
const getUserApiKey = () => {
  return localStorage.getItem("elevenlabs_user_api_key");
};
const testApiKey = async (apiKey) => {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICES.rachel}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: "ok",
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      }
    );
    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: "Invalid API key" };
    } else if (response.status === 429) {
      return { valid: true };
    } else {
      const errorText = await response.text().catch(() => "");
      return { valid: false, error: `API error: ${response.status} ${errorText}` };
    }
  } catch (error) {
    console.error("[UserTTS] Key validation error:", error);
    return { valid: false, error: "Network error - could not reach ElevenLabs" };
  }
};
const speakWithUserKey = async (text, options = {}) => {
  const { voice = "rachel", onStart, onEnd, onError } = options;
  const apiKey = getUserApiKey();
  if (!apiKey) {
    console.log("[UserTTS] No API key, falling back to browser TTS");
    return speakWithBrowser(text, { onStart, onEnd });
  }
  const voiceId = ELEVENLABS_VOICES[voice] || ELEVENLABS_VOICES.rachel;
  try {
    onStart?.();
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true
          }
        })
      }
    );
    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    stopSpeaking();
    currentAudio = new Audio(audioUrl);
    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      onEnd?.();
    };
    currentAudio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      onError?.(new Error("Audio playback failed"));
    };
    await currentAudio.play();
    return true;
  } catch (error) {
    console.error("[UserTTS] ElevenLabs error, falling back to browser:", error);
    onError?.(error);
    return speakWithBrowser(text, { onStart: void 0, onEnd });
  }
};
const speakWithBrowser = (text, options) => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn("[UserTTS] Browser TTS not supported");
      options.onEnd?.();
      resolve(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes("Samantha") || v.name.includes("Google") || v.lang.startsWith("en")
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => {
      options.onEnd?.();
      resolve(true);
    };
    utterance.onerror = () => {
      options.onEnd?.();
      resolve(false);
    };
    window.speechSynthesis.speak(utterance);
  });
};
const stopSpeaking = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
};
const LANGUAGE_OPTIONS = {
  "en-US": "English (US)",
  "en-GB": "English (UK)",
  "es-ES": "Spanish",
  "fr-FR": "French",
  "de-DE": "German",
  "it-IT": "Italian",
  "pt-PT": "Portuguese",
  "ja-JP": "Japanese",
  "ko-KR": "Korean",
  "zh-CN": "Chinese"
};
const VoiceSettingsForm = ({ showTitle = true }) => {
  const { preferences, updatePreferences, clearApiKey, isLoading } = useUserPreferences();
  const [isTestingVoice, setIsTestingVoice] = reactExports.useState(false);
  const [testText, setTestText] = reactExports.useState("Hello! This is a test of your voice settings. How does this sound?");
  const [apiKeyInput, setApiKeyInput] = reactExports.useState("");
  const [showApiKey, setShowApiKey] = reactExports.useState(false);
  const [isValidatingKey, setIsValidatingKey] = reactExports.useState(false);
  const [isTestingElevenLabs, setIsTestingElevenLabs] = reactExports.useState(false);
  const handleUpdatePreference = async (updates) => {
    const success = await updatePreferences(updates);
    if (!success) {
      Jt.error("Failed to update settings");
    }
  };
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      Jt.error("Please enter an API key");
      return;
    }
    if (!apiKeyInput.startsWith("sk_")) {
      Jt.error("Invalid API key format. ElevenLabs keys start with 'sk_'");
      return;
    }
    setIsValidatingKey(true);
    try {
      const result = await testApiKey(apiKeyInput);
      if (result.valid) {
        await handleUpdatePreference({ elevenlabs_api_key: apiKeyInput });
        setApiKeyInput("");
        Jt.success("API key saved successfully!");
      } else {
        Jt.error(result.error || "Invalid API key");
      }
    } catch (error) {
      Jt.error("Failed to validate API key");
    } finally {
      setIsValidatingKey(false);
    }
  };
  const handleRemoveApiKey = async () => {
    const success = await clearApiKey();
    if (success) {
      Jt.success("API key removed");
    } else {
      Jt.error("Failed to remove API key");
    }
  };
  const handleTestElevenLabs = async () => {
    setIsTestingElevenLabs(true);
    try {
      await speakWithUserKey(testText, {
        voice: preferences.elevenlabs_voice_id || "rachel",
        onEnd: () => {
          setIsTestingElevenLabs(false);
          Jt.success("Voice test completed!");
        },
        onError: (error) => {
          console.error("Voice test error:", error);
          Jt.error("Voice test failed");
          setIsTestingElevenLabs(false);
        }
      });
    } catch (error) {
      console.error("Voice test error:", error);
      Jt.error("Voice test failed");
      setIsTestingElevenLabs(false);
    }
  };
  const handleTestVoice = async () => {
    setIsTestingVoice(true);
    stopCurrentSpeech();
    try {
      await speak(testText, {
        rate: preferences.voice_speech_rate,
        pitch: 1,
        volume: preferences.voice_volume
      });
      Jt.success("Voice test completed!");
    } catch (error) {
      console.error("🚨 Voice test failed:", error);
      Jt.error("Voice test failed. Please check your settings.");
    } finally {
      setIsTestingVoice(false);
    }
  };
  const userHasApiKey = !!preferences.elevenlabs_api_key;
  const maskedKey = preferences.elevenlabs_api_key ? `sk_...${preferences.elevenlabs_api_key.slice(-8)}` : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    showTitle && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-2 text-primary", children: "Voice Settings" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Configure your voice recognition and text-to-speech preferences" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "general", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "general", children: "General" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "voices", children: "Voices" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "apikey", children: "API Key" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "advanced", children: "Advanced" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "general", className: "space-y-4 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "h-5 w-5 text-blue-500" }),
          "Speech Recognition"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "language", children: "Recognition Language" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: preferences.voice_language,
                onValueChange: (value) => handleUpdatePreference({ voice_language: value }),
                disabled: isLoading,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: code, children: name }, code)) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Continuous Listening" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Keep listening for commands after processing one" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                checked: preferences.voice_continuous_listening,
                onCheckedChange: (checked) => handleUpdatePreference({ voice_continuous_listening: checked }),
                disabled: isLoading
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Auto-Speak Responses" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Automatically speak system responses" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                checked: preferences.voice_auto_speak,
                onCheckedChange: (checked) => handleUpdatePreference({ voice_auto_speak: checked }),
                disabled: isLoading
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "End-of-speech Tone" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Play a short tone when TTS finishes" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                checked: preferences.voice_audio_cue_enabled,
                onCheckedChange: (checked) => handleUpdatePreference({ voice_audio_cue_enabled: checked }),
                disabled: isLoading
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-sm", children: [
              "Tone Volume: ",
              Math.round((preferences.voice_audio_cue_volume || 0.4) * 100),
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Slider,
              {
                value: [preferences.voice_audio_cue_volume || 0.4],
                onValueChange: ([value]) => handleUpdatePreference({ voice_audio_cue_volume: value }),
                min: 0,
                max: 1,
                step: 0.05,
                disabled: isLoading,
                className: "w-full"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "sm",
                onClick: () => playEndOfSpeechCue(),
                className: "h-8 text-xs gap-1",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-3 w-3" }),
                  "Test Tone"
                ]
              }
            ) })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "voices", className: "space-y-4 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings$1, { className: "h-5 w-5 text-purple-500" }),
            "TTS Service Selection"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Preferred TTS Service" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: preferences.tts_service,
                  onValueChange: (value) => handleUpdatePreference({ tts_service: value }),
                  disabled: isLoading,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "elevenlabs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between w-full", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "ElevenLabs" }),
                        userHasApiKey && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "ml-2 text-xs bg-green-100 text-green-800 border-green-200", children: "Your Key" })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "google", disabled: false, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between w-full", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Google Cloud TTS" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "ml-2 text-xs bg-blue-100 text-blue-800 border-blue-200", children: "Server" })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "minimax", disabled: false, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between w-full", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "MiniMax" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "ml-2 text-xs", children: "Server" })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "browser", children: "Browser Default" })
                    ] })
                  ]
                }
              )
            ] }),
            !userHasApiKey && preferences.tts_service === "elevenlabs" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-start gap-2 border border-amber-200 dark:border-amber-800", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4 text-amber-600 mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-amber-800 dark:text-amber-200", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: "API key required" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: 'Add your ElevenLabs API key in the "API Key" tab to use this service.' })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-5 w-5 text-green-500" }),
            "Voice Selection"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            preferences.tts_service === "elevenlabs" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "ElevenLabs Voice" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: preferences.elevenlabs_voice_id || "rachel",
                  onValueChange: (value) => handleUpdatePreference({ elevenlabs_voice_id: value }),
                  disabled: isLoading,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: Object.keys(VOICE_OPTIONS).map((voice) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: voice.toLowerCase(), children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "capitalize", children: voice }) }, voice)) })
                  ]
                }
              )
            ] }),
            preferences.tts_service === "minimax" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "MiniMax Voice" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: preferences.minimax_voice_id || "male-qn-qingse",
                  onValueChange: (value) => handleUpdatePreference({ minimax_voice_id: value }),
                  disabled: isLoading,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: Object.entries(MINIMAX_VOICES).map(([key, name]) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: key, children: name }, key)) })
                  ]
                }
              )
            ] }),
            preferences.tts_service === "google" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Google Cloud Voice" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: preferences.google_voice_id || "en-US-Neural2-F",
                  onValueChange: (value) => handleUpdatePreference({ google_voice_id: value }),
                  disabled: isLoading,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: Object.entries(GOOGLE_VOICES).map(([key, name]) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: key, children: [
                      name,
                      " (",
                      key,
                      ")"
                    ] }, key)) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-sm", children: [
                  "Speech Rate: ",
                  preferences.voice_speech_rate.toFixed(1),
                  "x"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Slider,
                  {
                    value: [preferences.voice_speech_rate],
                    onValueChange: ([value]) => handleUpdatePreference({ voice_speech_rate: value }),
                    min: 0.1,
                    max: 2,
                    step: 0.1,
                    disabled: isLoading,
                    className: "w-full"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-sm", children: [
                  "Volume: ",
                  Math.round(preferences.voice_volume * 100),
                  "%"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Slider,
                  {
                    value: [preferences.voice_volume],
                    onValueChange: ([value]) => handleUpdatePreference({ voice_volume: value }),
                    min: 0,
                    max: 1,
                    step: 0.1,
                    disabled: isLoading,
                    className: "w-full"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm", children: "Test Text" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: testText,
                    onChange: (e) => setTestText(e.target.value),
                    placeholder: "Enter text to test voice...",
                    className: "flex-1 h-9 text-sm"
                  }
                ),
                preferences.tts_service === "elevenlabs" && userHasApiKey ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    onClick: handleTestElevenLabs,
                    disabled: isTestingElevenLabs || !testText.trim() || isLoading,
                    size: "sm",
                    className: "gap-1 px-4",
                    children: [
                      isTestingElevenLabs ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-3.5 w-3.5" }),
                      "Test"
                    ]
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Button,
                  {
                    onClick: handleTestVoice,
                    disabled: isTestingVoice || !testText.trim() || isLoading,
                    size: "sm",
                    className: "gap-1 px-4",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-3.5 w-3.5" }),
                      "Test"
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "apikey", className: "space-y-4 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Key, { className: "h-5 w-5 text-amber-500" }),
            "ElevenLabs API Key"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Use your own ElevenLabs API key for high-quality AI voices" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-4", children: userHasApiKey ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-5 w-5 text-green-600" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-green-800 dark:text-green-200", children: "API Key Connected" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-green-600 dark:text-green-400 font-mono", children: maskedKey })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: handleRemoveApiKey,
                className: "text-red-600 hover:text-red-700 hover:bg-red-50",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 mr-1" }),
                  "Remove"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-muted/50 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Your API key is stored securely and used directly from your browser to ElevenLabs. We never store your key on our servers." }) })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "apiKey", children: "API Key" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    id: "apiKey",
                    type: showApiKey ? "text" : "password",
                    value: apiKeyInput,
                    onChange: (e) => setApiKeyInput(e.target.value),
                    placeholder: "sk_...",
                    className: "pr-10 font-mono text-sm"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    variant: "ghost",
                    size: "sm",
                    onClick: () => setShowApiKey(!showApiKey),
                    className: "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0",
                    children: showApiKey ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: handleSaveApiKey,
                  disabled: isValidatingKey || !apiKeyInput.trim(),
                  children: isValidatingKey ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : "Save"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-blue-800 dark:text-blue-200 text-sm mb-2", children: "How to get an API key:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
                "Create a free account at ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://elevenlabs.io", target: "_blank", rel: "noopener noreferrer", className: "underline hover:text-blue-900 inline-flex items-center gap-0.5", children: [
                  "elevenlabs.io ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Go to your Profile Settings" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Find your API Key and copy it" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Paste it above and click Save" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-600 dark:text-blue-400 mt-3", children: "Free tier includes 10,000 characters/month — enough for casual use!" })
          ] })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "advanced", className: "space-y-4 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "h-5 w-5 text-orange-500" }),
          "Available Voice Commands"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
            { cmd: "Add entry [content]", desc: "Create a new entry" },
            { cmd: "Search for [term]", desc: "Search entries" },
            { cmd: "Show dashboard", desc: "View all saved data" },
            { cmd: "Open settings", desc: "Change preferences" },
            { cmd: "Export data", desc: "Download your data" },
            { cmd: "Clear log", desc: "Clear diagnostic logs" }
          ].map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-muted/40 rounded border border-border/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-mono text-primary font-bold", children: [
              '"',
              item.cmd,
              '"'
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground mt-1 uppercase tracking-wider", children: item.desc })
          ] }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold text-blue-800 uppercase tracking-widest mb-2", children: "Pro Tip" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-700 leading-relaxed", children: 'You can use continuous listening to speak multiple commands in a row. The system will wait for the "end-of-speech" tone before listening for the next one.' })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "outline",
              className: "w-full mt-4 text-xs h-9",
              onClick: async () => {
                await handleUpdatePreference({
                  tts_service: "browser",
                  voice_language: "en-US",
                  voice_speech_rate: 1,
                  voice_volume: 1,
                  voice_auto_speak: true,
                  voice_continuous_listening: false,
                  voice_audio_cue_enabled: true,
                  voice_audio_cue_volume: 0.4
                });
                Jt.info("Settings reset to defaults");
              },
              children: "Reset to App Defaults"
            }
          )
        ] })
      ] }) })
    ] })
  ] });
};
const VoiceSettings = () => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container max-w-4xl mx-auto py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceSettingsForm, {}) });
};
const EnhancedHelpSupportSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [supportForm, setSupportForm] = reactExports.useState({
    subject: "",
    message: "",
    category: "question"
  });
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to submit a support ticket.",
        variant: "destructive"
      });
      return;
    }
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both subject and message fields.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const ticketsRef = collection(db, "support_tickets");
      await addDoc(ticketsRef, {
        user_id: user.uid,
        user_email: user.email,
        subject: supportForm.subject.trim(),
        message: supportForm.message.trim(),
        category: supportForm.category,
        status: "open",
        created_at: serverTimestamp()
      });
      toast({
        title: "Support ticket submitted",
        description: "We'll get back to you as soon as possible."
      });
      setSupportForm({ subject: "", message: "", category: "question" });
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      toast({
        title: "Error",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const helpResources = [
    {
      title: "User Guide",
      description: "Complete guide to using all features",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleHelp, { className: "w-5 h-5" }),
      action: () => window.open("/user-guide", "_blank")
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video instructions",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-5 h-5" }),
      action: () => window.open("https://www.youtube.com/watch?v=9KHLTZaJcR8&list=PLbVHz4urQBZkJiAWdG8HWoJTdgEysigIO", "_blank")
    },
    {
      title: "Community",
      description: "Join our Discord community",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "w-5 h-5" }),
      action: () => window.open("https://discord.com/channels/1119885301872070706/1280461670979993613", "_blank")
    },
    {
      title: "Contact Support",
      description: "Get direct help from our team",
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-5 h-5" }),
      action: () => window.open("mailto:support@lovable.dev", "_blank")
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleHelp, { className: "w-5 h-5" }),
        "Help & Support"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Get help and submit feedback" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium", children: "Quick Help" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: helpResources.map((resource, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
            onClick: resource.action,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-primary", children: resource.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium", children: resource.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: resource.description })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "w-4 h-4 text-muted-foreground" })
            ]
          },
          index
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium", children: "Submit Support Request" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSupportSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "category", children: "Category" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Select,
              {
                value: supportForm.category,
                onValueChange: (value) => setSupportForm((prev) => ({ ...prev, category: value })),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "question", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleHelp, { className: "w-4 h-4" }),
                      "Question"
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "bug", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Bug, { className: "w-4 h-4" }),
                      "Bug Report"
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "feature", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { className: "w-4 h-4" }),
                      "Feature Request"
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "other", children: "Other" })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "subject", children: "Subject" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "subject",
                value: supportForm.subject,
                onChange: (e) => setSupportForm((prev) => ({ ...prev, subject: e.target.value })),
                placeholder: "Brief description of your issue...",
                disabled: isSubmitting
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "message", children: "Message" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "message",
                value: supportForm.message,
                onChange: (e) => setSupportForm((prev) => ({ ...prev, message: e.target.value })),
                placeholder: "Please provide detailed information about your issue or request...",
                rows: 5,
                disabled: isSubmitting
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", disabled: isSubmitting, className: "w-full", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "w-4 h-4 mr-2" }),
            isSubmitting ? "Submitting..." : "Submit Support Request"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-medium", children: "Common Issues" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-muted rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm", children: "Voice commands not working?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Check your microphone permissions and try refreshing the page." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-muted rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm", children: "Data not syncing?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Ensure you're logged in and have a stable internet connection." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-muted rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm", children: "Export not working?" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Check if you have entries to export and try a different format." })
          ] })
        ] })
      ] })
    ] })
  ] }) });
};
const CATEGORY_LABELS = {
  personal: "Personal",
  health: "Health",
  finance: "Finance",
  work: "Work",
  contacts: "Contacts",
  preferences: "Preferences",
  schedule: "Schedule"
};
const NovaMemorySettings = () => {
  const { user } = useAuth();
  const [memories, setMemories] = reactExports.useState([]);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const [deletingId, setDeletingId] = reactExports.useState(null);
  const loadMemories = reactExports.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "nova_memories"),
        where("user_id", "==", user.uid),
        where("active", "==", true)
      );
      const snap = await getDocs(q);
      const loaded = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      loaded.sort((a, b) => {
        const aTime = a.created_at?.toMillis?.() || 0;
        const bTime = b.created_at?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setMemories(loaded);
    } catch (err) {
      console.error("Failed to load memories:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  reactExports.useEffect(() => {
    loadMemories();
  }, [loadMemories]);
  const handleDelete = async (memoryId) => {
    setDeletingId(memoryId);
    try {
      await updateDoc(doc(db, "nova_memories", memoryId), {
        active: false,
        updated_at: serverTimestamp()
      });
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      Jt.success("Memory removed");
    } catch (err) {
      console.error("Failed to delete memory:", err);
      Jt.error("Failed to remove memory");
    } finally {
      setDeletingId(null);
    }
  };
  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all of Nova's memories about you?")) return;
    setIsLoading(true);
    try {
      const batch = memories.map(
        (m) => updateDoc(doc(db, "nova_memories", m.id), {
          active: false,
          updated_at: serverTimestamp()
        })
      );
      await Promise.all(batch);
      setMemories([]);
      Jt.success("All memories cleared");
    } catch (err) {
      console.error("Failed to clear memories:", err);
      Jt.error("Failed to clear memories");
    } finally {
      setIsLoading(false);
    }
  };
  const grouped = memories.reduce((acc, mem) => {
    const cat = mem.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mem);
    return acc;
  }, {});
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "w-5 h-5" }),
          "Nova's Memory"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Things Nova remembers about you across conversations" })
      ] }),
      memories.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "destructive",
          size: "sm",
          onClick: handleClearAll,
          disabled: isLoading,
          children: "Clear All"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }) : memories.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-8 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "h-10 w-10 mx-auto mb-3 opacity-30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: "No memories yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs mt-1", children: "Talk to Nova and share personal details — she'll remember them for next time." })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      Object.entries(grouped).map(([category, mems]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2", children: CATEGORY_LABELS[category] || category }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: mems.map((mem) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex items-start gap-3 p-3 rounded-lg bg-muted/50 group",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: mem.content }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[10px] h-4 px-1.5", children: mem.source === "explicit" ? "You told me" : "I noticed" }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "ghost",
                  size: "icon",
                  className: "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
                  onClick: () => handleDelete(mem.id),
                  disabled: deletingId === mem.id,
                  children: deletingId === mem.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5 text-destructive" })
                }
              )
            ]
          },
          mem.id
        )) })
      ] }, category)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground text-center pt-2", children: [
        memories.length,
        " ",
        memories.length === 1 ? "memory" : "memories",
        " stored"
      ] })
    ] }) })
  ] });
};
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024;
const VideoCard = ({ video, onToggle, onReplace, onDelete }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: video.title }),
    video.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: video.description }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-1 rounded ${video.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}`, children: video.is_active ? "Active" : "Inactive" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: new Date(video.created_at).toLocaleDateString() })
    ] })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
    !video.is_active && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: "default",
        size: "sm",
        onClick: () => onReplace(video.id, video.video_type),
        className: "bg-green-600 hover:bg-green-700",
        children: "Make Active"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Switch,
      {
        checked: video.is_active,
        onCheckedChange: () => onToggle(video.id, video.is_active, video.video_type),
        disabled: video.is_active
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: "outline",
        size: "sm",
        onClick: () => {
          const link = document.createElement("a");
          link.href = video.video_url;
          link.download = `${video.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`;
          link.click();
        },
        title: "Download video",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4" })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: "outline",
        size: "sm",
        onClick: () => onDelete(video.id, video.video_url),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-4 h-4" })
      }
    )
  ] })
] });
const VideoUpload = () => {
  const [title, setTitle] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [videoFile, setVideoFile] = reactExports.useState(null);
  const [thumbnailFile, setThumbnailFile] = reactExports.useState(null);
  const [videoType, setVideoType] = reactExports.useState("demo");
  const [isActive, setIsActive] = reactExports.useState(false);
  const [isUploading, setIsUploading] = reactExports.useState(false);
  const [videos, setVideos] = reactExports.useState([]);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const [uploadProgress, setUploadProgress] = reactExports.useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  React.useEffect(() => {
    fetchVideos();
  }, []);
  const fetchVideos = async () => {
    try {
      const videosRef = collection(db, "demo_videos");
      const q = query(videosRef, orderBy("created_at", "desc"));
      const querySnapshot = await getDocs(q);
      const videosList = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        videosList.push({
          id: docSnap.id,
          title: data.title || "",
          description: data.description || null,
          video_url: data.video_url || "",
          thumbnail_url: data.thumbnail_url || null,
          is_active: data.is_active ?? false,
          video_type: data.video_type || "demo",
          created_at: data.created_at?.toDate?.()?.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
        });
      });
      setVideos(videosList);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Error",
        description: "Failed to fetch videos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const validateFile = (file, maxSize, fileType) => {
    if (file.size > maxSize) {
      const sizeMB = Math.round(maxSize / (1024 * 1024));
      throw new Error(`${fileType} file size must be less than ${sizeMB}MB`);
    }
    return true;
  };
  const uploadFile = async (file, bucket, path) => {
    const storageRef = ref(storage, `${bucket}/${path}`);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type
    });
    const publicUrl = await getDownloadURL(snapshot.ref);
    return publicUrl;
  };
  const handleVideoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        validateFile(file, MAX_VIDEO_SIZE, "Video");
        setVideoFile(file);
      } catch (error) {
        toast({
          title: "File too large",
          description: error.message,
          variant: "destructive"
        });
        e.target.value = "";
      }
    }
  };
  const handleThumbnailFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        validateFile(file, MAX_THUMBNAIL_SIZE, "Thumbnail");
        setThumbnailFile(file);
      } catch (error) {
        toast({
          title: "File too large",
          description: error.message,
          variant: "destructive"
        });
        e.target.value = "";
      }
    }
  };
  const formatFileSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile || !user) {
      toast({
        title: "Error",
        description: "Please select a video file and ensure you're logged in",
        variant: "destructive"
      });
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      validateFile(videoFile, MAX_VIDEO_SIZE, "Video");
      if (thumbnailFile) {
        validateFile(thumbnailFile, MAX_THUMBNAIL_SIZE, "Thumbnail");
      }
      setUploadProgress(25);
      const videoPath = `${Date.now()}-${videoFile.name}`;
      const videoUrl = await uploadFile(videoFile, "demo-videos", videoPath);
      setUploadProgress(60);
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailPath = `thumbnails/${Date.now()}-${thumbnailFile.name}`;
        thumbnailUrl = await uploadFile(thumbnailFile, "demo-videos", thumbnailPath);
      }
      setUploadProgress(80);
      const videosRef = collection(db, "demo_videos");
      await addDoc(videosRef, {
        title,
        description: description || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        video_type: videoType,
        is_active: isActive,
        uploaded_by: user.uid,
        created_at: serverTimestamp()
      });
      setUploadProgress(100);
      toast({
        title: "Success",
        description: "Video uploaded successfully!"
      });
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoType("demo");
      setIsActive(false);
      setUploadProgress(0);
      fetchVideos();
    } catch (error) {
      console.error("Error uploading video:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload video";
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };
  const toggleVideoStatus = async (videoId, currentStatus, videoType2) => {
    try {
      if (!currentStatus) {
        const videosRef = collection(db, "demo_videos");
        const q = query(videosRef, where("video_type", "==", videoType2));
        const querySnapshot = await getDocs(q);
        for (const docSnap of querySnapshot.docs) {
          if (docSnap.id !== videoId) {
            await updateDoc(doc(db, "demo_videos", docSnap.id), { is_active: false });
          }
        }
      }
      const videoRef = doc(db, "demo_videos", videoId);
      await updateDoc(videoRef, { is_active: !currentStatus });
      toast({
        title: "Success",
        description: !currentStatus ? "Video is now active on the landing page!" : "Video deactivated"
      });
      fetchVideos();
    } catch (error) {
      console.error("Error updating video status:", error);
      toast({
        title: "Error",
        description: "Failed to update video status",
        variant: "destructive"
      });
    }
  };
  const replaceActiveVideo = async (videoId, videoType2) => {
    try {
      const videosRef = collection(db, "demo_videos");
      const q = query(videosRef, where("video_type", "==", videoType2));
      const querySnapshot = await getDocs(q);
      for (const docSnap of querySnapshot.docs) {
        await updateDoc(doc(db, "demo_videos", docSnap.id), { is_active: false });
      }
      const videoRef = doc(db, "demo_videos", videoId);
      await updateDoc(videoRef, { is_active: true });
      toast({
        title: "Success",
        description: "Video is now active on the landing page!"
      });
      fetchVideos();
    } catch (error) {
      console.error("Error replacing active video:", error);
      toast({
        title: "Error",
        description: "Failed to replace active video",
        variant: "destructive"
      });
    }
  };
  const deleteVideo = async (videoId, videoUrl) => {
    try {
      const videoRef = doc(db, "demo_videos", videoId);
      await deleteDoc(videoRef);
      try {
        const urlMatch = videoUrl.match(/\/o\/(.+?)\?/);
        if (urlMatch) {
          const filePath = decodeURIComponent(urlMatch[1]);
          const storageRef = ref(storage, filePath);
          await deleteObject(storageRef);
        }
      } catch (storageError) {
        console.warn("Could not delete file from storage:", storageError);
      }
      toast({
        title: "Success",
        description: "Video deleted successfully!"
      });
      fetchVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive"
      });
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center p-8", children: "Loading..." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "w-5 h-5" }),
          "Upload Demo Video"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Upload MP4 videos for the landing page demo section (Max 50MB)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-amber-800 dark:text-amber-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium mb-1", children: "File Size Limits:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "list-disc list-inside space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Video files: Maximum 50MB" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Thumbnail images: Maximum 5MB" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Supported formats: MP4 for videos, JPG/PNG for thumbnails" })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "title", children: "Video Title" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "title",
                value: title,
                onChange: (e) => setTitle(e.target.value),
                placeholder: "Enter video title",
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "description", children: "Description (Optional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "description",
                value: description,
                onChange: (e) => setDescription(e.target.value),
                placeholder: "Enter video description",
                rows: 3
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "videoType", children: "Video Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: videoType, onValueChange: setVideoType, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select video type" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "demo", children: "Demo Section Video" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "canvid_replacement", children: "Canvid Component Video (Looping)" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1", children: videoType === "demo" ? "Displays in the demo video section with controls" : "Replaces Canvid component and loops automatically" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "video", children: "Video File (MP4, Max 50MB)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "video",
                type: "file",
                accept: "video/mp4",
                onChange: handleVideoFileChange,
                required: true
              }
            ),
            videoFile && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
              "Selected: ",
              videoFile.name,
              " (",
              formatFileSize(videoFile.size),
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "thumbnail", children: "Thumbnail Image (Optional, Max 5MB)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "thumbnail",
                type: "file",
                accept: "image/*",
                onChange: handleThumbnailFileChange
              }
            ),
            thumbnailFile && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
              "Selected: ",
              thumbnailFile.name,
              " (",
              formatFileSize(thumbnailFile.size),
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                id: "active",
                checked: isActive,
                onCheckedChange: setIsActive
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "active", children: "Make this video active immediately" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "(will replace current active video of the same type)" })
          ] }),
          isUploading && uploadProgress > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Uploading..." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                uploadProgress,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "bg-blue-600 h-2 rounded-full transition-all duration-300",
                style: { width: `${uploadProgress}%` }
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: isUploading, className: "w-full", children: isUploading ? "Uploading..." : "Upload Video" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "w-5 h-5" }),
          "Manage Demo Videos"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "View and manage uploaded demo videos" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: videos.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-center py-4", children: "No videos uploaded yet" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm text-muted-foreground mb-3", children: "Demo Section Videos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            videos.filter((video) => video.video_type === "demo").map((video) => /* @__PURE__ */ jsxRuntimeExports.jsx(VideoCard, { video, onToggle: toggleVideoStatus, onReplace: replaceActiveVideo, onDelete: deleteVideo }, video.id)),
            videos.filter((video) => video.video_type === "demo").length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "No demo videos uploaded yet" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-medium text-sm text-muted-foreground mb-3", children: "Canvid Component Videos (Looping)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            videos.filter((video) => video.video_type === "canvid_replacement").map((video) => /* @__PURE__ */ jsxRuntimeExports.jsx(VideoCard, { video, onToggle: toggleVideoStatus, onReplace: replaceActiveVideo, onDelete: deleteVideo }, video.id)),
            videos.filter((video) => video.video_type === "canvid_replacement").length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "No Canvid replacement videos uploaded yet" })
          ] })
        ] })
      ] }) })
    ] })
  ] });
};
const Settings = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = reactExports.useState("profile");
  const [isAdmin, setIsAdmin] = reactExports.useState(false);
  const [savedEntries, setSavedEntries] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      try {
        const roleRef = doc(db, "user_roles", user.uid);
        const roleSnap = await getDoc(roleRef);
        if (roleSnap.exists()) {
          setIsAdmin(roleSnap.data()?.role === "admin");
        }
      } catch (error) {
        console.log("Could not check admin role:", error);
      }
    };
    checkAdminRole();
  }, [user]);
  reactExports.useEffect(() => {
    const entries = localStorage.getItem("savedEntries");
    if (entries) {
      setSavedEntries(JSON.parse(entries));
    }
  }, []);
  reactExports.useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (requestedTab) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);
  reactExports.useEffect(() => {
    const handleSettingsUpdated = (e) => {
      const event = e;
      const setting = event.detail?.setting;
      if (setting === "profile") setActiveTab("profile");
      else if (setting === "voice") setActiveTab("voice");
      else if (setting && setting.includes("notification")) setActiveTab("notifications");
      else if (setting && setting.includes("automation")) setActiveTab("notifications");
      else setActiveTab((prev) => prev || "profile");
    };
    const handleNovaExport = () => {
      setActiveTab("data-management");
    };
    window.addEventListener("nova:settings-updated", handleSettingsUpdated);
    window.addEventListener("nova:export-data", handleNovaExport);
    return () => {
      window.removeEventListener("nova:settings-updated", handleSettingsUpdated);
      window.removeEventListener("nova:export-data", handleNovaExport);
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid-blueprint" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 py-8 max-w-4xl relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "protocol-tag mb-3", children: "PROTOCOL: CONFIGURATION" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "archive-title text-2xl mb-1", children: "SETTINGS" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mono text-xs text-muted-foreground", children: "MANAGE YOUR ACCOUNT AND PREFERENCES" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard", className: "btn-galvanized btn-galvanized-secondary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4" }),
          "DASHBOARD"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, orientation: "vertical", className: "flex gap-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "galvanized-card p-4 h-fit w-64", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "flex flex-col h-fit w-full bg-transparent p-0 gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "profile", className: "nav-item-skeletal w-full justify-start data-[state=active]:active", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "w-4 h-4" }),
            "PROFILE"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "security", className: "nav-item-skeletal w-full justify-start data-[state=active]:active", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-4 h-4" }),
            "SECURITY"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "notifications", className: "nav-item-skeletal w-full justify-start data-[state=active]:active", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "w-4 h-4" }),
            "NOTIFICATIONS"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "appearance", className: "nav-item-skeletal w-full justify-start data-[state=active]:active", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Palette, { className: "w-4 h-4" }),
            "APPEARANCE"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "voice", className: "nav-item-skeletal w-full justify-start data-[state=active]:active", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "w-4 h-4" }),
            "VOICE_SETTINGS"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "nova-memory", className: "nav-item-skeletal w-full justify-start data-[state=active]:active", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "w-4 h-4" }),
            "NOVA_MEMORY"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "automation", className: "nav-item-skeletal w-full justify-start data-[state=active]:active", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-4 h-4" }),
            "AUTOMATION_API"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "subscription", className: "nav-item-skeletal w-full justify-start data-[state=active]:active", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "w-4 h-4" }),
            "SUBSCRIPTION"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "data-management", className: "nav-item-skeletal w-full justify-start data-[state=active]:active", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Database, { className: "w-4 h-4" }),
            "DATA_MANAGEMENT"
          ] }),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "admin-videos", className: "nav-item-skeletal w-full justify-start data-[state=active]:active", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Video, { className: "w-4 h-4" }),
            "DEMO_VIDEOS"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "help", className: "nav-item-skeletal w-full justify-start data-[state=active]:active", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleHelp, { className: "w-4 h-4" }),
            "HELP_SUPPORT"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "profile", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProfileSettings, { user }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "security", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SecuritySettings, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "notifications", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationSettings, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "appearance", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AppearanceSettings, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "voice", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VoiceSettings, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "nova-memory", children: /* @__PURE__ */ jsxRuntimeExports.jsx(NovaMemorySettings, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "automation", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AutomationSettings, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "subscription", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SubscriptionSettings, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "data-management", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EnhancedDataManagementSettings, {}) }),
          isAdmin && /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "admin-videos", children: /* @__PURE__ */ jsxRuntimeExports.jsx(VideoUpload, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "help", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EnhancedHelpSupportSettings, {}) })
        ] })
      ] })
    ] })
  ] });
};
export {
  Settings as default
};
