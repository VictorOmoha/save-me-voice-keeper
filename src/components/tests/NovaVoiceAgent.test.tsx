import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('react-router-dom', () => ({Link: ({children, to}: {children: React.ReactNode; to: string}) => <a href={to}>{children}</a>}));

const voiceAgentMock = vi.hoisted(() => ({
  useVoiceSession: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: vi.fn(),
}));

vi.mock('@/contexts/VoiceSessionContext', () => ({
  useVoiceSession: voiceAgentMock.useVoiceSession,
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
  voiceAgentMock.useVoiceSession.mockReturnValue({
    status: 'idle',
    transcript: '',
    responseText: '',
    error: null,
    actions: [],
    draft: '',
    setDraft: vi.fn(),
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
    voiceAgentMock.useVoiceSession.mockReset();
    mockState();
  });

  it('renders idle state without triggering hook initialization errors', () => {
    render(<NovaVoiceAgent />);

    expect(screen.getByText("Hey, I'm Nova")).toBeTruthy();
    expect(screen.getByText('Tap the mic when you want Nova to hear you, or type below.')).toBeTruthy();
    expect(screen.getByText('Tap mic or type below')).toBeTruthy();
  });

  it('does not describe continuous mode as live listening when the mic is off', () => {
    mockState({ continuous: true });

    render(<NovaVoiceAgent />);

    expect(screen.getByText('Auto-listen on')).toBeTruthy();
    expect(screen.getByText('Auto-listen is on. Tap the mic to start a realtime conversation.')).toBeTruthy();
    expect(screen.queryByText(/\bLive\b/i)).toBeNull();
    expect(screen.queryByText(/Nova can keep the mic on/i)).toBeNull();
  });

  it('shows explicit trust-safe voice states for idle, listening, and processing', () => {
    const { rerender } = render(<NovaVoiceAgent />);
    expect(screen.getByText('Tap mic or type below')).toBeTruthy();

    mockState({ status: 'listening', transcript: 'insurance policy renews in June' });
    rerender(<NovaVoiceAgent />);
    expect(screen.getByText('"insurance policy renews in June"')).toBeTruthy();
    expect(screen.getByText(/Tap stop to end the session/i)).toBeTruthy();
    expect(screen.getByLabelText('End voice session')).toBeTruthy();

    mockState({ status: 'thinking' });
    rerender(<NovaVoiceAgent />);
    expect(screen.getAllByText('PROCESSING').length).toBeGreaterThan(0);
    expect(screen.queryByText('Nova is thinking...')).toBeNull();
  });

  it('rewrites raw voice-agent failures into a recovery message', () => {
    mockState({ error: 'Voice agent failed' });

    render(<NovaVoiceAgent />);

    expect(screen.getByText("Nova couldn't start voice capture. Check microphone access and try again.")).toBeTruthy();
    expect(screen.queryByText('Voice agent failed')).toBeNull();
  });

  it('turns provider outages into a trust-preserving retry message', () => {
    mockState({ error: 'The AI provider is temporarily unavailable. Please try again later.' });

    render(<NovaVoiceAgent />);

    expect(screen.getByText('Realtime voice is unavailable. Please try again; check any pending action first.')).toBeTruthy();
    expect(screen.queryByText(/temporarily unavailable/i)).toBeNull();
  });
});
