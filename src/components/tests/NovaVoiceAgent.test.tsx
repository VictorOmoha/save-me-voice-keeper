import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

vi.mock('@/utils/cloudFunctions', () => ({
  getCloudFunctionUrl: vi.fn(() => 'https://example.com/voiceAgent'),
  getFirebaseIdToken: vi.fn(),
}));

import { NovaVoiceAgent } from '@/components/NovaVoiceAgent';

describe('NovaVoiceAgent', () => {
  it('renders idle state without triggering hook initialization errors', () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      value: vi.fn(),
      writable: true,
    });

    render(<NovaVoiceAgent continuous={false} />);

    expect(screen.getByText("Hey, I'm Nova")).toBeTruthy();
    expect(screen.getByText('Mic is off. Tap when ready.')).toBeTruthy();
  });
});
