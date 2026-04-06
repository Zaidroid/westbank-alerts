import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Alert, Checkpoint, CheckpointUpdate } from "@/lib/api/types";
import { SentinelCheckpointCard } from "./SentinelCheckpointCard";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLang, getStatusLabel } from "@/lib/i18n";
import { useActiveSirens } from "@/hooks/useAlerts";

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

  // Fetch only TRULY ACTIVE incoming missile/siren alerts directly from the server
  // We use this dedicated feed for the banner because standard alerts can include news/recaps
  const { data: activeSirensData } = useActiveSirens();
  
  const criticalAlerts = useMemo(() => {
    if (!activeSirensData?.active) return [];
    
    // Filter out dismissed alerts and return top 3
    return activeSirensData.sirens
      .filter(a => !dismissedAlerts.includes(a.id))
      .slice(0, 3);
  }, [activeSirensData, dismissedAlerts]);

  const kpis = useMemo(() => {
    return {
      open: checkpoints.filter(c => c.status === "open").length,
      closed: checkpoints.filter(c => c.status === "closed").length,
      military: checkpoints.filter(c => c.status === "military").length,
      congested: checkpoints.filter(c => c.status === "congested" || c.status === "slow").length,
    };
  }, [checkpoints]);

  const recentlyUpdatedCps = useMemo(() => {
    const cpMap = new Map(checkpoints.map(c => [c.canonical_key, c]));
    
    // Find the most recent updates
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

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* --- Section 1: Critical Alerts --- */}
      {criticalAlerts.length > 0 && (
        <div className="px-4 pt-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-error animate-fade-in glow-error" style={{ animation: "alert-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
            <h2 className="text-[11px] font-label font-bold text-error uppercase tracking-widest">
              {t.criticalAlerts} ({criticalAlerts.length})
            </h2>
          </div>
          
          <div className="relative bg-error-container/20 border border-error/30 rounded-2xl p-5 overflow-hidden shadow-[0_4px_20px_rgba(255,82,82,0.15)]">
            <span className="material-symbols-outlined filled absolute end-[-1rem] bottom-[-1rem] text-[120px] text-error/5 rotate-[15deg] pointer-events-none transform scale-x-[-1]">
              warning
            </span>
            
            <div className="relative z-10">
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
                  onClick={() => currentCriticalAlert && setDismissedAlerts(prev => [...prev, currentCriticalAlert.id])}
                  className="w-6 h-6 rounded-full bg-error/10 flex items-center justify-center text-error hover:bg-error/20 transition-colors"
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
            </div>
            
            {criticalAlerts.length > 1 && (
              <div className="absolute bottom-4 end-4 flex gap-1.5">
                {criticalAlerts.map((_, i) => (
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
        </div>
      )}

      {/* --- Section 2: General Status Dashboard --- */}
      <div className={cn("px-4 mb-8", criticalAlerts.length === 0 ? "pt-6" : "")}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-label font-bold text-on-surface-variant uppercase tracking-widest flex flex-col">
            {t.statusSummary}
          </h2>
          <button 
            onClick={onExploreCheckpoints}
            className="text-[10px] bg-secondary/10 px-2 py-1 rounded text-secondary font-label font-bold uppercase tracking-wider flex items-center gap-1 border border-secondary/20 hover:bg-secondary/20 transition-colors"
          >
            {t.all} <span className={cn("material-symbols-outlined text-[12px]", lang === 'ar' ? 'rotate-180' : '')}>arrow_forward</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center hover:bg-surface-container transition-colors shadow-sm cursor-pointer" onClick={onExploreCheckpoints}>
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary mb-2 glow-tertiary" />
            <span className="font-headline font-bold text-3xl text-on-surface leading-none mb-1">
              {kpis.open}
            </span>
            <span className="text-[9px] font-label font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30 mt-1 text-center">
              {t.open}
            </span>
          </div>
          
          <div className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center hover:bg-surface-container transition-colors shadow-sm cursor-pointer" onClick={onExploreCheckpoints}>
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mb-2 glow-purple" />
            <span className="font-headline font-bold text-3xl text-on-surface leading-none mb-1">
              {kpis.military}
            </span>
            <span className="text-[9px] font-label font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 mt-1 text-center">
              {t.military}
            </span>
          </div>

          <div className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center hover:bg-surface-container transition-colors shadow-sm cursor-pointer" onClick={onExploreCheckpoints}>
            <div className="w-2.5 h-2.5 rounded-full bg-error mb-2 glow-error" />
            <span className="font-headline font-bold text-3xl text-on-surface leading-none mb-1">
              {kpis.closed}
            </span>
            <span className="text-[9px] font-label font-bold text-error uppercase tracking-widest bg-error/10 px-2 py-0.5 rounded border border-error/20 mt-1 text-center">
              {t.closed}
            </span>
          </div>

          <div className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center hover:bg-surface-container transition-colors shadow-sm cursor-pointer" onClick={onExploreCheckpoints}>
            <div className="w-2.5 h-2.5 rounded-full bg-secondary mb-2 glow-secondary" />
            <span className="font-headline font-bold text-3xl text-on-surface leading-none mb-1">
              {kpis.congested}
            </span>
            <span className="text-[9px] font-label font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20 mt-1 text-center">
              {t.congested}
            </span>
          </div>
        </div>
        
        <button 
          onClick={onNavigateMap}
          className="mt-5 w-full bg-secondary border border-secondary text-secondary-container hover:bg-secondary-fixed transition-colors font-headline font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 shadow-[0_4px_20px_rgba(254,179,0,0.25)]"
        >
          <span className="material-symbols-outlined text-[20px]">explore</span>
          {t.liveMap}
        </button>
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
        </div>
        
        <div className="space-y-3">
          {recentlyUpdatedCps.map(({ cp, updates }) => (
            <SentinelCheckpointCard 
              key={cp.canonical_key} 
              checkpoint={cp} 
              updates={updates} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
