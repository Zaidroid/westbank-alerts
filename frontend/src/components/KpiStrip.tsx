import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import {
  Wifi, WifiOff, AlertTriangle, CloudSun,
  CircleX, Loader2, Fuel, ChevronDown, ArrowUpDown,
} from "lucide-react";
import type { ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ── Variant styles ────────────────────────────────────────────────────────────

const VARIANT_STYLES = {
  danger: {
    card: "border-destructive/40 bg-destructive/5",
    value: "text-destructive",
    icon: "text-destructive",
  },
  warning: {
    card: "border-orange-500/40 bg-orange-500/5",
    value: "text-orange-600 dark:text-orange-400",
    icon: "text-orange-500",
  },
  info: {
    card: "border-primary/40 bg-primary/5",
    value: "text-primary",
    icon: "text-primary",
  },
  success: {
    card: "border-green-500/40 bg-green-500/5",
    value: "text-green-600 dark:text-green-400",
    icon: "text-green-500",
  },
  neutral: {
    card: "border-border",
    value: "text-foreground",
    icon: "text-muted-foreground",
  },
};

type Variant = keyof typeof VARIANT_STYLES;

// ── Base KpiCard ──────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
  variant?: Variant;
  delay?: number;
  subtitle?: string;
  expandable?: boolean;
  children?: React.ReactNode; // popover content
}

function KpiCard({
  title,
  value,
  icon: Icon,
  variant = "neutral",
  delay = 0,
  subtitle,
  expandable = false,
  children,
}: KpiCardProps) {
  const [open, setOpen] = useState(false);
  const isHighlighted =
    variant !== "neutral" && (typeof value === "number" ? value > 0 : true);
  const styles = isHighlighted ? VARIANT_STYLES[variant] : VARIANT_STYLES.neutral;

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card px-3.5 py-2.5 shadow-sm",
        "flex-1 md:flex-none",
        expandable && "cursor-pointer select-none hover:bg-muted/40 transition-colors",
        open && "ring-1 ring-primary/30",
        styles.card,
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", styles.icon)} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] md:text-[11px] font-medium text-muted-foreground leading-tight truncate">
          {title}
        </div>
        <div className={cn("text-xl md:text-2xl font-bold font-mono tracking-tight", styles.value)}>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={String(value)}>
            {value}
          </motion.span>
        </div>
        {subtitle && (
          <div className="text-[9px] text-muted-foreground truncate">{subtitle}</div>
        )}
      </div>
      {expandable && (
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      )}
    </motion.div>
  );

  if (!expandable || !children) return inner;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{inner}</PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-56 p-3 text-sm"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

function KpiCardLoading({ title, delay = 0 }: { title: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="flex flex-1 md:flex-none items-center gap-3 rounded-xl border bg-card px-3.5 py-2.5 shadow-sm"
    >
      <Loader2 className="h-5 w-5 shrink-0 text-muted-foreground animate-spin" />
      <div className="min-w-0">
        <div className="text-[10px] md:text-[11px] font-medium text-muted-foreground leading-tight truncate">
          {title}
        </div>
        <div className="text-xl md:text-2xl font-bold font-mono tracking-tight text-muted-foreground">
          —
        </div>
      </div>
    </motion.div>
  );
}

// ── Shared detail row ─────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-mono text-xs font-medium">{value}</span>
    </div>
  );
}

// ── Internet Status Card ──────────────────────────────────────────────────────

type InternetStatus = {
  status: string; // "normal" | "degraded" | "outage" | "unknown"
  status_label: string;
  sources: Array<{
    source: string;
    label: string;
    status: string;
    ratio: number;
    current: number;
    baseline: number;
  }>;
  fetched_at?: string;
  is_stale?: boolean;
};

