import { toast } from 'sonner';

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice

// Voice settings for ElevenLabs
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.8,
  style: 0.0,
  use_speaker_boost: true
};

// Available voices - exported for use in other components
export const AVAILABLE_VOICES = {
  'Adam': 'pNInz6obpgDQGcFmaJgB',
  'Antoni': 'ErXwobaYiN019PkySvjV',
  'Arnold': 'VR6AewLTigWG4xSOukaG',
  'Bella': 'EXAVITQu4vr4xnSDxMaL',
  'Domi': 'AZnzlk1XvdvUeBnXmlld',
  'Elli': 'MF3mGyEYCl7XYWbV9V6O',
  'Josh': 'TxGEqnHWrfWFTfGW9XjX',
  'Rachel': 'pqHfZKP75CvOlQylNhV4',
  'Sam': 'yoZ06aMxZJJ28mfd3POQ'
};

// Voice options for UI components
export const VOICE_OPTIONS = {
  'adam': 'Adam',
  'antoni': 'Antoni', 
  'arnold': 'Arnold',
  'bella': 'Bella',
  'domi': 'Domi',
  'elli': 'Elli',
  'josh': 'Josh',
  'rachel': 'Rachel',
  'sam': 'Sam',
  'aria': 'Aria' // Browser voice fallback
} as const;

export type VoiceOptionKey = keyof typeof VOICE_OPTIONS;

export const getElevenLabsApiKey = (): string | null => {
  return localStorage.getItem('elevenlabs_api_key');
};

export const setElevenLabsApiKey = (apiKey: string): void => {
  if (apiKey.trim()) {
    localStorage.setItem('elevenlabs_api_key', apiKey.trim());
    toast.success('ElevenLabs API key saved successfully');
  } else {
    localStorage.removeItem('elevenlabs_api_key');
    toast.success('ElevenLabs API key removed');
  }
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

// Main speak function with improved singleton coordination
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
    const elevenLabsKey = getElevenLabsApiKey();
    
    // Determine voice and options
    let voice: string | undefined;
    let options: SpeechOptions | undefined;
    
    if (typeof optionsOrVoice === 'string') {
      voice = optionsOrVoice;
    } else if (typeof optionsOrVoice === 'object') {
      options = optionsOrVoice;
    }
    
    if (elevenLabsKey) {
      console.log('🎙️ TTS: Using ElevenLabs TTS');
      await speakWithElevenLabs(text, voice);
    } else {
      console.log('🎙️ TTS: Using browser TTS (no ElevenLabs key)');
      await speakWithBrowser(text, options);
    }
  } catch (error) {
    console.error('🚨 TTS: Error during speech:', error);
    // Fallback to browser TTS
    try {
      await speakWithBrowser(text, typeof optionsOrVoice === 'object' ? optionsOrVoice : undefined);
    } catch (fallbackError) {
      console.error('🚨 TTS: Fallback TTS also failed:', fallbackError);
    }
  } finally {
    // Clear TTS flag and dispatch completion event after a brief delay
    setTimeout(() => {
      (window as any).__tts_is_speaking = false;
      window.dispatchEvent(new CustomEvent('tts-completed'));
      console.log('🔊 TTS: Speech completed, dispatched tts-completed event');
    }, 1000); // Increased delay to ensure audio is fully complete
  }
};

const speakWithElevenLabs = async (text: string, voice?: string): Promise<void> => {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error('ElevenLabs API key not found');
  }

  const selectedVoice = voice || getSelectedVoice();
  const voiceId = AVAILABLE_VOICES[selectedVoice as keyof typeof AVAILABLE_VOICES] || DEFAULT_VOICE_ID;

  console.log('🎙️ TTS: Using ElevenLabs voice:', selectedVoice, 'ID:', voiceId);

  const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: VOICE_SETTINGS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🚨 TTS: ElevenLabs API error:', response.status, errorText);
    
    if (response.status === 401) {
      toast.error('Invalid ElevenLabs API key. Please check your settings.');
      throw new Error('Invalid API key');
    } else if (response.status === 429) {
      toast.error('ElevenLabs API rate limit exceeded. Using browser TTS instead.');
      throw new Error('Rate limit exceeded');
    } else {
      toast.error('ElevenLabs TTS failed. Using browser TTS instead.');
      throw new Error(`API error: ${response.status}`);
    }
  }

  const audioBlob = await response.blob();
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

    // Try to use a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.lang.startsWith('en')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log('🎙️ TTS: Using browser voice:', preferredVoice.name);
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
  
  // Clear TTS flag
  (window as any).__tts_is_speaking = false;
  
  // Dispatch completion event
  window.dispatchEvent(new CustomEvent('tts-completed'));
};

// Alias for compatibility
export const stopCurrentSpeech = stopSpeaking;

// Check if TTS is currently speaking
export const isSpeaking = (): boolean => {
  return !!(window as any).__tts_is_speaking;
};
