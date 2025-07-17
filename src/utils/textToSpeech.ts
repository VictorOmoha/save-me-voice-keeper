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

// Global state for voice input components to check
(window as any).__tts_is_speaking = false;

export const speak = async (text: string, voiceOption?: keyof typeof VOICE_OPTIONS, isTest: boolean = false): Promise<void> => {
  console.log('TTS: Attempting to speak with ElevenLabs:', { text: text.substring(0, 100), voiceOption, isTest });
  
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
      'voice synthesis failed'
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
    
    // Use ElevenLabs TTS only
    console.log('TTS: Using ElevenLabs TTS via Supabase Edge Function');
    await speakWithElevenLabs(text, voiceOption);
    
  } catch (error) {
    console.error('TTS: ElevenLabs TTS failed:', error);
    
    // Reset speaking state on error
    isSpeaking = false;
    (window as any).__tts_is_speaking = false;
    
    // Provide more specific error messages
    let errorMessage = 'Voice synthesis failed.';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'ElevenLabs API key is invalid or missing.';
      } else if (error.message.includes('credits')) {
        errorMessage = 'ElevenLabs account has insufficient credits.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'ElevenLabs rate limit exceeded. Please try again later.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      }
    }
    
    toast.error(errorMessage);
    
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
    
    // Conservative length limit
    if (processedText.length > 500) {
      processedText = processedText.substring(0, 500);
      console.log('TTS: Truncated text to 500 characters');
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
      error: error?.message 
    });

    if (error) {
      console.error('TTS: Edge Function error details:', error);
      throw new Error(`ElevenLabs service error: ${error.message}`);
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
          
          // Use longer delay to ensure microphone is fully released
          setTimeout(() => {
            const event = new CustomEvent('tts-completed', { 
              detail: { 
                text, 
                shouldRestartRecognition: true,
                timestamp: Date.now()
              }
            });
            window.dispatchEvent(event);
            console.log('TTS completion event dispatched');
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
