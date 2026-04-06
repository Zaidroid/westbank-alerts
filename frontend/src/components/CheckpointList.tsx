import { useState, useMemo } from "react";
import type { Checkpoint, CheckpointQueryParams } from "@/lib/api";
import {
  Search, Loader2, MapPin, AlertTriangle, ChevronDown,
  CircleCheck, CircleX, Shield, Clock, Users, Navigation, ArrowDown,
} from "lucide-react";
import { useLang, getStatusLabel, formatRelativeTime } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCheckpoints, useCheckpointSummary } from "@/hooks/useCheckpoints";
import { getCheckpointRegions } from "@/lib/api/endpoints";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface CheckpointListProps {
  searchQuery: string;
  onCheckpointClick: (c: Checkpoint) => void;
}

const STATUS_ICON: Record<string, { color: string; bg: string; border: string }> = {
  open: { color: "text-green-500", bg: "bg-green-500", border: "border-green-500/30" },
  closed: { color: "text-destructive", bg: "bg-destructive", border: "border-destructive/30" },
  congested: { color: "text-orange-500", bg: "bg-orange-500", border: "border-orange-500/30" },
  military: { color: "text-purple-500", bg: "bg-purple-500", border: "border-purple-500/30" },
  slow: { color: "text-amber-500", bg: "bg-amber-500", border: "border-amber-500/30" },
  unknown: { color: "text-muted-foreground", bg: "bg-muted-foreground", border: "border-border" },
};

const CITIES: { key: string; ar: string; en: string }[] = [
  { key: "ramallah", ar: "رام الله", en: "Ramallah" },
  { key: "jerusalem", ar: "القدس", en: "Jerusalem" },
  { key: "nablus", ar: "نابلس", en: "Nablus" },
  { key: "hebron", ar: "الخليل", en: "Hebron" },
  { key: "bethlehem", ar: "بيت لحم", en: "Bethlehem" },
  { key: "jenin", ar: "جنين", en: "Jenin" },
  { key: "tulkarm", ar: "طولكرم", en: "Tulkarm" },
  { key: "jericho", ar: "أريحا", en: "Jericho" },
  { key: "qalqilya", ar: "قلقيلية", en: "Qalqilya" },
  { key: "salfit", ar: "سلفيت", en: "Salfit" },
  { key: "tubas", ar: "طوباس", en: "Tubas" },
];

function getCityLabel(key: string, lang: string): string {
  const city = CITIES.find(c => c.key === key);
  return city ? (lang === "ar" ? city.ar : city.en) : key;
}

