
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
  silenceTimeout: 8000,
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

  // Update the ref when callback changes
  useEffect(() => {
    onVoiceInputRef.current = onVoiceInput;
  }, [onVoiceInput]);

  // Stable callback functions using useCallback
  const deactivateConversation = useCallback((reason: string = 'Manual') => {
    console.log('🛑 Voice Orchestrator: Deactivating conversation -', reason);
    
    // Clear all timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (brainDumpTimerRef.current) {
      clearTimeout(brainDumpTimerRef.current);
      brainDumpTimerRef.current = null;
    }

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
    
    setConversationState(prev => ({
      ...prev,
      isActive: true,
      sessionStartTime: Date.now(),
      lastActivity: Date.now(),
      brainDumpMode: false,
      accumulatedContent: '',
    }));

    // Start recognition if available and not already running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        toast.success('🎤 Voice mode activated - I\'m listening!');
        speak('Voice mode activated. How can I help you?');
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
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
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript && onVoiceInputRef.current) {
        console.log('🗣️ Voice Orchestrator: Processing transcript:', finalTranscript);
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
    };

    recognition.onend = () => {
      console.log('🔚 Voice Orchestrator: Recognition ended');
      setConversationState(prev => ({ ...prev, isListening: false }));

      // Auto-restart if conversation is still active
      setTimeout(() => {
        if (conversationState.isActive && recognitionRef.current && !document.hidden) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.log('Auto-restart failed:', error);
          }
        }
      }, 500);
    };

    recognitionRef.current = recognition;
    isInitialized.current = true;

    // Auto-start if configured
    if (finalConfig.autoStart) {
      setTimeout(activateConversation, 1000);
    }

    return () => {
      deactivateConversation('Cleanup');
      isInitialized.current = false;
    };
  }, []); // Empty dependency array - initialize only once

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
