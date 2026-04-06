import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Checkpoint, CheckpointUpdate } from "@/lib/api/types";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useLang, getStatusLabel } from "@/lib/i18n";

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

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-outline-variant/20 bg-surface-container-lowest/80 overflow-hidden"
          >
            <div className="p-4 pt-5">
              <h4 className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">history</span>
                {t.liveFeed || "Live History"}
              </h4>
              
              {updates.length > 0 ? (
                <div className="relative ms-2">
                  <div className="absolute top-1 bottom-1 start-0 w-[1px] bg-outline-variant/20 -translate-x-1" />
                  <div className="space-y-4">
                    {updates.slice(0, 4).map((u, i) => (
                      <div key={i} className="relative flex gap-3 ms-3">
                        <div className="absolute start-[-18px] top-1.5 w-2 h-2 rounded-full border-[2px] border-surface-container bg-secondary z-10" />
                        <div>
                          <p className="text-sm text-on-surface font-body leading-relaxed mb-0.5" dir="auto">{u.raw_message || u.raw_line}</p>
                          <div className="flex items-center gap-1.5 text-[9px] font-label font-bold text-on-surface-variant tracking-wider uppercase">
                            <span className="material-symbols-outlined text-[11px]">schedule</span>
                            {format(new Date(u.timestamp), 'h:mm a', { locale: lang === 'ar' ? ar : enUS })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 bg-surface-container/30 rounded-xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-outline text-[24px] mb-2">hourglass_empty</span>
                  <p className="text-[11px] font-label font-bold tracking-widest text-on-surface-variant uppercase">{t.noData}</p>
                </div>
              )}

              <div className="mt-5 flex gap-2">
                <button 
                  className="flex-1 py-3 text-[11px] font-bold font-label tracking-widest uppercase bg-surface-container hover:bg-surface-container-high transition-colors rounded-xl flex justify-center border border-outline-variant/20"
                  onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                >
                  {t.details}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
