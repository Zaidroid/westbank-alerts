/**
 * KpiDetailSheet — expandable detail modal for header KPI pills.
 * Slides up from bottom with spring animation. Each metric type
 * renders its own rich content layout.
 */

import { useEffect, useState } from "react";
import { X, Wind } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getNextPrayer, useMarketData, useWeatherData, usePrayerTimes } from "@/hooks/useContextualData";
import type { MarketData, WeatherResponse, PrayerTimesResponse } from "@/lib/api/types";

export type KpiPillType = "weather" | "prayer" | "fuel" | "currency" | "gold";

interface KpiDetailSheetProps {
  type: KpiPillType | null;
  onClose: () => void;
}

// ── Weather code helpers ─────────────────────────────────────────────────────

function weatherEmoji(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code <= 2)  return isDay ? "🌤" : "🌤";
  if (code <= 3)  return "☁️";
  if (code <= 49) return "🌫";
  if (code <= 69) return "🌧";
  if (code <= 79) return "❄️";
  if (code <= 82) return "🌦";
  if (code <= 99) return "⛈";
  return "🌡";
}

function weatherConditionLabel(code: number): string {
  if (code === 0) return "صافٍ";
  if (code <= 2)  return "غائم جزئياً";
  if (code <= 3)  return "غائم";
  if (code <= 49) return "ضبابي";
  if (code <= 69) return "ممطر";
  if (code <= 79) return "ثلج";
  if (code <= 82) return "زخات مطر";
  return "عاصفة";
}

// ── PRAYER TIMES ────────────────────────────────────────────────────────────

const PRAYER_ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const PRAYER_AR: Record<string, string> = {
  Fajr: "الفجر", Sunrise: "الشروق", Dhuhr: "الظهر",
  Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء",
};
const PRAYER_EMOJI: Record<string, string> = {
  Fajr: "🌅", Sunrise: "🌄", Dhuhr: "🌞",
  Asr: "🌇", Maghrib: "🌆", Isha: "🌙",
};

