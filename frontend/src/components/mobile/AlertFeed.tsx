import { useMemo } from "react";
import { AlertExpandCard } from "./AlertExpandCard";
import { useLang } from "@/lib/i18n";
import { isAreaOnRoute } from "@/lib/routes";
import type { Alert } from "@/lib/api/types";
import type { Route } from "@/lib/routes";

interface AlertFeedProps {
  alerts: Alert[];
  activeRoute?: Route | null;
  filter?: "all" | "critical" | "route";
  limit?: number;
}

export function AlertFeed({ alerts, activeRoute, filter = "all", limit }: AlertFeedProps) {
  const { t } = useLang();

  const filtered = useMemo(() => {
    let list = [...alerts];

    if (filter === "critical") {
      list = list.filter(a => a.severity === "critical" || a.severity === "high");
    } else if (filter === "route" && activeRoute) {
      list = list.filter(a => isAreaOnRoute(a.area, activeRoute));
    }

    if (limit) list = list.slice(0, limit);
    return list;
  }, [alerts, filter, activeRoute, limit]);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        {t.noAlertsFound}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map(alert => (
        <AlertExpandCard
          key={alert.id}
          alert={alert}
          onRoute={activeRoute ? isAreaOnRoute(alert.area, activeRoute) : false}
        />
      ))}
    </div>
  );
}
