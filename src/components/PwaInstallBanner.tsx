import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, X } from "lucide-react";
import { useState } from "react";

export const PwaInstallBanner = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || isInstalled || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/30 bg-background/95 backdrop-blur-sm shadow-lg">
        <Download className="w-5 h-5 text-primary shrink-0" />
        <span className="text-sm font-medium">Install SaveMe as a desktop app</span>
        <button
          onClick={async () => {
            await promptInstall();
          }}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
