import {ArrowUpRight, FileText} from 'lucide-react';
import {PatternAnalysis, PatternInsight} from '@/utils/patternRecognition';

export function PatternInsightsPanel({analysis, onInsightClick}: {analysis: PatternAnalysis; onInsightClick?: (insight: PatternInsight) => void}) {
  return <section className="workspace-panel p-5 sm:p-6 space-y-5" aria-labelledby="themes-heading">
    <div>
      <h2 id="themes-heading" className="text-lg font-semibold">Recurring themes</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">People and tags come from saved fields. Suggested topics group matching words; they may refer to a quote, a past event, or something you disagree with. Review the sources to decide what is relevant.</p>
    </div>
    {analysis.insights.length ? <div className="grid gap-3 md:grid-cols-2">{analysis.insights.map(insight =>
      <button key={`${insight.type}:${insight.pattern}`} type="button" onClick={() => onInsightClick?.(insight)} className="rounded-xl border border-border/70 p-4 text-left hover:bg-muted/40">
        <span className="flex items-center justify-between gap-3"><span className="font-medium">{insight.label}</span><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></span>
        <span className="mt-2 block text-xs text-primary">{insight.type === 'topic' ? 'Suggested topic · word matches' : insight.type === 'person' ? 'Saved people field' : 'Saved tag'}</span>
        <span className="mt-3 block text-sm text-muted-foreground">{insight.occurrences} of {analysis.entryCount} memories</span>
        <span className="mt-2 block text-xs text-muted-foreground">Matched: {[...new Set(insight.evidence.flatMap(e => e.matches))].join(', ')}</span>
      </button>
    )}</div> : <p className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4 shrink-0" />No recurring matches in this period. Themes appear when at least two memories share words, people, or tags.</p>}
  </section>;
}
export default PatternInsightsPanel;
