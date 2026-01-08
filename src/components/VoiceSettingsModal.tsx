import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VoiceSettingsForm } from "./settings/VoiceSettingsForm";
import { Settings } from "lucide-react";
import { Button } from "./ui/button";

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onOpenChange
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Voice Control Settings
          </DialogTitle>
          <DialogDescription>
            Configure your voice recognition and text-to-speech preferences
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <VoiceSettingsForm showTitle={false} />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
