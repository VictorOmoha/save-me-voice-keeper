import { createContext } from 'react';

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  category: string;
}

export interface KeyboardShortcutsContextType {
  shortcuts: ShortcutAction[];
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
  registerShortcut: (shortcut: ShortcutAction) => void;
  unregisterShortcut: (key: string) => void;
}

export type { ShortcutAction };

export const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType>({
  shortcuts: [],
  isHelpOpen: false,
  setIsHelpOpen: () => {},
  registerShortcut: () => {},
  unregisterShortcut: () => {},
});
