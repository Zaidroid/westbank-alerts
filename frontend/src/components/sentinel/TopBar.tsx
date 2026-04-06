import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/api/types";
import { Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useMarketData, useWeatherData, usePrayerTimes, getNextPrayer } from "@/hooks/useContextualData";
import type { KpiPillType } from "@/components/mobile/KpiDetailSheet";

interface TopBarProps {
  locationName: string;
  connectionStatus: ConnectionStatus;
  onSosPress?: () => void;
  onPillPress: (type: KpiPillType) => void;
}

// Weather code → emoji (WMO codes)
function weatherEmoji(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code <= 2) return isDay ? "🌤" : "🌤";
  if (code <= 3) return "☁️";
  if (code <= 49) return "🌫";
  if (code <= 69) return "🌧";
  if (code <= 79) return "❄️";
  if (code <= 82) return "🌦";
  if (code <= 99) return "⛈";
  return "🌡";
}

function Pill({
  emoji,
  value,
  label,
  highlight,
  loading,
  onClick,
}: {
  emoji: string;
  value: string;
  label?: string;
  highlight?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-headline shrink-0 select-none border border-outline-variant/20 backdrop-blur-3xl transition-all active:scale-95 shadow-sm hover:shadow-md",
        highlight
          ? "bg-secondary/15 border-secondary/30 text-secondary shadow-[0_0_20px_rgba(254,179,0,0.2)]"
          : "bg-surface-container-high/60 text-on-surface hover:bg-surface-container-highest",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
    >
      <span className="text-base leading-none drop-shadow-sm">{emoji}</span>
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin text-on-surface-variant" />
        : (
          <span className={cn("font-bold tracking-wide text-sm", highlight ? "text-secondary" : "text-on-surface")}>
            {value}
          </span>
        )
      }
      {label && !loading && (
        <span className="text-on-surface-variant text-[11px] uppercase font-label font-bold tracking-widest leading-none mt-[1px]">{label}</span>
      )}
    </button>
  );
}

export function TopBar({ locationName, connectionStatus, onSosPress, onPillPress }: TopBarProps) {
  const { t, dir } = useLang();
  const [clockTime, setClockTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const id = setInterval(() => {
      setClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const { data: market, isLoading: mLoading } = useMarketData();
  const { data: weather, isLoading: wLoading } = useWeatherData();
  const { data: prayer, isLoading: pLoading } = usePrayerTimes();

  const isConnected  = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";

  // Pick Ramallah as default weather city
  const ramallahWeather = weather?.cities?.find(c => c.name === "Ramallah") ?? weather?.cities?.[0];
  const ramallahPrayer = prayer?.cities?.find(c => c.name === "Ramallah") ?? prayer?.cities?.[0];
  const nextPrayer = ramallahPrayer ? getNextPrayer(ramallahPrayer) : null;

  const usd = market?.currency?.rates?.["USD"];
  const gold24k = market?.gold?.karats_ils_gram?.["24K"];
  const fuel95 = market?.fuel?.prices_ils_liter?.gasoline_95;

  return (
    <header className="sticky top-0 z-40 w-full pointer-events-none pb-2"
      style={{
        paddingTop: "var(--safe-area-inset-top, 0px)",
      }}
    >
      <div className="pointer-events-auto flex flex-col gap-3">
        {/* 1. Header Information Row */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col drop-shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-label font-bold tracking-widest text-on-surface uppercase drop-shadow">
                  {t.location || "Location"}
                </span>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isConnected ? "bg-tertiary glow-tertiary shadow-[0_0_8px_currentColor]" : 
                  isConnecting ? "bg-secondary" : "bg-error"
                )} />
              </div>
              <span className="text-lg font-headline font-bold text-on-surface drop-shadow-md border-b-[1.5px] border-secondary/50 inline-block pb-0.5 mt-0.5">
                {locationName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-surface-container-high/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/20">
              <span className="material-symbols-outlined text-on-surface-variant text-[14px]">schedule</span>
              <span className="text-xs font-headline font-bold text-on-surface tabular-nums">
                {clockTime}
              </span>
            </div>
          </div>
        </div>

        {/* 2. KPI Contextual Pills Row */}
        <div
          className="flex items-center gap-2.5 px-4 pb-4 overflow-x-auto"
          dir={dir}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
        >
          {/* Weather */}
          {wLoading ? (
            <Pill emoji="🌡" value="" loading />
          ) : ramallahWeather ? (
            <Pill
              emoji={weatherEmoji(ramallahWeather.weather_code, ramallahWeather.is_day)}
              value={`${Math.round(ramallahWeather.temp_c)}°`}
              label={ramallahWeather.name_ar}
              onClick={() => onPillPress("weather")}
            />
          ) : null}

          {/* Fuel 95 */}
          {mLoading ? (
            <Pill emoji="⛽" value="" loading />
          ) : fuel95 != null ? (
            <Pill emoji="⛽" value={`${fuel95}`} label="₪/ل" onClick={() => onPillPress("fuel")} />
          ) : null}

          {/* USD/ILS */}
          {mLoading ? (
            <Pill emoji="💵" value="" loading />
          ) : usd != null ? (
            <Pill emoji="💵" value={usd.toFixed(2)} label="₪" onClick={() => onPillPress("currency")} />
          ) : null}

          {/* Gold 24K */}
          {mLoading ? (
            <Pill emoji="🥇" value="" loading />
          ) : gold24k != null ? (
            <Pill emoji="🥇" value={Math.round(gold24k).toLocaleString()} label="₪/غ" onClick={() => onPillPress("gold")} />
          ) : null}

          {/* Next prayer — last */}
          {pLoading ? (
            <Pill emoji="🕌" value="" loading />
          ) : nextPrayer ? (
            <Pill
              emoji="🕌"
              value={nextPrayer.time}
              label={nextPrayer.nameAr}
              highlight
              onClick={() => onPillPress("prayer")}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}
