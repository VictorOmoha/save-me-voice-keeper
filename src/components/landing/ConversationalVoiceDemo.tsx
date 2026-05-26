/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Sparkles, ArrowRight, Check, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoSpeak, demoStopSpeaking, demoIsSpeaking, isCloudTtsAvailable } from "@/utils/demoTTS";

type ConversationState = 
  | 'idle' 
  | 'listening' 
  | 'processing' 
  | 'confirming' 
  | 'waiting_response'
  | 'editing_title'
  | 'editing_category'
  | 'saved';

interface DetectedEntry {
  text: string;
  category: string;
  suggestedTitle: string;
  confidence: number;
  actionItem?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  people?: string[];
}

interface ConversationalVoiceDemoProps {
  onSignupClick: () => void;
  theme: 'light' | 'dark';
}

// Category definitions
const CATEGORIES: Record<string, { keywords: string[]; icon: string }> = {
  Work: { keywords: ['meeting', 'work', 'project', 'client', 'deadline', 'report', 'presentation', 'boss', 'colleague', 'office', 'team', 'sprint', 'standup'], icon: '💼' },
  Finance: { keywords: ['buy', 'pay', 'money', 'budget', 'invoice', 'expense', 'cost', 'price', 'bank', 'payment', 'credit', 'bill'], icon: '💰' },
  Health: { keywords: ['doctor', 'health', 'medicine', 'appointment', 'prescription', 'exercise', 'gym', 'workout', 'fitness', 'diet'], icon: '🏥' },
  Personal: { keywords: ['mom', 'dad', 'family', 'birthday', 'anniversary', 'dinner', 'friend', 'kids', 'wife', 'husband', 'home'], icon: '👤' },
  Ideas: { keywords: ['idea', 'creative', 'podcast', 'blog', 'content', 'video', 'article', 'book', 'write', 'brainstorm'], icon: '💡' },
  Travel: { keywords: ['flight', 'hotel', 'trip', 'vacation', 'travel', 'airport', 'booking', 'destination'], icon: '✈️' },
  Shopping: { keywords: ['amazon', 'order', 'shopping', 'store', 'delivery', 'package', 'groceries'], icon: '🛒' },
  Learning: { keywords: ['course', 'study', 'learn', 'class', 'tutorial', 'lesson', 'training', 'read'], icon: '📚' },
  Spiritual: { keywords: ['prayer', 'meditation', 'journal', 'reflection', 'gratitude', 'faith', 'church', 'intention'], icon: '🙏' },
};

const ACTION_VERBS = ['remind', 'call', 'email', 'send', 'schedule', 'book', 'meet', 'buy', 'pick up', 'get', 'do', 'finish', 'complete', 'submit', 'check', 'follow up', 'contact', 'text', 'pay'];