function PrayerContent({ prayer }: { prayer: PrayerTimesResponse }) {
  const city = prayer.cities?.find(c => c.name === "Ramallah") ?? prayer.cities?.[0];
  const nextPrayer = city ? getNextPrayer(city) : null;

  // Live countdown
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!nextPrayer) return;
    const update = () => {
      const now = new Date();
      const [h, m] = nextPrayer.time.split(":").map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const diff = Math.max(0, target.getTime() - now.getTime());
      const hh = Math.floor(diff / 3600000);
      const mm = Math.floor((diff % 3600000) / 60000);
      const ss = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [nextPrayer?.time]);

  return (
    <div className="space-y-5">
      {/* Hijri date */}
      <div className="text-center py-3 bg-emerald-950/40 border border-emerald-800/30 rounded-2xl">
        <p className="text-xs text-muted-foreground mb-0.5">{prayer.hijri.weekday_ar}</p>
        <p className="text-base font-bold text-emerald-300">
          {prayer.hijri.day} {prayer.hijri.month_ar} {prayer.hijri.year} هـ
        </p>
        {nextPrayer && (
          <div className="mt-2 pt-2 border-t border-emerald-800/30">
            <p className="text-xs text-muted-foreground">الوقت المتبقي لـ{nextPrayer.nameAr}</p>
            <p className="text-2xl font-black text-emerald-400 font-mono tracking-widest mt-0.5">
              {countdown}
            </p>
          </div>
        )}
      </div>

      {/* Prayer list */}
      {city && (
        <div className="space-y-1.5">
          {PRAYER_ORDER.map(key => {
            const time = city.prayers[key];
            if (!time) return null;
            const isNext = nextPrayer?.name === key;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: PRAYER_ORDER.indexOf(key) * 0.05 }}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl",
                  isNext
                    ? "bg-emerald-950/60 border border-emerald-700/50"
                    : "bg-muted/30 border border-border/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{PRAYER_EMOJI[key]}</span>
                  <span className={cn(
                    "text-sm font-semibold",
                    isNext ? "text-emerald-300" : "text-foreground/80"
                  )}>
                    {PRAYER_AR[key]}
                  </span>
                  {isNext && (
                    <span className="text-[10px] bg-emerald-700/50 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                      التالية
                    </span>
                  )}
                </div>
                <span className={cn(
                  "font-mono text-base font-bold",
                  isNext ? "text-emerald-300" : "text-muted-foreground"
                )}>
                  {time}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── WEATHER ─────────────────────────────────────────────────────────────────

function WeatherContent({ weather }: { weather: WeatherResponse }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        {weather.cities?.map((city, i) => {
          const emoji = weatherEmoji(city.weather_code, city.is_day);
          return (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 24 }}
              className="bg-muted/40 border border-border/30 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{city.name_ar}</p>
                  <p className="text-3xl font-black text-foreground mt-1">
                    {Math.round(city.temp_c)}°
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">
                    {city.condition_ar || weatherConditionLabel(city.weather_code)}
                  </p>
                </div>
                <span className="text-3xl">{emoji}</span>
              </div>
              <div className="flex items-center gap-1 mt-3 text-[10px] text-muted-foreground">
                <Wind className="w-3 h-3" />
                <span>{Math.round(city.wind_kmh)} كم/س</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── FUEL ─────────────────────────────────────────────────────────────────────

function FuelContent({ market }: { market: MarketData }) {
  const fuel = market.fuel;
  const items = [
    { label: "بنزين 95", ils: fuel.prices_ils_liter.gasoline_95, usd: fuel.prices_usd_liter.gasoline_95_usd, color: "from-orange-950/60 to-amber-950/40", border: "border-orange-700/40", text: "text-orange-300" },
    { label: "بنزين 98", ils: fuel.prices_ils_liter.gasoline_98, usd: fuel.prices_usd_liter.gasoline_98_usd, color: "from-red-950/60 to-orange-950/40", border: "border-red-700/40",    text: "text-red-300" },
    { label: "ديزل",     ils: fuel.prices_ils_liter.diesel,       usd: fuel.prices_usd_liter.diesel_usd,       color: "from-slate-900/70 to-zinc-900/50",  border: "border-slate-700/40",  text: "text-slate-300" },
  ];

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
          className={cn("bg-gradient-to-br rounded-2xl p-5 border", item.color, item.border)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60 font-medium mb-1">{item.label}</p>
              <div className="flex items-end gap-1.5">
                <span className={cn("text-4xl font-black", item.text)}>{item.ils}</span>
                <span className="text-base text-white/50 pb-1">₪/ل</span>
              </div>
            </div>
            <span className="text-4xl">⛽</span>
          </div>
          <p className="text-xs text-white/40 mt-2">${item.usd.toFixed(3)} USD/لتر</p>
        </motion.div>
      ))}
      <p className="text-center text-xs text-muted-foreground pt-1">
        سارٍ من {fuel.effective_date} · {fuel.source.split(" (")[0]}
      </p>
    </div>
  );
}

// ── CURRENCY ─────────────────────────────────────────────────────────────────

const CURRENCY_META: Record<string, { flag: string; name: string }> = {
  USD: { flag: "🇺🇸", name: "دولار أمريكي" },
  EUR: { flag: "🇪🇺", name: "يورو" },
  GBP: { flag: "🇬🇧", name: "جنيه إسترليني" },
  JOD: { flag: "🇯🇴", name: "دينار أردني" },
  EGP: { flag: "🇪🇬", name: "جنيه مصري" },
};

function CurrencyContent({ market }: { market: MarketData }) {
  const { rates, last_update, source } = market.currency;
  const lastUpdate = last_update ? new Date(last_update).toLocaleDateString("ar") : "";

  return (
    <div className="space-y-2.5">
      {/* Header note */}
      <div className="flex items-center justify-between px-1 mb-1">
        <p className="text-xs text-muted-foreground">1 وحدة = ₪ شيكل</p>
        {lastUpdate && <p className="text-xs text-muted-foreground">{lastUpdate}</p>}
      </div>

      {Object.entries(rates).map(([code, rate], i) => {
        const meta = CURRENCY_META[code];
        const isUsd = code === "USD";
        return (
          <motion.div
            key={code}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 24 }}
            className={cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-2xl border",
              isUsd
                ? "bg-green-950/50 border-green-700/40"
                : "bg-muted/30 border-border/20"
            )}
          >
            <span className="text-2xl shrink-0">{meta?.flag || "💱"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{code}</p>
              <p className="text-xs text-muted-foreground">{meta?.name}</p>
            </div>
            <div className="text-end">
              <p className={cn(
                "text-xl font-black",
                isUsd ? "text-green-300" : "text-foreground"
              )}>
                {rate.toFixed(3)}
              </p>
              <p className="text-xs text-muted-foreground">₪</p>
            </div>
          </motion.div>
        );
      })}

      <p className="text-center text-xs text-muted-foreground pt-1">{source}</p>
    </div>
  );
}

// ── GOLD ─────────────────────────────────────────────────────────────────────

function GoldContent({ market }: { market: MarketData }) {
  const { karats_ils_gram, usd_per_oz, usd_per_gram } = market.gold;
  const karatOrder = ["24K", "22K", "18K", "14K", "10K"];
  const karatColors: Record<string, { bg: string; border: string; text: string; sub: string }> = {
    "24K": { bg: "from-yellow-950/70 to-amber-950/50",    border: "border-yellow-600/50", text: "text-yellow-300", sub: "ذهب خالص" },
    "22K": { bg: "from-yellow-950/60 to-amber-900/40",    border: "border-yellow-700/40", text: "text-yellow-400", sub: "91.7%" },
    "18K": { bg: "from-amber-950/60 to-orange-950/40",    border: "border-amber-700/40",  text: "text-amber-400",  sub: "75%" },
    "14K": { bg: "from-orange-950/50 to-amber-950/30",    border: "border-orange-700/30", text: "text-orange-400", sub: "58.3%" },
    "10K": { bg: "from-slate-900/60 to-zinc-900/40",      border: "border-slate-700/30",  text: "text-slate-400",  sub: "41.7%" },
  };

  return (
    <div className="space-y-2.5">
      {/* Spot price banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-yellow-950/50 border border-yellow-700/40 rounded-2xl px-4 py-3"
      >
        <div>
          <p className="text-xs text-yellow-400/70 font-medium">سعر الأونصة عالمياً</p>
          <p className="text-2xl font-black text-yellow-300">${usd_per_oz.toLocaleString()}</p>
        </div>
        <div className="text-end">
          <p className="text-xs text-yellow-400/70 font-medium">سعر الغرام</p>
          <p className="text-xl font-bold text-yellow-400">${usd_per_gram.toFixed(2)}</p>
        </div>
      </motion.div>

      {/* Per-karat prices */}
      <div className="grid grid-cols-2 gap-2">
        {karatOrder.map((k, i) => {
          const price = karats_ils_gram[k];
          if (!price) return null;
          const c = karatColors[k];
          return (
            <motion.div
              key={k}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 300, damping: 24 }}
              className={cn(
                "bg-gradient-to-br rounded-2xl p-4 border",
                c.bg, c.border,
                k === "24K" && "col-span-2"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white/90">{k}</span>
                    <span className="text-[10px] text-white/40">{c.sub}</span>
                  </div>
                  <p className={cn("font-black mt-1", k === "24K" ? "text-3xl" : "text-2xl", c.text)}>
                    {Math.round(price).toLocaleString()}
                  </p>
                </div>
                {k === "24K" && <span className="text-4xl">🥇</span>}
              </div>
              <p className="text-[11px] text-white/30 mt-1.5">₪ / غرام</p>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-1">{market.gold.source.split(" (")[0]}</p>
    </div>
  );
}

// ── META per type ─────────────────────────────────────────────────────────────

const TYPE_META: Record<KpiPillType, { emoji: string; title: string; accent: string }> = {
  weather:  { emoji: "🌤",  title: "الطقس",          accent: "from-muted/60" },
  prayer:   { emoji: "🕌",  title: "مواقيت الصلاة",  accent: "from-emerald-950/40" },
  fuel:     { emoji: "⛽",  title: "أسعار الوقود",   accent: "from-orange-950/40" },
  currency: { emoji: "💵",  title: "أسعار الصرف",    accent: "from-green-950/40" },
  gold:     { emoji: "🥇",  title: "أسعار الذهب",   accent: "from-yellow-950/40" },
};

// ── Main component ────────────────────────────────────────────────────────────

export function KpiDetailSheet({ type, onClose }: KpiDetailSheetProps) {
  const { data: market } = useMarketData();
  const { data: weather } = useWeatherData();
  const { data: prayer } = usePrayerTimes();

  const meta = type ? TYPE_META[type] : null;

  // Close on Escape
  useEffect(() => {
    if (!type) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [type, onClose]);

  return (
    <AnimatePresence>
      {type && meta && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
            className="fixed bottom-0 inset-x-0 z-[91] flex flex-col bg-background rounded-t-3xl overflow-hidden"
            style={{ maxHeight: "85dvh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>

            {/* Header gradient */}
            <div className={cn(
              "flex items-center justify-between px-5 pt-2 pb-4 shrink-0 bg-gradient-to-b to-transparent",
              meta.accent
            )}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{meta.emoji}</span>
                <h2 className="text-lg font-black text-foreground">{meta.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground transition-colors active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2">
              {type === "weather"  && weather  && <WeatherContent  weather={weather} />}
              {type === "prayer"   && prayer   && <PrayerContent   prayer={prayer} />}
              {type === "fuel"     && market   && <FuelContent     market={market} />}
              {type === "currency" && market   && <CurrencyContent market={market} />}
              {type === "gold"     && market   && <GoldContent     market={market} />}

              {/* Loading state */}
              {((type === "weather" && !weather) ||
                (type === "prayer"  && !prayer)  ||
                ((type === "fuel" || type === "currency" || type === "gold") && !market)) && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
                  />
                  <p className="text-sm">جارٍ التحميل...</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
