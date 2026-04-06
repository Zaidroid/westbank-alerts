/**
 * MobileApp — 4-tab shell.
 * Home (الرئيسية) | Route (طريقي) | Checkpoints (حواجز) | Alerts (التنبيهات)
 * + fullscreen map overlay toggle
 * + immersive first-time onboarding
 */

import { useState, useCallback, useMemo } from "react";
import { Home, Navigation, Bell, X, Map as MapIcon, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useRealtime } from "@/hooks/useRealtime";
import { useCheckpoints } from "@/hooks/useCheckpoints";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useGeolocation } from "@/hooks/useGeolocation";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { HomeScreen } from "@/components/mobile/HomeScreen";
import { RouteScreen } from "@/components/mobile/RouteScreen";
import { AlertsScreen } from "@/components/mobile/AlertsScreen";
import { CheckpointsScreen } from "@/components/mobile/CheckpointsScreen";
import { SettingsSheet } from "@/components/mobile/SettingsSheet";
import { SplashScreen } from "@/components/mobile/SplashScreen";
import { DetailPanel } from "@/components/DetailPanel";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { MapView } from "@/components/MapView";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ComponentErrorFallback } from "@/components/ComponentErrorFallback";
import { KpiDetailSheet } from "@/components/mobile/KpiDetailSheet";
import { OnboardingFlow, hasCompletedOnboarding } from "@/components/mobile/OnboardingFlow";
import { isAreaOnRoute } from "@/lib/routes";
import type { KpiPillType } from "@/components/mobile/KpiDetailSheet";
import type { Alert, Checkpoint, CheckpointStatus } from "@/lib/api/types";

type TabId = "home" | "route" | "alerts" | "checkpoints";

