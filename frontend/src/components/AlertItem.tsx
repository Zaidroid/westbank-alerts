import { Alert } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { useLang, getTypeLabel, formatRelativeTime } from "@/lib/i18n";

interface AlertItemProps {
  alert: Alert;
  onClick?: (alert: Alert) => void;
  className?: string;
}

export function AlertItem({ alert, onClick, className }: AlertItemProps) {
  const { t } = useLang();
  
  const getSeverityBorder = (severity: string) => {
    switch (severity) {
      case "critical": return "border-s-destructive";
      case "high": return "border-s-orange-500";
      case "medium": return "border-s-yellow-500";
      case "low": return "border-s-slate-500";
      default: return "border-s-border";
    }
  };

  return (
    <div
      className={cn(
        "group relative flex cursor-pointer flex-col gap-2 border border-s-4 border-e-border border-y-border bg-card p-3 transition-colors hover:bg-muted/50",
        getSeverityBorder(alert.severity),
        className
      )}
      onClick={() => onClick?.(alert)}
      data-testid={`alert-item-${alert.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <StatusBadge variant={alert.severity} label={getTypeLabel(alert.type, t)} />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground font-mono" dir="ltr">
          {formatRelativeTime(new Date(alert.timestamp), t)}
        </span>
      </div>
      
      <div>
        <h4 className="font-semibold text-sm leading-tight text-foreground line-clamp-2">
          {alert.title}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
          {alert.area}
        </p>
      </div>
    </div>
  );
}
