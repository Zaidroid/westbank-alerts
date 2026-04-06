import { useMemo } from "react";
import { Navigation, ChevronLeft, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { getRouteHealth } from "@/lib/routes";
import type { Route } from "@/lib/routes";
import type { Checkpoint } from "@/lib/api/types";

interface ActiveRouteBannerProps {
  route: Route;
  checkpoints: Checkpoint[];
  onPress: () => void;
  onClear: () => void;
}

export function ActiveRouteBanner({ route, checkpoints, onPress, onClear }: ActiveRouteBannerProps) {
  const { t, dir } = useLang();

  const health = useMemo(() => {
    const statusMap: Record<string, string> = {};
    checkpoints.forEach(cp => { statusMap[cp.canonical_key] = cp.status; });
    return getRouteHealth(route, statusMap);
  }, [route, checkpoints]);

  const blockedCount = health.closed + health.military;
  const cautionCount = health.congested + health.slow;
  const isAllClear = blockedCount === 0 && cautionCount === 0;
  const isDanger = blockedCount > 0;

  const bgColor = isDanger
    ? "bg-red-950/60 border-red-800/50"
    : cautionCount > 0
    ? "bg-amber-950/60 border-amber-700/50"
    : "bg-emerald-950/60 border-emerald-800/40";

  const iconColor = isDanger ? "text-red-400" : cautionCount > 0 ? "text-amber-400" : "text-emerald-400";

  return (
    <button
      onClick={onPress}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 border rounded-xl text-start transition-all active:scale-[0.98]",
        bgColor
      )}
    >
      {/* Status icon */}
      <div className={cn("shrink-0", iconColor)}>
        {isDanger ? (
          <AlertTriangle className="w-5 h-5" />
        ) : (
          <CheckCircle2 className="w-5 h-5" />
        )}
      </div>

      {/* Route info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Navigation className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium truncate">
            {t.onRoute}
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground truncate leading-tight">
          {route.name_ar}
        </p>
        <p className={cn("text-xs font-medium mt-0.5", iconColor)}>
          {isAllClear
            ? t.allClear
            : isDanger
            ? `${blockedCount} ${t.blockedCheckpoints}`
            : `${cautionCount} ${t.congested}`
          }
        </p>
      </div>

      {/* Chevron */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          aria-label={t.clearRoute}
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <ChevronLeft className={cn(
          "w-4 h-4 text-muted-foreground",
          dir === "rtl" ? "" : "rotate-180"
        )} />
      </div>
    </button>
  );
}
