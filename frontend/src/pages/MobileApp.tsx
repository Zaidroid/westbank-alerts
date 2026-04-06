import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n";
import { useRealtime } from "@/hooks/useRealtime";
import { useCheckpoints } from "@/hooks/useCheckpoints";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";
import { useActiveSirens } from "@/hooks/useAlerts";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getAllRoutes } from "@/lib/routes";
import type { Alert, Checkpoint } from "@/lib/api/types";
import type { Route } from "@/lib/routes";

// Setup and Overlays
import { SplashScreen } from "@/components/mobile/SplashScreen";
import { OnboardingFlow, hasCompletedOnboarding } from "@/components/mobile/OnboardingFlow";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

// Sentinel Design System Components
import { SentinelLayout, type TabId } from "@/components/sentinel/SentinelLayout";
import { SentinelHome } from "@/components/sentinel/SentinelHome";
import { SentinelNews } from "@/components/sentinel/SentinelNews";
import { SentinelCheckpoints } from "@/components/sentinel/SentinelCheckpoints";
import { SentinelMap } from "@/components/sentinel/SentinelMap";
import { SentinelNavigation } from "@/components/sentinel/SentinelNavigation";
import { SentinelProfile } from "@/components/sentinel/SentinelProfile";

import { KpiDetailSheet } from "@/components/mobile/KpiDetailSheet";
import { AnimatePresence } from "framer-motion";

export default function MobileApp() {
  const { t } = useLang();
  const [splashDone, setSplashDone] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(() => hasCompletedOnboarding());

  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [isNavigating, setIsNavigating] = useState(false);
  const [activePill, setActivePill] = useState<any>(null);
  const prevTabRef = useRef<TabId>("home");

  // Selected checkpoint or alert for detail view (shown as bottom sheet from checkpoint cards)
  const [selectedCheckpointKey, setSelectedCheckpointKey] = useState<string | null>(null);

  const { alerts, checkpointUpdates, connectionStatus } = useRealtime();
  const { data: checkpointsData } = useCheckpoints();
  const { activeRoute, setActiveRoute } = useActiveRoute();
  const { savedRoutes, saveRoute, isRouteSaved } = useSavedRoutes();
  const { location: userLocation, requestPermission: requestLocation, startWatching, stopWatching } = useGeolocation();
  const { requestPermission: requestNotifPermission } = usePushNotifications(alerts);

  const checkpoints = checkpointsData?.checkpoints ?? [];
  const allRoutes = useMemo(() => getAllRoutes(), []);

  // --- Geolocation lifecycle ---
  // Track when map or navigation is active and needs live GPS
  useEffect(() => {
    if (activeTab === "map" || isNavigating) {
      startWatching();
    } else {
      stopWatching();
    }
  }, [activeTab, isNavigating, startWatching, stopWatching]);

  // --- Badge counts ---
  const { data: activeSirensData } = useActiveSirens();
  const criticalCount = activeSirensData?.count || 0;

  const closedCount = useMemo(
    () => checkpoints.filter(cp => cp.status === "closed" || cp.status === "military").length,
    [checkpoints]
  );

  const routeIssueCount = useMemo(() => {
    if (!activeRoute) return 0;
    const routeKeys = new Set(activeRoute.checkpoints.map(cp => cp.canonical_key));
    return checkpoints.filter(cp =>
      routeKeys.has(cp.canonical_key) &&
      (cp.status === "closed" || cp.status === "congested" || cp.status === "military")
    ).length;
  }, [activeRoute, checkpoints]);

  // --- Navigation flow ---
  const handleStartNavigation = useCallback(() => {
    if (activeRoute) {
      saveRoute(activeRoute); // auto-save to recent routes
      setIsNavigating(true);
    }
  }, [activeRoute, saveRoute]);

  const handleEndNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  const handleReRoute = useCallback(() => {
    // Go back to map tab with route selection visible so user can pick a new route
    setIsNavigating(false);
    setActiveTab("map");
  }, []);

  // When clicking a checkpoint on the map or in a card — navigate to map and highlight
  const handleCheckpointClick = useCallback((c: Checkpoint) => {
    setSelectedCheckpointKey(c.canonical_key);
  }, []);

  const handleAlertClick = useCallback((a: Alert) => {
    // Alerts don't have a detail panel mapped here — SentinelNews handles its own detail
  }, []);

  // Tab change with history tracking for animations
  const handleTabChange = useCallback((tab: TabId) => {
    prevTabRef.current = activeTab;
    setActiveTab(tab);
  }, [activeTab]);

  // Navigate to map with a specific route pre-selected
  const handleNavigateToRoute = useCallback((route: Route) => {
    setActiveRoute(route);
    setActiveTab("map");
  }, [setActiveRoute]);

  // Navigate to map from other tabs
  const handleNavigateMap = useCallback(() => {
    setActiveTab("map");
  }, []);

  const locationName = t.appTitle;

  return (
    <>
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

      {splashDone && onboardingDone && (
        <SentinelLayout
          activeTab={activeTab}
          onTabChange={handleTabChange}
          locationName={locationName}
          connectionStatus={connectionStatus}
          badges={{
            news: criticalCount,
            checkpoints: closedCount,
            map: routeIssueCount,
          }}
          onSosPress={() => {
            // Vibrate for SOS
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
          }}
          onPillPress={setActivePill}
        >
          {activeTab === "home" && (
            <SentinelHome
              alerts={alerts}
              checkpoints={checkpoints}
              checkpointUpdates={checkpointUpdates}
              onNavigateMap={handleNavigateMap}
              onExploreCheckpoints={() => handleTabChange("checkpoints")}
              onViewAlerts={() => handleTabChange("news")}
            />
          )}

          {activeTab === "news" && (
            <SentinelNews alerts={alerts} />
          )}

          {activeTab === "checkpoints" && (
            <SentinelCheckpoints
              checkpoints={checkpoints}
              checkpointUpdates={checkpointUpdates}
              onNavigateMap={handleNavigateMap}
            />
          )}

          {activeTab === "map" && (
            <SentinelMap
              alerts={alerts}
              checkpoints={checkpoints}
              checkpointUpdates={checkpointUpdates}
              userLocation={userLocation}
              routes={allRoutes}
              savedRoutes={savedRoutes}
              activeRoute={activeRoute}
              onSelectRoute={setActiveRoute}
              onSaveRoute={saveRoute}
              isRouteSaved={isRouteSaved}
              onStartNavigation={handleStartNavigation}
              onCheckpointClick={handleCheckpointClick}
              onAlertClick={handleAlertClick}
              connectionStatus={connectionStatus}
            />
          )}

          {activeTab === "profile" && (
            <SentinelProfile
              connectionStatus={connectionStatus}
              locationName={locationName}
              userLocation={userLocation}
            />
          )}
        </SentinelLayout>
      )}

      {/* Navigation overlay */}
      <AnimatePresence>
        {isNavigating && activeRoute && (
          <SentinelNavigation
            activeRoute={activeRoute}
            checkpoints={checkpoints}
            alerts={alerts}
            checkpointUpdates={checkpointUpdates}
            userLocation={userLocation}
            onEndNavigation={handleEndNavigation}
            onReRoute={handleReRoute}
            connectionStatus={connectionStatus}
          />
        )}
      </AnimatePresence>

      <KpiDetailSheet
        type={activePill}
        onClose={() => setActivePill(null)}
      />
      <PwaInstallPrompt />
    </>
  );
}
