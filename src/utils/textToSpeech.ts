
// Simple text-to-speech utility using ElevenLabs API
const ELEVENLABS_API_KEY = localStorage.getItem('elevenlabs_api_key');
const VOICE_ID = '9BWtsMINqrJLrRacOk9x'; // Aria voice

export const speak = async (text: string): Promise<void> => {
  try {
    if (!ELEVENLABS_API_KEY) {
      console.log('ElevenLabs API key not found, using browser speech synthesis');
      // Fallback to browser's built-in speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
      return;
    }

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
  } catch (error) {
    console.error('Text-to-speech error:', error);
    // Fallback to browser speech synthesis
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }
};

export const setElevenLabsApiKey = (apiKey: string) => {
  localStorage.setItem('elevenlabs_api_key', apiKey);
};

export const getElevenLabsApiKey = (): string | null => {
  return localStorage.getItem('elevenlabs_api_key');
};
