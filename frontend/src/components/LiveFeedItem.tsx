import { Alert } from "@/lib/api";
import { CheckpointUpdate } from "@/lib/api/types";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { useLang, getTypeLabel, formatRelativeTime, getStatusLabel } from "@/lib/i18n";
import { MapPin, AlertTriangle } from "lucide-react";

export type FeedItemType = "alert" | "checkpoint_update";

export interface FeedItem {
  type: FeedItemType;
  id: string;
  timestamp: string;
  data: Alert | CheckpointUpdate;
}

interface LiveFeedItemProps {
  item: FeedItem;
  onClick?: (item: FeedItem) => void;
  className?: string;
}

export function LiveFeedItem({ item, onClick, className }: LiveFeedItemProps) {
  const { t, lang } = useLang();
  
  const getSeverityBorder = (severity: string) => {
    switch (severity) {
      case "critical": return "border-s-destructive";
      case "high": return "border-s-orange-500";
      case "medium": return "border-s-yellow-500";
      case "low": return "border-s-slate-500";
      default: return "border-s-border";
    }
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "open": return "border-s-green-500";
      case "closed": return "border-s-destructive";
      case "congested": return "border-s-orange-500";
      case "military": return "border-s-purple-500";
      case "slow": return "border-s-amber-500";
      default: return "border-s-slate-500";
    }
  };

  if (item.type === "alert") {
    const alert = item.data as Alert;
    return (
      <div
        className={cn(
          "group relative flex cursor-pointer flex-col gap-2 border border-s-4 border-e-border border-y-border bg-card p-3 transition-colors hover:bg-muted/50",
          getSeverityBorder(alert.severity),
          className
        )}
        onClick={() => onClick?.(item)}
        data-testid={`feed-item-${item.id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <StatusBadge variant={alert.severity} label={getTypeLabel(alert.type, t)} />
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(new Date(item.timestamp), t, lang)}
          </span>
        </div>

        <div>
          <h4 className="font-semibold text-sm leading-tight text-foreground line-clamp-2" dir="auto">
            {lang === "ar"
              ? ((alert as any).title_ar || getTypeLabel(alert.type, t))
              : alert.title}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
            {alert.area}
          </p>
        </div>
      </div>
    );
  } else {
    const update = item.data as CheckpointUpdate;
    const statusColor = getStatusBorder(update.status);

    return (
      <div
        className={cn(
          "group relative flex cursor-pointer flex-col gap-2 border border-s-4 border-e-border border-y-border bg-card p-3 transition-colors hover:bg-muted/50",
          statusColor,
          className
        )}
        onClick={() => onClick?.(item)}
        data-testid={`feed-item-${item.id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <StatusBadge variant={update.status} label={getStatusLabel(update.status, t)} />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
              {update.source_type === "admin" ? t.verified : t.crowded}
            </span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(new Date(item.timestamp), t, lang)}
          </span>
        </div>

        <div>
          <h4 className="font-semibold text-sm leading-tight text-foreground" dir="auto">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              {update.name_raw}
            </span>
          </h4>
          {update.status_raw && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1" dir="auto">
              {update.status_raw}
            </p>
          )}
        </div>
      </div>
    );
  }
}
