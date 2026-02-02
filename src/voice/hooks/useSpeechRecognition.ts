/**
 * useSpeechRecognition Hook
 * Manages speech recognition lifecycle
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { SpeechRecognitionCallbacks } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { ttsFilter } from '../core/TTSFilter';

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  maxAlternatives?: number;
  silenceTimeout?: number;
  maxConsecutiveErrors?: number;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  start: () => boolean;
  stop: () => void;
  toggle: () => void;
  setCallbacks: (callbacks: SpeechRecognitionCallbacks) => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    continuous = true,
    interimResults = true,
    lang = 'en-US',
    maxAlternatives = 1,
    silenceTimeout = DEFAULT_CONFIG.SILENCE_TIMEOUT,
    maxConsecutiveErrors = DEFAULT_CONFIG.MAX_CONSECUTIVE_ERRORS,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const callbacksRef = useRef<SpeechRecognitionCallbacks>({});
  const consecutiveErrorsRef = useRef(0);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedTranscriptRef = useRef('');

  // Check browser support
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  /**
   * Initialize speech recognition
   */
  const initializeRecognition = useCallback(() => {
    if (!isSupported || recognitionRef.current) return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
      console.log('🎤 useSpeechRecognition: Started');
      setIsListening(true);
      consecutiveErrorsRef.current = 0;
      (window as any).__speech_recognition_active = true;

      callbacksRef.current.onStart?.();
      resetSilenceTimeout();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Check TTS state
      if (ttsFilter.isTTSFeedback('')) {
        return;
      }

      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();

        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      setInterimTranscript(interimText);

      if (interimText) {
        callbacksRef.current.onInterim?.(interimText);
      }

      if (finalText && finalText !== lastProcessedTranscriptRef.current) {
        // Skip TTS feedback
        if (ttsFilter.isTTSFeedback(finalText)) {
          console.log('🚫 useSpeechRecognition: Skipping TTS feedback:', finalText);
          return;
        }

        console.log('✅ useSpeechRecognition: Final transcript:', finalText);
        setTranscript(finalText);
        lastProcessedTranscriptRef.current = finalText;

        callbacksRef.current.onResult?.(finalText, true);
        resetSilenceTimeout();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('🚨 useSpeechRecognition: Error:', event.error);
      consecutiveErrorsRef.current++;

      callbacksRef.current.onError?.(event.error);

      // Handle specific errors
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access.');
        setIsListening(false);
        return;
      }

      if (event.error === 'audio-capture') {
        toast.error('No microphone found. Please check your microphone connection.');
        setIsListening(false);
        return;
      }

      if (event.error === 'network') {
        toast.error('Network error. Please check your internet connection.');
        setIsListening(false);
        return;
      }

      // Stop after too many errors
      if (consecutiveErrorsRef.current >= maxConsecutiveErrors) {
        console.log('🛑 useSpeechRecognition: Too many errors, stopping');
        setIsListening(false);
        toast.error('Voice recognition encountered multiple errors. Please restart manually.');
        return;
      }

      // Auto-restart for recoverable errors
      if (['no-speech', 'aborted'].includes(event.error) && !(window as any).__manual_stop) {
        scheduleRestart();
      }
    };

    recognition.onend = () => {
      console.log('🔚 useSpeechRecognition: Ended');
      setIsListening(false);
      (window as any).__speech_recognition_active = false;

      clearSilenceTimeout();
      callbacksRef.current.onEnd?.();

      // Auto-restart if not manually stopped
      if (
        !(window as any).__manual_stop &&
        consecutiveErrorsRef.current < maxConsecutiveErrors
      ) {
        scheduleRestart();
      }
    };

    recognitionRef.current = recognition;
  }, [
    isSupported,
    continuous,
    interimResults,
    lang,
    maxAlternatives,
    maxConsecutiveErrors,
  ]);

  /**
   * Reset silence timeout
   */
  const resetSilenceTimeout = useCallback(() => {
    clearSilenceTimeout();

    silenceTimeoutRef.current = setTimeout(() => {
      if (!(window as any).__manual_stop && isListening) {
        console.log('🔇 useSpeechRecognition: Auto-stopping due to silence');
        stop();
        toast.info('Voice recognition paused due to inactivity');
      }
    }, silenceTimeout);
  }, [silenceTimeout, isListening]);

  /**
   * Clear silence timeout
   */
  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  /**
   * Schedule restart
   */
  const scheduleRestart = useCallback(() => {
    const delay = Math.min(
      1000 * Math.pow(2, consecutiveErrorsRef.current - 1),
      5000
    );

    console.log(`🔄 useSpeechRecognition: Scheduling restart in ${delay}ms`);

    setTimeout(() => {
      if (!(window as any).__manual_stop && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('🚨 useSpeechRecognition: Restart failed:', error);
        }
      }
    }, delay);
  }, []);

  /**
   * Start listening
   */
  const start = useCallback((): boolean => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in this browser.');
      return false;
    }

    initializeRecognition();

    if (!recognitionRef.current) {
      return false;
    }

    if (isListening) {
      console.log('ℹ️ useSpeechRecognition: Already listening');
      return true;
    }

    // Check if TTS is speaking
    if ((window as any).__tts_is_speaking) {
      console.log('⏸️ useSpeechRecognition: Waiting for TTS to finish');
      return false;
    }

    try {
      (window as any).__manual_stop = false;
      consecutiveErrorsRef.current = 0;
      recognitionRef.current.start();
      console.log('🎤 useSpeechRecognition: Started');
      return true;
    } catch (error: any) {
      if (error.name === 'InvalidStateError') {
        console.log('⚠️ useSpeechRecognition: Already started');
        return true;
      }
      console.error('❌ useSpeechRecognition: Start failed:', error);
      return false;
    }
  }, [isSupported, isListening, initializeRecognition]);

  /**
   * Stop listening
   */
  const stop = useCallback(() => {
    console.log('🛑 useSpeechRecognition: Stopping');
    (window as any).__manual_stop = true;

    clearSilenceTimeout();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('❌ useSpeechRecognition: Stop failed:', error);
      }
    }

    setIsListening(false);
  }, [clearSilenceTimeout]);

  /**
   * Toggle listening
   */
  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  /**
   * Set callbacks
   */
  const setCallbacks = useCallback((callbacks: SpeechRecognitionCallbacks) => {
    callbacksRef.current = callbacks;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimeout();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          // Ignore
        }
      }
    };
  }, [clearSilenceTimeout]);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    start,
    stop,
    toggle,
    setCallbacks,
  };
}
