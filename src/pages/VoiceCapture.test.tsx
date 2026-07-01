import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import VoiceCapture from './VoiceCapture';

const { navigateMock, sendTextMock, startListeningMock, stopListeningMock, voiceOverrides } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  sendTextMock: vi.fn(),
  startListeningMock: vi.fn(),
  stopListeningMock: vi.fn(),
  voiceOverrides: {} as Record<string, unknown>,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/components/dashboard/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { displayName: 'Victor' } }),
}));

vi.mock('@/hooks/useDashboard', () => ({
  useDashboard: () => ({
    savedEntries: [],
    searchQuery: '',
    setSearchQuery: vi.fn(),
    saveEntry: vi.fn(),
    editEntry: vi.fn(),
    deleteEntry: vi.fn(),
    handleAddEntry: vi.fn(),
    handleCancelEdit: vi.fn(),
    getFormMode: () => 'create',
    getFormTitle: () => 'Add New Entry',
    isSaving: false,
    showAddEntry: false,
    editingEntry: null,
    fillingEntry: null,
    templateEntry: null,
  }),
}));

vi.mock('@/hooks/useVoiceAgent', () => ({
  MAX_RECORDING_SECONDS: 30,
  useVoiceAgent: () => ({
    status: 'idle',
    transcript: '',
    responseText: '',
    error: null,
    actions: [],
    conversationHistory: [],
    continuous: true,
    setContinuous: vi.fn(),
    startListening: startListeningMock,
    stopListening: stopListeningMock,
    sendText: sendTextMock,
    resetConversation: vi.fn(),
    inputLevelRef: { current: 0 },
    ...voiceOverrides,
  }),
}));

const renderPage = () => render(<VoiceCapture />);

describe('VoiceCapture page', () => {
  beforeEach(() => {
    cleanup();
    navigateMock.mockReset();
    sendTextMock.mockReset();
    startListeningMock.mockReset();
    stopListeningMock.mockReset();
    for (const key of Object.keys(voiceOverrides)) delete voiceOverrides[key];
    // jsdom has neither MediaRecorder nor mediaDevices — stub so isSupported is true
    (window as unknown as Record<string, unknown>).MediaRecorder = function MediaRecorderStub() {};
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn() },
    });
  });

  it('offers a typed fallback that sends text to Nova when idle', () => {
    renderPage();

    const input = screen.getByLabelText('Type a message to Nova');
    fireEvent.change(input, { target: { value: 'Save my passport renewal date' } });
    fireEvent.submit(input.closest('form')!);

    expect(sendTextMock).toHaveBeenCalledWith('Save my passport renewal date');
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('lets the user barge in while Nova is speaking', () => {
    voiceOverrides.status = 'speaking';
    renderPage();

    const mic = screen.getByLabelText('Interrupt Nova and speak') as HTMLButtonElement;
    expect(mic.disabled).toBe(false);
    fireEvent.click(mic);

    expect(startListeningMock).toHaveBeenCalled();
  });

  it('renders the full conversation thread, not just the last exchange', () => {
    voiceOverrides.conversationHistory = [
      { role: 'user', parts: [{ text: 'Remember my locker code is 4821' }] },
      { role: 'model', parts: [{ text: 'Saved it under Personal.' }] },
      { role: 'user', parts: [{ text: 'Also remind me to renew my visa' }] },
    ];
    renderPage();

    expect(screen.getByText('Remember my locker code is 4821')).toBeTruthy();
    expect(screen.getByText('Saved it under Personal.')).toBeTruthy();
    expect(screen.getByText('Also remind me to renew my visa')).toBeTruthy();
  });

  it('shows the recording cap while listening', () => {
    voiceOverrides.status = 'listening';
    renderPage();

    const rec = screen.getByText(/REC/);
    expect(rec.textContent).toContain('0:30');
    expect(screen.getByLabelText('Stop and send')).toBeTruthy();
  });
});
