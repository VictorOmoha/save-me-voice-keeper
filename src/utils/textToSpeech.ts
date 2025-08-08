
import { toast } from 'sonner';
import { playEndOfSpeechCueIfEnabled } from '@/utils/audioCues';

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice

// MiniMax API configuration - Updated with correct endpoint
const MINIMAX_API_URL = 'https://api.minimax.io/v1/t2a_v2';

// Voice settings for ElevenLabs - Optimized for speed and clarity
const VOICE_SETTINGS = {
  stability: 0.7,
  similarity_boost: 0.9,
  style: 0.2,
  use_speaker_boost: true,
  rate: 1.3 // Faster speech rate for improved UX
};

// Available voices - exported for use in other components
export const AVAILABLE_VOICES = {
  'Adam': 'pNInz6obpgDQGcFmaJgB',
  'Antoni': 'ErXwobaYiN019PkySvjV',
  'Arnold': 'VR6AewLTigWG4xSOukaG',
  'Aria': '9BWtsMINqrJLrRacOk9x',
  'Bella': 'XB0fDUnXU5powFXDhCwa', // Charlotte voice ID (female)
  'Domi': 'AZnzlk1XvdvUeBnXmlld',
  'Elli': 'MF3mGyEYCl7XYWbV9V6O',
  'Josh': 'TxGEqnHWrfWFTfGW9XjX',
  'Laura': 'FGY2WhTYpPnrIDTdsKH5',
  'Rachel': 'pqHfZKP75CvOlQylNhV4',
  'Sam': 'yoZ06aMxZJJ28mfd3POQ',
  'Sarah': 'EXAVITQu4vr4xnSDxMaL'
};

// MiniMax voices with proper parameters - Updated with commonly supported voice types
export const MINIMAX_VOICES = {
  'male-qn-qingse': 'Male Voice (清晰)',
  'female-shaonv': 'Female Voice (少女)',
  'male-qn-jingying': 'Male Professional',
  'female-qn-qingse': 'Female Professional',
  'broadcaster_male': 'Broadcaster Male',
  'broadcaster_female': 'Broadcaster Female'
};

// Voice options for UI components
export const VOICE_OPTIONS = {
  'adam': 'Adam',
  'antoni': 'Antoni', 
  'arnold': 'Arnold',
  'aria': 'Aria',
  'bella': 'Bella',
  'domi': 'Domi',
  'elli': 'Elli',
  'josh': 'Josh',
  'laura': 'Laura',
  'rachel': 'Rachel',
  'sam': 'Sam',
  'sarah': 'Sarah'
} as const;

export type VoiceOptionKey = keyof typeof VOICE_OPTIONS;

// TTS Service type
export type TTSService = 'elevenlabs' | 'minimax';

// API Key management with improved error handling and logging
export const getElevenLabsApiKey = (): string | null => {
  try {
    const key = localStorage.getItem('elevenlabs_api_key');
    console.log('🔑 Getting ElevenLabs API key:', key ? 'Found' : 'Not found');
    return key;
  } catch (error) {
    console.error('🚨 Error getting ElevenLabs API key:', error);
    return null;
  }
};

export const setElevenLabsApiKey = (apiKey: string): void => {
  try {
    console.log('🔑 Setting ElevenLabs API key:', apiKey ? 'Key provided' : 'Empty key');
    if (apiKey.trim()) {
      localStorage.setItem('elevenlabs_api_key', apiKey.trim());
      console.log('✅ ElevenLabs API key saved to localStorage');
      toast.success('ElevenLabs API key saved successfully');
    } else {
      localStorage.removeItem('elevenlabs_api_key');
      console.log('🗑️ ElevenLabs API key removed from localStorage');
      toast.success('ElevenLabs API key removed');
    }
  } catch (error) {
    console.error('🚨 Error setting ElevenLabs API key:', error);
    toast.error('Failed to save ElevenLabs API key');
  }
};

