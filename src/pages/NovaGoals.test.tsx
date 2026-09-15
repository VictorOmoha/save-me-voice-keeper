import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';
import {GoalDetail} from './NovaGoals';
import type {NovaGoal} from '@/services/novaGoals';
vi.mock('@/lib/firebase', () => ({db: {}}));
vi.mock('@/contexts/AuthContext', () => ({useAuth: () => ({user: null})}));
vi.mock('@/components/workspace/WorkspacePage', () => ({WorkspacePage: ({children}: {children: React.ReactNode}) => children, WorkspacePageHeader: () => null}));
const base: NovaGoal = {id: 'a'.repeat(64), user_id: 'alice', goal: 'Save a plan', status: 'waiting', write_mode: 'review', allow_web: false, max_steps: 16, steps: [], plan: ['Draft the plan'], result: '', question: 'Review this note', pending: {tool: 'save_note', args: {title: 'My plan', content: '<script>bad()</script>'}}, pending_id: 'specific-change', sources: [], outputs: []};
describe('Nova goal controls', () => {
  it('shows exact proposed content safely and approves the displayed action id', () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const {container} = render(<MemoryRouter><GoalDetail run={base} busy={false} onAction={action} /></MemoryRouter>);
    expect(screen.getByText('<script>bad()</script>')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    fireEvent.click(screen.getByRole('button', {name: 'Approve change'}));
    expect(action).toHaveBeenCalledWith('approve', {pendingId: 'specific-change'});
  });
  it('preserves an unsent reply after a failed request and supplies question version', async () => {
    const action = vi.fn().mockRejectedValue(new Error('offline'));
    render(<MemoryRouter><GoalDetail run={{...base, pending: null, question: 'Which day?'}} busy={false} onAction={action} /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Your reply'), {target: {value: 'Friday'}});
    fireEvent.click(screen.getByRole('button', {name: 'Reply and continue'}));
    await waitFor(() => expect(action).toHaveBeenCalledWith('reply', {answer: 'Friday', expectedSteps: 0}));
    expect(screen.getByLabelText('Your reply')).toHaveValue('Friday');
  });
  it('requires a deliberate cancellation and retains completed work', () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<MemoryRouter><GoalDetail run={{...base, status: 'running'}} busy={false} onAction={action} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByText('Completed changes will be kept.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Cancel this goal'}));
    expect(action).toHaveBeenCalledWith('cancel');
  });
});
