
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
  private restartAttempts = 0;
  private maxRestartAttempts = 3;
  private restartTimeout: NodeJS.Timeout | null = null;

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
      this.restartAttempts = 0; // Reset attempts on successful start
      this.callbacks.onStart?.();
    };

    this.recognition.onresult = (event) => {
      // Skip if TTS is speaking or just finished (increased grace period)
      const now = Date.now();
      const lastTTSEnd = (window as any).__last_tts_end_time || 0;
      const gracePeriod = 1500; // Increased to 1.5 seconds grace period after TTS ends
      
      if ((window as any).__tts_is_speaking || (now - lastTTSEnd < gracePeriod)) {
        console.log('🚫 Recognition Singleton: Skipping - TTS is speaking or just finished');
        return;
      }

      let finalTranscript = '';
      let interimTranscript = '';
      
      console.log('🎤 Recognition Singleton: onresult event:', {
        resultIndex: event.resultIndex,
        resultsLength: event.results.length,
        isTTSSpeaking: (window as any).__tts_is_speaking
      });
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim();
        const confidence = event.results[i][0].confidence;
        
        console.log(`🎤 Recognition Singleton: Result ${i}:`, {
          transcript,
          confidence,
          isFinal: event.results[i].isFinal
        });
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        console.log('🎤 Recognition Singleton: Interim transcript:', interimTranscript);
      }

      if (finalTranscript) {
        console.log('✅ Recognition Singleton: Final transcript received:', finalTranscript);
        console.log('🔄 Recognition Singleton: Calling onResult callback');
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
        this.restartAttempts = this.maxRestartAttempts; // Prevent restart attempts
        return;
      }
      
      // Handle network errors
      if (event.error === 'network') {
        toast.error('Network error in speech recognition. Please check your connection.');
        this.restartAttempts = this.maxRestartAttempts; // Prevent restart attempts
        return;
      }
      
      // Auto-restart for recoverable errors with exponential backoff
      if (event.error === 'no-speech' && !((window as any).__manual_stop)) {
        this.scheduleRestart();
      }
      if (event.error === 'aborted' && !((window as any).__manual_stop) && !((window as any).__tts_is_speaking)) {
        this.scheduleRestart();
      }
    };

    this.recognition.onend = () => {
      console.log('🔚 Recognition Singleton: Ended');
      this.isListening = false;
      this.callbacks.onEnd?.();
      
// Auto-restart if not manually stopped, not during TTS, and within attempt limits
      if (!((window as any).__manual_stop) && !((window as any).__tts_is_speaking) && this.restartAttempts < this.maxRestartAttempts) {
        this.scheduleRestart();
      } else if (this.restartAttempts >= this.maxRestartAttempts) {
        console.log('🛑 Recognition Singleton: Max restart attempts reached');
        toast.info('Voice recognition paused. Click "Start Voice Mode" to resume.');
      }
    };

    isInitialized = true;
    console.log('✅ Recognition Singleton: Initialized');
  }

  private scheduleRestart() {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }
    
    this.restartAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.restartAttempts - 1), 5000); // Exponential backoff, max 5s
    
    console.log(`🔄 Recognition Singleton: Scheduling restart attempt ${this.restartAttempts}/${this.maxRestartAttempts} in ${delay}ms`);
    
    this.restartTimeout = setTimeout(() => {
      this.attemptRestart();
    }, delay);
  }

  private attemptRestart() {
    if (!this.recognition || (window as any).__manual_stop || (window as any).__tts_is_speaking) {
      return;
    }

    // Check actual recognition state instead of just our flag
    const actualState = (this.recognition as any).state;
    if (actualState === 'started' || this.isListening) {
      console.log('🔄 Recognition Singleton: Already listening, skipping restart');
      return;
    }

    try {
      console.log('🔄 Recognition Singleton: Attempting restart');
      // Don't set isListening until onstart fires successfully
      this.recognition.start();
    } catch (error: any) {
      console.log('⚠️ Recognition Singleton: Restart failed:', error);
      
      // Reset listening state on failure
      this.isListening = false;
      
      // Handle specific error types
      if (error.name === 'InvalidStateError' || error.message?.includes('already started')) {
        // Recognition is already running, update our state
        console.log('✅ Recognition Singleton: Recognition already running, updating state');
        this.isListening = true;
        this.restartAttempts = 0;
        return;
      }
      
      if (this.restartAttempts < this.maxRestartAttempts) {
        this.scheduleRestart();
      }
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
      this.restartAttempts = 0; // Reset attempts on manual start
      this.recognition.start();
      console.log('🎤 Recognition Singleton: Started');
      return true;
    } catch (error) {
      if (error.name === 'InvalidStateError') {
        console.log('⚠️ Recognition Singleton: Invalid state, will retry');
        // Don't return false immediately for InvalidStateError, let the restart mechanism handle it
        this.scheduleRestart();
        return false;
      }
      console.error('❌ Recognition Singleton: Start failed:', error);
      return false;
    }
  }

  public stop() {
    if (!this.recognition) return;

    console.log('🛑 Recognition Singleton: Stopping');
    (window as any).__manual_stop = true;
    
    // Clear any pending restart
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('❌ Recognition Singleton: Stop failed:', error);
    }
    
    this.isListening = false;
    this.restartAttempts = 0; // Reset attempts on manual stop
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  public getRestartAttempts(): number {
    return this.restartAttempts;
  }

  public resetRestartAttempts(): void {
    this.restartAttempts = 0;
  }

  public getRecognition(): SpeechRecognition | null {
    return this.recognition;
  }
}

export const speechRecognition = SpeechRecognitionSingleton.getInstance();
