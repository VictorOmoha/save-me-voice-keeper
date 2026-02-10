import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, ArrowRight, Check, Loader2, User, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logError } from "@/utils/logger";

interface CapturedEntry {
  text: string;
  category: string;
  confidence: number;
  actionItem?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  people?: string[];
  location?: string;
}

interface TryVoiceCaptureProps {
  onSignupClick: () => void;
  theme: 'light' | 'dark';
}

// Category definitions with keywords and weights
const CATEGORIES = {
  Work: {
    keywords: ['meeting', 'work', 'project', 'client', 'deadline', 'report', 'presentation', 
               'boss', 'colleague', 'office', 'team', 'sprint', 'standup', 'quarterly', 
               'revenue', 'sales', 'marketing', 'strategy', 'roadmap', 'deliverable',
               'stakeholder', 'review', 'feedback', 'proposal', 'contract', 'invoice work'],
    weight: 1.0,
    icon: '💼'
  },
  Finance: {
    keywords: ['buy', 'pay', 'money', 'budget', 'invoice', 'expense', 'cost', 'price', 
               'bank', 'payment', 'credit', 'debit', 'loan', 'mortgage', 'rent', 'salary',
               'investment', 'stock', 'crypto', 'savings', 'tax', 'refund', 'receipt',
               'subscription', 'bill', 'transfer', 'venmo', 'paypal', 'zelle'],
    weight: 1.0,
    icon: '💰'
  },
  Health: {
    keywords: ['doctor', 'health', 'medicine', 'appointment', 'prescription', 'symptom', 
               'exercise', 'gym', 'workout', 'fitness', 'diet', 'nutrition', 'vitamin',
               'therapy', 'dentist', 'checkup', 'hospital', 'clinic', 'insurance health',
               'mental', 'meditation', 'sleep', 'weight', 'running', 'yoga', 'stretching'],
    weight: 1.0,
    icon: '🏥'
  },
  Personal: {
    keywords: ['mom', 'dad', 'family', 'birthday', 'anniversary', 'dinner', 'lunch',
               'friend', 'kids', 'children', 'wife', 'husband', 'partner', 'parents',
               'brother', 'sister', 'nephew', 'niece', 'grandma', 'grandpa', 'home',
               'house', 'clean', 'laundry', 'groceries', 'cook', 'pet', 'dog', 'cat'],
    weight: 1.0,
    icon: '👤'
  },
  Ideas: {
    keywords: ['idea', 'creative', 'podcast', 'blog', 'content', 'video', 'article', 
               'book', 'write', 'brainstorm', 'concept', 'thought', 'maybe', 'what if',
               'could be', 'inspiration', 'design', 'prototype', 'experiment', 'try',
               'innovation', 'invention', 'startup', 'business idea', 'app idea'],
    weight: 1.0,
    icon: '💡'
  },
  Travel: {
    keywords: ['flight', 'hotel', 'trip', 'vacation', 'travel', 'airport', 'booking',
               'airbnb', 'resort', 'cruise', 'passport', 'visa', 'luggage', 'pack',
               'itinerary', 'destination', 'beach', 'mountain', 'road trip', 'car rental'],
    weight: 1.0,
    icon: '✈️'
  },
  Shopping: {
    keywords: ['amazon', 'order', 'shopping', 'store', 'mall', 'online', 'delivery',
               'package', 'return', 'exchange', 'wishlist', 'cart', 'checkout', 'sale',
               'discount', 'coupon', 'gift', 'present', 'clothes', 'shoes', 'electronics'],
    weight: 0.9,
    icon: '🛒'
  },
  Learning: {
    keywords: ['course', 'study', 'learn', 'class', 'tutorial', 'lesson', 'training',
               'certification', 'degree', 'school', 'university', 'homework', 'exam',
               'test', 'quiz', 'research', 'reading', 'practice', 'skill', 'workshop'],
    weight: 1.0,
    icon: '📚'
  },
  Spiritual: {
    keywords: ['prayer', 'meditation', 'journal', 'reflection', 'gratitude', 'faith',
               'church', 'mosque', 'temple', 'spiritual', 'blessing', 'worship', 'bible',
               'quran', 'devotion', 'mindfulness', 'intention', 'manifest', 'affirmation'],
    weight: 1.0,
    icon: '🙏'
  }
};

