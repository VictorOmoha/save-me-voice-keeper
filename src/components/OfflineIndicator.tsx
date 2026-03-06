/**
 * OfflineIndicator
 * Shows a slim banner when the user loses network connection.
 * Also shows pending sync count when back online.
 */
import React from "react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, syncPendingChanges } = useOfflineSync();

  // Fully online + nothing pending = render nothing
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2",
        "px-4 py-1.5 text-xs font-medium",
        "animate-in slide-in-from-top duration-300",
        isOnline
          ? "bg-amber-500/90 text-amber-950"
          : "bg-slate-800/95 text-slate-200 border-b border-slate-700"
      )}
    >
      {isOnline ? (
        <>
          <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
          {isSyncing
            ? `Syncing ${pendingCount} offline save${pendingCount > 1 ? "s" : ""}...`
            : (
              <button onClick={syncPendingChanges} className="underline underline-offset-2">
                {pendingCount} unsync'd — tap to sync
              </button>
            )}
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          You're offline — captures will sync when you're back
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
