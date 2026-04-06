import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Checkpoint, CheckpointUpdate } from "@/lib/api/types";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useLang, getStatusLabel } from "@/lib/i18n";
import { createPortal } from "react-dom";

interface SentinelCheckpointCardProps {
  checkpoint: Checkpoint;
  updates?: CheckpointUpdate[];
  onClick?: () => void;
}

export function SentinelCheckpointCard({ checkpoint, updates = [], onClick }: SentinelCheckpointCardProps) {
  const { t, lang } = useLang();
  const [expanded, setExpanded] = useState(false);
  
  const statusColors: any = {
    open: "bg-tertiary",
    congested: "bg-secondary",
    slow: "bg-secondary",
    closed: "bg-error",
    military: "bg-purple-500", 
  };

  const statusTextColors: any = {
    open: "text-tertiary",
    congested: "text-secondary",
    slow: "text-secondary",
    closed: "text-error",
    military: "text-purple-400",
  };

  const statusBgColors: any = {
    open: "bg-tertiary/10 border-tertiary/20",
    congested: "bg-secondary/10 border-secondary/20",
    slow: "bg-secondary/10 border-secondary/20",
    closed: "bg-error/10 border-error/20",
    military: "bg-purple-500/10 border-purple-500/20",
  };

  const statusName = getStatusLabel(checkpoint.status, t);

  const colorClass = statusColors[checkpoint.status] || "bg-outline";
  const textColorClass = statusTextColors[checkpoint.status] || "text-on-surface";
  const pillClass = statusBgColors[checkpoint.status] || "bg-surface-variant border-outline-variant/30";
  
  const formattedTime = checkpoint.last_updated 
    ? formatDistanceToNow(new Date(checkpoint.last_updated), { addSuffix: true, locale: lang === 'ar' ? ar : enUS }).replace('about ', '')
    : t.justNow;

  let minutesSinceLastUpdate = 0;
  if (checkpoint.last_updated) {
    minutesSinceLastUpdate = Math.floor((Date.now() - new Date(checkpoint.last_updated).getTime()) / 60000);
  }
  
  const bigNumberDisplay = minutesSinceLastUpdate > 999 ? '999+' : minutesSinceLastUpdate.toString();

  return (
    <>
      <div className="relative overflow-hidden rounded-[20px] bg-surface-container-low/70 backdrop-blur-md border border-outline-variant/20 hover:bg-surface-container hover:border-outline-variant/40 transition-all group flex flex-col shadow-sm">
        <div 
          className="flex items-stretch cursor-pointer relative"
          onClick={() => setExpanded(!expanded)}
        >
          <div className={cn("absolute start-0 top-3 bottom-3 w-[4px] rounded-r-full block", colorClass)} />
          
          <div className="flex flex-col items-center justify-center min-w-[70px] shrink-0 bg-surface-container-lowest/30 border-e border-outline-variant/10 py-4 gap-1">
            <span className="text-3xl font-headline font-bold text-on-surface leading-none tracking-tighter">
              {bigNumberDisplay}
            </span>
            <span className="text-[9px] font-label text-on-surface-variant font-bold uppercase tracking-widest text-center">
              {lang === 'ar' ? 'الوقت' : 'MINS AGO'}
            </span>
          </div>

          <div className="flex-1 min-w-0 p-4 pb-3 flex flex-col justify-center">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="text-[17px] font-headline font-bold text-on-surface truncate group-hover:text-primary transition-colors leading-tight" dir="auto">
                {lang === 'ar' ? (checkpoint.name_ar || checkpoint.name_en) : (checkpoint.name_en || checkpoint.name_ar)}
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md border", pillClass)}>
                <div className={cn("w-1.5 h-1.5 rounded-full", colorClass, 
                  checkpoint.status === 'closed' ? 'glow-error' : 
                  checkpoint.status === 'open' ? 'glow-tertiary' : 
                  checkpoint.status === 'congested' ? 'glow-secondary' : ''
                )} />
                <span className={cn("text-[10px] font-bold tracking-widest uppercase", textColorClass)}>
                  {statusName}
                </span>
              </div>
              {checkpoint.region && (
                <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded-md border border-outline-variant/30 font-label text-on-surface-variant uppercase tracking-widest truncate max-w-[100px]">
                  {checkpoint.region}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] font-label text-on-surface-variant mt-0.5">
              <span className="material-symbols-outlined text-[12px]">schedule</span>
              {formattedTime}
            </div>
          </div>

          <div className="flex items-center justify-center px-4 shrink-0 border-s border-outline-variant/10 bg-surface-container-lowest/10">
            <button 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-surface-container-high group-hover:bg-primary group-hover:text-primary-container text-on-surface-variant",
                expanded && "bg-primary text-primary-container"
              )}
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            >
              <span className={cn(
                "material-symbols-outlined text-[20px] transition-transform duration-300",
                expanded ? "rotate-180" : ""
              )}>
                {expanded ? "close" : "expand_more"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="checkpoint-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              className="fixed inset-0 z-[999] bg-background/80 backdrop-blur-sm"
              style={{ touchAction: "none" }}
            />
          )}
          {expanded && (
            <motion.div
              key="checkpoint-modal-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 inset-x-0 z-[1000] bg-surface-dim rounded-t-3xl border-t border-outline-variant/20 shadow-[0_-12px_40px_rgba(0,0,0,0.7)] max-h-[85vh] flex flex-col grain-overlay"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Handle / Header */}
                <div className="flex flex-col items-center pt-3 pb-2 shrink-0 bg-surface-container-low/40 rounded-t-3xl border-b border-outline-variant/10">
                  <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mb-3" />
                  <div className="w-full px-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-headline font-bold text-on-surface leading-tight" dir="auto">
                        {lang === 'ar' ? (checkpoint.name_ar || checkpoint.name_en) : (checkpoint.name_en || checkpoint.name_ar)}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className={cn("w-2 h-2 rounded-full", colorClass, 
                          checkpoint.status === 'closed' ? 'glow-error' : 
                          checkpoint.status === 'open' ? 'glow-tertiary' : 
                          checkpoint.status === 'congested' ? 'glow-secondary' : ''
                        )} />
                        <span className={cn("text-[11px] font-bold tracking-widest uppercase", textColorClass)}>
                          {statusName}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setExpanded(false)}
                      className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors flex items-center justify-center shrink-0 text-on-surface hover:text-primary active:scale-90"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 py-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">history</span>
                      {t.liveFeed || "Timeline History"}
                    </h4>
                    <span className="text-[9px] font-label font-bold text-on-surface-variant/40 bg-white/5 px-2 py-0.5 rounded uppercase tracking-widest">
                      {updates.length} Updates
                    </span>
                  </div>
                  
                  {updates.length > 0 ? (
                    <div className="relative ms-2.5">
                      <div className="absolute top-2 bottom-2 start-0 w-[1px] bg-gradient-to-b from-primary/30 via-outline-variant/20 to-transparent -translate-x-[1px]" />
                      <div className="space-y-5">
                        {updates.slice(0, 10).map((u, i) => (
                          <div key={i} className="relative flex gap-4 ms-5">
                            <div className="absolute start-[-24px] top-1.5 w-2 h-2 rounded-full bg-surface-dim border border-primary/50 z-10 shadow-[0_0_8px_rgba(198,198,199,0.3)]" />
                            <div className="flex-1 bg-surface-container-low/60 border border-outline-variant/10 rounded-2xl p-4 shadow-sm hover:border-outline-variant/30 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5 text-[10px] font-label font-bold text-primary tracking-widest uppercase">
                                  <span className="material-symbols-outlined text-[13px]">schedule</span>
                                  {format(new Date(u.timestamp), 'PPp', { locale: lang === 'ar' ? ar : enUS })}
                                </div>
                              </div>
                              <p className="text-[13px] text-on-surface-variant font-body leading-relaxed" dir="auto">{u.raw_message || u.raw_line}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-surface-container-lowest/20 rounded-3xl border border-dashed border-outline-variant/20">
                      <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-outline-variant text-[32px]">history_toggle_off</span>
                      </div>
                      <p className="text-[10px] font-label font-bold tracking-[0.2em] text-on-surface-variant uppercase">{t.noData}</p>
                    </div>
                  )}

                  <div className="mt-10 mb-6 safe-area-bottom">
                    <button 
                      className="w-full py-4 text-[11px] font-bold font-label tracking-[0.15em] uppercase bg-primary text-on-primary hover:brightness-110 transition-all rounded-2xl flex items-center justify-center shadow-lg active:scale-[0.98]"
                      onClick={(e) => { e.stopPropagation(); onClick?.(); setExpanded(false); }}
                    >
                      <span className="material-symbols-outlined me-2 text-[18px]">explore</span>
                      {t.viewOnMap}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