export const getMiniMaxApiKey = (): string | null => {
  try {
    const key = localStorage.getItem('minimax_api_key');
    console.log('🔑 Getting MiniMax API key:', key ? 'Found' : 'Not found');
    return key;
  } catch (error) {
    console.error('🚨 Error getting MiniMax API key:', error);
    return null;
  }
};

export const setMiniMaxApiKey = (apiKey: string): void => {
  try {
    console.log('🔑 Setting MiniMax API key:', apiKey ? 'Key provided' : 'Empty key');
    if (apiKey.trim()) {
      localStorage.setItem('minimax_api_key', apiKey.trim());
      console.log('✅ MiniMax API key saved to localStorage');
      toast.success('MiniMax API key saved successfully');
    } else {
      localStorage.removeItem('minimax_api_key');
      console.log('🗑️ MiniMax API key removed from localStorage');
      toast.success('MiniMax API key removed');
    }
  } catch (error) {
    console.error('🚨 Error setting MiniMax API key:', error);
    toast.error('Failed to save MiniMax API key');
  }
};

// Service preference
export const getSelectedTTSService = (): TTSService => {
  const stored = localStorage.getItem('selected_tts_service');
  if (stored && ['elevenlabs', 'minimax'].includes(stored)) {
    return stored as TTSService;
  }
  return 'elevenlabs';
};

export const setSelectedTTSService = (service: TTSService): void => {
  localStorage.setItem('selected_tts_service', service);
};

export const getSelectedVoice = (): VoiceOptionKey => {
  const stored = localStorage.getItem('selected_voice');
  if (stored && stored in VOICE_OPTIONS) {
    return stored as VoiceOptionKey;
  }
  return 'adam';
};

export const setSelectedVoice = (voice: VoiceOptionKey): void => {
  localStorage.setItem('selected_voice', voice);
};

export const getSelectedMiniMaxVoice = (): keyof typeof MINIMAX_VOICES => {
  const stored = localStorage.getItem('selected_minimax_voice');
  if (stored && stored in MINIMAX_VOICES) {
    return stored as keyof typeof MINIMAX_VOICES;
  }
  return 'male-qn-qingse';
};

export const setSelectedMiniMaxVoice = (voice: keyof typeof MINIMAX_VOICES): void => {
  localStorage.setItem('selected_minimax_voice', voice);
};

// Improved TTS cache for speech recognition filtering
const initializeTTSCache = () => {
  if (!(window as any).__recent_tts_texts) {
    (window as any).__recent_tts_texts = [];
  }
};

const addToTTSCache = (text: string) => {
  initializeTTSCache();
  const cache = (window as any).__recent_tts_texts as string[];
  
  // Add to cache and keep only last 3 items
  cache.unshift(text);
  if (cache.length > 3) {
    cache.splice(3);
  }
  
  // Clear cache after 10 seconds (reduced for faster cleanup)
  setTimeout(() => {
    const index = cache.indexOf(text);
    if (index > -1) {
      cache.splice(index, 1);
    }
  }, 10000);
};

// Clear speech history - for compatibility
export const clearSpeechHistory = (): void => {
  if ((window as any).__recent_tts_texts) {
    (window as any).__recent_tts_texts = [];
  }
};

// Speech options interface
interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
}

