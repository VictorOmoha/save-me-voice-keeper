import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Tag,
  Heart,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { PatternAnalysis, PatternInsight } from '@/utils/patternRecognition';

interface PatternInsightsPanelProps {
  analysis: PatternAnalysis;
  onInsightClick?: (insight: PatternInsight) => void;
}

export function PatternInsightsPanel({
  analysis,
  onInsightClick
}: PatternInsightsPanelProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');

  const getInsightIcon = (type: PatternInsight['type']) => {
    switch (type) {
      case 'emotion':
        return <Heart className="h-4 w-4" />;
      case 'topic':
        return <Brain className="h-4 w-4" />;
      case 'person':
        return <Users className="h-4 w-4" />;
      case 'action':
        return <Target className="h-4 w-4" />;
      case 'frequency':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'negative':
        return 'bg-red-50 border-red-200';
      case 'mixed':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return null;
    }
  };

  const emotionalToneColor =
    analysis.emotionalTone.primary === 'positive'
      ? 'bg-green-100 text-green-900'
      : analysis.emotionalTone.primary === 'negative'
        ? 'bg-red-100 text-red-900'
        : 'bg-slate-100 text-slate-900';

  const emotionalToneIntensity =
    analysis.emotionalTone.intensity === 'high'
      ? '🔴 High'
      : analysis.emotionalTone.intensity === 'medium'
        ? '🟡 Medium'
        : '🟢 Low';

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex gap-2">
        <Button
          variant={selectedPeriod === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('today')}
        >
          Today
        </Button>
        <Button
          variant={selectedPeriod === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('week')}
        >
          This Week
        </Button>
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('month')}
        >
          This Month
        </Button>
      </div>

      {/* Emotional tone summary */}
      <Card className={emotionalToneColor}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Your Vibe</CardTitle>
            <Heart className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Primary Emotion:</span>
              <Badge variant="secondary">{analysis.emotionalTone.primary}</Badge>
            </div>
            {analysis.emotionalTone.secondary && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Also feeling:</span>
                <Badge variant="outline">{analysis.emotionalTone.secondary}</Badge>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Intensity:</span>
              <span className="text-sm font-semibold">{emotionalToneIntensity}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {analysis.summary && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              💡 {analysis.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key insights */}
      {analysis.insights.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Key Patterns
            </CardTitle>
            <CardDescription>
              What I've noticed in your entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.insights.map((insight, idx) => (
                <button
                  key={idx}
                  onClick={() => onInsightClick?.(insight)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors hover:shadow-md ${getSentimentColor(
                    insight.sentiment
                  )}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="mt-1">{getInsightIcon(insight.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium capitalize">
                            {insight.label}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {insight.occurrences}x
                          </Badge>
                          {insight.trendDirection && (
                            <div className="flex items-center gap-1">
                              {getTrendIcon(insight.trendDirection)}
                              <span className="text-xs text-muted-foreground capitalize">
                                {insight.trendDirection}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {insight.type === 'emotion' &&
                            `You've mentioned this ${insight.occurrences} times in your entries`}
                          {insight.type === 'topic' &&
                            `This topic appears in ${insight.occurrences} of your entries`}
                          {insight.type === 'person' &&
                            `${insight.label} was mentioned ${insight.occurrences} times`}
                          {insight.type === 'action' &&
                            `Tagged "${insight.label}" ${insight.occurrences} times`}
                        </p>
                        {insight.lastSeen && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Last seen:{' '}
                            {new Date(insight.lastSeen).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold"
                        title={`${Math.round(insight.confidence * 100)}% confidence`}
                      >
                        {Math.round(insight.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                Need more entries to find patterns. Keep brain dumping!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PatternInsightsPanel;
