import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { key: "Ctrl + Space", action: "Start / stop recording", context: "Brain Dump" },
  { key: "Ctrl + P", action: "Process brain dump", context: "Brain Dump" },
  { key: "Ctrl + S", action: "Save to entries", context: "Brain Dump" },
  { key: "Ctrl + Shift + E", action: "Export to email", context: "Brain Dump" },
  { key: "Ctrl + Shift + L", action: "Export to LinkedIn", context: "Brain Dump" },
  { key: "Ctrl + Shift + D", action: "Download notes", context: "Brain Dump" },
  { key: "Esc", action: "Reset / Go back", context: "Global" },
  { key: "Ctrl + N", action: "New capture", context: "Global" },
];

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {shortcuts.map((shortcut, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium text-sm">{shortcut.action}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {shortcut.context}
                  </Badge>
                </div>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono whitespace-nowrap">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
