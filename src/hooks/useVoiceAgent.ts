/**
 * useVoiceAgent — Conversational AI hook for SaveMe.Space
 *
 * Flow: 🎤 MediaRecorder → voiceAgent Firebase Function (Gemini transcribe + agent) → Kore TTS → 🔊
 * Supports: continuous conversation mode, live action feed, app control
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

const VOICE_AGENT_URL = `${import.meta.env.VITE_CLOUD_FUNCTIONS_URL}/voiceAgent`;

export type AgentStatus = "idle" | "listening" | "thinking" | "acting" | "speaking";

export interface ActionEvent {
  tool: string;
  args: Record<string, any>;
  result: Record<string, any>;
  label: string;
  status: "running" | "done" | "error";
}

export interface ConversationTurn {
  role: "user" | "model";
  parts: { text?: string }[];
}

export interface NovaActionPayload {
  actionType: string;
  actionData: Record<string, any>;
}

export interface AppCommand {
  appCommand: "navigate" | "openEntryForm" | "openEntry" | "goBack" | "startBrainDump" | "processBrainDump" | "saveBrainDump" | "updateTheme" | "settingsUpdated" | "exportData" | "novaAction" | "printEntry";
  route?: string;
  category?: string | null;
  id?: string | null;
  title?: string | null;
  theme?: string;
  setting?: string;
  value?: any;
  updates?: Record<string, any>;
  format?: string;
  entries?: any[];
  actionType?: string;
  actionData?: Record<string, any>;
}

export interface UseVoiceAgentOptions {
  onNavigate?: (route: string) => void;
  onOpenEntryForm?: (category?: string | null) => void;
  onOpenEntry?: (id?: string | null, title?: string | null) => void;
  onGoBack?: () => void;
  onStartBrainDump?: () => void;
  onProcessBrainDump?: () => void;
  onSaveBrainDump?: (category?: string | null) => void;
  onUpdateTheme?: (theme: string) => void;
  onSettingsUpdated?: (setting: string, value?: any, updates?: Record<string, any>) => void;
  onExportData?: (format: string) => void;
  onPrintEntry?: (entries: any[]) => void;
  onNovaAction?: (payload: NovaActionPayload) => void;
  continuous?: boolean;
}

type AgentInput =
  | { text: string; audioData?: never; audioMimeType?: never }
  | { audioData: string; audioMimeType: string; text?: never };

interface UseVoiceAgentReturn {
  status: AgentStatus;
  transcript: string;
  responseText: string;
  error: string | null;
  actions: ActionEvent[];
  conversationHistory: ConversationTurn[];
  continuous: boolean;
  setContinuous: (v: boolean) => void;
  startListening: () => void;
  stopListening: () => void;
  sendText: (text: string) => Promise<void>;
  resetConversation: () => void;
}

// Human-readable labels for tool calls
const toolLabel = (name: string, args: Record<string, any>): string => {
  switch (name) {
    case "saveEntry":        return `Saving "${args.title || "entry"}"...`;
    case "searchEntries":    return `Searching for "${args.query}"...`;
    case "getRecentEntries": return "Fetching recent entries...";
    case "updateEntry":      return "Updating entry...";
    case "deleteEntry":      return "Deleting entry...";
    case "navigateApp":      return `Navigating to ${args.route}...`;
    case "navigateToCategory": return `Opening ${args.category}...`;
    case "openEntryForm":    return "Opening entry form...";
    case "openEntry":        return `Opening "${args.title || args.id}"...`;
    case "updateTheme":      return `Switching to ${args.theme} theme...`;
    case "updateProfile":    return "Updating profile...";
    case "toggleNotification": return `${args.enabled ? "Enabling" : "Disabling"} ${args.type}...`;
    case "updateVoiceSettings": return "Updating voice settings...";
    case "exportUserData":   return "Exporting data...";
    case "rememberFact":     return "Remembering that...";
    case "recallMemories":   return `Recalling memories about "${args.query}"...`;
    case "forgetMemory":     return "Forgetting...";
    case "getEntityGraph":   return `Looking up "${args.query}"...`;
    case "getRelatedEntries": return `Finding related entries...`;
    case "prepareBriefing":  return `Preparing briefing on "${args.subject}"...`;
    case "getActivitySummary": return `Reviewing ${args.timeframe} activity...`;
    case "getUpcomingDeadlines": return "Checking deadlines...";
    case "updateActionItem": return `Updating task "${args.query}"...`;
    case "setReminder":      return `Setting reminder: "${args.text}"...`;
    case "printEntry":       return `Printing "${args.title || args.category || "entry"}"...`;
    default:                 return `${name}...`;
  }
};

// Toast icons per tool
const ACTION_TOAST_ICON: Record<string, string> = {
  saveEntry: "💾", searchEntries: "🔍", getRecentEntries: "📋",
  updateEntry: "✏️", deleteEntry: "🗑️", navigateApp: "🧭",
  navigateToCategory: "📂", openEntryForm: "➕", openEntry: "📄",
  updateTheme: "🎨", updateProfile: "👤", toggleNotification: "🔔",
  updateVoiceSettings: "🎙️", exportUserData: "📦",
  rememberFact: "🧠", recallMemories: "💭", forgetMemory: "🗑️",
  getEntityGraph: "🕸️", getRelatedEntries: "🔗", prepareBriefing: "📊",
  getActivitySummary: "📈", getUpcomingDeadlines: "⏰", updateActionItem: "✅",
  setReminder: "🔔", printEntry: "🖨️",
};

export const useVoiceAgent = (options: UseVoiceAgentOptions = {}): UseVoiceAgentReturn => {
  const { onNavigate, onOpenEntryForm, onOpenEntry, onGoBack, onStartBrainDump, onProcessBrainDump, onSaveBrainDump, onUpdateTheme, onSettingsUpdated, onExportData, onPrintEntry, onNovaAction } = options;

  const [status, setStatus] = useState<AgentStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [responseText, setResponseText] = useState("");
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [actions, setActions] = useState<ActionEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [continuous, setContinuous] = useState(options.continuous ?? true);
  const [pendingCommands, setPendingCommands] = useState<AppCommand[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem("nova_session_id")
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const continuousRef = useRef(continuous);
  const callAgentRef = useRef<(input: AgentInput) => Promise<void>>();

  // Stable refs for navigation callbacks
  const onNavigateRef = useRef(onNavigate);
  const onOpenEntryFormRef = useRef(onOpenEntryForm);
  const onOpenEntryRef = useRef(onOpenEntry);
  const onGoBackRef = useRef(onGoBack);
  const onStartBrainDumpRef = useRef(onStartBrainDump);
  const onProcessBrainDumpRef = useRef(onProcessBrainDump);
  const onSaveBrainDumpRef = useRef(onSaveBrainDump);
  const onUpdateThemeRef = useRef(onUpdateTheme);
  const onSettingsUpdatedRef = useRef(onSettingsUpdated);
  const onExportDataRef = useRef(onExportData);
  const onPrintEntryRef = useRef(onPrintEntry);
  const onNovaActionRef = useRef(onNovaAction);
  useEffect(() => { onNavigateRef.current = onNavigate; }, [onNavigate]);
  useEffect(() => { onOpenEntryFormRef.current = onOpenEntryForm; }, [onOpenEntryForm]);
  useEffect(() => { onOpenEntryRef.current = onOpenEntry; }, [onOpenEntry]);
  useEffect(() => { onGoBackRef.current = onGoBack; }, [onGoBack]);
  useEffect(() => { onStartBrainDumpRef.current = onStartBrainDump; }, [onStartBrainDump]);
  useEffect(() => { onProcessBrainDumpRef.current = onProcessBrainDump; }, [onProcessBrainDump]);
  useEffect(() => { onSaveBrainDumpRef.current = onSaveBrainDump; }, [onSaveBrainDump]);
  useEffect(() => { onUpdateThemeRef.current = onUpdateTheme; }, [onUpdateTheme]);
  useEffect(() => { onSettingsUpdatedRef.current = onSettingsUpdated; }, [onSettingsUpdated]);
  useEffect(() => { onExportDataRef.current = onExportData; }, [onExportData]);
  useEffect(() => { onPrintEntryRef.current = onPrintEntry; }, [onPrintEntry]);
  useEffect(() => { onNovaActionRef.current = onNovaAction; }, [onNovaAction]);
  useEffect(() => { continuousRef.current = continuous; }, [continuous]);

  // ── Execute app commands via React Router callbacks ──────────────────────
  useEffect(() => {
    if (!pendingCommands.length) return;
    console.log("[useVoiceAgent] Executing app commands:", pendingCommands);
    for (const cmd of pendingCommands) {
      console.log("[useVoiceAgent] Command:", cmd.appCommand, "route:", cmd.route, "id:", cmd.id, "category:", cmd.category);

      if (cmd.appCommand === "navigate" && cmd.route) {
        // Use React Router callback only (avoid conflicting with window.location.hash)
        onNavigateRef.current?.(cmd.route);

      } else if (cmd.appCommand === "openEntryForm") {
        onOpenEntryFormRef.current?.(cmd.category);

      } else if (cmd.appCommand === "openEntry") {
        onOpenEntryRef.current?.(cmd.id, cmd.title);

      } else if (cmd.appCommand === "goBack") {
        onGoBackRef.current?.();

      } else if (cmd.appCommand === "startBrainDump") {
        onStartBrainDumpRef.current?.();

      } else if (cmd.appCommand === "processBrainDump") {
        onProcessBrainDumpRef.current?.();

      } else if (cmd.appCommand === "saveBrainDump") {
        onSaveBrainDumpRef.current?.(cmd.category);

      } else if (cmd.appCommand === "updateTheme") {
        onUpdateThemeRef.current?.(cmd.theme || "system");

      } else if (cmd.appCommand === "settingsUpdated") {
        onSettingsUpdatedRef.current?.(cmd.setting || "", cmd.value, cmd.updates);

      } else if (cmd.appCommand === "exportData") {
        onExportDataRef.current?.(cmd.format || "json");

      } else if (cmd.appCommand === "printEntry" && cmd.entries) {
        onPrintEntryRef.current?.(cmd.entries);

      } else if (cmd.appCommand === "novaAction" && cmd.actionType && cmd.actionData) {
        onNovaActionRef.current?.({ actionType: cmd.actionType, actionData: cmd.actionData });
      }
    }
    setPendingCommands([]);
  }, [pendingCommands]);

  // ── Start recording via MediaRecorder ────────────────────────────────────
  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all mic tracks
        stream.getTracks().forEach((t) => t.stop());
        if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 500) {
          setStatus("idle");
          return;
        }

        // Convert to base64 and send to agent
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          callAgentRef.current?.({ audioData: base64, audioMimeType: mimeType });
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(250); // collect chunks every 250ms
      mediaRecorderRef.current = recorder;
      setStatus("listening");

      // Auto-stop after 10 seconds
      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 10000);

    } catch (err: any) {
      const msg = (err.message || "").toLowerCase();
      setError(
        msg.includes("permission") || msg.includes("denied") || msg.includes("notallowed")
          ? "Mic permission denied. Please allow microphone access in your browser."
          : `Mic error: ${err.message}`
      );
      setStatus("idle");
    }
  }, []);

  // ── Stop recording ────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    } else {
      setStatus("idle");
    }
  }, []);

  // ── Core agent call ───────────────────────────────────────────────────────
  const callAgent = useCallback(async (input: AgentInput) => {
    setStatus("thinking");
    setError(null);
    setActions([]);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const base = { conversationHistory, sessionId };
      const body = "text" in input && input.text
        ? { ...base, transcript: input.text }
        : { ...base, audioData: input.audioData, audioMimeType: input.audioMimeType };

      const res = await fetch(VOICE_AGENT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Voice agent failed");
      }

      const data = await res.json();

      // Show transcript returned from backend
      if (data.transcript) setTranscript(data.transcript);

      // ── Stagger actions for real-time feel ──────────────────────────────────
      if (data.actionsExecuted?.length) {
        setStatus("acting");

        for (let i = 0; i < data.actionsExecuted.length; i++) {
          const a = data.actionsExecuted[i];
          const label = toolLabel(a.tool, a.args);

          // Show action as "running"
          setActions((prev) => [
            ...prev,
            { tool: a.tool, args: a.args, result: a.result, label, status: "running" },
          ]);
          toast(label.replace("...", ""), { icon: ACTION_TOAST_ICON[a.tool] || "⚡" });

          // Brief pause so each action is visible
          await new Promise((r) => setTimeout(r, 500));

          // Mark as done/error
          setActions((prev) =>
            prev.map((act, idx) =>
              idx === i ? { ...act, status: a.result?.success ? "done" : "error" } : act
            )
          );
        }
      }

      setResponseText(data.responseText);
      setConversationHistory(data.conversationHistory || []);

      // Persist session ID for conversation continuity across page refreshes
      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem("nova_session_id", data.sessionId);
      }

      // ── Queue app commands ────────────────────────────────────────────────
      console.log("[useVoiceAgent] Response data:", { appCommands: data.appCommands, actionsExecuted: data.actionsExecuted });
      if (data.appCommands?.length) {
        console.log("[useVoiceAgent] Queuing app commands:", data.appCommands);
        setPendingCommands(data.appCommands as AppCommand[]);
      }

      // ── Play audio response ────────────────────────────────────────────────
      if (data.audioContent) {
        await playAudio(data.audioContent, data.audioMimeType || "audio/pcm");
      } else {
        setStatus("idle");
        if (continuousRef.current) startListening();
      }

    } catch (err: any) {
      console.error("[useVoiceAgent]", err);
      setError(err.message);
      setStatus("idle");
    }
  }, [conversationHistory, sessionId]);

  // ── Audio playback + auto-restart ─────────────────────────────────────────
  const playAudio = useCallback(async (base64Audio: string, mimeType = "audio/pcm") => {
    setStatus("speaking");
    audioRef.current?.pause();

    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const blob = mimeType.includes("pcm")
      ? new Blob([pcmToWav(bytes, 24000, 1, 16)], { type: "audio/wav" })
      : new Blob([bytes], { type: mimeType });

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      setStatus("idle");
      if (continuousRef.current) {
        setTimeout(() => startListening(), 300);
      }
    };
    audio.onerror = () => { URL.revokeObjectURL(url); setStatus("idle"); };

    await audio.play();
  }, [startListening]);

  // Keep callAgentRef pointing to latest callAgent
  useEffect(() => { callAgentRef.current = callAgent; }, [callAgent]);

  // ── Text fallback ──────────────────────────────────────────────────────────
  const sendText = useCallback(async (text: string) => {
    setTranscript(text);
    await callAgent({ text });
  }, [callAgent]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetConversation = useCallback(() => {
    setConversationHistory([]);
    setTranscript("");
    setResponseText("");
    setActions([]);
    setStatus("idle");
    setError(null);
    audioRef.current?.pause();
    setSessionId(null);
    localStorage.removeItem("nova_session_id");
  }, []);

  return {
    status, transcript, responseText, error, actions,
    conversationHistory, continuous, setContinuous,
    startListening, stopListening, sendText, resetConversation,
  };
};

// ── PCM → WAV ─────────────────────────────────────────────────────────────────
function pcmToWav(pcmData: Uint8Array, sampleRate: number, channels: number, bitDepth: number): ArrayBuffer {
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;
  const wavSize = 44 + pcmData.length;
  const buffer = new ArrayBuffer(wavSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF"); view.setUint32(4, wavSize - 8, true); writeStr(8, "WAVE");
  writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, channels, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true); view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true); writeStr(36, "data"); view.setUint32(40, pcmData.length, true);
  new Uint8Array(buffer).set(pcmData, 44);
  return buffer;
}
