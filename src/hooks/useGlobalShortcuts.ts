
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcutsContext';

export const useGlobalShortcuts = () => {
  const navigate = useNavigate();
  const { registerShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    const navShortcuts = [
      {
        key: 'd',
        ctrl: true,
        shift: true,
        description: 'Go to Dashboard',
        action: () => navigate('/dashboard'),
        category: 'Navigation',
      },
      {
        key: 'e',
        ctrl: true,
        shift: true,
        description: 'Go to All Entries',
        action: () => navigate('/all-entries'),
        category: 'Navigation',
      },
      {
        key: 'b',
        ctrl: true,
        shift: true,
        description: 'Go to voice dump',
        action: () => navigate('/brain-dump'),
        category: 'Navigation',
      },
      {
        key: ',',
        ctrl: true,
        description: 'Go to Settings',
        action: () => navigate('/settings'),
        category: 'Navigation',
      },
      {
        key: 'k',
        ctrl: true,
        description: 'Focus search',
        action: () => {
          const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
          if (searchInput) {
            searchInput.focus();
          }
        },
        category: 'Actions',
      },
      {
        key: 'v',
        ctrl: true,
        shift: true,
        description: 'Toggle voice input',
        action: () => {
          const voiceBtn = document.querySelector<HTMLButtonElement>('[data-voice-toggle]');
          if (voiceBtn) voiceBtn.click();
        },
        category: 'Voice',
      },
      {
        key: 'Escape',
        description: 'Close dialogs / Cancel',
        action: () => {
          // Escape handling - close modals, dialogs, etc.
          document.dispatchEvent(new CustomEvent('shortcut:escape'));
        },
        category: 'General',
      },
    ];

    // Quick Capture — registered here so it appears in the help modal
    // (the actual handler is in QuickCaptureOverlay.tsx)
    navShortcuts.push({
      key: "n",
      ctrl: true,
      description: "Quick Capture — save anything instantly",
      action: () => {
        // Dispatch custom event — QuickCaptureOverlay listens for this
        window.dispatchEvent(new CustomEvent("saveme:quick-capture"));
      },
      category: "Actions",
    });

    navShortcuts.forEach(s => registerShortcut(s));
  }, [navigate, registerShortcut]);
};
