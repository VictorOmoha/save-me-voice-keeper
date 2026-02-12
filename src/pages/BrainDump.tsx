import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSavedEntries } from "@/hooks/useSavedEntries";
import { BrainDumpProcessor, ActionItem, actionItemsToStrings } from "@/utils/brainDumpProcessor";
import { useBrainDumpCapture } from "@/hooks/useBrainDumpCapture";
import { speak } from "@/utils/textToSpeech";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, Sparkles, Loader2, Users, Tag, Zap, Keyboard } from "lucide-react";
import { ShareButtons } from "@/components/braindump/ShareButtons";
import { KeyboardShortcuts } from "@/components/braindump/KeyboardShortcuts";
import { openEmailClient, generateLinkedInPost, exportToClipboard, downloadAsText } from "@/utils/shareUtils";

const processor = new BrainDumpProcessor();

// Helper to determine confidence color
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.75) return 'bg-green-50 border-green-200';
  if (confidence >= 0.5) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
};

const getConfidenceBadgeColor = (confidence: number): 'default' | 'secondary' | 'outline' => {
  if (confidence >= 0.75) return 'default'; // green
  if (confidence >= 0.5) return 'secondary'; // yellow
  return 'outline'; // red
};

const BrainDumpPage: React.FC = () => {
  const { saveEntry } = useSavedEntries();
  const { isSupported, isListening, transcript, start, stop, reset } = useBrainDumpCapture();
  const navigate = useNavigate();
  
  const safeStop = () => {
    try { stop(); } catch {}
  };

  const handleBackClick = () => {
    safeStop();
    const idx = (window.history?.state && (window.history.state as any).idx) as number | undefined;
    const sameOriginRef = !!document.referrer && document.referrer.startsWith(window.location.origin);
    console.debug('[BrainDump] Back click', {
      historyLength: window.history.length,
      idx,
      referrer: document.referrer,
      path: window.location.pathname,
    });

    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
      return;
    }
    if (sameOriginRef && window.history.length > 1) {
      navigate(-1);
      return;
    }
    console.debug('[BrainDump] No history to go back to, redirecting to dashboard');
    navigate('/dashboard');
  };

  const handleDashboardClick = () => {
    safeStop();
    navigate('/dashboard');
  };

  // Main processed state
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Personal");
  const [notes, setNotes] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [structuredFields, setStructuredFields] = useState<Record<string, any>>({});
  const [confidence, setConfidence] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);

  // LIVE PREVIEW: Real-time processing state
  const [livePreview, setLivePreview] = useState<{
    title: string;
    category: string;
    actionItems: ActionItem[];
    keyPoints: string[];
    notes: string[];
    people: string[];
    tags: string[];
    confidence: number;
    isProcessing: boolean;
  } | null>(null);
  const livePreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // TAP-TO-FIX: Track which field is being edited
  const [editingField, setEditingField] = useState<string | null>(null);
