import type { ConnectionStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

interface ConnectionIndicatorProps {
  status: ConnectionStatus;
}

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const { t } = useLang();
  
  return (
    <div className="flex items-center gap-2" data-testid="status-connection">
      <div className="relative flex h-3 w-3 items-center justify-center">
        {status === "connected" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            status === "connected" ? "bg-green-500" : status === "connecting" ? "bg-yellow-500" : "bg-red-500"
          )}
        ></span>
      </div>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:inline-block">
        {status === "connected" ? t.connected : status === "connecting" ? t.reconnecting : t.offline}
      </span>
    </div>
  );
}
