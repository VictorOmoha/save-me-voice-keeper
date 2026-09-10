/** Descriptive, local evidence grouping. Word overlap is never a mood or intent assessment. */
export interface PatternEvidence {
  entryId: string;
  source: 'title' | 'notes' | 'people' | 'tags';
  matches: string[];
  excerpt: string;
}
export interface PatternInsight {
  type: 'topic' | 'person' | 'tag';
  label: string;
  pattern: string;
  occurrences: number;
  entries: string[];
  evidence: PatternEvidence[];
}
export interface PatternAnalysis {
  timeRange: {start: Date; end: Date; daysAnalyzed: number};
  entryCount: number;
  insights: PatternInsight[];
  summary: string;
}
interface PatternEntry {
  id: string; title: string; notes: string; people: string[]; tags: string[]; createdAt: Date;
}
const TOPICS: Record<string, string[]> = {
  health: ['health', 'exercise', 'workout', 'sleep', 'nutrition', 'doctor', 'medical'],
  work: ['work', 'project', 'deadline', 'meeting', 'client', 'code', 'deploy'],
  relationships: ['partner', 'spouse', 'friend', 'family', 'relationship'],
  finance: ['money', 'budget', 'expense', 'invoice', 'payment', 'salary', 'bills', 'debt'],
  learning: ['learn', 'study', 'course', 'book', 'skill', 'tutorial'],
  creativity: ['idea', 'create', 'design', 'write', 'art', 'music'],
  goals: ['goal', 'target', 'plan', 'strategy', 'roadmap', 'milestone', 'objective'],
};
const normal = (text: string) => text.trim().normalize('NFKC').toLocaleLowerCase();
const wordMatch = (text: string, word: string) => {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}_])(${escaped})(?=$|[^\\p{L}\\p{N}_])`, 'iu').exec(text);
};
const excerpt = (text: string, index: number) => {
  const start = Math.max(0, index - 65), end = Math.min(text.length, index + 160);
  return `${start ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
};

export function analyzePatterns(entries: PatternEntry[], daysBack = 7, now = new Date()): PatternAnalysis {
  const days = Number.isFinite(daysBack) && daysBack > 0 ? daysBack : 7;
  const start = new Date(now.getTime() - days * 86_400_000);
  const relevant = [...new Map(entries.filter(e => e.id && e.createdAt >= start && e.createdAt <= now).map(e => [e.id, e])).values()];
  const insights: PatternInsight[] = [];
  const add = (type: PatternInsight['type'], label: string, pattern: string, evidence: PatternEvidence[]) => {
    const ids = [...new Set(evidence.map(e => e.entryId))];
    if (ids.length >= 2) insights.push({type, label, pattern, entries: ids, occurrences: ids.length, evidence});
  };
  for (const [topic, words] of Object.entries(TOPICS)) {
    const evidence: PatternEvidence[] = [];
    for (const entry of relevant) {
      for (const source of ['title', 'notes'] as const) {
        const text = entry[source] || '';
        const matches = words.flatMap(word => {const hit = wordMatch(text, word); return hit ? [{word: hit[2], index: hit.index}] : [];});
        if (matches.length) evidence.push({entryId: entry.id, source, matches: matches.map(m => m.word), excerpt: excerpt(text, Math.min(...matches.map(m => m.index)))});
      }
    }
    add('topic', topic.charAt(0).toUpperCase() + topic.slice(1), topic, evidence);
  }
  for (const [source, type] of [['people', 'person'], ['tags', 'tag']] as const) {
    const groups = new Map<string, {label: string; evidence: PatternEvidence[]}>();
    for (const entry of relevant) {
      const unique = new Map((entry[source] || []).filter(v => typeof v === 'string' && v.trim()).map(v => [normal(v), v.trim()]));
      for (const [key, value] of unique) {
        const group = groups.get(key) || {label: value, evidence: []};
        group.evidence.push({entryId: entry.id, source, matches: [value], excerpt: value});
        groups.set(key, group);
      }
    }
    for (const [key, group] of groups) add(type, group.label, key, group.evidence);
  }
  // Explicit metadata precedes suggested word groupings; counts represent distinct memories.
  insights.sort((a, b) => Number(a.type === 'topic') - Number(b.type === 'topic') || b.occurrences - a.occurrences || a.label.localeCompare(b.label));
  return {timeRange: {start, end: now, daysAnalyzed: days}, entryCount: relevant.length, insights,
    summary: `${relevant.length} ${relevant.length === 1 ? 'memory' : 'memories'} saved in the last ${days} ${days === 1 ? 'day' : 'days'}.`};
}
export function getInsightsForPeriod(entries: PatternEntry[], period: 'today' | 'week' | 'month' | 'quarter' | 'year'): PatternAnalysis {
  return analyzePatterns(entries, {today: 1, week: 7, month: 30, quarter: 90, year: 365}[period]);
}