// Main speak function with service selection
export const speak = async (text: string, optionsOrVoice?: string | SpeechOptions): Promise<void> => {
  if (!text || text.trim().length === 0) {
    console.log('🔊 TTS: Empty text provided, skipping');
    return;
  }

  console.log('🔊 TTS: Starting speech:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
  
  // Add to TTS cache for speech recognition filtering
  addToTTSCache(text);
  
  // Set global flag and dispatch event BEFORE starting speech
  (window as any).__tts_is_speaking = true;
  window.dispatchEvent(new CustomEvent('tts-started'));
  console.log('🔊 TTS: Set speaking flag and dispatched tts-started event');

  try {
    const selectedService = getSelectedTTSService();
    const elevenLabsKey = getElevenLabsApiKey();
    const miniMaxKey = getMiniMaxApiKey();
    const speechLanguage = localStorage.getItem('speech_language') || 'en-US';
    
    console.log('🔧 TTS config:', {
      selectedService,
      hasElevenLabsKey: !!elevenLabsKey,
      hasMiniMaxKey: !!miniMaxKey,
      speechLanguage
    });

    // Determine effective service (fallback to ElevenLabs if MiniMax not configured)
    let effectiveService: TTSService = selectedService as TTSService;
    if (effectiveService === 'minimax' && !miniMaxKey && elevenLabsKey) {
      console.warn('⚠️ MiniMax selected but no API key. Falling back to ElevenLabs for this session.');
      setSelectedTTSService('elevenlabs');
      effectiveService = 'elevenlabs';
    }
    
    // Determine voice and options
    let voice: string | undefined;
    let options: SpeechOptions | undefined;
    
    if (typeof optionsOrVoice === 'string') {
      voice = optionsOrVoice;
    } else if (typeof optionsOrVoice === 'object') {
      options = optionsOrVoice;
    }
    
    // Try primary service first, then fallback to secondary or browser
    let primaryFailed = false;
    
    if (effectiveService === 'elevenlabs' && elevenLabsKey) {
      try {
        console.log('🎙️ TTS: Using ElevenLabs TTS (effective)');
        await speakWithElevenLabs(text, voice);
        return; // Success, exit early
      } catch (error: any) {
        console.warn('⚠️ TTS: ElevenLabs failed, trying fallback:', error?.message || error);
        primaryFailed = true;
      }
    } else if (effectiveService === 'minimax' && miniMaxKey) {
      try {
        console.log('🎙️ TTS: Using MiniMax TTS (effective)');
        await speakWithMiniMax(text);
        return; // Success, exit early
      } catch (error: any) {
        console.warn('⚠️ TTS: MiniMax failed, trying fallback:', error?.message || error);
        primaryFailed = true;
      }
    }
    
    // Try secondary service if primary failed or no key available
    if (primaryFailed || !(effectiveService === 'elevenlabs' ? elevenLabsKey : miniMaxKey)) {
      const fallbackService: TTSService = effectiveService === 'elevenlabs' ? 'minimax' : 'elevenlabs';
      const fallbackKey = fallbackService === 'elevenlabs' ? elevenLabsKey : miniMaxKey;
      
      if (fallbackKey) {
        try {
          console.log(`🔄 TTS: Trying fallback service: ${fallbackService}`);
          if (fallbackService === 'elevenlabs') {
            await speakWithElevenLabs(text, voice);
          } else {
            await speakWithMiniMax(text);
          }
          return; // Success with fallback
        } catch (fallbackError: any) {
          console.warn('⚠️ TTS: Fallback service also failed:', fallbackError?.message || fallbackError);
        }
      }
    }
    
    // Final fallback to browser TTS
    console.log('🔄 TTS: All API services failed or unavailable, falling back to browser TTS');
    try {
      const speechRate = parseFloat(localStorage.getItem('speech_rate') || '0.9');
      const speechVolume = parseFloat(localStorage.getItem('speech_volume') || '0.8');
      await speakWithBrowser(text, { rate: speechRate, pitch: 1, volume: speechVolume });
    } catch (browserError) {
      console.error('🚨 TTS: All services failed including browser TTS:', browserError);
      throw new Error('All TTS services failed. Please check your API keys or browser compatibility.');
    }
  } catch (error) {
    console.error('🚨 TTS: Error during speech:', error);
    toast.error('TTS failed. Please check your API key and try again.');
    } finally {
      try { playEndOfSpeechCueIfEnabled(); } catch (e) { console.warn('Audio cue failed:', (e as any)?.message || e); }
      // Clear TTS flag and dispatch completion event after a brief delay
      setTimeout(() => {
        (window as any).__tts_is_speaking = false;
        (window as any).__last_tts_end_time = Date.now();
        window.dispatchEvent(new CustomEvent('tts-completed'));
        console.log('🔊 TTS: Speech completed, dispatched tts-completed event');
      }, 1000);
    }
};

const speakWithElevenLabs = async (text: string, voice?: string): Promise<void> => {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    throw new Error('ElevenLabs API key not found. Please set your API key in voice settings.');
  }

  // Validate API key format - ElevenLabs keys can have various formats
  if (apiKey.length < 10) {
    throw new Error('Invalid ElevenLabs API key format. Please check your API key in settings.');
  }

  const selectedVoice = voice || getSelectedVoice();
  // Capitalize the voice name for lookup in AVAILABLE_VOICES
  const capitalizedVoice = selectedVoice.charAt(0).toUpperCase() + selectedVoice.slice(1);
  const voiceId = AVAILABLE_VOICES[capitalizedVoice as keyof typeof AVAILABLE_VOICES] || DEFAULT_VOICE_ID;

  console.log('🎙️ TTS: Using ElevenLabs voice:', selectedVoice, 'ID:', voiceId);
  console.log('🔑 TTS: API key length:', apiKey.length, 'starts with:', apiKey.substring(0, 10) + '...');

  // Choose model based on language: English -> eleven_turbo_v2, otherwise multilingual
  const speechLanguage = localStorage.getItem('speech_language') || 'en-US';
  const modelId = speechLanguage.startsWith('en') ? 'eleven_turbo_v2' : 'eleven_multilingual_v2';
  console.log('🎛️ TTS: ElevenLabs model selected:', modelId, 'lang:', speechLanguage);

  const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text: text,
      model_id: modelId,
      voice_settings: VOICE_SETTINGS,
    }),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      console.error('🚨 TTS: ElevenLabs API error:', response.status, JSON.stringify(errorData));
      
      // Check for specific error types - improved error detection
      if (errorData.detail?.status === 'quota_exceeded' || errorData.detail?.message?.includes('quota')) {
        const quotaMessage = errorData.detail.message || 'Credits exhausted';
        toast.error(`ElevenLabs quota exceeded: ${quotaMessage}`);
        throw new Error(`ElevenLabs quota exceeded: ${quotaMessage}`);
      } else if (response.status === 401) {
        toast.error('ElevenLabs API key is invalid or expired');
        throw new Error('ElevenLabs API key is invalid or expired');
      } else if (response.status === 429) {
        toast.error('ElevenLabs rate limit exceeded');
        throw new Error('ElevenLabs rate limit exceeded');
      } else {
        const errorMessage = errorData.detail?.message || `HTTP ${response.status}`;
        toast.error(`ElevenLabs API error: ${errorMessage}`);
        throw new Error(`ElevenLabs API error: ${errorMessage}`);
      }
    } catch (parseError) {
      // Fallback if response isn't JSON
      const errorText = await response.text();
      console.error('🚨 TTS: ElevenLabs API error (non-JSON):', response.status, errorText);
      toast.error(`ElevenLabs API error: ${response.status}`);
      throw new Error(`API error: ${response.status}`);
    }
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      console.log('🔊 TTS: ElevenLabs audio playback completed');
      resolve();
    };

    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl);
      console.error('🚨 TTS: Audio playback error:', error);
      reject(error);
    };

    audio.play().catch(reject);
  });
};

