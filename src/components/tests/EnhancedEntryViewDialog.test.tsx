import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnhancedEntryViewDialog } from '@/components/entries/EnhancedEntryViewDialog';
import { SavedEntry } from '@/types/dashboard';

vi.mock('@/components/entries/EntryIntelligencePanel', () => ({
  EntryIntelligencePanel: () => <div data-testid="entry-intelligence-panel" />,
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

const baseEntry = (fields: SavedEntry['fields']): SavedEntry => ({
  id: 'entry-1',
  title: 'Insurance Policy',
  category: String(fields.category || 'Finance'),
  fields,
  fieldDefinitions: [],
  createdAt: new Date('2026-05-17T12:00:00Z'),
  updatedAt: new Date('2026-05-17T12:30:00Z'),
});

describe('EnhancedEntryViewDialog demo-readiness regressions', () => {
  it('hides generic placeholder fields and disables document actions when no real details exist', () => {
    render(
      <EnhancedEntryViewDialog
        isOpen
        entry={baseEntry({
          category: 'Finance',
          value1: 'Value 1',
          value2: 'Value 2',
          notes: 'N/A',
        })}
        onClose={vi.fn()}
        onFill={vi.fn()}
        onUseAsTemplate={vi.fn()}
      />
    );

    expect(screen.getByText(/No extra details have been added yet/i)).toBeTruthy();
    expect(screen.queryByText('Value 1')).toBeNull();
    expect(screen.queryByText('Value 2')).toBeNull();
    expect(screen.queryByText('N/A')).toBeNull();
    expect((screen.getByRole('button', { name: /Print/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Fill Form/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Use as Template/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows extracted insurance details with human labels when real values exist', () => {
    render(
      <EnhancedEntryViewDialog
        isOpen
        entry={baseEntry({
          category: 'Finance',
          provider: 'State Farm',
          policy_number: 'SF-1234',
          renewal_date: '2026-06-12',
          premium: '240',
        })}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('State Farm')).toBeTruthy();
    expect(screen.getByText('SF-1234')).toBeTruthy();
    expect(screen.getByText('$240.00')).toBeTruthy();
    expect(screen.queryByText(/No extra details have been added yet/i)).toBeNull();
  });
});
