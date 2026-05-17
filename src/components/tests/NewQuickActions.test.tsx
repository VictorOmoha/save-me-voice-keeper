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
  it('uses one dominant first-run voice CTA, one manual memory CTA, and a full document label', () => {
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

    expect(screen.getAllByText('Start Voice Dump')).toHaveLength(1);
    expect(screen.getByText('Say one thing you don’t want to forget.')).toBeTruthy();
    expect(screen.getAllByText('Save a Memory Manually').length).toBeGreaterThan(0);
    expect(screen.getByText('Upload Document')).toBeTruthy();
    expect(screen.getByText('1. Speak naturally')).toBeTruthy();
    expect(screen.getByText(/Review the structured memory/i)).toBeTruthy();
    expect(screen.getByText(/Search and open it later/i)).toBeTruthy();
    expect(screen.queryByText(/Create account/i)).toBeNull();
    expect(screen.queryByText(/Sign up/i)).toBeNull();
    expect(screen.queryByText('Quick Save')).toBeNull();
    expect(screen.queryByText('Add Entry')).toBeNull();
    expect(screen.queryByText('Doc')).toBeNull();
    expect(screen.queryByText(/Brain dump/i)).toBeNull();
  });
});
