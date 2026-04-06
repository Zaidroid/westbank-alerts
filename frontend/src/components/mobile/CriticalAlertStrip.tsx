import { useState } from "react";
import { AlertTriangle, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, formatRelativeTime, getTypeLabel } from "@/lib/i18n";
import type { Alert } from "@/lib/api/types";
import { motion, AnimatePresence } from "framer-motion";

interface CriticalAlertStripProps {
  alerts: Alert[];
  onAlertPress?: (alert: Alert) => void;
}

export function CriticalAlertStrip({ alerts, onAlertPress }: CriticalAlertStripProps) {
  const { t, lang } = useLang();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const critical = alerts.filter(
    a => (a.severity === "critical" || a.severity === "high") && !dismissed.has(a.id)
  ).slice(0, 5);

  if (critical.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <AnimatePresence>
        {critical.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => onAlertPress?.(alert)}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-3 rounded-xl text-start transition-all active:scale-[0.98]",
                alert.severity === "critical"
                  ? "bg-red-950/70 border border-red-800/50"
                  : "bg-amber-950/60 border border-amber-700/50"
              )}
            >
              <AlertTriangle className={cn(
                "w-4 h-4 shrink-0 mt-0.5",
                alert.severity === "critical" ? "text-red-400" : "text-amber-400"
              )} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                  {alert.title_ar || alert.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider",
                    alert.severity === "critical"
                      ? "bg-red-900/60 text-red-300"
                      : "bg-amber-900/60 text-amber-300"
                  )}>
                    {t[alert.severity as keyof typeof t] as string || alert.severity}
                  </span>
                  {alert.area && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      {alert.area}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground ms-auto shrink-0">
                    {formatRelativeTime(alert.timestamp, t, lang)}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); setDismissed(prev => new Set([...prev, alert.id])); }}
                className="p-1 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