// Cache for GroupId to avoid repeated JWT parsing
const groupIdCache = new Map<string, string>();

const speakWithMiniMax = async (text: string): Promise<void> => {
  const apiKey = getMiniMaxApiKey();
  if (!apiKey) {
    throw new Error('MiniMax API key not found. Please set your MiniMax JWT token in voice settings.');
  }

  console.log('🔍 Debug: MiniMax API key length:', apiKey.length);
  console.log('🔍 Debug: MiniMax API key starts with:', apiKey.substring(0, 50) + '...');

  // Extract GroupId from JWT token with enhanced validation
  let groupId = '';
  
  // Check cache first for performance
  if (groupIdCache.has(apiKey)) {
    groupId = groupIdCache.get(apiKey)!;
    console.log('🔑 Using cached GroupId:', groupId);
  } else {
    try {
      // Validate JWT structure
      const jwtParts = apiKey.split('.');
      console.log('🔍 Debug: JWT parts count:', jwtParts.length);
      
      if (jwtParts.length !== 3) {
        throw new Error('Invalid JWT format: expected 3 parts');
      }

      console.log('🔍 Debug: JWT header:', jwtParts[0]);
      console.log('🔍 Debug: JWT payload (base64):', jwtParts[1].substring(0, 100) + '...');
      
      const payload = JSON.parse(atob(jwtParts[1]));
      console.log('🔍 Debug: Decoded JWT payload:', JSON.stringify(payload, null, 2));
      
      // Try both GroupID and SubjectID from JWT
      const extractedGroupId = payload.GroupID;
      const subjectId = payload.SubjectID;
      
      console.log('🔍 Debug: Extracted GroupID:', extractedGroupId);
      console.log('🔍 Debug: Extracted SubjectID:', subjectId);
      console.log('🔍 Debug: GroupID type:', typeof extractedGroupId);
      console.log('🔍 Debug: SubjectID type:', typeof subjectId);
      
      // Use GroupID as primary
      groupId = extractedGroupId;
      
      // Validate extracted GroupId
      if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
        console.error('🚨 Debug: Invalid GroupId extracted:', { groupId, type: typeof groupId });
        throw new Error('Invalid or missing GroupId in JWT token');
      }
      
      // Cache the GroupId for future use
      groupIdCache.set(apiKey, groupId);
      console.log('🔑 Extracted and cached GroupId from JWT:', groupId);
    } catch (error) {
      console.error('🚨 Failed to extract GroupId from JWT:', error);
      console.error('🚨 Debug: Raw API key for inspection:', apiKey);
      throw new Error(`Invalid MiniMax JWT token format: ${error.message}`);
    }
  }

  const apiUrl = MINIMAX_API_URL; // Use base URL without GroupId parameter
  console.log('🌐 MiniMax API URL:', apiUrl);

  const selectedVoice = getSelectedMiniMaxVoice();
  console.log('🔑 Getting MiniMax API key:', apiKey ? 'Found' : 'Not found');
  console.log('🎙️ TTS: Using MiniMax voice:', selectedVoice);

  const requestBody = {
    model: "speech-01",
    text: text,
    voice_id: selectedVoice,
    speed: 1.0,
    vol: 1.0,
    pitch: 0,
    audio_sample_rate: 32000,
    bitrate: 128000,
    // Include GroupId in base request
    group_id: groupId
  };

  console.log('🔍 MiniMax request body:', JSON.stringify(requestBody, null, 2));
  
  const startTime = performance.now();

  // Try multiple authentication approaches systematically
  console.log('🔍 Trying enhanced MiniMax authentication approaches...');
  
  let response: Response;
  let lastError: string = '';
  
  // Approach 1: GroupID in request body (common for many APIs)
  console.log('🔍 Approach 1: GroupID in request body');
  try {
    const bodyWithGroupId = {
      ...requestBody,
      group_id: groupId,
      GroupId: groupId
    };
    
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyWithGroupId),
    });
    
    if (response.ok) {
      console.log('✅ Approach 1 successful!');
    } else {
      const errorResult = await response.json();
      lastError = `Approach 1: ${errorResult.base_resp?.status_msg || errorResult.status_msg || 'Unknown error'}`;
      console.log('❌ Approach 1 failed:', lastError);
      
      // Approach 2: Try with GroupId URL parameter
      console.log('🔍 Approach 2: GroupId as URL parameter');
      response = await fetch(`${apiUrl}?GroupId=${groupId}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorResult2 = await response.json();
        lastError = `Approach 2: ${errorResult2.base_resp?.status_msg || errorResult2.status_msg || 'Unknown error'}`;
        console.log('❌ Approach 2 failed:', lastError);
        
        // Approach 3: Try alternative endpoint format
        console.log('🔍 Approach 3: Alternative endpoint format');
        const altApiUrl = `https://api.minimax.io/v1/text_to_speech/${groupId}`;
        response = await fetch(altApiUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          const errorResult3 = await response.json();
          lastError = `Approach 3: ${errorResult3.base_resp?.status_msg || errorResult3.status_msg || 'Unknown error'}`;
          console.log('❌ Approach 3 failed:', lastError);
          
          // Approach 4: Try with X-Group-ID header (fallback)
          console.log('🔍 Approach 4: X-Group-ID header');
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'X-Group-ID': groupId,
            },
            body: JSON.stringify(requestBody),
          });
          
          if (!response.ok) {
            const errorResult4 = await response.json();
            lastError = `All approaches failed. Final: ${errorResult4.base_resp?.status_msg || errorResult4.status_msg || 'Unknown error'}`;
            console.log('❌ All 4 approaches failed:', lastError);
          } else {
            console.log('✅ Approach 4 successful!');
          }
        } else {
          console.log('✅ Approach 3 successful!');
        }
      } else {
        console.log('✅ Approach 2 successful!');
      }
    }
  } catch (fetchError) {
    console.error('🚨 Network error during API call:', fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }

  console.log('🌐 MiniMax response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('🚨 TTS: All MiniMax API approaches failed');
    console.error('🚨 TTS: Last error:', lastError);
    console.error('🚨 TTS: Response status:', response.status);
    console.error('🚨 TTS: Response text:', errorText);
    
    toast.error('MiniMax TTS failed with all authentication methods. Using browser TTS instead.');
    throw new Error(`MiniMax API error: ${lastError}`);
  }

  const result = await response.json();
  const endTime = performance.now();
  const requestDuration = endTime - startTime;
  
  console.log('🔍 MiniMax full response:', JSON.stringify(result, null, 2));
  console.log('⏱️ MiniMax API request duration:', `${requestDuration.toFixed(2)}ms`);
  
  // Check for errors in the response
  if (result.base_resp && result.base_resp.status_code !== 0) {
    console.error('🚨 MiniMax API returned error:', result.base_resp);
    console.error('📊 API Call Metrics:', {
      duration: `${requestDuration.toFixed(2)}ms`,
      errorCode: result.base_resp.status_code,
      errorMessage: result.base_resp.status_msg
    });
    
    // Handle specific error codes
    if (result.base_resp.status_code === 2049) {
      // Clear cache for this API key since it's invalid
      groupIdCache.delete(apiKey);
      toast.error('Your MiniMax JWT token is invalid or expired. Please update it in voice settings.');
      throw new Error('MiniMax API error: invalid api key - Please update your JWT token in settings');
    }
    
    throw new Error(`MiniMax API error: ${result.base_resp?.status_msg || 'Unknown error'}`);
  }

  // Log successful API call
  console.log('✅ MiniMax API call successful', {
    duration: `${requestDuration.toFixed(2)}ms`,
    textLength: text.length,
    voice: selectedVoice
  });

  // Handle different response formats
  let audioData;
  if (result.data?.audio) {
    audioData = result.data.audio;
  } else if (result.audio) {
    audioData = result.audio;
  } else if (result.data?.extra_info?.audio_content) {
    audioData = result.data.extra_info.audio_content;
  } else {
    console.error('🚨 MiniMax response structure:', Object.keys(result));
    throw new Error('No audio data found in MiniMax response');
  }

  if (!audioData) {
    throw new Error('No audio data received from MiniMax');
  }

  const audioBlob = new Blob([Uint8Array.from(atob(audioData), c => c.charCodeAt(0))], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);

  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      console.log('🔊 TTS: MiniMax audio playback completed');
      resolve();
    };

    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl);
      console.error('🚨 TTS: Audio playback error:', error);
      reject(error);
    };

    audio.play().catch(reject);
  });
};

