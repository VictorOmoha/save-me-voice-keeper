import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter, useLocation} from 'react-router-dom';
import type {ReactNode} from 'react';
import Insights from './Insights';

const {entries, toast} = vi.hoisted(() => ({
  toast: vi.fn(),
  entries: [
    {id:'design-note',title:'Studio sketch',fields:{category:'Personal',notes:'A new design idea'},createdAt:new Date()},
    {id:'writing-note',title:'Weekend plan',fields:{category:'Personal',notes:'Write a short story'},createdAt:new Date()},
    {id:'other-note',title:'Receipt',fields:{category:'Finance',notes:'Coffee receipt'},createdAt:new Date()},
  ],
}));
vi.mock('@/hooks/useDashboard', () => ({useDashboard: () => ({savedEntries:entries,isLoading:false})}));
vi.mock('@/hooks/use-toast', () => ({useToast: () => ({toast})}));
vi.mock('@/components/workspace/WorkspacePage', () => ({
  WorkspacePage: ({children}: {children:ReactNode}) => <div>{children}</div>,
  WorkspacePageHeader: ({title,actions}: {title:string,actions:ReactNode}) => <header><h1>{title}</h1>{actions}</header>,
}));
const CurrentRoute = () => <output aria-label="Current route">{useLocation().pathname}</output>;
afterEach(cleanup);

describe('Insight source navigation', () => {
  it('opens contributing entries even when their text does not contain the theme label', async () => {
    render(<MemoryRouter initialEntries={['/insights']}><Insights /><CurrentRoute /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button',{name:/Creativity/}));
    expect(screen.getByRole('dialog',{name:'Creativity: source memories'})).toBeTruthy();
    expect(screen.getByRole('button',{name:'Studio sketch Personal'})).toBeTruthy();
    expect(screen.getByRole('button',{name:'Weekend plan Personal'})).toBeTruthy();
    expect(screen.queryByRole('button',{name:'Receipt Finance'})).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Studio sketch Personal'}));
    expect(screen.getByLabelText('Current route').textContent).toBe('/all-entries/design-note');
  });
});
