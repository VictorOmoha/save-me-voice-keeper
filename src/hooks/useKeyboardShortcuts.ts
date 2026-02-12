import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger when typing in input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Escape even in inputs
        if (event.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const matchesKey = event.key === shortcut.key;
        const matchesCtrl = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
        const matchesShift = shortcut.shift ? event.shiftKey : true;
        const matchesAlt = shortcut.alt ? event.altKey : true;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts
export const SHORTCUTS = {
  NEW_CAPTURE: { key: 'n', ctrl: true, description: 'New capture' },
  START_STOP: { key: ' ', ctrl: true, description: 'Start/stop recording' },
  PROCESS: { key: 'p', ctrl: true, description: 'Process' },
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  EXPORT_EMAIL: { key: 'e', ctrl: true, shift: true, description: 'Export to email' },
  EXPORT_LINKEDIN: { key: 'l', ctrl: true, shift: true, description: 'Export to LinkedIn' },
  DOWNLOAD: { key: 'd', ctrl: true, shift: true, description: 'Download notes' },
  RESET: { key: 'Escape', description: 'Reset / Go back' },
} as const;
