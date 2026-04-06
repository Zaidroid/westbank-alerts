import { useState, useRef, useEffect } from "react";
import type { Alert, AlertQueryParams } from "@/lib/api";
import { Filter, Loader2, AlertTriangle, MapPin, Clock, ChevronRight, Navigation } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { useLang, getTypeLabel, formatRelativeTime } from "@/lib/i18n";
import { useInfiniteAlerts } from "@/hooks/useAlerts";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { isAreaOnRoute } from "@/lib/routes";
import type { Route } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface AlertListProps {
  searchQuery: string;
  onAlertClick: (a: Alert) => void;
  selectedRoute?: Route | null;
}

const SEVERITY_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  critical: { dot: "bg-destructive", bg: "bg-destructive/5 border-destructive/20", text: "text-destructive" },
  high: { dot: "bg-orange-500", bg: "bg-orange-500/5 border-orange-500/20", text: "text-orange-600 dark:text-orange-400" },
  medium: { dot: "bg-yellow-500", bg: "bg-yellow-500/5 border-yellow-500/20", text: "text-yellow-600 dark:text-yellow-400" },
  low: { dot: "bg-slate-400", bg: "bg-muted border-border", text: "text-muted-foreground" },
};

function AlertCard({ alert, onClick, t, isOnRoute }: { alert: Alert; onClick: (a: Alert) => void; t: any; isOnRoute?: boolean }) {
  const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
  const isCritical = alert.severity === "critical" || alert.severity === "high";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={() => onClick(alert)}
      className={cn(
        "flex flex-col w-full p-3.5 rounded-xl text-start transition-all active:scale-[0.98]",
        "border shadow-sm hover:shadow-md group",
        style.bg,
        isOnRoute && "ring-1 ring-primary/40",
      )}
    >
      {/* Top row: type badge + time */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("w-2 h-2 rounded-full shrink-0", style.dot)} />
          <span className={cn("text-[11px] font-bold uppercase tracking-wide", style.text)}>
            {getTypeLabel(alert.type, t)}
          </span>
          {isCritical && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
              {alert.severity}
            </span>
          )}
          {isOnRoute && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              <Navigation className="h-2.5 w-2.5" />
              {t.onRoute || "On Route"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground shrink-0" dir="ltr">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(new Date(alert.timestamp), t)}
        </div>
      </div>

      {/* Title */}
      <h4 className="font-bold text-sm leading-snug line-clamp-2 text-foreground mb-1.5" dir="auto">
        {alert.title}
      </h4>

      {/* Bottom row: area + arrow */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        {alert.area && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate" dir="auto">{alert.area}</span>
          </div>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 ms-auto transition-colors" />
      </div>
    </motion.button>
  );
}

export function AlertList({ searchQuery, onAlertClick, selectedRoute }: AlertListProps) {
  const { t } = useLang();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const observerTarget = useRef<HTMLDivElement>(null);

  const { debouncedValue: debouncedSearch, isPending: isSearching } = useDebouncedValue(searchQuery, 300);

  const filters: Omit<AlertQueryParams, 'page' | 'per_page'> = {
    ...(severityFilter !== "all" && { severity: severityFilter as any }),
    ...(typeFilter !== "all" && { type: typeFilter as any }),
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteAlerts(filters, 50);

  const allAlerts = data?.pages.flatMap(page => page.alerts) || [];

  const filteredAlerts = debouncedSearch
    ? allAlerts.filter(a =>
        a.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        a.area?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : allAlerts;

  const types = Array.from(new Set(allAlerts.map(a => a.type))).sort();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {/* Compact filter bar */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-1">
        <div className="flex items-center gap-1.5 text-sm font-bold">
          <AlertTriangle className="h-4 w-4 text-primary" />
          {t.alerts}
          <span className="text-muted-foreground font-mono text-xs">({data?.pages[0]?.total || 0})</span>
          {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex items-center gap-2 ms-auto">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs border-dashed">
              <Filter className="h-3 w-3 me-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allSeverities}</SelectItem>
              <SelectItem value="critical">{t.critical}</SelectItem>
              <SelectItem value="high">{t.high}</SelectItem>
              <SelectItem value="medium">{t.medium}</SelectItem>
              <SelectItem value="low">{t.low}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[140px] text-xs border-dashed">
              <Filter className="h-3 w-3 me-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allTypes}</SelectItem>
              {types.map(type => (
                <SelectItem key={type} value={type}>{getTypeLabel(type, t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Alert grid */}
      <div className="flex-1 min-h-0 overflow-auto px-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <div className="text-sm text-muted-foreground">{t.noAlertsFound}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 pb-4">
            <AnimatePresence initial={false}>
              {filteredAlerts.map(a => (
                <AlertCard key={a.id ?? a.timestamp} alert={a} onClick={onAlertClick} t={t} isOnRoute={selectedRoute ? isAreaOnRoute(a.area, selectedRoute) : false} />
              ))}
            </AnimatePresence>

            {/* Observer for infinite scroll - spans full width */}
            <div ref={observerTarget} className="col-span-full h-4" />

            {isFetchingNextPage && (
              <div className="col-span-full flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
