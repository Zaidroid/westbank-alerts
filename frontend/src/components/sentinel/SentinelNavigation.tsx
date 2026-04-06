import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { MapView } from "@/components/MapView";
import type { Alert, Checkpoint } from "@/lib/api/types";
import type { Route } from "@/lib/routes";
import { useLang } from "@/lib/i18n";
import { calculateDistance } from "@/hooks/useGeolocation";

interface SentinelNavigationProps {
  activeRoute: Route;
  checkpoints: Checkpoint[];
  alerts: Alert[];
  onEndNavigation: () => void;
  onReRoute: () => void;
  userLocation: { latitude: number; longitude: number } | null;
}

export function SentinelNavigation({
  activeRoute,
  checkpoints,
  alerts,
  onEndNavigation,
  onReRoute,
  userLocation
}: SentinelNavigationProps) {
  const { t, lang } = useLang();

  const [showTacticalAlert, setShowTacticalAlert] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Timer for elapsed travel time
  useEffect(() => {
    const id = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedFormatted = useMemo(() => {
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [elapsedSec]);

  // Find closest checkpoint to user location
  const navigationState = useMemo(() => {
    if (!userLocation) {
      return {
        nextCheckpoint: activeRoute.checkpoints[0],
        nextCheckpointDetails: checkpoints.find(c => c.canonical_key === activeRoute.checkpoints[0]?.canonical_key),
        distanceToNext: null,
        passedCount: 0,
        totalCount: activeRoute.checkpoints.length,
        progressPercent: 0,
      };
    }

    let closestIdx = 0;
    let minDist = Infinity;

    activeRoute.checkpoints.forEach((cp, idx) => {
      const d = calculateDistance(userLocation.latitude, userLocation.longitude, cp.latitude, cp.longitude);
      if (d < minDist) {
        minDist = d;
        closestIdx = idx;
      }
    });

    // If we're past the closest checkpoint (closer to the next one), move forward
    const passedCount = closestIdx;
    const nextIdx = Math.min(closestIdx, activeRoute.checkpoints.length - 1);
    const nextCp = activeRoute.checkpoints[nextIdx];
    const nextDetails = nextCp ? checkpoints.find(c => c.canonical_key === nextCp.canonical_key) : null;
    const distToNext = nextCp ? calculateDistance(userLocation.latitude, userLocation.longitude, nextCp.latitude, nextCp.longitude) : null;

    return {
      nextCheckpoint: nextCp,
      nextCheckpointDetails: nextDetails,
      distanceToNext: distToNext,
      passedCount,
      totalCount: activeRoute.checkpoints.length,
      progressPercent: Math.round((passedCount / activeRoute.checkpoints.length) * 100),
    };
  }, [userLocation, activeRoute, checkpoints]);

  const distDisplay = navigationState.distanceToNext != null
    ? navigationState.distanceToNext < 1
      ? `${Math.round(navigationState.distanceToNext * 1000)}m`
      : `${navigationState.distanceToNext.toFixed(1)}km`
    : '--';

  // Check if next checkpoint has issues
  const nextStatus = navigationState.nextCheckpointDetails?.status || 'unknown';
  const nextStatusColor = nextStatus === 'open' ? 'tertiary' : nextStatus === 'closed' || nextStatus === 'military' ? 'error' : 'secondary';

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        <MapView
          alerts={alerts}
          checkpoints={checkpoints}
          userLocation={userLocation}
          selectedRoute={activeRoute}
          onCheckpointClick={() => {}}
          onAlertClick={() => {}}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40 pointer-events-none z-10" />
      </div>

      {/* Top bar */}
      <div className="relative z-20 w-full flex items-center justify-between px-4 pb-3"
        style={{ paddingTop: "calc(var(--safe-area-inset-top, 0px) + 12px)" }}
      >
        <button
          onClick={onEndNavigation}
          className="w-10 h-10 rounded-full bg-surface-container/80 backdrop-blur-md flex items-center justify-center border border-outline-variant/40 hover:bg-surface-container-high transition-colors text-on-surface shadow-lg"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse" />
            <span className="text-[10px] font-label font-bold text-tertiary tracking-widest uppercase drop-shadow">
              {lang === 'ar' ? 'مباشر' : 'LIVE'}
            </span>
          </div>
          <span className="text-sm font-headline font-bold text-on-surface tracking-wide drop-shadow-md" dir="auto">
            {lang === 'ar' ? (activeRoute.name_ar || activeRoute.name_en) : (activeRoute.name_en || activeRoute.name_ar)}
          </span>
        </div>

        {/* Elapsed time */}
        <div className="bg-surface-container/80 backdrop-blur-md px-3 py-2 rounded-full border border-outline-variant/40 shadow-lg">
          <span className="text-sm font-headline font-bold text-on-surface tabular-nums">{elapsedFormatted}</span>
        </div>
      </div>

      {/* Floating next checkpoint indicator */}
      {navigationState.nextCheckpoint && (
        <div className="relative z-20 mx-4 mt-2">
          <div className={cn(
            "bg-surface-container-highest/80 backdrop-blur-xl rounded-2xl p-4 border shadow-xl flex items-center gap-4",
            nextStatus === 'closed' || nextStatus === 'military'
              ? "border-error/40"
              : nextStatus === 'congested' || nextStatus === 'slow'
                ? "border-secondary/40"
                : "border-outline-variant/30"
          )}>
            {/* Distance badge */}
            <div className="flex flex-col items-center min-w-[60px] shrink-0">
              <span className={cn("text-2xl font-headline font-bold tracking-tight", `text-${nextStatusColor}`)}>
                {distDisplay}
              </span>
              <span className="text-[9px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
                {lang === 'ar' ? 'التالي' : 'NEXT'}
              </span>
            </div>

            <div className="w-px h-10 bg-outline-variant/30 shrink-0" />

            <div className="flex-1 min-w-0">
              <span className="text-sm font-headline font-bold text-on-surface block truncate" dir="auto">
                {lang === 'ar'
                  ? (navigationState.nextCheckpoint.name_ar || navigationState.nextCheckpoint.name_en)
                  : (navigationState.nextCheckpoint.name_en || navigationState.nextCheckpoint.name_ar)}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("w-2 h-2 rounded-full", `bg-${nextStatusColor}`)} />
                <span className={cn("text-[10px] font-label font-bold uppercase tracking-widest", `text-${nextStatusColor}`)}>
                  {nextStatus === 'open' ? (lang === 'ar' ? 'مفتوح' : 'OPEN') :
                   nextStatus === 'closed' ? (lang === 'ar' ? 'مغلق' : 'CLOSED') :
                   nextStatus === 'military' ? (lang === 'ar' ? 'نقطة عسكريا' : 'MILITARY') :
                   nextStatus === 'congested' ? (lang === 'ar' ? 'مزدحم' : 'CONGESTED') :
                   (lang === 'ar' ? 'غير معروف' : 'UNKNOWN')}
                </span>
              </div>
            </div>

            <span className={cn(
              "material-symbols-outlined text-[24px] shrink-0",
              `text-${nextStatusColor}`
            )}>
              {nextStatus === 'open' ? 'check_circle' :
               nextStatus === 'closed' || nextStatus === 'military' ? 'block' :
               nextStatus === 'congested' || nextStatus === 'slow' ? 'warning' : 'help'}
            </span>
          </div>
        </div>
      )}

      {/* Tactical alert (if applicable) */}
      {showTacticalAlert && (nextStatus === 'closed' || nextStatus === 'military') && (
        <div className="relative z-30 mx-4 mt-3 animate-slide-up pointer-events-auto">
          <div className="bg-error-container/20 border border-error/40 rounded-2xl p-4 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute start-0 top-0 bottom-0 w-1 bg-error" />
            <div className="flex items-start gap-2 mb-2">
              <span className="material-symbols-outlined text-error text-[18px] animate-pulse">warning</span>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-label font-bold text-error uppercase tracking-widest block mb-0.5" dir="auto">
                  {lang === 'ar' ? 'تحذير' : 'WARNING'}
                </span>
                <span className="text-sm font-headline font-bold text-on-surface" dir="auto">
                  {lang === 'ar'
                    ? `${navigationState.nextCheckpoint?.name_ar || 'الحاجز التالي'} مغلق`
                    : `${navigationState.nextCheckpoint?.name_en || 'Next checkpoint'} is closed`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTacticalAlert(false)}
                className="flex-1 py-1.5 bg-surface-container text-[10px] font-bold font-label uppercase text-on-surface-variant rounded-md hover:text-on-surface transition-colors"
              >
                {lang === 'ar' ? 'تجاهل' : 'DISMISS'}
              </button>
              <button
                onClick={onReRoute}
                className="flex-1 py-1.5 bg-error/20 text-[10px] font-bold font-label uppercase text-error rounded-md hover:bg-error/30 transition-colors"
              >
                {lang === 'ar' ? 'إعادة توجيه' : 'RE-ROUTE'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 pointer-events-none" />

      {/* Bottom HUD */}
      <div className="relative z-20 w-full p-4 pointer-events-auto"
        style={{ paddingBottom: "calc(var(--safe-area-inset-bottom, 0px) + 16px)" }}
      >
        <div className="bg-surface-container-highest/85 backdrop-blur-3xl rounded-3xl p-5 border border-outline-variant/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {/* ETA + Distance row */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
                {t.estimatedTime}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-[40px] font-headline font-bold tracking-tighter text-on-surface leading-none">
                  {Math.max(1, activeRoute.estimated_time_min - Math.floor(elapsedSec / 60))}
                </span>
                <span className="text-sm font-label font-bold text-on-surface-variant uppercase tracking-widest">
                  {lang === 'ar' ? 'دقيقة' : 'MIN'}
                </span>
              </div>
            </div>

            <div className="text-end">
              <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
                {t.distance}
              </span>
              <span className="text-2xl font-headline font-bold text-on-surface">
                {activeRoute.distance_km} <span className="text-sm text-on-surface-variant">KM</span>
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
                {lang === 'ar' ? 'التقدم' : 'PROGRESS'}
              </span>
              <span className="text-[9px] font-label font-bold text-secondary uppercase tracking-widest">
                {navigationState.passedCount}/{navigationState.totalCount} {t.nodes}
              </span>
            </div>
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-secondary to-tertiary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${navigationState.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onReRoute}
              className="flex-1 border-2 border-outline-variant/50 hover:bg-surface-container font-label font-bold text-[11px] uppercase tracking-widest text-on-surface py-3.5 rounded-xl transition-all active:scale-95"
            >
              {lang === 'ar' ? 'إعادة توجيه' : 'RE-ROUTE'}
            </button>
            <button
              onClick={onEndNavigation}
              className="flex-1 bg-secondary text-secondary-container hover:bg-secondary-fixed font-label font-bold text-[11px] uppercase tracking-widest py-3.5 rounded-xl flex justify-center transition-all active:scale-95 shadow-[0_0_15px_rgba(254,179,0,0.2)]"
            >
              {lang === 'ar' ? 'إنهاء' : 'END'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
