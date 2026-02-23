/**
 * Pattern Recognition Engine
 * Analyzes entries to find patterns, recurring themes, emotional trends
 */

export interface PatternInsight {
  type: 'emotion' | 'topic' | 'person' | 'action' | 'frequency';
  label: string;
  pattern: string;
  occurrences: number;
  entries: string[]; // entry IDs
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: number; // 0-1
  firstSeen?: Date;
  lastSeen?: Date;
  trendDirection?: 'increasing' | 'decreasing' | 'stable';
}

export interface PatternAnalysis {
  timeRange: {
    start: Date;
    end: Date;
    daysAnalyzed: number;
  };
  insights: PatternInsight[];
  summary: string;
  emotionalTone: {
    primary: string;
    secondary?: string;
    intensity: 'low' | 'medium' | 'high';
  };
}

// Emotion detection patterns
const EMOTIONS = {
  anxiety: ['anxious', 'anxiou', 'worried', 'nervous', 'stressed', 'stress', 'overwhelmed', 'panic', 'tense', 'uneasy'],
  frustration: ['frustrated', 'frustrated', 'annoyed', 'irritated', 'angry', 'mad', 'upset', 'fed up'],
  excitement: ['excited', 'thrilled', 'amazing', 'awesome', 'great', 'wonderful', 'fantastic', 'pumped'],
  confidence: ['confident', 'assured', 'certain', 'determined', 'strong', 'capable', 'powerful'],
  sadness: ['sad', 'depressed', 'down', 'unhappy', 'miserable', 'disappointed', 'heartbroken'],
  joy: ['happy', 'joyful', 'delighted', 'pleased', 'content', 'grateful', 'blessed'],
  exhaustion: ['tired', 'exhausted', 'drained', 'burnt out', 'fatigued', 'sleepy', 'worn out'],
  productivity: ['accomplished', 'productive', 'finished', 'completed', 'done', 'shipped', 'launched'],
};

// Topic keywords
const TOPICS = {
  health: ['health', 'exercise', 'workout', 'sleep', 'diet', 'nutrition', 'doctor', 'medical', 'ill', 'sick', 'pain'],
  work: ['work', 'project', 'deadline', 'meeting', 'boss', 'team', 'client', 'code', 'bug', 'feature', 'deploy'],
  relationships: ['partner', 'spouse', 'friend', 'family', 'relationship', 'love', 'conflict', 'conversation'],
  finance: ['money', 'budget', 'expense', 'invoice', 'payment', 'salary', 'bills', 'debt', 'invest', 'cost'],
  learning: ['learn', 'study', 'course', 'book', 'skill', 'improve', 'tutorial', 'practice', 'master'],
  creativity: ['idea', 'create', 'design', 'write', 'art', 'music', 'inspire', 'imagine', 'vision'],
  goals: ['goal', 'target', 'aim', 'plan', 'strategy', 'roadmap', 'milestone', 'objective'],
  decision: ['decide', 'choice', 'option', 'dilemma', 'question', 'unsure', 'consider', 'think about'],
};

/**
 * Analyze entries for patterns within a time range
 */
export function analyzePatterns(
  entries: Array<{ id: string; title: string; notes: string; people: string[]; tags: string[]; createdAt: Date; fields?: Record<string, unknown> }>,
  daysBack: number = 7
): PatternAnalysis {
  const now = new Date();
  const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  // Filter entries in time range
  const relevantEntries = entries.filter(e => e.createdAt >= startDate);
  
  if (relevantEntries.length === 0) {
    return {
      timeRange: { start: startDate, end: now, daysAnalyzed: daysBack },
      insights: [],
      summary: `No entries in the last ${daysBack} days.`,
      emotionalTone: { primary: 'neutral', intensity: 'low' }
    };
  }

  const insights: PatternInsight[] = [];
  const allText = relevantEntries.map(e => (e.title + ' ' + e.notes).toLowerCase()).join(' ');

  // Emotion patterns
  for (const [emotion, keywords] of Object.entries(EMOTIONS)) {
    const matches = findKeywordMatches(allText, keywords, relevantEntries);
    if (matches.count > 0) {
      insights.push({
        type: 'emotion',
        label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        pattern: emotion,
        occurrences: matches.count,
        entries: matches.entries,
        sentiment: getEmotionSentiment(emotion),
        confidence: Math.min(matches.count / relevantEntries.length, 1),
        firstSeen: matches.first,
        lastSeen: matches.last,
        trendDirection: calculateTrend(matches.entries, emotion)
      });
    }
  }

  // Topic patterns
  for (const [topic, keywords] of Object.entries(TOPICS)) {
    const matches = findKeywordMatches(allText, keywords, relevantEntries);
    if (matches.count >= 2) { // Only show if mentioned 2+ times
      insights.push({
        type: 'topic',
        label: topic.charAt(0).toUpperCase() + topic.slice(1),
        pattern: topic,
        occurrences: matches.count,
        entries: matches.entries,
        confidence: Math.min(matches.count / relevantEntries.length, 1),
        firstSeen: matches.first,
        lastSeen: matches.last,
      });
    }
  }

  // Person patterns (from people field)
  const personCounts: Record<string, { count: number; entries: string[] }> = {};
  relevantEntries.forEach(e => {
    (e.people || []).forEach(person => {
      if (!personCounts[person]) {
        personCounts[person] = { count: 0, entries: [] };
      }
      personCounts[person].count++;
      personCounts[person].entries.push(e.id);
    });
  });

  for (const [person, data] of Object.entries(personCounts)) {
    if (data.count >= 2) {
      insights.push({
        type: 'person',
        label: person,
        pattern: person,
        occurrences: data.count,
        entries: data.entries,
        confidence: Math.min(data.count / relevantEntries.length, 1),
      });
    }
  }

  // Action item patterns (from tags)
  const tagCounts: Record<string, { count: number; entries: string[] }> = {};
  relevantEntries.forEach(e => {
    (e.tags || []).forEach(tag => {
      if (!tagCounts[tag]) {
        tagCounts[tag] = { count: 0, entries: [] };
      }
      tagCounts[tag].count++;
      tagCounts[tag].entries.push(e.id);
    });
  });

  for (const [tag, data] of Object.entries(tagCounts)) {
    if (data.count >= 2) {
      insights.push({
        type: 'action',
        label: tag,
        pattern: tag,
        occurrences: data.count,
        entries: data.entries,
        confidence: Math.min(data.count / relevantEntries.length, 1),
      });
    }
  }

  // Sort by confidence and occurrences
  insights.sort((a, b) => {
    if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
    return b.confidence - a.confidence;
  });

  // Generate summary
  const summary = generateSummary(insights, daysBack, relevantEntries.length);

  // Determine emotional tone
  const emotionalInsights = insights.filter(i => i.type === 'emotion');
  const emotionalTone = analyzeEmotionalTone(emotionalInsights);

  return {
    timeRange: { start: startDate, end: now, daysAnalyzed: daysBack },
    insights: insights.slice(0, 10), // Top 10 insights
    summary,
    emotionalTone
  };
}