const [showShortcuts, setShowShortcuts] = useState(false);

  const hasStructured = useMemo(() => !!title || actionItems.length || keyPoints.length || notes.length, [title, actionItems, keyPoints, notes]);

  // Convert ActionItem[] to string[] for display
  const actionItemStrings = useMemo(() => actionItemsToStrings(actionItems), [actionItems]);

  // Dedupe guards
  const introSpokenRef = useRef(false);
  const captureStartedRef = useRef(false);

  useEffect(() => {
    document.title = "Brain Dump | Fast voice capture";
    const metaDescId = "meta-brain-dump-desc";
    let meta = document.querySelector(`meta[name='description']#${metaDescId}`) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      meta.id = metaDescId;
      document.head.appendChild(meta);
    }
    meta.content = "Brain dump capture: quickly turn voice thoughts into structured notes and action items.";

    const canonicalId = "canonical-brain-dump";
    let link = document.querySelector(`link[rel='canonical']#${canonicalId}`) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      link.id = canonicalId;
      document.head.appendChild(link);
    }
    link.href = window.location.origin + "/brain-dump";
  }, []);

  // Auto-start capture when navigated via voice
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('brain_dump_auto_start');
      if (raw) {
        const payload = JSON.parse(raw || '{}');
        sessionStorage.removeItem('brain_dump_auto_start');
        if (payload?.autoStart && isSupported && !isListening && !captureStartedRef.current) {
          start();
          captureStartedRef.current = true;
        }
        if (payload?.autoSpeak && !introSpokenRef.current) {
          speak('Start your brain dump now. Say "process" when you are finished.');
          introSpokenRef.current = true;
        }
      }
    } catch {}

    const handler = (e: Event) => {
      const event = e as CustomEvent<any>;
      const autoStart = event.detail?.autoStart ?? true;
      if (autoStart && isSupported && !isListening && !captureStartedRef.current) {
        start();
        captureStartedRef.current = true;
      }
      if (event.detail?.autoSpeak && !introSpokenRef.current) {
        speak('Start your brain dump now. Say "process" when you are finished.');
        introSpokenRef.current = true;
      }
    };

    window.addEventListener('brain-dump:start-capture', handler as EventListener);
    return () => window.removeEventListener('brain-dump:start-capture', handler as EventListener);
  }, [isSupported, isListening, start]);

  // LIVE PREVIEW: Process transcript in real-time while user is speaking
  useEffect(() => {
    const content = (rawText || transcript).trim();
    
    if (livePreviewTimeoutRef.current) {
      clearTimeout(livePreviewTimeoutRef.current);
    }
    
    // Only process if we have enough content and user is still capturing
    if (content.length > 20 && isListening) {
      setLivePreview(prev => prev ? { ...prev, isProcessing: true } : {
        title: '', category: '', actionItems: [], keyPoints: [], notes: [],
        people: [], tags: [], confidence: 0, isProcessing: true
      });
      
      // Debounce processing by 2 seconds
      livePreviewTimeoutRef.current = setTimeout(() => {
        try {
          const result = processor.processBrainDump(content);
          setLivePreview({
            title: result.title,
            category: result.category,
            actionItems: result.actionItems || [],
            keyPoints: result.keyPoints || [],
            notes: result.notes || [],
            people: result.people || [],
            tags: result.tags || [],
            confidence: result.confidence || 0,
            isProcessing: false,
          });
        } catch (e) {
          console.error('Live preview processing failed:', e);
          setLivePreview(prev => prev ? { ...prev, isProcessing: false } : null);
        }
      }, 2000);
    } else if (!isListening) {
      setLivePreview(null);
    }
    
    return () => {
      if (livePreviewTimeoutRef.current) {
        clearTimeout(livePreviewTimeoutRef.current);
      }
    };
  }, [rawText, transcript, isListening]);

  const handleProcess = () => {
    const content = (rawText || transcript).trim();
    if (!content) {
      toast.info("Speak or paste some text first");
      return;
    }
    const result = processor.processBrainDump(content);
    setTitle(result.title);
    setCategory(result.category);
    setActionItems(result.actionItems || []);
    setKeyPoints(result.keyPoints || []);
    setNotes(result.notes || []);
    setStructuredFields(result.structuredFields || {});
    setConfidence(result.confidence || null);
    setTags(result.tags || []);
    setPeople(result.people || []);
    setLivePreview(null);
    toast.success("Brain dump structured");
  };

  const handleEnhanceWithAI = async () => {
    const content = (rawText || transcript).trim();
    if (!content) {
      toast.info("Speak or paste some text first");
      return;
    }

    setIsEnhancing(true);
    try {
      toast.info('AI enhancement coming soon. Using local processing.');
      handleProcess();
    } catch (err) {
      console.error('AI enhance exception:', err);
      toast.error('AI enhancement failed. Using local processing.');
      handleProcess();
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = async () => {
    if (!hasStructured) {
      toast.info("Process your brain dump first");
      return;
    }

    const fieldDefinitions: any[] = [
      { id: 'category', name: 'category', type: 'text' as const },
      { id: 'originalText', name: 'Original Text', type: 'textarea' as const },
    ];
    if (summary) fieldDefinitions.push({ id: 'summary', name: 'Summary', type: 'textarea' as const });
    if (actionItems.length) fieldDefinitions.push({ id: 'actionItems', name: 'Action Items', type: 'textarea' as const });
    if (keyPoints.length) fieldDefinitions.push({ id: 'keyPoints', name: 'Key Points', type: 'textarea' as const });
    if (notes.length) fieldDefinitions.push({ id: 'notes', name: 'Notes', type: 'textarea' as const });
    if (tags.length) fieldDefinitions.push({ id: 'tags', name: 'Tags', type: 'text' as const });
    if (people.length) fieldDefinitions.push({ id: 'people', name: 'People', type: 'text' as const });

    try {
      await saveEntry({
        title: title || `Brain Dump - ${new Date().toLocaleString()}`,
        fields: {
          category,
          originalText: (rawText || transcript).trim(),
          summary,
          actionItems: actionItemStrings.join('\n• '),
          keyPoints: keyPoints.join('\n• '),
          notes: notes.join('\n\n'),
          tags: tags.join(', '),
          people: people.join(', '),
          confidence,
          ...structuredFields,
          source: 'brain_dump'
        },
        fieldDefinitions,
        category,
      });
      toast.success("Saved structured brain dump");
      setRawText("");
      setTitle("");
      setSummary("");
      setNotes([]);
      setActionItems([]);
      setKeyPoints([]);
      setStructuredFields({});
      setConfidence(null);
      setTags([]);
      setPeople([]);
    } catch (e) {
      // toast already shown in hook
    }
  };

  // Voice command helpers
  const lastHandledRef = useRef<string>("");
  
  const normalizeCategory = (raw: string): string | null => {
    const s = raw.trim().toLowerCase();
    if (!s) return null;
    const map: Record<string, string> = {
      'document': 'Documents', 'doc': 'Documents', 'proposal': 'Documents', 'contract': 'Documents',
      'agreement': 'Documents', 'report': 'Documents', 'memo': 'Documents', 'letter': 'Documents',
      'sow': 'Documents', 'policy': 'Documents', 'sop': 'Documents'
    };
    if (map[s]) return map[s];
    if (/meeting|standup|retro|minutes|client/.test(s)) return 'Work';
    if (/invoice|budget|tax|payment|quote|estimate|receipt/.test(s)) return 'Finance';
    if (/doctor|medical|health|prescription|hospital/.test(s)) return 'Health';
    if (/personal|home|family|travel|vacation/.test(s)) return 'Personal';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const isProcessCommand = (text: string) => /\b(process|structure|organis|organiz|analy[sz]e|summari[sz]e|make\s+notes|turn\s+this\s+into\s+notes)\b/.test(text);

  const isTTSEcho = (text: string): boolean => {
    const ttsPatterns = [
      /saved?\s+(your\s+)?structured\s+notes?/i,
      /processed?\s+(your\s+)?brain\s*dump/i,
      /opening\s+dashboard/i,
      /start\s+your\s+brain\s*dump/i,
      /say\s+["']?process["']?\s+when/i,
    ];
    return ttsPatterns.some(pattern => pattern.test(text));
  };

  const parseSaveCommand = (text: string): { save: true; category?: string } | null => {
    if (isTTSEcho(text)) return null;

    const saveCommandPatterns = [
      /^save\s+(it|this|that)\b/i,
      /\b(please|now|go\s+ahead\s+and|can\s+you)\s+save\s+(it|this|that)?\b/i,
      /\bsave\s+(it|this|that)\s*(now|please)?\s*$/i,
      /\bsave\s+(to|as|in|under)\s+\w+/i,
      /\bstore\s+(it|this|that)\b/i,
    ];

    const isValidSaveCommand = saveCommandPatterns.some(pattern => pattern.test(text));
    if (!isValidSaveCommand) return null;

    const m = text.match(/save(?:\s+it)?\s+(?:as|to|in|under)\s+([a-zA-Z\s-]+)/);
    if (m?.[1]) {
      const cat = normalizeCategory(m[1]);
      return { save: true, category: cat || undefined };
    }
    return { save: true };
  };

  const isDashboardNavCommand = (text: string) => {
    return /\b(go to|open|back to|navigate to|show)\s+(the\s+)?dashboard\b/.test(text)
      || /\b(exit|close|leave)\s+(the\s+)?brain\s*dump\b/.test(text)
      || /\b(go\s*back|back\s*(?:to\s*)?dashboard)\b/.test(text);
  };

  const navigateToDashboard = () => {
    try { stop(); } catch {}
    speak('Opening dashboard');
    window.dispatchEvent(new CustomEvent('voice-navigate', { detail: { destination: 'dashboard' } }));
  };

  useEffect(() => {
    const t = (transcript || '').trim();
    if (!t || t === lastHandledRef.current) return;
    const lower = t.toLowerCase();

    if (isTTSEcho(lower)) {
      console.log('🔇 BrainDump: Ignoring TTS echo:', t);
      lastHandledRef.current = t;
      return;
    }

    if (isDashboardNavCommand(lower)) {
      navigateToDashboard();
      lastHandledRef.current = t;
      return;
    }

    if (isProcessCommand(lower)) {
      handleProcess();
      speak('Processed your brain dump.');
      lastHandledRef.current = t;
      return;
    }

    const saveInfo = parseSaveCommand(lower);
    if (saveInfo) {
      if (saveInfo.category) setCategory(saveInfo.category);
      const doSave = () => { handleSave(); speak('Saved your structured notes.'); };
      if (!hasStructured) {
        handleProcess();
        setTimeout(doSave, 150);
      } else {
        doSave();
      }
      lastHandledRef.current = t;
    }
  }, [transcript, hasStructured]);

  useEffect(() => {
    const onProcess = () => {
      handleProcess();
      speak('Processed your brain dump.');
    };
    const onSave = (e: Event) => {
      const ce = e as CustomEvent<any>;
      const desired = ce.detail?.category as string | undefined;
      if (desired) {
        const norm = normalizeCategory(desired);
        if (norm) setCategory(norm);
      }
      const doSave = () => { handleSave(); speak('Saved your structured notes.'); };
      if (!hasStructured) {
        handleProcess();
        setTimeout(doSave, 150);
      } else {
        doSave();
      }
    };
    window.addEventListener('brain-dump:process', onProcess as EventListener);
    window.addEventListener('brain-dump:save', onSave as EventListener);
    return () => {
      window.removeEventListener('brain-dump:process', onProcess as EventListener);
      window.removeEventListener('brain-dump:save', onSave as EventListener);
    };
  }, [hasStructured]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <nav className="container mx-auto px-4 py-2 flex items-center justify-between" aria-label="Brain Dump navigation">
          <Button variant="ghost" size="sm" onClick={handleBackClick} aria-label="Go back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={handleDashboardClick} aria-label="Go to dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <article className="space-y-6">
          <header>
            <h1 className="text-3xl font-bold">Brain Dump</h1>
            <p className="text-muted-foreground mt-1">Capture a quick brain dump and turn it into structured notes and action items.</p>
          </header>

          <section aria-labelledby="capture" className="grid gap-6 md:grid-cols-2">
            {/* CAPTURE CARD */}
            <Card>
              <CardHeader>
                <CardTitle id="capture">Capture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {!isListening ? (
                    <Button onClick={start} aria-label="Start recording">Start</Button>
                  ) : (
                    <Button variant="secondary" onClick={stop} aria-label="Stop recording">Stop</Button>
                  )}
                  <Button variant="outline" onClick={reset} aria-label="Reset transcript">Reset</Button>
                  <Button variant="outline" onClick={handleProcess} aria-label="Process brain dump">Process</Button>
                  <Button
                    variant="default"
                    onClick={handleEnhanceWithAI}
                    disabled={isEnhancing}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                    aria-label="Enhance with AI"
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Enhance
                      </>
                    )}
                  </Button>
                </div>

                <Textarea
                  value={rawText || transcript}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Speak or paste your brain dump here..."
                  className="min-h-[180px]"
                />
                <p className="text-xs text-muted-foreground">
                  Status: {isListening ? '🎤 Listening…' : 'Idle'}
                  {livePreview && livePreview.isProcessing && ' | ⚡ Processing live preview...'}
                </p>
              </CardContent>
            </Card>

            {/* LIVE PREVIEW OR STRUCTURED PREVIEW */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {isListening && livePreview ? (
                      <>
                        <Zap className="inline h-4 w-4 mr-2 text-yellow-500" />
                        Live Preview
                      </>
                    ) : (
                      'Structured Preview'
                    )}
                  </CardTitle>
                  {livePreview && (
                    <Badge variant="secondary" className="text-xs">LIVE</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Use live preview data if available, otherwise use processed data */}
                {(() => {
                  const data = livePreview || {
                    title, category, actionItems, keyPoints, notes, people, tags,
                    confidence: confidence || 0, isProcessing: false
                  };

                  return (
                    <>
                      {/* TITLE with tap-to-fix */}
                      <div className={`space-y-2 p-2 border rounded transition-colors ${
                        editingField === 'title' ? 'bg-blue-50 border-blue-300' : ''
                      }`}>
                        <label className="text-sm font-medium flex items-center justify-between">
                          Title
                          {data.confidence > 0 && (
                            <Badge 
                              variant={getConfidenceBadgeColor(data.confidence)}
                              className="text-xs ml-2"
                            >
                              {Math.round(data.confidence * 100)}%
                            </Badge>
                          )}
                        </label>
                        <Input 
                          value={data.title} 
                          onChange={(e) => {
                            if (livePreview) {
                              setLivePreview({ ...livePreview, title: e.target.value });
                            } else {
                              setTitle(e.target.value);
                            }
                          }}
                          onFocus={() => setEditingField('title')}
                          onBlur={() => setEditingField(null)}
                          placeholder="Generated title" 
                        />
                      </div>

                      {/* CATEGORY with tap-to-fix */}
                      <div className={`space-y-2 p-2 border rounded transition-colors ${
                        editingField === 'category' ? 'bg-blue-50 border-blue-300' : ''
                      }`}>
                        <label className="text-sm font-medium">Category</label>
                        <Input 
                          value={data.category} 
                          onChange={(e) => {
                            if (livePreview) {
                              setLivePreview({ ...livePreview, category: e.target.value });
                            } else {
                              setCategory(e.target.value);
                            }
                          }}
                          onFocus={() => setEditingField('category')}
                          onBlur={() => setEditingField(null)}
                          placeholder="e.g. Personal, Work" 
                        />
                      </div>

                      {/* TAGS with tap-to-fix */}
                      {data.tags.length > 0 && (
                        <div className={`space-y-2 p-2 border rounded transition-colors ${
                          editingField === 'tags' ? 'bg-blue-50 border-blue-300' : ''
                        }`}>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            <label className="text-sm font-medium">Tags</label>
                            {data.tags.length > 0 && (
                              <Badge variant="secondary" className="text-xs">{data.tags.length}</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {data.tags.map((tag, i) => (
                              <Badge 
                                key={i} 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-yellow-100"
                                onClick={() => setEditingField('tags')}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* PEOPLE with tap-to-fix */}
                      {data.people.length > 0 && (
                        <div className={`space-y-2 p-2 border rounded transition-colors ${
                          editingField === 'people' ? 'bg-blue-50 border-blue-300' : ''
                        }`}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <label className="text-sm font-medium">People Mentioned</label>
                            {data.people.length > 0 && (
                              <Badge variant="secondary" className="text-xs">{data.people.length}</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {data.people.map((person, i) => (
                              <Badge 
                                key={i} 
                                variant="secondary" 
                                className="text-xs cursor-pointer hover:bg-blue-100"
                                onClick={() => setEditingField('people')}
                              >
                                @{person}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ACTION ITEMS with tap-to-fix */}
                      {data.actionItems.length > 0 && (
                        <div className={`space-y-2 p-2 border rounded transition-colors ${
                          editingField === 'actionItems' ? 'bg-blue-50 border-blue-300' : ''
                        }`}>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Action Items</h3>
                            <Badge variant="secondary">{data.actionItems.length}</Badge>
                          </div>
                          <div className="space-y-1">
                            {data.actionItems.map((item, i) => (
                              <div 
                                key={i} 
                                className={`flex items-start gap-2 text-sm p-2 rounded border cursor-pointer transition-colors ${
                                  editingField === `actionItem-${i}` ? 'bg-blue-50 border-blue-300' : 'bg-muted/50'
                                }`}
                                onClick={() => setEditingField(`actionItem-${i}`)}
                              >
                                <span className={`flex-shrink-0 ${
                                  item.priority === 'high' ? 'text-red-500' :
                                  item.priority === 'medium' ? 'text-yellow-500' :
                                  item.priority === 'low' ? 'text-green-500' : ''
                                }`}>
                                  {item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : item.priority === 'low' ? '🟢' : '•'}
                                </span>
                                <div className="flex-1">
                                  <span>{item.text}</span>
                                  {(item.dueDate || item.assignee) && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {item.dueDate && <span className="mr-2">Due: {item.dueDate}</span>}
                                      {item.assignee && <span>@{item.assignee}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* KEY POINTS with tap-to-fix */}
                      {data.keyPoints.length > 0 && (
                        <div className={`space-y-2 p-2 border rounded transition-colors ${
                          editingField === 'keyPoints' ? 'bg-blue-50 border-blue-300' : ''
                        }`}>
                          <h3 className="font-semibold">Key Points</h3>
                          <Textarea 
                            value={data.keyPoints.join('\n')} 
                            onChange={(e) => {
                              if (livePreview) {
                                setLivePreview({ ...livePreview, keyPoints: e.target.value.split('\n').filter(Boolean) });
                              } else {
                                setKeyPoints(e.target.value.split('\n').filter(Boolean));
                              }
                            }}
                            onFocus={() => setEditingField('keyPoints')}
                            onBlur={() => setEditingField(null)}
                            className="min-h-[80px]" 
                          />
                        </div>
                      )}

                      {/* NOTES with tap-to-fix */}
                      {data.notes.length > 0 && (
                        <div className={`space-y-2 p-2 border rounded transition-colors ${
                          editingField === 'notes' ? 'bg-blue-50 border-blue-300' : ''
                        }`}>
                          <h3 className="font-semibold">Notes</h3>
                          <Textarea 
                            value={data.notes.join('\n\n')} 
                            onChange={(e) => {
                              if (livePreview) {
                                setLivePreview({ ...livePreview, notes: e.target.value.split('\n').filter(Boolean) });
                              } else {
                                setNotes(e.target.value.split('\n').filter(Boolean));
                              }
                            }}
                            onFocus={() => setEditingField('notes')}
                            onBlur={() => setEditingField(null)}
                            className="min-h-[100px]" 
                          />
                        </div>
                      )}

                      {/* CONFIDENCE INDICATOR */}
                      {data.confidence > 0 && (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Overall Confidence</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-blue-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    data.confidence >= 0.75 ? 'bg-green-500' :
                                    data.confidence >= 0.5 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${data.confidence * 100}%` }}
                                />
                              </div>
                              <span className="font-semibold">{Math.round(data.confidence * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SAVE BUTTON - only show if not in live preview or if live preview has data */}
                      {(!livePreview || hasStructured) && (
                        <div className="pt-2">
                          <Button 
                            onClick={handleSave} 
                            disabled={!hasStructured && !livePreview}
                            aria-label="Save structured entry"
                            className="w-full"
                          >
                            Save to Entries
                          </Button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </section>
        </article>
      </main>
    </>
  );
};

export default BrainDumpPage;

