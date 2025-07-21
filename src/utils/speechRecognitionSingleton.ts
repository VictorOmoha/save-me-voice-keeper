
import { toast } from 'sonner';

// Global singleton instance
let recognitionInstance: SpeechRecognition | null = null;
let isInitialized = false;

export class SpeechRecognitionSingleton {
  private static instance: SpeechRecognitionSingleton;
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private callbacks: {
    onResult?: (transcript: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  } = {};

  private constructor() {
    this.initializeRecognition();
  }

  static getInstance(): SpeechRecognitionSingleton {
    if (!SpeechRecognitionSingleton.instance) {
      SpeechRecognitionSingleton.instance = new SpeechRecognitionSingleton();
    }
    return SpeechRecognitionSingleton.instance;
  }

  private initializeRecognition() {
    if (isInitialized || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (recognitionInstance) {
      this.recognition = recognitionInstance;
      return;
    }

    this.recognition = new SpeechRecognition();
    recognitionInstance = this.recognition;

    // Configure recognition
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.recognition.onstart = () => {
      console.log('🎤 Recognition Singleton: Started listening');
      this.isListening = true;
      this.callbacks.onStart?.();
    };

    this.recognition.onresult = (event) => {
      // Skip if TTS is speaking
      if ((window as any).__tts_is_speaking) {
        console.log('🚫 Recognition Singleton: Skipping - TTS is speaking');
        return;
      }

      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript) {
        console.log('✅ Recognition Singleton: Processing transcript:', finalTranscript);
        this.callbacks.onResult?.(finalTranscript);
        
        // Dispatch transcript update event
        window.dispatchEvent(new CustomEvent('voice-transcript-update', {
          detail: { transcript: finalTranscript }
        }));
      }
    };

    this.recognition.onerror = (event) => {
      console.error('🚨 Recognition Singleton: Error:', event.error);
      this.callbacks.onError?.(event.error);
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone access.');
        return;
      }
      
      // Auto-restart for recoverable errors
      if (['no-speech', 'aborted'].includes(event.error) && !((window as any).__manual_stop)) {
        setTimeout(() => this.attemptRestart(), 2000);
      }
    };

    this.recognition.onend = () => {
      console.log('🔚 Recognition Singleton: Ended');
      this.isListening = false;
      this.callbacks.onEnd?.();
      
      // Auto-restart if not manually stopped
      if (!((window as any).__manual_stop)) {
        setTimeout(() => this.attemptRestart(), 1000);
      }
    };

    isInitialized = true;
    console.log('✅ Recognition Singleton: Initialized');
  }

  private attemptRestart() {
    if (!this.recognition || (window as any).__manual_stop || (window as any).__tts_is_speaking) {
      return;
    }

    try {
      console.log('🔄 Recognition Singleton: Attempting restart');
      this.recognition.start();
    } catch (error) {
      console.log('⚠️ Recognition Singleton: Restart failed:', error);
    }
  }

  public setCallbacks(callbacks: {
    onResult?: (transcript: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  }) {
    this.callbacks = callbacks;
  }

  public start(): boolean {
    if (!this.recognition) {
      console.error('❌ Recognition Singleton: Not initialized');
      return false;
    }

    if (this.isListening) {
      console.log('ℹ️ Recognition Singleton: Already listening');
      return true;
    }

    if ((window as any).__tts_is_speaking) {
      console.log('⏸️ Recognition Singleton: Waiting for TTS to finish');
      return false;
    }

    try {
      (window as any).__manual_stop = false;
      this.recognition.start();
      console.log('🎤 Recognition Singleton: Started');
      return true;
    } catch (error) {
      console.error('❌ Recognition Singleton: Start failed:', error);
      return false;
    }
  }

  public stop() {
    if (!this.recognition) return;

    console.log('🛑 Recognition Singleton: Stopping');
    (window as any).__manual_stop = true;
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('❌ Recognition Singleton: Stop failed:', error);
    }
    
    this.isListening = false;
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}

export const speechRecognition = SpeechRecognitionSingleton.getInstance();
