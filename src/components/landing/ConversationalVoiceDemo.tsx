/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Sparkles, ArrowRight, Check, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoSpeak, demoStopSpeaking, demoIsSpeaking, isElevenLabsAvailable } from "@/utils/demoTTS";

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

export const ConversationalVoiceDemo: React.FC<ConversationalVoiceDemoProps> = ({ onSignupClick, theme }) => {
  const [state, setState] = useState<ConversationState>('idle');
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [detectedEntry, setDetectedEntry] = useState<DetectedEntry | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ speaker: 'user' | 'assistant'; text: string }>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingElevenLabs, setUsingElevenLabs] = useState(false);

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
    setUsingElevenLabs(isElevenLabsAvailable());
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
      console.log('[VoiceDemo] No recognition ref');
      return;
    }
    if (demoIsSpeaking()) {
      console.log('[VoiceDemo] TTS is speaking, not starting recognition');
      return;
    }
    
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    transcriptRef.current = "";

    try {
      console.log('[VoiceDemo] Starting recognition...');
      recognitionRef.current.start();
      console.log('[VoiceDemo] Recognition started');
    } catch (e) {
      console.error('[VoiceDemo] Failed to start recognition:', e);
    }
  }, []);

  // Process the user's voice input
  const processInput = useCallback((text: string) => {
    console.log('[VoiceDemo] Processing input:', text);
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
    console.log('[VoiceDemo] Handling response:', text, 'state:', currentState);
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

    console.log('[VoiceDemo] Initializing speech recognition');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('[VoiceDemo] Recognition onstart fired');
    };

    recognition.onresult = (event) => {
      console.log('[VoiceDemo] Recognition onresult', event.results);
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
        console.log('[VoiceDemo] Final transcript:', finalTranscript);
        setTranscript(finalTranscript);
        transcriptRef.current = finalTranscript; // Sync ref immediately for onend handler
      }
    };

    recognition.onend = () => {
      console.log('[VoiceDemo] Recognition onend, state:', stateRef.current, 'transcript:', transcriptRef.current);
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
        console.log('[VoiceDemo] Benign error (no-speech/aborted), keeping current state');
      } else {
        setError(`Speech recognition error: ${event.error}`);
        setState('idle');
      }
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      console.log('[VoiceDemo] Cleanup: stopping recognition');
      recognition.stop();
      demoStopSpeaking();
    };
  }, [isSupported]); // Only depend on isSupported

  // Update handlers when they change
  useEffect(() => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onend = () => {
      console.log('[VoiceDemo] Recognition onend (updated), state:', stateRef.current, 'transcript:', transcriptRef.current);
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
    console.log('[VoiceDemo] Stopping listening');
    recognitionRef.current?.stop();
  }, []);

  const startConversation = () => {
    console.log('[VoiceDemo] Starting conversation');
    setConversationHistory([]);
    setDetectedEntry(null);
    setState('listening');
    doStartListening();
  };

  const resetConversation = () => {
    console.log('[VoiceDemo] Resetting conversation');
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
      {/* Voice toggle & ElevenLabs indicator */}
      <div className="flex justify-between items-center mb-2">
        {usingElevenLabs && (
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

      {/* Main interaction area */}
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
          <p className={`font-mono text-sm tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>TAP TO START</p>
          <p className={`text-sm max-w-sm mx-auto ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Have a conversation with SaveMe. Tell me what you want to remember!
          </p>
        </div>
      ) : state === 'saved' ? (
        /* Saved state */
        <div className={`rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-zinc-900/80 border border-zinc-800' : 'bg-white border border-zinc-200 shadow-xl'}`}>
          <div className={`px-6 py-4 flex items-center gap-3 ${theme === 'dark' ? 'bg-green-500/10 border-b border-zinc-800' : 'bg-green-50 border-b border-zinc-200'}`}>
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Saved!</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>Entry created successfully</p>
            </div>
          </div>
          
          {detectedEntry && (
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCategoryIcon(detectedEntry.category)}</span>
                <div>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{detectedEntry.suggestedTitle}</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{detectedEntry.category}</p>
                </div>
              </div>
              {detectedEntry.dueDate && (
                <p className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>📅 {detectedEntry.dueDate}</p>
              )}
            </div>
          )}

          <div className={`px-6 py-4 flex flex-col sm:flex-row gap-3 ${theme === 'dark' ? 'bg-zinc-900/50 border-t border-zinc-800' : 'bg-zinc-50 border-t border-zinc-200'}`}>
            <Button onClick={onSignupClick} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
              Sign up to keep this
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={resetConversation} className={theme === 'dark' ? 'border-zinc-700' : ''}>
              Try another
            </Button>
          </div>
        </div>
      ) : (
        /* Conversation view */
        <div className={`rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-zinc-900/80 border border-zinc-800' : 'bg-white border border-zinc-200 shadow-xl'}`}>
          {/* Status header */}
          <div className={`px-6 py-4 flex items-center justify-between ${theme === 'dark' ? 'bg-zinc-800/50 border-b border-zinc-800' : 'bg-zinc-50 border-b border-zinc-200'}`}>
            <div className="flex items-center gap-3">
              {(state === 'listening' || state === 'waiting_response' || state === 'editing_title' || state === 'editing_category') && !isSpeaking && (
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>
              )}
              {state === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              {isSpeaking && <Volume2 className="w-4 h-4 text-primary animate-pulse" />}
              <span className={`font-mono text-xs tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {state === 'listening' && !isSpeaking ? 'LISTENING...' : 
                 state === 'processing' ? 'THINKING...' : 
                 (state === 'waiting_response' || state === 'editing_title' || state === 'editing_category') && !isSpeaking ? 'YOUR TURN...' :
                 isSpeaking ? 'SPEAKING...' : ''}
              </span>
            </div>
            <button
              onClick={resetConversation}
              className={`text-xs ${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              Cancel
            </button>
          </div>

          {/* Conversation history */}
          <div ref={conversationRef} className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {conversationHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                  msg.speaker === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : theme === 'dark' 
                      ? 'bg-zinc-800 text-zinc-200 rounded-bl-md'
                      : 'bg-zinc-100 text-zinc-800 rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Live transcript */}
            {(interimTranscript || transcript) && (
              <div className="flex justify-end">
                <div className="max-w-[85%] px-4 py-2 rounded-2xl rounded-br-md text-sm bg-primary/50 text-primary-foreground">
                  {transcript || interimTranscript}
                  {interimTranscript && <span className="animate-pulse">...</span>}
                </div>
              </div>
            )}
          </div>

          {/* Mic button */}
          <div className={`px-6 py-4 flex justify-center ${theme === 'dark' ? 'bg-zinc-900/50 border-t border-zinc-800' : 'bg-zinc-50 border-t border-zinc-200'}`}>
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
        </div>
      )}

      {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
    </div>
  );
};

export default ConversationalVoiceDemo;
