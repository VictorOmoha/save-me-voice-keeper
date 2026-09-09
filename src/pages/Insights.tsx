import {WorkspacePage, WorkspacePageHeader} from '@/components/workspace/WorkspacePage';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PatternInsightsPanel from '@/components/insights/PatternInsightsPanel';
import { getInsightsForPeriod, PatternAnalysis, PatternInsight } from '@/utils/patternRecognition';
import { useDashboard } from '@/hooks/useDashboard';
import { useToast } from '@/hooks/use-toast';
import { fieldValueToText } from '@/utils/fieldValueGuards';

const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { savedEntries: entries, isLoading: isDashboardLoading } = useDashboard();
  const { toast } = useToast();
  
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<PatternInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('week');

  useEffect(() => {
    document.title = 'Insights | SaveMe Voice Keeper';
  }, []);

  // Analyze patterns when entries change or period changes
  useEffect(() => {
    if (entries && entries.length > 0) {
      setIsAnalyzing(true);
      try {
        // Convert entries to format needed by pattern recognition
        const formattedEntries = entries.map(e => ({
          id: e.id || Math.random().toString(),
          title: e.title || '',
          notes: fieldValueToText(e.fields?.notes) || fieldValueToText(e.fields?.originalText) || '',
          people: e.fields?.people
            ? (typeof e.fields.people === 'string'
              ? e.fields.people.split(',').map(p => p.trim())
              : Array.isArray(e.fields.people) ? e.fields.people.map(fieldValueToText) : [])
            : [],
          tags: e.fields?.tags
            ? (typeof e.fields.tags === 'string'
              ? e.fields.tags.split(',').map(t => t.trim())
              : Array.isArray(e.fields.tags) ? e.fields.tags.map(fieldValueToText) : [])
            : [],
          createdAt: e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt || Date.now()),
          fields: e.fields || {}
        }));

        const result = getInsightsForPeriod(formattedEntries, period);
        setAnalysis(result);
      } catch (error) {
        console.error('Error analyzing patterns:', error);
        toast({
          title: 'Analysis Error',
          description: 'Failed to analyze patterns. Try again later.',
          variant: 'destructive'
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [entries, period, toast]);

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  const handleInsightClick = (insight: PatternInsight) => setSelectedInsight(insight);

  return (
    <WorkspacePage>
      <WorkspacePageHeader title="Insights" description="Explore recurring themes and patterns in your saved memories." actions={
        <select aria-label="Insight period" className="workspace-select" value={period} onChange={event => setPeriod(event.target.value as typeof period)}>
          <option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="quarter">This quarter</option><option value="year">This year</option>
        </select>} />
      <article className="space-y-6">
          {/* Loading state */}
          {isDashboardLoading || isAnalyzing ? (
            <Card>
              <CardContent className="pt-6 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-muted-foreground">Analyzing your entries...</span>
              </CardContent>
            </Card>
          ) : entries && entries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <p className="text-muted-foreground">
                  No entries yet. Brain dump something to get started!
                </p>
                <Button onClick={() => navigate('/brain-dump')}>
                  Create Your First Brain Dump
                </Button>
              </CardContent>
            </Card>
          ) : analysis ? (
            <>
              {/* Time range info */}
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Analyzing {analysis.timeRange.daysAnalyzed} days of entries
                    ({entries?.length} total entries)
                  </p>
                </CardContent>
              </Card>

              {/* Pattern insights */}
              <PatternInsightsPanel 
                analysis={analysis}
                onInsightClick={handleInsightClick}
              />

              {/* Recommendations */}
              {(analysis.emotionalTone.intensity === 'high' || analysis.insights.some(i => i.type === 'emotion' && (i.pattern === 'anxiety' || i.trendDirection === 'increasing')) || analysis.insights.filter(i => i.type === 'topic').length > 3) && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">💡 Recommendation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.emotionalTone.intensity === 'high' && (
                      <p className="text-sm">
                        Several words matched the {analysis.emotionalTone.primary.toLowerCase()} theme. Open the source memories to see whether that matches what you meant.
                      </p>
                    )}
                    {analysis.insights.some(i => i.type === 'emotion' && i.pattern === 'anxiety') && (
                      <p className="text-sm">
                        If the anxiety theme feels relevant, you could use a new note to reflect on what is on your mind.
                      </p>
                    )}
                    {analysis.insights.some(i => i.trendDirection === 'increasing' && i.type === 'emotion') && (
                      <p className="text-sm">
                        These matches are based on words, so their meaning depends on the context of each memory.
                      </p>
                    )}
                    {analysis.insights.filter(i => i.type === 'topic').length > 3 && (
                      <p className="text-sm">
                        A lot on your plate! Breaking things into smaller chunks might help you feel less overwhelmed.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

            </>
          ) : null}
        </article>
      <Dialog open={!!selectedInsight} onOpenChange={open => {if (!open) setSelectedInsight(null);}}>
        <DialogContent className="workspace-shell max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl">
          <DialogHeader className="pr-8">
            <DialogTitle>{selectedInsight?.label}: source memories</DialogTitle>
            <DialogDescription>These memories contributed to this theme. Open one to review its context.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">{entries.filter(entry => selectedInsight?.entries.includes(entry.id)).map(entry =>
            <button key={entry.id} className="w-full rounded-xl border border-border/70 p-4 text-left text-sm hover:bg-muted" onClick={() => navigate(`/all-entries/${encodeURIComponent(entry.id)}`)}>
              <span className="block font-medium">{entry.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{fieldValueToText(entry.fields.category) || 'Personal'}</span>
            </button>)}
          </div>
        </DialogContent>
      </Dialog>
    </WorkspacePage>
  );
};

export default InsightsPage;
