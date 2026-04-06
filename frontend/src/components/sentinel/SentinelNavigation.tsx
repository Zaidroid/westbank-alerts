import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { MapView } from "@/components/MapView";
import type { Alert, Checkpoint, CheckpointUpdate, ConnectionStatus } from "@/lib/api/types";
import type { Route } from "@/lib/routes";
import { useLang } from "@/lib/i18n";
import { calculateDistance } from "@/hooks/useGeolocation";
import { motion, AnimatePresence } from "framer-motion";

interface SentinelNavigationProps {
  activeRoute: Route;
  checkpoints: Checkpoint[];
  alerts: Alert[];
  checkpointUpdates: CheckpointUpdate[];
  userLocation: { latitude: number; longitude: number } | null;
  onEndNavigation: () => void;
  onReRoute: () => void;
  connectionStatus: ConnectionStatus;
}

// Static Tailwind class maps — must be concrete strings for tree-shaking
const STATUS_DOT: Record<string, string> = {
  open: "bg-tertiary",
  closed: "bg-error",
  military: "bg-purple-500",
  congested: "bg-secondary",
  slow: "bg-secondary",
  unknown: "bg-outline",
};
const STATUS_TEXT: Record<string, string> = {
  open: "text-tertiary",
  closed: "text-error",
  military: "text-purple-400",
  congested: "text-secondary",
  slow: "text-secondary",
  unknown: "text-on-surface-variant",
};
const STATUS_BORDER: Record<string, string> = {
  open: "border-tertiary/30",
  closed: "border-error/40",
  military: "border-error/40",
  congested: "border-secondary/40",
  slow: "border-secondary/40",
  unknown: "border-outline-variant/30",
};
const STATUS_ICON: Record<string, string> = {
  open: "check_circle",
  closed: "block",
  military: "block",
  congested: "warning",
  slow: "warning",
  unknown: "help",
};
const STATUS_LABEL_AR: Record<string, string> = {
  open: "مفتوح",
  closed: "مغلق",
  military: "نقطة عسكرية",
  congested: "مزدحم",
  slow: "بطيء",
  unknown: "غير معروف",
};
const STATUS_LABEL_EN: Record<string, string> = {
  open: "OPEN",
  closed: "CLOSED",
  military: "MILITARY",
  congested: "CONGESTED",
  slow: "SLOW",
  unknown: "UNKNOWN",
};

// Vibrate pattern for different alert levels
function vibrateAlert(level: "danger" | "warning" | "approaching") {
  if (!navigator.vibrate) return;
  switch (level) {
    case "danger":
      navigator.vibrate([300, 100, 300, 100, 300]);
      break;
    case "warning":
      navigator.vibrate([200, 100, 200]);
      break;
    case "approaching":
      navigator.vibrate([100]);
      break;
  }
}

