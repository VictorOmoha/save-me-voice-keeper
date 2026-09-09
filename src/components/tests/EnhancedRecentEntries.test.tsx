import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EnhancedRecentEntries } from '@/components/entries/EnhancedRecentEntries';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

afterEach(cleanup);

describe('EnhancedRecentEntries empty-state demo readiness', () => {
  it('distinguishes an empty search from an empty workspace and allows clearing it', () => {
    const clear = vi.fn();
    render(<MemoryRouter><EnhancedRecentEntries entries={[]} searchQuery="studio" onClearSearch={clear} /></MemoryRouter>);
    expect(screen.getByText('No memories match “studio”')).toBeTruthy();
    expect(screen.getByText('0 matching memories')).toBeTruthy();
    expect(screen.queryByLabelText('Example memories')).toBeNull();
    fireEvent.click(screen.getByRole('button', {name: 'Clear search'}));
    expect(clear).toHaveBeenCalledOnce();
  });
  it('shows realistic demo examples instead of generic empty copy', () => {
    render(
      <MemoryRouter>
        <EnhancedRecentEntries entries={[]} showViewToggle={false} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Save your first thought with Nova/i)).toBeTruthy();
    expect(screen.getByLabelText('Example memories')).toBeTruthy();
    expect(screen.getByText('Insurance renewal reminder')).toBeTruthy();
    expect(screen.getByText("Mom's medication schedule")).toBeTruthy();
    expect(screen.getByText('Client follow-up after demo')).toBeTruthy();
    expect(screen.queryByText(/Use voice commands or the Add Entry button/i)).toBeNull();
  });
});