const speakWithBrowser = async (text: string, options?: SpeechOptions): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance with options
    utterance.rate = options?.rate || 0.9;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = options?.volume || 0.8;

    // Enforce language (default to English US)
    const preferredLang = localStorage.getItem('speech_language') || 'en-US';
    utterance.lang = preferredLang;

    // Try to use an English/browser voice matching the language
    const voices = window.speechSynthesis.getVoices();
    const baseLang = preferredLang.split('-')[0];
    const preferredVoice = voices.find(v => v.lang === preferredLang)
      || voices.find(v => v.lang.startsWith(baseLang))
      || voices.find(v => (v.name.includes('Google') || v.name.includes('Microsoft')) && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log('🎙️ TTS: Using browser voice:', preferredVoice.name, 'lang:', preferredVoice.lang);
    } else {
      console.log('🎙️ TTS: No preferred voice found, using default with lang:', preferredLang);
    }

    utterance.onend = () => {
      console.log('🔊 TTS: Browser speech completed');
      if (options?.onEnd) {
        options.onEnd();
      }
      resolve();
    };

    utterance.onerror = (error) => {
      console.error('🚨 TTS: Browser speech error:', error);
      reject(error);
    };

    window.speechSynthesis.speak(utterance);
  });
};

// Test function for voice settings
export const testVoice = async (voice: string): Promise<void> => {
  const testText = `Hello! This is a test of the ${voice} voice. How does it sound?`;
  await speak(testText, voice);
};

