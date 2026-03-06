import { useNotifications, getInsightIcon } from "@/hooks/useNotifications";
import type { InsightType } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Bell, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const INSIGHT_COLOR: Record<InsightType, string> = {
  connection: "text-blue-500",
  pattern: "text-violet-500",
  gap: "text-amber-500",
  reminder: "text-emerald-500",
};

export const NotificationsPanel = () => {
  const { notifications, insights, systemNotifs, unreadCount, dismiss, dismissAll } =
    useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Bell trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-84 max-h-[480px] overflow-y-auto rounded-xl border bg-popover shadow-xl z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-popover z-10">
              <span className="text-sm font-semibold">Notifications</span>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 text-muted-foreground hover:text-foreground"
                  onClick={dismissAll}
                >
                  Clear all
                </Button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
                <Bell className="h-6 w-6 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">All clear — Nova's watching</p>
              </div>
            ) : (
              <div>
                {/* Nova Insights section */}
                {insights.length > 0 && (
                  <div className="px-3 pt-3 pb-1">
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                        Nova Insights
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {insights.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-start gap-2.5 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 hover:bg-primary/10 transition-colors"
                        >
                          <span
                            className={cn(
                              "text-sm mt-0.5 shrink-0",
                              n.insightType ? INSIGHT_COLOR[n.insightType] : "text-primary"
                            )}
                          >
                            {getInsightIcon(n.insightType)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-snug">{n.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {n.insightType && (
                                <span className="capitalize mr-1.5">{n.insightType}</span>
                              )}
                              · {n.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted transition-colors mt-0.5"
                            onClick={() => dismiss(n.id)}
                            aria-label="Dismiss insight"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* System notifications */}
                {systemNotifs.length > 0 && (
                  <div className={cn("px-3 pb-3", insights.length > 0 && "pt-3")}>
                    {insights.length > 0 && (
                      <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase px-1 mb-2">
                        Other
                      </p>
                    )}
                    <div className="space-y-1">
                      {systemNotifs.map((n) => (
                        <div
                          key={n.id}
                          className="flex items-start gap-2 rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors"
                        >
                          <span className="text-sm mt-0.5 shrink-0">
                            {n.type === "reminder" ? "🔔" : n.type === "action_due" ? "⏰" : "📋"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{n.text}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {n.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-muted transition-colors mt-0.5"
                            onClick={() => dismiss(n.id)}
                            aria-label="Dismiss notification"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
