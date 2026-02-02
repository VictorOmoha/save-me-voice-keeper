import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Sparkles, ArrowRight, Check, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  Spiritual: { keywords: ['prayer', 'meditation', 'journal', 'reflection', 'gratitude', 'faith', 'church'], icon: '🙏' },
};

const ACTION_VERBS = ['remind', 'call', 'email', 'send', 'schedule', 'book', 'meet', 'buy', 'pick up', 'get', 'do', 'finish', 'complete', 'submit', 'check', 'follow up', 'contact', 'text', 'pay'];

export const ConversationalVoiceDemo: React.FC<ConversationalVoiceDemoProps> = ({ onSignupClick, theme }) => {
  const [state, setState] = useState<ConversationState>('idle');
  const [transcript, setTranscript] = useState("");
  const [detectedEntry, setDetectedEntry] = useState<DetectedEntry | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{ speaker: 'user' | 'assistant'; text: string }>>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Text-to-speech function
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!synthRef.current || !voiceEnabled) {
      onEnd?.();
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to get a natural sounding voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Google') || 
      v.name.includes('Natural') ||
      v.lang === 'en-US'
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  // Add message to conversation history
  const addMessage = useCallback((speaker: 'user' | 'assistant', text: string) => {
    setConversationHistory(prev => [...prev, { speaker, text }]);
  }, []);

  // Detect category from text
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

  // Generate suggested title
  const generateTitle = (text: string): string => {
    // Try to extract action-based title
    for (const verb of ACTION_VERBS) {
      const regex = new RegExp(`${verb}\\s+(.{3,30})(?:\\s+(?:tomorrow|today|on|at|by)|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        const title = verb.charAt(0).toUpperCase() + verb.slice(1) + ' ' + match[1].trim();
        return title.length > 40 ? title.substring(0, 40) + '...' : title;
      }
    }

    // Fallback: use first few words
    const words = text.split(' ').slice(0, 5).join(' ');
    return words.length > 40 ? words.substring(0, 40) + '...' : words;
  };

  // Detect due date
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

  // Detect priority
  const detectPriority = (text: string): 'high' | 'medium' | 'low' | undefined => {
    const lower = text.toLowerCase();
    if (/urgent|asap|immediately|critical|important/.test(lower)) return 'high';
    if (/soon|this week|should|need to/.test(lower)) return 'medium';
    return undefined;
  };

  // Detect people
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

  // Process the user's voice input
  const processInput = useCallback((text: string) => {
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

      // Build the response
      let response = `Got it! I'll save this as a ${category} entry`;
      if (entry.dueDate) response += ` with a reminder for ${entry.dueDate}`;
      if (entry.priority === 'high') response += `. I marked it as high priority`;
      response += `. The title will be "${entry.suggestedTitle}". Say "save" to confirm, "change title" to edit the title, or "change category" to pick a different category.`;

      addMessage('assistant', response);
      speak(response, () => {
        setState('waiting_response');
        startListening();
      });
    }, 500);
  }, [addMessage, speak]);

  // Handle user's response during conversation
  const handleResponse = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    addMessage('user', text);

    if (state === 'waiting_response') {
      if (/^(save|yes|confirm|ok|okay|sure|do it|go ahead)/.test(lower)) {
        // Save the entry
        setState('saved');
        const savedMsg = `Saved! Your ${detectedEntry?.category} entry "${detectedEntry?.suggestedTitle}" has been stored.`;
        addMessage('assistant', savedMsg);
        speak(savedMsg);

        // Store in localStorage
        const stored = JSON.parse(localStorage.getItem('saveme_demo_entries') || '[]');
        stored.push({ ...detectedEntry, timestamp: new Date().toISOString() });
        localStorage.setItem('saveme_demo_entries', JSON.stringify(stored));

      } else if (/change\s*(the\s*)?title|edit\s*title|different\s*title/.test(lower)) {
        setState('editing_title');
        const msg = "What would you like to call this entry?";
        addMessage('assistant', msg);
        speak(msg, () => startListening());

      } else if (/change\s*(the\s*)?category|different\s*category|edit\s*category/.test(lower)) {
        setState('editing_category');
        const categories = Object.keys(CATEGORIES).join(', ');
        const msg = `Which category would you like? Options are: ${categories}`;
        addMessage('assistant', msg);
        speak(msg, () => startListening());

      } else if (/^(cancel|nevermind|never\s*mind|stop|no|don't)/.test(lower)) {
        setState('idle');
        const msg = "Okay, cancelled. Tap the mic when you're ready to try again.";
        addMessage('assistant', msg);
        speak(msg);
        setDetectedEntry(null);
        setConversationHistory([]);

      } else {
        // Didn't understand
        const msg = "I didn't catch that. Say 'save' to confirm, 'change title', 'change category', or 'cancel'.";
        addMessage('assistant', msg);
        speak(msg, () => startListening());
      }
    } else if (state === 'editing_title') {
      // User provided a new title
      if (detectedEntry) {
        const newTitle = text.trim();
        setDetectedEntry({ ...detectedEntry, suggestedTitle: newTitle });
        setState('waiting_response');
        const msg = `Title updated to "${newTitle}". Say "save" to confirm or make more changes.`;
        addMessage('assistant', msg);
        speak(msg, () => startListening());
      }
    } else if (state === 'editing_category') {
      // User provided a new category
      const matchedCategory = Object.keys(CATEGORIES).find(c => 
        lower.includes(c.toLowerCase())
      );
      if (matchedCategory && detectedEntry) {
        setDetectedEntry({ ...detectedEntry, category: matchedCategory });
        setState('waiting_response');
        const msg = `Category changed to ${matchedCategory}. Say "save" to confirm or make more changes.`;
        addMessage('assistant', msg);
        speak(msg, () => startListening());
      } else {
        const msg = "I didn't recognize that category. Try saying Work, Personal, Finance, Health, Ideas, Travel, Shopping, Learning, or Spiritual.";
        addMessage('assistant', msg);
        speak(msg, () => startListening());
      }
    }
  }, [state, detectedEntry, addMessage, speak]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
      }
    };

    recognitionRef.current.onend = () => {
      if (transcript && state === 'listening') {
        processInput(transcript);
        setTranscript("");
      } else if (transcript && (state === 'waiting_response' || state === 'editing_title' || state === 'editing_category')) {
        handleResponse(transcript);
        setTranscript("");
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied.');
      }
      setState('idle');
    };

    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, [isSupported, transcript, state, processInput, handleResponse]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript("");
    try {
      recognitionRef.current.start();
      if (state === 'idle') setState('listening');
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [state]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startConversation = () => {
    setConversationHistory([]);
    setDetectedEntry(null);
    setState('listening');
    startListening();
  };

  const resetConversation = () => {
    setState('idle');
    setConversationHistory([]);
    setDetectedEntry(null);
    setTranscript("");
    synthRef.current?.cancel();
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
      <div className="flex justify-end mb-2">
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
              {(state === 'listening' || state === 'waiting_response' || state === 'editing_title' || state === 'editing_category') && (
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>
              )}
              {state === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              {isSpeaking && <Volume2 className="w-4 h-4 text-primary animate-pulse" />}
              <span className={`font-mono text-xs tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {state === 'listening' ? 'LISTENING...' : 
                 state === 'processing' ? 'THINKING...' : 
                 state === 'waiting_response' ? 'YOUR TURN...' :
                 state === 'editing_title' ? 'WAITING FOR TITLE...' :
                 state === 'editing_category' ? 'WAITING FOR CATEGORY...' :
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
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
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
            {transcript && (
              <div className="flex justify-end">
                <div className="max-w-[85%] px-4 py-2 rounded-2xl rounded-br-md text-sm bg-primary/50 text-primary-foreground">
                  {transcript}...
                </div>
              </div>
            )}
          </div>

          {/* Mic button */}
          <div className={`px-6 py-4 flex justify-center ${theme === 'dark' ? 'bg-zinc-900/50 border-t border-zinc-800' : 'bg-zinc-50 border-t border-zinc-200'}`}>
            <button
              onClick={state === 'listening' ? stopListening : startListening}
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
