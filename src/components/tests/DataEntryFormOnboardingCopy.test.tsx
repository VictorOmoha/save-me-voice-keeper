import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataEntryForm } from '@/components/DataEntryForm';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

describe('DataEntryForm onboarding copy', () => {
  it('frames manual capture as natural memory, not an admin database entry', () => {
    render(<DataEntryForm onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText('Capture one memory. Anam will keep it structured.')).toBeTruthy();
    expect(screen.getByText('Write the thing you do not want to lose. Add only the details you know.')).toBeTruthy();
    expect(screen.getByLabelText('What should Anam remember?')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g., Insurance renewal, Mom’s medication, Client follow-up')).toBeTruthy();
    expect(screen.getByText(/Say it naturally:/i)).toBeTruthy();
    expect(screen.queryByText('Add Entry')).toBeNull();
  });
});
