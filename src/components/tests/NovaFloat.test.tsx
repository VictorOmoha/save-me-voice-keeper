import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NovaFloat } from '@/components/NovaFloat';

const {
  navigateMock,
  setThemeMock,
  toastSuccessMock,
  toastErrorMock,
  toastInfoMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  setThemeMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastInfoMock: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      displayName: 'Victor',
      email: 'victor@example.com',
    },
  }),
}));

vi.mock('@/components/ThemeProvider', () => ({
  useTheme: () => ({
    setTheme: setThemeMock,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
    info: toastInfoMock,
  },
}));

vi.mock('@/components/entries/ProfessionalPrintView', () => ({
  printProfessionally: vi.fn(),
}));

vi.mock('@/components/NovaVoiceAgent', () => ({
  NovaVoiceAgent: ({ onNovaAction }: { onNovaAction: (payload: { actionType: string; actionData: Record<string, unknown> }) => void }) => (
    <button
      type="button"
      onClick={() => onNovaAction({ actionType: 'save_entry', actionData: { id: 'entry-123' } })}
    >
      trigger-save-action
    </button>
  ),
}));

vi.mock('@/components/NovaLiveAction', () => ({
  NovaLiveAction: ({ action, onComplete }: { action: { actionType: string; actionData: Record<string, unknown> }; onComplete: (action: { actionType: string; actionData: Record<string, unknown> }) => void }) => (
    <button type="button" onClick={() => onComplete(action)}>
      complete-live-action
    </button>
  ),
}));

describe('NovaFloat', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    setThemeMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    toastInfoMock.mockReset();
  });

  it('uses a compact bottom-right panel so Nova does not dominate dashboard content', () => {
    render(<NovaFloat />);

    const panel = screen.getByTestId('nova-float-panel');
    expect(panel.className).toContain('sm:w-[320px]');
    expect(panel.className).toContain('bottom-0 sm:bottom-24');
    expect(panel.getAttribute('style')).toContain('clamp(320px, 42vh, 420px)');
  });

  it('dispatches entry refresh event and navigates to saved entry after save action completion', () => {
    const entriesChangedListener = vi.fn();
    window.addEventListener('nova:entries-changed', entriesChangedListener);

    render(<NovaFloat />);

    fireEvent.click(screen.getByText('trigger-save-action'));
    fireEvent.click(screen.getByText('complete-live-action'));

    expect(entriesChangedListener).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/all-entries/entry-123');

    window.removeEventListener('nova:entries-changed', entriesChangedListener);
  });
});
