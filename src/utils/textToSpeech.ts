
import { toast } from 'sonner';
import { playEndOfSpeechCueIfEnabled } from '@/utils/audioCues';
import { supabase } from '@/integrations/supabase/client';

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice

// MiniMax API configuration - Updated with correct endpoint
const MINIMAX_API_URL = 'https://api.minimax.io/v1/t2a_v2';

// Voice settings for ElevenLabs - Optimized for speed and clarity
const VOICE_SETTINGS = {
  stability: 0.7,
  similarity_boost: 0.9,
  style: 0.2,
  use_speaker_boost: true,
  rate: 1.3 // Faster speech rate for improved UX
};

// Available voices - exported for use in other components
export const AVAILABLE_VOICES = {
  'Adam': 'pNInz6obpgDQGcFmaJgB',
  'Antoni': 'ErXwobaYiN019PkySvjV',
  'Arnold': 'VR6AewLTigWG4xSOukaG',
  'Aria': '9BWtsMINqrJLrRacOk9x',
  'Bella': 'XB0fDUnXU5powFXDhCwa', // Charlotte voice ID (female)
  'Domi': 'AZnzlk1XvdvUeBnXmlld',
  'Elli': 'MF3mGyEYCl7XYWbV9V6O',
  'Josh': 'TxGEqnHWrfWFTfGW9XjX',
  'Laura': 'FGY2WhTYpPnrIDTdsKH5',
  'Rachel': 'pqHfZKP75CvOlQylNhV4',
  'Sam': 'yoZ06aMxZJJ28mfd3POQ',
  'Sarah': 'EXAVITQu4vr4xnSDxMaL'
};

// MiniMax voices with proper parameters - Updated with commonly supported voice types
export const MINIMAX_VOICES = {
  'male-qn-qingse': 'Male Voice (清晰)',
  'female-shaonv': 'Female Voice (少女)',
  'male-qn-jingying': 'Male Professional',
  'female-qn-qingse': 'Female Professional',
  'broadcaster_male': 'Broadcaster Male',
  'broadcaster_female': 'Broadcaster Female'
};

// Google Cloud TTS voices
export const GOOGLE_VOICES = {
  'en-US-Neural2-A': 'Male (Neural)',
  'en-US-Neural2-C': 'Female (Neural)',
  'en-US-Neural2-D': 'Male (Neural 2)',
  'en-US-Neural2-F': 'Female (Neural 2)',
  'en-US-Standard-A': 'Male (Standard)',
  'en-US-Standard-B': 'Male (Standard 2)',
  'en-US-Standard-C': 'Female (Standard)',
} as const;

// Voice options for UI components
export const VOICE_OPTIONS = {
  'adam': 'Adam',
  'antoni': 'Antoni',
  'arnold': 'Arnold',
  'aria': 'Aria',
  'bella': 'Bella',
  'domi': 'Domi',
  'elli': 'Elli',
  'josh': 'Josh',
  'laura': 'Laura',
  'rachel': 'Rachel',
  'sam': 'Sam',
  'sarah': 'Sarah'
} as const;

export type VoiceOptionKey = keyof typeof VOICE_OPTIONS;

// TTS Service type
export type TTSService = 'elevenlabs' | 'minimax' | 'google';

// API keys are now managed server-side only for security.
// These stub functions return null to prevent localStorage usage.

/**
 * Returns null - API keys are managed server-side via Supabase Edge Functions.
 */
export const getElevenLabsApiKey = (): string | null => {
  // API keys are managed server-side only
  return null;
};

/**
 * Returns null - API keys are managed server-side via Supabase Edge Functions.
 */
export const getMiniMaxApiKey = (): string | null => {
  // API keys are managed server-side only
  return null;
};

// Service preference
export const getSelectedTTSService = (): TTSService => {
  const stored = localStorage.getItem('selected_tts_service');
  if (stored && ['elevenlabs', 'minimax', 'google'].includes(stored)) {
    return stored as TTSService;
  }
  return 'google';
};

export const setSelectedTTSService = (service: TTSService): void => {
  localStorage.setItem('selected_tts_service', service);
};

