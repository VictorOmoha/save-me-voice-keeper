
// Enhanced TTS system with better event coordination
let currentUtterance: SpeechSynthesisUtterance | null = null;
let isInitialized = false;
let recentlySpokeText: Set<string> = new Set();

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
  speechSynthesis.cancel();
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

export const speak = (text: string, options: { 
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
  
  // Initialize TTS if needed
  initializeTTS();
  
  // Cancel any current speech
  if (currentUtterance) {
    speechSynthesis.cancel();
    currentUtterance = null;
  }
  
  // Set global TTS state
  (window as any).__tts_is_speaking = true;
  
  // Dispatch TTS started event
  window.dispatchEvent(new CustomEvent('tts-started', { detail: { text } }));
  
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
    // Try to find a good English voice
    const preferredVoice = voices.find(voice => 
      voice.lang.includes('en') && 
      (voice.name.includes('Natural') || voice.name.includes('Enhanced') || voice.localService)
    ) || voices.find(voice => voice.lang.includes('en')) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  }
  
  utterance.onstart = () => {
    console.log('🔊 TTS: Speech started');
    (window as any).__tts_is_speaking = true;
    options.onStart?.();
  };
  
  utterance.onend = () => {
    console.log('🔊 TTS: Speech completed');
    (window as any).__tts_is_speaking = false;
    currentUtterance = null;
    
    // Dispatch completion event after a brief delay to ensure state is updated
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('tts-completed', { detail: { text } }));
      options.onEnd?.();
    }, 100);
  };
  
  utterance.onerror = (event) => {
    console.error('🚨 TTS: Speech error:', event.error);
    (window as any).__tts_is_speaking = false;
    currentUtterance = null;
    
    // Still dispatch completion event on error
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('tts-completed', { detail: { text, error: event.error } }));
    }, 100);
  };
  
  // Start speaking
  try {
    speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('🚨 TTS: Failed to start speech:', error);
    (window as any).__tts_is_speaking = false;
    currentUtterance = null;
  }
};

export const stopSpeaking = () => {
  console.log('🔇 TTS: Stopping speech');
  speechSynthesis.cancel();
  (window as any).__tts_is_speaking = false;
  currentUtterance = null;
  
  // Dispatch completion event
  window.dispatchEvent(new CustomEvent('tts-completed', { detail: { stopped: true } }));
};

export const isSpeaking = () => {
  return (window as any).__tts_is_speaking || false;
};
