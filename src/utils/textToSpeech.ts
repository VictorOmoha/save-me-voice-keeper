
// Enhanced text-to-speech utility with ElevenLabs premium voices
let ELEVENLABS_API_KEY = localStorage.getItem('elevenlabs_api_key');

// Premium voice options
export const VOICE_OPTIONS = {
  'aria': '9BWtsMINqrJLrRacOk9x',
  'sarah': 'EXAVITQu4vr4xnSDxMaL',
  'brian': 'nPczCjzI2devNBz1zQrb',
  'charlotte': 'XB0fDUnXU5powFXDhCwa',
  'daniel': 'onwK4e9ZLuTAKqWW03F9'
};

let selectedVoice = localStorage.getItem('selected_voice') || 'aria';
const VOICE_ID = VOICE_OPTIONS[selectedVoice as keyof typeof VOICE_OPTIONS] || VOICE_OPTIONS.aria;

// Track recent speech to prevent feedback loops
let recentSpeechHistory: string[] = [];
const SPEECH_HISTORY_LIMIT = 5;
const SPEECH_COOLDOWN = 1500; // Reduced cooldown for better responsiveness
let lastSpeechTime = 0;
let currentAudio: HTMLAudioElement | null = null;
let isSpeaking = false;

// Global state for voice input components to check
(window as any).__tts_is_speaking = false;

export const speak = async (text: string, voiceOption?: keyof typeof VOICE_OPTIONS, isTest: boolean = false): Promise<void> => {
  console.log('TTS: Attempting to speak:', text);
  
  const now = Date.now();
  const lowerText = text.toLowerCase().trim();
  
  // Skip cooldown and history checks for voice tests
  if (!isTest) {
    // Check cooldown period
    if (now - lastSpeechTime < SPEECH_COOLDOWN) {
      console.log('TTS: In cooldown period, skipping speech');
      return;
    }
    
    // Skip empty or very short texts
    if (!text || text.trim().length < 3) {
      console.log('TTS: Text too short, skipping');
      return;
    }
    
    // Check against recent speech history
    if (recentSpeechHistory.includes(lowerText)) {
      console.log('TTS: Text recently spoken, skipping to prevent loop');
      return;
    }
    
    // Filter out system/error messages that could cause loops
    const systemPatterns = [
      'sorry, i had trouble understanding',
      'could you please try again',
      'i didn\'t understand that',
      'speech recognition',
      'microphone access',
      'try saying something like',
      'voice command not recognized',
      'listening for commands',
      'processing with ai',
      'browser speech synthesis',
      'tts',
      'text to speech'
    ];
    
    const isSystemMessage = systemPatterns.some(pattern => lowerText.includes(pattern));
    if (isSystemMessage) {
      console.log('TTS: Skipping system message to prevent feedback loop:', text);
      return;
    }
  }
  
  try {
    // Add to speech history (only for non-test calls)
    if (!isTest) {
      recentSpeechHistory.push(lowerText);
      if (recentSpeechHistory.length > SPEECH_HISTORY_LIMIT) {
        recentSpeechHistory.shift();
      }
      
      // Update last speech time
      lastSpeechTime = now;
    }
    
    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    
    // Set global speaking state
    isSpeaking = true;
    (window as any).__tts_is_speaking = true;
    
    // Refresh API key from localStorage in case it was updated
    ELEVENLABS_API_KEY = localStorage.getItem('elevenlabs_api_key');
    
    // Try ElevenLabs first if API key is available
    if (ELEVENLABS_API_KEY) {
      console.log('TTS: Using ElevenLabs TTS for high-quality speech');
      await speakWithElevenLabs(text, voiceOption);
    } else {
      console.log('TTS: Using browser speech synthesis (fallback)');
      await speakWithBrowser(text);
    }
    
  } catch (error) {
    console.error('TTS: Error with primary speech method, falling back:', error);
    // Fallback to browser TTS
    await speakWithBrowser(text);
  }
};

const speakWithElevenLabs = async (text: string, voiceOption?: keyof typeof VOICE_OPTIONS): Promise<void> => {
  try {
    const voiceId = voiceOption ? VOICE_OPTIONS[voiceOption] : VOICE_ID;
    
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY || ''
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    currentAudio = new Audio(audioUrl);
    currentAudio.volume = 0.8;
    
    return new Promise((resolve, reject) => {
      if (!currentAudio) {
        reject(new Error('Audio object not created'));
        return;
      }
      
      currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        isSpeaking = false;
        (window as any).__tts_is_speaking = false;
        console.log('TTS: ElevenLabs TTS completed');
        resolve();
      };
      
      currentAudio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        isSpeaking = false;
        (window as any).__tts_is_speaking = false;
        console.error('TTS: ElevenLabs audio playback error:', e);
        reject(e);
      };
      
      currentAudio.play().catch(reject);
      console.log('TTS: ElevenLabs TTS started');
    });
    
  } catch (error) {
    console.error('TTS: ElevenLabs TTS failed:', error);
    throw error;
  }
};

const speakWithBrowser = async (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if speech synthesis is available
    if (!window.speechSynthesis) {
      console.error('TTS: Speech synthesis not available in this browser');
      reject(new Error('Speech synthesis not available'));
      return;
    }
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // Wait a moment for cancel to take effect
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      utterance.lang = 'en-US';
      
      // Set up event handlers
      utterance.onstart = () => {
        isSpeaking = true;
        (window as any).__tts_is_speaking = true;
        console.log('TTS: Browser TTS started successfully');
      };
      
      utterance.onend = () => {
        isSpeaking = false;
        (window as any).__tts_is_speaking = false;
        console.log('TTS: Browser TTS ended');
        resolve();
      };
      
      utterance.onerror = (e) => {
        isSpeaking = false;
        (window as any).__tts_is_speaking = false;
        console.error('TTS: Browser TTS error:', e);
        reject(e);
      };
      
      // Speak the text
      speechSynthesis.speak(utterance);
    }, 100);
  });
};

export const setElevenLabsApiKey = (apiKey: string) => {
  localStorage.setItem('elevenlabs_api_key', apiKey);
  ELEVENLABS_API_KEY = apiKey;
};

export const getElevenLabsApiKey = (): string | null => {
  return localStorage.getItem('elevenlabs_api_key');
};

export const setSelectedVoice = (voice: keyof typeof VOICE_OPTIONS) => {
  localStorage.setItem('selected_voice', voice);
  selectedVoice = voice;
};

export const getSelectedVoice = (): string => {
  return localStorage.getItem('selected_voice') || 'aria';
};

export const stopCurrentSpeech = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  speechSynthesis.cancel();
  isSpeaking = false;
  (window as any).__tts_is_speaking = false;
};

// Clear speech history when needed
export const clearSpeechHistory = () => {
  recentSpeechHistory = [];
  lastSpeechTime = 0;
};

// Check if TTS is currently speaking
export const isTTSSpeaking = (): boolean => {
  return isSpeaking || (window as any).__tts_is_speaking;
};
