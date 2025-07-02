
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
  
  // Update API key in case it was set after initial load
  ELEVENLABS_API_KEY = localStorage.getItem('elevenlabs_api_key');
  
  try {
    // Always use browser speech synthesis for now to avoid API issues
    console.log('Using browser speech synthesis for text:', text);
    
    // Check if speech synthesis is available
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not available in this browser');
      return;
    }
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    utterance.lang = 'en-US';
    
    await new Promise<void>((resolve, reject) => {
      utterance.onstart = () => {
        console.log('Browser TTS started successfully for:', text);
      };
      utterance.onend = () => {
        console.log('Browser TTS ended for:', text);
        resolve();
      };
      utterance.onerror = (e) => {
        console.error('Browser TTS error:', e);
        reject(e);
      };
      
      // Add a timeout in case the speech synthesis gets stuck
      const timeout = setTimeout(() => {
        console.warn('TTS timeout, resolving anyway');
        resolve();
      }, 10000);
      
      utterance.onend = () => {
        clearTimeout(timeout);
        console.log('Browser TTS ended for:', text);
        resolve();
      };
      
      speechSynthesis.speak(utterance);
    });
    return;

    console.log('Using ElevenLabs API for TTS');
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICE_ID, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate speech');
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    await new Promise((resolve, reject) => {
      audio.onended = resolve;
      audio.onerror = reject;
      audio.play();
    });

    URL.revokeObjectURL(audioUrl);
    console.log('ElevenLabs TTS completed successfully');
  } catch (error) {
    console.error('Text-to-speech error:', error);
    // Fallback to browser speech synthesis
    console.log('Falling back to browser speech synthesis');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => console.log('Fallback browser TTS started');
    utterance.onend = () => console.log('Fallback browser TTS ended');
    utterance.onerror = (e) => console.error('Fallback browser TTS error:', e);
    speechSynthesis.speak(utterance);
  }
};

export const setElevenLabsApiKey = (apiKey: string) => {
  localStorage.setItem('elevenlabs_api_key', apiKey);
};

export const getElevenLabsApiKey = (): string | null => {
  return localStorage.getItem('elevenlabs_api_key');
};
