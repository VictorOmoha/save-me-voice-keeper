import {afterEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {EntriesTable} from '@/components/EntriesTable';
import type {SavedEntry} from '@/types/dashboard';
vi.mock('@/components/categoryView/useDownload', () => ({useDownload: () => ({handleDownload: vi.fn()})}));
vi.mock('@/components/entries/EnhancedEntryCard', () => ({EnhancedEntryCard: ({entry, onView}: {entry: SavedEntry; onView: (entry: SavedEntry) => void}) => <button onClick={() => onView(entry)}>{entry.title}</button>}));
vi.mock('@/components/export/ExportButton', () => ({ExportButton: () => <button>Export</button>}));
vi.mock('@/components/recentEntries/EntryViewDialog', () => ({EntryViewDialog: () => null}));
afterEach(cleanup);
const alpha: SavedEntry = {id:'a',title:'Alpha',fields:{category:'Personal'},createdAt:new Date('2026-01-01'),updatedAt:new Date('2026-01-01')};
const beta: SavedEntry = {...alpha,id:'b',title:'Beta',updatedAt:new Date('2026-01-02')};
describe('Memory library selection', () => {
  it('limits bulk deletion to visible selected memories after filtering', () => {
    const props = {onDelete:vi.fn(),onEdit:vi.fn(),onFill:vi.fn(),onUseAsTemplate:vi.fn(),onBulkDelete:vi.fn()};
    const {rerender} = render(<EntriesTable {...props} entries={[alpha,beta]} />);
    fireEvent.click(screen.getByRole('checkbox',{name:'Select all visible memories'}));
    rerender(<EntriesTable {...props} entries={[beta]} searchQuery="Beta" />);
    expect(screen.getByText('1 selected')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Delete selected'}));
    fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
    expect(props.onBulkDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Delete selected'}));
    fireEvent.click(screen.getByRole('button',{name:'Delete All'}));
    expect(props.onBulkDelete).toHaveBeenCalledWith(['b']);
  });
  it('offers clearing a failed search', () => {
    const clear=vi.fn();
    render(<EntriesTable entries={[]} searchQuery="missing" onClearSearch={clear} onDelete={vi.fn()} onEdit={vi.fn()} onFill={vi.fn()} onUseAsTemplate={vi.fn()} onBulkDelete={vi.fn()} />);
    expect(screen.getByText('No matching memories')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Clear search'}));
    expect(clear).toHaveBeenCalledOnce();
  });
});