/** Pill selector for picking a city */
function CityPicker({ selected, onSelect, lang, label }: {
  selected: string | null;
  onSelect: (key: string | null) => void;
  lang: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 w-full px-4 py-3.5 rounded-2xl text-start transition-all",
          selected
            ? "bg-primary/10 border-2 border-primary/40 shadow-sm"
            : "bg-card border-2 border-dashed border-border hover:border-primary/30"
        )}
      >
        <MapPin className={cn("h-5 w-5 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</div>
          <div className={cn("text-base font-bold truncate", selected ? "text-foreground" : "text-muted-foreground/50")} dir="auto">
            {selected ? getCityLabel(selected, lang) : "—"}
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-[280px] overflow-y-auto"
          >
            {CITIES.map(city => (
              <button
                key={city.key}
                onClick={() => { onSelect(city.key); setOpen(false); }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-start transition-colors",
                  selected === city.key ? "bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full shrink-0",
                  selected === city.key ? "bg-primary" : "bg-muted-foreground/30"
                )} />
                <span className="font-medium text-sm" dir="auto">
                  {lang === "ar" ? city.ar : city.en}
                </span>
                {lang !== "ar" && (
                  <span className="text-xs text-muted-foreground ms-auto" dir="rtl">{city.ar}</span>
                )}
                {lang === "ar" && city.en && (
                  <span className="text-xs text-muted-foreground ms-auto" dir="ltr">{city.en}</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Compact checkpoint card for side-by-side layout */
function CheckpointCard({ cp, onClick, t, lang, compact }: { cp: Checkpoint; onClick: (c: Checkpoint) => void; t: any; lang: string; compact?: boolean }) {
  const style = STATUS_ICON[cp.status] || STATUS_ICON.unknown;
  const isDanger = cp.status === "closed" || cp.status === "military";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(cp)}
      className={cn(
        "flex flex-col w-full p-2.5 rounded-xl text-start transition-all active:scale-[0.98]",
        "bg-card border shadow-sm hover:shadow-md",
        isDanger ? style.border : "border-border hover:border-green-500/20",
      )}
    >
      {/* Status icon + badge */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="relative shrink-0">
          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", isDanger ? "bg-destructive/10" : "bg-green-500/10")}>
            {cp.status === "closed" && <CircleX className={cn("h-4 w-4", style.color)} />}
            {cp.status === "military" && <Shield className={cn("h-4 w-4", style.color)} />}
            {cp.status === "congested" && <Users className={cn("h-4 w-4", style.color)} />}
            {cp.status === "slow" && <Clock className={cn("h-4 w-4", style.color)} />}
            {cp.status === "open" && <CircleCheck className={cn("h-4 w-4", style.color)} />}
            {cp.status === "unknown" && <MapPin className={cn("h-4 w-4", style.color)} />}
          </div>
          {isDanger && (
            <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
          )}
        </div>
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full",
          isDanger ? "bg-destructive/10 text-destructive" :
          cp.status === "congested" || cp.status === "slow" ? "bg-orange-500/10 text-orange-500" :
          "bg-green-500/10 text-green-600 dark:text-green-400"
        )}>
          {getStatusLabel(cp.status, t)}
        </span>
      </div>

      {/* Name */}
      <div className="font-bold text-sm leading-snug line-clamp-2" dir="auto">
        {lang === "ar" ? cp.name_ar : (cp.name_en || cp.name_ar)}
      </div>
      {cp.name_en && lang === "ar" && (
        <div className="text-[10px] text-muted-foreground truncate mt-0.5" dir="ltr">{cp.name_en}</div>
      )}
      {cp.name_ar && lang !== "ar" && (
        <div className="text-[10px] text-muted-foreground truncate mt-0.5" dir="rtl">{cp.name_ar}</div>
      )}

      {/* Time */}
      <div className="text-[10px] font-mono text-muted-foreground mt-1.5" dir="ltr">
        {cp.last_updated ? formatRelativeTime(new Date(cp.last_updated), t) : "—"}
      </div>
    </motion.button>
  );
}

export function CheckpointList({ searchQuery, onCheckpointClick }: CheckpointListProps) {
  const { t, lang } = useLang();
  const [origin, setOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const actualSearch = localSearch || searchQuery;
  const { debouncedValue: debouncedSearch } = useDebouncedValue(actualSearch, 300);

  // If either origin or destination is set, filter by those regions
  const selectedRegions = [origin, destination].filter(Boolean) as string[];
  const hasRoute = selectedRegions.length > 0;

  // Fetch all if route mode, or filter by single region
  const filters: CheckpointQueryParams | undefined = selectedRegions.length === 1 ? { region: selectedRegions[0] } : undefined;
  const { data, isLoading } = useCheckpoints(filters);
  const { data: summary } = useCheckpointSummary();

  const allCheckpoints = data?.checkpoints ?? [];

  // For route mode with two cities, filter client-side for both regions
  const regionFiltered = useMemo(() => {
    if (selectedRegions.length === 2) {
      return allCheckpoints.filter(c => selectedRegions.includes(c.region?.toLowerCase() ?? ""));
    }
    return allCheckpoints;
  }, [allCheckpoints, selectedRegions]);

  // Apply text search
  const filtered = useMemo(() => {
    let result = regionFiltered;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(c =>
        c.name_en?.toLowerCase().includes(q) ||
        c.name_ar?.includes(debouncedSearch) ||
        c.canonical_key?.includes(debouncedSearch) ||
        c.region?.toLowerCase().includes(q) ||
        c.status_raw?.includes(debouncedSearch)
      );
    }
    return result;
  }, [regionFiltered, debouncedSearch]);

  // Group: blocked first, then warnings, then clear
  const blocked = useMemo(() => filtered.filter(c => c.status === "closed" || c.status === "military"), [filtered]);
  const warnings = useMemo(() => filtered.filter(c => c.status === "congested" || c.status === "slow"), [filtered]);
  const clear = useMemo(() => filtered.filter(c => c.status === "open" || c.status === "unknown"), [filtered]);

  const sortByTime = (a: Checkpoint, b: Checkpoint) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();

  const byStatus = summary?.by_status ?? {} as Record<string, number>;
  const totalBlocked = hasRoute ? blocked.length : ((byStatus as any).closed ?? 0) + ((byStatus as any).military ?? 0);

  return (
    <div className="flex flex-col h-full min-h-0 gap-0">
      {/* Route planner header */}
      <div className="shrink-0 px-1 pb-3">
        {/* From / To pickers */}
        <div className="flex flex-col gap-2 relative">
          <CityPicker
            selected={origin}
            onSelect={setOrigin}
            lang={lang}
            label={lang === "ar" ? "من أين" : "From"}
          />

          {/* Connector line between pickers */}
          <div className="absolute top-[56px] start-7 w-0.5 h-[18px] bg-border z-10" />
          <div className="flex items-center justify-center -my-0.5 z-20">
            <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center">
              <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <div className="absolute bottom-[56px] start-7 w-0.5 h-[18px] bg-border z-10" />

          <CityPicker
            selected={destination}
            onSelect={setDestination}
            lang={lang}
            label={lang === "ar" ? "إلى أين" : "To"}
          />
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 mt-3">
          {hasRoute && (
            <button
              onClick={() => { setOrigin(null); setDestination(null); }}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full border border-border hover:bg-muted/50 transition-colors"
            >
              {t.clearRoute}
            </button>
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors",
              showSearch ? "border-primary/40 bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Search className="h-3 w-3" />
            {t.filter}
          </button>
          {/* Status summary pills */}
          <div className="flex items-center gap-1.5 ms-auto">
            {totalBlocked > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                <CircleX className="h-3 w-3" /> {totalBlocked}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
              <CircleCheck className="h-3 w-3" /> {hasRoute ? clear.length : (byStatus as any).open ?? 0}
            </span>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="relative mt-2">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder={t.searchPlaceholder}
                  className="w-full h-10 ps-10 pe-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Route status banner */}
      {hasRoute && !isLoading && (
        <div className={cn(
          "shrink-0 mx-1 mb-3 p-3 rounded-xl flex items-center gap-3",
          totalBlocked > 0
            ? "bg-destructive/5 border border-destructive/20"
            : "bg-green-500/5 border border-green-500/20"
        )}>
          {totalBlocked > 0 ? (
            <>
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <div className="text-sm font-bold text-destructive">{t.checkpointsBlocked}</div>
                <div className="text-xs text-muted-foreground">
                  {blocked.length} {t.blockedCheckpoints} · {warnings.length} {t.congested} · {clear.length} {t.safeToPass}
                </div>
              </div>
            </>
          ) : (
            <>
              <CircleCheck className="h-5 w-5 text-green-500 shrink-0" />
              <div>
                <div className="text-sm font-bold text-green-600 dark:text-green-400">{t.checkpointsClear}</div>
                <div className="text-xs text-muted-foreground">
                  {filtered.length} {t.checkpoints} · {clear.length} {t.safeToPass}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Checkpoint cards - side by side: blocked | open */}
      <div className="flex-1 min-h-0 overflow-auto px-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Navigation className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <div className="text-sm text-muted-foreground">{hasRoute ? t.noCheckpointsFound : t.selectRegion}</div>
          </div>
        ) : (
          <div className="flex gap-2.5 pb-4 items-start">
            {/* LEFT: Blocked + warnings */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 px-0.5 mb-0.5">
                <CircleX className="h-3.5 w-3.5 text-destructive" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-destructive">{t.blockedCheckpoints}</span>
                <span className="ms-auto text-[11px] font-mono text-destructive/60">{blocked.length + warnings.length}</span>
              </div>
              <AnimatePresence>
                {[...blocked, ...warnings].sort(sortByTime).map(cp => (
                  <CheckpointCard key={cp.canonical_key} cp={cp} onClick={onCheckpointClick} t={t} lang={lang} compact />
                ))}
                {blocked.length + warnings.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-green-500/30 bg-green-500/5 text-center"
                  >
                    <CircleCheck className="h-6 w-6 text-green-500 mb-1" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">{t.allClear}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT: Open / safe */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 px-0.5 mb-0.5">
                <CircleCheck className="h-3.5 w-3.5 text-green-500" />
                <span className="text-[11px] font-bold uppercase tracking-wide text-green-600 dark:text-green-400">{t.safeToPass}</span>
                <span className="ms-auto text-[11px] font-mono text-green-600/60 dark:text-green-400/60">{clear.length}</span>
              </div>
              <AnimatePresence>
                {[...clear].sort(sortByTime).map(cp => (
                  <CheckpointCard key={cp.canonical_key} cp={cp} onClick={onCheckpointClick} t={t} lang={lang} compact />
                ))}
                {clear.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-border text-center"
                  >
                    <span className="text-xs text-muted-foreground">{t.noData}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
