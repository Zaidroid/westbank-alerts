import { useEffect } from "react";
import { MapPin, Navigation, Clock, Shield, Users, History, ExternalLink, ChevronRight } from "lucide-react";
import type { Alert, Checkpoint, CheckpointUpdate, CheckpointHistoryResponse } from "@/lib/api/types";
import { getCheckpointHistory } from "@/lib/api/endpoints";
import { StatusBadge } from "./StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLang, getTypeLabel, getStatusLabel, formatRelativeTime } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface DetailPanelProps {
  item: Alert | Checkpoint | null;
  checkpointKey?: string | null;
  onClose: () => void;
}

function MetaRow({ icon: Icon, label, value, dir }: { icon: any; label: string; value: string; dir?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{label}</div>
        <div className="text-sm font-medium truncate" dir={dir}>{value}</div>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-500",
  closed: "bg-destructive",
  congested: "bg-orange-500",
  military: "bg-purple-500",
  slow: "bg-amber-500",
  unknown: "bg-muted-foreground",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-slate-500",
};

function TimelineItem({ update, isFirst, t }: { update: CheckpointUpdate; isFirst: boolean; t: any }) {
  const dotColor = STATUS_COLORS[update.status] || STATUS_COLORS.unknown;
  const time = new Date(update.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="relative flex gap-3 pb-4 last:pb-0">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={cn("w-3 h-3 rounded-full shrink-0 border-2 border-background", dotColor, isFirst && "ring-2 ring-offset-1 ring-offset-background ring-primary/30")} />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 -mt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge variant={update.status} label={getStatusLabel(update.status, t)} className="text-[9px]" />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
            {update.source_type === 'admin' ? t.verified : t.crowded}
          </span>
        </div>
        {update.status_raw && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1" dir="auto">{update.status_raw}</p>
        )}
        {update.raw_line && update.raw_line !== update.status_raw && (
          <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-2 leading-relaxed" dir="auto">{update.raw_line}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/60 font-mono" dir="ltr">
          <span>{timeStr}</span>
          <span>{dateStr}</span>
          {update.source_channel && <span>@{update.source_channel}</span>}
        </div>
      </div>
    </div>
  );
}

export function DetailPanel({ item, checkpointKey, onClose }: DetailPanelProps) {
  const { t } = useLang();

  const isAlert = item ? "severity" in item : false;
  const alert = isAlert ? (item as Alert) : null;
  const checkpoint = !isAlert && item ? (item as Checkpoint) : null;

  // Fetch checkpoint history when a checkpoint is selected
  const { data: historyData, isLoading: historyLoading } = useQuery<CheckpointHistoryResponse>({
    queryKey: ['checkpoint-history', checkpointKey],
    queryFn: () => getCheckpointHistory(checkpointKey!, 30),
    enabled: !!checkpointKey && !isAlert,
    staleTime: 30 * 1000,
  });

  if (!item) return null;

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        className="w-full sm:max-w-[420px] border-s border-border p-0 flex flex-col h-full bg-background"
        side="right"
        data-testid="detail-panel"
      >
        {/* Header */}
        <SheetHeader className="p-4 pb-3 border-b border-border shrink-0">
          {isAlert ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge variant={alert!.severity} label={alert!.severity} />
                <StatusBadge variant="default" label={getTypeLabel(alert!.type, t)} />
              </div>
              <SheetTitle className="text-base leading-snug font-bold text-start">
                {alert!.title}
              </SheetTitle>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge variant={checkpoint!.status} label={getStatusLabel(checkpoint!.status, t)} />
                {checkpoint!.confidence && (
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.5 rounded",
                    checkpoint!.confidence === 'high' ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                    checkpoint!.confidence === 'medium' ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {checkpoint!.confidence}
                  </span>
                )}
                {checkpoint!.is_stale && <StatusBadge variant="low" label={t.stale} />}
                {(checkpoint!.crowd_reports_1h ?? 0) > 0 && (
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">{t.crowded}</span>
                )}
              </div>
              <SheetTitle className="text-base leading-snug font-bold text-start" dir="auto">
                {checkpoint!.name_en || checkpoint!.name_ar}
              </SheetTitle>
              {checkpoint!.name_en && checkpoint!.name_ar && (
                <p className="text-sm text-muted-foreground font-arabic" dir="rtl">{checkpoint!.name_ar}</p>
              )}
              {checkpoint!.status_raw && (
                <p className="text-xs text-muted-foreground italic" dir="auto">{checkpoint!.status_raw}</p>
              )}
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 flex flex-col gap-4">
            {/* Metadata */}
            <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
              {isAlert ? (
                <>
                  {alert!.area && <MetaRow icon={MapPin} label={t.location} value={alert!.area} />}
                  <MetaRow icon={Clock} label={t.timestamp} value={formatRelativeTime(new Date(alert!.timestamp), t)} dir="ltr" />
                  <MetaRow icon={Shield} label={t.confidence} value={alert!.severity} />
                  {alert!.source && <MetaRow icon={ExternalLink} label="Source" value={`@${alert!.source}`} dir="ltr" />}
                </>
              ) : (
                <>
                  {checkpoint!.region && <MetaRow icon={MapPin} label={t.region} value={checkpoint!.region} />}
                  <MetaRow icon={Clock} label={t.lastVerified} value={checkpoint!.last_updated ? formatRelativeTime(new Date(checkpoint!.last_updated), t) : t.unknown} dir="ltr" />
                  {checkpoint!.last_source_type && (
                    <MetaRow icon={Shield} label="Source" value={checkpoint!.last_source_type === 'admin' ? t.verified : t.crowded} />
                  )}
                  {(checkpoint!.crowd_reports_1h ?? 0) > 0 && (
                    <MetaRow icon={Users} label={t.crowded} value={`${checkpoint!.crowd_reports_1h} reports`} />
                  )}
                  {checkpoint!.latitude && checkpoint!.longitude && (
                    <MetaRow icon={Navigation} label={t.coordinates} value={`${checkpoint!.latitude.toFixed(4)}, ${checkpoint!.longitude.toFixed(4)}`} dir="ltr" />
                  )}
                </>
              )}
            </div>

            {/* Alert body */}
            {isAlert && alert!.body && (
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">{t.details}</div>
                <p className="text-sm leading-relaxed whitespace-pre-line" dir="auto">{alert!.body}</p>
              </div>
            )}

            {/* Checkpoint History Timeline */}
            {!isAlert && (
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2 mb-3">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                    Status History
                  </span>
                  {historyData && (
                    <span className="text-[10px] font-mono text-muted-foreground/60 ms-auto">
                      {historyData.total} updates
                    </span>
                  )}
                </div>

                {historyLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : historyData?.history && historyData.history.length > 0 ? (
                  <div className="flex flex-col">
                    {historyData.history.map((update, i) => (
                      <TimelineItem key={update.id ?? i} update={update} isFirst={i === 0} t={t} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No history available</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
