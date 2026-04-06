import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { MapView } from "@/components/MapView";
import type { Alert, Checkpoint, CheckpointUpdate } from "@/lib/api/types";
import type { Route } from "@/lib/routes";
import { useLang } from "@/lib/i18n";

interface SentinelMapProps {
  alerts: Alert[];
  checkpoints: Checkpoint[];
  checkpointUpdates: CheckpointUpdate[];
  userLocation: { latitude: number; longitude: number } | null;
  routes: Route[];
  activeRoute: Route | null;
  onSelectRoute: (route: Route | null) => void;
  onStartNavigation: () => void;
  onCheckpointClick: (c: Checkpoint) => void;
  onAlertClick: (a: Alert) => void;
}

export function SentinelMap({
  alerts,
  checkpoints,
  checkpointUpdates,
  userLocation,
  routes,
  activeRoute,
  onSelectRoute,
  onStartNavigation,
  onCheckpointClick,
  onAlertClick
}: SentinelMapProps) {
  const { t, lang } = useLang();
  const [searchDestination, setSearchDestination] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchDestination.trim()) return routes;
    const query = searchDestination.toLowerCase();
    return routes.filter(r =>
      r.name_en.toLowerCase().includes(query) ||
      (r.name_ar && r.name_ar.includes(query)) ||
      r.from.toLowerCase().includes(query) ||
      r.to.toLowerCase().includes(query)
    );
  }, [routes, searchDestination]);

  const displayedRoute = activeRoute || routes[0];

  const activeRouteStatus = useMemo(() => {
    if (!displayedRoute) return { open: 0, closed: 0, congested: 0 };

    let open = 0, closed = 0, congested = 0;
    const cpMap = new Map(checkpoints.map(c => [c.canonical_key, c]));

    displayedRoute.checkpoints.forEach(rcp => {
      const cp = cpMap.get(rcp.canonical_key);
      if (!cp) return;
      if (cp.status === "open") open++;
      else if (cp.status === "closed" || cp.status === "military") closed++;
      else if (cp.status === "congested" || cp.status === "slow") congested++;
    });

    return { open, closed, congested };
  }, [displayedRoute, checkpoints]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Full-screen map background */}
      <div className="absolute inset-0 z-0">
        <MapView
          alerts={alerts}
          checkpoints={checkpoints}
          checkpointUpdates={checkpointUpdates}
          userLocation={userLocation}
          selectedRoute={displayedRoute}
          onCheckpointClick={onCheckpointClick}
          onAlertClick={onAlertClick}
        />
      </div>

      {/* Search overlay - top */}
      <div className="relative z-10 w-full px-4 pt-4">
        <div className="bg-surface-container-highest/70 backdrop-blur-2xl rounded-2xl p-3.5 border border-outline-variant/30 shadow-2xl">
          <div className="flex gap-3">
            {/* Route dots connector */}
            <div className="flex flex-col items-center pt-2.5 pb-2 shrink-0">
              <span className="material-symbols-outlined text-tertiary text-[16px]">my_location</span>
              <div className="w-[1px] flex-1 bg-outline-variant/50 my-1" />
              <span className="material-symbols-outlined text-secondary text-[16px] filled">location_on</span>
            </div>

            {/* From / To inputs */}
            <div className="flex-1 space-y-2">
              <div className="h-9 bg-surface-container/50 rounded-xl px-3 flex items-center border border-outline-variant/20">
                <span className="text-sm font-label font-bold text-on-surface-variant flex-1 truncate">
                  {t.currentLocation}
                </span>
              </div>
              <div className="relative">
                <div className="h-9 bg-surface-container/80 rounded-xl px-3 flex items-center gap-2 border border-outline-variant/40 focus-within:border-secondary transition-colors">
                  <input
                    type="text"
                    placeholder={t.whereTo}
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                    className="bg-transparent border-none text-sm font-label font-bold text-on-surface placeholder:text-on-surface-variant/50 w-full focus:outline-none focus:ring-0 p-0"
                    dir="auto"
                  />
                  {searchDestination && (
                    <button
                      onClick={() => { setSearchDestination(""); onSelectRoute(null); }}
                      className="text-on-surface-variant hover:text-on-surface flex items-center justify-center shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {/* Dropdown results */}
                {isSearchFocused && searchResults.length > 0 && (
                  <div className="absolute top-[calc(100%+4px)] start-0 end-0 bg-surface-container-highest/95 backdrop-blur-xl border border-outline-variant/30 rounded-xl overflow-hidden shadow-2xl z-30 max-h-[200px] overflow-y-auto">
                    {searchResults.map(route => (
                      <div
                        key={route.id}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onSelectRoute(route);
                          setSearchDestination(lang === 'ar' ? (route.name_ar || route.name_en) : route.name_en);
                          setIsSearchFocused(false);
                        }}
                        className="px-4 py-3 border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-3"
                      >
                        <span className="material-symbols-outlined text-secondary text-[18px]">route</span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-headline font-bold text-on-surface leading-tight truncate" dir="auto">
                            {lang === 'ar' ? (route.name_ar || route.name_en) : route.name_en}
                          </span>
                          <span className="text-[10px] font-label text-on-surface-variant tracking-widest uppercase">
                            {route.distance_km} KM • {route.estimated_time_min} {lang === 'ar' ? 'دقيقة' : 'MINS'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to push bottom panel down */}
      <div className="flex-1 pointer-events-none" />

      {/* Bottom route info panel */}
      {displayedRoute && (
        <div className="relative z-10 w-full p-4 pb-[calc(16px+70px)] pointer-events-auto">
          <div className="bg-surface-container-highest/85 backdrop-blur-3xl rounded-3xl p-5 border border-outline-variant/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            {/* Route header */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-label font-bold uppercase tracking-widest text-secondary px-2 py-0.5 rounded bg-secondary/10 border border-secondary/20">
                    {activeRouteStatus.closed > 0 ? t.closed : activeRouteStatus.congested > 0 ? t.congested : t.open}
                  </span>
                  <span className="text-sm font-body text-on-surface-variant truncate" dir="auto">
                    {lang === 'ar' ? (displayedRoute.name_ar || displayedRoute.name_en) : (displayedRoute.name_en || displayedRoute.name_ar)}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-headline font-bold tracking-tighter text-on-surface">
                    {displayedRoute.estimated_time_min}
                  </span>
                  <span className="text-sm font-label font-bold tracking-widest text-on-surface-variant uppercase">
                    {lang === 'ar' ? 'دقيقة' : 'MIN'}
                  </span>
                </div>
              </div>

              <div className="text-end">
                <span className="text-xl font-headline font-bold text-on-surface">
                  {displayedRoute.distance_km} <span className="text-sm text-on-surface-variant">KM</span>
                </span>
                <div className="flex items-center justify-end gap-1 text-on-surface-variant mt-1">
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                  <span className="text-[10px] font-label font-bold uppercase tracking-widest">
                    {displayedRoute.checkpoints.length} {t.nodes}
                  </span>
                </div>
              </div>
            </div>

            {/* Route status chips */}
            <div className="flex items-center gap-2 mb-4">
              {activeRouteStatus.open > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary/10 border border-tertiary/20">
                  <span className="w-2 h-2 bg-tertiary rounded-full" />
                  <span className="text-[11px] font-label font-bold text-tertiary">{activeRouteStatus.open} {t.open}</span>
                </div>
              )}
              {activeRouteStatus.closed > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error/10 border border-error/20">
                  <span className="w-2 h-2 bg-error rounded-full" />
                  <span className="text-[11px] font-label font-bold text-error">{activeRouteStatus.closed} {t.closed}</span>
                </div>
              )}
              {activeRouteStatus.congested > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20">
                  <span className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-[11px] font-label font-bold text-secondary">{activeRouteStatus.congested} {t.congested}</span>
                </div>
              )}
            </div>

            {/* Start navigation button */}
            <button
              onClick={onStartNavigation}
              className="w-full bg-secondary text-secondary-container hover:bg-secondary-fixed font-headline font-bold text-sm tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(254,179,0,0.2)]"
            >
              <span className="material-symbols-outlined text-[20px]">near_me</span>
              {t.startNavigation}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
