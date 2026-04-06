import { useState, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { KpiStrip } from "@/components/KpiStrip";
import { MapView } from "@/components/MapView";
import { LiveFeed } from "@/components/LiveFeed";
import { CheckpointList } from "@/components/CheckpointList";
import { AlertList } from "@/components/AlertList";
import { StatsView } from "@/components/StatsView";
import { DetailPanel } from "@/components/DetailPanel";
import { RouteSelector } from "@/components/RouteSelector";
import { RouteDetailView } from "@/components/RouteDetailView";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ComponentErrorFallback";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams } from "@/hooks/useSearchParams";
import { useCheckpoints } from "@/hooks/useCheckpoints";
import { useStats } from "@/hooks/useStats";
import { useCheckpointStats } from "@/hooks/useCheckpointStats";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { Alert, Checkpoint, CheckpointUpdate } from "@/lib/api/types";
import type { Route } from "@/lib/routes";
import { isAreaOnRoute } from "@/lib/routes";
import { motion, AnimatePresence } from "framer-motion";
import { Map, List, AlertTriangle, BarChart2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type TabId = "map" | "checkpoints" | "alerts" | "stats" | "routes";

const TABS: { id: TabId; icon: typeof Map }[] = [
  { id: "map", icon: Map },
  { id: "routes", icon: Navigation },
  { id: "checkpoints", icon: List },
  { id: "alerts", icon: AlertTriangle },
  { id: "stats", icon: BarChart2 },
];

export default function Dashboard() {
  const { t } = useLang();
  const { searchParams, setSearchParam } = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<TabId>("map");
  const [selectedItem, setSelectedItem] = useState<Alert | Checkpoint | null>(null);
  const [selectedCheckpointKey, setSelectedCheckpointKey] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showRouteSelector, setShowRouteSelector] = useState(false);

  const { alerts, checkpointUpdates, connectionStatus } = useRealtime();
  const { data: checkpointsData } = useCheckpoints();
  const { data: stats } = useStats();
  const { data: checkpointStats } = useCheckpointStats();
  const { location: userLocation, requestPermission, isSupported: geolocationSupported } = useGeolocation();

  const checkpoints = checkpointsData?.checkpoints ?? [];

  // When a checkpoint update from the feed is clicked, find the full checkpoint or use the key for history
  const handleCheckpointUpdateClick = useCallback((update: CheckpointUpdate) => {
    const found = checkpoints.find(c => c.canonical_key === update.canonical_key);
    if (found) {
      setSelectedItem(found);
      setSelectedCheckpointKey(found.canonical_key);
    } else {
      setSelectedItem({
        canonical_key: update.canonical_key,
        name_ar: update.name_raw,
        status: update.status as any,
        status_raw: update.status_raw,
        confidence: update.source_type === 'admin' ? 'high' : 'low',
        crowd_reports_1h: 0,
        last_updated: update.timestamp,
        last_source_type: update.source_type as any,
        is_stale: false,
      });
      setSelectedCheckpointKey(update.canonical_key);
    }
  }, [checkpoints]);

  const handleSelectItem = useCallback((item: Alert | Checkpoint) => {
    setSelectedItem(item);
    if ('canonical_key' in item) {
      setSelectedCheckpointKey((item as Checkpoint).canonical_key);
    } else {
      setSelectedCheckpointKey(null);
    }
  }, []);

  // Update URL when search query changes
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchParam('q', query || null);
  }, [setSearchParam]);

  const togglePause = useCallback(() => setIsPaused(p => !p), []);

  const TAB_LABELS: Record<TabId, string> = {
    map: t.liveMap,
    routes: t.routes || "Routes",
    checkpoints: t.checkpoints,
    alerts: t.alerts,
    stats: t.stats,
  };

  const closedCheckpoints = checkpointStats?.by_status?.closed ?? 0;
  const criticalAlerts = stats?.by_severity?.critical ?? 0;

  // Count route-relevant issues for the nav badge
  const routeIssueCount = useMemo(() => {
    if (!selectedRoute) return 0;
    const routeKeys = new Set(selectedRoute.checkpoints.map(cp => cp.canonical_key));
    const blockedOnRoute = checkpoints.filter(
      cp => routeKeys.has(cp.canonical_key) && (cp.status === 'closed' || cp.status === 'congested' || cp.status === 'military')
    ).length;
    const alertsOnRoute = alerts.filter(a => isAreaOnRoute(a.area, selectedRoute)).length;
    return blockedOnRoute + alertsOnRoute;
  }, [selectedRoute, checkpoints, alerts]);

  return (
    <div className="h-full bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 overflow-hidden">
      <Header
        connectionStatus={connectionStatus}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <KpiStrip
        closedCheckpoints={closedCheckpoints}
        criticalAlerts={criticalAlerts}
      />

      <div className="hidden md:flex shrink-0 px-6 pt-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center h-auto p-1 bg-muted/30 border border-border rounded-lg gap-0.5">
          {TABS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === id
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-4 h-4" />
              {TAB_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col px-3 md:px-6 pt-3 md:pt-3 pb-[calc(68px+env(safe-area-inset-bottom,0px))] md:pb-6 min-h-0">
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-0 flex flex-col"
            >
              {activeTab === "map" && (
                <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3">
                  <div className="flex-1 min-h-0 min-w-0">
                    <ErrorBoundary fallback={(error, reset) => <ComponentErrorFallback error={error} onReset={reset} />}>
                      <MapView
                        checkpoints={checkpoints}
                        alerts={alerts}
                        checkpointUpdates={checkpointUpdates}
                        onCheckpointClick={handleSelectItem}
                        onAlertClick={handleSelectItem}
                        userLocation={userLocation}
                        selectedRoute={selectedRoute}
                      />
                    </ErrorBoundary>
                  </div>
                  <div className="w-full md:w-[360px] lg:w-[420px] shrink-0 h-[200px] md:h-full min-h-0">
                    <ErrorBoundary fallback={(error, reset) => <ComponentErrorFallback error={error} onReset={reset} />}>
                      <LiveFeed
                        alerts={alerts}
                        checkpointUpdates={checkpointUpdates}
                        isPaused={isPaused}
                        onTogglePause={togglePause}
                        onAlertClick={handleSelectItem}
                        onCheckpointClick={handleCheckpointUpdateClick}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              )}

              {activeTab === "routes" && (
                <div className="flex-1 min-h-0 flex flex-col">
                  {selectedRoute ? (
                    <ErrorBoundary fallback={(error, reset) => <ComponentErrorFallback error={error} onReset={reset} />}>
                      <RouteDetailView
                        route={selectedRoute}
                        checkpoints={checkpoints}
                        alerts={alerts}
                        checkpointUpdates={checkpointUpdates}
                        userLocation={userLocation}
                        onCheckpointClick={handleSelectItem}
                        onClose={() => setSelectedRoute(null)}
                        onChangeRoute={() => setShowRouteSelector(true)}
                      />
                    </ErrorBoundary>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
                      <Navigation className="w-12 h-12 text-muted-foreground" />
                      <div className="text-center">
                        <h3 className="font-semibold text-sm mb-1">
                          {t.selectRoute || "Select a Route"}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          {t.routeDescription || "Choose a route to see checkpoints and real-time status"}
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowRouteSelector(true)}
                        className="gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        {t.browseRoutes || "Browse Routes"}
                      </Button>
                      {geolocationSupported && !userLocation && (
                        <Button
                          onClick={requestPermission}
                          variant="outline"
                          size="sm"
                        >
                          {t.enableLocation || "Enable Location"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "checkpoints" && (
                <div className="flex-1 min-h-0 flex flex-col">
                  <CheckpointList
                    searchQuery={searchQuery}
                    onCheckpointClick={handleSelectItem}
                  />
                </div>
              )}

              {activeTab === "alerts" && (
                <div className="flex-1 min-h-0 flex flex-col">
                  <AlertList
                    searchQuery={searchQuery}
                    onAlertClick={handleSelectItem}
                    selectedRoute={selectedRoute}
                  />
                </div>
              )}

              {activeTab === "stats" && (
                <div className="flex-1 min-h-0 overflow-auto">
                  <StatsView stats={stats} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-md flex items-stretch shrink-0 pb-[env(safe-area-inset-bottom,0px)]" style={{ minHeight: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}>
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative",
              activeTab === id
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <div className="relative">
              <Icon className={cn("h-5 w-5", activeTab === id && "stroke-[2.5]")} />
              {id === "routes" && routeIssueCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                  {routeIssueCount > 9 ? '9+' : routeIssueCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{TAB_LABELS[id]}</span>
            {activeTab === id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </nav>

      <DetailPanel
        item={selectedItem}
        checkpointKey={selectedCheckpointKey}
        onClose={() => { setSelectedItem(null); setSelectedCheckpointKey(null); }}
      />

      <RouteSelector
        checkpoints={checkpoints}
        onRouteSelected={setSelectedRoute}
        selectedRoute={selectedRoute}
        isOpen={showRouteSelector}
        onOpenChange={setShowRouteSelector}
      />
    </div>
  );
}
