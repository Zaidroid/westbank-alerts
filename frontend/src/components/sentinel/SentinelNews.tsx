import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Alert } from "@/lib/api/types";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLang, getTypeLabel } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface SentinelNewsProps {
  alerts: Alert[];
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function SentinelNews({ alerts }: SentinelNewsProps) {
  const { t, lang } = useLang();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "sirens" | "attacks" | "military" | "closures">("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const FILTERS = [
    { id: "all" as const, label: lang === 'ar' ? "الكل" : "All" },
    { id: "sirens" as const, label: lang === 'ar' ? "إنذارات" : "Sirens" },
    { id: "attacks" as const, label: lang === 'ar' ? "اعتداءات" : "Attacks" },
    { id: "military" as const, label: lang === 'ar' ? "عمليات" : "Military" },
    { id: "closures" as const, label: lang === 'ar' ? "إغلاقات" : "Closures" },
  ];

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter(alert => {
        if (activeFilter === "sirens" && alert.type !== "west_bank_siren" && alert.type !== "regional_attack" && alert.type !== "rocket_attack") return false;
        if (activeFilter === "attacks" && alert.type !== "settler_attack" && alert.type !== "shooting" && alert.type !== "explosion" && alert.type !== "airstrike") return false;
        if (activeFilter === "military" && alert.type !== "idf_operation" && alert.type !== "idf_raid" && alert.type !== "arrest_campaign") return false;
        if (activeFilter === "closures" && alert.type !== "road_closure" && alert.type !== "flying_checkpoint" && alert.type !== "demolition") return false;

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const text = `${alert.title_ar || ""} ${alert.title || ""} ${alert.body || ""} ${alert.raw_text || ""}`.toLowerCase();
          if (!text.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const sevDiff = (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
        if (sevDiff !== 0) return sevDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [alerts, activeFilter, searchQuery]);

  const handleAlertClick = useCallback((alert: Alert) => {
    setSelectedAlert(alert);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedAlert(null);
  }, []);

  return (
    <div className="flex flex-col min-h-full pb-[100px]">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-5xl font-headline font-bold text-on-surface tracking-tighter leading-none px-1" dir="auto">
          {t.alerts}
        </h1>
        <p className="text-sm border-s-2 border-error pe-4 ps-3 text-on-surface-variant mt-3 ms-2 font-body max-w-[260px] leading-snug" dir="auto">
          {lang === 'ar' ? "تحديثات أمنية فورية وتنبيهات الطوارئ." : "Real-time security updates and emergency alerts."}
        </p>
      </div>

      {/* Search + Filters */}
      <div className="px-4 pb-3">
        <div className="relative mb-3">
          <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-high text-on-surface border border-outline-variant/50 rounded-xl py-3.5 ps-11 pe-4 font-body text-sm placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all"
            dir="auto"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface active:scale-90"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 snap-x">
          {FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "snap-start shrink-0 px-4 py-2 rounded-full text-xs font-bold font-label tracking-wider transition-all whitespace-nowrap active:scale-95",
                activeFilter === filter.id
                  ? "bg-secondary text-secondary-container shadow-[0_0_12px_rgba(254,179,0,0.25)]"
                  : "bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 pb-2">
        <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">
          {filteredAlerts.length} {t.results}
        </span>
      </div>

      {/* Alert list */}
      <div className="px-4 py-1 space-y-3 z-10">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="material-symbols-outlined text-[52px] text-surface-container-highest mb-4">
              notifications_off
            </span>
            <h3 className="text-lg font-headline font-bold text-on-surface mb-1">{t.noAlertsFound}</h3>
            <p className="text-sm text-on-surface-variant" dir="auto">
              {lang === 'ar' ? "لا توجد تنبيهات في هذه الفئة" : "No alerts in this category"}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert, i) => {
            const isSiren = alert.type === "west_bank_siren" || alert.type === "regional_attack" || alert.type === "rocket_attack";
            const isCritical = alert.severity === "critical";
            const isHigh = alert.severity === "high";

            const accentColor = isCritical
              ? "border-error/30 bg-error/5"
              : isHigh
                ? "border-secondary/30 bg-secondary/5"
                : "border-outline-variant/20 bg-surface-container-low";

            const dotColor = isCritical
              ? "bg-error glow-error"
              : isHigh
                ? "bg-secondary glow-secondary"
                : "bg-tertiary";

            const badgeBg = isCritical
              ? "bg-error/10 border-error/30 text-error"
              : isHigh
                ? "bg-secondary/10 border-secondary/30 text-secondary"
                : "bg-surface-container border-outline-variant/30 text-on-surface-variant";

            const relativeTime = formatDistanceToNow(new Date(alert.timestamp), {
              addSuffix: true,
              locale: lang === 'ar' ? ar : enUS
            });

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}
                onClick={() => handleAlertClick(alert)}
                className={cn(
                  "group relative border rounded-2xl p-4 flex gap-3 transition-all cursor-pointer active:scale-[0.98]",
                  accentColor
                )}
              >
                {isSiren && (
                  <div className="absolute start-0 top-3 bottom-3 w-0.5 rounded-full bg-error" />
                )}

                <div className="pt-1.5 shrink-0">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    dotColor,
                    isCritical && "animate-pulse"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className={cn("text-[9px] font-label font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border", badgeBg)}>
                      {isSiren
                        ? (lang === 'ar' ? "إنذار" : "SIREN")
                        : isCritical
                          ? t.critical
                          : isHigh
                            ? t.high
                            : getTypeLabel(alert.type, t)}
                    </span>
                    <span className="text-[10px] font-label text-on-surface-variant whitespace-nowrap shrink-0" dir="ltr">
                      {relativeTime}
                    </span>
                  </div>

                  <h3 className="text-base font-headline font-bold text-on-surface mb-1.5 leading-snug" dir="auto">
                    {lang === 'ar' ? (alert.title_ar || alert.title || t.alerts) : (alert.title || alert.title_ar || t.alerts)}
                  </h3>

                  {(alert.body || alert.raw_text) && (
                    <p className="text-sm font-body text-on-surface-variant line-clamp-2 leading-relaxed" dir="auto">
                      {alert.body || alert.raw_text}
                    </p>
                  )}

                  {alert.area && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="material-symbols-outlined text-[12px] text-on-surface-variant">location_on</span>
                      <span className="text-[10px] font-label text-on-surface-variant">{alert.area}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center shrink-0 opacity-40 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                  <span className={cn("material-symbols-outlined text-[18px] text-on-surface-variant", lang === 'ar' ? 'rotate-180' : '')}>
                    chevron_right
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Alert Detail Bottom Sheet */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedAlert && (
            <>
              <motion.div
                key="alert-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleCloseDetail}
                className="fixed inset-0 z-[999] bg-background/80 backdrop-blur-sm"
              />
              <motion.div
                key="alert-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 inset-x-0 z-[1000] bg-surface-dim rounded-t-3xl border-t border-outline-variant/20 shadow-[0_-12px_40px_rgba(0,0,0,0.7)] max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Handle / Header */}
                <div className="shrink-0 pt-3 pb-3 px-5 border-b border-outline-variant/10 bg-surface-container-low/40 rounded-t-3xl">
                  <div className="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-3" />

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Severity + type badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={cn(
                          "text-[9px] font-label font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border",
                          selectedAlert.severity === "critical" ? "bg-error/10 border-error/30 text-error" :
                          selectedAlert.severity === "high" ? "bg-secondary/10 border-secondary/30 text-secondary" :
                          "bg-surface-container border-outline-variant/30 text-on-surface-variant"
                        )}>
                          {selectedAlert.severity === "critical" ? t.critical : selectedAlert.severity === "high" ? t.high : selectedAlert.severity}
                        </span>
                        <span className="text-[9px] font-label font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/20 text-on-surface-variant">
                          {getTypeLabel(selectedAlert.type, t)}
                        </span>
                      </div>

                      <h3 className="text-xl font-headline font-bold text-on-surface leading-tight" dir="auto">
                        {lang === 'ar'
                          ? (selectedAlert.title_ar || selectedAlert.title)
                          : (selectedAlert.title || selectedAlert.title_ar)}
                      </h3>
                    </div>

                    <button
                      onClick={handleCloseDetail}
                      className="w-10 h-10 rounded-full bg-surface-container-high hover:bg-surface-container-highest transition-colors flex items-center justify-center shrink-0 text-on-surface-variant active:scale-90"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  {/* Metadata row */}
                  <div className="flex flex-wrap gap-3 mb-5">
                    <div className="flex items-center gap-1.5 bg-surface-container/50 px-3 py-1.5 rounded-lg border border-outline-variant/20">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">schedule</span>
                      <span className="text-[11px] font-label font-bold text-on-surface">
                        {format(new Date(selectedAlert.timestamp), 'PPp', { locale: lang === 'ar' ? ar : enUS })}
                      </span>
                    </div>
                    {selectedAlert.area && (
                      <div className="flex items-center gap-1.5 bg-surface-container/50 px-3 py-1.5 rounded-lg border border-outline-variant/20">
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant">location_on</span>
                        <span className="text-[11px] font-label font-bold text-on-surface" dir="auto">{selectedAlert.area}</span>
                      </div>
                    )}
                    {selectedAlert.source && (
                      <div className="flex items-center gap-1.5 bg-surface-container/50 px-3 py-1.5 rounded-lg border border-outline-variant/20">
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant">source</span>
                        <span className="text-[11px] font-label font-bold text-on-surface" dir="ltr">@{selectedAlert.source}</span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  {selectedAlert.body && (
                    <div className="mb-5">
                      <h4 className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">description</span>
                        {t.details}
                      </h4>
                      <div className="bg-surface-container-low/60 border border-outline-variant/10 rounded-2xl p-4">
                        <p className="text-sm font-body text-on-surface leading-relaxed whitespace-pre-line" dir="auto">
                          {selectedAlert.body}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Raw text (original Telegram message) */}
                  {selectedAlert.raw_text && selectedAlert.raw_text !== selectedAlert.body && (
                    <div className="mb-5">
                      <h4 className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">chat</span>
                        {lang === 'ar' ? 'النص الأصلي' : 'Original Message'}
                      </h4>
                      <div className="bg-surface-container-lowest/30 border border-outline-variant/10 rounded-2xl p-4">
                        <p className="text-[13px] font-body text-on-surface-variant leading-relaxed whitespace-pre-line" dir="auto">
                          {selectedAlert.raw_text}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Bilingual title display */}
                  {selectedAlert.title_ar && selectedAlert.title && selectedAlert.title_ar !== selectedAlert.title && (
                    <div className="mb-5">
                      <h4 className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                        {lang === 'ar' ? 'العنوان بالإنجليزية' : 'Arabic Title'}
                      </h4>
                      <p className="text-sm font-body text-on-surface-variant bg-surface-container-low/40 p-3 rounded-xl border border-outline-variant/10" dir={lang === 'ar' ? 'ltr' : 'rtl'}>
                        {lang === 'ar' ? selectedAlert.title : selectedAlert.title_ar}
                      </p>
                    </div>
                  )}

                  <div className="h-[calc(var(--safe-area-inset-bottom,0px)+16px)]" />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
