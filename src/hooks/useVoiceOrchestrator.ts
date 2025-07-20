
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
  silenceTimeout: 8000, // 8 seconds
  maxSessionDuration: 600000, // 10 minutes
  brainDumpTimeout: 15000, // 15 seconds for brain dump mode
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

  // Initialize speech recognition with ambient listening
  const initializeVoiceRecognition = useCallback(() => {
    if (isInitialized.current || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    let interimTranscript = '';

    recognition.onstart = () => {
      console.log('🎤 Voice Orchestrator: Started listening');
      setConversationState(prev => ({
        ...prev,
        isListening: true,
        lastActivity: Date.now(),
      }));
    };

    recognition.onresult = (event) => {
      finalTranscript = '';
      interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update activity timestamp
      setConversationState(prev => ({
        ...prev,
        lastActivity: Date.now(),
        accumulatedContent: conversationState.brainDumpMode 
          ? prev.accumulatedContent + ' ' + (finalTranscript || interimTranscript)
          : finalTranscript || interimTranscript,
      }));

      // Process final results
      if (finalTranscript) {
        console.log('🗣️ Voice Orchestrator: Processing transcript:', finalTranscript);
        
        // Check for wake words if not active
        if (!conversationState.isActive && containsWakeWord(finalTranscript)) {
          activateConversation();
          return;
        }

        // Check for brain dump mode activation
        if (isBrainDumpCommand(finalTranscript)) {
          enterBrainDumpMode();
          return;
        }

        // Process voice input
        if (onVoiceInput && conversationState.isActive) {
          onVoiceInput(finalTranscript);
        }

        // Reset silence timer
        resetSilenceTimer();
      }
    };

    recognition.onerror = (event) => {
      console.error('🚨 Voice Orchestrator: Recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access for voice features.');
        return;
      }

      if (event.error !== 'aborted' && conversationState.isActive) {
        // Auto-restart on recoverable errors
        setTimeout(() => {
          if (conversationState.isActive && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.log('Failed to restart recognition:', error);
            }
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('🔚 Voice Orchestrator: Recognition ended');
      setConversationState(prev => ({ ...prev, isListening: false }));

      // Auto-restart if conversation is still active
      if (conversationState.isActive && !document.hidden) {
        setTimeout(() => {
          if (conversationState.isActive && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.log('Auto-restart failed:', error);
            }
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;
    isInitialized.current = true;

    // Auto-start if configured
    if (finalConfig.autoStart) {
      setTimeout(() => {
        activateConversation();
      }, 1000); // Small delay to ensure component is mounted
    }
  }, [conversationState, onVoiceInput, finalConfig.autoStart]);

  // Wake word detection
  const containsWakeWord = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return finalConfig.wakeWords.some(wakeWord => lowerText.includes(wakeWord));
  };

  // Brain dump command detection
  const isBrainDumpCommand = (text: string): boolean => {
    const brainDumpTriggers = ['brain dump', 'long note', 'ramble mode', 'extended input'];
    const lowerText = text.toLowerCase();
    return brainDumpTriggers.some(trigger => lowerText.includes(trigger));
  };

  // Activate conversation mode
  const activateConversation = useCallback(() => {
    console.log('🚀 Voice Orchestrator: Activating conversation');
    
    setConversationState(prev => ({
      ...prev,
      isActive: true,
      sessionStartTime: Date.now(),
      lastActivity: Date.now(),
      brainDumpMode: false,
      accumulatedContent: '',
    }));

    // Start recognition if not already running
    if (recognitionRef.current && !conversationState.isListening) {
      try {
        recognitionRef.current.start();
        toast.success('🎤 Voice mode activated - I\'m listening!');
        speak('I\'m ready to help. What would you like to do?');
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }

    // Set session timeout
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    sessionTimerRef.current = setTimeout(() => {
      deactivateConversation('Session timeout');
    }, finalConfig.maxSessionDuration);

    resetSilenceTimer();
  }, [conversationState.isListening, finalConfig.maxSessionDuration]);

  // Enter brain dump mode
  const enterBrainDumpMode = useCallback(() => {
    console.log('🧠 Voice Orchestrator: Entering brain dump mode');
    
    setConversationState(prev => ({
      ...prev,
      brainDumpMode: true,
      accumulatedContent: '',
    }));

    toast.info('🧠 Brain dump mode activated - speak freely!');
    speak('Brain dump mode activated. Share your thoughts and I\'ll organize them for you.');

    // Set brain dump timeout
    if (brainDumpTimerRef.current) clearTimeout(brainDumpTimerRef.current);
    brainDumpTimerRef.current = setTimeout(() => {
      processBrainDump();
    }, finalConfig.brainDumpTimeout);
  }, [finalConfig.brainDumpTimeout]);

  // Process accumulated brain dump content
  const processBrainDump = useCallback(() => {
    if (conversationState.accumulatedContent.trim()) {
      console.log('🧠 Processing brain dump:', conversationState.accumulatedContent);
      
      // Send accumulated content for processing
      if (onVoiceInput) {
        onVoiceInput(`BRAIN_DUMP: ${conversationState.accumulatedContent}`);
      }

      toast.success('🧠 Brain dump processed and organized!');
      speak('Great! I\'ve organized your thoughts. What would you like to do next?');
    }

    setConversationState(prev => ({
      ...prev,
      brainDumpMode: false,
      accumulatedContent: '',
    }));
  }, [conversationState.accumulatedContent, onVoiceInput]);

  // Reset silence timer
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    silenceTimerRef.current = setTimeout(() => {
      if (conversationState.isActive) {
        const timeSinceLastActivity = Date.now() - conversationState.lastActivity;
        if (timeSinceLastActivity >= finalConfig.silenceTimeout) {
          deactivateConversation('Silence timeout');
        }
      }
    }, finalConfig.silenceTimeout);
  }, [conversationState.isActive, conversationState.lastActivity, finalConfig.silenceTimeout]);

  // Deactivate conversation
  const deactivateConversation = useCallback((reason: string = 'Manual') => {
    console.log('🛑 Voice Orchestrator: Deactivating conversation -', reason);
    
    // Clear all timers
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (brainDumpTimerRef.current) clearTimeout(brainDumpTimerRef.current);

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

  // Initialize on mount
  useEffect(() => {
    initializeVoiceRecognition();

    return () => {
      deactivateConversation('Cleanup');
    };
  }, [initializeVoiceRecognition, deactivateConversation]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && conversationState.isActive) {
        deactivateConversation('Page hidden');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [conversationState.isActive, deactivateConversation]);

  return {
    conversationState,
    activateConversation,
    deactivateConversation,
    isSupported: isInitialized.current,
  };
};
