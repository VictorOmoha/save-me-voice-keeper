import { useContext } from 'react';
import { KeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContextValue';

export const useKeyboardShortcuts = () => useContext(KeyboardShortcutsContext);
