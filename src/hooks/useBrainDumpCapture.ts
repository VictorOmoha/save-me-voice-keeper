import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getCloudFunctionUrl, getFirebaseIdToken } from "@/utils/cloudFunctions";

const TRANSCRIBE_URL = getCloudFunctionUrl("transcribeAudio");
const VOICE_AGENT_URL = getCloudFunctionUrl("voiceAgent");

export interface VoiceAgentAction {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

/** Clean up Nova's response text — strip greeting triggers and tag leaks */
const cleanResponseText = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/\[\/?TRANSCRIPT\][\s\S]*?\[\/TRANSCRIPT\]/g, "")
    .replace(/\[\/?TRANSCRIPT\]/g, "")
    .replace(/^__nova_greet__:\S+\s*/i, "")
    .trim();
};

export const useBrainDumpCapture = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [novaResponseText, setNovaResponseText] = useState("");
  const [savedEntry, setSavedEntry] = useState<{ title: string; category: string } | null>(null);
  const [actionsExecuted, setActionsExecuted] = useState<VoiceAgentAction[]>([]);
  const [appCommands, setAppCommands] = useState<Record<string, unknown>[]>([]);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastStartAttemptAt, setLastStartAttemptAt] = useState<number | null>(null);
  const [continuous, setContinuous] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestTimeoutRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const continuousRef = useRef(continuous);
  const manualStopRef = useRef(false);
  const startRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    continuousRef.current = continuous;
  }, [continuous]);

  const clearPendingRequest = () => {
    if (requestTimeoutRef.current !== null) {
      window.clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }
    abortControllerRef.current = null;
  };

  const abortPendingRequest = () => {
    abortControllerRef.current?.abort();
    clearPendingRequest();
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  /** Play base64 audio (PCM or standard) and return a promise that resolves when playback ends */
  const playAudio = useCallback(async (base64Audio: string, mimeType: string): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const raw = atob(base64Audio);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

        let url: string;
        if (mimeType.includes("pcm") || mimeType.includes("L16")) {
          const sampleRate = 24000;
          const wavHeader = new ArrayBuffer(44);
          const view = new DataView(wavHeader);
          const dataSize = bytes.length;
          view.setUint32(0, 0x52494646, false);
          view.setUint32(4, 36 + dataSize, true);
          view.setUint32(8, 0x57415645, false);
          view.setUint32(12, 0x666d7420, false);
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, 1, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * 2, true);
          view.setUint16(32, 2, true);
          view.setUint16(34, 16, true);
          view.setUint32(36, 0x64617461, false);
          view.setUint32(40, dataSize, true);
          const wavBlob = new Blob([wavHeader, bytes], { type: "audio/wav" });
          url = URL.createObjectURL(wavBlob);
        } else {
          const blob = new Blob([bytes], { type: mimeType });
          url = URL.createObjectURL(blob);
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.volume = parseFloat(localStorage.getItem("speech_volume") || "0.8");
        const cleanup = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onended = cleanup;
        audio.onerror = cleanup;
        audio.play().catch(cleanup);
      } catch (err) {
        console.warn("[useBrainDumpCapture] Audio playback failed:", err);
        resolve();
      }
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      abortPendingRequest();
      audioRef.current?.pause();
      if (mediaRecorderRef.current?.state === "recording") {
        try { mediaRecorderRef.current.stop(); } catch (_) { /* */ }
      }
      stopTracks();
    };
  }, []);

  const start = useCallback(async () => {
    setLastStartAttemptAt(Date.now());
    setVoiceError(null);
    manualStopRef.current = false;
    console.log("[useBrainDumpCapture] start clicked");

    if (isListening || isProcessingVoice) {
      console.log("[useBrainDumpCapture] start ignored, already busy", { isListening, isProcessingVoice });
      return;
    }

    abortPendingRequest();
    audioChunksRef.current = [];

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === "undefined") {
      setVoiceError("Voice capture is not available in this browser. Type your brain dump instead.");
      toast.error("Voice capture is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mimeTypeRef.current = mimeType || recorder.mimeType || "audio/webm";
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        setIsListening(false);
        stopTracks();

        const resolvedMimeType = mimeTypeRef.current || recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: resolvedMimeType });

        console.log("[useBrainDumpCapture] recorder stopped", {
          chunks: audioChunksRef.current.length,
          blobSize: blob.size,
          mimeType: resolvedMimeType,
        });

        if (blob.size < 500) {
          setVoiceError("Nova didn't catch enough audio. Try a longer voice dump, or type your brain dump instead.");
          toast.error("Recorded audio was too short or empty.");
          return;
        }

        setIsProcessingVoice(true);

        try {
          const token = await getFirebaseIdToken();
          if (!token) throw new Error("Not authenticated");

          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });

          const controller = new AbortController();
          abortControllerRef.current = controller;
          requestTimeoutRef.current = window.setTimeout(() => controller.abort(), 55_000);

          // ── Fire transcribe + voiceAgent in PARALLEL for fastest response ─────
          console.log("[useBrainDumpCapture] firing parallel transcribe + voiceAgent...");

          const transcribePromise = fetch(TRANSCRIBE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              audioData: base64,
              audioMimeType: resolvedMimeType,
            }),
            signal: controller.signal,
          }).then((r) => r.json()).catch((e) => ({ error: e.message }));

          const agentPromise = fetch(VOICE_AGENT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              audioData: base64,
              audioMimeType: resolvedMimeType,
              conversationHistory: [],
              sessionId: null,
            }),
            signal: controller.signal,
          }).then((r) => r.json()).catch((e) => ({ error: e.message }));

          // Show transcript as SOON as it's ready (usually 1-2s)
          transcribePromise.then((transcribeData) => {
            if (transcribeData?.detected && transcribeData?.transcript?.trim()) {
              console.log("[useBrainDumpCapture] transcript ready:", transcribeData.transcript);
              setTranscript(transcribeData.transcript.trim());
              toast.success("Nova heard your voice dump.");
            }
          }).catch((err) => {
            console.warn("[useBrainDumpCapture] transcribe error:", err);
          });

          // Wait for agent response (includes Nova's reply + TTS audio)
          const agentData = await agentPromise;
          clearPendingRequest();

          console.log("[useBrainDumpCapture] voiceAgent response:", {
            transcript: agentData.transcript,
            responseText: agentData.responseText?.substring(0, 100),
            hasAudio: !!agentData.audioContent,
            actionsCount: agentData.actionsExecuted?.length || 0,
          });

          if (agentData.error) {
            throw new Error(agentData.error);
          }

          // Set transcript from agent if not already set by transcribe call
          if (agentData.transcript?.trim()) {
            setTranscript((prev) => prev || agentData.transcript.trim());
          }

          // Clean and set Nova's response text
          const novaText = cleanResponseText(agentData.responseText || "");
          if (novaText) setNovaResponseText(novaText);

          // Track actions executed
          if (agentData.actionsExecuted?.length) {
            setActionsExecuted(agentData.actionsExecuted);
            const saveAction = agentData.actionsExecuted.find(
              (a: VoiceAgentAction) => a.tool === "saveEntry" && a.result?.success
            );
            if (saveAction) {
              setSavedEntry({
                title: (saveAction.args?.title as string) || "",
                category: (saveAction.args?.category as string) || "Personal",
              });
            }
          }

          if (agentData.appCommands?.length) {
            setAppCommands(agentData.appCommands);
          }

          // Play Nova's voice response and wait for it to finish
          if (agentData.audioContent) {
            await playAudio(agentData.audioContent, agentData.audioMimeType || "audio/pcm");
          }

          setIsProcessingVoice(false);

          // ── Continuous mode: auto-restart recording after Nova finishes ─────
          if (continuousRef.current && !manualStopRef.current) {
            console.log("[useBrainDumpCapture] continuous mode: restarting recording");
            setTimeout(() => {
              if (!manualStopRef.current && startRef.current) {
                startRef.current();
              }
            }, 300);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const friendlyMessage =
            error instanceof DOMException && error.name === "AbortError"
              ? "The voice request took too long or was interrupted"
              : message.includes("Failed to fetch") || message.includes("ERR_CONNECTION_CLOSED")
                ? "The voice request was interrupted by the network"
                : message;
          setVoiceError(`Voice capture failed. ${friendlyMessage}. You can still type your brain dump below.`);
          toast.error(friendlyMessage);
          setIsProcessingVoice(false);
        } finally {
          clearPendingRequest();
        }
      };

      recorder.onerror = (event: Event) => {
        console.error("[useBrainDumpCapture] MediaRecorder error:", (event as ErrorEvent).error);
        setVoiceError("Audio recording failed to start.");
        toast.error("Audio recording failed to start.");
        setIsListening(false);
        stopTracks();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsListening(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        setVoiceError("Microphone access denied. Please allow microphone access and try again.");
        toast.error("Microphone access denied.");
      } else {
        console.error("[useBrainDumpCapture] start failed:", error);
        setVoiceError(`Voice did not start. ${message}. Type your brain dump and Nova will still organize it.`);
        toast.error(`Voice did not start: ${message}`);
      }
      setIsListening(false);
      stopTracks();
    }
  }, [isListening, isProcessingVoice, playAudio]);

  // Keep startRef in sync for continuous mode
  useEffect(() => {
    startRef.current = start;
  }, [start]);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    if (isProcessingVoice) {
      abortPendingRequest();
      audioRef.current?.pause();
      setIsProcessingVoice(false);
      setVoiceError("Voice upload canceled. You can try again, or type your brain dump below.");
      toast.info("Voice upload canceled");
      return;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      try { mediaRecorderRef.current.requestData(); } catch (_) { /* */ }
      mediaRecorderRef.current.stop();
    } else {
      setIsListening(false);
      stopTracks();
    }
  }, [isProcessingVoice]);

  const reset = useCallback(() => {
    manualStopRef.current = true;
    abortPendingRequest();
    audioRef.current?.pause();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    setIsProcessingVoice(false);
    setTranscript("");
    setNovaResponseText("");
    setSavedEntry(null);
    setActionsExecuted([]);
    setAppCommands([]);
    setVoiceError(null);
    audioChunksRef.current = [];
    stopTracks();
  }, []);

  return {
    isSupported: typeof window !== "undefined" && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia,
    isListening,
    isProcessingVoice,
    transcript,
    novaResponseText,
    savedEntry,
    actionsExecuted,
    appCommands,
    voiceError,
    lastStartAttemptAt,
    continuous,
    setContinuous,
    start,
    stop,
    reset,
  };
};