// Action verbs that indicate tasks
const ACTION_VERBS = [
  'remind', 'call', 'email', 'send', 'schedule', 'book', 'meet', 'buy', 'pick up',
  'get', 'do', 'finish', 'complete', 'submit', 'review', 'check', 'follow up',
  'contact', 'text', 'message', 'pay', 'cancel', 'renew', 'update', 'fix', 'clean',
  'prepare', 'create', 'write', 'read', 'watch', 'listen', 'download', 'upload',
  'print', 'sign', 'return', 'order', 'reserve', 'confirm', 'attend', 'visit'
];

// Priority indicators
const PRIORITY_HIGH = ['urgent', 'asap', 'immediately', 'critical', 'important', 'priority', 'emergency', 'deadline today', 'must'];
const PRIORITY_MEDIUM = ['soon', 'this week', 'should', 'need to', 'don\'t forget'];
const PRIORITY_LOW = ['sometime', 'eventually', 'when possible', 'low priority', 'maybe', 'could'];

// Common name patterns (simplified)
const NAME_PATTERNS = [
  /(?:call|email|text|message|meet|contact|tell|ask|remind)\s+([A-Z][a-z]+)/g,
  /(?:with|from|to)\s+([A-Z][a-z]+)(?:\s|$|,)/g,
  /([A-Z][a-z]+)(?:'s|'s)\s+(?:birthday|meeting|call|appointment)/g
];