export default function MobileApp() {
  const { t } = useLang();
  const [splashDone, setSplashDone] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(hasCompletedOnboarding);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [showSettings, setShowSettings] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [activePill, setActivePill] = useState<KpiPillType | null>(null);
  const [checkpointsFilter, setCheckpointsFilter] = useState<CheckpointStatus | null>(null);
  const [selectedItem, setSelectedItem] = useState<Alert | Checkpoint | null>(null);
  const [selectedCheckpointKey, setSelectedCheckpointKey] = useState<string | null>(null);

  const { alerts, checkpointUpdates, connectionStatus } = useRealtime();
  const { data: checkpointsData } = useCheckpoints();
  const { activeRoute, setActiveRoute, clearActiveRoute } = useActiveRoute();
  const { savedRoutes, saveRoute, removeRoute, isRouteSaved } = useSavedRoutes();
  const { location: userLocation, requestPermission: requestLocation } = useGeolocation();
  const {
    permission: notifPermission,
    enabled: notifEnabled,
    isSupported: notifSupported,
    requestPermission: requestNotifPermission,
    disableNotifications,
  } = usePushNotifications(alerts);

  const checkpoints = checkpointsData?.checkpoints ?? [];

  const criticalCount = useMemo(
    () => alerts.filter(a => a.severity === "critical" || a.severity === "high").length,
    [alerts]
  );

  const routeIssueCount = useMemo(() => {
    if (!activeRoute) return 0;
    const routeKeys = new Set(activeRoute.checkpoints.map(cp => cp.canonical_key));
    const blocked = checkpoints.filter(cp =>
      routeKeys.has(cp.canonical_key) &&
      (cp.status === "closed" || cp.status === "congested" || cp.status === "military")
    ).length;
    const routeAlerts = alerts.filter(a => isAreaOnRoute(a.area, activeRoute)).length;
    return blocked + routeAlerts;
  }, [activeRoute, checkpoints, alerts]);

  const handleSelectItem = useCallback((item: Alert | Checkpoint) => {
    setSelectedItem(item);
    setSelectedCheckpointKey("canonical_key" in item ? item.canonical_key : null);
    setShowMap(false);
  }, []);

  const handleCheckpointPress = useCallback((checkpoint: Checkpoint) => {
    setSelectedItem(checkpoint);
    setSelectedCheckpointKey(checkpoint.canonical_key);
  }, []);

  const closedCount = useMemo(
    () => checkpoints.filter(cp => cp.status === "closed" || cp.status === "military").length,
    [checkpoints]
  );

  const TABS: { id: TabId; icon: typeof Home; label: string; badge?: number }[] = [
    { id: "home",         icon: Home,       label: t.liveMap },
    { id: "route",        icon: Navigation, label: t.routes,      badge: routeIssueCount },
    { id: "checkpoints",  icon: Shield,     label: "حواجز",        badge: closedCount },
    { id: "alerts",       icon: Bell,       label: t.alerts,      badge: criticalCount },
  ];

  return (
    <>
      {/* ── Splash → Onboarding flow ────────────────────────────────── */}
      {!splashDone && (
        <SplashScreen onDone={() => setSplashDone(true)} />
      )}

      {splashDone && !onboardingDone && (
        <OnboardingFlow
          onComplete={() => setOnboardingDone(true)}
          onRequestLocation={requestLocation}
          onRequestNotifications={requestNotifPermission}
        />
      )}

      <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
        <MobileHeader
          connectionStatus={connectionStatus}
          onSettingsPress={() => setShowSettings(true)}
          newUpdateCount={checkpointUpdates.length}
          onPillPress={setActivePill}
        />

        <main
          className="flex-1 min-h-0 overflow-hidden"
          style={{ paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))" }}
        >
          {activeTab === "home" && (
            <HomeScreen
              alerts={alerts}
              checkpoints={checkpoints}
              checkpointUpdates={checkpointUpdates}
              activeRoute={activeRoute}
              onRoutePress={() => setActiveTab("route")}
              onClearRoute={clearActiveRoute}
              onGoToRouteTab={() => setActiveTab("route")}
              onGoToAlertsTab={() => setActiveTab("alerts")}
              onShowMap={() => setShowMap(true)}
              onViewCheckpoints={(filter) => {
                setCheckpointsFilter((filter as CheckpointStatus) ?? null);
                setActiveTab("checkpoints");
              }}
            />
          )}

          {activeTab === "route" && (
            <RouteScreen
              activeRoute={activeRoute}
              checkpoints={checkpoints}
              checkpointUpdates={checkpointUpdates}
              userLocation={userLocation}
              onRouteConfirmed={setActiveRoute}
              onClearRoute={clearActiveRoute}
              isRouteSaved={activeRoute ? isRouteSaved(activeRoute.id) : false}
              onSaveRoute={activeRoute ? () => saveRoute(activeRoute) : undefined}
            />
          )}

          {activeTab === "checkpoints" && (
            <CheckpointsScreen
              checkpoints={checkpoints}
              checkpointUpdates={checkpointUpdates}
              initialFilter={checkpointsFilter}
            />
          )}

          {activeTab === "alerts" && (
            <AlertsScreen alerts={alerts} activeRoute={activeRoute} />
          )}
        </main>

        {/* Bottom nav */}
        <nav
          className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-md flex items-stretch"
          style={{
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            minHeight: "calc(60px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {TABS.map(({ id, icon: Icon, label, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors",
                activeTab === id ? "text-primary" : "text-muted-foreground"
              )}
              style={{ minHeight: 60 }}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", activeTab === id && "stroke-[2.5]")} />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
              {activeTab === id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </nav>

        {/* ── Fullscreen map overlay ─────────────────────────────────────── */}
        {showMap && (
          <div className="fixed inset-0 z-[60] bg-background flex flex-col"
               style={{ paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))" }}>
            {/* Map header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0 bg-background/90 backdrop-blur">
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">الخريطة المباشرة</span>
              </div>
              <button
                onClick={() => setShowMap(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Map fills the rest */}
            <div className="flex-1 min-h-0">
              <ErrorBoundary fallback={(err, reset) => <ComponentErrorFallback error={err} onReset={reset} />}>
                <MapView
                  checkpoints={checkpoints}
                  alerts={alerts}
                  checkpointUpdates={checkpointUpdates}
                  onCheckpointClick={handleSelectItem}
                  onAlertClick={handleSelectItem}
                  userLocation={userLocation}
                  selectedRoute={activeRoute}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Sheets & panels */}
        <SettingsSheet
          isOpen={showSettings}
          onOpenChange={setShowSettings}
          notifPermission={notifPermission}
          notifEnabled={notifEnabled}
          notifSupported={notifSupported}
          onEnableNotifications={requestNotifPermission}
          onDisableNotifications={disableNotifications}
          savedRoutes={savedRoutes}
          activeRoute={activeRoute}
          onSelectRoute={(route) => { setActiveRoute(route); setActiveTab("home"); }}
          onRemoveSavedRoute={removeRoute}
          isCurrentRouteSaved={activeRoute ? isRouteSaved(activeRoute.id) : false}
          onSaveCurrentRoute={() => { if (activeRoute) saveRoute(activeRoute); }}
        />

        <DetailPanel
          item={selectedItem}
          checkpointKey={selectedCheckpointKey}
          onClose={() => { setSelectedItem(null); setSelectedCheckpointKey(null); }}
        />

        <KpiDetailSheet
          type={activePill}
          onClose={() => setActivePill(null)}
        />

        <PwaInstallPrompt />
      </div>
    </>
  );
}