export const getSelectedVoice = (): VoiceOptionKey => {
  const stored = localStorage.getItem('selected_voice');
  if (stored && stored in VOICE_OPTIONS) {
    return stored as VoiceOptionKey;
  }
  return 'adam';
};

export const setSelectedVoice = (voice: VoiceOptionKey): void => {
  localStorage.setItem('selected_voice', voice);
};

export const getSelectedMiniMaxVoice = (): keyof typeof MINIMAX_VOICES => {
  const stored = localStorage.getItem('selected_minimax_voice');
  if (stored && stored in MINIMAX_VOICES) {
    return stored as keyof typeof MINIMAX_VOICES;
  }
  return 'male-qn-qingse';
};

export const setSelectedMiniMaxVoice = (voice: keyof typeof MINIMAX_VOICES): void => {
  localStorage.setItem('selected_minimax_voice', voice);
};

export const getSelectedGoogleVoice = (): keyof typeof GOOGLE_VOICES => {
  const stored = localStorage.getItem('selected_google_voice');
  if (stored && stored in GOOGLE_VOICES) {
    return stored as keyof typeof GOOGLE_VOICES;
  }
  return 'en-US-Neural2-F';
};

export const setSelectedGoogleVoice = (voice: keyof typeof GOOGLE_VOICES): void => {
  localStorage.setItem('selected_google_voice', voice);
};

// Improved TTS cache for speech recognition filtering
const initializeTTSCache = () => {
  if (!(window as any).__recent_tts_texts) {
    (window as any).__recent_tts_texts = [];
  }
};

const addToTTSCache = (text: string) => {
  initializeTTSCache();
  const cache = (window as any).__recent_tts_texts as string[];

  // Add to cache and keep only last 3 items
  cache.unshift(text);
  if (cache.length > 3) {
    cache.splice(3);
  }

  // Clear cache after 10 seconds (reduced for faster cleanup)
  setTimeout(() => {
    const index = cache.indexOf(text);
    if (index > -1) {
      cache.splice(index, 1);
    }
  }, 10000);
};

// Clear speech history - for compatibility
export const clearSpeechHistory = (): void => {
  if ((window as any).__recent_tts_texts) {
    (window as any).__recent_tts_texts = [];
  }
};

// Speech options interface
interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
}