// Location patterns
const LOCATION_PATTERNS = [
  /(?:at|in|to|from)\s+(?:the\s+)?([A-Z][a-zA-Z\s]+?)(?:\s+(?:at|on|by|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|$|,)/gi,
  /(?:at|in)\s+(starbucks|walmart|target|costco|home depot|office|gym|school|hospital|clinic|airport)/gi
];

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
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      logError('Speech recognition error:', event.error);
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

  const detectCategory = (text: string): { category: string; confidence: number; icon: string } => {
    const lower = text.toLowerCase();
    const scores: { [key: string]: number } = {};

    // Calculate scores for each category
    for (const [category, data] of Object.entries(CATEGORIES)) {
      let score = 0;
      let matches = 0;

      for (const keyword of data.keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          score += data.weight;
          matches++;
        }
      }

      // Boost score slightly if multiple matches
      if (matches > 1) {
        score *= (1 + (matches - 1) * 0.2);
      }

      scores[category] = score;
    }

    // Find the highest scoring category
    let maxScore = 0;
    let bestCategory = 'Personal';
    let bestIcon = '👤';

    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
        bestIcon = CATEGORIES[category as keyof typeof CATEGORIES].icon;
      }
    }

    // Calculate confidence (0-1)
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? Math.min(maxScore / Math.max(totalScore, 1), 1) : 0.5;

    return { 
      category: bestCategory, 
      confidence: maxScore > 0 ? Math.max(0.6, confidence) : 0.5,
      icon: bestIcon
    };
  };

  const detectActionItem = (text: string): string | undefined => {
    const lower = text.toLowerCase();
    
    for (const verb of ACTION_VERBS) {
      const regex = new RegExp(`${verb}\\s+(.+?)(?:\\s+(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|by|before|at\\s+\\d)|$)`, 'i');
      const match = lower.match(regex);
      if (match) {
        return match[0].trim();
      }
    }

    // Check if the entire text looks like a task
    if (/^(need to|have to|must|should|gotta|got to|don't forget to)/i.test(lower)) {
      return text.trim();
    }

    return undefined;
  };

  const detectDueDate = (text: string): string | undefined => {
    const lower = text.toLowerCase();

    if (/\btoday\b/i.test(lower)) return "Today";
    if (/\btomorrow\b/i.test(lower)) return "Tomorrow";
    if (/\btonight\b/i.test(lower)) return "Tonight";
    if (/\bthis morning\b/i.test(lower)) return "This morning";
    if (/\bthis afternoon\b/i.test(lower)) return "This afternoon";
    if (/\bthis evening\b/i.test(lower)) return "This evening";
    if (/\bthis week\b/i.test(lower)) return "This week";
    if (/\bnext week\b/i.test(lower)) return "Next week";
    if (/\bthis weekend\b/i.test(lower)) return "This weekend";
    if (/\bnext month\b/i.test(lower)) return "Next month";
    if (/\bend of day\b/i.test(lower)) return "End of day";
    if (/\bend of week\b/i.test(lower)) return "End of week";

    // Days of the week
    const dayMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    if (dayMatch) {
      return dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase();
    }

    // Time patterns like "at 3pm", "at 10:30"
    const timeMatch = text.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
    if (timeMatch) {
      return `At ${timeMatch[1]}`;
    }

    return undefined;
  };

  const detectPriority = (text: string): 'high' | 'medium' | 'low' | undefined => {
    const lower = text.toLowerCase();

    for (const indicator of PRIORITY_HIGH) {
      if (lower.includes(indicator)) return 'high';
    }
    for (const indicator of PRIORITY_MEDIUM) {
      if (lower.includes(indicator)) return 'medium';
    }
    for (const indicator of PRIORITY_LOW) {
      if (lower.includes(indicator)) return 'low';
    }

    return undefined;
  };

  const detectPeople = (text: string): string[] => {
    const people: Set<string> = new Set();

    for (const pattern of NAME_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(text)) !== null) {
        const name = match[1];
        // Filter out common false positives
        if (name && !['I', 'The', 'This', 'That', 'My', 'Your', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(name)) {
          people.add(name);
        }
      }
    }

    return Array.from(people);
  };

  const detectLocation = (text: string): string | undefined => {
    for (const pattern of LOCATION_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return undefined;
  };

  const processTranscript = (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setHasTriedVoice(true);

    setTimeout(() => {
      const { category, confidence, icon } = detectCategory(text);
      
      const entry: CapturedEntry = {
        text: text.trim(),
        category,
        confidence,
        actionItem: detectActionItem(text),
        dueDate: detectDueDate(text),
        priority: detectPriority(text),
        people: detectPeople(text),
        location: detectLocation(text),
      };

      setCapturedEntry(entry);
      setIsProcessing(false);

      // Store in localStorage
      const stored = JSON.parse(localStorage.getItem('saveme_demo_entries') || '[]');
      stored.push({ ...entry, timestamp: new Date().toISOString() });
      localStorage.setItem('saveme_demo_entries', JSON.stringify(stored));
    }, 800);
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
      logError('Failed to start recognition:', e);
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

  const getCategoryIcon = (category: string): string => {
    return CATEGORIES[category as keyof typeof CATEGORIES]?.icon || '📁';
  };

  const getPriorityColor = (priority: string | undefined, isDark: boolean) => {
    switch (priority) {
      case 'high': return isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700';
      case 'medium': return isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700';
      case 'low': return isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700';
      default: return '';
    }
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
              <p className={`font-mono text-sm tracking-wider ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>ANALYZING...</p>
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
              Try: "Remind me to call John tomorrow" or "Meeting with Sarah at Starbucks on Friday"
            </p>
          )}
        </div>
      ) : (
        <div className={`rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-zinc-900/80 border border-zinc-800' : 'bg-white border border-zinc-200 shadow-xl'}`}>
          <div className={`px-6 py-4 flex items-center gap-3 ${theme === 'dark' ? 'bg-primary/10 border-b border-zinc-800' : 'bg-primary/5 border-b border-zinc-200'}`}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Captured!</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {Math.round(capturedEntry.confidence * 100)}% confidence
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <p className={`text-xs font-mono uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>You said:</p>
              <p className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}>"{capturedEntry.text}"</p>
            </div>

            <div className={`space-y-3 pt-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className={`text-xs font-mono uppercase tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>AI detected:</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Category */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>
                  {getCategoryIcon(capturedEntry.category)} {capturedEntry.category}
                </span>

                {/* Priority */}
                {capturedEntry.priority && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${getPriorityColor(capturedEntry.priority, theme === 'dark')}`}>
                    <AlertCircle className="w-3 h-3" />
                    {capturedEntry.priority.charAt(0).toUpperCase() + capturedEntry.priority.slice(1)} priority
                  </span>
                )}

                {/* Action Item */}
                {capturedEntry.actionItem && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${theme === 'dark' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                    ⚡ Action item
                  </span>
                )}

                {/* Due Date */}
                {capturedEntry.dueDate && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                    📅 {capturedEntry.dueDate}
                  </span>
                )}

                {/* People */}
                {capturedEntry.people && capturedEntry.people.length > 0 && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                    <User className="w-3 h-3" />
                    {capturedEntry.people.join(', ')}
                  </span>
                )}

                {/* Location */}
                {capturedEntry.location && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${theme === 'dark' ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700'}`}>
                    <MapPin className="w-3 h-3" />
                    {capturedEntry.location}
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
