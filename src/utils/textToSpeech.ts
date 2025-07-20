
import { supabase } from "@/integrations/supabase/client";

// Enhanced TTS system with ElevenLabs integration
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;
let isInitialized = false;
let recentlySpokeText: Set<string> = new Set();
let audioCache: Map<string, string> = new Map();

// Voice configuration
export const VOICE_OPTIONS = {
  aria: 'Aria - Natural and warm',
  alloy: 'Alloy - Balanced and clear', 
  echo: 'Echo - Expressive and dynamic',
  fable: 'Fable - Storytelling voice',
  onyx: 'Onyx - Deep and authoritative',
  nova: 'Nova - Bright and energetic',
  shimmer: 'Shimmer - Gentle and soothing'
};

// Voice settings management
export const getElevenLabsApiKey = (): string | null => {
  return localStorage.getItem('elevenlabs_api_key');
};

export const setElevenLabsApiKey = (apiKey: string) => {
  localStorage.setItem('elevenlabs_api_key', apiKey);
};

export const getSelectedVoice = (): keyof typeof VOICE_OPTIONS => {
  return (localStorage.getItem('selected_voice') as keyof typeof VOICE_OPTIONS) || 'aria';
};

export const setSelectedVoice = (voice: keyof typeof VOICE_OPTIONS) => {
  localStorage.setItem('selected_voice', voice);
};

export const clearSpeechHistory = () => {
  recentlySpokeText.clear();
};

export const stopCurrentSpeech = () => {
  // Stop browser TTS
  speechSynthesis.cancel();
  
  // Stop ElevenLabs audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  
  (window as any).__tts_is_speaking = false;
  currentUtterance = null;
  
  // Dispatch completion event
  window.dispatchEvent(new CustomEvent('tts-completed', { detail: { stopped: true } }));
};

// Initialize speech synthesis with better browser compatibility
const initializeTTS = () => {
  if (isInitialized) return;
  
  // Load voices if not already loaded
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener('voiceschanged', () => {
      console.log('🔊 TTS: Voices loaded');
    });
  }
  
  isInitialized = true;
};

// Check if text was recently spoken to prevent loops
const wasRecentlySpoken = (text: string): boolean => {
  const key = text.toLowerCase().trim().substring(0, 50);
  if (recentlySpokeText.has(key)) {
    console.log('🔄 TTS: Text recently spoken, skipping to prevent loop');
    return true;
  }
  
  recentlySpokeText.add(key);
  // Clear after 5 seconds
  setTimeout(() => recentlySpokeText.delete(key), 5000);
  return false;
};

// ElevenLabs voice ID mapping
const getElevenLabsVoiceId = (voice: keyof typeof VOICE_OPTIONS): string => {
  const voiceMap: Record<keyof typeof VOICE_OPTIONS, string> = {
    aria: '9BWtsMINqrJLrRacOk9x',
    alloy: 'TX3LPaxmHKxFdv7VOQHJ', 
    echo: 'IKne3meq5aSn9XLyUdCD',
    fable: 'onwK4e9ZLuTAKqWW03F9',
    onyx: 'bIHbv24MWmeRgasZH58o',
    nova: 'pFZP5JQG7iQjIQuC4Bku',
    shimmer: 'cgSgspJ2msm6clMCkdW9'
  };
  return voiceMap[voice] || voiceMap.aria;
};

// Use ElevenLabs TTS
const speakWithElevenLabs = async (text: string, options: {
  voice?: keyof typeof VOICE_OPTIONS;
  onStart?: () => void;
  onEnd?: () => void;
}): Promise<boolean> => {
  try {
    const selectedVoice = options.voice || getSelectedVoice();
    const cacheKey = `${text}_${selectedVoice}`;
    
    console.log('🎙️ TTS: Using ElevenLabs for:', text.substring(0, 50) + '...');
    
    let audioContent: string;
    
    // Check cache first
    if (audioCache.has(cacheKey)) {
      audioContent = audioCache.get(cacheKey)!;
      console.log('📦 TTS: Using cached audio');
    } else {
      // Call ElevenLabs edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text: text,
          voiceId: getElevenLabsVoiceId(selectedVoice),
          modelId: 'eleven_multilingual_v2'
        }
      });

      if (error) {
        console.error('🚨 TTS: ElevenLabs error:', error);
        return false;
      }

      if (!data?.audioContent) {
        console.error('🚨 TTS: No audio content received');
        return false;
      }

      audioContent = data.audioContent;
      
      // Cache the audio (limit cache size)
      if (audioCache.size > 50) {
        const firstKey = audioCache.keys().next().value;
        audioCache.delete(firstKey);
      }
      audioCache.set(cacheKey, audioContent);
    }

    // Create audio element and play
    const audio = new Audio(`data:audio/mpeg;base64,${audioContent}`);
    currentAudio = audio;
    
    audio.onloadstart = () => {
      console.log('🔊 TTS: ElevenLabs audio loading');
      (window as any).__tts_is_speaking = true;
      options.onStart?.();
    };
    
    audio.onplay = () => {
      console.log('🔊 TTS: ElevenLabs audio started');
    };
    
    audio.onended = () => {
      console.log('🔊 TTS: ElevenLabs audio completed');
      (window as any).__tts_is_speaking = false;
      currentAudio = null;
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tts-completed', { detail: { text } }));
        options.onEnd?.();
      }, 100);
    };
    
    audio.onerror = (event) => {
      console.error('🚨 TTS: ElevenLabs audio error:', event);
      (window as any).__tts_is_speaking = false;
      currentAudio = null;
      
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tts-completed', { detail: { text, error: 'Audio playback failed' } }));
      }, 100);
    };

    await audio.play();
    return true;
    
  } catch (error) {
    console.error('🚨 TTS: ElevenLabs failed:', error);
    return false;
  }
};

