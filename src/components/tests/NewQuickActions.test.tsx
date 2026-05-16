import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NewQuickActions } from '@/components/NewQuickActions';

vi.mock('@/components/SmartSearch', () => ({
  SmartSearchWithBoundary: ({ placeholder }: { placeholder?: string }) => (
    <input aria-label="Search entries" placeholder={placeholder} />
  ),
}));

describe('NewQuickActions', () => {
  it('uses one clear voice CTA, one manual memory CTA, and a full document label', () => {
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

    expect(screen.getAllByText('Voice Dump').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Save Memory').length).toBeGreaterThan(0);
    expect(screen.getByText('Upload Document')).toBeTruthy();
    expect(screen.queryByText('Quick Save')).toBeNull();
    expect(screen.queryByText('Doc')).toBeNull();
    expect(screen.queryByText(/Brain dump/i)).toBeNull();
  });
});
