import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import BrainDumpPage from './BrainDump';

const { navigateMock, saveEntryMock, toastInfoMock, toastSuccessMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  saveEntryMock: vi.fn(),
  toastInfoMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('sonner', () => ({
  toast: {
    info: toastInfoMock,
    success: toastSuccessMock,
    error: vi.fn(),
  },
}));

vi.mock('@/hooks/useSavedEntries', () => ({
  useSavedEntries: () => ({ saveEntry: saveEntryMock }),
}));

vi.mock('@/hooks/useBrainDumpCapture', () => ({
  useBrainDumpCapture: () => ({
    isSupported: true,
    isListening: false,
    isProcessingVoice: false,
    transcript: '',
    novaResponseText: '',
    savedEntry: null,
    voiceError: null,
    lastStartAttemptAt: null,
    lastCapturedAudioUrl: null,
    playLastRecording: vi.fn(),
    continuous: false,
    setContinuous: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/utils/textToSpeech', () => ({ speak: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ trackActivationEvent: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ auth: { currentUser: null } }));
vi.mock('@/components/braindump/ShareButtons', () => ({ ShareButtons: () => null }));
vi.mock('@/components/braindump/KeyboardShortcuts', () => ({ KeyboardShortcuts: () => null }));

const renderPage = () => render(<BrainDumpPage />);

describe('BrainDumpPage first workflow state', () => {
  beforeEach(() => {
    cleanup();
    navigateMock.mockReset();
    saveEntryMock.mockReset();
    toastInfoMock.mockReset();
    toastSuccessMock.mockReset();
  });

  it('shows a clear Nova empty state instead of placeholder title/category fields before capture', () => {
    renderPage();

    expect(screen.getByText(/Your organized capture will appear here/i)).toBeTruthy();
    expect(screen.queryByPlaceholderText('Generated title')).toBeNull();
    expect(screen.queryByRole('button', { name: /Save structured entry/i })).toBeNull();
  });

  it('does not save when no structured capture exists', () => {
    renderPage();

    window.dispatchEvent(new CustomEvent('brain-dump:save'));

    expect(saveEntryMock).not.toHaveBeenCalled();
    expect(toastInfoMock).toHaveBeenCalledWith('Speak or paste some text first');
  });

  it('reveals editable structured output and save action after organizing typed input', () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/What's on your mind right now/i), {
      target: { value: 'Remember to call the insurance company tomorrow and ask about the policy renewal.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Organize with Nova/i }));

    expect((screen.getByLabelText(/Save structured entry/i) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Category')).toBeTruthy();
  });
});
