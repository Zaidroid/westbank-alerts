import { useState } from "react";
import { MapPin, Clock, ChevronDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, formatRelativeTime, getTypeLabel } from "@/lib/i18n";
import type { Alert } from "@/lib/api/types";
import { motion, AnimatePresence } from "framer-motion";

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-s-red-500",
  high:     "border-s-orange-500",
  medium:   "border-s-yellow-600",
  low:      "border-s-slate-600",
};

const SEVERITY_BADGE: Record<string, string> = {
  critical: "bg-red-900/70 text-red-300",
  high:     "bg-orange-900/60 text-orange-300",
  medium:   "bg-yellow-900/50 text-yellow-300",
  low:      "bg-slate-800 text-slate-400",
};

interface AlertExpandCardProps {
  alert: Alert;
  onRoute?: boolean;
}

export function AlertExpandCard({ alert, onRoute }: AlertExpandCardProps) {
  const { t, lang } = useLang();
  const [expanded, setExpanded] = useState(false);

  // Arabic-first headline: prefer title_ar, fall back to "type — area"
  const typeLabel = getTypeLabel(alert.type, t);
  const headline = alert.title_ar
    ? alert.title_ar
    : alert.area
    ? `${typeLabel} — ${alert.area}`
    : typeLabel;

  return (
    <div className={cn(
      "bg-card/50 border border-s-2 border-e-border/20 border-y-border/20 rounded-xl overflow-hidden",
      SEVERITY_BORDER[alert.severity] || "border-s-slate-600"
    )}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 px-4 py-3 text-start"
      >
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
              SEVERITY_BADGE[alert.severity]
            )}>
              {t[alert.severity as keyof typeof t] as string}
            </span>
            <span className="text-[11px] text-muted-foreground">{typeLabel}</span>
            {onRoute && (
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium shrink-0 ms-auto">
                {t.onYourRoute}
              </span>
            )}
          </div>

          {/* Headline — always Arabic or Arabic fallback */}
          <p className="text-sm font-semibold text-foreground leading-snug">
            {headline}
          </p>

          {/* Meta: area + time */}
          <div className="flex items-center gap-3 flex-wrap">
            {alert.area && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                {alert.area}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground ms-auto shrink-0">
              <Clock className="w-2.5 h-2.5" />
              {formatRelativeTime(alert.timestamp, t, lang)}
            </span>
          </div>
        </div>

        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform",
          expanded && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-2 border-t border-border/20 space-y-2">
              {/* Show English title only in expanded state if no Arabic title */}
              {!alert.title_ar && alert.title && (
                <p className="text-xs text-muted-foreground">{alert.title}</p>
              )}
              {alert.body && alert.body !== alert.title && (
                <p className="text-sm text-foreground/80 leading-relaxed">{alert.body}</p>
              )}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Zap className="w-3 h-3 shrink-0" />
                <span>{alert.source}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
