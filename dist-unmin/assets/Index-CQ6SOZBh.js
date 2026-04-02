import { a as reactExports, j as jsxRuntimeExports } from "./vendor-ui-CLSr_GWM.js";
import { c as createLucideIcon, B as Button, L as LoaderCircle, J as Jt, d as db, D as Download, X, S as Sparkles, M as Mic, u as useAuth, a as Link } from "./index-CT7EzYyk.js";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription } from "./dialog-qADkFQn2.js";
import { I as Input } from "./input-B1KmmYia.js";
import { L as Label } from "./label-Leg8N3DR.js";
import { p as collection, t as query, w as where, v as getDocs, q as addDoc, n as serverTimestamp } from "./vendor-firebase-N64baH19.js";
import { M as Mail } from "./mail-C7YTOEcz.js";
import { V as Volume2 } from "./volume-2-CGxA2eie.js";
import { C as Check } from "./check-CZQFmZAj.js";
import { A as ArrowRight } from "./arrow-right-BytWGEK7.js";
import { S as Sun, M as Moon } from "./sun-ClaBTJnm.js";
import "./vendor-charts-hYiuCXaC.js";
const MicOff = createLucideIcon("MicOff", [
  ["line", { x1: "2", x2: "22", y1: "2", y2: "22", key: "a6p6uj" }],
  ["path", { d: "M18.89 13.23A7.12 7.12 0 0 0 19 12v-2", key: "80xlxr" }],
  ["path", { d: "M5 10v2a7 7 0 0 0 12 5", key: "p2k8kg" }],
  ["path", { d: "M15 9.34V5a3 3 0 0 0-5.68-1.33", key: "1gzdoj" }],
  ["path", { d: "M9 9v3a3 3 0 0 0 5.12 2.12", key: "r2i35w" }],
  ["line", { x1: "12", x2: "12", y1: "19", y2: "22", key: "x3vr5v" }]
]);
const VolumeX = createLucideIcon("VolumeX", [
  [
    "path",
    {
      d: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",
      key: "uqj9uw"
    }
  ],
  ["line", { x1: "22", x2: "16", y1: "9", y2: "15", key: "1ewh16" }],
  ["line", { x1: "16", x2: "22", y1: "9", y2: "15", key: "5ykzw1" }]
]);
function WaitingListModal({ open, onOpenChange }) {
  const [email, setEmail] = reactExports.useState("");
  const [name, setName] = reactExports.useState("");
  const [isLoading, setIsLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const handleVoiceClose = () => {
      if (open) {
        console.log("🎙️ Voice command: closing waiting list modal");
        onOpenChange(false);
      }
    };
    window.addEventListener("close-modal", handleVoiceClose);
    window.addEventListener("close-waitlist", handleVoiceClose);
    return () => {
      window.removeEventListener("close-modal", handleVoiceClose);
      window.removeEventListener("close-waitlist", handleVoiceClose);
    };
  }, [open, onOpenChange]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      Jt.error("Please enter your email address");
      return;
    }
    setIsLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const waitingListRef = collection(db, "waiting_list");
      const q = query(waitingListRef, where("email", "==", normalizedEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        Jt.error("This email is already on our waiting list!");
        return;
      }
      await addDoc(waitingListRef, {
        email: normalizedEmail,
        name: name.trim() || null,
        created_at: serverTimestamp()
      });
      Jt.success("Thanks for joining! We'll notify you when Save Me launches.");
      setEmail("");
      setName("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error joining waiting list:", error);
      Jt.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-5 w-5 text-primary" }),
        "Join the Waiting List"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Be the first to know when Save Me launches. We'll send you early access and exclusive updates." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "email", children: "Email Address *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "email",
            type: "email",
            placeholder: "you@example.com",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            required: true,
            disabled: isLoading
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "name", children: "Name (Optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "name",
            type: "text",
            placeholder: "Your name",
            value: name,
            onChange: (e) => setName(e.target.value),
            disabled: isLoading
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => onOpenChange(false),
            disabled: isLoading,
            className: "flex-1",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "submit",
            disabled: isLoading,
            className: "flex-1",
            children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
              "Joining..."
            ] }) : "Join Waiting List"
          }
        )
      ] })
    ] })
  ] }) });
}
const VideoModal = ({ open, onOpenChange, videoUrl, title }) => {
  reactExports.useEffect(() => {
    const handleVoiceClose = () => {
      if (open) {
        console.log("🎙️ Voice command: closing video modal");
        onOpenChange(false);
      }
    };
    window.addEventListener("close-modal", handleVoiceClose);
    window.addEventListener("close-video", handleVoiceClose);
    return () => {
      window.removeEventListener("close-modal", handleVoiceClose);
      window.removeEventListener("close-video", handleVoiceClose);
    };
  }, [open, onOpenChange]);
  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`;
      link.click();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-4xl w-full p-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { className: "p-6 pb-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center justify-between", children: [
      title,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            onClick: handleDownload,
            className: "h-6 w-6 rounded-full",
            title: "Download video",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            onClick: () => onOpenChange(false),
            className: "h-6 w-6 rounded-full",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative w-full", style: { paddingBottom: "56.25%" }, children: videoUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "video",
      {
        className: "absolute inset-0 w-full h-full rounded-lg",
        controls: true,
        autoPlay: true,
        src: videoUrl,
        children: "Your browser does not support the video tag."
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "No video available" }) }) }) })
  ] }) });
};
const CanvidVideoPlayer = ({
  canvidUrl = "https://app.canvid.com/",
  title = "Interactive Demo",
  className = "w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]",
  loading = false
}) => {
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${className} relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-2`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full bg-gradient-to-br from-background/50 to-background/30 dark:from-background/30 dark:to-background/10 rounded-xl backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center p-8 max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-primary/30 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "w-8 h-8 text-primary/60 animate-spin", fill: "none", viewBox: "0 0 24 24", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-bold text-foreground mb-3", children: "Loading Demo..." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Please wait while we prepare the interactive demo" })
    ] }) }) });
  }
  const handleCanvidClick = () => {
    window.open(canvidUrl, "_blank", "noopener,noreferrer");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: `${className} relative rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-2 cursor-pointer group`,
      onClick: handleCanvidClick,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-full bg-gradient-to-br from-background/50 to-background/30 dark:from-background/30 dark:to-background/10 rounded-xl backdrop-blur-sm relative", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center p-8 max-w-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-primary/30 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-8 h-8 text-primary", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M8 5v14l11-7z" }) }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-bold text-foreground mb-3", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mb-4", children: "Click to watch the interactive demo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center text-sm text-primary font-medium", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Open Interactive Demo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" }) })
        ] })
      ] }) })
    }
  );
};
const DEMO_TTS_URL = `${"https://us-central1-saveme-f5af0.cloudfunctions.net"}/demoTts`;
const DEMO_VOICES = {
  rachel: "rachel",
  // Warm female (en-US-Studio-O)
  adam: "adam",
  // Professional male (en-US-Studio-M)
  aria: "aria",
  // Expressive female (en-US-Neural2-F)
  josh: "josh"
  // Deep male (en-US-Neural2-D)
};
let isSpeakingFlag = false;
let currentAudio = null;
let cloudTtsAvailable = null;
let browserVoicesLoaded = false;
let browserVoices = [];
const loadBrowserVoices = () => {
  return new Promise((resolve) => {
    if (browserVoicesLoaded && browserVoices.length > 0) {
      resolve(browserVoices);
      return;
    }
    const synth = window.speechSynthesis;
    browserVoices = synth.getVoices();
    if (browserVoices.length > 0) {
      browserVoicesLoaded = true;
      resolve(browserVoices);
      return;
    }
    const onVoicesChanged = () => {
      browserVoices = synth.getVoices();
      browserVoicesLoaded = true;
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(browserVoices);
    };
    synth.addEventListener("voiceschanged", onVoicesChanged);
    setTimeout(() => {
      if (!browserVoicesLoaded) {
        browserVoices = synth.getVoices();
        browserVoicesLoaded = true;
        resolve(browserVoices);
      }
    }, 1e3);
  });
};
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  loadBrowserVoices();
}
const demoSpeak = async (text, options) => {
  if (!text || text.trim().length === 0) {
    options?.onEnd?.();
    return;
  }
  const voice = DEMO_VOICES[options.voice];
  isSpeakingFlag = true;
  options?.onStart?.();
  window.dispatchEvent(new CustomEvent("demo-tts-started"));
  try {
    if (DEMO_TTS_URL) {
      console.log("[DemoTTS] Using server-side Google Cloud TTS proxy");
      await speakWithCloudFunction(text, voice);
      cloudTtsAvailable = true;
    } else {
      console.log("[DemoTTS] No cloud function URL, using browser TTS");
      await speakWithBrowser(text);
    }
  } catch (error) {
    console.error("[DemoTTS] Error:", error);
    cloudTtsAvailable = false;
    if (DEMO_TTS_URL) {
      console.log("[DemoTTS] Falling back to browser TTS");
      try {
        await speakWithBrowser(text);
      } catch (browserError) {
        console.error("[DemoTTS] Browser TTS fallback also failed:", browserError);
      }
    }
  } finally {
    isSpeakingFlag = false;
    currentAudio = null;
    window.dispatchEvent(new CustomEvent("demo-tts-completed"));
    options?.onEnd?.();
  }
};
const speakWithCloudFunction = async (text, voice) => {
  const response = await fetch(DEMO_TTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.substring(0, 500), voice })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DemoTTS] Cloud function error:", response.status, errorText);
    throw new Error(`Cloud function error: ${response.status}`);
  }
  const data = await response.json();
  const audioBytes = Uint8Array.from(atob(data.audioContent), (c) => c.charCodeAt(0));
  const audioBlob = new Blob([audioBytes], { type: "audio/mpeg" });
  const audioUrl = URL.createObjectURL(audioBlob);
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl);
      reject(error);
    };
    audio.volume = 0.9;
    audio.play().catch(reject);
  });
};
const speakWithBrowser = async (text) => {
  if (!("speechSynthesis" in window)) {
    throw new Error("Speech synthesis not supported");
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = await loadBrowserVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 0.9;
  utterance.lang = "en-US";
  const voicePreferences = [
    "Google US English",
    "Google UK English Female",
    "Microsoft Zira",
    "Microsoft David",
    "Samantha",
    "Karen",
    "Daniel"
  ];
  let selectedVoice = null;
  for (const pref of voicePreferences) {
    selectedVoice = voices.find((v) => v.name.includes(pref)) || null;
    if (selectedVoice) break;
  }
  if (!selectedVoice) {
    selectedVoice = voices.find((v) => v.lang.startsWith("en")) || null;
  }
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  await new Promise((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(event);
    synth.speak(utterance);
  });
};
const demoStopSpeaking = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  isSpeakingFlag = false;
  window.dispatchEvent(new CustomEvent("demo-tts-completed"));
};
const demoIsSpeaking = () => isSpeakingFlag;
const isCloudTtsAvailable = () => {
  if (cloudTtsAvailable !== null) return cloudTtsAvailable;
  return !!DEMO_TTS_URL;
};
const CATEGORIES = {
  Work: { keywords: ["meeting", "work", "project", "client", "deadline", "report", "presentation", "boss", "colleague", "office", "team", "sprint", "standup"], icon: "💼" },
  Finance: { keywords: ["buy", "pay", "money", "budget", "invoice", "expense", "cost", "price", "bank", "payment", "credit", "bill"], icon: "💰" },
  Health: { keywords: ["doctor", "health", "medicine", "appointment", "prescription", "exercise", "gym", "workout", "fitness", "diet"], icon: "🏥" },
  Personal: { keywords: ["mom", "dad", "family", "birthday", "anniversary", "dinner", "friend", "kids", "wife", "husband", "home"], icon: "👤" },
  Ideas: { keywords: ["idea", "creative", "podcast", "blog", "content", "video", "article", "book", "write", "brainstorm"], icon: "💡" },
  Travel: { keywords: ["flight", "hotel", "trip", "vacation", "travel", "airport", "booking", "destination"], icon: "✈️" },
  Shopping: { keywords: ["amazon", "order", "shopping", "store", "delivery", "package", "groceries"], icon: "🛒" },
  Learning: { keywords: ["course", "study", "learn", "class", "tutorial", "lesson", "training", "read"], icon: "📚" },
  Spiritual: { keywords: ["prayer", "meditation", "journal", "reflection", "gratitude", "faith", "church", "intention"], icon: "🙏" }
};
const ACTION_VERBS = ["remind", "call", "email", "send", "schedule", "book", "meet", "buy", "pick up", "get", "do", "finish", "complete", "submit", "check", "follow up", "contact", "text", "pay"];
const ConversationalVoiceDemo = ({ onSignupClick, theme }) => {
  const [state, setState] = reactExports.useState("idle");
  const [transcript, setTranscript] = reactExports.useState("");
  const [interimTranscript, setInterimTranscript] = reactExports.useState("");
  const [detectedEntry, setDetectedEntry] = reactExports.useState(null);
  const [conversationHistory, setConversationHistory] = reactExports.useState([]);
  const [isSpeaking, setIsSpeaking] = reactExports.useState(false);
  const [voiceEnabled, setVoiceEnabled] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [usingCloudTts, setUsingElevenLabs] = reactExports.useState(false);
  const recognitionRef = reactExports.useRef(null);
  const conversationRef = reactExports.useRef(null);
  const stateRef = reactExports.useRef(state);
  const transcriptRef = reactExports.useRef(transcript);
  reactExports.useEffect(() => {
    stateRef.current = state;
  }, [state]);
  reactExports.useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);
  const isSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  reactExports.useEffect(() => {
    setUsingElevenLabs(isCloudTtsAvailable());
  }, []);
  reactExports.useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversationHistory, interimTranscript]);
  const speak = reactExports.useCallback((text, onEnd) => {
    if (!voiceEnabled) {
      onEnd?.();
      return;
    }
    demoSpeak(text, {
      voice: "rachel",
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        onEnd?.();
      }
    });
  }, [voiceEnabled]);
  const addMessage = reactExports.useCallback((speaker, text) => {
    setConversationHistory((prev) => [...prev, { speaker, text }]);
  }, []);
  const detectCategory = (text) => {
    const lower = text.toLowerCase();
    let bestCategory = "Personal";
    let maxScore = 0;
    for (const [category, data] of Object.entries(CATEGORIES)) {
      let score = 0;
      for (const keyword of data.keywords) {
        if (lower.includes(keyword)) score++;
      }
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }
    return { category: bestCategory, confidence: maxScore > 0 ? 0.8 : 0.5 };
  };
  const generateTitle = (text) => {
    for (const verb of ACTION_VERBS) {
      const regex = new RegExp(`${verb}\\s+(.{3,30})(?:\\s+(?:tomorrow|today|on|at|by)|$)`, "i");
      const match = text.match(regex);
      if (match) {
        const title = verb.charAt(0).toUpperCase() + verb.slice(1) + " " + match[1].trim();
        return title.length > 40 ? title.substring(0, 40) + "..." : title;
      }
    }
    const words = text.split(" ").slice(0, 5).join(" ");
    return words.length > 40 ? words.substring(0, 40) + "..." : words;
  };
  const detectDueDate = (text) => {
    const lower = text.toLowerCase();
    if (/\btoday\b/.test(lower)) return "Today";
    if (/\btomorrow\b/.test(lower)) return "Tomorrow";
    if (/\bthis week\b/.test(lower)) return "This week";
    if (/\bnext week\b/.test(lower)) return "Next week";
    const dayMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dayMatch) return dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1);
    return void 0;
  };
  const detectPriority = (text) => {
    const lower = text.toLowerCase();
    if (/urgent|asap|immediately|critical|important/.test(lower)) return "high";
    if (/soon|this week|should|need to/.test(lower)) return "medium";
    return void 0;
  };
  const detectPeople = (text) => {
    const people = [];
    const patterns = [
      /(?:call|email|text|meet|contact|tell|ask)\s+([A-Z][a-z]+)/g,
      /(?:with|from|to)\s+([A-Z][a-z]+)(?:\s|$)/g
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (!["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "The", "This", "That"].includes(match[1])) {
          people.push(match[1]);
        }
      }
    }
    return [...new Set(people)];
  };
  const doStartListening = reactExports.useCallback(() => {
    if (!recognitionRef.current) {
      console.log("[VoiceDemo] No recognition ref");
      return;
    }
    if (demoIsSpeaking()) {
      console.log("[VoiceDemo] TTS is speaking, not starting recognition");
      return;
    }
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    transcriptRef.current = "";
    try {
      console.log("[VoiceDemo] Starting recognition...");
      recognitionRef.current.start();
      console.log("[VoiceDemo] Recognition started");
    } catch (e) {
      console.error("[VoiceDemo] Failed to start recognition:", e);
    }
  }, []);
  const processInput = reactExports.useCallback((text) => {
    console.log("[VoiceDemo] Processing input:", text);
    setState("processing");
    addMessage("user", text);
    setTimeout(() => {
      const { category, confidence } = detectCategory(text);
      const entry = {
        text: text.trim(),
        category,
        suggestedTitle: generateTitle(text),
        confidence,
        dueDate: detectDueDate(text),
        priority: detectPriority(text),
        people: detectPeople(text),
        actionItem: ACTION_VERBS.some((v) => text.toLowerCase().includes(v)) ? text : void 0
      };
      setDetectedEntry(entry);
      setState("confirming");
      let response = `Got it! I'll save this as a ${category} entry`;
      if (entry.dueDate) response += ` with a reminder for ${entry.dueDate}`;
      if (entry.priority === "high") response += `. I marked it as high priority`;
      response += `. The title will be "${entry.suggestedTitle}". Say "save" to confirm, "change title" to edit, or "change category" for a different one.`;
      addMessage("assistant", response);
      speak(response, () => {
        setState("waiting_response");
        doStartListening();
      });
    }, 500);
  }, [addMessage, speak, doStartListening]);
  const handleResponse = reactExports.useCallback((text) => {
    const lower = text.toLowerCase().trim();
    const currentState = stateRef.current;
    console.log("[VoiceDemo] Handling response:", text, "state:", currentState);
    addMessage("user", text);
    if (currentState === "waiting_response") {
      if (/^(save|yes|confirm|ok|okay|sure|do it|go ahead|yep|yeah)/.test(lower)) {
        setState("saved");
        const savedMsg = `Saved! Your ${detectedEntry?.category} entry "${detectedEntry?.suggestedTitle}" has been stored.`;
        addMessage("assistant", savedMsg);
        speak(savedMsg);
        const stored = JSON.parse(localStorage.getItem("saveme_demo_entries") || "[]");
        stored.push({ ...detectedEntry, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
        localStorage.setItem("saveme_demo_entries", JSON.stringify(stored));
      } else if (/change\s*(the\s*)?title|edit\s*title|different\s*title/.test(lower)) {
        setState("editing_title");
        const msg = "What would you like to call this entry?";
        addMessage("assistant", msg);
        speak(msg, () => doStartListening());
      } else if (/change\s*(the\s*)?category|different\s*category|edit\s*category/.test(lower)) {
        setState("editing_category");
        const categories = Object.keys(CATEGORIES).join(", ");
        const msg = `Which category? Options are: ${categories}`;
        addMessage("assistant", msg);
        speak(msg, () => doStartListening());
      } else if (/^(cancel|nevermind|never\s*mind|stop|no|don't)/.test(lower)) {
        setState("idle");
        const msg = "Okay, cancelled. Tap the mic when you're ready to try again.";
        addMessage("assistant", msg);
        speak(msg);
        setDetectedEntry(null);
        setConversationHistory([]);
      } else {
        const msg = "I didn't catch that. Say 'save' to confirm, 'change title', 'change category', or 'cancel'.";
        addMessage("assistant", msg);
        speak(msg, () => doStartListening());
      }
    } else if (currentState === "editing_title") {
      if (detectedEntry) {
        const newTitle = text.trim();
        setDetectedEntry({ ...detectedEntry, suggestedTitle: newTitle });
        setState("waiting_response");
        const msg = `Title updated to "${newTitle}". Say "save" to confirm.`;
        addMessage("assistant", msg);
        speak(msg, () => doStartListening());
      }
    } else if (currentState === "editing_category") {
      const matchedCategory = Object.keys(CATEGORIES).find(
        (c) => lower.includes(c.toLowerCase())
      );
      if (matchedCategory && detectedEntry) {
        setDetectedEntry({ ...detectedEntry, category: matchedCategory });
        setState("waiting_response");
        const msg = `Category changed to ${matchedCategory}. Say "save" to confirm.`;
        addMessage("assistant", msg);
        speak(msg, () => doStartListening());
      } else {
        const msg = "I didn't recognize that category. Try Work, Personal, Finance, Health, Ideas, Travel, Shopping, Learning, or Spiritual.";
        addMessage("assistant", msg);
        speak(msg, () => doStartListening());
      }
    }
  }, [detectedEntry, addMessage, speak, doStartListening]);
  reactExports.useEffect(() => {
    if (!isSupported) return;
    console.log("[VoiceDemo] Initializing speech recognition");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => {
      console.log("[VoiceDemo] Recognition onstart fired");
    };
    recognition.onresult = (event) => {
      console.log("[VoiceDemo] Recognition onresult", event.results);
      let finalTranscript = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimText += transcriptPart;
        }
      }
      setInterimTranscript(interimText);
      if (finalTranscript) {
        console.log("[VoiceDemo] Final transcript:", finalTranscript);
        setTranscript(finalTranscript);
        transcriptRef.current = finalTranscript;
      }
    };
    recognition.onend = () => {
      console.log("[VoiceDemo] Recognition onend, state:", stateRef.current, "transcript:", transcriptRef.current);
      setInterimTranscript("");
      const currentTranscript = transcriptRef.current;
      const currentState = stateRef.current;
      if (currentTranscript && currentState === "listening") {
        transcriptRef.current = "";
        setTranscript("");
        processInput(currentTranscript);
      } else if (currentTranscript && (currentState === "waiting_response" || currentState === "editing_title" || currentState === "editing_category")) {
        transcriptRef.current = "";
        setTranscript("");
        handleResponse(currentTranscript);
      }
    };
    recognition.onerror = (event) => {
      console.error("[VoiceDemo] Recognition error:", event.error);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access and try again.");
        setState("idle");
      } else if (event.error === "no-speech" || event.error === "aborted") {
        console.log("[VoiceDemo] Benign error (no-speech/aborted), keeping current state");
      } else {
        setError(`Speech recognition error: ${event.error}`);
        setState("idle");
      }
      setInterimTranscript("");
    };
    recognitionRef.current = recognition;
    return () => {
      console.log("[VoiceDemo] Cleanup: stopping recognition");
      recognition.stop();
      demoStopSpeaking();
    };
  }, [isSupported]);
  reactExports.useEffect(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.onend = () => {
      console.log("[VoiceDemo] Recognition onend (updated), state:", stateRef.current, "transcript:", transcriptRef.current);
      setInterimTranscript("");
      const currentTranscript = transcriptRef.current;
      const currentState = stateRef.current;
      if (currentTranscript && currentState === "listening") {
        transcriptRef.current = "";
        setTranscript("");
        processInput(currentTranscript);
      } else if (currentTranscript && (currentState === "waiting_response" || currentState === "editing_title" || currentState === "editing_category")) {
        transcriptRef.current = "";
        setTranscript("");
        handleResponse(currentTranscript);
      }
    };
  }, [processInput, handleResponse]);
  const stopListening = reactExports.useCallback(() => {
    console.log("[VoiceDemo] Stopping listening");
    recognitionRef.current?.stop();
  }, []);
  const startConversation = () => {
    console.log("[VoiceDemo] Starting conversation");
    setConversationHistory([]);
    setDetectedEntry(null);
    setState("listening");
    doStartListening();
  };
  const resetConversation = () => {
    console.log("[VoiceDemo] Resetting conversation");
    setState("idle");
    setConversationHistory([]);
    setDetectedEntry(null);
    setTranscript("");
    setInterimTranscript("");
    demoStopSpeaking();
  };
  const getCategoryIcon = (category) => CATEGORIES[category]?.icon || "📁";
  if (!isSupported) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-center p-8 rounded-2xl ${theme === "dark" ? "bg-zinc-900/50 border border-zinc-800" : "bg-zinc-100 border border-zinc-200"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: theme === "dark" ? "text-zinc-400" : "text-zinc-600", children: "Voice input requires a modern browser. Try Chrome, Edge, or Safari." }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-lg mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-2", children: [
      usingCloudTts && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs font-mono flex items-center gap-1 ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "w-3 h-3" }),
        " AI Voice"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setVoiceEnabled(!voiceEnabled),
          className: `p-2 rounded-full transition-colors ${theme === "dark" ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"}`,
          title: voiceEnabled ? "Mute voice responses" : "Enable voice responses",
          children: voiceEnabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeX, { className: "w-4 h-4" })
        }
      )
    ] }),
    state === "idle" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative inline-block", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: startConversation,
          className: `relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${theme === "dark" ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-2 border-zinc-700 hover:border-primary/50" : "bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 border-2 border-zinc-300 hover:border-primary/50 shadow-lg"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "w-12 h-12" })
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `font-mono text-sm tracking-wider ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`, children: "TAP TO START" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm max-w-sm mx-auto ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`, children: "Have a conversation with SaveMe. Tell me what you want to remember!" })
    ] }) : state === "saved" ? (
      /* Saved state */
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-2xl overflow-hidden ${theme === "dark" ? "bg-zinc-900/80 border border-zinc-800" : "bg-white border border-zinc-200 shadow-xl"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `px-6 py-4 flex items-center gap-3 ${theme === "dark" ? "bg-green-500/10 border-b border-zinc-800" : "bg-green-50 border-b border-zinc-200"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-5 h-5 text-green-500" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `font-semibold ${theme === "dark" ? "text-white" : "text-zinc-900"}`, children: "Saved!" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`, children: "Entry created successfully" })
          ] })
        ] }),
        detectedEntry && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: getCategoryIcon(detectedEntry.category) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `font-medium ${theme === "dark" ? "text-white" : "text-zinc-900"}`, children: detectedEntry.suggestedTitle }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`, children: detectedEntry.category })
            ] })
          ] }),
          detectedEntry.dueDate && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: `text-sm ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`, children: [
            "📅 ",
            detectedEntry.dueDate
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `px-6 py-4 flex flex-col sm:flex-row gap-3 ${theme === "dark" ? "bg-zinc-900/50 border-t border-zinc-800" : "bg-zinc-50 border-t border-zinc-200"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: onSignupClick, className: "flex-1 bg-primary hover:bg-primary/90 text-primary-foreground", children: [
            "Sign up to keep this",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4 ml-2" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: resetConversation, className: theme === "dark" ? "border-zinc-700" : "", children: "Try another" })
        ] })
      ] })
    ) : (
      /* Conversation view */
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-2xl overflow-hidden ${theme === "dark" ? "bg-zinc-900/80 border border-zinc-800" : "bg-white border border-zinc-200 shadow-xl"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `px-6 py-4 flex items-center justify-between ${theme === "dark" ? "bg-zinc-800/50 border-b border-zinc-800" : "bg-zinc-50 border-b border-zinc-200"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            (state === "listening" || state === "waiting_response" || state === "editing_title" || state === "editing_category") && !isSpeaking && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3 h-3 bg-red-500 rounded-full animate-pulse" }) }),
            state === "processing" && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin text-primary" }),
            isSpeaking && /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "w-4 h-4 text-primary animate-pulse" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-mono text-xs tracking-wider ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`, children: state === "listening" && !isSpeaking ? "LISTENING..." : state === "processing" ? "THINKING..." : (state === "waiting_response" || state === "editing_title" || state === "editing_category") && !isSpeaking ? "YOUR TURN..." : isSpeaking ? "SPEAKING..." : "" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: resetConversation,
              className: `text-xs ${theme === "dark" ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"}`,
              children: "Cancel"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: conversationRef, className: "p-4 space-y-3 max-h-64 overflow-y-auto", children: [
          conversationHistory.map((msg, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex ${msg.speaker === "user" ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `max-w-[85%] px-4 py-2 rounded-2xl text-sm ${msg.speaker === "user" ? "bg-primary text-primary-foreground rounded-br-md" : theme === "dark" ? "bg-zinc-800 text-zinc-200 rounded-bl-md" : "bg-zinc-100 text-zinc-800 rounded-bl-md"}`, children: msg.text }) }, i)),
          (interimTranscript || transcript) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-[85%] px-4 py-2 rounded-2xl rounded-br-md text-sm bg-primary/50 text-primary-foreground", children: [
            transcript || interimTranscript,
            interimTranscript && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "animate-pulse", children: "..." })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `px-6 py-4 flex justify-center ${theme === "dark" ? "bg-zinc-900/50 border-t border-zinc-800" : "bg-zinc-50 border-t border-zinc-200"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: state === "listening" ? stopListening : doStartListening,
            disabled: state === "processing" || isSpeaking,
            className: `w-14 h-14 rounded-full flex items-center justify-center transition-all ${state === "listening" ? "bg-red-500 text-white animate-pulse" : state === "processing" || isSpeaking ? "bg-zinc-600 text-zinc-400 cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90"}`,
            children: state === "listening" ? /* @__PURE__ */ jsxRuntimeExports.jsx(MicOff, { className: "w-6 h-6" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "w-6 h-6" })
          }
        ) })
      ] })
    ),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-500 text-sm text-center mt-4", children: error })
  ] });
};
const Index = () => {
  const [isComponentReady, setIsComponentReady] = reactExports.useState(false);
  const { isAuthenticated } = useAuth();
  const [isWaitingListModalOpen, setIsWaitingListModalOpen] = reactExports.useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = reactExports.useState(false);
  const [activeDemoVideo, setActiveDemoVideo] = reactExports.useState(null);
  const [activeCanvidVideo, setActiveCanvidVideo] = reactExports.useState(null);
  const [theme, setTheme] = reactExports.useState("dark");
  const toggleTheme = () => setTheme((prev) => prev === "dark" ? "light" : "dark");
  reactExports.useEffect(() => {
    setIsComponentReady(true);
  }, []);
  reactExports.useEffect(() => {
    const fetchActiveVideos = async () => {
      try {
        const videosRef = collection(db, "public_demo_videos");
        const querySnapshot = await getDocs(videosRef);
        querySnapshot.forEach((docSnap) => {
          const video = docSnap.data();
          if (video.video_type === "demo") setActiveDemoVideo({ url: video.video_url, title: video.title });
          else if (video.video_type === "canvid_replacement") setActiveCanvidVideo({ url: video.video_url, title: video.title });
        });
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };
    fetchActiveVideos();
  }, []);
  const plans = [
    { name: "FREE", price: "$0", period: "Forever", description: "Perfect for getting started", features: ["Up to 50 entries", "Basic search", "Web access only", "Standard support"], popular: false },
    { name: "BASIC", price: "$9", period: "per month", description: "For personal power users", features: ["Unlimited entries", "Advanced search & filters", "All platforms", "Voice input & commands", "Priority support"], popular: true },
    { name: "PREMIUM", price: "$19", period: "per month", description: "For teams and professionals", features: ["Everything in Basic", "Data export & backup", "Advanced encryption", "API access", "Custom integrations", "24/7 support"], popular: false }
  ];
  if (!isComponentReady) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-zinc-950", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-zinc-500 text-sm", children: "Loading..." }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `min-h-screen font-sans overflow-x-hidden transition-colors ${theme} ${theme === "dark" ? "bg-zinc-950 text-zinc-300 selection:bg-accent/30 selection:text-white" : "bg-white text-zinc-700 selection:bg-blue-200"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid-blueprint" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `max-w-[1400px] mx-auto px-4 md:px-8 min-h-screen flex flex-col ${theme === "dark" ? "border-l border-r border-zinc-800/50" : "border-l border-r border-zinc-200"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: `grid grid-cols-2 md:grid-cols-3 items-center h-20 text-sm ${theme === "dark" ? "border-b border-zinc-800/50" : "border-b border-zinc-200"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/logo.png", alt: "SaveMe.Space", className: "w-8 h-8 object-contain" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-semibold hidden sm:inline ${theme === "dark" ? "text-zinc-100" : "text-zinc-900"}`, children: "SaveMe.Space" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `hidden md:flex justify-center text-xs ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`, children: "Voice-first external memory, powered by AI" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center justify-end gap-4 ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: toggleTheme, className: `p-2 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"}`, "aria-label": "Toggle theme", children: theme === "dark" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Sun, { className: "w-4 h-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Moon, { className: "w-4 h-4" }) }),
          isAuthenticated ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboard", className: `px-5 py-2.5 rounded-lg font-medium transition-all ${theme === "dark" ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800"}`, children: "Dashboard" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: `px-5 py-2.5 rounded-lg font-medium transition-all ${theme === "dark" ? "border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800" : "border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"}`, children: "Sign In" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "py-16 md:py-24 lg:py-32 flex flex-col items-center justify-center text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8 reveal ${theme === "dark" ? "bg-primary/10 text-primary border border-primary/20" : "bg-primary/10 text-primary border border-primary/20"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "w-3 h-3" }),
          "Capture voice. Get structured memory."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: `text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 reveal stagger-1 leading-tight ${theme === "dark" ? "text-white" : "text-zinc-900"}`, children: [
          "Your brain wasn't built",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "to remember everything." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-lg md:text-xl max-w-2xl mb-12 reveal stagger-2 leading-relaxed ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`, children: "Speak your thoughts out loud. SaveMe captures, categorizes, and organizes them automatically — so you never lose an idea, task, or insight again." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-lg mb-8 reveal stagger-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ConversationalVoiceDemo, { onSignupClick: () => setIsWaitingListModalOpen(true), theme }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs mb-8 reveal stagger-4 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`, children: "Try the demo above — no signup needed" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-center gap-4 reveal stagger-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: `px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2 ${theme === "dark" ? "border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800" : "border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"}`,
              onClick: () => setIsVideoModalOpen(true),
              disabled: !activeDemoVideo,
              children: activeDemoVideo ? "Watch Demo" : "Demo Coming Soon"
            }
          ),
          isAuthenticated ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard", className: `px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2 ${theme === "dark" ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800"}`, children: [
            "Go to Dashboard",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/signup", className: `px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-2 ${theme === "dark" ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800"}`, children: [
            "Start Free",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-4 h-4" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t ${theme === "dark" ? "border-zinc-800/50" : "border-zinc-200"}`, children: [
        { num: "01", title: "Voice Capture", desc: "Just speak naturally. Capture notes, ideas, contacts, and reminders without typing a single word." },
        { num: "02", title: "AI Organization", desc: "Your data is automatically sorted into categories. No folders to manage, no tags to remember." },
        { num: "03", title: "Instant Search", desc: "Find anything in seconds. Search by keyword, category, or just describe what you're looking for." },
        { num: "04", title: "Your Data, Private", desc: "End-to-end encryption. Your information stays yours. We never sell or share your data." }
      ].map((feature, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-10 border-b md:border-b-0 md:border-r last:border-r-0 transition-all group reveal ${theme === "dark" ? "border-zinc-800/50 hover:bg-zinc-900/40" : "border-zinc-200 hover:bg-zinc-50"}`, style: { animationDelay: `${0.5 + i * 0.1}s` }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary text-2xl font-bold mb-6 block", children: feature.num }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: `font-semibold text-base mb-4 ${theme === "dark" ? "text-zinc-100" : "text-zinc-900"}`, children: feature.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm leading-relaxed transition-colors ${theme === "dark" ? "text-zinc-500 group-hover:text-zinc-400" : "text-zinc-600 group-hover:text-zinc-700"}`, children: feature.desc })
      ] }, i)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: `py-24 px-8 border-t ${theme === "dark" ? "border-zinc-800/50" : "border-zinc-200"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-5xl mx-auto text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8 reveal ${theme === "dark" ? "bg-primary/10 text-primary border border-primary/20" : "bg-primary/10 text-primary border border-primary/20"}`, children: "Pure voice. Zero friction." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: `text-3xl md:text-5xl font-bold mb-8 reveal stagger-1 ${theme === "dark" ? "text-white" : "text-zinc-900"}`, children: "See It in Action" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mb-16 max-w-2xl mx-auto text-lg reveal stagger-2 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`, children: "Watch how SaveMe transforms your voice into organized, searchable knowledge — in seconds" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-2 reveal stagger-3 relative group rounded-2xl overflow-hidden border ${theme === "dark" ? "bg-zinc-900/30 border-zinc-800/50" : "bg-zinc-50 border-zinc-200"}`, children: activeCanvidVideo ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: activeCanvidVideo.url, autoPlay: true, loop: true, muted: true, playsInline: true, className: "w-full h-auto rounded-xl opacity-90 group-hover:opacity-100 transition-opacity", poster: "/lovable-uploads/a639f87a-4cb3-486d-8907-1bf0d03cc4e4.png" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CanvidVideoPlayer, { canvidUrl: "https://app.canvid.com/", title: "Interactive Demo", loading: false }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: `py-24 px-8 border-t ${theme === "dark" ? "border-zinc-800/50" : "border-zinc-200"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-5xl mx-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-12 md:p-20 relative overflow-hidden rounded-2xl ${theme === "dark" ? "bg-zinc-900/30 border border-zinc-800/50" : "bg-zinc-50 border border-zinc-200"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: `text-3xl md:text-4xl font-bold mb-16 text-center reveal ${theme === "dark" ? "text-white" : "text-zinc-900"}`, children: "Sound familiar?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-2 gap-x-12 gap-y-8", children: [
          { title: "Scattered Info", desc: "Important stuff spread across notes, emails, texts, and sticky notes" },
          { title: "Can't Find It", desc: "You know you saved it somewhere... but where?" },
          { title: "Wrong Device", desc: "The info you need is always on your other phone/laptop" },
          { title: "No Time to Organize", desc: "Life moves too fast for manual tagging and folder sorting" },
          { title: "Info Overload", desc: "Too much data, no system to make it actionable" },
          { title: "Lost Ideas", desc: "That insight from the shower is gone forever" }
        ].map((pain, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4 group reveal stagger-1", style: { animationDelay: `${0.2 + i * 0.05}s` }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-primary mt-2 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-primary block mb-1", children: pain.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm transition-colors ${theme === "dark" ? "text-zinc-500 group-hover:text-zinc-400" : "text-zinc-600 group-hover:text-zinc-700"}`, children: pain.desc })
          ] })
        ] }, i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-center mt-20 pt-12 border-t ${theme === "dark" ? "border-zinc-800/20" : "border-zinc-200"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm mb-8 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`, children: "If this is you — just start talking" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: `px-8 py-3 rounded-lg font-medium transition-all ${theme === "dark" ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800"}`, onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }), children: "Try Voice Capture Now" })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: `py-24 px-8 border-t ${theme === "dark" ? "border-zinc-800/50" : "border-zinc-200"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8 reveal ${theme === "dark" ? "bg-primary/10 text-primary border border-primary/20" : "bg-primary/10 text-primary border border-primary/20"}`, children: "Simple Pricing" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: `text-3xl md:text-5xl font-bold mb-8 reveal stagger-1 ${theme === "dark" ? "text-white" : "text-zinc-900"}`, children: "Choose your plan" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm reveal stagger-2 ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`, children: "Start free. Upgrade when you're ready. No lock-in." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid md:grid-cols-3 gap-8", children: plans.map((plan, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-8 rounded-2xl relative transition-all group reveal ${plan.popular ? "border-2 border-primary/40 shadow-lg shadow-primary/10" : "border"} ${theme === "dark" ? "bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700" : "bg-white border-zinc-200 hover:border-zinc-300"}`, style: { animationDelay: `${0.3 + i * 0.1}s` }, children: [
          plan.popular && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-3 left-1/2 -translate-x-1/2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-4 py-1 bg-primary text-white text-xs font-semibold rounded-full", children: "Most Popular" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-10 pt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: `text-sm font-semibold mb-4 ${theme === "dark" ? "text-zinc-100" : "text-zinc-900"}`, children: plan.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-center gap-1 mb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-5xl font-bold tracking-tight text-primary", children: plan.price }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-sm ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`, children: [
                "/",
                plan.period === "Forever" ? "free" : "mo"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-sm ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`, children: plan.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: `space-y-4 mb-10 border-t pt-8 ${theme === "dark" ? "border-zinc-800/50" : "border-zinc-200"}`, children: plan.features.map((feature, j) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: `flex items-center gap-3 text-sm ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-primary shrink-0" }),
            feature
          ] }, j)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: `w-full px-6 py-3 rounded-lg font-medium transition-all ${plan.popular ? theme === "dark" ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800" : theme === "dark" ? "border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800" : "border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"}`, onClick: () => setIsWaitingListModalOpen(true), children: plan.price === "$0" ? "Start Free" : "Get Started" })
        ] }, i)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: `py-24 px-8 border-t text-center ${theme === "dark" ? "border-zinc-800/50" : "border-zinc-200"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: `text-3xl md:text-5xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-zinc-900"}`, children: [
          "Ready to ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "offload your brain?" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-lg mb-8 max-w-xl mx-auto ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`, children: "Your external memory is one voice command away." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/signup", className: `inline-flex items-center gap-2 px-8 py-4 text-lg rounded-lg font-medium transition-all ${theme === "dark" ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-800"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "w-5 h-5" }),
          "Start Free — No Card Needed"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: `mt-auto border-t py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-8 text-sm ${theme === "dark" ? "border-zinc-800/50 text-zinc-600" : "border-zinc-200 text-zinc-500"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "© 2026 SaveMe.Space — Your External Memory" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "mailto:info@saveme.space", className: "hover:text-primary transition-colors flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "w-4 h-4" }),
            "Contact"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/privacy", className: "hover:text-primary transition-colors", children: "Privacy" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/terms", className: "hover:text-primary transition-colors", children: "Terms" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-2 h-2 rounded-full bg-primary animate-pulse" }),
          "Secure & Encrypted"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WaitingListModal, { open: isWaitingListModalOpen, onOpenChange: setIsWaitingListModalOpen }),
    activeDemoVideo && /* @__PURE__ */ jsxRuntimeExports.jsx(VideoModal, { open: isVideoModalOpen, onOpenChange: setIsVideoModalOpen, videoUrl: activeDemoVideo.url, title: activeDemoVideo.title })
  ] });
};
export {
  Index as default
};
