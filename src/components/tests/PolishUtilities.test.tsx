import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatContextualFieldName } from '@/utils/fieldFormatters';

describe('polish utility regressions', () => {
  it('uses a lighter blurred dialog overlay instead of a heavy black-out overlay', () => {
    render(
      <Dialog open>
        <DialogContent>Memory saved</DialogContent>
      </Dialog>
    );

    expect(screen.getByText('Memory saved')).toBeTruthy();
    const overlay = Array.from(document.body.querySelectorAll('div')).find((node) =>
      node.className.toString().includes('fixed inset-0 z-50')
    );
    const overlayClass = overlay?.className.toString() || '';
    expect(overlayClass).toContain('bg-black/45');
    expect(overlayClass).toContain('backdrop-blur');
    expect(overlayClass).not.toContain('bg-black/80');
  });

  it('turns generic insurance name fields into user-facing labels', () => {
    expect(formatContextualFieldName('name', { category: 'Finance', title: 'Insurance Policy' })).toBe('Policyholder name');
    expect(formatContextualFieldName('number', { category: 'Finance', title: 'Insurance Policy' })).toBe('Policy number');
  });
});