// Main speak function with service selection
export const speak = async (text: string, optionsOrVoice?: string | SpeechOptions): Promise<void> => {
  if (!text || text.trim().length === 0) {
    console.log('🔊 TTS: Empty text provided, skipping');
    return;
  }

  console.log('🔊 TTS: Starting speech:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

  // Add to TTS cache for speech recognition filtering
  addToTTSCache(text);

  // Set global flag and dispatch event BEFORE starting speech
  (window as any).__tts_is_speaking = true;
  window.dispatchEvent(new CustomEvent('tts-started'));
  console.log('🔊 TTS: Set speaking flag and dispatched tts-started event');

  try {
    const selectedService = getSelectedTTSService();
    const elevenLabsKey = getElevenLabsApiKey();
    const miniMaxKey = getMiniMaxApiKey();
    const speechLanguage = localStorage.getItem('speech_language') || 'en-US';

    console.log('🔧 TTS config:', {
      selectedService,
      hasElevenLabsKey: !!elevenLabsKey,
      hasMiniMaxKey: !!miniMaxKey,
      speechLanguage
    });

    // Determine effective service (fallback to ElevenLabs if MiniMax not configured)
    let effectiveService: TTSService = selectedService as TTSService;
    if (effectiveService === 'minimax' && !miniMaxKey && elevenLabsKey) {
      console.warn('⚠️ MiniMax selected but no API key. Falling back to ElevenLabs for this session.');
      setSelectedTTSService('elevenlabs');
      effectiveService = 'elevenlabs';
    }

    // Determine voice and options
    let voice: string | undefined;
    let options: SpeechOptions | undefined;

    if (typeof optionsOrVoice === 'string') {
      voice = optionsOrVoice;
    } else if (typeof optionsOrVoice === 'object') {
      options = optionsOrVoice;
    }

    // Try primary service first, then fallback to secondary or browser
    let primaryFailed = false;

    // Helper to dispatch completion event
    const dispatchCompleted = () => {
      try { playEndOfSpeechCueIfEnabled(); } catch (e) { console.warn('Audio cue failed:', (e as any)?.message || e); }
      (window as any).__tts_is_speaking = false;
      (window as any).__last_tts_end_time = Date.now();
      window.dispatchEvent(new CustomEvent('tts-completed'));
      console.log('🔊 TTS: Speech completed, dispatched tts-completed event');
    };

    if (effectiveService === 'elevenlabs' && elevenLabsKey) {
      try {
        console.log('🎙️ TTS: Using ElevenLabs TTS (effective)');
        await speakWithElevenLabs(text, voice);
        dispatchCompleted();
        return; // Success, exit early
      } catch (error: any) {
        console.warn('⚠️ TTS: ElevenLabs failed, trying fallback:', error?.message || error);
        primaryFailed = true;
      }
    } else if (effectiveService === 'google') {
      try {
        console.log('🎙️ TTS: Using Google Cloud TTS (effective)');
        await speakWithGoogle(text, voice);
        dispatchCompleted();
        return; // Success, exit early
      } catch (error: any) {
        console.warn('⚠️ TTS: Google Cloud TTS failed, trying fallback:', error?.message || error);
        primaryFailed = true;
      }
    } else if (effectiveService === 'minimax' && miniMaxKey) {
      try {
        console.log('🎙️ TTS: Using MiniMax TTS (effective)');
        await speakWithMiniMax(text);
        dispatchCompleted();
        return; // Success, exit early
      } catch (error: any) {
        console.warn('⚠️ TTS: MiniMax failed, trying fallback:', error?.message || error);
        primaryFailed = true;
      }
    }

    // Try secondary service if primary failed or no key available
    if (primaryFailed || !(effectiveService === 'elevenlabs' ? elevenLabsKey : miniMaxKey)) {
      const fallbackService: TTSService = effectiveService === 'elevenlabs' ? 'minimax' : 'elevenlabs';
      const fallbackKey = fallbackService === 'elevenlabs' ? elevenLabsKey : miniMaxKey;

      if (fallbackKey) {
        try {
          console.log(`🔄 TTS: Trying fallback service: ${fallbackService}`);
          if (fallbackService === 'elevenlabs') {
            await speakWithElevenLabs(text, voice);
          } else {
            await speakWithMiniMax(text);
          }
          dispatchCompleted();
          return; // Success with fallback
        } catch (fallbackError: any) {
          console.warn('⚠️ TTS: Fallback service also failed:', fallbackError?.message || fallbackError);
        }
      }
    }

    // Final fallback to browser TTS
    console.log('🔄 TTS: All API services failed or unavailable, falling back to browser TTS');
    try {
      const speechRate = parseFloat(localStorage.getItem('speech_rate') || '0.9');
      const speechVolume = parseFloat(localStorage.getItem('speech_volume') || '0.8');
      await speakWithBrowser(text, { rate: speechRate, pitch: 1, volume: speechVolume });
      dispatchCompleted();
    } catch (browserError) {
      console.error('🚨 TTS: All services failed including browser TTS:', browserError);
      throw new Error('All TTS services failed. Please check your API keys or browser compatibility.');
    }
  } catch (error) {
    console.error('🚨 TTS: Error during speech:', error);
    toast.error('TTS failed. Please check your API key and try again.');
    // Also clear TTS flag on error so recognition can restart
    try { playEndOfSpeechCueIfEnabled(); } catch (e) { console.warn('Audio cue failed:', (e as any)?.message || e); }
    (window as any).__tts_is_speaking = false;
    (window as any).__last_tts_end_time = Date.now();
    window.dispatchEvent(new CustomEvent('tts-completed'));
    console.log('🔊 TTS: Speech error, dispatched tts-completed event');
  }
};

const speakWithElevenLabs = async (text: string, voice?: string): Promise<void> => {
  const selectedVoice = voice || getSelectedVoice();
  // Capitalize the voice name for lookup in AVAILABLE_VOICES
  const capitalizedVoice = selectedVoice.charAt(0).toUpperCase() + selectedVoice.slice(1);
  const voiceId = AVAILABLE_VOICES[capitalizedVoice as keyof typeof AVAILABLE_VOICES] || DEFAULT_VOICE_ID;

  console.log('🎙️ TTS: Using ElevenLabs voice:', selectedVoice, 'ID:', voiceId);

  // Choose model based on language: English -> eleven_turbo_v2, otherwise multilingual
  const speechLanguage = localStorage.getItem('speech_language') || 'en-US';
  const modelId = speechLanguage.startsWith('en') ? 'eleven_turbo_v2' : 'eleven_multilingual_v2';
  console.log('🎛️ TTS: ElevenLabs model selected:', modelId, 'lang:', speechLanguage);
  console.log('🔒 TTS: Using secure server-side API call via Supabase Edge Function');

  try {
    // Call the secure Supabase edge function instead of exposing API keys
    const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
      body: {
        text: text,
        voiceId: voiceId,
        modelId: modelId
      }
    });

    if (error) {
      console.error('🚨 TTS: Edge function error:', error);

      // Check for specific error messages that indicate fallback needed
      if (error.message?.includes('quota') || error.message?.includes('credits')) {
        toast.error(`ElevenLabs quota exceeded. Falling back to browser TTS.`);
        throw new Error('ElevenLabs quota exceeded');
      } else if (error.message?.includes('API key')) {
        toast.error('ElevenLabs not configured. Please contact support or use browser TTS.');
        throw new Error('ElevenLabs API key not configured');
      } else if (error.message?.includes('rate limit')) {
        toast.error('ElevenLabs rate limit exceeded. Falling back to browser TTS.');
        throw new Error('ElevenLabs rate limit exceeded');
      } else {
        toast.error(`Voice service error. Falling back to browser TTS.`);
        throw new Error(`ElevenLabs error: ${error.message}`);
      }
    }

    if (!data || !data.audioContent) {
      console.error('🚨 TTS: No audio content returned from edge function');
      toast.error('No audio received from voice service');
      throw new Error('No audio content received');
    }

    // Convert base64 audio back to blob
    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        console.log('🔊 TTS: ElevenLabs audio playback completed');
        resolve();
      };

      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        console.error('🚨 TTS: Audio playback error:', error);
        reject(error);
      };

      audio.play().catch(reject);
    });
  } catch (err) {
    console.error('🚨 TTS: Unexpected error in speakWithElevenLabs:', err);
    throw err;
  }
};

