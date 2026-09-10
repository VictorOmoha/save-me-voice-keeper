import {useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {WorkspacePage, WorkspacePageHeader} from '@/components/workspace/WorkspacePage';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import PatternInsightsPanel from '@/components/insights/PatternInsightsPanel';
import {getInsightsForPeriod, PatternInsight} from '@/utils/patternRecognition';
import {useDashboard} from '@/hooks/useDashboard';
import {fieldValueToText} from '@/utils/fieldValueGuards';

const list = (value: unknown): string[] => Array.isArray(value) ? value.map(fieldValueToText) : typeof value === 'string' ? value.split(',').map(s => s.trim()) : [];

export default function Insights() {
  const navigate = useNavigate();
  const {savedEntries: entries, isLoading} = useDashboard();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('week');
  const analysis = useMemo(() => getInsightsForPeriod(entries.filter(e => e.id).map(e => ({
    id: e.id, title: e.title || '',
    notes: fieldValueToText(e.fields?.notes) || fieldValueToText(e.fields?.content) || fieldValueToText(e.fields?.originalText),
    people: list(e.fields?.people), tags: list(e.fields?.tags), createdAt: new Date(e.createdAt),
  })), period), [entries, period]);
  const keyOf = (insight: PatternInsight) => `${insight.type}:${insight.pattern}`;
  const selected = analysis.insights.find(i => keyOf(i) === selectedKey);
  return <WorkspacePage>
    <WorkspacePageHeader title="Insights" description="Explore the evidence behind recurring themes in your memories." actions={
      <select aria-label="Insight period" className="workspace-select" value={period} onChange={e => {setPeriod(e.target.value as typeof period); setSelectedKey(null);}}>
        <option value="today">Last 24 hours</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option><option value="quarter">Last 90 days</option><option value="year">Last 365 days</option>
      </select>
    } />
    {isLoading ? <p role="status">Loading your memories…</p> : !entries.length ? <section className="workspace-panel p-6 space-y-4">
      <p className="text-muted-foreground">Save your first memory. Themes will appear as your collection grows.</p>
      <Button onClick={() => navigate('/dashboard?action=create')}>Save a memory</Button>
    </section> : <div className="space-y-5"><p className="text-sm text-muted-foreground">{analysis.summary}</p><PatternInsightsPanel analysis={analysis} onInsightClick={i => setSelectedKey(keyOf(i))} /></div>}
    <Dialog open={!!selected} onOpenChange={open => {if (!open) setSelectedKey(null);}}>
      <DialogContent className="workspace-shell max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl">
        <DialogHeader className="pr-8"><DialogTitle>{selected?.label}: source memories</DialogTitle><DialogDescription>Review the matching field and its context. Open a memory to read or correct it.</DialogDescription></DialogHeader>
        <div className="space-y-3">{entries.filter(e => selected?.entries.includes(e.id)).map(entry => <button key={entry.id} aria-label={`${entry.title} ${fieldValueToText(entry.fields.category) || 'Personal'}`} className="w-full rounded-xl border border-border/70 p-4 text-left hover:bg-muted" onClick={() => navigate(`/all-entries/${encodeURIComponent(entry.id)}`)}>
          <span className="block text-sm font-medium">{entry.title}</span>
          {selected?.evidence.filter(e => e.entryId === entry.id).map(e => <span key={e.source} className="mt-3 block text-sm leading-relaxed"><span className="mb-1 block text-xs text-primary">{e.source} · matched {e.matches.join(', ')}</span><q className="text-muted-foreground">{e.excerpt}</q></span>)}
        </button>)}</div>
      </DialogContent>
    </Dialog>
  </WorkspacePage>;
}
