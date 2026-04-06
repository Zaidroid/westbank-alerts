import { useState, useCallback, useMemo, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { useRealtime } from "@/hooks/useRealtime";
import { useCheckpoints } from "@/hooks/useCheckpoints";
import { useActiveRoute } from "@/hooks/useActiveRoute";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";
import { useActiveSirens } from "@/hooks/useAlerts";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useGeolocation } from "@/hooks/useGeolocation";
import { isAreaOnRoute } from "@/lib/routes";
import { getAllRoutes } from "@/lib/routes";
import type { Alert, Checkpoint } from "@/lib/api/types";

// Setup and Overlays
import { SplashScreen } from "@/components/mobile/SplashScreen";
import { OnboardingFlow, hasCompletedOnboarding } from "@/components/mobile/OnboardingFlow";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { DetailPanel } from "@/components/DetailPanel";

// Sentinel Design System Components
import { SentinelLayout, type TabId } from "@/components/sentinel/SentinelLayout";
import { SentinelHome } from "@/components/sentinel/SentinelHome";
import { SentinelNews } from "@/components/sentinel/SentinelNews";
import { SentinelCheckpoints } from "@/components/sentinel/SentinelCheckpoints";
import { SentinelMap } from "@/components/sentinel/SentinelMap";
import { SentinelNavigation } from "@/components/sentinel/SentinelNavigation";
import { SentinelProfile } from "@/components/sentinel/SentinelProfile";

import { KpiDetailSheet } from "@/components/mobile/KpiDetailSheet";

export default function MobileApp() {
  const { t } = useLang();
  const [splashDone, setSplashDone] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(() => hasCompletedOnboarding());
  
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [isNavigating, setIsNavigating] = useState(false);
  const [activePill, setActivePill] = useState<any>(null);
  
  const [selectedItem, setSelectedItem] = useState<Alert | Checkpoint | null>(null);
  const [selectedCheckpointKey, setSelectedCheckpointKey] = useState<string | null>(null);

  const { alerts, checkpointUpdates, connectionStatus } = useRealtime();
  const { data: checkpointsData } = useCheckpoints();
  const { activeRoute, setActiveRoute } = useActiveRoute();
  const { location: userLocation, requestPermission: requestLocation, startWatching, stopWatching } = useGeolocation();
  const { requestPermission: requestNotifPermission } = usePushNotifications(alerts);

  const checkpoints = checkpointsData?.checkpoints ?? [];

  const handleSelectItem = useCallback((item: Alert | Checkpoint) => {
    setSelectedItem(item);
    setSelectedCheckpointKey("canonical_key" in item ? item.canonical_key : null);
  }, []);

  // Dynamically start and stop geolocation tracking to save battery
  // but ensure live map and navigation have continuous blue-dot tracking.
  useEffect(() => {
    if (activeTab === "map" || isNavigating) {
      startWatching();
    } else {
      stopWatching();
    }
  }, [activeTab, isNavigating, startWatching, stopWatching]);

  // Use the active sirens hook for a reliable, live-only badge count
  const { data: activeSirensData } = useActiveSirens();
  const criticalCount = activeSirensData?.count || 0;
  
  const closedCount = useMemo(
    () => checkpoints.filter(cp => cp.status === "closed" || cp.status === "military").length,
    [checkpoints]
  );

  const routeIssueCount = useMemo(() => {
    if (!activeRoute) return 0;
    const routeKeys = new Set(activeRoute.checkpoints.map(cp => cp.canonical_key));
    const blocked = checkpoints.filter(cp =>
      routeKeys.has(cp.canonical_key) &&
      (cp.status === "closed" || cp.status === "congested" || cp.status === "military")
    ).length;
    return blocked;
  }, [activeRoute, checkpoints]);

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
          onTabChange={setActiveTab}
          locationName={locationName}
          connectionStatus={connectionStatus}
          badges={{
            news: criticalCount,
            checkpoints: closedCount,
            map: routeIssueCount,
          }}
          onSosPress={() => {
            alert("SOS: Emergency dispatch initiated locally.");
          }}
          onPillPress={setActivePill}
        >
          {activeTab === "home" && (
            <SentinelHome
              alerts={alerts}
              checkpoints={checkpoints}
              checkpointUpdates={checkpointUpdates}
              onNavigateMap={() => setActiveTab("map")}
              onExploreCheckpoints={() => setActiveTab("checkpoints")}
              onViewAlerts={() => setActiveTab("news")}
            />
          )}

          {activeTab === "news" && (
            <SentinelNews
              alerts={alerts}
            />
          )}

          {activeTab === "checkpoints" && (
            <SentinelCheckpoints
              checkpoints={checkpoints}
              checkpointUpdates={checkpointUpdates}
              onNavigateMap={() => setActiveTab("map")}
            />
          )}

          {activeTab === "map" && (
            <SentinelMap
              alerts={alerts}
              checkpoints={checkpoints}
              checkpointUpdates={checkpointUpdates}
              userLocation={userLocation}
              routes={getAllRoutes()}
              activeRoute={activeRoute}
              onSelectRoute={setActiveRoute}
              onStartNavigation={() => {
                // Ensure there's a route selected
                if (!activeRoute && getAllRoutes().length > 0) {
                  setActiveRoute(getAllRoutes()[0]);
                }
                setIsNavigating(true);
              }}
              onCheckpointClick={handleSelectItem}
              onAlertClick={handleSelectItem}
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

      {/* Global Overlays */}
      {isNavigating && activeRoute && (
        <SentinelNavigation
          activeRoute={activeRoute}
          checkpoints={checkpoints}
          alerts={alerts}
          userLocation={userLocation}
          onEndNavigation={() => setIsNavigating(false)}
          onReRoute={() => setIsNavigating(false)}
        />
      )}
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
    </>
  );
}