/**
 * Find keyword matches in text
 */
function findKeywordMatches(
  text: string,
  keywords: string[],
  entries: Array<{ id: string; createdAt: Date }>
): { count: number; entries: string[]; first?: Date; last?: Date } {
  const matchedEntries = new Set<string>();
  let count = 0;
  let firstDate: Date | undefined;
  let lastDate: Date | undefined;

  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}`, 'g');
    const matches = text.match(regex) || [];
    count += matches.length;

    // Find which entries contain this keyword
    for (const entry of entries) {
      const entryText = (entry as { title?: string; notes?: string }).title + ' ' + (entry as { title?: string; notes?: string }).notes;
      if (entryText.toLowerCase().includes(keyword)) {
        matchedEntries.add(entry.id);
        if (!firstDate || entry.createdAt < firstDate) firstDate = entry.createdAt;
        if (!lastDate || entry.createdAt > lastDate) lastDate = entry.createdAt;
      }
    }
  }

  return {
    count,
    entries: Array.from(matchedEntries),
    first: firstDate,
    last: lastDate
  };
}

/**
 * Determine sentiment of emotion
 */
function getEmotionSentiment(emotion: string): 'positive' | 'negative' | 'neutral' {
  const positive = ['excitement', 'confidence', 'joy', 'productivity'];
  const negative = ['anxiety', 'frustration', 'sadness', 'exhaustion'];

  if (positive.includes(emotion)) return 'positive';
  if (negative.includes(emotion)) return 'negative';
  return 'neutral';
}

/**
 * Calculate trend direction over time
 */
function calculateTrend(entryIds: string[], pattern: string): 'increasing' | 'decreasing' | 'stable' {
  if (entryIds.length < 2) return 'stable';
  
  // Simple heuristic: if most recent entries have the pattern more, it's increasing
  const firstHalf = Math.floor(entryIds.length / 2);
  const recentCount = entryIds.length - firstHalf;
  
  if (recentCount > firstHalf * 1.2) return 'increasing';
  if (recentCount < firstHalf * 0.8) return 'decreasing';
  return 'stable';
}

/**
 * Analyze overall emotional tone
 */
function analyzeEmotionalTone(
  insights: PatternInsight[]
): { primary: string; secondary?: string; intensity: 'low' | 'medium' | 'high' } {
  if (insights.length === 0) {
    return { primary: 'neutral', intensity: 'low' };
  }

  // Sort by occurrences
  const sorted = [...insights].sort((a, b) => b.occurrences - a.occurrences);
  const primary = sorted[0].label;
  const secondary = sorted[1]?.label;
  
  // Intensity based on total emotion mentions
  const totalMentions = sorted.reduce((sum, i) => sum + i.occurrences, 0);
  const intensity: 'low' | 'medium' | 'high' =
    totalMentions > 10 ? 'high' : totalMentions > 5 ? 'medium' : 'low';

  return { primary, secondary, intensity };
}

/**
 * Generate human-readable summary
 */
function generateSummary(insights: PatternInsight[], daysBack: number, entryCount: number): string {
  if (insights.length === 0) {
    return `You created ${entryCount} entries in the last ${daysBack} days.`;
  }

  const topInsight = insights[0];
  const emotionInsights = insights.filter(i => i.type === 'emotion').slice(0, 2);
  const topicInsights = insights.filter(i => i.type === 'topic').slice(0, 2);

  const parts: string[] = [];
  parts.push(`Over the last ${daysBack} days, you created ${entryCount} entries.`);

  if (emotionInsights.length > 0) {
    const emotion = emotionInsights[0];
    parts.push(`You mentioned "${emotion.pattern}" ${emotion.occurrences} times.`);
  }

  if (topicInsights.length > 0) {
    const topics = topicInsights.map(t => t.pattern).join(' and ');
    parts.push(`Your main focus areas: ${topics}.`);
  }

  return parts.join(' ');
}

/**
 * Get insights for specific time periods
 */
export function getInsightsForPeriod(
  entries: Array<{ id: string; title: string; notes: string; people: string[]; tags: string[]; createdAt: Date }>,
  period: 'today' | 'week' | 'month' | 'quarter' | 'year'
): PatternAnalysis {
  const daysMap = {
    today: 1,
    week: 7,
    month: 30,
    quarter: 90,
    year: 365
  };

  return analyzePatterns(entries, daysMap[period]);
}