function InternetStatusCard({ delay }: { delay?: number }) {
  const { lang } = useLang();
  const { data, isLoading } = useQuery({
    queryKey: ["internet-status"],
    queryFn: () => apiClient.get<InternetStatus>("/internet-status"),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });

  if (isLoading)
    return <KpiCardLoading title={lang === "ar" ? "الإنترنت" : "Internet"} delay={delay} />;

  // API field is "status" not "overall_status"
  const status = data?.status ?? "unknown";
  const variant: Variant =
    status === "outage" ? "danger" : status === "degraded" ? "warning" : "success";

  const label =
    status === "normal"
      ? lang === "ar" ? "مستقر" : "Stable"
      : status === "degraded"
      ? lang === "ar" ? "متدهور" : "Degraded"
      : status === "outage"
      ? lang === "ar" ? "انقطاع" : "Outage"
      : lang === "ar" ? "غير معروف" : "Unknown";

  const sources = data?.sources ?? [];
  const worstRatio = sources.length
    ? Math.min(...sources.map((s) => s.ratio))
    : null;
  const subtitle =
    worstRatio !== null && worstRatio < 1
      ? `${Math.round(worstRatio * 100)}%`
      : undefined;

  const statusDot = (s: string) =>
    s === "normal" ? "🟢" : s === "degraded" ? "🟡" : s === "outage" ? "🔴" : "⚪";

  return (
    <KpiCard
      title={lang === "ar" ? "إنترنت فلسطين" : "Palestine Internet"}
      value={label}
      icon={status === "normal" || status === "unknown" ? Wifi : WifiOff}
      variant={variant}
      delay={delay}
      subtitle={subtitle}
      expandable={sources.length > 0}
    >
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-muted-foreground mb-2">
          {lang === "ar" ? "مصادر الإشارة" : "Signal Sources"}
        </div>
        {sources.map((s) => (
          <DetailRow
            key={s.source}
            label={`${statusDot(s.status)} ${s.source.toUpperCase()}`}
            value={`${Math.round(s.ratio * 100)}%`}
          />
        ))}
      </div>
    </KpiCard>
  );
}

// ── Fuel Prices Card ──────────────────────────────────────────────────────────

type MarketData = {
  fuel?: {
    prices_ils_liter?: Record<string, number>;
    prices_usd_liter?: Record<string, number>;
    effective_date?: string;
    error?: string;
  };
  gold?: {
    usd_per_oz?: number;
    usd_per_gram?: number;
    karats_ils_gram?: Record<string, number>;
    error?: string;
  };
  currency?: {
    rates?: Record<string, number>;
    error?: string;
  };
  fetched_at?: string;
};

function FuelCard({ data, isLoading, delay }: { data?: MarketData; isLoading: boolean; delay?: number }) {
  const { lang } = useLang();
  const title = lang === "ar" ? "أسعار الوقود" : "Fuel Prices";

  if (isLoading) return <KpiCardLoading title={title} delay={delay} />;

  const ilsPrices = data?.fuel?.prices_ils_liter ?? {};
  const usdPrices = data?.fuel?.prices_usd_liter ?? {};
  const fuelError = data?.fuel?.error;

  // Primary value: gasoline 95 in ILS
  const gas95ils = ilsPrices["gasoline_95"];
  const gas95usd = usdPrices["gasoline_95_usd"];

  const mainValue =
    gas95ils != null
      ? `${gas95ils.toFixed(2)} ₪`
      : fuelError
      ? "—"
      : "—";

  const subtitle =
    gas95usd != null
      ? `$${gas95usd.toFixed(2)}/L`
      : data?.fuel?.effective_date
      ? data.fuel.effective_date
      : undefined;

  // Build detail rows
  const fuelRows: Array<{ label: string; ils?: number; usd?: number }> = [];
  for (const key of ["gasoline_95", "gasoline_98", "diesel"]) {
    const ils = ilsPrices[key];
    const usd = usdPrices[`${key}_usd`];
    if (ils != null || usd != null) {
      const labelMap: Record<string, { ar: string; en: string }> = {
        gasoline_95: { ar: "بنزين 95", en: "Gasoline 95" },
        gasoline_98: { ar: "بنزين 98", en: "Gasoline 98" },
        diesel:      { ar: "ديزل",     en: "Diesel" },
      };
      fuelRows.push({
        label: lang === "ar" ? labelMap[key].ar : labelMap[key].en,
        ils,
        usd,
      });
    }
  }

  const hasDetail = fuelRows.length > 0;

  return (
    <KpiCard
      title={title}
      value={mainValue}
      icon={Fuel}
      variant="neutral"
      delay={delay}
      subtitle={subtitle}
      expandable={hasDetail}
    >
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-muted-foreground mb-2">
          {lang === "ar" ? "سعر/لتر" : "Price per Liter"}
        </div>
        {fuelRows.map((r) => (
          <div key={r.label} className="space-y-0">
            <div className="text-[10px] font-medium text-muted-foreground">{r.label}</div>
            <div className="flex gap-3 ps-1">
              {r.ils != null && (
                <DetailRow label="ILS" value={`${r.ils.toFixed(2)} ₪`} />
              )}
              {r.usd != null && (
                <DetailRow label="USD" value={`$${r.usd.toFixed(3)}`} />
              )}
            </div>
          </div>
        ))}
        {data?.fuel?.effective_date && (
          <div className="text-[9px] text-muted-foreground pt-1 border-t border-border mt-1">
            {data.fuel.effective_date}
          </div>
        )}
      </div>
    </KpiCard>
  );
}

