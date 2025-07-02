
// Simple text-to-speech utility using ElevenLabs API
let ELEVENLABS_API_KEY = localStorage.getItem('elevenlabs_api_key');
const VOICE_ID = '9BWtsMINqrJLrRacOk9x'; // Aria voice

export const speak = async (text: string): Promise<void> => {
  console.log('TTS: Attempting to speak:', text);
  
  // More selective filtering - only prevent exact error messages that cause loops
  const lowerText = text.toLowerCase().trim();
  const exactErrorMessages = [
    'sorry, i had trouble understanding that. could you please try again?',
    'i didn\'t understand that command. could you please try again?'
  ];
  
  const isExactErrorMessage = exactErrorMessages.some(msg => lowerText === msg);
  if (isExactErrorMessage) {
    console.log('Skipping TTS for exact error message to prevent feedback loop:', text);
    return;
  }
  
  try {
    // Use browser speech synthesis - simplified implementation
    console.log('Using browser speech synthesis for text:', text);
    
    // Check if speech synthesis is available
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not available in this browser');
      return;
    }
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // Wait a moment for cancel to take effect
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    
    // Set up event handlers
    utterance.onstart = () => {
      console.log('Browser TTS started successfully for:', text);
    };
    
    utterance.onend = () => {
      console.log('Browser TTS ended for:', text);
    };
    
    utterance.onerror = (e) => {
      console.error('Browser TTS error:', e);
    };
    
    // Speak the text
    speechSynthesis.speak(utterance);
    
    console.log('TTS command issued successfully');
  } catch (error) {
    console.error('Text-to-speech error:', error);
  }
};

export const setElevenLabsApiKey = (apiKey: string) => {
  localStorage.setItem('elevenlabs_api_key', apiKey);
};

export const getElevenLabsApiKey = (): string | null => {
  return localStorage.getItem('elevenlabs_api_key');
};
