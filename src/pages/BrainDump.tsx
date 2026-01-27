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
import { ArrowLeft, LayoutDashboard, Sparkles, Loader2, Users, Tag } from "lucide-react";

const processor = new BrainDumpProcessor();

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

  const hasStructured = useMemo(() => !!title || actionItems.length || keyPoints.length || notes.length, [title, actionItems, keyPoints, notes]);

  // Convert ActionItem[] to string[] for display
  const actionItemStrings = useMemo(() => actionItemsToStrings(actionItems), [actionItems]);

  // Dedupe guards to avoid double start/speak when navigated via voice
  const introSpokenRef = useRef(false);
  const captureStartedRef = useRef(false);

  useEffect(() => {
    document.title = "Brain Dump | Fast voice capture";
    // Meta description and canonical
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

  // Auto-start capture when navigated via voice with autoStart flag
  useEffect(() => {
    // Read persisted intent set by the navigation listener
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
      // TODO: Implement AI enhancement with Firebase Cloud Functions when ready
      // For now, fall back to local processing
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
      // Reset all state
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

  // Voice command helpers and listeners
  const lastHandledRef = useRef<string>("");
  const normalizeCategory = (raw: string): string | null => {
    const s = raw.trim().toLowerCase();
    if (!s) return null;
    const map: Record<string, string> = {
      'document': 'Documents', 'doc': 'Documents', 'proposal': 'Documents', 'contract': 'Documents', 'agreement': 'Documents', 'report': 'Documents', 'memo': 'Documents', 'letter': 'Documents', 'sow': 'Documents', 'policy': 'Documents', 'sop': 'Documents'
    };
    if (map[s]) return map[s];
    if (/meeting|standup|retro|minutes|client/.test(s)) return 'Work';
    if (/invoice|budget|tax|payment|quote|estimate|receipt/.test(s)) return 'Finance';
    if (/doctor|medical|health|prescription|hospital/.test(s)) return 'Health';
    if (/personal|home|family|travel|vacation/.test(s)) return 'Personal';
    // Title-case fallback
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const isProcessCommand = (text: string) => /\b(process|structure|organis|organiz|analy[sz]e|summari[sz]e|make\s+notes|turn\s+this\s+into\s+notes)\b/.test(text);

  // Filter out TTS echo - these are phrases the system says back that might be picked up by the mic
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
    // Ignore TTS echo
    if (isTTSEcho(text)) return null;

    // Be very strict about save commands to avoid false positives
    // Only match when it's clearly a command, not just the word "save" in normal speech
    // Valid patterns: "save it", "save this", "save that", "please save", "now save", "save to [category]"
    // Invalid: "trying to save my life", "save your structured notes" (TTS echo)

    const saveCommandPatterns = [
      /^save\s+(it|this|that)\b/i,                    // "save it", "save this" at start
      /\b(please|now|go\s+ahead\s+and|can\s+you)\s+save\s+(it|this|that)?\b/i,  // "please save it", "now save this"
      /\bsave\s+(it|this|that)\s*(now|please)?\s*$/i, // "save it" at end
      /\bsave\s+(to|as|in|under)\s+\w+/i,             // "save to work", "save as personal"
      /\bstore\s+(it|this|that)\b/i,                  // "store it"
      // Note: Removed "commit" as it conflicts with git terminology
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

  // Voice navigation: Recognize intents to go to the dashboard from Brain Dump
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

    // Filter out TTS echo early - don't process anything that sounds like system feedback
    if (isTTSEcho(lower)) {
      console.log('🔇 BrainDump: Ignoring TTS echo:', t);
      lastHandledRef.current = t;
      return;
    }

    // Handle navigation intents first
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
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
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
              <p className="text-xs text-muted-foreground">Status: {isListening ? 'Listening…' : 'Idle'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Structured Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Generated title" />
              </div>

              {summary && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Summary</label>
                  <Textarea value={summary} onChange={(e)=>setSummary(e.target.value)} className="min-h-[60px]" />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input value={category} onChange={(e)=>setCategory(e.target.value)} placeholder="e.g. Personal, Work" />
              </div>

              {tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <label className="text-sm font-medium">Tags</label>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {people.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <label className="text-sm font-medium">People Mentioned</label>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {people.map((person, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">@{person}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {actionItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Action Items</h3>
                    <Badge variant="secondary">{actionItems.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {actionItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded">
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

              {keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Key Points</h3>
                  <Textarea value={keyPoints.join('\n')} onChange={(e)=>setKeyPoints(e.target.value.split('\n').filter(Boolean))} className="min-h-[100px]" />
                </div>
              )}

              {notes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Notes</h3>
                  <Textarea value={notes.join('\n\n')} onChange={(e)=>setNotes(e.target.value.split('\n').filter(Boolean))} className="min-h-[100px]" />
                </div>
              )}

              {confidence !== null && (
                <p className="text-xs text-muted-foreground">Confidence: {Math.round((confidence || 0) * 100)}%</p>
              )}

              <div className="pt-2">
                <Button onClick={handleSave} aria-label="Save structured entry">Save to Entries</Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </article>
    </main>
  </>
);
};

export default BrainDumpPage;
