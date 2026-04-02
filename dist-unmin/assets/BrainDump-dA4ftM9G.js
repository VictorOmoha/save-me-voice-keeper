import { a as reactExports, j as jsxRuntimeExports } from "./vendor-ui-CLSr_GWM.js";
import { J as Jt, b as useNavigate, B as Button, C as Card, e as CardHeader, f as CardTitle, h as CardContent, L as LoaderCircle, S as Sparkles, T as Tag, l as auth } from "./index-CT7EzYyk.js";
import { I as Input } from "./input-B1KmmYia.js";
import { T as Textarea } from "./textarea-f5_v0hBa.js";
import { B as Badge } from "./badge-CRUpIyW6.js";
import { u as useSavedEntries } from "./useSavedEntries-BbNCU1rB.js";
import { a as speak } from "./textToSpeech-BNc-vD0B.js";
import { A as ArrowLeft } from "./arrow-left-CCcLkmU5.js";
import { L as LayoutDashboard } from "./layout-dashboard-C-fAhggi.js";
import { Z as Zap } from "./zap-CZIUQ85z.js";
import { U as Users } from "./users-C124q9JP.js";
import "./vendor-charts-hYiuCXaC.js";
import "./vendor-firebase-N64baH19.js";
class BrainDumpProcessor {
  processBrainDump(content) {
    console.log("🧠 Processing brain dump content:", content);
    const cleanContent = content.replace(/^BRAIN_DUMP:\s*/, "").trim();
    const actionItems = this.extractActionItems(cleanContent);
    const keyPoints = this.extractKeyPoints(cleanContent);
    const notes = this.extractNotes(cleanContent);
    const category = this.inferCategory(cleanContent);
    const tags = this.extractTags(cleanContent);
    const title = this.generateTitle(cleanContent);
    const structuredFields = this.extractStructuredFields(cleanContent);
    const people = this.extractPeople(cleanContent);
    return {
      title,
      category,
      tags,
      actionItems,
      notes,
      keyPoints,
      people,
      structuredFields,
      confidence: this.calculateConfidence(cleanContent, actionItems, keyPoints, notes)
    };
  }
  extractActionItems(content) {
    const actionPatterns = [
      /(?:need to|have to|must|should|todo|action|task)[\s:]([^.!?]+)/gi,
      /(?:remember to|don't forget to|make sure to)[\s:]([^.!?]+)/gi,
      /(?:call|email|contact|reach out to|schedule|book|set up)[\s:]([^.!?]+)/gi,
      /(?:follow up|check on|review|prepare|complete|finish|send|submit)[\s:]([^.!?]+)/gi
    ];
    const actions = [];
    const seenTexts = /* @__PURE__ */ new Set();
    const sentences = content.split(/[.!?]+/);
    sentences.forEach((sentence) => {
      actionPatterns.forEach((pattern) => {
        const matches = sentence.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            const cleaned = match.replace(pattern, "$1").trim();
            if (cleaned.length > 3 && !seenTexts.has(cleaned.toLowerCase())) {
              seenTexts.add(cleaned.toLowerCase());
              actions.push(this.createActionItem(cleaned, sentence));
            }
          });
        }
      });
    });
    sentences.forEach((sentence) => {
      const trimmed = sentence.trim();
      if (this.isImperative(trimmed) && !seenTexts.has(trimmed.toLowerCase())) {
        seenTexts.add(trimmed.toLowerCase());
        actions.push(this.createActionItem(trimmed, sentence));
      }
    });
    return actions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
      return (priorityOrder[a.priority || "undefined"] || 3) - (priorityOrder[b.priority || "undefined"] || 3);
    });
  }
  createActionItem(text, context) {
    return {
      text,
      priority: this.extractPriority(context),
      dueDate: this.extractDueDate(context),
      assignee: this.extractAssignee(context)
    };
  }
  extractPriority(text) {
    const lower = text.toLowerCase();
    if (/\b(urgent|asap|immediately|critical|important|priority|must|crucial|essential|now|today)\b/.test(lower)) {
      return "high";
    }
    if (/\b(when\s+(?:you\s+)?(?:have|get)\s+(?:a\s+)?(?:chance|time)|eventually|someday|later|low\s+priority|not\s+urgent|nice\s+to\s+have)\b/.test(lower)) {
      return "low";
    }
    if (/\b(by|before|deadline|due|until|end\s+of)\b/.test(lower)) {
      return "medium";
    }
    return void 0;
  }
  extractDueDate(text) {
    const lower = text.toLowerCase();
    if (/\btoday\b/.test(lower)) {
      return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    }
    if (/\btomorrow\b/.test(lower)) {
      const tomorrow = /* @__PURE__ */ new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    }
    const dayMatch = lower.match(/\b(by|before|on|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dayMatch) {
      const targetDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(dayMatch[2]);
      const today = /* @__PURE__ */ new Date();
      const currentDay = today.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      const targetDate = /* @__PURE__ */ new Date();
      targetDate.setDate(today.getDate() + daysUntil);
      return targetDate.toISOString().split("T")[0];
    }
    if (/\bend\s+of\s+(?:the\s+)?week\b/.test(lower)) {
      const today = /* @__PURE__ */ new Date();
      const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7;
      const friday = /* @__PURE__ */ new Date();
      friday.setDate(today.getDate() + daysUntilFriday);
      return friday.toISOString().split("T")[0];
    }
    if (/\bend\s+of\s+(?:the\s+)?month\b/.test(lower)) {
      const today = /* @__PURE__ */ new Date();
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return endOfMonth.toISOString().split("T")[0];
    }
    if (/\bnext\s+week\b/.test(lower)) {
      const nextWeek = /* @__PURE__ */ new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split("T")[0];
    }
    const dateMatch = text.match(/\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/);
    if (dateMatch) {
      return dateMatch[1];
    }
    return void 0;
  }
  extractAssignee(text) {
    const assignMatch = text.match(/\b(?:for|assign(?:ed)?\s+to|ask|tell|have|get)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
    if (assignMatch) {
      return assignMatch[1];
    }
    return void 0;
  }
  extractKeyPoints(content) {
    const keyPoints = [];
    const sentences = content.split(/[.!?]+/);
    const emphasisPatterns = [
      /important[ly]?\s*[:-]?\s*([^.!?]+)/gi,
      /key\s+(?:point|thing|issue)\s*[:-]?\s*([^.!?]+)/gi,
      /note\s+that\s+([^.!?]+)/gi,
      /remember\s+([^.!?]+)/gi
    ];
    sentences.forEach((sentence) => {
      emphasisPatterns.forEach((pattern) => {
        const match = sentence.match(pattern);
        if (match && match[1]) {
          keyPoints.push(match[1].trim());
        }
      });
      if (this.containsSpecificDetails(sentence)) {
        keyPoints.push(sentence.trim());
      }
    });
    return [...new Set(keyPoints)];
  }
  extractNotes(content) {
    const sentences = content.split(/[.!?]+/);
    const notes = [];
    sentences.forEach((sentence) => {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && !this.isActionItem(trimmed) && !this.isKeyPoint(trimmed)) {
        notes.push(trimmed);
      }
    });
    return notes;
  }
  inferCategory(content) {
    const categoryKeywords = {
      "Health": ["doctor", "medical", "prescription", "health", "hospital", "clinic", "medication", "treatment"],
      "Finance": ["bank", "money", "payment", "invoice", "tax", "budget", "financial", "investment", "insurance", "receipt", "bill", "refund", "pricing", "quote", "estimate"],
      "Work": ["project", "meeting", "deadline", "client", "colleague", "office", "work", "job", "career", "standup", "retro", "sprint", "OKR", "roadmap", "minutes"],
      "Personal": ["family", "friend", "hobby", "personal", "home", "vacation", "travel", "chores", "groceries"],
      "Documents": [
        "document",
        "doc",
        "file",
        "record",
        "certificate",
        "license",
        "contract",
        "agreement",
        "nda",
        "proposal",
        "sow",
        "statement of work",
        "invoice",
        "report",
        "policy",
        "sop",
        "standard operating procedure",
        "brief",
        "memo",
        "letter",
        "resume",
        "cv",
        "whitepaper",
        "executive summary"
      ]
    };
    const lowerContent = content.toLowerCase();
    let maxMatches = 0;
    let bestCategory = "Personal";
    Object.entries(categoryKeywords).forEach(([cat, keywords]) => {
      const matches = keywords.filter((keyword) => lowerContent.includes(keyword.toLowerCase())).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = cat;
      }
    });
    if (bestCategory === "Personal") {
      if (/meeting\s+notes|action\s+items|agenda/.test(lowerContent)) {
        bestCategory = "Work";
      }
      if (/dear\s+\w+|executive\s+summary|deliverables|scope|terms|sign\b/.test(lowerContent)) {
        bestCategory = "Documents";
      }
    }
    return bestCategory;
  }
  generateTitle(content) {
    const sentences = content.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim();
    if (firstSentence && firstSentence.length > 0) {
      const words = firstSentence.split(" ").slice(0, 6);
      let title = words.join(" ");
      title = title.replace(/^(so|well|um|uh|okay|alright)\s+/i, "");
      title = title.charAt(0).toUpperCase() + title.slice(1);
      return title.length > 50 ? title.substring(0, 47) + "..." : title;
    }
    return `Brain Dump - ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`;
  }
  extractStructuredFields(content) {
    const fields = {};
    const dateMatches = content.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g);
    if (dateMatches) {
      fields.dates = dateMatches;
    }
    const phoneMatches = content.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
    if (phoneMatches) {
      fields.phoneNumbers = phoneMatches;
    }
    const emailMatches = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    if (emailMatches) {
      fields.emails = emailMatches;
    }
    const amountMatches = content.match(/\$\d+(?:,\d{3})*(?:\.\d{2})?/g);
    if (amountMatches) {
      fields.amounts = amountMatches;
    }
    const urlMatches = content.match(/https?:\/\/[^\s]+/g);
    if (urlMatches) {
      fields.urls = urlMatches;
    }
    const timeMatches = content.match(/\b\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?\b/g);
    if (timeMatches) {
      fields.times = timeMatches;
    }
    return fields;
  }
  extractTags(content) {
    const tags = [];
    const lower = content.toLowerCase();
    const hashtagMatches = content.match(/#[a-zA-Z][a-zA-Z0-9_]*/g);
    if (hashtagMatches) {
      hashtagMatches.forEach((tag) => tags.push(tag.substring(1)));
    }
    const tagKeywords = {
      "meeting": ["meeting", "standup", "sync", "call", "conference"],
      "urgent": ["urgent", "asap", "critical", "immediately", "priority"],
      "follow-up": ["follow up", "follow-up", "check back", "revisit"],
      "idea": ["idea", "thought", "maybe", "could try", "what if"],
      "reminder": ["remember", "don't forget", "reminder"],
      "deadline": ["deadline", "due", "by end of", "before"],
      "research": ["research", "look into", "investigate", "find out"],
      "decision": ["decide", "decision", "choose", "pick"]
    };
    Object.entries(tagKeywords).forEach(([tag, keywords]) => {
      if (keywords.some((kw) => lower.includes(kw)) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
    return tags;
  }
  extractPeople(content) {
    const people = [];
    const seenNames = /* @__PURE__ */ new Set();
    const namePatterns = [
      /\b(?:with|from|to|for|by|and|ask|tell|email|call|contact|meet(?:ing)?(?:\s+with)?|talk(?:\s+to)?|speak(?:\s+to)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|mentioned|asked|told|wants|needs|will|should)\b/g,
      /\b(?:@)([A-Z][a-z]+(?:[A-Z][a-z]+)?)\b/g
      // @mentions
    ];
    const excludeWords = /* @__PURE__ */ new Set([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
      "Today",
      "Tomorrow",
      "Yesterday",
      "Morning",
      "Afternoon",
      "Evening",
      "Night",
      "The",
      "This",
      "That",
      "These",
      "Those",
      "Here",
      "There",
      "Project",
      "Meeting",
      "Report",
      "Document",
      "Email",
      "Call",
      "Task",
      "Important",
      "Urgent",
      "Priority",
      "Action",
      "Note",
      "Remember",
      "Work",
      "Personal",
      "Health",
      "Finance",
      "Documents"
    ]);
    namePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1]?.trim();
        if (name && name.length > 1 && !excludeWords.has(name) && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          people.push(name);
        }
      }
    });
    return people;
  }
  isImperative(sentence) {
    const imperativeStarters = ["call", "email", "send", "buy", "get", "make", "do", "go", "come", "take", "bring"];
    const firstWord = sentence.split(" ")[0]?.toLowerCase();
    return imperativeStarters.includes(firstWord || "");
  }
  containsSpecificDetails(sentence) {
    return /\b\d+\b|\b[A-Z][a-z]+\s+[A-Z][a-z]+\b|\b\d{1,2}:\d{2}\b/.test(sentence);
  }
  isActionItem(sentence) {
    return /\b(?:need to|have to|must|should|call|email|contact|schedule|book|remember to)\b/i.test(sentence);
  }
  isKeyPoint(sentence) {
    return /\b(?:important|key|note|remember)\b/i.test(sentence);
  }
  calculateConfidence(content, actionItems, keyPoints, notes) {
    let confidence = 0.5;
    if (actionItems.length > 0) confidence += 0.15;
    if (keyPoints.length > 0) confidence += 0.15;
    if (notes.length > 2) confidence += 0.1;
    const actionsWithPriority = actionItems.filter((a) => a.priority).length;
    const actionsWithDueDate = actionItems.filter((a) => a.dueDate).length;
    if (actionsWithPriority > 0) confidence += 0.05;
    if (actionsWithDueDate > 0) confidence += 0.05;
    const wordCount = content.split(" ").length;
    if (wordCount > 20) confidence += 0.1;
    if (wordCount > 50) confidence += 0.1;
    return Math.min(confidence, 1);
  }
}
function actionItemsToStrings(items) {
  return items.map((item) => {
    let str = item.text;
    if (item.priority === "high") str = `🔴 ${str}`;
    else if (item.priority === "medium") str = `🟡 ${str}`;
    else if (item.priority === "low") str = `🟢 ${str}`;
    if (item.dueDate) str += ` [Due: ${item.dueDate}]`;
    return str;
  });
}
let recognitionInstance = null;
let isInitialized = false;
class SpeechRecognitionSingleton {
  static instance;
  recognition = null;
  isListening = false;
  callbacks = {};
  restartAttempts = 0;
  maxRestartAttempts = 5;
  restartTimeout = null;
  constructor() {
    this.initializeRecognition();
  }
  static getInstance() {
    if (!SpeechRecognitionSingleton.instance) {
      SpeechRecognitionSingleton.instance = new SpeechRecognitionSingleton();
    }
    return SpeechRecognitionSingleton.instance;
  }
  initializeRecognition() {
    if (isInitialized || !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (recognitionInstance) {
      this.recognition = recognitionInstance;
      return;
    }
    this.recognition = new SpeechRecognition();
    recognitionInstance = this.recognition;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 1;
    this.recognition.onstart = () => {
      console.log("🎤 Recognition Singleton: Started listening");
      this.isListening = true;
      this.restartAttempts = 0;
      this.callbacks.onStart?.();
    };
    this.recognition.onresult = (event) => {
      const now = Date.now();
      const lastTTSEnd = window.__last_tts_end_time || 0;
      const gracePeriod = 300;
      if (window.__tts_is_speaking) {
        console.log("🚫 Recognition Singleton: Skipping - TTS is actively speaking");
        return;
      }
      if (now - lastTTSEnd < gracePeriod) {
        console.log("🚫 Recognition Singleton: Skipping - TTS just finished (grace period)");
        return;
      }
      let finalTranscript = "";
      let interimTranscript = "";
      console.log("🎤 Recognition Singleton: onresult event:", {
        resultIndex: event.resultIndex,
        resultsLength: event.results.length,
        isTTSSpeaking: window.__tts_is_speaking
      });
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        const confidence = event.results[i][0].confidence;
        console.log(`🎤 Recognition Singleton: Result ${i}:`, {
          transcript,
          confidence,
          isFinal: event.results[i].isFinal
        });
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      if (interimTranscript) {
        console.log("🎤 Recognition Singleton: Interim transcript:", interimTranscript);
      }
      if (finalTranscript) {
        console.log("✅ Recognition Singleton: Final transcript received:", finalTranscript);
        console.log("🔄 Recognition Singleton: Calling onResult callback");
        this.callbacks.onResult?.(finalTranscript);
        window.dispatchEvent(new CustomEvent("voice_transcript", { detail: { transcript: finalTranscript } }));
        window.dispatchEvent(new CustomEvent("voice-transcript-update", {
          detail: { transcript: finalTranscript }
        }));
      }
    };
    this.recognition.onerror = (event) => {
      console.error("🚨 Recognition Singleton: Error:", event.error);
      this.callbacks.onError?.(event.error);
      if (event.error === "not-allowed") {
        Jt.error("Microphone access denied. Please allow microphone access.");
        this.restartAttempts = this.maxRestartAttempts;
        return;
      }
      if (event.error === "network") {
        Jt.error("Network error in speech recognition. Please check your connection.");
        this.restartAttempts = this.maxRestartAttempts;
        return;
      }
      if (event.error === "no-speech" && !window.__manual_stop) {
        this.scheduleRestart();
      }
      if (event.error === "aborted" && !window.__manual_stop && !window.__tts_is_speaking) {
        this.scheduleRestart();
      }
    };
    this.recognition.onend = () => {
      console.log("🔚 Recognition Singleton: Ended");
      this.isListening = false;
      this.callbacks.onEnd?.();
      if (!window.__manual_stop && !window.__tts_is_speaking && this.restartAttempts < this.maxRestartAttempts) {
        this.scheduleRestart();
      } else if (this.restartAttempts >= this.maxRestartAttempts) {
        console.log("🛑 Recognition Singleton: Max restart attempts reached, resetting counter");
        this.restartAttempts = 0;
        Jt.info('Voice recognition paused. Click "Start Voice Mode" to resume.');
      }
    };
    isInitialized = true;
    console.log("✅ Recognition Singleton: Initialized");
  }
  scheduleRestart() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }
    this.restartAttempts++;
    const delay = Math.min(1e3 * Math.pow(2, this.restartAttempts - 1), 5e3);
    console.log(`🔄 Recognition Singleton: Scheduling restart attempt ${this.restartAttempts}/${this.maxRestartAttempts} in ${delay}ms`);
    this.restartTimeout = setTimeout(() => {
      this.attemptRestart();
    }, delay);
  }
  attemptRestart() {
    if (!this.recognition || window.__manual_stop || window.__tts_is_speaking) {
      return;
    }
    const actualState = this.recognition.state;
    if (actualState === "started" || this.isListening) {
      console.log("🔄 Recognition Singleton: Already listening, skipping restart");
      return;
    }
    try {
      console.log("🔄 Recognition Singleton: Attempting restart");
      this.recognition.start();
    } catch (error) {
      console.log("⚠️ Recognition Singleton: Restart failed:", error);
      this.isListening = false;
      if (error.name === "InvalidStateError" || error.message?.includes("already started")) {
        console.log("✅ Recognition Singleton: Recognition already running, updating state");
        this.isListening = true;
        this.restartAttempts = 0;
        return;
      }
      if (this.restartAttempts < this.maxRestartAttempts) {
        this.scheduleRestart();
      }
    }
  }
  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }
  start() {
    if (!this.recognition) {
      console.error("❌ Recognition Singleton: Not initialized");
      return false;
    }
    if (this.isListening) {
      console.log("ℹ️ Recognition Singleton: Already listening");
      return true;
    }
    if (window.__tts_is_speaking) {
      console.log("⏸️ Recognition Singleton: Waiting for TTS to finish");
      return false;
    }
    try {
      window.__manual_stop = false;
      this.restartAttempts = 0;
      this.recognition.start();
      console.log("🎤 Recognition Singleton: Started");
      return true;
    } catch (error) {
      if (error.name === "InvalidStateError") {
        console.log("⚠️ Recognition Singleton: Invalid state, will retry");
        this.scheduleRestart();
        return false;
      }
      console.error("❌ Recognition Singleton: Start failed:", error);
      return false;
    }
  }
  stop() {
    if (!this.recognition) return;
    console.log("🛑 Recognition Singleton: Stopping");
    window.__manual_stop = true;
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    try {
      this.recognition.stop();
    } catch (error) {
      console.error("❌ Recognition Singleton: Stop failed:", error);
    }
    this.isListening = false;
    this.restartAttempts = 0;
  }
  isCurrentlyListening() {
    return this.isListening;
  }
  isSupported() {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  }
  getRestartAttempts() {
    return this.restartAttempts;
  }
  resetRestartAttempts() {
    this.restartAttempts = 0;
  }
  getRecognition() {
    return this.recognition;
  }
}
const speechRecognition = SpeechRecognitionSingleton.getInstance();
let ttsHandlerRefCount = 0;
let globalRestartTimeout = null;
const handleGlobalTTSStarted = () => {
  console.log("🔊 TTS Event Handler: TTS started - pausing recognition");
  try {
    speechRecognition.stop();
    console.log("🛑 TTS Event Handler: Stopped recognition due to TTS start");
  } catch (error) {
    console.log("Error stopping recognition on TTS start:", error);
  }
};
const handleGlobalTTSCompleted = () => {
  console.log("🔊 TTS Event Handler: TTS completed, will restart recognition");
  if (globalRestartTimeout) {
    clearTimeout(globalRestartTimeout);
    globalRestartTimeout = null;
  }
  globalRestartTimeout = setTimeout(() => {
    try {
      speechRecognition.resetRestartAttempts();
      speechRecognition.start();
      console.log("🎤 TTS Event Handler: Recognition restarted after TTS");
    } catch (e) {
      console.log("TTS Event Handler: start after TTS failed", e);
    }
  }, 500);
};
const useTTSEventHandler = ({
  conversationState,
  isListening,
  recognitionRef,
  setIsListening = () => {
  }
}) => {
  const isListeningRef = reactExports.useRef(isListening);
  const conversationActiveRef = reactExports.useRef(conversationState?.isActive || false);
  reactExports.useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);
  reactExports.useEffect(() => {
    conversationActiveRef.current = conversationState?.isActive || false;
  }, [conversationState?.isActive]);
  reactExports.useEffect(() => {
    ttsHandlerRefCount += 1;
    if (ttsHandlerRefCount === 1) {
      window.addEventListener("tts-completed", handleGlobalTTSCompleted);
      window.addEventListener("tts-started", handleGlobalTTSStarted);
    }
    return () => {
      ttsHandlerRefCount = Math.max(0, ttsHandlerRefCount - 1);
      if (ttsHandlerRefCount === 0) {
        window.removeEventListener("tts-completed", handleGlobalTTSCompleted);
        window.removeEventListener("tts-started", handleGlobalTTSStarted);
        if (globalRestartTimeout) {
          clearTimeout(globalRestartTimeout);
          globalRestartTimeout = null;
        }
      }
    };
  }, []);
  return {
    isSpeaking: () => window.__tts_is_speaking === true,
    getLastEndTime: () => window.__last_tts_end_time || 0,
    isManualStop: () => window.__manual_stop === true,
    setManualStop: (value) => {
      window.__manual_stop = value;
    }
  };
};
const useSpeechRecognitionControls = ({
  isSupported,
  isListening,
  recognitionRef,
  setTranscript,
  setLastProcessedTranscript,
  setIsListening
}) => {
  const startListening = async () => {
    console.log("=== Starting voice recognition ===");
    if (!isSupported) {
      Jt.error("Speech recognition not supported in this browser");
      return;
    }
    if (isListening) {
      console.log("Already listening");
      return;
    }
    if (!recognitionRef.current) {
      console.error("No recognition reference available");
      Jt.error("Speech recognition not properly initialized");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      console.error("Microphone access error:", error);
      Jt.error("Unable to access microphone. Please check your permissions.");
      return;
    }
    if (window.__tts_is_speaking) {
      console.log("Waiting for TTS to finish before starting listening...");
      Jt.info("Waiting for system to finish speaking...");
      const waitForTTS = () => {
        if (!window.__tts_is_speaking) {
          try {
            window.__manual_stop = false;
            setTranscript("");
            setLastProcessedTranscript("");
            recognitionRef.current?.start();
            console.log("Speech recognition started after TTS finished");
          } catch (e) {
            console.log("Could not start after TTS:", e);
          }
        } else {
          setTimeout(waitForTTS, 500);
        }
      };
      setTimeout(waitForTTS, 500);
      return;
    }
    try {
      console.log("Starting speech recognition...");
      window.__manual_stop = false;
      setTranscript("");
      setLastProcessedTranscript("");
      recognitionRef.current.start();
      console.log("Speech recognition started successfully");
      Jt.success("🎤 Voice recognition active - speak your commands!", {
        description: "Say your voice commands clearly.",
        duration: 3e3
      });
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      if (error.name === "InvalidStateError") {
        console.log("Recognition already running, continuing...");
        setIsListening(true);
        Jt.success("🎤 Voice recognition already active");
      } else {
        Jt.error(`Failed to start voice recognition: ${error.message}`);
      }
    }
  };
  const stopListening = () => {
    console.log("=== Stopping voice recognition ===");
    window.__manual_stop = true;
    if (recognitionRef.current && isListening) {
      try {
        if (recognitionRef.current.cleanup) {
          recognitionRef.current.cleanup();
        }
        recognitionRef.current.stop();
        console.log("Speech recognition stopped manually");
        Jt.info("🔇 Voice recognition stopped - click start to resume");
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }
    window.__speech_recognition_active = false;
    setIsListening(false);
  };
  const resetListening = () => {
    console.log("=== Resetting voice recognition ===");
    window.__manual_stop = true;
    if (recognitionRef.current) {
      try {
        if (recognitionRef.current.cleanup) {
          recognitionRef.current.cleanup();
        }
        recognitionRef.current.abort();
      } catch (error) {
        console.error("Error aborting recognition:", error);
      }
    }
    setTranscript("");
    setLastProcessedTranscript("");
    setIsListening(false);
    window.__speech_recognition_active = false;
    window.__processed_commands = /* @__PURE__ */ new Set();
    window.__manual_stop = false;
    Jt.success("🔄 Voice recognition reset - ready for commands", {
      description: 'Click "Start Voice Commands" to begin listening'
    });
  };
  return {
    startListening,
    stopListening,
    resetListening
  };
};
class MultiIntentParser {
  coordinators = [
    "and then",
    "then",
    "after that",
    "next",
    "afterwards",
    "and also",
    "also",
    "plus",
    "additionally",
    "followed by",
    "before",
    "first",
    "second",
    "finally"
  ];
  intentPatterns = [
    { pattern: /\b(create|add|new)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: "create_entry" },
    { pattern: /\b(open|edit|show|view)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: "open_entry" },
    { pattern: /\b(delete|remove|trash)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: "delete_entry" },
    { pattern: /\b(close|cancel|stop|exit)\s*([^,]*?)(?:\s+(?:and|then|,)|$)/gi, type: "cancel" },
    { pattern: /\b(save|store)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: "save_entry" },
    { pattern: /\b(search|find|look\s+for)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: "search_entries" },
    { pattern: /\b(go\s+to|navigate\s+to|show\s+me)\s+([^,]+?)(?:\s+(?:and|then|,)|$)/gi, type: "navigate_view" }
  ];
  parse(text) {
    console.log("🔍 MultiIntentParser: Parsing text:", text);
    const normalizedText = this.normalizeText(text);
    const segments = this.segmentByCoordinators(normalizedText);
    console.log("🔍 MultiIntentParser: Normalized text:", normalizedText);
    console.log("🔍 MultiIntentParser: Found segments:", segments);
    const intents = [];
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const parsedIntent = this.parseSegment(segment, i);
      if (parsedIntent) {
        intents.push(parsedIntent);
        console.log("✅ MultiIntentParser: Parsed intent:", parsedIntent);
      } else {
        console.log("❌ MultiIntentParser: Failed to parse segment:", segment);
      }
    }
    const result = {
      intents,
      hasMultipleIntents: intents.length > 1,
      originalText: text,
      coordinators: this.findCoordinators(normalizedText)
    };
    console.log("🎯 MultiIntentParser: Final result:", result);
    return result;
  }
  normalizeText(text) {
    return text.toLowerCase().trim().replace(/\s+and\s+then\s+/g, " and then ").replace(/\s+then\s+/g, " then ").replace(/\s+after\s+that\s+/g, " after that ").replace(/\s+also\s+/g, " also ").replace(/\s+plus\s+/g, " plus ");
  }
  segmentByCoordinators(text) {
    let segments = [text];
    for (const coordinator of this.coordinators) {
      const newSegments = [];
      for (const segment of segments) {
        if (segment.includes(coordinator)) {
          const parts = segment.split(new RegExp(`\\s+${coordinator}\\s+`, "i"));
          newSegments.push(...parts.filter((p) => p.trim().length > 0));
        } else {
          newSegments.push(segment);
        }
      }
      segments = newSegments;
    }
    return segments.filter((s) => s.trim().length > 2);
  }
  parseSegment(segment, position) {
    const trimmedSegment = segment.trim();
    for (const { pattern, type } of this.intentPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(trimmedSegment);
      if (match) {
        const parameters = this.extractParameters(trimmedSegment, type, match);
        return {
          type,
          confidence: this.calculateConfidence(trimmedSegment, type),
          parameters,
          rawText: trimmedSegment,
          position: { start: 0, end: trimmedSegment.length }
        };
      }
    }
    return this.inferIntentFromKeywords(trimmedSegment, position);
  }
  extractParameters(text, intentType, match) {
    const params = {};
    switch (intentType) {
      case "create_entry":
        params.entryTitle = this.cleanEntityText(match[2] || "");
        params.entryCategory = this.extractCategory(text);
        break;
      case "open_entry":
      case "delete_entry":
        params.entryTitle = this.cleanEntityText(match[2] || "");
        break;
      case "save_entry":
        params.entryTitle = this.cleanEntityText(match[2] || "");
        break;
      case "search_entries":
        params.query = this.cleanEntityText(match[2] || "");
        params.category = this.extractCategory(text);
        break;
      case "navigate_view":
        params.destination = this.cleanEntityText(match[2] || "");
        break;
    }
    return params;
  }
  cleanEntityText(text) {
    return text.replace(/\b(the|a|an|my|our|your|new|called|named)\b/gi, "").replace(/\s+/g, " ").trim();
  }
  extractCategory(text) {
    const categories = ["documents", "health", "contacts", "finance", "personal"];
    const lowerText = text.toLowerCase();
    for (const category of categories) {
      if (lowerText.includes(category)) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }
    return "Personal";
  }
  calculateConfidence(text, intentType) {
    let confidence = 0.5;
    const intentKeywords = {
      create_entry: ["create", "add", "new", "entry", "record"],
      open_entry: ["open", "edit", "show", "view"],
      delete_entry: ["delete", "remove", "trash"],
      cancel: ["close", "cancel", "stop", "exit"],
      save_entry: ["save", "store"],
      search_entries: ["search", "find", "look"],
      navigate_view: ["go", "navigate", "show"]
    };
    const keywords = intentKeywords[intentType] || [];
    const foundKeywords = keywords.filter((keyword) => text.includes(keyword));
    confidence += foundKeywords.length / keywords.length * 0.4;
    if (text.length < 5) confidence -= 0.2;
    if (text.split(" ").length < 2) confidence -= 0.1;
    return Math.max(0.1, Math.min(1, confidence));
  }
  inferIntentFromKeywords(text, position) {
    const fallbackPatterns = [
      { keywords: ["create", "add", "new"], type: "create_entry" },
      { keywords: ["open", "show", "edit"], type: "open_entry" },
      { keywords: ["delete", "remove"], type: "delete_entry" },
      { keywords: ["close", "cancel"], type: "cancel" },
      { keywords: ["save"], type: "save_entry" }
    ];
    for (const { keywords, type } of fallbackPatterns) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return {
          type,
          confidence: 0.3,
          // Lower confidence for fallback detection
          parameters: { entryTitle: this.cleanEntityText(text) },
          rawText: text,
          position: { start: 0, end: text.length }
        };
      }
    }
    return null;
  }
  findCoordinators(text) {
    const found = [];
    for (const coordinator of this.coordinators) {
      if (text.includes(coordinator)) {
        found.push(coordinator);
      }
    }
    return found;
  }
  // Validation methods
  validateParameters(intent) {
    const errors = [];
    switch (intent.type) {
      case "create_entry":
        if (!intent.parameters.entryTitle || intent.parameters.entryTitle.length < 2) {
          errors.push("Entry title must be at least 2 characters");
        }
        break;
      case "open_entry":
      case "delete_entry":
        if (!intent.parameters.entryTitle || intent.parameters.entryTitle.length < 1) {
          errors.push("Entry identifier is required");
        }
        break;
      case "search_entries":
        if (!intent.parameters.query || intent.parameters.query.length < 1) {
          errors.push("Search query is required");
        }
        break;
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
class CommandSequencer {
  constructor(executeCommand) {
    this.executeCommand = executeCommand;
  }
  executionQueue = [];
  isExecuting = false;
  sequenceCommands(intents) {
    console.log("🔄 CommandSequencer: Sequencing commands:", intents);
    const commands = intents.map((intent, index) => ({
      intent,
      executionOrder: index,
      dependencies: this.calculateDependencies(intent, intents, index),
      delay: this.calculateDelay(intent, index),
      retryCount: 0,
      maxRetries: 3
    }));
    const sortedCommands = this.sortByDependencies(commands);
    console.log("📋 CommandSequencer: Sequenced commands:", sortedCommands);
    return sortedCommands;
  }
  async executeSequence(commands) {
    if (this.isExecuting) {
      throw new Error("Another command sequence is already executing");
    }
    this.isExecuting = true;
    const startTime = Date.now();
    const results = [];
    let failedCommands = 0;
    console.log("🚀 CommandSequencer: Starting execution sequence...");
    try {
      for (const command of commands) {
        console.log(`⚡ CommandSequencer: Executing command ${command.executionOrder + 1}/${commands.length}:`, command.intent.type);
        await this.waitForDependencies(command, results);
        if (command.delay && command.delay > 0) {
          console.log(`⏳ CommandSequencer: Waiting ${command.delay}ms before execution...`);
          await this.sleep(command.delay);
        }
        const result = await this.executeWithRetry(command);
        results.push({ command, result });
        if (!result.success) {
          failedCommands++;
          console.error(`❌ CommandSequencer: Command failed:`, result.error);
          if (this.shouldAbortOnFailure(command)) {
            console.log("🛑 CommandSequencer: Aborting sequence due to critical failure");
            break;
          }
        } else {
          console.log(`✅ CommandSequencer: Command completed successfully in ${result.executionTime}ms`);
        }
      }
    } finally {
      this.isExecuting = false;
    }
    const totalExecutionTime = Date.now() - startTime;
    const overallSuccess = failedCommands === 0;
    const sequenceResult = {
      overallSuccess,
      results,
      totalExecutionTime,
      failedCommands
    };
    console.log("🏁 CommandSequencer: Sequence execution completed:", sequenceResult);
    return sequenceResult;
  }
  calculateDependencies(intent, allIntents, currentIndex) {
    const dependencies = [];
    for (let i = 0; i < currentIndex; i++) {
      const previousIntent = allIntents[i];
      if (this.hasDependency(intent, previousIntent)) {
        dependencies.push(i);
      }
    }
    return dependencies;
  }
  hasDependency(current, previous) {
    if (previous.type === "create_entry" && current.type === "open_entry") {
      return this.targetsMatch(current.parameters.entryTitle, previous.parameters.entryTitle);
    }
    if (previous.type === "create_entry" && current.type === "save_entry") {
      return this.targetsMatch(current.parameters.entryTitle, previous.parameters.entryTitle);
    }
    if (previous.type === "open_entry" && current.type === "cancel") {
      return true;
    }
    return false;
  }
  targetsMatch(target1, target2) {
    if (!target1 || !target2) return false;
    const normalized1 = target1.toLowerCase().trim();
    const normalized2 = target2.toLowerCase().trim();
    return normalized1.includes(normalized2) || normalized2.includes(normalized1);
  }
  calculateDelay(intent, index) {
    const baseDelay = index > 0 ? 500 : 0;
    switch (intent.type) {
      case "create_entry":
        return baseDelay + 200;
      // Extra time for form initialization
      case "save_entry":
        return baseDelay + 300;
      // Extra time for save operation
      case "delete_entry":
        return baseDelay + 100;
      // Brief pause before destructive action
      default:
        return baseDelay;
    }
  }
  sortByDependencies(commands) {
    const sorted = [];
    const visited = /* @__PURE__ */ new Set();
    const visiting = /* @__PURE__ */ new Set();
    const visit = (commandIndex) => {
      if (visiting.has(commandIndex)) {
        console.warn("⚠️ CommandSequencer: Circular dependency detected, breaking cycle");
        return;
      }
      if (visited.has(commandIndex)) {
        return;
      }
      visiting.add(commandIndex);
      const command = commands[commandIndex];
      for (const depIndex of command.dependencies) {
        if (depIndex < commands.length) {
          visit(depIndex);
        }
      }
      visiting.delete(commandIndex);
      visited.add(commandIndex);
      sorted.push(command);
    };
    for (let i = 0; i < commands.length; i++) {
      visit(i);
    }
    return sorted;
  }
  async waitForDependencies(command, completedResults) {
    for (const depIndex of command.dependencies) {
      const depResult = completedResults.find((r) => r.command.executionOrder === depIndex);
      if (!depResult || !depResult.result.success) {
        console.log(`⏳ CommandSequencer: Dependency ${depIndex} not satisfied, waiting...`);
        throw new Error(`Dependency command ${depIndex} failed or not completed`);
      }
    }
  }
  async executeWithRetry(command) {
    let lastError = "";
    for (let attempt = 0; attempt <= command.maxRetries; attempt++) {
      const startTime = Date.now();
      try {
        console.log(`🔄 CommandSequencer: Attempt ${attempt + 1}/${command.maxRetries + 1} for command:`, command.intent.type);
        const result = await this.executeCommand(command.intent);
        const executionTime = Date.now() - startTime;
        return {
          success: true,
          result,
          executionTime
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error";
        command.retryCount++;
        console.log(`❌ CommandSequencer: Attempt ${attempt + 1} failed:`, lastError);
        if (attempt < command.maxRetries) {
          const retryDelay = Math.min(1e3 * Math.pow(2, attempt), 5e3);
          console.log(`⏳ CommandSequencer: Retrying in ${retryDelay}ms...`);
          await this.sleep(retryDelay);
        }
      }
    }
    return {
      success: false,
      error: `Failed after ${command.maxRetries + 1} attempts: ${lastError}`,
      executionTime: 0
    };
  }
  shouldAbortOnFailure(command) {
    const nonCriticalCommands = ["search_entries", "navigate_view"];
    return !nonCriticalCommands.includes(command.intent.type);
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // Public methods for external control
  isSequenceExecuting() {
    return this.isExecuting;
  }
  abortSequence() {
    if (this.isExecuting) {
      console.log("🛑 CommandSequencer: Sequence aborted by user");
      this.isExecuting = false;
    }
  }
  getExecutionQueue() {
    return [...this.executionQueue];
  }
}
const multiIntentParser = new MultiIntentParser();
const processVoiceCommandSync = (transcript) => {
  console.log("🎯 Processing voice command:", transcript);
  if (!transcript || transcript.trim().length === 0) {
    console.log("❌ Empty text provided to processVoiceCommand");
    return { type: "unknown" };
  }
  const multiIntentResult = multiIntentParser.parse(transcript);
  console.log("🔍 Multi-intent analysis result:", multiIntentResult);
  if (multiIntentResult.intents.length === 0) {
    console.log("❌ No intents parsed from input");
    return { type: "unknown" };
  }
  if (multiIntentResult.hasMultipleIntents) {
    console.log("🔄 Multi-intent command detected:", multiIntentResult);
    const commandSequencer = new CommandSequencer(async () => ({}));
    const sequencedCommands = commandSequencer.sequenceCommands(multiIntentResult.intents);
    return {
      type: "multi_command",
      params: {
        commands: sequencedCommands,
        originalText: transcript
      }
    };
  }
  const singleIntent = multiIntentResult.intents[0];
  console.log("🎯 Single intent detected:", singleIntent);
  const voiceCommand = convertParsedIntentToVoiceCommand(singleIntent, transcript);
  console.log("✅ Converted to voice command:", voiceCommand);
  return voiceCommand;
};
const convertParsedIntentToVoiceCommand = (intent, originalText) => {
  console.log("🔄 Converting parsed intent to voice command:", intent);
  switch (intent.type) {
    case "create_entry":
      return {
        type: "sequenced_command",
        params: {
          intent,
          originalText,
          entryTitle: intent.parameters.entryTitle || "",
          entryCategory: intent.parameters.entryCategory || "Personal"
        }
      };
    case "open_entry":
      return {
        type: "sequenced_command",
        params: {
          intent,
          originalText,
          entryTitle: intent.parameters.entryTitle || ""
        }
      };
    case "delete_entry":
      return {
        type: "sequenced_command",
        params: {
          intent,
          originalText,
          entryTitle: intent.parameters.entryTitle || ""
        }
      };
    case "save_entry":
      return {
        type: "sequenced_command",
        params: {
          intent,
          originalText,
          entryTitle: intent.parameters.entryTitle || ""
        }
      };
    case "cancel":
      return {
        type: "sequenced_command",
        params: {
          intent,
          originalText
        }
      };
    default:
      console.log("❓ Unknown intent type, falling back to legacy processing");
      return processLegacySingleCommand(originalText);
  }
};
const processLegacySingleCommand = (transcript) => {
  const lowerTranscript = transcript.toLowerCase().trim();
  const correctedTranscript = lowerTranscript.replace(/\bopen\s+([^.]+?)\s+policy\b/g, "close $1 policy").replace(/\bopening\s+([^.]+?)\s+policy\b/g, "close $1 policy").replace(/\bcall\s+it\b/g, "cancel").replace(/\bcancel\s+it\b/g, "cancel").replace(/\bstop\s+it\b/g, "cancel");
  if (correctedTranscript.includes("cancel") || correctedTranscript.includes("stop") || correctedTranscript.includes("close") || correctedTranscript.includes("exit") || correctedTranscript.includes("dismiss") || correctedTranscript.includes("back")) {
    return { type: "cancel" };
  }
  if ((lowerTranscript.includes("create") || lowerTranscript.includes("add") || lowerTranscript.includes("new")) && (lowerTranscript.includes("entry") || lowerTranscript.includes("record") || lowerTranscript.includes("item"))) {
    const entryTitle = extractEntryTitle(lowerTranscript, "create");
    const entryCategory = extractCategory(lowerTranscript);
    return {
      type: "create_entry",
      params: { entryTitle, entryCategory }
    };
  }
  if ((lowerTranscript.includes("show") || lowerTranscript.includes("view") || lowerTranscript.includes("display") || lowerTranscript.includes("list")) && (lowerTranscript.includes("all") || lowerTranscript.includes("entries") || lowerTranscript.includes("documents") || lowerTranscript.includes("my"))) {
    return {
      type: "open_entry",
      params: { entryTitle: "all_entries" }
    };
  }
  if (lowerTranscript.includes("delete") || lowerTranscript.includes("remove") || lowerTranscript.includes("erase") || lowerTranscript.includes("trash")) {
    const searchTerm = extractDeleteTarget(lowerTranscript);
    return {
      type: "delete_entry",
      params: { entryTitle: searchTerm }
    };
  }
  if (lowerTranscript.includes("open") && !lowerTranscript.includes("all")) {
    const searchTerm = extractOpenTarget(lowerTranscript);
    return {
      type: "open_entry",
      params: { entryTitle: searchTerm }
    };
  }
  if (lowerTranscript.includes("fill") && (lowerTranscript.includes("form") || lowerTranscript.includes("template"))) {
    const entryTitle = extractEntryTitle(lowerTranscript, "fill");
    return {
      type: "fill_form",
      params: { entryTitle }
    };
  }
  if (lowerTranscript.includes("save")) {
    const entryTitle = extractEntryTitle(lowerTranscript, "save");
    return {
      type: "save_entry",
      params: { entryTitle }
    };
  }
  return { type: "unknown" };
};
const extractEntryTitle = (transcript, action) => {
  const genericPhrases = ["new entry", "entry", "record", "item", "information"];
  const lowerTranscript = transcript.toLowerCase();
  for (const phrase of genericPhrases) {
    if (lowerTranscript.includes(action) && lowerTranscript.includes(phrase)) {
      const remaining = lowerTranscript.replace(action, "").replace(phrase, "").trim();
      if (remaining.length < 3 || remaining.match(/^\s*(new|a|an|the)\s*$/)) {
        console.log("Skipping title extraction for generic command:", transcript);
        return "";
      }
    }
  }
  const patterns = [
    new RegExp(`${action}\\s+(?:entry|information)\\s+(?:called|named)\\s+([^.]+)`, "i"),
    new RegExp(`${action}\\s+(?:entry|information)\\s+about\\s+([^.]+)`, "i"),
    new RegExp(`${action}\\s+([^.]+?)\\s+(?:entry|information)`, "i")
  ];
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim().replace(/\.$/, "");
      const cleanTitle = title.replace(/\b(the|a|an|my|our|your|new)\b/gi, "").trim();
      if (cleanTitle.length > 2) {
        return cleanTitle;
      }
    }
  }
  return "";
};
const extractCategory = (transcript) => {
  const categories = ["documents", "health", "contacts", "finance", "personal"];
  const lowerTranscript = transcript.toLowerCase();
  for (const category of categories) {
    if (lowerTranscript.includes(category)) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }
  return "Personal";
};
const extractOpenTarget = (transcript) => {
  transcript.toLowerCase();
  const patterns = [
    // Direct patterns: "open my medical records", "open file invoice.pdf"
    /open\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /edit\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    // Handle "open" followed by anything
    /open\s+(.+)/i,
    /edit\s+(.+)/i
  ];
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      let target = match[1].trim();
      target = target.replace(/\b(document|entry|record|item|information)\b/gi, "").trim();
      target = target.replace(/\b(the|a|an|my|our|your)\b/gi, "").trim();
      if (target.length > 1) {
        return target;
      }
    }
  }
  return "";
};
const extractDeleteTarget = (transcript) => {
  transcript.toLowerCase();
  const patterns = [
    // Direct patterns: "delete my medical records", "remove file invoice"
    /delete\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /remove\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /erase\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    /trash\s+(?:my\s+|the\s+|file\s+)?(.+?)(?:\.|$)/i,
    // Handle "delete" followed by anything
    /delete\s+(.+)/i,
    /remove\s+(.+)/i
  ];
  for (const pattern of patterns) {
    const match = transcript.match(pattern);
    if (match && match[1]) {
      let target = match[1].trim();
      target = target.replace(/\b(document|entry|record|item|information|file)\b/gi, "").trim();
      target = target.replace(/\b(the|a|an|my|our|your|this|that)\b/gi, "").trim();
      if (target.length > 1) {
        return target;
      }
    }
  }
  return "";
};
let globalRecognitionActive = false;
const setupSpeechRecognition = ({
  onVoiceCommand,
  onEnhancedVoiceInput,
  conversationState,
  setIsListening,
  setTranscript,
  lastProcessedTranscript,
  setLastProcessedTranscript,
  recognitionRef
}) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error("Speech recognition not supported");
    return null;
  }
  if (globalRecognitionActive && recognitionRef.current) {
    console.log("🔄 SETUP: Using existing recognition instance");
    return recognitionRef.current;
  }
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognition.maxAlternatives = 1;
  let commandCounter = 0;
  let consecutiveErrors = 0;
  let lastCommandTime = Date.now();
  let silenceTimeout = null;
  const MAX_CONSECUTIVE_ERRORS = 3;
  const SILENCE_TIMEOUT = 2e4;
  const COMMAND_COOLDOWN = 800;
  const isTTSContent = (text) => {
    if (window.__tts_is_speaking) {
      console.log("🚫 SETUP: TTS is currently speaking, ignoring input");
      return true;
    }
    const cleanText = text.toLowerCase().trim();
    if (cleanText.length < 2) {
      console.log("🚫 SETUP: Text too short, ignoring:", text);
      return true;
    }
    const systemPhrases = [
      "voice mode activated",
      "listening for commands",
      "processing with ai",
      "ai voice assistant ready",
      "voice recognition",
      "speech recognition"
    ];
    const isSystemPhrase = systemPhrases.some((phrase) => cleanText.includes(phrase));
    if (isSystemPhrase) {
      console.log("🚫 SETUP: System phrase detected, ignoring:", text);
      return true;
    }
    if (window.__recent_tts_texts) {
      const recentTTS = window.__recent_tts_texts;
      const isRecentTTS = recentTTS.some((ttsText) => {
        const similarity = cleanText.includes(ttsText.toLowerCase().substring(0, 15)) || ttsText.toLowerCase().includes(cleanText.substring(0, 15));
        return similarity;
      });
      if (isRecentTTS) {
        console.log("🚫 SETUP: Matches recent TTS, ignoring:", text);
        return true;
      }
    }
    return false;
  };
  recognition.onstart = () => {
    console.log("🎤 SETUP: Speech recognition started");
    setIsListening(true);
    globalRecognitionActive = true;
    window.__speech_recognition_active = true;
    consecutiveErrors = 0;
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
    }
    silenceTimeout = setTimeout(() => {
      if (!window.__manual_stop && globalRecognitionActive) {
        console.log("🔇 SETUP: Auto-stopping due to silence timeout");
        recognition.stop();
        Jt.info("Voice recognition paused due to inactivity");
      }
    }, SILENCE_TIMEOUT);
  };
  recognition.onresult = (event) => {
    let interimTranscript = "";
    let finalTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript.trim();
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    const currentTranscript = finalTranscript || interimTranscript;
    setTranscript(currentTranscript);
    if (finalTranscript && finalTranscript !== lastProcessedTranscript) {
      const now = Date.now();
      if (isTTSContent(finalTranscript)) {
        console.log("🚫 SETUP: Skipping TTS-like content:", finalTranscript);
        return;
      }
      if (now - lastCommandTime < COMMAND_COOLDOWN) {
        console.log("🕒 SETUP: Command cooldown active, skipping");
        return;
      }
      console.log("✅ SETUP: Processing user command:", finalTranscript);
      window.dispatchEvent(new CustomEvent("voice-debug-trace", {
        detail: {
          stage: "speech.final_transcript",
          transcript: finalTranscript,
          timestamp: Date.now()
        }
      }));
      commandCounter++;
      setLastProcessedTranscript(finalTranscript);
      lastCommandTime = now;
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
      try {
        if (conversationState?.isActive && onEnhancedVoiceInput) {
          console.log("🗣️ SETUP: Conversation mode - using enhanced input");
          onEnhancedVoiceInput(finalTranscript);
        } else if (onVoiceCommand) {
          console.log("🎯 SETUP: Command mode - processing voice command");
          const command = processVoiceCommandSync(finalTranscript);
          onVoiceCommand(command);
        } else if (onEnhancedVoiceInput) {
          console.log("🔄 SETUP: Fallback to enhanced input");
          onEnhancedVoiceInput(finalTranscript);
        }
        window.dispatchEvent(new CustomEvent("voice-command-processed", {
          detail: {
            commandNumber: commandCounter,
            command: finalTranscript,
            timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString(),
            continuous: true
          }
        }));
        silenceTimeout = setTimeout(() => {
          if (!window.__manual_stop && globalRecognitionActive) {
            console.log("🔇 SETUP: Auto-stopping due to silence timeout");
            recognition.stop();
            Jt.info('Voice recognition paused - say "start listening" to resume');
          }
        }, SILENCE_TIMEOUT);
      } catch (error) {
        console.error("🚨 SETUP: Error processing command:", error);
        consecutiveErrors++;
      }
    }
  };
  recognition.onerror = (event) => {
    console.error("🚨 SETUP: Speech recognition error:", event.error);
    consecutiveErrors++;
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
    }
    if (event.error === "not-allowed") {
      Jt.error("Microphone access denied. Please allow microphone access and try again.");
      setIsListening(false);
      globalRecognitionActive = false;
      return;
    }
    if (event.error === "audio-capture") {
      Jt.error("No microphone found. Please check your microphone connection.");
      setIsListening(false);
      globalRecognitionActive = false;
      return;
    }
    if (event.error === "network") {
      Jt.error("Network error. Please check your internet connection.");
      setIsListening(false);
      globalRecognitionActive = false;
      return;
    }
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.log("🛑 SETUP: Too many consecutive errors, stopping continuous recognition");
      setIsListening(false);
      globalRecognitionActive = false;
      Jt.error("Voice recognition encountered multiple errors. Please restart manually.");
      return;
    }
    if (event.error === "aborted" && window.__manual_stop) {
      console.log("🛑 SETUP: Manual stop detected, not restarting");
      setIsListening(false);
      globalRecognitionActive = false;
      return;
    }
    if (!window.__manual_stop && ["no-speech", "aborted"].includes(event.error)) {
      console.log("🔄 SETUP: Recoverable error, attempting restart after delay");
      setTimeout(() => {
        if (!window.__manual_stop && !globalRecognitionActive) {
          try {
            recognition.start();
          } catch (restartError) {
            console.error("🚨 SETUP: Failed to restart after error:", restartError);
          }
        }
      }, 1500);
    }
  };
  recognition.onend = () => {
    console.log("🔚 SETUP: Speech recognition ended");
    const shouldAutoRestart = !window.__manual_stop && consecutiveErrors < MAX_CONSECUTIVE_ERRORS;
    setIsListening(false);
    globalRecognitionActive = false;
    window.__speech_recognition_active = false;
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
    }
    if (shouldAutoRestart) {
      console.log("🔄 SETUP: Auto-restarting recognition");
      setTimeout(() => {
        if (!window.__manual_stop && !globalRecognitionActive) {
          try {
            recognition.start();
            Jt.info("🎤 Voice recognition resumed");
          } catch (error) {
            console.error("🚨 SETUP: Failed to auto-restart:", error);
            consecutiveErrors++;
          }
        }
      }, 1500);
    }
  };
  const cleanup = () => {
    console.log("🧹 SETUP: Cleaning up speech recognition");
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      silenceTimeout = null;
    }
    globalRecognitionActive = false;
    window.__manual_stop = true;
    try {
      recognition.abort();
    } catch (error) {
      console.log("Error during cleanup:", error);
    }
  };
  recognition.cleanup = cleanup;
  return recognition;
};
const useSpeechRecognition = ({
  onVoiceCommand,
  onEnhancedVoiceInput,
  conversationState
}) => {
  const [isListening, setIsListening] = reactExports.useState(false);
  const [transcript, setTranscript] = reactExports.useState("");
  const [isSupported, setIsSupported] = reactExports.useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = reactExports.useState("");
  const recognitionRef = reactExports.useRef(null);
  const isInitialized2 = reactExports.useRef(false);
  useTTSEventHandler({
    conversationState,
    isListening,
    recognitionRef,
    setIsListening
  });
  reactExports.useEffect(() => {
    if (isInitialized2.current) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      console.log("🔧 SETUP: Initializing speech recognition");
      const recognition = setupSpeechRecognition({
        onVoiceCommand,
        onEnhancedVoiceInput,
        conversationState,
        setIsListening,
        setTranscript,
        lastProcessedTranscript,
        setLastProcessedTranscript,
        recognitionRef
      });
      if (recognition) {
        recognitionRef.current = recognition;
        isInitialized2.current = true;
        console.log("✅ SETUP: Speech recognition initialized successfully");
      }
    } else {
      console.warn("Speech recognition not supported in this browser");
    }
    const handleForceRestart = (event) => {
      console.log("Force voice restart event received:", event.detail);
      if (event.detail.conversationActive && recognitionRef.current && !isListening) {
        setTimeout(() => {
          try {
            if (recognitionRef.current && !window.__manual_stop) {
              console.log("Forcing speech recognition restart after form opened");
              recognitionRef.current.start();
              Jt.info("Voice recognition restarted - ready for your response");
            }
          } catch (error) {
            console.log("Force restart failed:", error);
          }
        }, 1e3);
      }
    };
    window.addEventListener("force-voice-restart", handleForceRestart);
    return () => {
      console.log("🧹 CLEANUP: Cleaning up speech recognition");
      if (recognitionRef.current) {
        window.__manual_stop = true;
        if (recognitionRef.current.cleanup) {
          recognitionRef.current.cleanup();
        }
        recognitionRef.current.abort();
      }
      window.removeEventListener("force-voice-restart", handleForceRestart);
      isInitialized2.current = false;
    };
  }, []);
  const controls = useSpeechRecognitionControls({
    isSupported,
    isListening,
    recognitionRef,
    setTranscript,
    setLastProcessedTranscript,
    setIsListening
  });
  console.log("useSpeechRecognition: Hook initialized, controls:", {
    startListening: typeof controls.startListening,
    stopListening: typeof controls.stopListening,
    resetListening: typeof controls.resetListening
  });
  return {
    isListening,
    transcript,
    isSupported,
    startListening: controls.startListening,
    stopListening: controls.stopListening,
    resetListening: controls.resetListening
  };
};
const useBrainDumpCapture = () => {
  const { isListening, transcript, isSupported, startListening, stopListening, resetListening } = useSpeechRecognition({});
  const [started, setStarted] = reactExports.useState(false);
  const interimRef = reactExports.useRef("");
  reactExports.useEffect(() => {
    if (!isSupported) return;
  }, [isSupported]);
  const start = async () => {
    if (!isSupported) {
      alert("Speech recognition not supported in this browser. You can paste text instead.");
      return;
    }
    setStarted(true);
    startListening();
  };
  const stop = () => {
    stopListening();
    setStarted(false);
  };
  const reset = () => {
    resetListening();
    interimRef.current = "";
  };
  return {
    isSupported,
    isListening: isListening || started,
    transcript,
    start,
    stop,
    reset
  };
};
const processor = new BrainDumpProcessor();
const getConfidenceBadgeColor = (confidence) => {
  if (confidence >= 0.75) return "default";
  if (confidence >= 0.5) return "secondary";
  return "outline";
};
const BrainDumpPage = () => {
  const { saveEntry } = useSavedEntries();
  const { isSupported, isListening, transcript, start, stop, reset } = useBrainDumpCapture();
  const navigate = useNavigate();
  const safeStop = () => {
    try {
      stop();
    } catch (error) {
      console.debug("Safe stop failed:", error);
    }
  };
  const handleBackClick = () => {
    safeStop();
    const idx = window.history?.state && window.history.state.idx;
    const sameOriginRef = !!document.referrer && document.referrer.startsWith(window.location.origin);
    console.debug("[BrainDump] Back click", {
      historyLength: window.history.length,
      idx,
      referrer: document.referrer,
      path: window.location.pathname
    });
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
      return;
    }
    if (sameOriginRef && window.history.length > 1) {
      navigate(-1);
      return;
    }
    console.debug("[BrainDump] No history to go back to, redirecting to dashboard");
    navigate("/dashboard");
  };
  const handleDashboardClick = () => {
    safeStop();
    navigate("/dashboard");
  };
  const [rawText, setRawText] = reactExports.useState("");
  const [title, setTitle] = reactExports.useState("");
  const [category, setCategory] = reactExports.useState("Personal");
  const [notes, setNotes] = reactExports.useState([]);
  const [actionItems, setActionItems] = reactExports.useState([]);
  const [keyPoints, setKeyPoints] = reactExports.useState([]);
  const [structuredFields, setStructuredFields] = reactExports.useState({});
  const [confidence, setConfidence] = reactExports.useState(null);
  const [tags, setTags] = reactExports.useState([]);
  const [people, setPeople] = reactExports.useState([]);
  const [summary, setSummary] = reactExports.useState("");
  const [isEnhancing, setIsEnhancing] = reactExports.useState(false);
  const [livePreview, setLivePreview] = reactExports.useState(null);
  const livePreviewTimeoutRef = reactExports.useRef(null);
  const [editingField, setEditingField] = reactExports.useState(null);
  const [showShortcuts, setShowShortcuts] = reactExports.useState(false);
  const hasStructured = reactExports.useMemo(() => !!title || actionItems.length || keyPoints.length || notes.length, [title, actionItems, keyPoints, notes]);
  const actionItemStrings = reactExports.useMemo(() => actionItemsToStrings(actionItems), [actionItems]);
  const introSpokenRef = reactExports.useRef(false);
  const captureStartedRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    document.title = "Brain Dump | Fast voice capture";
    const metaDescId = "meta-brain-dump-desc";
    let meta = document.querySelector(`meta[name='description']#${metaDescId}`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      meta.id = metaDescId;
      document.head.appendChild(meta);
    }
    meta.content = "Brain dump capture: quickly turn voice thoughts into structured notes and action items.";
    const canonicalId = "canonical-brain-dump";
    let link = document.querySelector(`link[rel='canonical']#${canonicalId}`);
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      link.id = canonicalId;
      document.head.appendChild(link);
    }
    link.href = window.location.origin + "/brain-dump";
  }, []);
  reactExports.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("brain_dump_auto_start");
      if (raw) {
        const payload = JSON.parse(raw || "{}");
        sessionStorage.removeItem("brain_dump_auto_start");
        if (payload?.autoStart && isSupported && !isListening && !captureStartedRef.current) {
          start();
          captureStartedRef.current = true;
        }
        if (payload?.autoSpeak && !introSpokenRef.current) {
          speak('Start your brain dump now. Say "process" when you are finished.');
          introSpokenRef.current = true;
        }
      }
    } catch (error) {
      console.debug("Failed to read brain_dump_auto_start payload:", error);
    }
    const handler = (e) => {
      const event = e;
      const autoStart = event.detail?.autoStart ?? true;
      if (autoStart && isSupported && !isListening && !captureStartedRef.current) {
        start();
        captureStartedRef.current = true;
      }
      if (event.detail?.autoSpeak && !introSpokenRef.current) {
        speak('Start your brain dump now. Say "process" when you are finished.');
        introSpokenRef.current = true;
      }
    };
    window.addEventListener("brain-dump:start-capture", handler);
    return () => window.removeEventListener("brain-dump:start-capture", handler);
  }, [isSupported, isListening, start]);
  reactExports.useEffect(() => {
    const content = (rawText || transcript).trim();
    if (livePreviewTimeoutRef.current) {
      clearTimeout(livePreviewTimeoutRef.current);
    }
    if (content.length > 20 && isListening) {
      setLivePreview((prev) => prev ? { ...prev, isProcessing: true } : {
        title: "",
        category: "",
        actionItems: [],
        keyPoints: [],
        notes: [],
        people: [],
        tags: [],
        confidence: 0,
        isProcessing: true
      });
      livePreviewTimeoutRef.current = setTimeout(() => {
        try {
          const result = processor.processBrainDump(content);
          setLivePreview({
            title: result.title,
            category: result.category,
            actionItems: result.actionItems || [],
            keyPoints: result.keyPoints || [],
            notes: result.notes || [],
            people: result.people || [],
            tags: result.tags || [],
            confidence: result.confidence || 0,
            isProcessing: false
          });
        } catch (e) {
          console.error("Live preview processing failed:", e);
          setLivePreview((prev) => prev ? { ...prev, isProcessing: false } : null);
        }
      }, 2e3);
    } else if (!isListening) {
      setLivePreview(null);
    }
    return () => {
      if (livePreviewTimeoutRef.current) {
        clearTimeout(livePreviewTimeoutRef.current);
      }
    };
  }, [rawText, transcript, isListening]);
  const handleProcess = () => {
    const content = (rawText || transcript).trim();
    if (!content) {
      Jt.info("Speak or paste some text first");
      return;
    }
    const result = processor.processBrainDump(content);
    setTitle(result.title);
    setCategory(result.category);
    setActionItems(result.actionItems || []);
    setKeyPoints(result.keyPoints || []);
    setNotes(result.notes || []);
    setStructuredFields(result.structuredFields || {});
    setConfidence(result.confidence || null);
    setTags(result.tags || []);
    setPeople(result.people || []);
    setLivePreview(null);
    Jt.success("Brain dump structured");
  };
  const handleEnhanceWithAI = async () => {
    const content = (rawText || transcript).trim();
    if (!content) {
      Jt.info("Speak or paste some text first");
      return;
    }
    setIsEnhancing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      const cloudFunctionsUrl = "https://us-central1-saveme-f5af0.cloudfunctions.net";
      const res = await fetch(`${cloudFunctionsUrl}/enhanceBrainDump`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text: content, mode: "organize" })
      });
      if (!res.ok) throw new Error("Enhancement failed");
      const data = await res.json();
      if (data.enhancedText) {
        setRawText(data.enhancedText);
        const result = processor.processBrainDump(data.enhancedText);
        setTitle(result.title);
        setCategory(result.category);
        setActionItems(result.actionItems || []);
        setKeyPoints(result.keyPoints || []);
        setNotes(result.notes || []);
        setStructuredFields(result.structuredFields || {});
        setConfidence(result.confidence || null);
        setTags(result.tags || []);
        setPeople(result.people || []);
        setLivePreview(null);
        Jt.success("AI enhanced and structured your brain dump");
      }
    } catch (err) {
      console.error("AI enhance exception:", err);
      Jt.error("AI enhancement failed. Using local processing.");
      handleProcess();
    } finally {
      setIsEnhancing(false);
    }
  };
  const handleSave = async () => {
    if (!hasStructured) {
      Jt.info("Process your brain dump first");
      return;
    }
    const fieldDefinitions = [
      { id: "category", name: "category", type: "text" },
      { id: "originalText", name: "Original Text", type: "textarea" }
    ];
    if (summary) fieldDefinitions.push({ id: "summary", name: "Summary", type: "textarea" });
    if (actionItems.length) fieldDefinitions.push({ id: "actionItems", name: "Action Items", type: "textarea" });
    if (keyPoints.length) fieldDefinitions.push({ id: "keyPoints", name: "Key Points", type: "textarea" });
    if (notes.length) fieldDefinitions.push({ id: "notes", name: "Notes", type: "textarea" });
    if (tags.length) fieldDefinitions.push({ id: "tags", name: "Tags", type: "text" });
    if (people.length) fieldDefinitions.push({ id: "people", name: "People", type: "text" });
    try {
      await saveEntry({
        title: title || `Brain Dump - ${(/* @__PURE__ */ new Date()).toLocaleString()}`,
        fields: {
          category,
          originalText: (rawText || transcript).trim(),
          summary,
          actionItems: actionItemStrings.join("\n• "),
          keyPoints: keyPoints.join("\n• "),
          notes: notes.join("\n\n"),
          tags: tags.join(", "),
          people: people.join(", "),
          confidence,
          ...structuredFields,
          source: "brain_dump"
        },
        fieldDefinitions,
        category
      });
      Jt.success("Saved structured brain dump");
      setRawText("");
      setTitle("");
      setSummary("");
      setNotes([]);
      setActionItems([]);
      setKeyPoints([]);
      setStructuredFields({});
      setConfidence(null);
      setTags([]);
      setPeople([]);
    } catch (error) {
      console.debug("Save failed in BrainDump:", error);
    }
  };
  const lastHandledRef = reactExports.useRef("");
  const normalizeCategory = (raw) => {
    const s = raw.trim().toLowerCase();
    if (!s) return null;
    const map = {
      "document": "Documents",
      "doc": "Documents",
      "proposal": "Documents",
      "contract": "Documents",
      "agreement": "Documents",
      "report": "Documents",
      "memo": "Documents",
      "letter": "Documents",
      "sow": "Documents",
      "policy": "Documents",
      "sop": "Documents"
    };
    if (map[s]) return map[s];
    if (/meeting|standup|retro|minutes|client/.test(s)) return "Work";
    if (/invoice|budget|tax|payment|quote|estimate|receipt/.test(s)) return "Finance";
    if (/doctor|medical|health|prescription|hospital/.test(s)) return "Health";
    if (/personal|home|family|travel|vacation/.test(s)) return "Personal";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const isProcessCommand = (text) => /\b(process|structure|organis|organiz|analy[sz]e|summari[sz]e|make\s+notes|turn\s+this\s+into\s+notes)\b/.test(text);
  const isTTSEcho = (text) => {
    const ttsPatterns = [
      /saved?\s+(your\s+)?structured\s+notes?/i,
      /processed?\s+(your\s+)?brain\s*dump/i,
      /opening\s+dashboard/i,
      /start\s+your\s+brain\s*dump/i,
      /say\s+["']?process["']?\s+when/i
    ];
    return ttsPatterns.some((pattern) => pattern.test(text));
  };
  const parseSaveCommand = (text) => {
    if (isTTSEcho(text)) return null;
    const saveCommandPatterns = [
      /^save\s+(it|this|that)\b/i,
      /\b(please|now|go\s+ahead\s+and|can\s+you)\s+save\s+(it|this|that)?\b/i,
      /\bsave\s+(it|this|that)\s*(now|please)?\s*$/i,
      /\bsave\s+(to|as|in|under)\s+\w+/i,
      /\bstore\s+(it|this|that)\b/i
    ];
    const isValidSaveCommand = saveCommandPatterns.some((pattern) => pattern.test(text));
    if (!isValidSaveCommand) return null;
    const m = text.match(/save(?:\s+it)?\s+(?:as|to|in|under)\s+([a-zA-Z\s-]+)/);
    if (m?.[1]) {
      const cat = normalizeCategory(m[1]);
      return { save: true, category: cat || void 0 };
    }
    return { save: true };
  };
  const isDashboardNavCommand = (text) => {
    return /\b(go to|open|back to|navigate to|show)\s+(the\s+)?dashboard\b/.test(text) || /\b(exit|close|leave)\s+(the\s+)?brain\s*dump\b/.test(text) || /\b(go\s*back|back\s*(?:to\s*)?dashboard)\b/.test(text);
  };
  const navigateToDashboard = () => {
    try {
      stop();
    } catch (error) {
      console.debug("Stop failed before dashboard navigation:", error);
    }
    speak("Opening dashboard");
    navigate("/dashboard");
  };
  reactExports.useEffect(() => {
    const t = (transcript || "").trim();
    if (!t || t === lastHandledRef.current) return;
    const lower = t.toLowerCase();
    if (isTTSEcho(lower)) {
      console.log("🔇 BrainDump: Ignoring TTS echo:", t);
      lastHandledRef.current = t;
      return;
    }
    if (isDashboardNavCommand(lower)) {
      navigateToDashboard();
      lastHandledRef.current = t;
      return;
    }
    if (isProcessCommand(lower)) {
      handleProcess();
      speak("Processed your brain dump.");
      lastHandledRef.current = t;
      return;
    }
    const saveInfo = parseSaveCommand(lower);
    if (saveInfo) {
      if (saveInfo.category) setCategory(saveInfo.category);
      const doSave = () => {
        handleSave();
        speak("Saved your structured notes.");
      };
      if (!hasStructured) {
        handleProcess();
        setTimeout(doSave, 150);
      } else {
        doSave();
      }
      lastHandledRef.current = t;
    }
  }, [transcript, hasStructured]);
  reactExports.useEffect(() => {
    const onProcess = () => {
      handleProcess();
      speak("Processed your brain dump.");
    };
    const onSave = (e) => {
      const ce = e;
      const desired = ce.detail?.category;
      if (desired) {
        const norm = normalizeCategory(desired);
        if (norm) setCategory(norm);
      }
      const doSave = () => {
        handleSave();
        speak("Saved your structured notes.");
      };
      if (!hasStructured) {
        handleProcess();
        setTimeout(doSave, 150);
      } else {
        doSave();
      }
    };
    window.addEventListener("brain-dump:process", onProcess);
    window.addEventListener("brain-dump:save", onSave);
    return () => {
      window.removeEventListener("brain-dump:process", onProcess);
      window.removeEventListener("brain-dump:save", onSave);
    };
  }, [hasStructured]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "container mx-auto px-4 py-2 flex items-center justify-between", "aria-label": "Brain Dump navigation", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", onClick: handleBackClick, "aria-label": "Go back", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
        "Back"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: handleDashboardClick, "aria-label": "Go to dashboard", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutDashboard, { className: "h-4 w-4 mr-2" }),
        "Dashboard"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "container mx-auto px-4 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Brain Dump" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-1", children: "Capture a quick brain dump and turn it into structured notes and action items." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { "aria-labelledby": "capture", className: "grid gap-6 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { id: "capture", children: "Capture" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
              !isListening ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: start, "aria-label": "Start recording", children: "Start" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", onClick: stop, "aria-label": "Stop recording", children: "Stop" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: reset, "aria-label": "Reset transcript", children: "Reset" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: handleProcess, "aria-label": "Process brain dump", children: "Process" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "default",
                  onClick: handleEnhanceWithAI,
                  disabled: isEnhancing,
                  className: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white",
                  "aria-label": "Enhance with AI",
                  children: isEnhancing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 mr-2 animate-spin" }),
                    "Enhancing..."
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4 mr-2" }),
                    "AI Enhance"
                  ] })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                value: rawText || transcript,
                onChange: (e) => setRawText(e.target.value),
                placeholder: "Speak or paste your brain dump here...",
                className: "min-h-[180px]"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "Status: ",
              isListening ? "🎤 Listening…" : "Idle",
              livePreview && livePreview.isProcessing && " | ⚡ Processing live preview..."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: isListening && livePreview ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "inline h-4 w-4 mr-2 text-yellow-500" }),
              "Live Preview"
            ] }) : "Structured Preview" }),
            livePreview && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "LIVE" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: (() => {
            const data = livePreview || {
              title,
              category,
              actionItems,
              keyPoints,
              notes,
              people,
              tags,
              confidence: confidence || 0
            };
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `space-y-2 p-2 border rounded transition-colors ${editingField === "title" ? "bg-blue-50 border-blue-300" : ""}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-sm font-medium flex items-center justify-between", children: [
                  "Title",
                  data.confidence > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Badge,
                    {
                      variant: getConfidenceBadgeColor(data.confidence),
                      className: "text-xs ml-2",
                      children: [
                        Math.round(data.confidence * 100),
                        "%"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: data.title,
                    onChange: (e) => {
                      if (livePreview) {
                        setLivePreview({ ...livePreview, title: e.target.value });
                      } else {
                        setTitle(e.target.value);
                      }
                    },
                    onFocus: () => setEditingField("title"),
                    onBlur: () => setEditingField(null),
                    placeholder: "Generated title"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `space-y-2 p-2 border rounded transition-colors ${editingField === "category" ? "bg-blue-50 border-blue-300" : ""}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Category" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    value: data.category,
                    onChange: (e) => {
                      if (livePreview) {
                        setLivePreview({ ...livePreview, category: e.target.value });
                      } else {
                        setCategory(e.target.value);
                      }
                    },
                    onFocus: () => setEditingField("category"),
                    onBlur: () => setEditingField(null),
                    placeholder: "e.g. Personal, Work"
                  }
                )
              ] }),
              data.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `space-y-2 p-2 border rounded transition-colors ${editingField === "tags" ? "bg-blue-50 border-blue-300" : ""}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "Tags" }),
                  data.tags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: data.tags.length })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: data.tags.map((tag, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Badge,
                  {
                    variant: "outline",
                    className: "text-xs cursor-pointer hover:bg-yellow-100",
                    onClick: () => setEditingField("tags"),
                    children: tag
                  },
                  i
                )) })
              ] }),
              data.people.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `space-y-2 p-2 border rounded transition-colors ${editingField === "people" ? "bg-blue-50 border-blue-300" : ""}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-medium", children: "People Mentioned" }),
                  data.people.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: data.people.length })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1", children: data.people.map((person, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  Badge,
                  {
                    variant: "secondary",
                    className: "text-xs cursor-pointer hover:bg-blue-100",
                    onClick: () => setEditingField("people"),
                    children: [
                      "@",
                      person
                    ]
                  },
                  i
                )) })
              ] }),
              data.actionItems.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `space-y-2 p-2 border rounded transition-colors ${editingField === "actionItems" ? "bg-blue-50 border-blue-300" : ""}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Action Items" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: data.actionItems.length })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1", children: data.actionItems.map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: `flex items-start gap-2 text-sm p-2 rounded border cursor-pointer transition-colors ${editingField === `actionItem-${i}` ? "bg-blue-50 border-blue-300" : "bg-muted/50"}`,
                    onClick: () => setEditingField(`actionItem-${i}`),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `flex-shrink-0 ${item.priority === "high" ? "text-red-500" : item.priority === "medium" ? "text-yellow-500" : item.priority === "low" ? "text-green-500" : ""}`, children: item.priority === "high" ? "🔴" : item.priority === "medium" ? "🟡" : item.priority === "low" ? "🟢" : "•" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.text }),
                        (item.dueDate || item.assignee) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-1", children: [
                          item.dueDate && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mr-2", children: [
                            "Due: ",
                            item.dueDate
                          ] }),
                          item.assignee && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                            "@",
                            item.assignee
                          ] })
                        ] })
                      ] })
                    ]
                  },
                  i
                )) })
              ] }),
              data.keyPoints.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `space-y-2 p-2 border rounded transition-colors ${editingField === "keyPoints" ? "bg-blue-50 border-blue-300" : ""}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Key Points" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Textarea,
                  {
                    value: data.keyPoints.join("\n"),
                    onChange: (e) => {
                      if (livePreview) {
                        setLivePreview({ ...livePreview, keyPoints: e.target.value.split("\n").filter(Boolean) });
                      } else {
                        setKeyPoints(e.target.value.split("\n").filter(Boolean));
                      }
                    },
                    onFocus: () => setEditingField("keyPoints"),
                    onBlur: () => setEditingField(null),
                    className: "min-h-[80px]"
                  }
                )
              ] }),
              data.notes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `space-y-2 p-2 border rounded transition-colors ${editingField === "notes" ? "bg-blue-50 border-blue-300" : ""}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "Notes" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Textarea,
                  {
                    value: data.notes.join("\n\n"),
                    onChange: (e) => {
                      if (livePreview) {
                        setLivePreview({ ...livePreview, notes: e.target.value.split("\n").filter(Boolean) });
                      } else {
                        setNotes(e.target.value.split("\n").filter(Boolean));
                      }
                    },
                    onFocus: () => setEditingField("notes"),
                    onBlur: () => setEditingField(null),
                    className: "min-h-[100px]"
                  }
                )
              ] }),
              data.confidence > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 bg-blue-50 border border-blue-200 rounded text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Overall Confidence" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-24 h-2 bg-blue-200 rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "div",
                    {
                      className: `h-full ${data.confidence >= 0.75 ? "bg-green-500" : data.confidence >= 0.5 ? "bg-yellow-500" : "bg-red-500"}`,
                      style: { width: `${data.confidence * 100}%` }
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold", children: [
                    Math.round(data.confidence * 100),
                    "%"
                  ] })
                ] })
              ] }) }),
              (!livePreview || hasStructured) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: handleSave,
                  disabled: !hasStructured && !livePreview,
                  "aria-label": "Save structured entry",
                  className: "w-full",
                  children: "Save to Entries"
                }
              ) })
            ] });
          })() })
        ] })
      ] })
    ] }) })
  ] });
};
export {
  BrainDumpPage as default
};
