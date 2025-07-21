import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';

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
  silenceTimeout: 10000,
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

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const brainDumpTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);
  const onVoiceInputRef = useRef(onVoiceInput);
  const lastProcessedTranscript = useRef<string>('');
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ttsCompletionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use refs for current state to avoid stale closures
  const currentStateRef = useRef(conversationState);
  const isManualStopRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    currentStateRef.current = conversationState;
  }, [conversationState]);

  useEffect(() => {
    onVoiceInputRef.current = onVoiceInput;
  }, [onVoiceInput]);

  // Improved recognition restart logic with better timing
  const attemptRecognitionRestart = useCallback(() => {
    console.log('🔄 Voice Orchestrator: Attempting recognition restart', {
      isActive: currentStateRef.current.isActive,
      isListening: currentStateRef.current.isListening,
      hasRecognition: !!recognitionRef.current,
      isManualStop: isManualStopRef.current,
      ttsIsSpeaking: (window as any).__tts_is_speaking,
      documentHidden: document.hidden
    });

    // Clear any pending restart attempts
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    // Only restart if conditions are met
    if (!currentStateRef.current.isActive || 
        currentStateRef.current.isListening || 
        !recognitionRef.current || 
        isManualStopRef.current ||
        (window as any).__tts_is_speaking ||
        document.hidden) {
      console.log('🚫 Voice Orchestrator: Skipping restart - conditions not met');
      return;
    }

    // Additional delay to ensure TTS is completely finished
    setTimeout(() => {
      if ((window as any).__tts_is_speaking) {
        console.log('🚫 Voice Orchestrator: TTS still speaking, delaying restart');
        return;
      }

      try {
        console.log('🎤 Voice Orchestrator: Starting recognition restart');
        recognitionRef.current?.start();
      } catch (error) {
        console.log('⚠️ Voice Orchestrator: Restart failed, will retry:', error);
        // Retry after a delay if restart fails
        restartTimeoutRef.current = setTimeout(attemptRecognitionRestart, 1500);
      }
    }, 500);
  }, []);

  const deactivateConversation = useCallback((reason: string = 'Manual') => {
    console.log('🛑 Voice Orchestrator: Deactivating conversation -', reason);
    
    isManualStopRef.current = true;
    
    // Clear all timers
    [silenceTimerRef, sessionTimerRef, brainDumpTimerRef, restartTimeoutRef, ttsCompletionTimeoutRef].forEach(timer => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    });

    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log('Error stopping recognition:', error);
      }
    }

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

    // Start recognition after TTS completes
    if (recognitionRef.current) {
      setTimeout(() => {
        if (!(window as any).__tts_is_speaking) {
          try {
            recognitionRef.current?.start();
            toast.success('🎤 Voice mode activated - I\'m listening!');
          } catch (error) {
            console.error('Failed to start recognition:', error);
          }
        }
      }, 1000);
      
      speak('Voice mode activated. How can I help you?');
    }

    // Set session timeout
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(() => {
      deactivateConversation('Session timeout');
    }, finalConfig.maxSessionDuration);
  }, [finalConfig.maxSessionDuration, deactivateConversation]);

  // Initialize speech recognition once
  useEffect(() => {
    if (isInitialized.current || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Voice Orchestrator: Started listening');
      setConversationState(prev => ({
        ...prev,
        isListening: true,
        lastActivity: Date.now(),
      }));
    };

    recognition.onresult = (event) => {
      // Enhanced TTS detection
      if ((window as any).__tts_is_speaking) {
        console.log('🚫 Voice Orchestrator: Skipping recognition result - TTS is speaking');
        return;
      }

      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript && finalTranscript !== lastProcessedTranscript.current && onVoiceInputRef.current) {
        // Additional filtering for user commands
        const cleanTranscript = finalTranscript.toLowerCase().trim();
        
        // Skip very short or obvious system content
        if (cleanTranscript.length < 3 || 
            cleanTranscript.includes('voice mode') || 
            cleanTranscript.includes('listening') ||
            cleanTranscript.includes('activated')) {
          console.log('🚫 Voice Orchestrator: Skipping system-like content:', finalTranscript);
          return;
        }

        console.log('✅ Voice Orchestrator: Processing user transcript:', finalTranscript);
        lastProcessedTranscript.current = finalTranscript;
        onVoiceInputRef.current(finalTranscript);
        
        setConversationState(prev => ({
          ...prev,
          lastActivity: Date.now(),
        }));
      }
    };

    recognition.onerror = (event) => {
      console.error('🚨 Voice Orchestrator: Recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access for voice features.');
        deactivateConversation('Permission denied');
        return;
      }

      // For other errors, attempt restart after delay
      if (currentStateRef.current.isActive && !isManualStopRef.current) {
        console.log('🔄 Voice Orchestrator: Scheduling restart after error');
        restartTimeoutRef.current = setTimeout(attemptRecognitionRestart, 2000);
      }
    };

    recognition.onend = () => {
      console.log('🔚 Voice Orchestrator: Recognition ended', {
        isActive: currentStateRef.current.isActive,
        isManualStop: isManualStopRef.current,
        ttsIsSpeaking: (window as any).__tts_is_speaking
      });
      
      setConversationState(prev => ({ ...prev, isListening: false }));

      // Schedule restart if conversation is still active and not manually stopped
      if (currentStateRef.current.isActive && !isManualStopRef.current) {
        console.log('🔄 Voice Orchestrator: Scheduling auto-restart');
        restartTimeoutRef.current = setTimeout(attemptRecognitionRestart, 1000);
      }
    };

    recognitionRef.current = recognition;
    isInitialized.current = true;

    // Auto-start if configured
    if (finalConfig.autoStart) {
      setTimeout(activateConversation, 1500);
    }

    return () => {
      deactivateConversation('Cleanup');
      isInitialized.current = false;
    };
  }, []); // Empty dependency array - initialize only once

  // Improved TTS completion event handling
  useEffect(() => {
    const handleTTSCompleted = () => {
      console.log('🔊 Voice Orchestrator: TTS completed, preparing to restart recognition');
      
      // Clear any existing timeout
      if (ttsCompletionTimeoutRef.current) {
        clearTimeout(ttsCompletionTimeoutRef.current);
      }
      
      // Wait longer for TTS to fully complete, then attempt restart
      ttsCompletionTimeoutRef.current = setTimeout(() => {
        if (currentStateRef.current.isActive && !currentStateRef.current.isListening) {
          console.log('🔄 Voice Orchestrator: Attempting restart after TTS completion');
          attemptRecognitionRestart();
        }
      }, 2000);
    };

    const handleTTSStarted = () => {
      console.log('🔊 Voice Orchestrator: TTS started - pausing recognition');
      // TTS started - recognition should be paused
    };

    window.addEventListener('tts-completed', handleTTSCompleted);
    window.addEventListener('tts-started', handleTTSStarted);
    
    return () => {
      window.removeEventListener('tts-completed', handleTTSCompleted);
      window.removeEventListener('tts-started', handleTTSStarted);
      if (ttsCompletionTimeoutRef.current) {
        clearTimeout(ttsCompletionTimeoutRef.current);
      }
    };
  }, [attemptRecognitionRestart]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && conversationState.isActive) {
        console.log('📱 Voice Orchestrator: Page hidden, pausing conversation');
        isManualStopRef.current = true;
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (error) {
            console.log('Error stopping recognition on visibility change:', error);
          }
        }
      } else if (!document.hidden && conversationState.isActive) {
        console.log('📱 Voice Orchestrator: Page visible, resuming conversation');
        isManualStopRef.current = false;
        setTimeout(attemptRecognitionRestart, 800);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [conversationState.isActive, attemptRecognitionRestart]);

  // Periodic health check to ensure recognition is running when it should be
  useEffect(() => {
    if (!conversationState.isActive) return;

    const healthCheck = setInterval(() => {
      if (currentStateRef.current.isActive && 
          !currentStateRef.current.isListening && 
          !isManualStopRef.current &&
          !(window as any).__tts_is_speaking &&
          !document.hidden) {
        console.log('🏥 Voice Orchestrator: Health check - restarting stalled recognition');
        attemptRecognitionRestart();
      }
    }, 8000);

    return () => clearInterval(healthCheck);
  }, [conversationState.isActive, attemptRecognitionRestart]);

  return {
    conversationState,
    activateConversation,
    deactivateConversation,
    isSupported: isInitialized.current,
  };
};