// Fallback to browser TTS
const speakWithBrowser = (text: string, options: { 
  rate?: number; 
  pitch?: number; 
  volume?: number; 
  voice?: SpeechSynthesisVoice;
  onStart?: () => void;
  onEnd?: () => void;
}) => {
  console.log('🔊 TTS: Using browser TTS fallback');
  
  // Initialize TTS if needed
  initializeTTS();
  
  // Cancel any current speech
  if (currentUtterance) {
    speechSynthesis.cancel();
    currentUtterance = null;
  }
  
  // Set global TTS state
  (window as any).__tts_is_speaking = true;
  
  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;
  
  // Configure utterance
  utterance.rate = options.rate || 0.9;
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 0.8;
  
  // Select voice (prefer natural sounding voices)
  const voices = speechSynthesis.getVoices();
  if (options.voice) {
    utterance.voice = options.voice;
  } else {
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en') && 
      (voice.name.includes('Natural') || voice.name.includes('Enhanced') || voice.localService)
    ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  }
  
  utterance.onstart = () => {
    console.log('🔊 TTS: Browser speech started');
    (window as any).__tts_is_speaking = true;
    options.onStart?.();
  };
  
  utterance.onend = () => {
    console.log('🔊 TTS: Browser speech completed');
    (window as any).__tts_is_speaking = false;
    currentUtterance = null;
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('tts-completed', { detail: { text } }));
      options.onEnd?.();
    }, 100);
  };
  
  utterance.onerror = (event) => {
    console.error('🚨 TTS: Browser speech error:', event.error);
    (window as any).__tts_is_speaking = false;
    currentUtterance = null;
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('tts-completed', { detail: { text, error: event.error } }));
    }, 100);
  };
  
  // Start speaking
  try {
    speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('🚨 TTS: Failed to start browser speech:', error);
    (window as any).__tts_is_speaking = false;
    currentUtterance = null;
  }
};

export const speak = async (text: string, options: { 
  rate?: number; 
  pitch?: number; 
  volume?: number; 
  voice?: SpeechSynthesisVoice;
  onStart?: () => void;
  onEnd?: () => void;
} = {}) => {
  if (!text || text.trim().length === 0) return;
  
  // Prevent speaking loops
  if (wasRecentlySpoken(text)) {
    return;
  }
  
  console.log('🔊 TTS: Starting speech:', text.substring(0, 50) + '...');
  
  // Stop any current speech
  stopCurrentSpeech();
  
  // Dispatch TTS started event
  window.dispatchEvent(new CustomEvent('tts-started', { detail: { text } }));
  
  // Try ElevenLabs first if API key is available
  const elevenLabsApiKey = getElevenLabsApiKey();
  if (elevenLabsApiKey && elevenLabsApiKey.trim()) {
    console.log('🎙️ TTS: Attempting ElevenLabs TTS');
    const success = await speakWithElevenLabs(text, {
      voice: getSelectedVoice(),
      onStart: options.onStart,
      onEnd: options.onEnd
    });
    
    if (success) {
      return; // Successfully used ElevenLabs
    }
    
    console.log('⚠️ TTS: ElevenLabs failed, falling back to browser TTS');
  } else {
    console.log('🔍 TTS: No ElevenLabs API key, using browser TTS');
  }
  
  // Fallback to browser TTS
  speakWithBrowser(text, options);
};

export const stopSpeaking = () => {
  stopCurrentSpeech();
};

export const isSpeaking = () => {
  return (window as any).__tts_is_speaking || false;
};
