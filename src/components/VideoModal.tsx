
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface VideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title: string;
}

export const VideoModal = ({ open, onOpenChange, videoUrl, title }: VideoModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            {title}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-2">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <video
              className="absolute inset-0 w-full h-full rounded-lg"
              controls
              autoPlay
              src={videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
