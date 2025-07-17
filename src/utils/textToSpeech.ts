// Enhanced text-to-speech utility with ElevenLabs premium voices via Supabase Edge Function
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
const SPEECH_COOLDOWN = 500;
let lastSpeechTime = 0;
let currentAudio: HTMLAudioElement | null = null;
let isSpeaking = false;
let useElevenLabsFallback = true; // Will be set to false if ElevenLabs has quota issues

// Global state for voice input components to check
(window as any).__tts_is_speaking = false;

export const speak = async (text: string, voiceOption?: keyof typeof VOICE_OPTIONS, isTest: boolean = false): Promise<void> => {
  console.log('TTS: Attempting to speak with voice synthesis:', { text: text.substring(0, 100), voiceOption, isTest });
  
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
      'text to speech',
      'voice synthesis failed',
      'quota exceeded'
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
    
    // Try ElevenLabs first if enabled, fall back to browser TTS
    if (useElevenLabsFallback) {
      try {
        console.log('TTS: Attempting ElevenLabs TTS');
        await speakWithElevenLabs(text, voiceOption);
        return;
      } catch (error) {
        console.warn('TTS: ElevenLabs failed, falling back to browser TTS:', error);
        
        // Check if it's a quota/credit issue
        if (error instanceof Error && (
          error.message.includes('quota') || 
          error.message.includes('credits') || 
          error.message.includes('403') ||
          error.message.includes('402')
        )) {
          useElevenLabsFallback = false; // Disable for future calls
          toast.warning('ElevenLabs quota exceeded. Using browser voice synthesis.');
        }
        
        // Fall back to browser TTS
        await speakWithBrowserTTS(text);
      }
    } else {
      console.log('TTS: Using browser TTS (ElevenLabs disabled due to quota)');
      await speakWithBrowserTTS(text);
    }
    
  } catch (error) {
    console.error('TTS: All voice synthesis methods failed:', error);
    
    // Reset speaking state on error
    isSpeaking = false;
    (window as any).__tts_is_speaking = false;
    
    toast.error('Voice synthesis failed. Please try again.');
    
    // Still dispatch completion event to prevent hanging
    setTimeout(() => {
      const event = new CustomEvent('tts-completed', { 
        detail: { 
          text, 
          shouldRestartRecognition: true,
          timestamp: Date.now(),
          error: true
        }
      });
      window.dispatchEvent(event);
    }, 500);
    
    throw error;
  }
};

const speakWithElevenLabs = async (text: string, voiceOption?: keyof typeof VOICE_OPTIONS): Promise<void> => {
  try {
    const voiceId = voiceOption ? VOICE_OPTIONS[voiceOption] : VOICE_ID;
    
    // Pre-process text to prevent common failures
    let processedText = text
      .replace(/\\"/g, '"')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .trim();
    
    // Conservative length limit to avoid quota issues
    if (processedText.length > 300) {
      processedText = processedText.substring(0, 300) + '...';
      console.log('TTS: Truncated text to 300 characters');
    }
    
    console.log('TTS: Calling ElevenLabs Edge Function with:', { 
      textLength: processedText.length,
      voiceId,
      preview: processedText.substring(0, 100) + (processedText.length > 100 ? '...' : '')
    });
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
      body: {
        text: processedText,
        voiceId: voiceId,
        modelId: 'eleven_multilingual_v2'
      }
    });

    console.log('TTS: Edge Function response:', { 
      hasData: !!data, 
      hasAudioContent: !!data?.audioContent,
      error: error?.message,
      fallback: data?.fallback
    });

    if (error) {
      console.error('TTS: Edge Function error details:', error);
      throw new Error(`ElevenLabs service error: ${error.message}`);
    }

    if (data?.fallback === 'browser_tts') {
      console.log('TTS: ElevenLabs recommended fallback to browser TTS');
      throw new Error('ElevenLabs quota exceeded or API error - using fallback');
    }

    if (!data?.audioContent) {
      console.error('TTS: No audio content in response:', data);
      throw new Error('No audio content returned from ElevenLabs');
    }

    // Convert base64 to audio blob
    try {
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
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
          console.log('TTS: ElevenLabs TTS completed successfully');
          
          setTimeout(() => {
            const event = new CustomEvent('tts-completed', { 
              detail: { 
                text, 
                shouldRestartRecognition: true,
                timestamp: Date.now()
              }
            });
            window.dispatchEvent(event);
          }, 1000);
          
          resolve();
        };
        
        currentAudio.onerror = (e) => {
          URL.revokeObjectURL(audioUrl);
          currentAudio = null;
          isSpeaking = false;
          (window as any).__tts_is_speaking = false;
          console.error('TTS: Audio playback error:', e);
          reject(new Error('Audio playback failed'));
        };
        
        currentAudio.play().catch((playError) => {
          console.error('TTS: Audio play error:', playError);
          reject(new Error(`Audio play failed: ${playError.message}`));
        });
        
        console.log('TTS: ElevenLabs TTS audio started');
      });
      
    } catch (audioError) {
      console.error('TTS: Audio processing error:', audioError);
      throw new Error(`Audio processing failed: ${audioError.message}`);
    }
    
  } catch (error) {
    console.error('TTS: ElevenLabs TTS failed:', error);
    throw error;
  }
};

const speakWithBrowserTTS = async (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Browser TTS not supported'));
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to use a higher quality voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('natural') ||
        voice.name.toLowerCase().includes('neural') ||
        voice.name.toLowerCase().includes('enhanced') ||
        (voice.lang.startsWith('en') && voice.default)
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      utterance.onend = () => {
        isSpeaking = false;
        (window as any).__tts_is_speaking = false;
        console.log('TTS: Browser TTS completed successfully');
        
        setTimeout(() => {
          const event = new CustomEvent('tts-completed', { 
            detail: { 
              text, 
              shouldRestartRecognition: true,
              timestamp: Date.now()
            }
          });
          window.dispatchEvent(event);
        }, 1000);
        
        resolve();
      };

      utterance.onerror = (event) => {
        isSpeaking = false;
        (window as any).__tts_is_speaking = false;
        console.error('TTS: Browser TTS error:', event);
        reject(new Error(`Browser TTS failed: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
      console.log('TTS: Browser TTS started');
      
    } catch (error) {
      isSpeaking = false;
      (window as any).__tts_is_speaking = false;
      console.error('TTS: Browser TTS setup failed:', error);
      reject(error);
    }
  });
};

export const setElevenLabsApiKey = (apiKey: string) => {
  localStorage.setItem('elevenlabs_api_key', apiKey);
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
  
  // Also stop browser TTS if it's running
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  
  isSpeaking = false;
  (window as any).__tts_is_speaking = false;
};

export const clearSpeechHistory = () => {
  recentSpeechHistory = [];
  lastSpeechTime = 0;
};

export const isTTSSpeaking = (): boolean => {
  return isSpeaking || (window as any).__tts_is_speaking;
};

export const resetElevenLabsFallback = () => {
  useElevenLabsFallback = true;
  console.log('TTS: ElevenLabs fallback re-enabled');
};