// ── Gold & Currency Card ──────────────────────────────────────────────────────

function GoldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}

function GoldCard({ data, isLoading, delay }: { data?: MarketData; isLoading: boolean; delay?: number }) {
  const { lang } = useLang();
  const title = lang === "ar" ? "الذهب والعملات" : "Gold & Rates";

  if (isLoading) return <KpiCardLoading title={title} delay={delay} />;

  const usdPerOz = data?.gold?.usd_per_oz;
  const karats = data?.gold?.karats_ils_gram ?? {};
  const rates = data?.currency?.rates ?? {};
  const goldError = data?.gold?.error;

  const mainValue =
    usdPerOz != null
      ? `$${usdPerOz.toLocaleString()}`
      : goldError
      ? "—"
      : "—";

  // Subtitle: USD/ILS rate
  const usdRate = rates["USD"];
  const subtitle = usdRate != null ? `1$ = ${usdRate.toFixed(3)} ₪` : undefined;

  // Detail: karat prices + key currency rates
  const karatOrder = ["24K", "21K", "18K", "14K"];
  const karatRows = karatOrder
    .filter((k) => karats[k] != null)
    .map((k) => ({ label: k, value: `${karats[k].toFixed(0)} ₪/g` }));

  const rateOrder = ["USD", "EUR", "JOD"];
  const rateRows = rateOrder
    .filter((c) => rates[c] != null)
    .map((c) => ({ label: `1 ${c}`, value: `${rates[c].toFixed(3)} ₪` }));

  const hasDetail = karatRows.length > 0 || rateRows.length > 0;

  return (
    <KpiCard
      title={title}
      value={mainValue}
      icon={GoldIcon}
      variant="neutral"
      delay={delay}
      subtitle={subtitle}
      expandable={hasDetail}
    >
      <div className="space-y-1">
        {karatRows.length > 0 && (
          <>
            <div className="text-[11px] font-semibold text-muted-foreground mb-1">
              {lang === "ar" ? "ذهب (₪/غرام)" : "Gold (₪/gram)"}
            </div>
            {karatRows.map((r) => (
              <DetailRow key={r.label} label={r.label} value={r.value} />
            ))}
          </>
        )}
        {rateRows.length > 0 && (
          <>
            <div className="text-[11px] font-semibold text-muted-foreground mb-1 mt-2 pt-2 border-t border-border">
              {lang === "ar" ? "أسعار الصرف" : "Exchange Rates"}
            </div>
            {rateRows.map((r) => (
              <DetailRow key={r.label} label={r.label} value={r.value} />
            ))}
          </>
        )}
        {usdPerOz != null && (
          <div className="text-[9px] text-muted-foreground pt-1 border-t border-border mt-1">
            {lang === "ar" ? `ذهب دولي: $${usdPerOz.toLocaleString()}/أوقية` : `Spot: $${usdPerOz.toLocaleString()}/oz`}
          </div>
        )}
      </div>
    </KpiCard>
  );
}

