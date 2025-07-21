
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';
import { speechRecognition } from '@/utils/speechRecognitionSingleton';

export interface ConversationState {
  isActive: boolean;
  isListening: boolean;
  currentContext: string | null;
  sessionStartTime: number;
  lastActivity: number;
  brainDumpMode: boolean;
  accumulatedContent: string;
}

export interface VoiceOrchestratorConfig {
  autoStart: boolean;
  wakeWords: string[];
  silenceTimeout: number;
  maxSessionDuration: number;
  brainDumpTimeout: number;
}

const defaultConfig: VoiceOrchestratorConfig = {
  autoStart: true,
  wakeWords: ['hey saveme', 'start listening', 'voice mode'],
  silenceTimeout: 30000,
  maxSessionDuration: 600000,
  brainDumpTimeout: 15000,
};

export const useVoiceOrchestrator = (
  onVoiceInput?: (text: string) => void,
  config: Partial<VoiceOrchestratorConfig> = {}
) => {
  const finalConfig = { ...defaultConfig, ...config };
  const [conversationState, setConversationState] = useState<ConversationState>({
    isActive: false,
    isListening: false,
    currentContext: null,
    sessionStartTime: 0,
    lastActivity: 0,
    brainDumpMode: false,
    accumulatedContent: '',
  });

  const onVoiceInputRef = useRef(onVoiceInput);
  const lastProcessedTranscript = useRef<string>('');
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualStopRef = useRef(false);

  // Update refs when dependencies change
  useEffect(() => {
    onVoiceInputRef.current = onVoiceInput;
  }, [onVoiceInput]);

  const deactivateConversation = useCallback((reason: string = 'Manual') => {
    console.log('🛑 Voice Orchestrator: Deactivating conversation -', reason);
    
    isManualStopRef.current = true;
    
    // Clear session timer
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    // Stop speech recognition
    speechRecognition.stop();

    setConversationState({
      isActive: false,
      isListening: false,
      currentContext: null,
      sessionStartTime: 0,
      lastActivity: 0,
      brainDumpMode: false,
      accumulatedContent: '',
    });

    if (reason === 'Silence timeout') {
      toast.info('💤 Voice mode paused due to inactivity. Say "Hey SaveMe" to reactivate.');
    }
  }, []);

  const activateConversation = useCallback(() => {
    console.log('🚀 Voice Orchestrator: Activating conversation');
    
    isManualStopRef.current = false;
    
    setConversationState(prev => ({
      ...prev,
      isActive: true,
      sessionStartTime: Date.now(),
      lastActivity: Date.now(),
      brainDumpMode: false,
      accumulatedContent: '',
    }));

    // Set session timeout
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(() => {
      deactivateConversation('Session timeout');
    }, finalConfig.maxSessionDuration);

    // Start speech recognition after a brief delay
    setTimeout(() => {
      if (speechRecognition.isSupported()) {
        speechRecognition.start();
        toast.success('🎤 Voice mode activated - I\'m listening!');
      }
    }, 1000);
    
    speak('Voice mode activated. How can I help you?');
  }, [finalConfig.maxSessionDuration, deactivateConversation]);

  // Initialize speech recognition callbacks
  useEffect(() => {
    if (!speechRecognition.isSupported()) {
      return;
    }

    speechRecognition.setCallbacks({
      onResult: (transcript: string) => {
        console.log('🎯 Voice Orchestrator: Received transcript:', transcript);
        
        // Skip if same as last processed
        if (transcript === lastProcessedTranscript.current) {
          console.log('🚫 Voice Orchestrator: Duplicate transcript, skipping');
          return;
        }
        
        // Skip system-like content
        const cleanTranscript = transcript.toLowerCase().trim();
        if (cleanTranscript.length < 3 || 
            cleanTranscript.includes('voice mode') || 
            cleanTranscript.includes('listening') ||
            cleanTranscript.includes('activated')) {
          console.log('🚫 Voice Orchestrator: System-like content, skipping:', transcript);
          return;
        }

        console.log('✅ Voice Orchestrator: Processing user command:', transcript);
        lastProcessedTranscript.current = transcript;
        
        if (onVoiceInputRef.current) {
          onVoiceInputRef.current(transcript);
        }
        
        setConversationState(prev => ({
          ...prev,
          lastActivity: Date.now(),
        }));
      },
      
      onStart: () => {
        console.log('🎤 Voice Orchestrator: Recognition started');
        setConversationState(prev => ({
          ...prev,
          isListening: true,
          lastActivity: Date.now(),
        }));
      },
      
      onEnd: () => {
        console.log('🔚 Voice Orchestrator: Recognition ended');
        setConversationState(prev => ({ ...prev, isListening: false }));
      },
      
      onError: (error: string) => {
        console.error('🚨 Voice Orchestrator: Recognition error:', error);
        
        if (error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone access for voice features.');
          deactivateConversation('Permission denied');
        }
      }
    });

    // Auto-start if configured
    if (finalConfig.autoStart) {
      setTimeout(activateConversation, 1500);
    }

    return () => {
      deactivateConversation('Cleanup');
    };
  }, [finalConfig.autoStart, activateConversation, deactivateConversation]);

  // Handle TTS completion events - improved coordination
  useEffect(() => {
    const handleTTSCompleted = () => {
      console.log('🔊 Voice Orchestrator: TTS completed, checking if should restart recognition');
      
      // Only restart if conversation is active and we're not currently listening
      if (conversationState.isActive && !conversationState.isListening) {
        // Wait a bit longer for TTS to fully complete
        setTimeout(() => {
          if (speechRecognition.isSupported() && !speechRecognition.isCurrentlyListening()) {
            console.log('🔄 Voice Orchestrator: Restarting recognition after TTS completion');
            speechRecognition.start();
          }
        }, 1500);
      }
    };

    const handleTTSStarted = () => {
      console.log('🔊 Voice Orchestrator: TTS started, ensuring recognition is paused');
      // The singleton will handle pausing automatically
    };

    window.addEventListener('tts-completed', handleTTSCompleted);
    window.addEventListener('tts-started', handleTTSStarted);
    
    return () => {
      window.removeEventListener('tts-completed', handleTTSCompleted);
      window.removeEventListener('tts-started', handleTTSStarted);
    };
  }, [conversationState.isActive, conversationState.isListening]);

  return {
    conversationState,
    activateConversation,
    deactivateConversation,
    isSupported: speechRecognition.isSupported(),
  };
};
