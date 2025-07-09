
// Enhanced text-to-speech utility with better feedback loop prevention
let ELEVENLABS_API_KEY = localStorage.getItem('elevenlabs_api_key');
const VOICE_ID = '9BWtsMINqrJLrRacOk9x'; // Aria voice

// Track recent speech to prevent feedback loops
let recentSpeechHistory: string[] = [];
const SPEECH_HISTORY_LIMIT = 5;
const SPEECH_COOLDOWN = 2000; // 2 seconds
let lastSpeechTime = 0;

export const speak = async (text: string): Promise<void> => {
  console.log('TTS: Attempting to speak:', text);
  
  // Check cooldown period
  const now = Date.now();
  if (now - lastSpeechTime < SPEECH_COOLDOWN) {
    console.log('TTS: In cooldown period, skipping speech');
    return;
  }
  
  // More comprehensive filtering to prevent feedback loops
  const lowerText = text.toLowerCase().trim();
  
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
  
  try {
    // Add to speech history
    recentSpeechHistory.push(lowerText);
    if (recentSpeechHistory.length > SPEECH_HISTORY_LIMIT) {
      recentSpeechHistory.shift();
    }
    
    // Update last speech time
    lastSpeechTime = now;
    
    // Use browser speech synthesis
    console.log('TTS: Using browser speech synthesis for text:', text);
    
    // Check if speech synthesis is available
    if (!window.speechSynthesis) {
      console.error('TTS: Speech synthesis not available in this browser');
      return;
    }
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // Wait a moment for cancel to take effect
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    utterance.lang = 'en-US';
    
    // Set up event handlers
    utterance.onstart = () => {
      console.log('TTS: Browser TTS started successfully for:', text);
    };
    
    utterance.onend = () => {
      console.log('TTS: Browser TTS ended for:', text);
    };
    
    utterance.onerror = (e) => {
      console.error('TTS: Browser TTS error:', e);
    };
    
    // Speak the text
    speechSynthesis.speak(utterance);
    
    console.log('TTS: Speech command issued successfully');
  } catch (error) {
    console.error('TTS: Text-to-speech error:', error);
  }
};

export const setElevenLabsApiKey = (apiKey: string) => {
  localStorage.setItem('elevenlabs_api_key', apiKey);
  ELEVENLABS_API_KEY = apiKey;
};

export const getElevenLabsApiKey = (): string | null => {
  return localStorage.getItem('elevenlabs_api_key');
};

// Clear speech history when needed
export const clearSpeechHistory = () => {
  recentSpeechHistory = [];
  lastSpeechTime = 0;
};
