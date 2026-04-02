/**
 * Demo TTS - High-quality text-to-speech for landing page demo
 * Uses server-side Google Cloud TTS proxy (secure, no API key exposed)
 * Falls back to browser TTS if cloud function unavailable
 */

// Cloud function URL for demo TTS
const DEMO_TTS_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_URL
  ? `${import.meta.env.VITE_CLOUD_FUNCTIONS_URL}/demoTts`
  : null;

// Voice options for demo (mapped to Google Cloud TTS voices on the server)
export const DEMO_VOICES = {
  rachel: 'rachel',  // Warm female (en-US-Studio-O)
  adam: 'adam',       // Professional male (en-US-Studio-M)
  aria: 'aria',      // Expressive female (en-US-Neural2-F)
  josh: 'josh',      // Deep male (en-US-Neural2-D)
} as const;

// State tracking
let isSpeakingFlag = false;
let currentAudio: HTMLAudioElement | null = null;
let cloudTtsAvailable: boolean | null = null;

// Preload browser voices
let browserVoicesLoaded = false;
let browserVoices: SpeechSynthesisVoice[] = [];

const loadBrowserVoices = (): Promise<SpeechSynthesisVoice[]> => {
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
      synth.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(browserVoices);
    };

    synth.addEventListener('voiceschanged', onVoicesChanged);
    setTimeout(() => {
      if (!browserVoicesLoaded) {
        browserVoices = synth.getVoices();
        browserVoicesLoaded = true;
        resolve(browserVoices);
      }
    }, 1000);
  });
};

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadBrowserVoices();
}

/**
 * Speak text using server-side ElevenLabs proxy or browser TTS
 */
export const demoSpeak = async (
  text: string,
  options?: {
    voice?: keyof typeof DEMO_VOICES;
    onStart?: () => void;
    onEnd?: () => void;
  }
): Promise<void> => {
  if (!text || text.trim().length === 0) {
    options?.onEnd?.();
    return;
  }

  const voice = options?.voice ? DEMO_VOICES[options.voice] : DEMO_VOICES.rachel;

  isSpeakingFlag = true;
  options?.onStart?.();
  window.dispatchEvent(new CustomEvent('demo-tts-started'));

  try {
    if (DEMO_TTS_URL) {
      console.log('[DemoTTS] Using server-side Google Cloud TTS proxy');
      await speakWithCloudFunction(text, voice);
      cloudTtsAvailable = true;
    } else {
      console.log('[DemoTTS] No cloud function URL, using browser TTS');
      await speakWithBrowser(text);
    }
  } catch (error) {
    console.error('[DemoTTS] Error:', error);
    cloudTtsAvailable = false;
    // Fallback to browser TTS
    if (DEMO_TTS_URL) {
      console.log('[DemoTTS] Falling back to browser TTS');
      try {
        await speakWithBrowser(text);
      } catch (browserError) {
        console.error('[DemoTTS] Browser TTS fallback also failed:', browserError);
      }
    }
  } finally {
    isSpeakingFlag = false;
    currentAudio = null;
    window.dispatchEvent(new CustomEvent('demo-tts-completed'));
    options?.onEnd?.();
  }
};

/**
 * Speak using server-side cloud function (Google Cloud TTS proxy)
 */
const speakWithCloudFunction = async (text: string, voice: string): Promise<void> => {
  const response = await fetch(DEMO_TTS_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.substring(0, 500), voice }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DemoTTS] Cloud function error:', response.status, errorText);
    throw new Error(`Cloud function error: ${response.status}`);
  }

  const data = await response.json();
  const audioBytes = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));
  const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
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

/**
 * Optimized browser TTS fallback
 */
const speakWithBrowser = async (text: string): Promise<void> => {
  if (!('speechSynthesis' in window)) {
    throw new Error('Speech synthesis not supported');
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const voices = await loadBrowserVoices();
  const utterance = new SpeechSynthesisUtterance(text);

  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 0.9;
  utterance.lang = 'en-US';

  const voicePreferences = [
    'Google US English',
    'Google UK English Female',
    'Microsoft Zira',
    'Microsoft David',
    'Samantha',
    'Karen',
    'Daniel',
  ];

  let selectedVoice: SpeechSynthesisVoice | null = null;
  for (const pref of voicePreferences) {
    selectedVoice = voices.find(v => v.name.includes(pref)) || null;
    if (selectedVoice) break;
  }

  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith('en')) || null;
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  await new Promise<void>((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(event);
    synth.speak(utterance);
  });
};

/** Stop any ongoing speech */
export const demoStopSpeaking = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isSpeakingFlag = false;
  window.dispatchEvent(new CustomEvent('demo-tts-completed'));
};

/** Check if currently speaking */
export const demoIsSpeaking = (): boolean => isSpeakingFlag;

/** Check if cloud TTS is available (via cloud function) */
export const isCloudTtsAvailable = (): boolean => {
  // If we've tested it, return cached result
  if (cloudTtsAvailable !== null) return cloudTtsAvailable;
  // Optimistically return true if cloud function URL is configured
  return !!DEMO_TTS_URL;
};
