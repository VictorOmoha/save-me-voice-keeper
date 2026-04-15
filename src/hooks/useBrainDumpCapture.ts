import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getCloudFunctionUrl, getFirebaseIdToken } from "@/utils/cloudFunctions";

const VOICE_AGENT_URL = getCloudFunctionUrl("voiceAgent");

export const useBrainDumpCapture = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastStartAttemptAt, setLastStartAttemptAt] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestTimeoutRef = useRef<number | null>(null);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortPendingRequest();
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

          const controller = new AbortController();
          abortControllerRef.current = controller;
          requestTimeoutRef.current = window.setTimeout(() => controller.abort(), 45_000);

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
          if (!response.ok) {
            throw new Error(data.error || "Voice transcription failed");
          }

          if (data.transcript?.trim()) {
            setTranscript(data.transcript.trim());
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
      recorder.start(250); // collect data every 250ms
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
  }, [isListening, isProcessingVoice]);

  const stop = useCallback(() => {
    if (isProcessingVoice) {
      abortPendingRequest();
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
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    setIsProcessingVoice(false);
    setTranscript("");
    setVoiceError(null);
    audioChunksRef.current = [];
    stopTracks();
  }, []);

  return {
    isSupported: typeof window !== "undefined" && !!window.MediaRecorder && !!navigator.mediaDevices?.getUserMedia,
    isListening,
    isProcessingVoice,
    transcript,
    voiceError,
    lastStartAttemptAt,
    start,
    stop,
    reset,
  };
};
