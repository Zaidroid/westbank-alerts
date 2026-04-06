import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MapView } from "@/components/MapView";
import type { Alert, Checkpoint, CheckpointUpdate, ConnectionStatus } from "@/lib/api/types";
import type { Route } from "@/lib/routes";
import { useLang } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

interface SentinelMapProps {
  alerts: Alert[];
  checkpoints: Checkpoint[];
  checkpointUpdates: CheckpointUpdate[];
  userLocation: { latitude: number; longitude: number } | null;
  routes: Route[];
  savedRoutes: Route[];
  activeRoute: Route | null;
  onSelectRoute: (route: Route | null) => void;
  onSaveRoute: (route: Route) => void;
  isRouteSaved: (routeId: string) => boolean;
  onStartNavigation: () => void;
  onCheckpointClick: (c: Checkpoint) => void;
  onAlertClick: (a: Alert) => void;
  connectionStatus: ConnectionStatus;
}

type MapTab = "explore" | "routes";

export function SentinelMap({
  alerts,
  checkpoints,
  checkpointUpdates,
  userLocation,
  routes,
  savedRoutes,
  activeRoute,
  onSelectRoute,
  onSaveRoute,
  isRouteSaved,
  onStartNavigation,
  onCheckpointClick,
  onAlertClick,
  connectionStatus,
}: SentinelMapProps) {
  const { t, lang } = useLang();
  const [searchDestination, setSearchDestination] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showRouteList, setShowRouteList] = useState(false);
  const [mapTab, setMapTab] = useState<MapTab>("explore");

  // When a route is selected externally, switch to explore
  useEffect(() => {
    if (activeRoute) setMapTab("explore");
  }, [activeRoute?.id]);

  // Search covers both routes AND checkpoints
  const searchResults = useMemo(() => {
    const query = searchDestination.trim().toLowerCase();
    if (!query) return { routes: routes.slice(0, 8), checkpoints: [] as Checkpoint[] };

    const matchedRoutes = routes.filter(r =>
      r.name_en.toLowerCase().includes(query) ||
      (r.name_ar && r.name_ar.includes(searchDestination.trim())) ||
      r.from.toLowerCase().includes(query) ||
      r.to.toLowerCase().includes(query)
    );

    const matchedCheckpoints = checkpoints.filter(cp =>
      cp.name_ar.toLowerCase().includes(query) ||
      (cp.name_en?.toLowerCase().includes(query)) ||
      (cp.region?.toLowerCase().includes(query))
    ).slice(0, 5);

    return { routes: matchedRoutes, checkpoints: matchedCheckpoints };
  }, [routes, checkpoints, searchDestination]);

  // Route health for each route
  const routeHealthMap = useMemo(() => {
    const cpMap = new Map(checkpoints.map(c => [c.canonical_key, c]));
    const map = new Map<string, { open: number; closed: number; congested: number; total: number }>();
    for (const route of routes) {
      let open = 0, closed = 0, congested = 0;
      for (const rcp of route.checkpoints) {
        const cp = cpMap.get(rcp.canonical_key);
        if (!cp) continue;
        if (cp.status === "open") open++;
        else if (cp.status === "closed" || cp.status === "military") closed++;
        else if (cp.status === "congested" || cp.status === "slow") congested++;
      }
      map.set(route.id, { open, closed, congested, total: route.checkpoints.length });
    }
    return map;
  }, [routes, checkpoints]);

  const activeRouteHealth = activeRoute ? routeHealthMap.get(activeRoute.id) : null;

  const handleSelectRoute = useCallback((route: Route) => {
    onSelectRoute(route);
    setSearchDestination(lang === 'ar' ? (route.name_ar || route.name_en) : route.name_en);
    setIsSearchFocused(false);
    setShowRouteList(false);
  }, [onSelectRoute, lang]);

  const handleClearRoute = useCallback(() => {
    onSelectRoute(null);
    setSearchDestination("");
  }, [onSelectRoute]);

  // Connection status indicator color
  const connDot = connectionStatus === "connected" ? "bg-tertiary" : connectionStatus === "connecting" ? "bg-secondary animate-pulse" : "bg-error";

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Full-screen map background */}
      <div className="absolute inset-0 z-0">
        <MapView
          alerts={alerts}
          checkpoints={checkpoints}
          checkpointUpdates={checkpointUpdates}
          userLocation={userLocation}
          selectedRoute={activeRoute}
          onCheckpointClick={onCheckpointClick}
          onAlertClick={onAlertClick}
        />
      </div>

      {/* Connection status bar — only shows when disconnected */}
      <AnimatePresence>
        {connectionStatus !== "connected" && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="absolute top-0 inset-x-0 z-20 flex items-center justify-center gap-2 py-1.5 bg-error/90 backdrop-blur-md"
            style={{ paddingTop: "calc(var(--safe-area-inset-top, 0px) + 6px)" }}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", connDot)} />
            <span className="text-[10px] font-label font-bold text-white uppercase tracking-widest">
              {connectionStatus === "connecting"
                ? (lang === 'ar' ? 'جارٍ الاتصال...' : 'RECONNECTING...')
                : (lang === 'ar' ? 'غير متصل — البيانات قد تكون قديمة' : 'OFFLINE — DATA MAY BE STALE')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search overlay - top */}
      <div className="relative z-10 w-full px-4 pt-3">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-surface-container-highest/70 backdrop-blur-2xl rounded-2xl border border-outline-variant/30 shadow-2xl overflow-hidden"
        >
          {/* Search input area */}
          <div className="p-3.5 flex gap-3">
            <div className="flex flex-col items-center pt-2.5 pb-2 shrink-0">
              <span className="material-symbols-outlined text-tertiary text-[16px]">my_location</span>
              <div className="w-[1px] flex-1 bg-outline-variant/50 my-1" />
              <span className="material-symbols-outlined text-secondary text-[16px] filled">location_on</span>
            </div>

            <div className="flex-1 space-y-2">
              <div className="h-9 bg-surface-container/50 rounded-xl px-3 flex items-center border border-outline-variant/20">
                <div className="flex items-center gap-1.5 flex-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", connDot)} />
                  <span className="text-sm font-label font-bold text-on-surface-variant truncate">
                    {t.currentLocation}
                  </span>
                </div>
              </div>
              <div className="relative">
                <div className={cn(
                  "h-9 bg-surface-container/80 rounded-xl px-3 flex items-center gap-2 border transition-colors",
                  isSearchFocused ? "border-secondary ring-1 ring-secondary/30" : "border-outline-variant/40"
                )}>
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px] shrink-0">search</span>
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
                      onClick={handleClearRoute}
                      className="text-on-surface-variant hover:text-on-surface flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {/* Search dropdown */}
                <AnimatePresence>
                  {isSearchFocused && (searchResults.routes.length > 0 || searchResults.checkpoints.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[calc(100%+4px)] start-0 end-0 bg-surface-container-highest/95 backdrop-blur-xl border border-outline-variant/30 rounded-xl overflow-hidden shadow-2xl z-30 max-h-[280px] overflow-y-auto"
                    >
                      {/* Checkpoint results */}
                      {searchResults.checkpoints.length > 0 && (
                        <>
                          <div className="px-4 pt-2.5 pb-1">
                            <span className="text-[9px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
                              {t.checkpoints}
                            </span>
                          </div>
                          {searchResults.checkpoints.map(cp => {
                            const statusDot = cp.status === "open" ? "bg-tertiary" : cp.status === "closed" ? "bg-error" : cp.status === "military" ? "bg-purple-500" : "bg-secondary";
                            return (
                              <div
                                key={cp.canonical_key}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  onCheckpointClick(cp);
                                  setIsSearchFocused(false);
                                  setSearchDestination("");
                                }}
                                className="px-4 py-2.5 border-b border-outline-variant/10 hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-3"
                              >
                                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", statusDot)} />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-sm font-headline font-bold text-on-surface truncate" dir="auto">
                                    {lang === 'ar' ? (cp.name_ar || cp.name_en) : (cp.name_en || cp.name_ar)}
                                  </span>
                                  {cp.region && (
                                    <span className="text-[10px] font-label text-on-surface-variant">{cp.region}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {/* Route results */}
                      {searchResults.routes.length > 0 && (
                        <>
                          <div className="px-4 pt-2.5 pb-1">
                            <span className="text-[9px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
                              {t.routes}
                            </span>
                          </div>
                          {searchResults.routes.map(route => {
                            const health = routeHealthMap.get(route.id);
                            return (
                              <div
                                key={route.id}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelectRoute(route)}
                                className={cn(
                                  "px-4 py-2.5 border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-3",
                                  activeRoute?.id === route.id && "bg-secondary/5"
                                )}
                              >
                                <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">route</span>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-sm font-headline font-bold text-on-surface leading-tight truncate" dir="auto">
                                    {lang === 'ar' ? (route.name_ar || route.name_en) : route.name_en}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-label text-on-surface-variant tracking-widest uppercase">
                                      {route.distance_km}km • {route.estimated_time_min} {lang === 'ar' ? 'د' : 'min'}
                                    </span>
                                    {health && health.closed > 0 && (
                                      <span className="text-[9px] font-label font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">
                                        {health.closed} {t.closed}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Saved routes strip — shows when no search and no active route */}
          {!isSearchFocused && !activeRoute && savedRoutes.length > 0 && (
            <div className="border-t border-outline-variant/10 px-3.5 py-2.5">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">history</span>
                <span className="text-[9px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
                  {lang === 'ar' ? 'مسارات سابقة' : 'RECENT ROUTES'}
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {savedRoutes.map(route => {
                  const health = routeHealthMap.get(route.id);
                  const hasClosed = health && health.closed > 0;
                  return (
                    <button
                      key={route.id}
                      onClick={() => handleSelectRoute(route)}
                      className={cn(
                        "shrink-0 px-3 py-2 rounded-xl border text-start transition-all active:scale-95",
                        hasClosed
                          ? "bg-error/5 border-error/20"
                          : "bg-surface-container/50 border-outline-variant/20 hover:bg-surface-container-high"
                      )}
                    >
                      <span className="text-[11px] font-headline font-bold text-on-surface block truncate max-w-[120px]" dir="auto">
                        {lang === 'ar' ? (route.name_ar || route.name_en) : route.name_en}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-label text-on-surface-variant">{route.estimated_time_min} {lang === 'ar' ? 'د' : 'min'}</span>
                        {hasClosed && (
                          <span className="w-1.5 h-1.5 bg-error rounded-full" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Browse routes FAB — only when no route selected and search not focused */}
      <AnimatePresence>
        {!activeRoute && !isSearchFocused && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 0.2, type: "spring", damping: 15 }}
            className="absolute bottom-[calc(90px+var(--safe-area-inset-bottom,0px))] end-4 z-10"
          >
            <button
              onClick={() => setShowRouteList(true)}
              className="w-14 h-14 rounded-2xl bg-secondary text-secondary-container flex items-center justify-center shadow-[0_4px_20px_rgba(254,179,0,0.4)] active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[26px]">directions</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick stats overlay — bottom left, shows checkpoint summary */}
      {!activeRoute && !isSearchFocused && (
        <div className="absolute bottom-[calc(90px+var(--safe-area-inset-bottom,0px))] start-4 z-10">
          <div className="bg-surface-container-highest/80 backdrop-blur-xl rounded-xl px-3 py-2 border border-outline-variant/30 shadow-lg flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-tertiary" />
              <span className="text-[11px] font-headline font-bold text-on-surface tabular-nums">
                {checkpoints.filter(c => c.status === "open").length}
              </span>
            </div>
            <div className="w-px h-4 bg-outline-variant/30" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-error" />
              <span className="text-[11px] font-headline font-bold text-on-surface tabular-nums">
                {checkpoints.filter(c => c.status === "closed").length}
              </span>
            </div>
            <div className="w-px h-4 bg-outline-variant/30" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[11px] font-headline font-bold text-on-surface tabular-nums">
                {checkpoints.filter(c => c.status === "military").length}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 pointer-events-none" />

      {/* Bottom route info panel — only when route IS selected */}
      <AnimatePresence>
        {activeRoute && activeRouteHealth && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 180 }}
            className="relative z-10 w-full p-4 pb-[calc(16px+70px)] pointer-events-auto"
          >
            <div className="bg-surface-container-highest/85 backdrop-blur-3xl rounded-3xl border border-outline-variant/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden">
              {/* Route health bar — visual at-a-glance */}
              <div className="flex h-1">
                {activeRouteHealth.open > 0 && (
                  <div className="bg-tertiary" style={{ flex: activeRouteHealth.open }} />
                )}
                {activeRouteHealth.congested > 0 && (
                  <div className="bg-secondary" style={{ flex: activeRouteHealth.congested }} />
                )}
                {activeRouteHealth.closed > 0 && (
                  <div className="bg-error" style={{ flex: activeRouteHealth.closed }} />
                )}
              </div>

              <div className="p-5">
                {/* Route header */}
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[10px] font-label font-bold uppercase tracking-widest px-2 py-0.5 rounded border",
                        activeRouteHealth.closed > 0
                          ? "bg-error/10 border-error/20 text-error"
                          : activeRouteHealth.congested > 0
                            ? "bg-secondary/10 border-secondary/20 text-secondary"
                            : "bg-tertiary/10 border-tertiary/20 text-tertiary"
                      )}>
                        {activeRouteHealth.closed > 0 ? t.closed : activeRouteHealth.congested > 0 ? t.congested : t.allClear}
                      </span>
                    </div>
                    <h3 className="text-base font-headline font-bold text-on-surface leading-tight mb-1" dir="auto">
                      {lang === 'ar' ? (activeRoute.name_ar || activeRoute.name_en) : (activeRoute.name_en || activeRoute.name_ar)}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-headline font-bold tracking-tighter text-on-surface tabular-nums">
                        {activeRoute.estimated_time_min}
                      </span>
                      <span className="text-xs font-label font-bold tracking-widest text-on-surface-variant uppercase">
                        {lang === 'ar' ? 'دقيقة' : 'MIN'}
                      </span>
                      <span className="text-on-surface-variant mx-1">•</span>
                      <span className="text-lg font-headline font-bold text-on-surface tabular-nums">
                        {activeRoute.distance_km}
                      </span>
                      <span className="text-xs text-on-surface-variant font-label font-bold uppercase">KM</span>
                    </div>
                  </div>

                  {/* Checkpoint nodes count */}
                  <div className="flex flex-col items-center gap-0.5 bg-surface-container/50 px-3 py-2 rounded-xl border border-outline-variant/20">
                    <span className="text-lg font-headline font-bold text-on-surface tabular-nums">
                      {activeRoute.checkpoints.length}
                    </span>
                    <span className="text-[8px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
                      {t.nodes}
                    </span>
                  </div>
                </div>

                {/* Checkpoint status dots — shows each checkpoint on the route */}
                <div className="flex items-center gap-1 mb-4">
                  {activeRoute.checkpoints.map((rcp, i) => {
                    const cp = checkpoints.find(c => c.canonical_key === rcp.canonical_key);
                    const status = cp?.status || 'unknown';
                    const dotColor = status === 'open' ? 'bg-tertiary' : status === 'closed' ? 'bg-error' : status === 'military' ? 'bg-purple-500' : status === 'congested' || status === 'slow' ? 'bg-secondary' : 'bg-outline-variant';
                    return (
                      <div key={rcp.canonical_key} className="flex-1 flex items-center">
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", dotColor)} title={lang === 'ar' ? rcp.name_ar : (rcp.name_en || rcp.name_ar)} />
                        {i < activeRoute.checkpoints.length - 1 && (
                          <div className="flex-1 h-[1px] bg-outline-variant/30 mx-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClearRoute}
                    className="w-12 h-12 border-2 border-outline-variant/40 hover:bg-surface-container rounded-xl flex items-center justify-center transition-all active:scale-90 text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <button
                    onClick={() => {
                      onSaveRoute(activeRoute);
                    }}
                    className={cn(
                      "w-12 h-12 border-2 rounded-xl flex items-center justify-center transition-all active:scale-90",
                      isRouteSaved(activeRoute.id)
                        ? "border-secondary/40 bg-secondary/10 text-secondary"
                        : "border-outline-variant/40 hover:bg-surface-container text-on-surface-variant"
                    )}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isRouteSaved(activeRoute.id) ? "bookmark" : "bookmark_border"}
                    </span>
                  </button>
                  <button
                    onClick={onStartNavigation}
                    className="flex-1 bg-secondary text-secondary-container hover:bg-secondary-fixed font-headline font-bold text-sm tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(254,179,0,0.25)]"
                  >
                    <span className="material-symbols-outlined text-[20px]">near_me</span>
                    {t.startNavigation}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full route list modal */}
      <AnimatePresence>
        {showRouteList && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRouteList(false)}
              className="fixed inset-0 z-[50] bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-[51] bg-surface-dim rounded-t-3xl border-t border-outline-variant/20 shadow-[0_-12px_40px_rgba(0,0,0,0.7)] max-h-[80vh] flex flex-col"
            >
              <div className="flex flex-col items-center pt-3 pb-2 shrink-0">
                <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mb-3" />
                <div className="w-full px-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-headline font-bold text-on-surface" dir="auto">
                      {t.browseRoutes}
                    </h3>
                    <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest mt-0.5">
                      {routes.length} {t.routes} • {lang === 'ar' ? 'اختر مسارك' : 'Pick your path'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRouteList(false)}
                    className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors flex items-center justify-center text-on-surface-variant active:scale-90"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {routes.map((route, i) => {
                  const health = routeHealthMap.get(route.id);
                  const isSelected = activeRoute?.id === route.id;
                  const healthPercent = health ? Math.round(((health.total - health.closed) / Math.max(health.total, 1)) * 100) : 100;
                  return (
                    <motion.div
                      key={route.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleSelectRoute(route)}
                      className={cn(
                        "p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98]",
                        isSelected
                          ? "bg-secondary/10 border-secondary/30"
                          : "bg-surface-container-low border-outline-variant/20 hover:bg-surface-container"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-headline font-bold text-on-surface leading-tight truncate" dir="auto">
                            {lang === 'ar' ? (route.name_ar || route.name_en) : route.name_en}
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest tabular-nums">
                              {route.distance_km} km
                            </span>
                            <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest tabular-nums">
                              ~{route.estimated_time_min} {lang === 'ar' ? 'د' : 'min'}
                            </span>
                            <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
                              {route.checkpoints.length} {t.nodes}
                            </span>
                          </div>
                          {/* Mini health bar */}
                          <div className="flex h-1 rounded-full overflow-hidden mt-2.5 bg-surface-container">
                            {health && health.open > 0 && <div className="bg-tertiary" style={{ flex: health.open }} />}
                            {health && health.congested > 0 && <div className="bg-secondary" style={{ flex: health.congested }} />}
                            {health && health.closed > 0 && <div className="bg-error" style={{ flex: health.closed }} />}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                          <span className={cn(
                            "text-2xl font-headline font-bold tabular-nums",
                            healthPercent === 100 ? "text-tertiary" : healthPercent >= 70 ? "text-secondary" : "text-error"
                          )}>
                            {healthPercent}%
                          </span>
                          <span className="text-[8px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
                            {lang === 'ar' ? 'سالك' : 'CLEAR'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="h-[calc(var(--safe-area-inset-bottom,0px)+16px)] shrink-0" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
