import { useState, useMemo } from "react";
import { Navigation, ChevronLeft, Search, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { getAllRoutes, getRouteHealth } from "@/lib/routes";
import type { Route } from "@/lib/routes";
import type { Checkpoint } from "@/lib/api/types";

interface RoutePickerSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRoute: Route | null;
  checkpoints: Checkpoint[];
  onRouteSelected: (route: Route) => void;
}

function RouteCard({
  route,
  checkpoints,
  isSelected,
  onSelect,
}: {
  route: Route;
  checkpoints: Checkpoint[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { t } = useLang();

  const health = useMemo(() => {
    const statusMap: Record<string, string> = {};
    checkpoints.forEach(cp => { statusMap[cp.canonical_key] = cp.status; });
    return getRouteHealth(route, statusMap);
  }, [route, checkpoints]);

  const blockedCount = health.closed + health.military;
  const cautionCount = health.congested + health.slow;
  const isAllClear = blockedCount === 0 && cautionCount === 0;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-xl border text-start transition-all active:scale-[0.98]",
        isSelected
          ? "bg-primary/10 border-primary/50"
          : "bg-card border-border hover:border-border/80 hover:bg-card/80"
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
        isSelected ? "bg-primary/20" : "bg-muted/50"
      )}>
        <Navigation className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
          {route.name_ar}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">
            {route.distance_km} كم · {route.estimated_time_min} د
          </span>
          <span className="text-[11px]">·</span>
          <span className={cn(
            "text-[11px] font-medium",
            blockedCount > 0 ? "text-red-400" :
            cautionCount > 0 ? "text-amber-400" : "text-emerald-400"
          )}>
            {blockedCount > 0
              ? `${blockedCount} ${t.blockedCheckpoints}`
              : cautionCount > 0
              ? `${cautionCount} ${t.congested}`
              : t.allClear}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {route.checkpoints.slice(0, 3).map(cp => (
            <span key={cp.canonical_key} className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
              {cp.name_ar}
            </span>
          ))}
          {route.checkpoints.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{route.checkpoints.length - 3}</span>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
      )}
    </button>
  );
}

export function RoutePickerSheet({
  isOpen,
  onOpenChange,
  selectedRoute,
  checkpoints,
  onRouteSelected,
}: RoutePickerSheetProps) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const allRoutes = getAllRoutes();

  const filtered = useMemo(() => {
    if (!query.trim()) return allRoutes;
    const q = query.toLowerCase();
    return allRoutes.filter(r =>
      r.from.toLowerCase().includes(q) ||
      r.to.toLowerCase().includes(q) ||
      r.name_ar.includes(query)
    );
  }, [query, allRoutes]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] flex flex-col p-0 rounded-t-2xl">
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle className="text-base font-bold flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            {t.browseRoutes}
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-muted/50 border border-border rounded-lg ps-9 pe-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Route list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
          {filtered.map(route => (
            <RouteCard
              key={route.id}
              route={route}
              checkpoints={checkpoints}
              isSelected={selectedRoute?.id === route.id}
              onSelect={() => {
                onRouteSelected(route);
                onOpenChange(false);
              }}
            />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