const speakWithGoogle = async (text: string, voice?: string): Promise<void> => {
  const selectedVoice = voice || getSelectedGoogleVoice();
  const speechLanguage = localStorage.getItem('speech_language') || 'en-US';

  console.log('🎙️ TTS: Using Google Cloud TTS voice:', selectedVoice);

  try {
    const { data, error } = await supabase.functions.invoke('google-cloud-tts', {
      body: {
        text,
        voiceName: selectedVoice,
        languageCode: speechLanguage
      }
    });

    if (error) {
      console.error('🚨 TTS: Google Edge function error:', error);
      throw new Error(`Google TTS error: ${error.message}`);
    }

    if (!data || !data.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      audio.play().catch(reject);
    });
  } catch (err) {
    console.error('🚨 TTS: Unexpected error in speakWithGoogle:', err);
    throw err;
  }
};

const speakWithMiniMax = async (text: string): Promise<void> => {
  try {
    const selectedVoice = getSelectedMiniMaxVoice();
    console.log('🎙️ TTS: Using MiniMax voice via Edge Function:', selectedVoice);

    const { data, error } = await supabase.functions.invoke('minimax-tts', {
      body: {
        text,
        voice_id: selectedVoice,
        speed: 1.0,
        vol: 1.0,
        pitch: 0
      },
    });

    if (error) {
      console.error('🚨 MiniMax Edge Function error:', error);
      throw error;
    }

    if (!data.audioContent) {
      console.error('🚨 MiniMax Edge Function returned no audioContent');
      throw new Error('No audio content received from MiniMax');
    }

    // Play the audio from base64 string
    const audioBlob = new Blob(
      [Uint8Array.from(atob(data.audioContent), (c) => c.charCodeAt(0))],
      { type: 'audio/mpeg' }
    );
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        console.log('🔊 TTS: MiniMax audio playback completed');
        resolve();
      };

      audio.onerror = (err) => {
        URL.revokeObjectURL(audioUrl);
        console.error('🚨 TTS: Audio playback error:', err);
        reject(err);
      };

      audio.play().catch(reject);
    });
  } catch (err) {
    console.error('🚨 TTS: Unexpected error in speakWithMiniMax:', err);
    throw err;
  }
};

