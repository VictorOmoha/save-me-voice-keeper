/**
 * Demo TTS - High-quality text-to-speech for landing page demo
 * Uses ElevenLabs when available, falls back to optimized browser TTS
 */

// ElevenLabs API endpoint
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// Default voice - Rachel (clear, friendly female voice)
const DEFAULT_VOICE_ID = 'pqHfZKP75CvOlQylNhV4';

// Voice options for demo
export const DEMO_VOICES = {
  rachel: 'pqHfZKP75CvOlQylNhV4',  // Rachel - friendly, warm
  adam: 'pNInz6obpgDQGcFmaJgB',     // Adam - clear, professional male
  aria: '9BWtsMINqrJLrRacOk9x',     // Aria - expressive female
  josh: 'TxGEqnHWrfWFTfGW9XjX',     // Josh - deep, confident male
} as const;

// Check if ElevenLabs is available (API key in env)
const getElevenLabsApiKey = (): string | null => {
  const apiKey = import.meta.env.VITE_ELEVENLABS_DEMO_API_KEY;
  console.log('[DemoTTS] API key available:', !!apiKey);
  return apiKey || null;
};

// State tracking
let isSpeakingFlag = false;
let currentAudio: HTMLAudioElement | null = null;

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
    
    // Try immediate
    browserVoices = synth.getVoices();
    if (browserVoices.length > 0) {
      browserVoicesLoaded = true;
      console.log('[DemoTTS] Voices loaded immediately:', browserVoices.length);
      resolve(browserVoices);
      return;
    }

    // Wait for voiceschanged event
    const onVoicesChanged = () => {
      browserVoices = synth.getVoices();
      browserVoicesLoaded = true;
      console.log('[DemoTTS] Voices loaded via event:', browserVoices.length);
      synth.removeEventListener('voiceschanged', onVoicesChanged);
      resolve(browserVoices);
    };

    synth.addEventListener('voiceschanged', onVoicesChanged);

    // Timeout fallback
    setTimeout(() => {
      if (!browserVoicesLoaded) {
        browserVoices = synth.getVoices();
        browserVoicesLoaded = true;
        console.log('[DemoTTS] Voices loaded via timeout:', browserVoices.length);
        resolve(browserVoices);
      }
    }, 1000);
  });
};

// Initialize voices on module load
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadBrowserVoices();
}

/**
 * Speak text using ElevenLabs or browser TTS
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
    console.log('[DemoTTS] Empty text, skipping');
    options?.onEnd?.();
    return;
  }

  console.log('[DemoTTS] Speaking:', text.substring(0, 50) + '...');

  const voiceId = options?.voice ? DEMO_VOICES[options.voice] : DEFAULT_VOICE_ID;
  const apiKey = getElevenLabsApiKey();

  // Set speaking state
  isSpeakingFlag = true;
  options?.onStart?.();

  // Dispatch start event
  window.dispatchEvent(new CustomEvent('demo-tts-started'));

  try {
    if (apiKey) {
      console.log('[DemoTTS] Using ElevenLabs');
      await speakWithElevenLabs(text, voiceId, apiKey);
    } else {
      console.log('[DemoTTS] Using browser TTS (no API key)');
      await speakWithBrowser(text);
    }
    console.log('[DemoTTS] Speech completed successfully');
  } catch (error) {
    console.error('[DemoTTS] Error:', error);
    // Try browser fallback if ElevenLabs fails
    if (apiKey) {
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
 * Speak using ElevenLabs API (streaming)
 */
const speakWithElevenLabs = async (
  text: string,
  voiceId: string,
  apiKey: string
): Promise<void> => {
  console.log('[DemoTTS] ElevenLabs request starting...');
  
  const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.2,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DemoTTS] ElevenLabs API error:', response.status, errorText);
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  console.log('[DemoTTS] ElevenLabs response received, playing audio...');
  
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    
    audio.onended = () => {
      console.log('[DemoTTS] ElevenLabs audio playback ended');
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    
    audio.onerror = (error) => {
      console.error('[DemoTTS] Audio playback error:', error);
      URL.revokeObjectURL(audioUrl);
      reject(error);
    };

    audio.volume = 0.9;
    audio.play()
      .then(() => console.log('[DemoTTS] Audio playback started'))
      .catch((e) => {
        console.error('[DemoTTS] Audio play() failed:', e);
        reject(e);
      });
  });
};

/**
 * Optimized browser TTS fallback
 */
const speakWithBrowser = async (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.error('[DemoTTS] Speech synthesis not supported');
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const synth = window.speechSynthesis;

    // Cancel any ongoing speech
    synth.cancel();

    // Wait for voices to load
    loadBrowserVoices().then((voices) => {
      console.log('[DemoTTS] Browser voices available:', voices.length);

      const utterance = new SpeechSynthesisUtterance(text);

    // Optimized settings
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    utterance.lang = 'en-US';

    // Priority order for natural-sounding voices
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

    // Fallback to any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en')) || null;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('[DemoTTS] Using browser voice:', selectedVoice.name);
    } else {
      console.log('[DemoTTS] No preferred voice found, using default');
    }

    utterance.onstart = () => {
      console.log('[DemoTTS] Browser TTS started');
    };

    utterance.onend = () => {
      console.log('[DemoTTS] Browser TTS ended');
      resolve();
    };

    utterance.onerror = (event) => {
      console.error('[DemoTTS] Browser TTS error:', event);
      reject(event);
    };

    synth.speak(utterance);
    
    // Chrome bug workaround - sometimes speech doesn't start
    setTimeout(() => {
      if (synth.speaking) {
        console.log('[DemoTTS] Browser TTS is speaking');
      } else {
        console.log('[DemoTTS] Browser TTS may have failed silently');
      }
    }, 100);
    }).catch(reject);
  });
};

/**
 * Stop any ongoing speech
 */
export const demoStopSpeaking = (): void => {
  console.log('[DemoTTS] Stopping speech');
  
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

/**
 * Check if currently speaking
 */
export const demoIsSpeaking = (): boolean => isSpeakingFlag;

/**
 * Check if ElevenLabs is available for demo
 */
export const isElevenLabsAvailable = (): boolean => !!getElevenLabsApiKey();
