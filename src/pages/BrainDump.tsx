import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSavedEntries } from "@/hooks/useSavedEntries";
import { BrainDumpProcessor } from "@/utils/brainDumpProcessor";
import { useBrainDumpCapture } from "@/hooks/useBrainDumpCapture";
import { speak } from "@/utils/textToSpeech";
const processor = new BrainDumpProcessor();

const BrainDumpPage: React.FC = () => {
  const { saveEntry } = useSavedEntries();
  const { isListening, transcript, start, stop, reset } = useBrainDumpCapture();

  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Personal");
  const [notes, setNotes] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [structuredFields, setStructuredFields] = useState<Record<string, any>>({});
  const [confidence, setConfidence] = useState<number | null>(null);

  const hasStructured = useMemo(() => !!title || actionItems.length || keyPoints.length || notes.length, [title, actionItems, keyPoints, notes]);

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
        if (!isListening) start();
        if (payload?.autoSpeak) {
          speak('Start your brain dump now. Say "process" when you are finished.');
        }
      }
    } catch {}

    const handler = (e: Event) => {
      const event = e as CustomEvent<any>;
      if (!isListening) start();
      if (event.detail?.autoSpeak) {
        speak('Start your brain dump now. Say "process" when you are finished.');
      }
    };

    window.addEventListener('brain-dump:start-capture', handler as EventListener);
    return () => window.removeEventListener('brain-dump:start-capture', handler as EventListener);
  }, [isListening, start]);

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
    toast.success("Brain dump structured");
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
    if (actionItems.length) fieldDefinitions.push({ id: 'actionItems', name: 'Action Items', type: 'textarea' as const });
    if (keyPoints.length) fieldDefinitions.push({ id: 'keyPoints', name: 'Key Points', type: 'textarea' as const });
    if (notes.length) fieldDefinitions.push({ id: 'notes', name: 'Notes', type: 'textarea' as const });

    try {
      await saveEntry({
        title: title || `Brain Dump - ${new Date().toLocaleString()}`,
        fields: {
          category,
          originalText: (rawText || transcript).trim(),
          actionItems: actionItems.join('\n• '),
          keyPoints: keyPoints.join('\n• '),
          notes: notes.join('\n\n'),
          confidence,
          ...structuredFields,
          source: 'brain_dump'
        },
        fieldDefinitions,
        category,
      });
      toast.success("Saved structured brain dump");
      // Reset minimal state
      setRawText("");
      setTitle("");
      setNotes([]);
      setActionItems([]);
      setKeyPoints([]);
      setStructuredFields({});
      setConfidence(null);
    } catch (e) {
      // toast already shown in hook
    }
  };

  return (
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
              <div className="flex gap-2">
                {!isListening ? (
                  <Button onClick={start} aria-label="Start recording">Start</Button>
                ) : (
                  <Button variant="secondary" onClick={stop} aria-label="Stop recording">Stop</Button>
                )}
                <Button variant="outline" onClick={reset} aria-label="Reset transcript">Reset</Button>
                <Button variant="outline" onClick={handleProcess} aria-label="Process brain dump">Process</Button>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input value={category} onChange={(e)=>setCategory(e.target.value)} placeholder="e.g. Personal, Work" />
              </div>

              {actionItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Action Items</h3>
                    <Badge variant="secondary">{actionItems.length}</Badge>
                  </div>
                  <Textarea value={actionItems.join('\n')} onChange={(e)=>setActionItems(e.target.value.split('\n').filter(Boolean))} className="min-h-[120px]" />
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
  );
};

export default BrainDumpPage;