// Stop any ongoing speech - exported for compatibility
export const stopSpeaking = (): void => {
  console.log('🛑 TTS: Stopping all speech');
  
  // Stop browser TTS
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  
  // Clear TTS flag and track end time
  (window as any).__tts_is_speaking = false;
  (window as any).__last_tts_end_time = Date.now();
  
  // Dispatch completion event
  window.dispatchEvent(new CustomEvent('tts-completed'));
};

// Alias for compatibility
export const stopCurrentSpeech = stopSpeaking;

// Check if TTS is currently speaking
export const isSpeaking = (): boolean => {
  return !!(window as any).__tts_is_speaking;
};

// API Key validation functions
export const validateElevenLabsApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'API key is required' };
  }

  // ElevenLabs API keys can have various formats, including some that start with "sk-"
  if (apiKey.length < 10) {
    return { valid: false, error: 'API key appears to be too short' };
  }

  try {
    console.log('🔍 Validating ElevenLabs API key...');
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (response.ok) {
      console.log('✅ ElevenLabs API key is valid');
      return { valid: true };
    } else {
      const errorData = await response.json();
      console.error('❌ ElevenLabs API key validation failed:', errorData);
      return { 
        valid: false, 
        error: errorData.detail?.message || `HTTP ${response.status}` 
      };
    }
  } catch (error) {
    console.error('❌ ElevenLabs API key validation error:', error);
    return { 
      valid: false, 
      error: 'Network error during validation' 
    };
  }
};

export const validateMiniMaxApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'JWT token is required' };
  }

  try {
    // Validate JWT structure
    const jwtParts = apiKey.split('.');
    if (jwtParts.length !== 3) {
      return { valid: false, error: 'Invalid JWT format' };
    }

    // Try to decode payload
    const payload = JSON.parse(atob(jwtParts[1]));
    if (!payload.GroupID) {
      return { valid: false, error: 'JWT missing GroupID' };
    }

    console.log('✅ MiniMax JWT token format is valid');
    return { valid: true };
  } catch (error) {
    console.error('❌ MiniMax JWT validation error:', error);
    return { 
      valid: false, 
      error: 'Invalid JWT token format' 
    };
  }
};
