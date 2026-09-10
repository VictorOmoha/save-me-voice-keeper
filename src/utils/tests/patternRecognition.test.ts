import {describe, expect, it} from 'vitest';
import {analyzePatterns} from '../patternRecognition';
const now = new Date('2026-09-10T12:00:00Z');
const entry = (id: string, notes = '', more = {}) => ({id, title: '', notes, people: [], tags: [], createdAt: now, ...more});
describe('Evidence-backed patterns', () => {
  it('does not infer emotions or match words inside unrelated words', () => {
    const result = analyzePatterns([entry('a', 'Slow down. I am not anxious. A party on the hill.'), entry('b', 'A cart full of content and billing paperwork.')], 7, now);
    expect(result.insights).toEqual([]);
    expect(result).not.toHaveProperty('emotionalTone');
  });
  it('keeps negation and quoted context visible and counts distinct memories', () => {
    const result = analyzePatterns([entry('a', 'I do not want this project. Project notes.', {title:'Project'}), entry('b', 'Sam said “the project is finished.”')], 7, now);
    const work = result.insights.find(i => i.pattern === 'work')!;
    expect(work.occurrences).toBe(2);
    expect(work.evidence.find(e => e.source === 'notes')?.excerpt).toContain('do not want');
    expect(work).not.toHaveProperty('confidence');
  });
  it('deduplicates case-insensitive saved tags and people per memory', () => {
    const result = analyzePatterns([entry('a', '', {people:[' Sam ', 'sam'], tags:['Trip','trip']}), entry('b', '', {people:['sam'],tags:['trip']})], 7, now);
    expect(result.insights.map(i => [i.type, i.occurrences])).toEqual([['person',2],['tag',2]]);
  });
  it('excludes future, invalid, old, and duplicate entries', () => {
    const result = analyzePatterns([entry('a','project'),entry('a','project'),entry('future','project',{createdAt:new Date(now.getTime()+1)}),entry('old','project',{createdAt:new Date('2020-01-01')}),entry('bad','project',{createdAt:new Date('bad')})],7,now);
    expect(result.entryCount).toBe(1); expect(result.insights).toEqual([]);
  });
});
