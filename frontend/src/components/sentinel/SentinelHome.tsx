import { useMemo, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Alert, Checkpoint, CheckpointUpdate } from "@/lib/api/types";
import { SentinelCheckpointCard } from "./SentinelCheckpointCard";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLang, getStatusLabel } from "@/lib/i18n";
import { useActiveSirens } from "@/hooks/useAlerts";
import { motion, AnimatePresence } from "framer-motion";

interface SentinelHomeProps {
  alerts: Alert[];
  checkpoints: Checkpoint[];
  checkpointUpdates: CheckpointUpdate[];
  onNavigateMap: () => void;
  onExploreCheckpoints: () => void;
  onViewAlerts: () => void;
}

export function SentinelHome({
  alerts,
  checkpoints,
  checkpointUpdates,
  onNavigateMap,
  onExploreCheckpoints,
  onViewAlerts
}: SentinelHomeProps) {
  const { t, lang } = useLang();
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);
  const [dismissedAlerts, setDismissedAlerts] = useState<number[]>([]);

  const { data: activeSirensData } = useActiveSirens();

  const criticalAlerts = useMemo(() => {
    if (!activeSirensData?.active) return [];
    return activeSirensData.sirens
      .filter((a: any) => !dismissedAlerts.includes(a.id))
      .slice(0, 3);
  }, [activeSirensData, dismissedAlerts]);

  // Auto-cycle critical alerts every 5 seconds
  useEffect(() => {
    if (criticalAlerts.length <= 1) return;
    const id = setInterval(() => {
      setActiveAlertIndex(prev => (prev + 1) % criticalAlerts.length);
    }, 5000);
    return () => clearInterval(id);
  }, [criticalAlerts.length]);

  // Reset index if it goes out of bounds
  useEffect(() => {
    if (activeAlertIndex >= criticalAlerts.length) {
      setActiveAlertIndex(0);
    }
  }, [activeAlertIndex, criticalAlerts.length]);

  const kpis = useMemo(() => {
    return {
      open: checkpoints.filter(c => c.status === "open").length,
      closed: checkpoints.filter(c => c.status === "closed").length,
      military: checkpoints.filter(c => c.status === "military").length,
      congested: checkpoints.filter(c => c.status === "congested" || c.status === "slow").length,
      total: checkpoints.length,
    };
  }, [checkpoints]);

  const recentlyUpdatedCps = useMemo(() => {
    const updatesMap = new Map<string, CheckpointUpdate[]>();
    for (const u of checkpointUpdates) {
      if (!updatesMap.has(u.canonical_key)) updatesMap.set(u.canonical_key, []);
      updatesMap.get(u.canonical_key)!.push(u);
    }

    return [...checkpoints]
      .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
      .slice(0, 8)
      .map(cp => ({
        cp,
        updates: updatesMap.get(cp.canonical_key) || []
      }));
  }, [checkpoints, checkpointUpdates]);

  const currentCriticalAlert = criticalAlerts[activeAlertIndex];

  const handleDismissAlert = useCallback(() => {
    if (currentCriticalAlert) {
      setDismissedAlerts(prev => [...prev, currentCriticalAlert.id]);
    }
  }, [currentCriticalAlert]);

  // Quick stats for the hero section
  const alertsToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return alerts.filter(a => new Date(a.timestamp) >= today).length;
  }, [alerts]);

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* --- Section 1: Critical Alerts --- */}
      <AnimatePresence mode="wait">
        {criticalAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="px-4 pt-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
              <h2 className="text-[11px] font-label font-bold text-error uppercase tracking-widest">
                {t.criticalAlerts} ({criticalAlerts.length})
              </h2>
            </div>

            <div className="relative bg-error-container/20 border border-error/30 rounded-2xl p-5 overflow-hidden shadow-[0_4px_20px_rgba(255,82,82,0.15)]">
              <span className="material-symbols-outlined filled absolute end-[-1rem] bottom-[-1rem] text-[120px] text-error/5 rotate-[15deg] pointer-events-none transform scale-x-[-1]">
                warning
              </span>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCriticalAlert?.id || 'empty'}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="relative z-10"
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-error/15 text-error px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest border border-error/20 inline-block font-label">
                        {t.critical}
                      </div>
                      <span className="text-[10px] text-error font-body whitespace-nowrap" dir="auto">
                        {currentCriticalAlert && formatDistanceToNow(new Date(currentCriticalAlert.timestamp), { addSuffix: true, locale: lang === 'ar' ? ar : enUS })}
                      </span>
                    </div>
                    <button
                      onClick={handleDismissAlert}
                      className="w-6 h-6 rounded-full bg-error/10 flex items-center justify-center text-error hover:bg-error/20 transition-colors active:scale-90"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>

                  <h3 className="font-headline font-bold text-xl text-on-surface mt-2 mb-1 leading-tight hover:text-error transition-colors cursor-pointer" onClick={onViewAlerts} dir="auto">
                    {lang === 'ar' ? (currentCriticalAlert?.title_ar || currentCriticalAlert?.title || t.alerts) : (currentCriticalAlert?.title || currentCriticalAlert?.title_ar || t.alerts)}
                  </h3>

                  <p className="font-body text-sm text-on-surface-variant line-clamp-2 leading-relaxed" dir="auto">
                    {currentCriticalAlert?.body || currentCriticalAlert?.raw_text}
                  </p>

                  <button
                    onClick={onViewAlerts}
                    className="mt-4 flex items-center gap-1.5 text-[11px] font-label font-bold text-error hover:text-error-dim uppercase tracking-wider bg-error/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                  >
                    {t.details}
                    <span className={cn("material-symbols-outlined text-[14px]", lang === 'ar' ? 'rotate-180' : '')}>arrow_forward</span>
                  </button>
                </motion.div>
              </AnimatePresence>

              {criticalAlerts.length > 1 && (
                <div className="absolute bottom-4 end-4 flex gap-1.5 z-10">
                  {criticalAlerts.map((_: any, i: number) => (
                    <div
                      key={i}
                      onClick={() => setActiveAlertIndex(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all cursor-pointer",
                        i === activeAlertIndex ? "w-5 bg-error" : "w-1.5 bg-error/30"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Section 2: Quick Stats Dashboard --- */}
      <div className={cn("px-4 mb-6", criticalAlerts.length === 0 ? "pt-5" : "")}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
            {t.statusSummary}
          </h2>
          <button
            onClick={onExploreCheckpoints}
            className="text-[10px] bg-secondary/10 px-2 py-1 rounded text-secondary font-label font-bold uppercase tracking-wider flex items-center gap-1 border border-secondary/20 hover:bg-secondary/20 transition-colors active:scale-95"
          >
            {t.all} <span className={cn("material-symbols-outlined text-[12px]", lang === 'ar' ? 'rotate-180' : '')}>arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "open", count: kpis.open, dot: "bg-tertiary shadow-[0_0_8px_rgba(34,197,94,0.4)]", text: "text-on-surface-variant", label: t.open, delay: 0 },
            { key: "military", count: kpis.military, dot: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]", text: "text-purple-400", label: t.military, delay: 0.05 },
            { key: "closed", count: kpis.closed, dot: "bg-error shadow-[0_0_8px_rgba(239,68,68,0.4)]", text: "text-error", label: t.closed, delay: 0.1 },
            { key: "congested", count: kpis.congested, dot: "bg-secondary shadow-[0_0_8px_rgba(249,115,22,0.4)]", text: "text-secondary", label: t.congested, delay: 0.15 },
          ].map(item => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: item.delay, duration: 0.3 }}
              className="bg-surface-container-low rounded-lg p-3 flex items-center justify-between hover:bg-surface-container transition-colors shadow-sm cursor-pointer border border-outline-variant/10 active:scale-95"
              onClick={onExploreCheckpoints}
            >
              <div className="flex items-center gap-2.5">
                <div className={cn("w-2 h-2 rounded-full", item.dot)} />
                <span className={cn("text-[10px] font-label font-bold uppercase tracking-widest", item.text)}>{item.label}</span>
              </div>
              <span className="font-headline font-bold text-xl text-on-surface leading-none tabular-nums">{item.count}</span>
            </motion.div>
          ))}
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onNavigateMap}
            className="flex-1 bg-secondary border border-secondary text-secondary-container hover:bg-secondary-fixed transition-colors font-headline font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 shadow-[0_4px_20px_rgba(254,179,0,0.25)]"
          >
            <span className="material-symbols-outlined text-[20px]">explore</span>
            {t.liveMap}
          </button>
          <button
            onClick={onViewAlerts}
            className="bg-surface-container-low border border-outline-variant/20 text-on-surface hover:bg-surface-container transition-colors font-headline font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">feed</span>
            {alertsToday > 0 && (
              <span className="text-[10px] font-label font-bold text-error bg-error/10 px-1.5 py-0.5 rounded-full">{alertsToday}</span>
            )}
          </button>
        </div>
      </div>

      {/* --- Section 3: Active Checkpoints Feed --- */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined filled text-primary text-[18px]">bolt</span>
            <h2 className="text-[11px] font-label font-bold text-on-surface uppercase tracking-widest">
              {t.checkpointUpdate}
            </h2>
          </div>
          <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
            {recentlyUpdatedCps.length} {lang === 'ar' ? 'حاجز' : 'active'}
          </span>
        </div>

        <div className="space-y-3">
          {recentlyUpdatedCps.map(({ cp, updates }, i) => (
            <motion.div
              key={cp.canonical_key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <SentinelCheckpointCard
                checkpoint={cp}
                updates={updates}
                onClick={onNavigateMap}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
