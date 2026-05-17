import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const voiceAgentMock = vi.hoisted(() => ({
  useVoiceAgent: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

vi.mock('@/hooks/useVoiceAgent', () => ({
  useVoiceAgent: voiceAgentMock.useVoiceAgent,
}));

import { NovaVoiceAgent } from '@/components/NovaVoiceAgent';

type MockState = {
  status: 'idle' | 'listening' | 'thinking' | 'acting' | 'speaking';
  transcript: string;
  responseText: string;
  error: string | null;
  actions: unknown[];
  conversationHistory: unknown[];
  continuous: boolean;
  setContinuous: ReturnType<typeof vi.fn>;
  startListening: ReturnType<typeof vi.fn>;
  stopListening: ReturnType<typeof vi.fn>;
  sendText: ReturnType<typeof vi.fn>;
  resetConversation: ReturnType<typeof vi.fn>;
};

const mockState = (overrides: Partial<MockState> = {}) => {
  voiceAgentMock.useVoiceAgent.mockReturnValue({
    status: 'idle',
    transcript: '',
    responseText: '',
    error: null,
    actions: [],
    conversationHistory: [],
    continuous: false,
    setContinuous: vi.fn(),
    startListening: vi.fn(),
    stopListening: vi.fn(),
    sendText: vi.fn(),
    resetConversation: vi.fn(),
    ...overrides,
  });
};

describe('NovaVoiceAgent', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      value: vi.fn(),
      writable: true,
    });
    voiceAgentMock.useVoiceAgent.mockReset();
    mockState();
  });

  it('renders idle state without triggering hook initialization errors', () => {
    render(<NovaVoiceAgent continuous={false} />);

    expect(screen.getByText("Hey, I'm Nova")).toBeTruthy();
    expect(screen.getByText('Not listening. Tap the mic to start.')).toBeTruthy();
  });

  it('does not describe continuous mode as live listening when the mic is off', () => {
    mockState({ continuous: true });

    render(<NovaVoiceAgent continuous />);

    expect(screen.getByText('Auto-listen on')).toBeTruthy();
    expect(screen.getByText('Mic is off. Auto-listen is on after Nova responds.')).toBeTruthy();
    expect(screen.queryByText(/\bLive\b/i)).toBeNull();
    expect(screen.queryByText(/Nova can keep the mic on/i)).toBeNull();
  });

  it('shows explicit trust-safe voice states for idle, listening, and processing', () => {
    render(<NovaVoiceAgent />);
    expect(screen.getByText('Not listening. Tap the mic to start.')).toBeTruthy();

    mockState({ status: 'listening', transcript: 'insurance policy renews in June' });
    const { rerender } = render(<NovaVoiceAgent />);
    expect(screen.getByText('Listening now')).toBeTruthy();
    expect(screen.getByText(/Tap Stop when you are finished/i)).toBeTruthy();
    expect(screen.getByText('Stop recording to save')).toBeTruthy();

    mockState({ status: 'thinking' });
    rerender(<NovaVoiceAgent />);
    expect(screen.getAllByText('Processing your memory...').length).toBeGreaterThan(0);
    expect(screen.queryByText('Nova is thinking...')).toBeNull();
  });

  it('rewrites raw voice-agent failures into a recovery message', () => {
    mockState({ error: 'Voice agent failed' });

    render(<NovaVoiceAgent />);

    expect(screen.getByText("Nova couldn't start voice capture. Check microphone access and try again.")).toBeTruthy();
    expect(screen.queryByText('Voice agent failed')).toBeNull();
  });
});
