import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SearchHeader } from '@/components/SearchHeader';
import { NewQuickActions } from '@/components/NewQuickActions';

vi.mock('@/components/SmartSearch', () => ({
  SmartSearchWithBoundary: ({ placeholder }: { placeholder?: string }) => (
    <input aria-label="Search entries" placeholder={placeholder} />
  ),
}));

vi.mock('@/components/recentEntries/EntryViewDialog', () => ({
  EntryViewDialog: () => null,
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  signOut: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

afterEach(() => cleanup());

const noop = vi.fn();

const layoutProps = {
  searchQuery: '',
  onSearchChange: noop,
  userName: 'Victor Omoha',
  savedEntries: [],
  onAddEntry: noop,
  onCategorySelect: noop,
  onAllEntriesSelect: noop,
  onEditEntry: noop,
  onDeleteEntry: noop,
  onSaveEntry: noop,
  onCancelEdit: noop,
};

describe('dashboard polish', () => {
  it('keeps the desktop header focused on search, archive, and account instead of duplicating capture CTAs', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SearchHeader {...layoutProps} />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('Search entries')).toBeTruthy();
    expect(screen.getByText('All entries')).toBeTruthy();
    expect(screen.queryByText('Voice Dump')).toBeNull();
    expect(screen.queryByText('Save Memory')).toBeNull();
    expect(screen.getByLabelText('Open account menu')).toBeTruthy();
    expect(screen.queryByText('VO')).toBeNull();
  });

  it('caps the readable desktop content width so ultrawide screens do not stretch the app', () => {
    render(
      <MemoryRouter>
        <DashboardLayout {...layoutProps}>
          <div>Dashboard body</div>
        </DashboardLayout>
      </MemoryRouter>
    );

    const contentShell = screen.getByTestId('dashboard-content-shell');
    expect(contentShell.className).toContain('max-w-[1500px]');
  });

  it('shows a single voice dump CTA in the main quick actions and leaves secondary actions below it', () => {
    render(
      <MemoryRouter>
        <NewQuickActions
          onAddEntry={vi.fn()}
          onCreateDocument={vi.fn()}
          entries={[]}
          searchQuery=""
          onSearchChange={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Voice Dump')).toHaveLength(1);
    expect(screen.getAllByText('Save Memory').length).toBeGreaterThan(0);
    expect(screen.getByText('Upload Document')).toBeTruthy();
  });
});
