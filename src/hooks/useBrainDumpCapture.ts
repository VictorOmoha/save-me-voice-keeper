import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getCloudFunctionUrl, getFirebaseIdToken } from "@/utils/cloudFunctions";

const TRANSCRIBE_URL = getCloudFunctionUrl("transcribeAudio");
const VOICE_AGENT_URL = getCloudFunctionUrl("voiceAgent");

export const useBrainDumpCapture = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [novaResponseText, setNovaResponseText] = useState("");
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
      // Decode base64 to raw bytes
      const raw = atob(base64Audio);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

      // PCM L16 needs manual conversion to WAV
      if (mimeType.includes("pcm") || mimeType.includes("L16")) {
        const sampleRate = 24000;
        const numChannels = 1;
        const bitsPerSample = 16;
        const wavHeader = new ArrayBuffer(44);
        const view = new DataView(wavHeader);
        const dataSize = bytes.length;

        // RIFF header
        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + dataSize, true);
        view.setUint32(8, 0x57415645, false); // "WAVE"
        // fmt chunk
        view.setUint32(12, 0x666d7420, false); // "fmt "
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
        view.setUint16(32, numChannels * (bitsPerSample / 8), true);
        view.setUint16(34, bitsPerSample, true);
        // data chunk
        view.setUint32(36, 0x64617461, false); // "data"
        view.setUint32(40, dataSize, true);

        const wavBlob = new Blob([wavHeader, bytes], { type: "audio/wav" });
        const url = URL.createObjectURL(wavBlob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.volume = parseFloat(localStorage.getItem("speech_volume") || "0.8");
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
      } else {
        // MP3 or other standard format
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
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.debug("[useBrainDumpCapture] recorder stop during cleanup failed:", error);
        }
      }
      stopTracks();
    };
  }, []);

  const start = useCallback(async () => {
    setLastStartAttemptAt(Date.now());
    setVoiceError(null);
    setTranscript("");
    setNovaResponseText("");
    console.log("[useBrainDumpCapture] start clicked");

    if (isListening || isProcessingVoice) {
      console.log("[useBrainDumpCapture] start ignored, already busy", { isListening, isProcessingVoice });
      return;
    }

    abortPendingRequest();
    audioChunksRef.current = [];

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError("Voice capture is not available in this browser. Type your brain dump instead.");
      toast.error("Voice capture is not available in this browser. Type your brain dump instead.");
      return;
    }

    if (typeof window.MediaRecorder === "undefined") {
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

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

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
        console.log("[useBrainDumpCapture] blob OK, starting transcription...");

        try {
          const token = await getFirebaseIdToken();
          if (!token) throw new Error("Not authenticated");

          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1]);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          });

          // ── Step 1: Transcribe audio ──────────────────────────────────────
          const controller = new AbortController();
          abortControllerRef.current = controller;
          requestTimeoutRef.current = window.setTimeout(() => controller.abort(), 45_000);

          console.log("[useBrainDumpCapture] Step 1: transcribing audio...");
          let transcribeResponse: Response;
          try {
            transcribeResponse = await fetch(TRANSCRIBE_URL, {
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
            });
          } finally {
            clearPendingRequest();
          }

          const transcribeData = await transcribeResponse.json();
          console.log("[useBrainDumpCapture] transcription result:", { transcript: transcribeData.transcript, detected: transcribeData.detected });

          if (!transcribeResponse.ok) {
            throw new Error(transcribeData.error || "Voice transcription failed");
          }

          if (!transcribeData.detected || !transcribeData.transcript?.trim()) {
            setVoiceError("Nova didn't catch any speech. Try again, or type your brain dump instead.");
            toast.error("The recording uploaded, but no speech was detected.");
            return;
          }

          const spokenText = transcribeData.transcript.trim();
          setTranscript(spokenText);
          toast.success("Nova heard your voice dump.");

          // ── Step 2: Send transcript to voiceAgent for Nova's response ─────
          console.log("[useBrainDumpCapture] Step 2: sending to voiceAgent for Nova response...");
          const agentController = new AbortController();
          abortControllerRef.current = agentController;
          requestTimeoutRef.current = window.setTimeout(() => agentController.abort(), 45_000);

          let agentResponse: Response;
          try {
            agentResponse = await fetch(VOICE_AGENT_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                transcript: spokenText,
                conversationHistory: [],
                sessionId: null,
              }),
              signal: agentController.signal,
            });
          } finally {
            clearPendingRequest();
          }

          const agentData = await agentResponse.json();
          console.log("[useBrainDumpCapture] voiceAgent response:", {
            ok: agentResponse.ok,
            responseText: agentData.responseText?.substring(0, 100),
            hasAudio: !!agentData.audioContent,
          });

          if (agentResponse.ok) {
            // Show Nova's text response
            const novaText = (agentData.responseText || "").replace(/^__nova_greet__:\w+\s*/i, "").trim();
            if (novaText) {
              setNovaResponseText(novaText);
            }

            // Play Nova's voice response
            if (agentData.audioContent) {
              await playAudio(agentData.audioContent, agentData.audioMimeType || "audio/pcm");
            }
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
      try {
        mediaRecorderRef.current.requestData();
      } catch (error) {
        console.debug("[useBrainDumpCapture] requestData failed before stop:", error);
      }
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
    voiceError,
    lastStartAttemptAt,
    start,
    stop,
    reset,
  };
};
