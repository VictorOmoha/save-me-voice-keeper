import {describe, expect, it} from 'vitest';
import {futureTime, newRun, requiresApproval, validateAction} from './policy';

describe('Nova goal policy', () => {
  it('rejects tools and extra arguments outside the available capabilities', () => {
    expect(() => validateAction({tool: 'execute_shell', args: {command: 'anything'}})).toThrow();
    expect(() => validateAction({tool: 'save_note', args: {title: 'Draft', content: 'text', category: 'Work', user_id: 'bob'}})).toThrow();
    expect(() => validateAction({tool: 'read_entry', args: {id: '../bob'}})).toThrow();
  });
  it('requires deletion approval in every mode and validates bounded goals and times', () => {
    expect(requiresApproval({tool: 'delete_note', args: {}}, {write_mode: 'auto'})).toBe(true);
    expect(requiresApproval({tool: 'save_note', args: {}}, {write_mode: 'auto'})).toBe(false);
    expect(() => newRun('alice', 'Goal', {maxSteps: 100}, 0)).toThrow();
    expect(newRun('alice', 'Goal', {}, 0)).toMatchObject({max_steps: 16, write_mode: 'review', allow_web: false});
    expect(() => futureTime('2026-10-01T10:00:00', 0)).toThrow();
    expect(() => futureTime('2020-01-01T10:00:00Z', Date.now())).toThrow();
  });
});
