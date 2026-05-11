import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getCloudFunctionUrl, getFirebaseIdToken } from "@/utils/cloudFunctions";
import { trackActivationEvent } from "@/lib/analytics";

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

/** Exact-match hallucinations only — short filler words Gemini produces for silence */
const HALLUCINATED_PHRASES = [
  /^i'?m ready\.?$/i,
  /^ready\.?$/i,
  /^okay\.?$/i,
  /^ok\.?$/i,
  /^uh\.?$/i,
  /^um\.?$/i,
  /^\[no[_ ]?speech\]$/i,
];

/** The specific Gemini training-example hallucination about going to the store */
const STORE_MILK_HALLUCINATION = /^i'?m going to go to the store\.?\s*i need to (get|buy) some milk\.?$/i;

const isLikelyHallucination = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length < 2) return true;
  // Block the specific store/milk hallucination exactly
  if (STORE_MILK_HALLUCINATION.test(trimmed)) return true;
  return HALLUCINATED_PHRASES.some((re) => re.test(trimmed));
};

const normalizeForCompare = (s: string): string =>
  s.toLowerCase().replace(/[.,!?;:'"]/g, "").trim();

export const useBrainDumpCapture = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const isListeningRef = useRef(false);
  const isProcessingVoiceRef = useRef(false);
  const [transcript, setTranscript] = useState("");
  const [novaResponseText, setNovaResponseText] = useState("");
  const [savedEntry, setSavedEntry] = useState<{ title: string; category: string } | null>(null);
  const [actionsExecuted, setActionsExecuted] = useState<VoiceAgentAction[]>([]);
  const [appCommands, setAppCommands] = useState<Record<string, unknown>[]>([]);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastStartAttemptAt, setLastStartAttemptAt] = useState<number | null>(null);
  const [lastCapturedAudioUrl, setLastCapturedAudioUrl] = useState<string | null>(null);
  const lastCapturedAudioUrlRef = useRef<string | null>(null);
  const [continuous, setContinuous] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestTimeoutRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const capturePlaybackRef = useRef<HTMLAudioElement | null>(null);
  const continuousRef = useRef(continuous);
  const manualStopRef = useRef(false);
  const startRef = useRef<(() => Promise<void>) | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcribeRateLimitedUntilRef = useRef<number>(0);

  // Echo detection
  const lastTranscriptRef = useRef<string>("");
  const repeatCountRef = useRef(0);
  const lastNovaResponseRef = useRef<string>("");

  // VAD result (did user actually speak in the last recording?)
  const hasDetectedSpeechRef = useRef(false);
  const peakRmsRef = useRef(0);

  // Silence detection (VAD) refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceCheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSoundAtRef = useRef<number>(0);

  // Max recording duration per turn (matches floating Nova)
  const MAX_RECORDING_MS = 30_000; // 30 seconds max per turn
  const SILENCE_THRESHOLD_MS = 2500; // stop after 2.5s of silence (post-speech)
  const NO_SPEECH_TIMEOUT_MS = 8000; // give user 8s to start speaking
  const MIN_RECORDING_MS = 1500; // don't auto-stop in the first 1.5s

  useEffect(() => {
    continuousRef.current = continuous;
  }, [continuous]);

  const setListeningState = useCallback((value: boolean) => {
    isListeningRef.current = value;
    setIsListening(value);
  }, []);

  const setProcessingVoiceState = useCallback((value: boolean) => {
    isProcessingVoiceRef.current = value;
    setIsProcessingVoice(value);
  }, []);

  const scheduleContinuousRestart = useCallback((delayMs = 500) => {
    if (!continuousRef.current || manualStopRef.current) return;

    window.setTimeout(() => {
      if (!manualStopRef.current && startRef.current) {
        startRef.current();
      }
    }, delayMs);
  }, []);

  useEffect(() => {
    lastCapturedAudioUrlRef.current = lastCapturedAudioUrl;
  }, [lastCapturedAudioUrl]);

  const clearPendingRequest = useCallback(() => {
    if (requestTimeoutRef.current !== null) {
      window.clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }
    abortControllerRef.current = null;
  }, []);

  const clearAutoStopTimer = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }, []);

  const clearSilenceDetection = useCallback(() => {
    if (silenceCheckTimerRef.current) {
      clearInterval(silenceCheckTimerRef.current);
      silenceCheckTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { /* */ });
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const abortPendingRequest = useCallback(() => {
    abortControllerRef.current?.abort();
    clearPendingRequest();
  }, [clearPendingRequest]);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  /** Convert raw PCM/L16 bytes into a browser-playable WAV file.
   *
   * Nova labels this as `audio/L16`, but the returned PCM payload is already
   * in the little-endian byte order expected by WAV. Do not byte-swap here —
   * swapping creates loud static/noise in Chrome.
   */
  const pcmToWav = (pcmBytes: Uint8Array, sampleRate = 24000, channels = 1): ArrayBuffer => {
    const bytesPerSample = 2;
    const dataBytes = pcmBytes;

    const dataSize = dataBytes.length;
    const wavSize = 44 + dataSize;
    const buffer = new ArrayBuffer(wavSize);
    const view = new DataView(buffer);
    const writeStr = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
    };

    writeStr(0, "RIFF");
    view.setUint32(4, wavSize - 8, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * bytesPerSample, true);
    view.setUint16(32, channels * bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, dataSize, true);
    new Uint8Array(buffer).set(dataBytes, 44);
    return buffer;
  };

  const getPcmSampleRate = (mimeType: string): number => {
    const match = mimeType.match(/rate=(\d+)/i);
    return match ? Number(match[1]) : 24000;
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
          const sampleRate = getPcmSampleRate(mimeType);
          const wavBlob = new Blob([pcmToWav(bytes, sampleRate, 1)], { type: "audio/wav" });
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
        audio.onerror = (event) => {
          console.warn("[useBrainDumpCapture] Audio element failed to play Nova response", event);
          cleanup();
        };
        audio.play().catch((err) => {
          console.warn("[useBrainDumpCapture] Browser blocked/failed Nova audio playback", err);
          cleanup();
        });
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
      clearAutoStopTimer();
      clearSilenceDetection();
      audioRef.current?.pause();
      capturePlaybackRef.current?.pause();
      const audioUrl = lastCapturedAudioUrlRef.current;
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (mediaRecorderRef.current?.state === "recording") {
        try { mediaRecorderRef.current.stop(); } catch (_) { /* */ }
      }
      stopTracks();
    };
  }, [abortPendingRequest, clearAutoStopTimer, clearSilenceDetection, stopTracks]);

  const start = useCallback(async () => {
    const now = Date.now();
    if (transcribeRateLimitedUntilRef.current > now) {
      const waitSeconds = Math.max(1, Math.ceil((transcribeRateLimitedUntilRef.current - now) / 1000));
      manualStopRef.current = true;
      setVoiceError(`Nova transcription is cooling down. Try again in about ${waitSeconds}s.`);
      toast.info(`Nova is cooling down. Try again in about ${waitSeconds}s.`);
      return;
    }

    setLastStartAttemptAt(now);
    setVoiceError(null);
    trackActivationEvent("brain_dump_start_clicked", { source: "voice" });
    // If this is a manual (re)start after user action, reset echo counters
    if (manualStopRef.current) {
      repeatCountRef.current = 0;
      lastTranscriptRef.current = "";
      lastNovaResponseRef.current = "";
    }
    manualStopRef.current = false;
    console.log("[useBrainDumpCapture] start clicked");

    const recorderBusy = mediaRecorderRef.current?.state === "recording";
    if (recorderBusy || isProcessingVoiceRef.current) {
      console.log("[useBrainDumpCapture] start ignored, already busy", {
        recorderState: mediaRecorderRef.current?.state,
        isProcessingVoice: isProcessingVoiceRef.current,
      });
      return;
    }

    abortPendingRequest();
    audioChunksRef.current = [];

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === "undefined") {
      trackActivationEvent("brain_dump_voice_unavailable", { reason: "unsupported_browser" });
      setVoiceError("Voice capture is not available in this browser. Type your brain dump instead.");
      toast.error("Voice capture is not available in this browser.");
      return;
    }

    try {
      // Request raw audio — disable browser processing that filters out speech
      // (echo cancellation especially causes trouble when Nova's TTS plays).
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      });
      trackActivationEvent("mic_permission_granted");
      streamRef.current = stream;

      // Log actual track settings applied by browser
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        console.log("[useBrainDumpCapture] audio track settings:", audioTrack.getSettings());
      }

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
        clearAutoStopTimer();
        clearSilenceDetection();
        setListeningState(false);
        stopTracks();

        const resolvedMimeType = mimeTypeRef.current || recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: resolvedMimeType });
        trackActivationEvent("recording_completed", {
          blob_size: blob.size,
          mime_type: resolvedMimeType,
        });

        console.log("[useBrainDumpCapture] recorder stopped", {
          chunks: audioChunksRef.current.length,
          blobSize: blob.size,
          mimeType: resolvedMimeType,
        });

        if (blob.size < 500) {
          trackActivationEvent("recording_rejected", { reason: "too_short", blob_size: blob.size });
          setVoiceError("Nova didn't catch enough audio. Try a longer voice dump, or type your brain dump instead.");
          toast.error("Recorded audio was too short or empty.");
          scheduleContinuousRestart();
          return;
        }

        // VAD diagnostics — log what we saw, but trust transcribe to decide
        const heardSpeech = hasDetectedSpeechRef.current;
        const peakRms = peakRmsRef.current;
        console.log("[useBrainDumpCapture] VAD summary — heardSpeech:", heardSpeech, "peakRms:", peakRms.toFixed(2), "blobSize:", blob.size);

        // Expose captured audio for user playback/debugging.
        try {
          const blobUrl = URL.createObjectURL(blob);
          setLastCapturedAudioUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return blobUrl;
          });
          (window as unknown as { __lastCapturedAudioUrl?: string }).__lastCapturedAudioUrl = blobUrl;
          console.log("[useBrainDumpCapture] 🔊 Audio captured — use Play last recording or run: new Audio(window.__lastCapturedAudioUrl).play()");
        } catch (_) { /* */ }

        setProcessingVoiceState(true);

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

          // ── Step 1: Transcribe audio first (fast, reliable ~1-2s) ─────────
          console.log("[useBrainDumpCapture] Step 1: transcribing audio...");
          const transcribeResponse = await fetch(TRANSCRIBE_URL, {
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

          const transcribeData = await transcribeResponse.json().catch(() => ({}));

          const restartIfContinuous = () => {
            setProcessingVoiceState(false);
            scheduleContinuousRestart();
          };

          if (!transcribeResponse.ok) {
            trackActivationEvent("transcription_failed", {
              status: transcribeResponse.status,
              reason: transcribeResponse.status === 429 ? "rate_limited" : "http_error",
            });
            console.warn("[useBrainDumpCapture] transcribeAudio failed:", transcribeResponse.status, transcribeData);
            if (transcribeResponse.status === 429) {
              const retryAfterHeader = transcribeResponse.headers.get("Retry-After");
              const retryAfterSeconds = Number(retryAfterHeader);
              const cooldownMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
                ? retryAfterSeconds * 1000
                : 30_000;
              transcribeRateLimitedUntilRef.current = Date.now() + cooldownMs;
              manualStopRef.current = true;
              setVoiceError("Nova transcription is rate-limited right now. Please wait a bit, then try again.");
              toast.info(`Nova is rate-limited right now. Try again in about ${Math.ceil(cooldownMs / 1000)}s.`);
              setProcessingVoiceState(false);
              return;
            }

            toast.error("Nova couldn't transcribe that recording. Please try again.");
            restartIfContinuous();
            return;
          }

          transcribeRateLimitedUntilRef.current = 0;
          const heardText = (transcribeData?.detected && transcribeData?.transcript?.trim()) || "";
          trackActivationEvent("transcription_completed", {
            detected: Boolean(heardText),
            transcript_length: heardText.length,
          });
          console.log("[useBrainDumpCapture] transcript:", heardText || "(none)");

          // ── Echo / hallucination guard BEFORE calling voiceAgent ──────────
          const heardNormalized = normalizeForCompare(heardText);
          const lastNormalized = normalizeForCompare(lastTranscriptRef.current);
          const novaLastNormalized = normalizeForCompare(lastNovaResponseRef.current);

          if (!heardText) {
            console.log("[useBrainDumpCapture] no speech detected — skipping voiceAgent");
            repeatCountRef.current += 1;
            if (!continuousRef.current && repeatCountRef.current >= 2) {
              manualStopRef.current = true;
              toast.info("Nova didn't catch anything. Tap the mic to try again.");
              setProcessingVoiceState(false);
              return;
            }
            if (continuousRef.current && repeatCountRef.current % 6 === 0) {
              toast.info("Nova is still listening. Start speaking when you're ready.");
            }
            restartIfContinuous();
            return;
          }

          if (isLikelyHallucination(heardText)) {
            console.log("[useBrainDumpCapture] skipping: likely hallucination/silence:", heardText);
            repeatCountRef.current += 1;
            if (!continuousRef.current && repeatCountRef.current >= 2) {
              manualStopRef.current = true;
              toast.info("Nova didn't catch anything clear. Tap the mic to try again.");
              setProcessingVoiceState(false);
              return;
            }
            if (continuousRef.current && repeatCountRef.current % 6 === 0) {
              toast.info("Nova is still listening. Start speaking when you're ready.");
            }
            restartIfContinuous();
            return;
          }

          if (heardNormalized === lastNormalized) {
            console.log("[useBrainDumpCapture] skipping: duplicate transcript (echo)");
            if (!continuousRef.current) {
              manualStopRef.current = true;
              toast.info("Mic echo detected — paused. Tap to resume.");
              setProcessingVoiceState(false);
              return;
            }
            restartIfContinuous();
            return;
          }

          if (novaLastNormalized.length > 10 && heardNormalized.includes(novaLastNormalized.substring(0, 20))) {
            console.log("[useBrainDumpCapture] skipping: transcript matches Nova's last response");
            if (!continuousRef.current) {
              manualStopRef.current = true;
              toast.info("Nova heard herself — paused to avoid echo. Tap to resume.");
              setProcessingVoiceState(false);
              return;
            }
            restartIfContinuous();
            return;
          }

          // Real speech detected — accumulate in transcript, reset counters, proceed to agent
          repeatCountRef.current = 0;
          lastTranscriptRef.current = heardText;
          // Append to previous transcript so continuous mode builds up thoughts
          setTranscript((prev) => {
            const combined = prev ? `${prev} ${heardText}`.trim() : heardText;
            return combined;
          });
          toast.success("Nova heard your voice dump.");

          // ── Step 2: Send TEXT to voiceAgent (faster + reliable) ───────────
          console.log("[useBrainDumpCapture] Step 2: sending text to voiceAgent...");
          const agentData = await fetch(VOICE_AGENT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              transcript: heardText,
              conversationHistory: [],
              sessionId: null,
            }),
            signal: controller.signal,
          }).then((r) => r.json());

          clearPendingRequest();

          // Log the FULL response so we can see what Nova returned
          console.log("[useBrainDumpCapture] voiceAgent full response:", JSON.stringify({
            ok: !agentData.error,
            transcript: agentData.transcript,
            responseText: agentData.responseText,
            audioMimeType: agentData.audioMimeType,
            hasAudio: !!agentData.audioContent,
            audioLength: agentData.audioContent?.length || 0,
            actionsCount: agentData.actionsExecuted?.length || 0,
            error: agentData.error,
          }));

          if (agentData.error) {
            trackActivationEvent("brain_dump_voice_agent_failed", { reason: String(agentData.error).slice(0, 80) });
            console.error("[useBrainDumpCapture] voiceAgent error:", agentData.error);
            setVoiceError(`Nova error: ${agentData.error}`);
            toast.error(`Nova error: ${agentData.error}`);
            restartIfContinuous();
            return;
          }

          // Clean and set Nova's response text
          const novaText = cleanResponseText(agentData.responseText || "");
          if (novaText) {
            setNovaResponseText(novaText);
            lastNovaResponseRef.current = novaText;
          } else {
            console.warn("[useBrainDumpCapture] Nova returned no text response");
            setNovaResponseText("(Nova did not respond — but saved your note below.)");
          }

          // Track actions executed
          if (agentData.actionsExecuted?.length) {
            setActionsExecuted(agentData.actionsExecuted);
            const saveAction = agentData.actionsExecuted.find(
              (a: VoiceAgentAction) => a.tool === "saveEntry" && a.result?.success
            );
            if (saveAction) {
              trackActivationEvent("brain_dump_saved", {
                source: "voice_agent",
                category: (saveAction.args?.category as string) || "Personal",
              });
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
            console.log("[useBrainDumpCapture] playing Nova audio...", agentData.audioMimeType);
            await playAudio(agentData.audioContent, agentData.audioMimeType || "audio/pcm");
            console.log("[useBrainDumpCapture] Nova audio finished");
          } else {
            console.warn("[useBrainDumpCapture] No audio content from voiceAgent — Nova is silent");
          }

          setProcessingVoiceState(false);

          // ── Continuous mode: auto-restart recording after Nova finishes ─────
          // 800ms delay to let speakers settle and avoid mic echo of Nova's audio
          if (continuousRef.current && !manualStopRef.current) {
            console.log("[useBrainDumpCapture] continuous mode: restarting recording in 800ms");
            scheduleContinuousRestart(800);
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
          setProcessingVoiceState(false);
          if (message !== "Not authenticated") {
            scheduleContinuousRestart(1000);
          }
        } finally {
          clearPendingRequest();
        }
      };

      recorder.onerror = (event: Event) => {
        console.error("[useBrainDumpCapture] MediaRecorder error:", (event as ErrorEvent).error);
        setVoiceError("Audio recording failed to start.");
        toast.error("Audio recording failed to start.");
        setListeningState(false);
        stopTracks();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setListeningState(true);
      trackActivationEvent("recording_started", { mime_type: mimeTypeRef.current });

      // ── Set up silence detection (VAD) ──────────────────────────────────
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        // CRITICAL: browsers auto-suspend AudioContexts — must resume to get live audio
        if (ctx.state === "suspended") {
          await ctx.resume();
          console.log("[useBrainDumpCapture] AudioContext resumed, state:", ctx.state);
        } else {
          console.log("[useBrainDumpCapture] AudioContext state:", ctx.state);
        }
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);
        analyserRef.current = analyser;

        // Use time-domain data (raw waveform amplitude) — more accurate than FFT for volume
        const timeData = new Uint8Array(analyser.fftSize);
        const recordStartTime = Date.now();
        lastSoundAtRef.current = recordStartTime;
        hasDetectedSpeechRef.current = false;
        peakRmsRef.current = 0;
        // Auto-calibrate from baseline ambient noise before allowing speech detection.
        // The previous logic used the default 1.5 threshold during calibration, so room
        // noise/clicks could mark `hasSpeech` early and stop the recorder before Victor
        // actually started talking. Keep calibration as a no-decision window.
        const CALIBRATION_MS = 700;
        const SPEECH_FRAME_COUNT = 2;
        let baselineRms = 0;
        let baselineSamples = 0;
        let isCalibrated = false;
        let speechFrames = 0;
        let SPEECH_RMS_THRESHOLD = 2.5;
        let logCount = 0;

        silenceCheckTimerRef.current = setInterval(() => {
          if (!analyserRef.current || mediaRecorderRef.current?.state !== "recording") return;
          analyserRef.current.getByteTimeDomainData(timeData);
          // Compute RMS deviation from center (128 = silence)
          let sum = 0;
          for (let i = 0; i < timeData.length; i++) {
            const dev = timeData[i] - 128;
            sum += dev * dev;
          }
          const rms = Math.sqrt(sum / timeData.length);
          const now = Date.now();
          const elapsedSinceStart = now - recordStartTime;

          if (rms > peakRmsRef.current) peakRmsRef.current = rms;

          if (!isCalibrated) {
            if (elapsedSinceStart < CALIBRATION_MS) {
              baselineRms = (baselineRms * baselineSamples + rms) / (baselineSamples + 1);
              baselineSamples++;
            } else {
              // Use a lower dynamic threshold than 3× baseline. In real walkthroughs,
              // speech peaked around 6.09 while ambient baseline was 2.14; 3× baseline
              // made true speech miss by a hair.
              SPEECH_RMS_THRESHOLD = Math.max(2.5, baselineRms + 2.0, baselineRms * 1.8);
              isCalibrated = true;
              console.log("[VAD] calibrated: baseline rms=", baselineRms.toFixed(2), "threshold=", SPEECH_RMS_THRESHOLD.toFixed(2));
            }
            return;
          }

          // Periodic logging so we can see what RMS levels we're seeing
          logCount++;
          if (logCount % 7 === 0) {
            console.log("[VAD] rms:", rms.toFixed(2), "peak:", peakRmsRef.current.toFixed(2), "thr:", SPEECH_RMS_THRESHOLD.toFixed(2), "hasSpeech:", hasDetectedSpeechRef.current);
          }

          if (rms > SPEECH_RMS_THRESHOLD) {
            speechFrames += 1;
            lastSoundAtRef.current = now;
            if (!hasDetectedSpeechRef.current && speechFrames >= SPEECH_FRAME_COUNT) {
              hasDetectedSpeechRef.current = true;
              console.log("[useBrainDumpCapture] VAD: speech detected (rms:", rms.toFixed(2), ")");
            }
          } else {
            speechFrames = 0;
          }

          if (elapsedSinceStart < MIN_RECORDING_MS) return;

          // If VAD appears broken (peak stuck near 0 for >3s), mark as "detected"
          // and just rely on MAX_RECORDING_MS — trust transcribe to reject silence.
          if (!hasDetectedSpeechRef.current && elapsedSinceStart > 3000 && peakRmsRef.current < 1.5) {
            console.warn("[useBrainDumpCapture] VAD appears broken (peak rms <1.5), disabling auto-stop. Will record until MAX_RECORDING_MS or user stops.");
            hasDetectedSpeechRef.current = true; // treat as if speech detected so we don't hit no-speech timeout
            lastSoundAtRef.current = now; // reset so silence timer doesn't fire immediately
          }

          if (hasDetectedSpeechRef.current) {
            const silentMs = now - lastSoundAtRef.current;
            if (silentMs >= SILENCE_THRESHOLD_MS) {
              console.log("[useBrainDumpCapture] VAD: silence after speech, stopping", { elapsedSinceStart, silentMs, peakRms: peakRmsRef.current.toFixed(2) });
              if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
              }
            }
          } else {
            if (elapsedSinceStart >= NO_SPEECH_TIMEOUT_MS) {
              console.log("[useBrainDumpCapture] VAD: no speech detected in window, stopping", { elapsedSinceStart, peakRms: peakRmsRef.current.toFixed(2) });
              if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
              }
            }
          }
        }, 150);
      } catch (vadErr) {
        console.warn("[useBrainDumpCapture] VAD setup failed, falling back to timeout only:", vadErr);
      }

      // Max recording safety cap
      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          console.log("[useBrainDumpCapture] Max duration reached, stopping");
          mediaRecorderRef.current.stop();
        }
      }, MAX_RECORDING_MS);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("Permission denied") || message.includes("NotAllowedError")) {
        trackActivationEvent("mic_permission_denied");
        setVoiceError("Microphone access denied. Please allow microphone access and try again.");
        toast.error("Microphone access denied.");
      } else {
        trackActivationEvent("brain_dump_voice_start_failed", { reason: message.slice(0, 80) });
        console.error("[useBrainDumpCapture] start failed:", error);
        setVoiceError(`Voice did not start. ${message}. Type your brain dump and Nova will still organize it.`);
        toast.error(`Voice did not start: ${message}`);
      }
      setListeningState(false);
      stopTracks();
    }
  }, [
    abortPendingRequest,
    clearAutoStopTimer,
    clearPendingRequest,
    clearSilenceDetection,
    playAudio,
    scheduleContinuousRestart,
    setListeningState,
    setProcessingVoiceState,
    stopTracks,
  ]);

  // Keep startRef in sync for continuous mode
  useEffect(() => {
    startRef.current = start;
  }, [start]);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    clearAutoStopTimer();
    clearSilenceDetection();
    if (isProcessingVoice) {
      abortPendingRequest();
      audioRef.current?.pause();
      setProcessingVoiceState(false);
      setVoiceError("Voice upload canceled. You can try again, or type your brain dump below.");
      toast.info("Voice upload canceled");
      return;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      try { mediaRecorderRef.current.requestData(); } catch (_) { /* */ }
      mediaRecorderRef.current.stop();
    } else {
      setListeningState(false);
      stopTracks();
    }
  }, [abortPendingRequest, clearAutoStopTimer, clearSilenceDetection, isProcessingVoice, setListeningState, setProcessingVoiceState, stopTracks]);

  const playLastRecording = useCallback(async () => {
    if (!lastCapturedAudioUrl) {
      toast.info("No recording captured yet.");
      return;
    }

    try {
      capturePlaybackRef.current?.pause();
      const audio = new Audio(lastCapturedAudioUrl);
      capturePlaybackRef.current = audio;
      audio.volume = parseFloat(localStorage.getItem("speech_volume") || "0.8");
      await audio.play();
    } catch (error) {
      console.warn("[useBrainDumpCapture] Captured recording playback failed:", error);
      toast.error("Could not play the last recording. Try a hard refresh and record again.");
    }
  }, [lastCapturedAudioUrl]);

  const reset = useCallback(() => {
    manualStopRef.current = true;
    abortPendingRequest();
    clearAutoStopTimer();
    clearSilenceDetection();
    audioRef.current?.pause();
    capturePlaybackRef.current?.pause();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setListeningState(false);
    setProcessingVoiceState(false);
    setTranscript("");
    setNovaResponseText("");
    setSavedEntry(null);
    setActionsExecuted([]);
    setAppCommands([]);
    setVoiceError(null);
    audioChunksRef.current = [];
    repeatCountRef.current = 0;
    lastTranscriptRef.current = "";
    lastNovaResponseRef.current = "";
    transcribeRateLimitedUntilRef.current = 0;
    if (lastCapturedAudioUrl) {
      URL.revokeObjectURL(lastCapturedAudioUrl);
      setLastCapturedAudioUrl(null);
    }
    stopTracks();
  }, [abortPendingRequest, clearAutoStopTimer, clearSilenceDetection, lastCapturedAudioUrl, setListeningState, setProcessingVoiceState, stopTracks]);

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
    lastCapturedAudioUrl,
    playLastRecording,
    continuous,
    setContinuous,
    start,
    stop,
    reset,
  };
};
