import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/api/types";

interface MobileStatusBarProps {
  connectionStatus: ConnectionStatus;
  updateCount?: number;
}

export function MobileStatusBar({ connectionStatus, updateCount = 0 }: MobileStatusBarProps) {
  const { t } = useLang();

  const dotColor =
    connectionStatus === "connected"
      ? "bg-emerald-400"
      : connectionStatus === "connecting"
      ? "bg-amber-400 animate-pulse"
      : "bg-red-500";

  const statusText =
    connectionStatus === "connected"
      ? t.connected
      : connectionStatus === "connecting"
      ? t.reconnecting
      : t.offline;

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-background/80 border-b border-border/40 shrink-0" style={{ minHeight: 36 }}>
      {/* App name */}
      <span className="text-xs font-bold tracking-tight text-foreground/80">
        {t.appTitle}
      </span>

      {/* Connection status */}
      <div className="flex items-center gap-1.5">
        {updateCount > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {updateCount} {t.checkpointUpdate}
          </span>
        )}
        <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
        <span className={cn(
          "text-[10px] font-medium uppercase tracking-wider",
          connectionStatus === "connected" ? "text-emerald-400" :
          connectionStatus === "connecting" ? "text-amber-400" : "text-red-400"
        )}>
          {statusText}
        </span>
      </div>
    </div>
  );
}
