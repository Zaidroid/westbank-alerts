import { useState, useMemo } from "react";
import {
  Bell, Navigation, AlertTriangle, Info, Shield,
  MapPin, Clock, Zap, Crosshair, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, formatRelativeTime, getTypeLabel } from "@/lib/i18n";
import { AlertExpandCard } from "./AlertExpandCard";
import { isAreaOnRoute } from "@/lib/routes";
import type { Alert, AlertType } from "@/lib/api/types";
import type { Route } from "@/lib/routes";

// Severity ordering for sort
const SEV_ORDER: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

// Alert type grouping for filter tabs
const MILITARY_TYPES: Set<AlertType> = new Set([
  "idf_raid", "arrest_campaign", "idf_operation",
]);
const ATTACK_TYPES: Set<AlertType> = new Set([
  "settler_attack", "shooting", "demolition", "injury_report",
]);
const THREAT_TYPES: Set<AlertType> = new Set([
  "west_bank_siren", "regional_attack", "rocket_attack", "airstrike", "explosion",
]);

type Filter = "all" | "threats" | "military" | "attacks" | "route";

interface AlertsScreenProps {
  alerts: Alert[];
  activeRoute?: Route | null;
}

export function AlertsScreen({ alerts, activeRoute }: AlertsScreenProps) {
  const { t } = useLang();
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => ({
    all: alerts.length,
    threats: alerts.filter(a => THREAT_TYPES.has(a.type)).length,
    military: alerts.filter(a => MILITARY_TYPES.has(a.type)).length,
    attacks: alerts.filter(a => ATTACK_TYPES.has(a.type)).length,
    route: activeRoute ? alerts.filter(a => isAreaOnRoute(a.area, activeRoute)).length : 0,
  }), [alerts, activeRoute]);

  const filtered = useMemo(() => {
    let pool = alerts;
    if (filter === "threats") pool = alerts.filter(a => THREAT_TYPES.has(a.type));
    else if (filter === "military") pool = alerts.filter(a => MILITARY_TYPES.has(a.type));
    else if (filter === "attacks") pool = alerts.filter(a => ATTACK_TYPES.has(a.type));
    else if (filter === "route" && activeRoute) pool = alerts.filter(a => isAreaOnRoute(a.area, activeRoute));

    // Sort: critical/high first, then by timestamp
    return [...pool].sort((a, b) => {
      const sevDiff = (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3);
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [alerts, filter, activeRoute]);

  const tabs: { id: Filter; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "all",      label: "الكل",           icon: <Bell className="w-3 h-3" />,       count: counts.all },
    { id: "threats",  label: "صواريخ وإنذارات", icon: <Zap className="w-3 h-3" />,        count: counts.threats },
    { id: "military", label: "عمليات عسكرية",   icon: <Shield className="w-3 h-3" />,     count: counts.military },
    { id: "attacks",  label: "اعتداءات",        icon: <Flame className="w-3 h-3" />,      count: counts.attacks },
    ...(activeRoute
      ? [{ id: "route" as Filter, label: "على مسارك", icon: <Navigation className="w-3 h-3" />, count: counts.route }]
      : []),
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 pt-3 pb-3 shrink-0 border-b border-border/20">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold">{t.alerts}</h2>
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full ms-auto">
            {alerts.length}
          </span>
        </div>

        {/* Filter chips */}
        <div
          className="flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          {tabs.map(tab => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-all",
                  isActive
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "bg-muted/40 border-border/20 text-muted-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold min-w-[16px] text-center rounded-full px-1",
                    isActive ? "bg-primary/25 text-primary" : "bg-muted text-foreground/60"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Info className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t.noAlertsFound}</p>
          </div>
        ) : (
          filtered.map(alert => (
            <AlertExpandCard
              key={alert.id}
              alert={alert}
              onRoute={activeRoute ? isAreaOnRoute(alert.area, activeRoute) : false}
            />
          ))
        )}
      </div>
    </div>
  );
}
