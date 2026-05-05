/**
 * User ElevenLabs TTS Utility
 * Uses the user's own API key for text-to-speech
 */
import { getElevenLabsApiKey } from '@/utils/userSecrets';

// Voice IDs for ElevenLabs
export const ELEVENLABS_VOICES = {
  rachel: 'pqHfZKP75CvOlQylNhV4',
  adam: 'pNInz6obpgDQGcFmaJgB',
  aria: '9BWtsMINqrJLrRacOk9x',
  josh: 'TxGEqnHWrfWFTfGW9XjX',
  bella: 'XB0fDUnXU5powFXDhCwa',
  elli: 'MF3mGyEYCl7XYWbV9V6O',
  sam: 'yoZ06aMxZJJ28mfd3POQ',
  sarah: 'EXAVITQu4vr4xnSDxMaL',
  antoni: 'ErXwobaYiN019PkySvjV',
  domi: 'AZnzlk1XvdvUeBnXmlld',
} as const;

export type ElevenLabsVoice = keyof typeof ELEVENLABS_VOICES;

interface SpeakOptions {
  voice?: ElevenLabsVoice;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

let currentAudio: HTMLAudioElement | null = null;

/**
 * Get the user's ElevenLabs API key from memory. Do not persist API keys in localStorage.
 */
export const getUserApiKey = (): string | null => {
  return getElevenLabsApiKey();
};

/**
 * Check if user has configured their ElevenLabs API key
 */
export const hasUserApiKey = (): boolean => {
  const key = getUserApiKey();
  return !!key && key.startsWith('sk_');
};

/**
 * Test if an API key is valid by making a small TTS request
 * We use the TTS endpoint because it has proper CORS headers (unlike /v1/user)
 */
export const testApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    // Use the TTS endpoint with a tiny text to validate the key
    // This endpoint has proper CORS headers
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICES.rachel}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'ok',
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' };
    } else if (response.status === 429) {
      // Rate limited but key is valid
      return { valid: true };
    } else {
      const errorText = await response.text().catch(() => '');
      return { valid: false, error: `API error: ${response.status} ${errorText}` };
    }
  } catch (error) {
    console.error('[UserTTS] Key validation error:', error);
    // Network error - could be CORS, connectivity, etc.
    // For CORS errors specifically, we can't distinguish them easily
    return { valid: false, error: 'Network error - could not reach ElevenLabs' };
  }
};

/**
 * Speak text using user's ElevenLabs API key
 * Falls back to browser TTS if no key or on error
 */
export const speakWithUserKey = async (
  text: string,
  options: SpeakOptions = {}
): Promise<boolean> => {
  const { voice = 'rachel', onStart, onEnd, onError } = options;
  const apiKey = getUserApiKey();

  // If no API key, fall back to browser TTS
  if (!apiKey) {
    if (import.meta.env.DEV) console.log('[UserTTS] No API key, falling back to browser TTS');
    return speakWithBrowser(text, { onStart, onEnd });
  }

  const voiceId = ELEVENLABS_VOICES[voice] || ELEVENLABS_VOICES.rachel;

  try {
    onStart?.();
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Stop any current audio
    stopSpeaking();

    currentAudio = new Audio(audioUrl);
    
    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      onEnd?.();
    };
    
    currentAudio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      onError?.(new Error('Audio playback failed'));
    };

    await currentAudio.play();
    return true;
  } catch (error) {
    console.error('[UserTTS] ElevenLabs error, falling back to browser:', error);
    onError?.(error as Error);
    
    // Fall back to browser TTS
    return speakWithBrowser(text, { onStart: undefined, onEnd }); // Don't call onStart again
  }
};

/**
 * Browser TTS fallback
 */
const speakWithBrowser = (
  text: string,
  options: { onStart?: () => void; onEnd?: () => void }
): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn('[UserTTS] Browser TTS not supported');
      options.onEnd?.();
      resolve(false);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes('Samantha') || v.name.includes('Google') || v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => options.onStart?.();
    utterance.onend = () => {
      options.onEnd?.();
      resolve(true);
    };
    utterance.onerror = () => {
      options.onEnd?.();
      resolve(false);
    };

    window.speechSynthesis.speak(utterance);
  });
};

/**
 * Stop current speech
 */
export const stopSpeaking = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
};

/**
 * Check if currently speaking
 */
export const isSpeaking = (): boolean => {
  return !!(currentAudio && !currentAudio.paused) || window.speechSynthesis?.speaking;
};
