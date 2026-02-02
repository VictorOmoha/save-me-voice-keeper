import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CapturedEntry {
  text: string;
  category: string;
  actionItem?: string;
  dueDate?: string;
}

interface TryVoiceCaptureProps {
  onSignupClick: () => void;
  theme: 'light' | 'dark';
}

export const TryVoiceCapture: React.FC<TryVoiceCaptureProps> = ({ onSignupClick, theme }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [capturedEntry, setCapturedEntry] = useState<CapturedEntry | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedVoice, setHasTriedVoice] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      }
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        setIsListening(false);
        if (transcript) {
          processTranscript(transcript);
        }
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported]);

  const processTranscript = (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setHasTriedVoice(true);

    setTimeout(() => {
      const entry: CapturedEntry = {
        text: text.trim(),
        category: detectCategory(text),
      };

      const actionMatch = text.match(/(?:remind|call|email|send|schedule|book|meet|buy|pick up|get|do|finish|complete|submit)\s+(.+?)(?:\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|by|before|at|on))?/i);
      if (actionMatch) {
        entry.actionItem = actionMatch[0].trim();
      }

      if (/tomorrow/i.test(text)) {
        entry.dueDate = "Tomorrow";
      } else if (/today/i.test(text)) {
        entry.dueDate = "Today";
      } else if (/next week/i.test(text)) {
        entry.dueDate = "Next week";
      } else {
        const dayMatch = text.match(/(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
        if (dayMatch) {
          entry.dueDate = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase();
        }
      }

      setCapturedEntry(entry);
      setIsProcessing(false);

      const stored = JSON.parse(localStorage.getItem('saveme_demo_entries') || '[]');
      stored.push({ ...entry, timestamp: new Date().toISOString() });
      localStorage.setItem('saveme_demo_entries', JSON.stringify(stored));
    }, 800);
  };

  const detectCategory = (text: string): string => {
    const lower = text.toLowerCase();
    
    if (/meeting|work|project|client|deadline|report|presentation|boss|colleague|office/i.test(lower)) return "Work";
    if (/buy|pay|money|budget|invoice|expense|cost|price|bank|payment/i.test(lower)) return "Finance";
    if (/doctor|health|medicine|appointment|prescription|symptom|exercise|gym/i.test(lower)) return "Health";
    if (/mom|dad|family|birthday|anniversary|call|dinner|vacation|trip/i.test(lower)) return "Personal";
    if (/idea|creative|podcast|blog|content|video|article|book|write/i.test(lower)) return "Ideas";
    
    return "Personal";
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript("");
    setCapturedEntry(null);
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
    if (transcript) {
      processTranscript(transcript);
    }
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const tryAgain = () => {
    setTranscript("");
    setCapturedEntry(null);
    setError(null);
  };

  if (!isSupported) {
    return (
      <div className={`text-center p-8 rounded-2xl ${theme === 'dark' ? 'bg-zinc-900/50 border border-zinc-800' : 'bg-zinc-100 border border-zinc-200'}`}>
        <p className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}>
          Voice input requires a modern browser. Try Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {!capturedEntry ? (
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
              </>
            )}
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
                isListening
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : theme === 'dark'
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-2 border-zinc-700 hover:border-primary/50'
                    : 'bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 border-2 border-zinc-300 hover:border-primary/50 shadow-lg'
              }`}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
            >
              {isProcessing ? <Loader2 className="w-12 h-12 animate-spin" /> : isListening ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
            </button>
          </div>

          <div className="h-8">
            {isListening ? (
              <p className="font-mono text-sm tracking-wider animate-pulse text-primary">LISTENING...</p>
            ) : isProcessing ? (
              <p className={`font-mono text-sm tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>PROCESSING...</p>
            ) : (
              <p className={`font-mono text-sm tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>TAP TO SPEAK</p>
            )}
          </div>

          {transcript && (
            <div className={`p-4 rounded-lg font-mono text-sm ${theme === 'dark' ? 'bg-zinc-900/80 text-zinc-300 border border-zinc-800' : 'bg-white text-zinc-700 border border-zinc-200 shadow-sm'}`}>
              <span className="text-primary">🎤</span> "{transcript}"
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {!isListening && !transcript && !hasTriedVoice && (
            <p className={`text-sm max-w-sm mx-auto ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Try saying: "Remind me to call mom tomorrow" or "Save this idea for my podcast"
            </p>
          )}
        </div>
      ) : (
        <div className={`rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-zinc-900/80 border border-zinc-800' : 'bg-white border border-zinc-200 shadow-xl'}`}>
          <div className={`px-6 py-4 flex items-center gap-3 ${theme === 'dark' ? 'bg-primary/10 border-b border-zinc-800' : 'bg-primary/5 border-b border-zinc-200'}`}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Captured!</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>See how SaveMe organizes your voice</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <p className={`text-xs font-mono uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>You said:</p>
              <p className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}>"{capturedEntry.text}"</p>
            </div>

            <div className={`space-y-2 pt-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className={`text-xs font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>AI detected:</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>
                  📁 {capturedEntry.category}
                </span>
                {capturedEntry.actionItem && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${theme === 'dark' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                    ⚡ Action item
                  </span>
                )}
                {capturedEntry.dueDate && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                    📅 {capturedEntry.dueDate}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={`px-6 py-4 flex flex-col sm:flex-row gap-3 ${theme === 'dark' ? 'bg-zinc-900/50 border-t border-zinc-800' : 'bg-zinc-50 border-t border-zinc-200'}`}>
            <Button onClick={onSignupClick} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              Sign up to keep this
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={tryAgain} className={theme === 'dark' ? 'border-zinc-700' : ''}>
              Try another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TryVoiceCapture;
