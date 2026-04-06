import { Settings, Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useMarketData, useWeatherData, usePrayerTimes, getNextPrayer } from "@/hooks/useContextualData";
import type { KpiPillType } from "@/components/mobile/KpiDetailSheet";
import type { ConnectionStatus } from "@/lib/api/types";

interface MobileHeaderProps {
  connectionStatus: ConnectionStatus;
  onSettingsPress: () => void;
  newUpdateCount?: number;
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

// ── Individual pill ─────────────────────────────────────────────────────────

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
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm shrink-0 select-none transition-opacity active:opacity-70",
        highlight
          ? "bg-primary/15 border border-primary/25"
          : "bg-muted/40 border border-border/20",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
    >
      <span className="text-base leading-none">{emoji}</span>
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        : (
          <span className={cn("font-semibold", highlight ? "text-primary" : "text-foreground/90")}>
            {value}
          </span>
        )
      }
      {label && !loading && (
        <span className="text-muted-foreground font-normal">{label}</span>
      )}
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function MobileHeader({
  connectionStatus,
  onSettingsPress,
  newUpdateCount = 0,
  onPillPress,
}: MobileHeaderProps) {
  const { t } = useLang();

  const { data: market, isLoading: mLoading } = useMarketData();
  const { data: weather, isLoading: wLoading } = useWeatherData();
  const { data: prayer, isLoading: pLoading } = usePrayerTimes();

  const isConnected  = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";

  // Pick Ramallah as default weather city
  const ramallahWeather = weather?.cities?.find(c => c.name === "Ramallah") ?? weather?.cities?.[0];

  // Next prayer from Ramallah
  const ramallahPrayer = prayer?.cities?.find(c => c.name === "Ramallah") ?? prayer?.cities?.[0];
  const nextPrayer = ramallahPrayer ? getNextPrayer(ramallahPrayer) : null;

  // Market values
  const usd = market?.currency?.rates?.["USD"];
  const gold24k = market?.gold?.karats_ils_gram?.["24K"];
  const fuel95 = market?.fuel?.prices_ils_liter?.gasoline_95;

  return (
    <div className="shrink-0 bg-background/90 backdrop-blur border-b border-border/30">
      {/* Top row — title centered with flanking controls */}
      <div className="relative flex items-center justify-between px-4 pt-3 pb-2">
        {/* Left: connection indicator */}
        <div className="flex items-center gap-1.5 min-w-[72px]">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : isConnecting ? (
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            isConnected ? "text-emerald-400" : isConnecting ? "text-amber-400" : "text-red-400"
          )}>
            {isConnected ? "مباشر" : isConnecting ? "جارٍ..." : "غير متصل"}
          </span>
          {isConnected && newUpdateCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {newUpdateCount}
            </span>
          )}
        </div>

        {/* Center: app title — absolute center */}
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <div className="text-center">
            <h1 className="text-lg font-black text-foreground tracking-tight leading-tight">
              الضفة مباشر
            </h1>
          </div>
        </div>

        {/* Right: settings */}
        <button
          onClick={onSettingsPress}
          className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors active:scale-90 z-10"
        >
          <Settings className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* KPI strip — scrollable, scrollbar fully hidden */}
      <div
        className="flex items-center gap-2 px-3 pb-3 overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
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
  );
}
