
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  category: string;
}

interface KeyboardShortcutsContextType {
  shortcuts: ShortcutAction[];
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  registerShortcut: (shortcut: ShortcutAction) => void;
  unregisterShortcut: (key: string) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType>({
  shortcuts: [],
  isHelpOpen: false,
  setIsHelpOpen: () => {},
  registerShortcut: () => {},
  unregisterShortcut: () => {},
});

export const useKeyboardShortcuts = () => useContext(KeyboardShortcutsContext);

export const KeyboardShortcutsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shortcuts, setShortcuts] = useState<ShortcutAction[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const registerShortcut = useCallback((shortcut: ShortcutAction) => {
    setShortcuts(prev => {
      const filtered = prev.filter(s => s.key !== shortcut.key || s.ctrl !== shortcut.ctrl || s.shift !== shortcut.shift);
      return [...filtered, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts(prev => prev.filter(s => s.key !== key));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Escape to work even in inputs
        if (e.key !== 'Escape') return;
      }

      // Show help with ?
      if (e.key === '?' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsHelpOpen(prev => !prev);
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (e.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return (
    <KeyboardShortcutsContext.Provider value={{ shortcuts, isHelpOpen, setIsHelpOpen, registerShortcut, unregisterShortcut }}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};