export function SentinelNavigation({
  activeRoute,
  checkpoints,
  alerts,
  checkpointUpdates,
  userLocation,
  onEndNavigation,
  onReRoute,
  connectionStatus,
}: SentinelNavigationProps) {
  const { t, lang } = useLang();

  const [showTacticalAlert, setShowTacticalAlert] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [statusChangeAlert, setStatusChangeAlert] = useState<{ key: string; name: string; oldStatus: string; newStatus: string } | null>(null);

  // Track previous checkpoint statuses to detect changes
  const prevStatusRef = useRef<Map<string, string>>(new Map());

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedFormatted = useMemo(() => {
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [elapsedSec]);

  // Quick checkpoint status lookup
  const cpStatusMap = useMemo(() => {
    const map = new Map<string, Checkpoint>();
    for (const c of checkpoints) map.set(c.canonical_key, c);
    return map;
  }, [checkpoints]);

  // Route checkpoint keys for quick membership check
  const routeKeys = useMemo(
    () => new Set(activeRoute.checkpoints.map(c => c.canonical_key)),
    [activeRoute]
  );

  // Detect checkpoint status changes on YOUR route and alert the user
  useEffect(() => {
    const prev = prevStatusRef.current;
    let changed = false;

    for (const rcp of activeRoute.checkpoints) {
      const cp = cpStatusMap.get(rcp.canonical_key);
      if (!cp) continue;
      const oldStatus = prev.get(rcp.canonical_key);
      if (oldStatus && oldStatus !== cp.status) {
        changed = true;
        const name = lang === 'ar' ? (rcp.name_ar || rcp.name_en || '') : (rcp.name_en || rcp.name_ar);
        setStatusChangeAlert({ key: rcp.canonical_key, name, oldStatus, newStatus: cp.status });

        // Vibrate based on severity of change
        if (cp.status === "closed" || cp.status === "military") {
          vibrateAlert("danger");
        } else if (cp.status === "congested" || cp.status === "slow") {
          vibrateAlert("warning");
        }
      }
      prev.set(rcp.canonical_key, cp.status);
    }

    // Auto-dismiss status change alert after 8 seconds
    if (changed) {
      const id = setTimeout(() => setStatusChangeAlert(null), 8000);
      return () => clearTimeout(id);
    }
  }, [cpStatusMap, activeRoute, lang]);

  // Initialize prev status on mount
  useEffect(() => {
    const prev = prevStatusRef.current;
    for (const rcp of activeRoute.checkpoints) {
      const cp = cpStatusMap.get(rcp.canonical_key);
      if (cp) prev.set(rcp.canonical_key, cp.status);
    }
  }, []); // only once on mount

  // Navigation progress
  const navigationState = useMemo(() => {
    const routeCps = activeRoute.checkpoints;
    const total = routeCps.length;

    if (!userLocation || total === 0) {
      const first = routeCps[0];
      return {
        nextCheckpoint: first,
        nextCheckpointDetails: first ? cpStatusMap.get(first.canonical_key) : undefined,
        distanceToNext: null,
        passedCount: 0,
        totalCount: total,
        progressPercent: 0,
        isApproaching: false,
      };
    }

    const distances = routeCps.map((cp, idx) => ({
      idx,
      cp,
      dist: calculateDistance(userLocation.latitude, userLocation.longitude, cp.latitude, cp.longitude),
    }));

    let closestIdx = 0;
    let minDist = Infinity;
    for (const d of distances) {
      if (d.dist < minDist) {
        minDist = d.dist;
        closestIdx = d.idx;
      }
    }

    let passedCount: number;
    let nextIdx: number;

    if (closestIdx < total - 1) {
      const distToNext = distances[closestIdx + 1].dist;
      const segmentLength = calculateDistance(
        routeCps[closestIdx].latitude, routeCps[closestIdx].longitude,
        routeCps[closestIdx + 1].latitude, routeCps[closestIdx + 1].longitude
      );
      if (minDist > segmentLength * 0.4 && distToNext < minDist) {
        passedCount = closestIdx + 1;
        nextIdx = closestIdx + 1;
      } else {
        passedCount = closestIdx;
        nextIdx = closestIdx;
      }
    } else {
      passedCount = minDist < 0.3 ? total : total - 1;
      nextIdx = total - 1;
    }

    const nextCp = routeCps[nextIdx];
    const distToNext = distances[nextIdx].dist;
    const isApproaching = distToNext < 1.5; // within 1.5km

    return {
      nextCheckpoint: nextCp,
      nextCheckpointDetails: nextCp ? cpStatusMap.get(nextCp.canonical_key) : undefined,
      distanceToNext: distToNext,
      passedCount,
      totalCount: total,
      progressPercent: Math.round((passedCount / total) * 100),
      isApproaching,
    };
  }, [userLocation, activeRoute, cpStatusMap]);

  // Vibrate when approaching a problematic checkpoint
  const approachAlerted = useRef<string | null>(null);
  useEffect(() => {
    if (!navigationState.isApproaching || !navigationState.nextCheckpoint) return;
    const key = navigationState.nextCheckpoint.canonical_key;
    if (approachAlerted.current === key) return;

    const status = navigationState.nextCheckpointDetails?.status;
    if (status === "closed" || status === "military") {
      vibrateAlert("danger");
      approachAlerted.current = key;
    } else if (status === "congested" || status === "slow") {
      vibrateAlert("approaching");
      approachAlerted.current = key;
    }
  }, [navigationState.isApproaching, navigationState.nextCheckpoint, navigationState.nextCheckpointDetails]);

  const distDisplay = navigationState.distanceToNext != null
    ? navigationState.distanceToNext < 1
      ? `${Math.round(navigationState.distanceToNext * 1000)}m`
      : `${navigationState.distanceToNext.toFixed(1)}km`
    : '--';

  const nextStatus = navigationState.nextCheckpointDetails?.status || 'unknown';
  const isDanger = nextStatus === 'closed' || nextStatus === 'military';

  const handleEnd = useCallback(() => {
    if (showEndConfirm) {
      onEndNavigation();
    } else {
      setShowEndConfirm(true);
      setTimeout(() => setShowEndConfirm(false), 3000);
    }
  }, [showEndConfirm, onEndNavigation]);

  useEffect(() => {
    setShowTacticalAlert(true);
  }, [navigationState.nextCheckpoint?.canonical_key]);

  const remainingMin = Math.max(1, activeRoute.estimated_time_min - Math.floor(elapsedSec / 60));

  // Count route issues for the overview
  const routeIssues = useMemo(() => {
    let closed = 0, congested = 0;
    for (const rcp of activeRoute.checkpoints) {
      const cp = cpStatusMap.get(rcp.canonical_key);
      if (!cp) continue;
      if (cp.status === "closed" || cp.status === "military") closed++;
      else if (cp.status === "congested" || cp.status === "slow") congested++;
    }
    return { closed, congested };
  }, [activeRoute, cpStatusMap]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60 pointer-events-none z-10" />
      </div>

      {/* Connection warning */}
      <AnimatePresence>
        {connectionStatus !== "connected" && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className="absolute top-0 inset-x-0 z-30 flex items-center justify-center gap-2 py-1 bg-error/90 backdrop-blur-md"
            style={{ paddingTop: "var(--safe-area-inset-top, 0px)" }}
          >
            <span className="material-symbols-outlined text-[12px] text-white">wifi_off</span>
            <span className="text-[9px] font-label font-bold text-white uppercase tracking-widest">
              {lang === 'ar' ? 'غير متصل — قد لا تكون البيانات محدثة' : 'OFFLINE — STATUS MAY NOT BE CURRENT'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
        className="relative z-20 w-full flex items-center justify-between px-4 pb-3"
        style={{ paddingTop: "calc(var(--safe-area-inset-top, 0px) + 12px)" }}
      >
        <button
          onClick={handleEnd}
          className={cn(
            "w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-all active:scale-90 shadow-lg",
            showEndConfirm
              ? "bg-error/20 border-error/40 text-error"
              : "bg-surface-container/80 border-outline-variant/40 hover:bg-surface-container-high text-on-surface"
          )}
        >
          <span className="material-symbols-outlined text-[20px]">
            {showEndConfirm ? "check" : "close"}
          </span>
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-pulse" />
            <span className="text-[10px] font-label font-bold text-tertiary tracking-widest uppercase drop-shadow">
              {lang === 'ar' ? 'ملاحة مباشرة' : 'NAVIGATING'}
            </span>
          </div>
          <span className="text-sm font-headline font-bold text-on-surface tracking-wide drop-shadow-md" dir="auto">
            {lang === 'ar' ? (activeRoute.name_ar || activeRoute.name_en) : (activeRoute.name_en || activeRoute.name_ar)}
          </span>
        </div>

        <div className="bg-surface-container/80 backdrop-blur-md px-3 py-2 rounded-full border border-outline-variant/40 shadow-lg">
          <span className="text-sm font-headline font-bold text-on-surface tabular-nums">{elapsedFormatted}</span>
        </div>
      </motion.div>

      {/* Route issues summary — compact pill when there are problems */}
      {(routeIssues.closed > 0 || routeIssues.congested > 0) && (
        <div className="relative z-20 flex justify-center">
          <div className="flex items-center gap-2 bg-surface-container/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/30 shadow-md">
            {routeIssues.closed > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-error" />
                <span className="text-[10px] font-label font-bold text-error tabular-nums">{routeIssues.closed} {lang === 'ar' ? 'مغلق' : 'blocked'}</span>
              </div>
            )}
            {routeIssues.closed > 0 && routeIssues.congested > 0 && (
              <div className="w-px h-3 bg-outline-variant/30" />
            )}
            {routeIssues.congested > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                <span className="text-[10px] font-label font-bold text-secondary tabular-nums">{routeIssues.congested} {lang === 'ar' ? 'مزدحم' : 'slow'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next checkpoint card */}
      <AnimatePresence mode="wait">
        {navigationState.nextCheckpoint && (
          <motion.div
            key={navigationState.nextCheckpoint.canonical_key}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative z-20 mx-4 mt-2"
          >
            <div className={cn(
              "bg-surface-container-highest/80 backdrop-blur-xl rounded-2xl p-4 border shadow-xl flex items-center gap-4",
              STATUS_BORDER[nextStatus] || STATUS_BORDER.unknown
            )}>
              <div className="flex flex-col items-center min-w-[60px] shrink-0">
                <span className={cn("text-2xl font-headline font-bold tracking-tight tabular-nums", STATUS_TEXT[nextStatus] || STATUS_TEXT.unknown)}>
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
                  <span className={cn("w-2 h-2 rounded-full", STATUS_DOT[nextStatus] || STATUS_DOT.unknown)} />
                  <span className={cn("text-[10px] font-label font-bold uppercase tracking-widest", STATUS_TEXT[nextStatus] || STATUS_TEXT.unknown)}>
                    {lang === 'ar' ? STATUS_LABEL_AR[nextStatus] : STATUS_LABEL_EN[nextStatus]}
                  </span>
                </div>
              </div>

              <span className={cn(
                "material-symbols-outlined text-[24px] shrink-0",
                STATUS_TEXT[nextStatus] || STATUS_TEXT.unknown,
                isDanger && "animate-pulse"
              )}>
                {STATUS_ICON[nextStatus] || STATUS_ICON.unknown}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live status change alert — appears when a checkpoint on your route changes status */}
      <AnimatePresence>
        {statusChangeAlert && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            className="relative z-30 mx-4 mt-2 pointer-events-auto"
          >
            <div className={cn(
              "rounded-2xl p-3.5 backdrop-blur-xl shadow-2xl border flex items-center gap-3",
              statusChangeAlert.newStatus === "closed" || statusChangeAlert.newStatus === "military"
                ? "bg-error-container/20 border-error/40"
                : statusChangeAlert.newStatus === "open"
                  ? "bg-tertiary/10 border-tertiary/30"
                  : "bg-secondary/10 border-secondary/30"
            )}>
              <span className={cn("material-symbols-outlined text-[22px]",
                statusChangeAlert.newStatus === "closed" || statusChangeAlert.newStatus === "military" ? "text-error" :
                statusChangeAlert.newStatus === "open" ? "text-tertiary" : "text-secondary"
              )}>
                {statusChangeAlert.newStatus === "open" ? "check_circle" : statusChangeAlert.newStatus === "closed" || statusChangeAlert.newStatus === "military" ? "error" : "warning"}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant block">
                  {lang === 'ar' ? 'تحديث مباشر' : 'LIVE UPDATE'}
                </span>
                <span className="text-sm font-headline font-bold text-on-surface" dir="auto">
                  {statusChangeAlert.name}: {lang === 'ar'
                    ? STATUS_LABEL_AR[statusChangeAlert.newStatus]
                    : STATUS_LABEL_EN[statusChangeAlert.newStatus]}
                </span>
              </div>
              <button
                onClick={() => setStatusChangeAlert(null)}
                className="w-7 h-7 rounded-full bg-surface-container/50 flex items-center justify-center text-on-surface-variant active:scale-90"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactical danger alert */}
      <AnimatePresence>
        {showTacticalAlert && isDanger && !statusChangeAlert && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="relative z-30 mx-4 mt-3 pointer-events-auto"
          >
            <div className="bg-error-container/20 border border-error/40 rounded-2xl p-4 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute start-0 top-0 bottom-0 w-1 bg-error" />
              <div className="flex items-start gap-2 mb-2">
                <span className="material-symbols-outlined text-error text-[18px] animate-pulse">warning</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-label font-bold text-error uppercase tracking-widest block mb-0.5">
                    {lang === 'ar' ? 'تحذير' : 'WARNING'}
                  </span>
                  <span className="text-sm font-headline font-bold text-on-surface" dir="auto">
                    {lang === 'ar'
                      ? `${navigationState.nextCheckpoint?.name_ar || 'الحاجز التالي'} ${nextStatus === 'military' ? 'نقطة عسكرية' : 'مغلق'}`
                      : `${navigationState.nextCheckpoint?.name_en || 'Next checkpoint'} is ${nextStatus}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTacticalAlert(false)}
                  className="flex-1 py-2 bg-surface-container text-[10px] font-bold font-label uppercase text-on-surface-variant rounded-lg hover:text-on-surface transition-colors active:scale-95"
                >
                  {lang === 'ar' ? 'تجاهل' : 'DISMISS'}
                </button>
                <button
                  onClick={onReRoute}
                  className="flex-1 py-2 bg-error/20 text-[10px] font-bold font-label uppercase text-error rounded-lg hover:bg-error/30 transition-colors active:scale-95 flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">alt_route</span>
                  {lang === 'ar' ? 'مسار بديل' : 'FIND ALTERNATE'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 pointer-events-none" />

      {/* Bottom HUD */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, type: "spring", damping: 20 }}
        className="relative z-20 w-full p-4 pointer-events-auto"
        style={{ paddingBottom: "calc(var(--safe-area-inset-bottom, 0px) + 16px)" }}
      >
        <div className="bg-surface-container-highest/85 backdrop-blur-3xl rounded-3xl p-5 border border-outline-variant/30 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {/* ETA + Distance */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest block mb-1">
                {t.estimatedTime}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-[40px] font-headline font-bold tracking-tighter text-on-surface leading-none tabular-nums">
                  {remainingMin}
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
              <span className="text-2xl font-headline font-bold text-on-surface tabular-nums">
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
              <span className="text-[9px] font-label font-bold text-secondary uppercase tracking-widest tabular-nums">
                {navigationState.passedCount}/{navigationState.totalCount} {t.nodes}
              </span>
            </div>
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-secondary to-tertiary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${navigationState.progressPercent}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Checkpoint dots */}
          <div className="flex items-center gap-1 mb-4 px-1">
            {activeRoute.checkpoints.map((cp, i) => {
              const cpDetails = cpStatusMap.get(cp.canonical_key);
              const status = cpDetails?.status || 'unknown';
              const isPassed = i < navigationState.passedCount;
              const isCurrent = i === navigationState.passedCount && i < navigationState.totalCount;
              return (
                <div key={cp.canonical_key} className="flex-1 flex items-center">
                  <div className={cn(
                    "rounded-full transition-all duration-500",
                    isCurrent ? "w-3 h-3" : "w-2 h-2",
                    isPassed ? "bg-tertiary/40" : STATUS_DOT[status] || STATUS_DOT.unknown,
                    isCurrent && "ring-2 ring-secondary/50 ring-offset-1 ring-offset-background"
                  )} />
                  {i < activeRoute.checkpoints.length - 1 && (
                    <div className={cn(
                      "flex-1 h-[1px] mx-0.5",
                      isPassed ? "bg-tertiary/30" : "bg-outline-variant/20"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onReRoute}
              className="flex-1 border-2 border-outline-variant/50 hover:bg-surface-container font-label font-bold text-[11px] uppercase tracking-widest text-on-surface py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">alt_route</span>
              {lang === 'ar' ? 'مسار بديل' : 'RE-ROUTE'}
            </button>
            <button
              onClick={handleEnd}
              className={cn(
                "flex-1 font-label font-bold text-[11px] uppercase tracking-widest py-3.5 rounded-xl flex justify-center items-center gap-1.5 transition-all active:scale-95",
                showEndConfirm
                  ? "bg-error text-on-error shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  : "bg-secondary text-secondary-container hover:bg-secondary-fixed shadow-[0_0_15px_rgba(254,179,0,0.2)]"
              )}
            >
              <span className="material-symbols-outlined text-[16px]">
                {showEndConfirm ? "check" : "stop_circle"}
              </span>
              {showEndConfirm
                ? (lang === 'ar' ? 'تأكيد' : 'CONFIRM')
                : (lang === 'ar' ? 'إنهاء' : 'END')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
