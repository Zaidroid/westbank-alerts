import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Alert } from "@/lib/api/types";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useLang, getTypeLabel } from "@/lib/i18n";

interface SentinelNewsProps {
  alerts: Alert[];
}

// Priority alert types that warrant showing (actual threats)
const SIREN_TYPES = new Set([
  "west_bank_siren",
  "regional_attack",
  "rocket_attack",
  "airstrike",
  "explosion",
  "shooting",
  "idf_raid",
  "idf_operation",
  "settler_attack",
  "injury_report",
  "arrest_campaign",
  "demolition",
  "road_closure",
  "flying_checkpoint",
  "general",
]);

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
        // Filter by category
        if (activeFilter === "sirens" && alert.type !== "west_bank_siren" && alert.type !== "regional_attack" && alert.type !== "rocket_attack") return false;
        if (activeFilter === "attacks" && alert.type !== "settler_attack" && alert.type !== "shooting" && alert.type !== "explosion" && alert.type !== "airstrike") return false;
        if (activeFilter === "military" && alert.type !== "idf_operation" && alert.type !== "idf_raid" && alert.type !== "arrest_campaign") return false;
        if (activeFilter === "closures" && alert.type !== "road_closure" && alert.type !== "flying_checkpoint" && alert.type !== "demolition") return false;

        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const text = `${alert.title_ar || ""} ${alert.title || ""} ${alert.body || ""} ${alert.raw_text || ""}`.toLowerCase();
          if (!text.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by severity first, then timestamp
        const sevDiff = (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3);
        if (sevDiff !== 0) return sevDiff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [alerts, activeFilter, searchQuery]);

  return (
    <div className="flex flex-col min-h-full pb-[100px] grain-overlay">
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
        </div>

        {/* Filter chips — full-bleed scroll with proper px-4 padding */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 snap-x">
          {FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "snap-start shrink-0 px-4 py-2 rounded-full text-xs font-bold font-label tracking-wider transition-all whitespace-nowrap",
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

      {/* Alert list */}
      <div className="px-4 py-2 space-y-3 z-10">
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
          filteredAlerts.map(alert => {
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
              <div
                key={alert.id}
                className={cn(
                  "group relative border rounded-2xl p-4 flex gap-3 transition-all cursor-pointer hover:shadow-md",
                  accentColor
                )}
              >
                {/* Siren indicator line on leading edge */}
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
                </div>

                <div className="absolute top-1/2 -translate-y-1/2 end-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={cn("material-symbols-outlined text-[18px] text-on-surface-variant", lang === 'ar' ? 'rotate-180' : '')}>
                    chevron_right
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
