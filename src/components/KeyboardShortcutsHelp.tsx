
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcutsContext';
import { Keyboard } from 'lucide-react';

const formatKey = (shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }) => {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase());
  return parts;
};

export const KeyboardShortcutsHelp: React.FC = () => {
  const { shortcuts, isHelpOpen, setIsHelpOpen } = useKeyboardShortcuts();

  const grouped = shortcuts.reduce<Record<string, typeof shortcuts>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-muted border text-xs font-mono">?</kbd>
            <span>to toggle this help</span>
          </div>

          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">{category}</h3>
              <div className="space-y-1.5">
                {items.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-sm">{s.description}</span>
                    <div className="flex items-center gap-1">
                      {formatKey(s).map((k, j) => (
                        <React.Fragment key={j}>
                          {j > 0 && <span className="text-muted-foreground text-xs">+</span>}
                          <kbd className="px-1.5 py-0.5 bg-muted border text-xs font-mono min-w-[24px] text-center">{k}</kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
