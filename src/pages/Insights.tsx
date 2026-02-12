import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PatternInsightsPanel from '@/components/insights/PatternInsightsPanel';
import { analyzePatterns, getInsightsForPeriod, PatternAnalysis } from '@/utils/patternRecognition';
import { useDashboard } from '@/hooks/useDashboard';
import { useToast } from '@/hooks/use-toast';

const InsightsPage: React.FC = () => {
  const navigate = useNavigate();
  const { entries, isLoading: isDashboardLoading } = useDashboard();
  const { toast } = useToast();
  
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
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
          notes: e.fields?.notes || e.fields?.originalText || '',
          people: e.fields?.people 
            ? (typeof e.fields.people === 'string' 
              ? e.fields.people.split(',').map(p => p.trim())
              : Array.isArray(e.fields.people) ? e.fields.people : [])
            : [],
          tags: e.fields?.tags 
            ? (typeof e.fields.tags === 'string' 
              ? e.fields.tags.split(',').map(t => t.trim())
              : Array.isArray(e.fields.tags) ? e.fields.tags : [])
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

  const handleInsightClick = (insight: any) => {
    // Could navigate to filtered view of entries matching this insight
    const query = `insight=${insight.pattern}`;
    navigate(`/dashboard?${query}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <nav className="container mx-auto px-4 py-2 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold">Insights</h1>
          <div className="w-24"></div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        <article className="space-y-6 max-w-4xl mx-auto">
          {/* Page header */}
          <header className="space-y-2">
            <h2 className="text-3xl font-bold">It Read Your Mind</h2>
            <p className="text-muted-foreground">
              Patterns and insights from your brain dumps. What's been on your mind?
            </p>
          </header>

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
              {analysis.insights.length > 0 && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-lg">💡 Recommendation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {analysis.emotionalTone.intensity === 'high' && (
                      <p className="text-sm">
                        You've been feeling pretty {analysis.emotionalTone.primary.toLowerCase()} lately. 
                        Maybe it's time for a break or a check-in with someone you trust?
                      </p>
                    )}
                    {analysis.insights.some(i => i.type === 'emotion' && i.pattern === 'anxiety') && (
                      <p className="text-sm">
                        You've mentioned anxiety several times. Consider: What's one small thing you can control today?
                      </p>
                    )}
                    {analysis.insights.some(i => i.trendDirection === 'increasing' && i.type === 'emotion') && (
                      <p className="text-sm">
                        Your emotional intensity is increasing. Journaling more might help you work through it.
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

              {/* Debug info (remove in production) */}
              {process.env.NODE_ENV === 'development' && (
                <Card className="opacity-50 text-xs">
                  <CardHeader>
                    <CardTitle className="text-sm">Debug Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded overflow-auto max-h-40">
                      {JSON.stringify({
                        entriesAnalyzed: entries?.length,
                        insightsFound: analysis.insights.length,
                        emotionalTone: analysis.emotionalTone,
                        timeRange: {
                          start: analysis.timeRange.start.toISOString(),
                          end: analysis.timeRange.end.toISOString(),
                          days: analysis.timeRange.daysAnalyzed
                        }
                      }, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </article>
      </main>
    </>
  );
};

export default InsightsPage;
