import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EnhancedRecentEntries } from '@/components/entries/EnhancedRecentEntries';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('EnhancedRecentEntries empty-state demo readiness', () => {
  it('shows realistic demo examples instead of generic empty copy', () => {
    render(
      <MemoryRouter>
        <EnhancedRecentEntries entries={[]} showViewToggle={false} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Start with one voice dump/i)).toBeTruthy();
    expect(screen.getByLabelText('Demo-ready example entries')).toBeTruthy();
    expect(screen.getByText('Insurance renewal reminder')).toBeTruthy();
    expect(screen.getByText("Mom's medication schedule")).toBeTruthy();
    expect(screen.getByText('Client follow-up after demo')).toBeTruthy();
    expect(screen.queryByText(/Use voice commands or the Add Entry button/i)).toBeNull();
  });
});
