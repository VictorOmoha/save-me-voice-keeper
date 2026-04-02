import { l as auth, J as Jt } from "./index-CT7EzYyk.js";
const LS_ENABLED = "voice_audio_cue_enabled";
const LS_VOLUME = "voice_audio_cue_volume";
const DEFAULTS = {
  enabled: true,
  volume: 0.4,
  frequency: 660,
  durationMs: 180
};
const getAudioCueSettings = () => {
  try {
    const enabled = localStorage.getItem(LS_ENABLED);
    const volume = localStorage.getItem(LS_VOLUME);
    return {
      enabled: enabled === null ? DEFAULTS.enabled : enabled === "true",
      volume: volume === null ? DEFAULTS.volume : Math.min(1, Math.max(0, parseFloat(volume))),
      frequency: DEFAULTS.frequency,
      durationMs: DEFAULTS.durationMs
    };
  } catch (error) {
    console.debug("Failed to read audio cue settings:", error);
    return { ...DEFAULTS };
  }
};
const playEndOfSpeechCue = async () => {
  const { volume, frequency = DEFAULTS.frequency, durationMs = DEFAULTS.durationMs } = getAudioCueSettings();
  if (typeof window === "undefined") return;
  const w = window;
  const AudioCtx = w.AudioContext || w.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency * 0.98, ctx.currentTime);
  filter.type = "lowpass";
  filter.frequency.value = 1400;
  filter.Q.value = 1e-4;
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(filter);
  filter.connect(ctx.destination);
  const now = ctx.currentTime;
  const dur = Math.max(0.12, durationMs / 1e3);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * 0.8, now + 0.02);
  gain.gain.setTargetAtTime(1e-4, now + 0.06, Math.max(0.04, dur / 2));
  osc.start(now);
  osc.frequency.linearRampToValueAtTime(frequency, now + Math.min(0.08, dur * 0.4));
  osc.stop(now + dur + 0.04);
  await new Promise((resolve) => {
    osc.onended = () => {
      try {
        ctx.close();
      } catch (error) {
        console.debug("Failed to close audio context:", error);
      }
      resolve();
    };
  });
};
const playEndOfSpeechCueIfEnabled = async () => {
  const { enabled } = getAudioCueSettings();
  if (!enabled) return;
  try {
    await playEndOfSpeechCue();
  } catch (e) {
    console.warn("Audio cue failed:", e);
  }
};
const CLOUD_FUNCTIONS_BASE_URL = "https://us-central1-saveme-f5af0.cloudfunctions.net";
const DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB";
const AVAILABLE_VOICES = {
  "Adam": "pNInz6obpgDQGcFmaJgB",
  "Antoni": "ErXwobaYiN019PkySvjV",
  "Arnold": "VR6AewLTigWG4xSOukaG",
  "Aria": "9BWtsMINqrJLrRacOk9x",
  "Bella": "XB0fDUnXU5powFXDhCwa",
  // Charlotte voice ID (female)
  "Domi": "AZnzlk1XvdvUeBnXmlld",
  "Elli": "MF3mGyEYCl7XYWbV9V6O",
  "Josh": "TxGEqnHWrfWFTfGW9XjX",
  "Laura": "FGY2WhTYpPnrIDTdsKH5",
  "Rachel": "pqHfZKP75CvOlQylNhV4",
  "Sam": "yoZ06aMxZJJ28mfd3POQ",
  "Sarah": "EXAVITQu4vr4xnSDxMaL"
};
const MINIMAX_VOICES = {
  "male-qn-qingse": "Male Voice (清晰)",
  "female-shaonv": "Female Voice (少女)",
  "male-qn-jingying": "Male Professional",
  "female-qn-qingse": "Female Professional",
  "broadcaster_male": "Broadcaster Male",
  "broadcaster_female": "Broadcaster Female"
};
const GOOGLE_VOICES = {
  "en-US-Neural2-A": "Male (Neural)",
  "en-US-Neural2-C": "Female (Neural)",
  "en-US-Neural2-D": "Male (Neural 2)",
  "en-US-Neural2-F": "Female (Neural 2)",
  "en-US-Standard-A": "Male (Standard)",
  "en-US-Standard-B": "Male (Standard 2)",
  "en-US-Standard-C": "Female (Standard)"
};
const VOICE_OPTIONS = {
  "adam": "Adam",
  "antoni": "Antoni",
  "arnold": "Arnold",
  "aria": "Aria",
  "bella": "Bella",
  "domi": "Domi",
  "elli": "Elli",
  "josh": "Josh",
  "laura": "Laura",
  "rachel": "Rachel",
  "sam": "Sam",
  "sarah": "Sarah"
};
const isCloudFunctionsConfigured = () => {
  return true;
};
const getUserElevenLabsKey = () => {
  return localStorage.getItem("elevenlabs_user_api_key");
};
const hasUserElevenLabsKey = () => {
  const key = getUserElevenLabsKey();
  return !!key && key.startsWith("sk_");
};
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.warn("TTS: No authenticated user for Cloud Functions call");
    return null;
  }
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error("TTS: Failed to get auth token:", error);
    return null;
  }
};
const callCloudFunction = async (functionName, payload) => {
  const token = await getAuthToken();
  if (!token) {
    Jt.error("Please sign in to use cloud TTS services");
    return null;
  }
  try {
    const response = await fetch(`${CLOUD_FUNCTIONS_BASE_URL}/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error(`TTS: Cloud Function ${functionName} error:`, errorData);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`TTS: Cloud Function ${functionName} failed:`, error);
    throw error;
  }
};
const speakWithUserElevenLabs = async (text, voiceId) => {
  const apiKey = getUserElevenLabsKey();
  if (!apiKey) return false;
  try {
    console.log("TTS: Using user ElevenLabs API key");
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
      console.error("TTS: User ElevenLabs API error:", response.status);
      return false;
    }
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      const volume = parseFloat(localStorage.getItem("speech_volume") || "0.8");
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(true);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(false);
      };
      audio.play().catch(() => resolve(false));
    });
  } catch (error) {
    console.error("TTS: User ElevenLabs call failed:", error);
    return false;
  }
};
const getSelectedTTSService = () => {
  const stored = localStorage.getItem("selected_tts_service");
  if (stored && ["elevenlabs", "minimax", "google", "browser"].includes(stored)) {
    return stored;
  }
  return "google";
};
const getSelectedVoice = () => {
  const stored = localStorage.getItem("selected_voice");
  if (stored && stored in VOICE_OPTIONS) {
    return stored;
  }
  return "rachel";
};
const getSelectedMiniMaxVoice = () => {
  const stored = localStorage.getItem("selected_minimax_voice");
  if (stored && stored in MINIMAX_VOICES) {
    return stored;
  }
  return "male-qn-qingse";
};
const getSelectedGoogleVoice = () => {
  const stored = localStorage.getItem("selected_google_voice");
  if (stored && stored in GOOGLE_VOICES) {
    return stored;
  }
  return "en-US-Neural2-F";
};
const initializeTTSCache = () => {
  if (!window.__recent_tts_texts) {
    window.__recent_tts_texts = [];
  }
};
const addToTTSCache = (text) => {
  initializeTTSCache();
  const cache = window.__recent_tts_texts;
  cache.unshift(text);
  if (cache.length > 3) {
    cache.splice(3);
  }
  setTimeout(() => {
    const index = cache.indexOf(text);
    if (index > -1) {
      cache.splice(index, 1);
    }
  }, 1e4);
};
const speak = async (text, optionsOrVoice) => {
  if (!text || text.trim().length === 0) {
    console.log("TTS: Empty text provided, skipping");
    return;
  }
  console.log("TTS: Starting speech:", text.substring(0, 50) + (text.length > 50 ? "..." : ""));
  addToTTSCache(text);
  window.__tts_is_speaking = true;
  window.dispatchEvent(new CustomEvent("tts-started"));
  console.log("TTS: Set speaking flag and dispatched tts-started event");
  try {
    let options;
    if (typeof optionsOrVoice === "object") {
      options = optionsOrVoice;
    }
    const dispatchCompleted = () => {
      try {
        playEndOfSpeechCueIfEnabled();
      } catch (e) {
        console.warn("Audio cue failed:", e instanceof Error ? e.message : String(e));
      }
      window.__tts_is_speaking = false;
      window.__last_tts_end_time = Date.now();
      window.dispatchEvent(new CustomEvent("tts-completed"));
      console.log("TTS: Speech completed, dispatched tts-completed event");
    };
    const selectedService = getSelectedTTSService();
    if (selectedService === "elevenlabs" && hasUserElevenLabsKey()) {
      console.log("TTS: Attempting user ElevenLabs key");
      const voiceName = getSelectedVoice();
      const voiceId = AVAILABLE_VOICES[VOICE_OPTIONS[voiceName]] || DEFAULT_VOICE_ID;
      const success = await speakWithUserElevenLabs(text, voiceId);
      if (success) {
        dispatchCompleted();
        return;
      }
      console.warn("TTS: User ElevenLabs failed, trying fallbacks");
    }
    const cloudFunctionsAvailable = isCloudFunctionsConfigured() && auth.currentUser;
    if (cloudFunctionsAvailable && selectedService !== "browser") {
      console.log(`TTS: Using Cloud Function for ${selectedService}`);
      try {
        let audioContent = null;
        if (selectedService === "elevenlabs") {
          const voiceName = getSelectedVoice();
          const voiceId = AVAILABLE_VOICES[VOICE_OPTIONS[voiceName]] || DEFAULT_VOICE_ID;
          const result = await callCloudFunction("elevenlabsTts", {
            text,
            voiceId,
            modelId: "eleven_turbo_v2"
          });
          audioContent = result?.audioContent || null;
        } else if (selectedService === "google") {
          const voiceName = getSelectedGoogleVoice();
          const result = await callCloudFunction("googleCloudTts", {
            text,
            voiceName,
            languageCode: "en-US"
          });
          audioContent = result?.audioContent || null;
        } else if (selectedService === "minimax") {
          const voiceId = getSelectedMiniMaxVoice();
          const result = await callCloudFunction("minimaxTts", {
            text,
            voice_id: voiceId,
            speed: 1,
            vol: 1,
            pitch: 0
          });
          audioContent = result?.audioContent || null;
        }
        if (audioContent) {
          await playBase64Audio(audioContent);
          dispatchCompleted();
          return;
        }
      } catch (cloudError) {
        console.warn("TTS: Cloud Function failed, falling back to browser TTS:", cloudError);
      }
    }
    console.log("TTS: Using browser TTS");
    try {
      const speechRate = parseFloat(localStorage.getItem("speech_rate") || "0.9");
      const speechVolume = parseFloat(localStorage.getItem("speech_volume") || "0.8");
      await speakWithBrowser(text, { rate: options?.rate || speechRate, pitch: options?.pitch || 1, volume: options?.volume || speechVolume, onEnd: options?.onEnd });
      dispatchCompleted();
    } catch (browserError) {
      console.error("TTS: Browser TTS failed:", browserError);
      throw new Error("TTS failed. Please check your browser compatibility.");
    }
  } catch (error) {
    console.error("TTS: Error during speech:", error);
    Jt.error("TTS failed. Please try again.");
    try {
      playEndOfSpeechCueIfEnabled();
    } catch (e) {
      console.warn("Audio cue failed:", e instanceof Error ? e.message : String(e));
    }
    window.__tts_is_speaking = false;
    window.__last_tts_end_time = Date.now();
    window.dispatchEvent(new CustomEvent("tts-completed"));
    console.log("TTS: Speech error, dispatched tts-completed event");
  }
};
const playBase64Audio = async (base64Audio) => {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audio.onended = () => {
        console.log("TTS: Cloud audio playback completed");
        resolve();
      };
      audio.onerror = (error) => {
        console.error("TTS: Cloud audio playback error:", error);
        reject(new Error("Audio playback failed"));
      };
      const volume = parseFloat(localStorage.getItem("speech_volume") || "0.8");
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};
const speakWithBrowser = async (text, options) => {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("Speech synthesis not supported"));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 0.9;
    utterance.pitch = options?.pitch || 1;
    utterance.volume = options?.volume || 0.8;
    const preferredLang = localStorage.getItem("speech_language") || "en-US";
    utterance.lang = preferredLang;
    const voices = window.speechSynthesis.getVoices();
    const baseLang = preferredLang.split("-")[0];
    const preferredVoice = voices.find((v) => v.lang === preferredLang) || voices.find((v) => v.lang.startsWith(baseLang)) || voices.find((v) => (v.name.includes("Google") || v.name.includes("Microsoft")) && v.lang.startsWith("en")) || voices.find((v) => v.lang.startsWith("en"));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log("TTS: Using browser voice:", preferredVoice.name, "lang:", preferredVoice.lang);
    } else {
      console.log("TTS: No preferred voice found, using default with lang:", preferredLang);
    }
    utterance.onend = () => {
      console.log("TTS: Browser speech completed");
      if (options?.onEnd) {
        options.onEnd();
      }
      resolve();
    };
    utterance.onerror = (error) => {
      console.error("TTS: Browser speech error:", error);
      reject(error);
    };
    window.speechSynthesis.speak(utterance);
  });
};
const stopSpeaking = () => {
  console.log("TTS: Stopping all speech");
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  window.__tts_is_speaking = false;
  window.__last_tts_end_time = Date.now();
  window.dispatchEvent(new CustomEvent("tts-completed"));
};
const stopCurrentSpeech = stopSpeaking;
export {
  GOOGLE_VOICES as G,
  MINIMAX_VOICES as M,
  VOICE_OPTIONS as V,
  speak as a,
  playEndOfSpeechCue as p,
  stopCurrentSpeech as s
};