const speakWithBrowser = async (text: string, options?: SpeechOptions): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Configure utterance with options
    utterance.rate = options?.rate || 0.9;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = options?.volume || 0.8;

    // Enforce language (default to English US)
    const preferredLang = localStorage.getItem('speech_language') || 'en-US';
    utterance.lang = preferredLang;

    // Try to use an English/browser voice matching the language
    const voices = window.speechSynthesis.getVoices();
    const baseLang = preferredLang.split('-')[0];
    const preferredVoice = voices.find(v => v.lang === preferredLang)
      || voices.find(v => v.lang.startsWith(baseLang))
      || voices.find(v => (v.name.includes('Google') || v.name.includes('Microsoft')) && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log('🎙️ TTS: Using browser voice:', preferredVoice.name, 'lang:', preferredVoice.lang);
    } else {
      console.log('🎙️ TTS: No preferred voice found, using default with lang:', preferredLang);
    }

    utterance.onend = () => {
      console.log('🔊 TTS: Browser speech completed');
      if (options?.onEnd) {
        options.onEnd();
      }
      resolve();
    };

    utterance.onerror = (error) => {
      console.error('🚨 TTS: Browser speech error:', error);
      reject(error);
    };

    window.speechSynthesis.speak(utterance);
  });
};

// Test function for voice settings
export const testVoice = async (voice: string): Promise<void> => {
  const testText = `Hello! This is a test of the ${voice} voice. How does it sound?`;
  await speak(testText, voice);
};

// Stop any ongoing speech - exported for compatibility
export const stopSpeaking = (): void => {
  console.log('🛑 TTS: Stopping all speech');

  // Stop browser TTS
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // Clear TTS flag and track end time
  (window as any).__tts_is_speaking = false;
  (window as any).__last_tts_end_time = Date.now();

  // Dispatch completion event
  window.dispatchEvent(new CustomEvent('tts-completed'));
};

// Alias for compatibility
export const stopCurrentSpeech = stopSpeaking;

// Check if TTS is currently speaking
export const isSpeaking = (): boolean => {
  return !!(window as any).__tts_is_speaking;
};

// API Key validation functions
export const validateElevenLabsApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'API key is required' };
  }

  // ElevenLabs API keys can have various formats, including some that start with "sk-"
  if (apiKey.length < 10) {
    return { valid: false, error: 'API key appears to be too short' };
  }

  try {
    console.log('🔍 Validating ElevenLabs API key...');
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (response.ok) {
      console.log('✅ ElevenLabs API key is valid');
      return { valid: true };
    } else {
      const errorData = await response.json();
      console.error('❌ ElevenLabs API key validation failed:', errorData);
      return {
        valid: false,
        error: errorData.detail?.message || `HTTP ${response.status}`
      };
    }
  } catch (error) {
    console.error('❌ ElevenLabs API key validation error:', error);
    return {
      valid: false,
      error: 'Network error during validation'
    };
  }
};

export const validateMiniMaxApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'JWT token is required' };
  }

  try {
    // Validate JWT structure
    const jwtParts = apiKey.split('.');
    if (jwtParts.length !== 3) {
      return { valid: false, error: 'Invalid JWT format' };
    }

    // Try to decode payload
    const payload = JSON.parse(atob(jwtParts[1]));
    if (!payload.GroupID) {
      return { valid: false, error: 'JWT missing GroupID' };
    }

    console.log('✅ MiniMax JWT token format is valid');
    return { valid: true };
  } catch (error) {
    console.error('❌ MiniMax JWT validation error:', error);
    return {
      valid: false,
      error: 'Invalid JWT token format'
    };
  }
};
