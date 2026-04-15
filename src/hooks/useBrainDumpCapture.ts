import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getCloudFunctionUrl, getFirebaseIdToken } from "@/utils/cloudFunctions";

const VOICE_AGENT_URL = getCloudFunctionUrl("voiceAgent");

export interface VoiceAgentAction {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestTimeoutRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  /** Play base64 audio from voiceAgent TTS response */
  const playAudio = useCallback(async (base64Audio: string, mimeType: string) => {
    try {
      const raw = atob(base64Audio);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

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
        const url = URL.createObjectURL(wavBlob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.volume = parseFloat(localStorage.getItem("speech_volume") || "0.8");
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
      } else {
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.volume = parseFloat(localStorage.getItem("speech_volume") || "0.8");
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
      }
    } catch (err) {
      console.warn("[useBrainDumpCapture] Audio playback failed:", err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    setTranscript("");
    setNovaResponseText("");
    setSavedEntry(null);
    setActionsExecuted([]);
    setAppCommands([]);
    console.log("[useBrainDumpCapture] start clicked");

    if (isListening || isProcessingVoice) {
      console.log("[useBrainDumpCapture] start ignored, already busy", { isListening, isProcessingVoice });
      return;
    }

    abortPendingRequest();
    audioChunksRef.current = [];

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === "undefined") {
      setVoiceError("Voice capture is not available in this browser. Type your brain dump instead.");
      toast.error("Voice capture is not available in this browser. Type your brain dump instead.");
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

          console.log("[useBrainDumpCapture] sending audio directly to voiceAgent...");

          let response: Response;
          try {
            response = await fetch(VOICE_AGENT_URL, {
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
            });
          } finally {
            clearPendingRequest();
          }

          const data = await response.json();
          console.log("[useBrainDumpCapture] voiceAgent response:", {
            ok: response.ok,
            status: response.status,
            transcript: data.transcript,
            responseText: data.responseText?.substring(0, 100),
            hasAudio: !!data.audioContent,
            actionsCount: data.actionsExecuted?.length || 0,
            appCommandsCount: data.appCommands?.length || 0,
          });

          if (!response.ok) {
            throw new Error(data.error || "Voice agent failed");
          }

          // Set transcript (user's spoken words)
          if (data.transcript?.trim()) {
            setTranscript(data.transcript.trim());
          }

          // Set Nova's response text (strip greeting prefix)
          const novaText = (data.responseText || "").replace(/^__nova_greet__:\w+\s*/i, "").trim();
          if (novaText) {
            setNovaResponseText(novaText);
          }

          // Track actions executed
          if (data.actionsExecuted?.length) {
            setActionsExecuted(data.actionsExecuted);
            // Check if Nova saved an entry
            const saveAction = data.actionsExecuted.find(
              (a: VoiceAgentAction) => a.tool === "saveEntry" && a.result?.success
            );
            if (saveAction) {
              setSavedEntry({
                title: (saveAction.args?.title as string) || "",
                category: (saveAction.args?.category as string) || "Personal",
              });
            }
          }

          // Track app commands for the page to execute
          if (data.appCommands?.length) {
            setAppCommands(data.appCommands);
          }

          // Play Nova's voice response
          if (data.audioContent) {
            await playAudio(data.audioContent, data.audioMimeType || "audio/pcm");
          }

          // Show toast based on result
          if (data.transcript?.trim()) {
            toast.success("Nova heard your voice dump.");
          } else {
            setVoiceError("Nova didn't catch any speech. Try again, or type your brain dump instead.");
            toast.error("The recording uploaded, but no speech was detected.");
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
        } finally {
          clearPendingRequest();
          setIsProcessingVoice(false);
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
      toast.success("Nova is recording. Speak freely.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        setVoiceError("Microphone access denied. Please allow microphone access and try again.");
        toast.error("Microphone access denied. Please allow microphone access and try again.");
      } else {
        console.error("[useBrainDumpCapture] start failed:", error);
        setVoiceError(`Voice did not start. ${message}. Type your brain dump and Nova will still organize it.`);
        toast.error(`Voice did not start: ${message}`);
      }
      setIsListening(false);
      stopTracks();
    }
  }, [isListening, isProcessingVoice, playAudio]);

  const stop = useCallback(() => {
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
    start,
    stop,
    reset,
  };
};