const debugVoiceDemo = (...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export const ConversationalVoiceDemo: React.FC<ConversationalVoiceDemoProps> = ({ onSignupClick, theme }) => {
  const [state, setState] = useState<ConversationState>('idle');
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [detectedEntry, setDetectedEntry] = useState<DetectedEntry | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ speaker: 'user' | 'assistant'; text: string }>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCloudTts, setUsingElevenLabs] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const transcriptRef = useRef(transcript);

  // Keep refs in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Check ElevenLabs availability on mount
  useEffect(() => {
    setUsingElevenLabs(isCloudTtsAvailable());
  }, []);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [conversationHistory, interimTranscript]);

  // Text-to-speech function using our demo TTS
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!voiceEnabled) {
      onEnd?.();
      return;
    }

    demoSpeak(text, {
      voice: 'rachel',
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        onEnd?.();
      },
    });
  }, [voiceEnabled]);

  // Add message to conversation history
  const addMessage = useCallback((speaker: 'user' | 'assistant', text: string) => {
    setConversationHistory(prev => [...prev, { speaker, text }]);
  }, []);

  // Detection functions
  const detectCategory = (text: string): { category: string; confidence: number } => {
    const lower = text.toLowerCase();
    let bestCategory = 'Personal';
    let maxScore = 0;

    for (const [category, data] of Object.entries(CATEGORIES)) {
      let score = 0;
      for (const keyword of data.keywords) {
        if (lower.includes(keyword)) score++;
      }
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }

    return { category: bestCategory, confidence: maxScore > 0 ? 0.8 : 0.5 };
  };

  const generateTitle = (text: string): string => {
    for (const verb of ACTION_VERBS) {
      const regex = new RegExp(`${verb}\\s+(.{3,30})(?:\\s+(?:tomorrow|today|on|at|by)|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        const title = verb.charAt(0).toUpperCase() + verb.slice(1) + ' ' + match[1].trim();
        return title.length > 40 ? title.substring(0, 40) + '...' : title;
      }
    }
    const words = text.split(' ').slice(0, 5).join(' ');
    return words.length > 40 ? words.substring(0, 40) + '...' : words;
  };

  const detectDueDate = (text: string): string | undefined => {
    const lower = text.toLowerCase();
    if (/\btoday\b/.test(lower)) return "Today";
    if (/\btomorrow\b/.test(lower)) return "Tomorrow";
    if (/\bthis week\b/.test(lower)) return "This week";
    if (/\bnext week\b/.test(lower)) return "Next week";
    const dayMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    if (dayMatch) return dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1);
    return undefined;
  };

  const detectPriority = (text: string): 'high' | 'medium' | 'low' | undefined => {
    const lower = text.toLowerCase();
    if (/urgent|asap|immediately|critical|important/.test(lower)) return 'high';
    if (/soon|this week|should|need to/.test(lower)) return 'medium';
    return undefined;
  };

  const detectPeople = (text: string): string[] => {
    const people: string[] = [];
    const patterns = [
      /(?:call|email|text|meet|contact|tell|ask)\s+([A-Z][a-z]+)/g,
      /(?:with|from|to)\s+([A-Z][a-z]+)(?:\s|$)/g,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'The', 'This', 'That'].includes(match[1])) {
          people.push(match[1]);
        }
      }
    }
    return [...new Set(people)];
  };

  // Start listening helper
  const doStartListening = useCallback(() => {
    if (!recognitionRef.current) {
      debugVoiceDemo('[VoiceDemo] No recognition ref');
      return;
    }
    if (demoIsSpeaking()) {
      debugVoiceDemo('[VoiceDemo] TTS is speaking, not starting recognition');
      return;
    }
    
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    transcriptRef.current = "";

    try {
      debugVoiceDemo('[VoiceDemo] Starting recognition...');
      recognitionRef.current.start();
      debugVoiceDemo('[VoiceDemo] Recognition started');
    } catch (e) {
      console.error('[VoiceDemo] Failed to start recognition:', e);
    }
  }, []);

  // Process the user's voice input
  const processInput = useCallback((text: string) => {
    debugVoiceDemo('[VoiceDemo] Processing input:', text);
    setState('processing');
    addMessage('user', text);

    setTimeout(() => {
      const { category, confidence } = detectCategory(text);
      const entry: DetectedEntry = {
        text: text.trim(),
        category,
        suggestedTitle: generateTitle(text),
        confidence,
        dueDate: detectDueDate(text),
        priority: detectPriority(text),
        people: detectPeople(text),
        actionItem: ACTION_VERBS.some(v => text.toLowerCase().includes(v)) ? text : undefined,
      };

      setDetectedEntry(entry);
      setState('confirming');

      let response = `Got it! I'll save this as a ${category} entry`;
      if (entry.dueDate) response += ` with a reminder for ${entry.dueDate}`;
      if (entry.priority === 'high') response += `. I marked it as high priority`;
      response += `. The title will be "${entry.suggestedTitle}". Say "save" to confirm, "change title" to edit, or "change category" for a different one.`;

      addMessage('assistant', response);
      speak(response, () => {
        setState('waiting_response');
        doStartListening();
      });
    }, 500);
  }, [addMessage, speak, doStartListening]);

  // Handle user's response during conversation
  const handleResponse = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    const currentState = stateRef.current;
    debugVoiceDemo('[VoiceDemo] Handling response:', text, 'state:', currentState);
    addMessage('user', text);

    if (currentState === 'waiting_response') {
      if (/^(save|yes|confirm|ok|okay|sure|do it|go ahead|yep|yeah)/.test(lower)) {
        setState('saved');
        const savedMsg = `Saved! Your ${detectedEntry?.category} entry "${detectedEntry?.suggestedTitle}" has been stored.`;
        addMessage('assistant', savedMsg);
        speak(savedMsg);

        const stored = JSON.parse(localStorage.getItem('saveme_demo_entries') || '[]');
        stored.push({ ...detectedEntry, timestamp: new Date().toISOString() });
        localStorage.setItem('saveme_demo_entries', JSON.stringify(stored));

      } else if (/change\s*(the\s*)?title|edit\s*title|different\s*title/.test(lower)) {
        setState('editing_title');
        const msg = "What would you like to call this entry?";
        addMessage('assistant', msg);
        speak(msg, () => doStartListening());

      } else if (/change\s*(the\s*)?category|different\s*category|edit\s*category/.test(lower)) {
        setState('editing_category');
        const categories = Object.keys(CATEGORIES).join(', ');
        const msg = `Which category? Options are: ${categories}`;
        addMessage('assistant', msg);
        speak(msg, () => doStartListening());

      } else if (/^(cancel|nevermind|never\s*mind|stop|no|don't)/.test(lower)) {
        setState('idle');
        const msg = "Okay, cancelled. Tap the mic when you're ready to try again.";
        addMessage('assistant', msg);
        speak(msg);
        setDetectedEntry(null);
        setConversationHistory([]);

      } else {
        const msg = "I didn't catch that. Say 'save' to confirm, 'change title', 'change category', or 'cancel'.";
        addMessage('assistant', msg);
        speak(msg, () => doStartListening());
      }
    } else if (currentState === 'editing_title') {
      if (detectedEntry) {
        const newTitle = text.trim();
        setDetectedEntry({ ...detectedEntry, suggestedTitle: newTitle });
        setState('waiting_response');
        const msg = `Title updated to "${newTitle}". Say "save" to confirm.`;
        addMessage('assistant', msg);
        speak(msg, () => doStartListening());
      }
    } else if (currentState === 'editing_category') {
      const matchedCategory = Object.keys(CATEGORIES).find(c => 
        lower.includes(c.toLowerCase())
      );
      if (matchedCategory && detectedEntry) {
        setDetectedEntry({ ...detectedEntry, category: matchedCategory });
        setState('waiting_response');
        const msg = `Category changed to ${matchedCategory}. Say "save" to confirm.`;
        addMessage('assistant', msg);
        speak(msg, () => doStartListening());
      } else {
        const msg = "I didn't recognize that category. Try Work, Personal, Finance, Health, Ideas, Travel, Shopping, Learning, or Spiritual.";
        addMessage('assistant', msg);
        speak(msg, () => doStartListening());
      }
    }
  }, [detectedEntry, addMessage, speak, doStartListening]);

  // Initialize speech recognition - run once on mount
  useEffect(() => {
    if (!isSupported) return;

    debugVoiceDemo('[VoiceDemo] Initializing speech recognition');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      debugVoiceDemo('[VoiceDemo] Recognition onstart fired');
    };

    recognition.onresult = (event) => {
      debugVoiceDemo('[VoiceDemo] Recognition onresult', event.results);
      let finalTranscript = '';
      let interimText = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimText += transcriptPart;
        }
      }
      
      setInterimTranscript(interimText);
      if (finalTranscript) {
        debugVoiceDemo('[VoiceDemo] Final transcript:', finalTranscript);
        setTranscript(finalTranscript);
        transcriptRef.current = finalTranscript; // Sync ref immediately for onend handler
      }
    };

    recognition.onend = () => {
      debugVoiceDemo('[VoiceDemo] Recognition onend, state:', stateRef.current, 'transcript:', transcriptRef.current);
      setInterimTranscript("");

      const currentTranscript = transcriptRef.current;
      const currentState = stateRef.current;

      if (currentTranscript && currentState === 'listening') {
        transcriptRef.current = "";
        setTranscript("");
        processInput(currentTranscript);
      } else if (currentTranscript && (currentState === 'waiting_response' || currentState === 'editing_title' || currentState === 'editing_category')) {
        transcriptRef.current = "";
        setTranscript("");
        handleResponse(currentTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('[VoiceDemo] Recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access and try again.');
        setState('idle');
      } else if (event.error === 'no-speech' || event.error === 'aborted') {
        // no-speech and aborted are expected during conversation flow — don't reset state
        debugVoiceDemo('[VoiceDemo] Benign error (no-speech/aborted), keeping current state');
      } else {
        setError(`Speech recognition error: ${event.error}`);
        setState('idle');
      }
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      debugVoiceDemo('[VoiceDemo] Cleanup: stopping recognition');
      recognition.stop();
      demoStopSpeaking();
    };
  }, [isSupported]); // Only depend on isSupported

  // Update handlers when they change
  useEffect(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onend = () => {
      debugVoiceDemo('[VoiceDemo] Recognition onend (updated), state:', stateRef.current, 'transcript:', transcriptRef.current);
      setInterimTranscript("");

      const currentTranscript = transcriptRef.current;
      const currentState = stateRef.current;

      if (currentTranscript && currentState === 'listening') {
        transcriptRef.current = "";
        setTranscript("");
        processInput(currentTranscript);
      } else if (currentTranscript && (currentState === 'waiting_response' || currentState === 'editing_title' || currentState === 'editing_category')) {
        transcriptRef.current = "";
        setTranscript("");
        handleResponse(currentTranscript);
      }
    };
  }, [processInput, handleResponse]);

  const stopListening = useCallback(() => {
    debugVoiceDemo('[VoiceDemo] Stopping listening');
    recognitionRef.current?.stop();
  }, []);

  const startConversation = () => {
    debugVoiceDemo('[VoiceDemo] Starting conversation');
    setConversationHistory([]);
    setDetectedEntry(null);
    setState('listening');
    doStartListening();
  };

  const resetConversation = () => {
    debugVoiceDemo('[VoiceDemo] Resetting conversation');
    setState('idle');
    setConversationHistory([]);
    setDetectedEntry(null);
    setTranscript("");
    setInterimTranscript("");
    demoStopSpeaking();
  };

  const getCategoryIcon = (category: string) => CATEGORIES[category]?.icon || '📁';

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
      {/* Voice toggle */}
      <div className="flex justify-end items-center mb-2">
        {usingCloudTts && (
          <span className={`text-xs font-mono flex items-center gap-1 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
            <Sparkles className="w-3 h-3" /> AI Voice
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}
          title={voiceEnabled ? 'Mute voice responses' : 'Enable voice responses'}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Idle state */}
      {state === 'idle' ? (
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <button
              onClick={startConversation}
              className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-2 border-zinc-700 hover:border-primary/50'
                  : 'bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 border-2 border-zinc-300 hover:border-primary/50 shadow-lg'
              }`}
            >
              <Mic className="w-12 h-12" />
            </button>
          </div>
          <p className={`font-mono text-sm tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>CLICK OR TAP TO START</p>
          <p className={`text-sm max-w-sm mx-auto ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Have a conversation with SaveMe. Tell me what you want to remember!
          </p>
        </div>
      ) : (
        /* Terminal-style conversation view */
        <div className={`w-full rounded-2xl overflow-hidden border transition-colors ${
          theme === 'dark'
            ? 'bg-[#0a0f1a] border-zinc-800/60 shadow-2xl shadow-black/40'
            : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/60'
        }`}>
          {/* Title Bar */}
          <div className={`flex items-center gap-3 px-5 py-3 border-b ${
            theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'
          }`}>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <span className={`text-[11px] tracking-[2px] uppercase font-medium flex-1 ${
              theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
            }`}>Nova</span>
            <button
              onClick={resetConversation}
              className={`text-[10px] tracking-[1px] uppercase px-3 py-1 rounded-full border transition-all ${
                theme === 'dark'
                  ? 'border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                  : 'border-zinc-200 text-zinc-400 hover:text-zinc-600'
              }`}
            >
              Cancel
            </button>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-7 min-h-[340px]">
            {/* Mic + Waveform — shown during listening/processing/waiting */}
            <div className={`flex items-center gap-4 mb-6 transition-all duration-500 ${
              state !== 'saved'
                ? 'opacity-100 max-h-20'
                : 'opacity-0 max-h-0 mb-0 overflow-hidden'
            }`}>
              <div className="relative shrink-0">
                <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center border-2 ${
                  theme === 'dark'
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-primary/5 border-primary/20'
                }`}>
                  {state === 'processing' ? (
                    <span className="w-5 h-5 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                  ) : isSpeaking && !voiceEnabled ? null : (
                    <Mic className={`w-5 h-5 ${state === 'listening' ? 'text-primary animate-pulse' : 'text-primary'}`} />
                  )}
                </div>
                {state === 'listening' && (
                  <span className="absolute -inset-1.5 rounded-full border border-primary/10 animate-ping" />
                )}
              </div>

              {/* Waveform bars */}
              <div className="flex items-center gap-[3px] h-8 flex-1">
                {[30, 55, 80, 100, 70, 45, 65, 90, 50, 75, 35, 60].map((h, i) => (
                  <span
                    key={i}
                    className="w-[4px] rounded-full bg-primary/50"
                    style={{
                      height: `${h}%`,
                      animation: state === 'listening'
                        ? `waveform-pulse 1s ease-in-out ${i * 0.1}s infinite`
                        : 'none',
                    }}
                  />
                ))}
              </div>

              <span className={`text-[11px] tracking-[1px] uppercase whitespace-nowrap ${
                theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                {state === 'listening' && !isSpeaking ? 'LISTENING' :
                 state === 'processing' ? 'THINKING' :
                 isSpeaking ? 'SPEAKING' :
                 (state === 'waiting_response' || state === 'editing_title' || state === 'editing_category') ? 'AWAITING' : ''}
              </span>
            </div>

            {/* User transcription */}
            {(transcript || interimTranscript) && (
              <div className={`font-mono text-sm sm:text-[15px] leading-relaxed mb-5 ${
                theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'
              }`} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {transcript || interimTranscript}
                {interimTranscript && (
                  <span className="inline-block w-[2px] h-[1.1em] ml-0.5 align-text-bottom animate-pulse bg-primary" />
                )}
              </div>
            )}

            {/* Divider */}
            {detectedEntry && (
              <div className={`h-px mb-5 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-transparent via-primary/20 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-primary/30 to-transparent'
              }`} />
            )}

            {/* Processing spinner */}
            <div className={`flex items-center gap-2.5 mb-5 transition-all duration-400 ${
              state === 'processing'
                ? 'opacity-100 max-h-10'
                : 'opacity-0 max-h-0 overflow-hidden'
            }`}>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-transparent border-t-primary animate-spin" />
              <span className={`text-xs tracking-[1px] uppercase ${
                theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
              }`}>Nova is organizing</span>
            </div>

            {/* Detected entry card */}
            {detectedEntry && state === 'confirming' && (
              <div className="flex flex-col gap-2 mb-4">
                <div className={`flex items-start gap-2.5 text-sm leading-relaxed transition-all duration-400 ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                }`}>
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>Detected category: <strong>{detectedEntry.category}</strong></span>
                </div>
                <div className={`flex items-start gap-2.5 text-sm leading-relaxed transition-all duration-400 ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                }`}>
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>Title: <strong>{detectedEntry.suggestedTitle}</strong></span>
                </div>
                {detectedEntry.dueDate && (
                  <div className={`flex items-start gap-2.5 text-sm leading-relaxed transition-all duration-400 ${
                    theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                  }`}>
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                    <span>Due: <strong>{detectedEntry.dueDate}</strong></span>
                  </div>
                )}
                {detectedEntry.priority === 'high' && (
                  <div className={`flex items-start gap-2.5 text-sm leading-relaxed transition-all duration-400 ${
                    theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                  }`}>
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                    <span>Priority: <strong>High</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Success banner */}
            {state === 'saved' && (
              <div className={`rounded-xl px-5 py-3.5 flex items-center gap-3 mb-5 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-primary/8 to-primary/2 border border-primary/12'
                  : 'bg-gradient-to-r from-primary/5 to-primary/1 border border-primary/10'
              }`}>
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className={`text-sm ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  Saved! {detectedEntry?.suggestedTitle}
                </span>
              </div>
            )}

            {/* Confirmation hint */}
            {state === 'waiting_response' && (
              <div className={`text-xs text-center mb-4 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Say "save" to confirm, "change title" to edit, or "cancel"
              </div>
            )}

            {/* Bottom actions */}
            {state === 'saved' ? (
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  onClick={onSignupClick}
                  className={`flex-1 px-5 py-2.5 rounded-lg font-medium text-sm transition-all text-center ${
                    theme === 'dark'
                      ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  Sign up to keep this
                  <span className="ml-2">→</span>
                </button>
                <button
                  onClick={resetConversation}
                  className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all text-center border ${
                    theme === 'dark'
                      ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  Try another
                </button>
              </div>
            ) : (
              /* Mic button */
              <div className="flex justify-center pt-3">
                <button
                  onClick={state === 'listening' ? stopListening : doStartListening}
                  disabled={state === 'processing' || isSpeaking}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    state === 'listening'
                      ? 'bg-red-500 text-white animate-pulse'
                      : state === 'processing' || isSpeaking
                        ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {state === 'listening' ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}

      {/* Keyframes */}
      <style>{`
        @keyframes waveform-pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
        }
      `}</style>
    </div>
  );
};

export default ConversationalVoiceDemo;