// ── Weather Card ──────────────────────────────────────────────────────────────

function WeatherCard({ delay }: { delay?: number }) {
  const { lang } = useLang();
  const { data, isLoading } = useQuery({
    queryKey: ["weather"],
    queryFn: () =>
      apiClient.get<
        Record<
          string,
          {
            city: string;
            city_ar: string;
            temperature: number;
            weather_description: string;
            weather_description_ar: string;
            wind_speed: number;
            is_day: boolean;
          }
        >
      >("/weather"),
    refetchInterval: 30 * 60 * 1000,
    staleTime: 25 * 60 * 1000,
  });

  if (isLoading)
    return <KpiCardLoading title={lang === "ar" ? "الطقس" : "Weather"} delay={delay} />;

  const nablus = data?.nablus;
  const ramallah = data?.ramallah;
  const hebron = data?.hebron;

  if (!nablus) return null;

  const temp = Math.round(nablus.temperature);
  const desc =
    lang === "ar"
      ? nablus.weather_description_ar || nablus.weather_description
      : nablus.weather_description;

  const cities = [
    { key: "nablus", d: data?.nablus },
    { key: "ramallah", d: ramallah },
    { key: "hebron", d: hebron },
  ].filter((c) => c.d != null);

  return (
    <KpiCard
      title={lang === "ar" ? `الطقس — ${nablus.city_ar}` : `Weather — ${nablus.city}`}
      value={`${temp}°C`}
      icon={CloudSun}
      variant="neutral"
      delay={delay}
      subtitle={desc}
      expandable={cities.length > 1}
    >
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-muted-foreground mb-2">
          {lang === "ar" ? "المدن" : "Cities"}
        </div>
        {cities.map(({ key, d }) =>
          d ? (
            <DetailRow
              key={key}
              label={lang === "ar" ? d.city_ar : d.city}
              value={`${Math.round(d.temperature)}°C · ${d.wind_speed} km/h`}
            />
          ) : null,
        )}
      </div>
    </KpiCard>
  );
}

// ── Main KpiStrip ─────────────────────────────────────────────────────────────

interface KpiStripProps {
  closedCheckpoints: number;
  criticalAlerts: number;
  updatesLast1h?: number;
  totalCheckpoints?: number;
}

export function KpiStrip({ closedCheckpoints, criticalAlerts, updatesLast1h = 0, totalCheckpoints = 0 }: KpiStripProps) {
  const { t, lang } = useLang();

  // Single market fetch shared by Fuel + Gold cards
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ["market-all"],
    queryFn: () => apiClient.get<MarketData>("/market"),
    refetchInterval: 15 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="flex flex-wrap md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-2.5 py-2.5 px-4 md:px-6 border-b border-border bg-background/50 shrink-0 auto-rows-max">
      {/* 1. Palestine Internet */}
      <InternetStatusCard delay={0.05} />

      {/* 2. Fuel Prices */}
      <FuelCard data={marketData} isLoading={marketLoading} delay={0.1} />

      {/* 3. Gold & Currency */}
      <GoldCard data={marketData} isLoading={marketLoading} delay={0.15} />

      {/* 4. Weather */}
      <WeatherCard delay={0.2} />

      {/* 5. Updates (1h) - from checkpoint updates feed */}
      <KpiCard
        title={lang === "ar" ? "تحديثات (1س)" : "Updates 1h"}
        value={updatesLast1h}
        icon={ArrowUpDown}
        variant={updatesLast1h > 0 ? "info" : "neutral"}
        delay={0.25}
      />

      {/* 6. Critical Alerts */}
      <KpiCard
        title={t.criticalAlerts}
        value={criticalAlerts}
        icon={AlertTriangle}
        variant="danger"
        delay={0.3}
      />

      {/* 7. Closed Checkpoints */}
      <KpiCard
        title={t.closedCheckpoints}
        value={closedCheckpoints}
        icon={CircleX}
        variant={closedCheckpoints > 0 ? "danger" : "neutral"}
        delay={0.35}
      />
    </div>
  );
}
