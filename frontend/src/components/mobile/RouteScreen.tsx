/**
 * RouteScreen — immersive 4-phase route experience.
 *
 * Phase 1 (from):         Pick origin city or use current location
 * Phase 2 (to):           Pick destination (filtered by valid routes)
 * Phase 3 (checkpoints):  Confirm / deselect checkpoints you'll pass through
 * Phase 4 (journey):      Live timeline with expandable cards + bypass for closed CPs
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Navigation, MapPin, ChevronLeft, Bookmark, BookmarkCheck,
  AlertTriangle, CheckCircle2, Clock, ArrowLeftRight, SkipForward,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLang, formatRelativeTime, getStatusLabel } from "@/lib/i18n";
import { getAllRoutes, getRouteHealth } from "@/lib/routes";
import { CheckpointCard } from "@/components/mobile/CheckpointsScreen";
import type { Route, RouteCheckpoint } from "@/lib/routes";
import type { Checkpoint, CheckpointUpdate, CheckpointStatus } from "@/lib/api/types";
import type { UserLocation } from "@/hooks/useGeolocation";

// ── City data ─────────────────────────────────────────────────────────────────

const CITY_DATA: Record<string, { ar: string; lat: number; lng: number }> = {
  Ramallah:  { ar: "رام الله",  lat: 31.900, lng: 35.200 },
  Jerusalem: { ar: "القدس",     lat: 31.770, lng: 35.230 },
  Bethlehem: { ar: "بيت لحم",   lat: 31.700, lng: 35.200 },
  Hebron:    { ar: "الخليل",    lat: 31.530, lng: 35.100 },
  Nablus:    { ar: "نابلس",     lat: 32.220, lng: 35.260 },
  Jenin:     { ar: "جنين",      lat: 32.460, lng: 35.300 },
  Jericho:   { ar: "أريحا",     lat: 31.850, lng: 35.460 },
  Tulkarm:   { ar: "طولكرم",    lat: 32.310, lng: 35.030 },
  Qalqilya:  { ar: "قلقيليه",   lat: 32.190, lng: 34.970 },
  Salfit:    { ar: "سلفيت",     lat: 32.080, lng: 35.170 },
  Tubas:     { ar: "طوباس",     lat: 32.320, lng: 35.370 },
};

function cityAr(key: string) { return CITY_DATA[key]?.ar ?? key; }

function getNearestCity(lat: number, lng: number): string {
  let nearest = "Ramallah";
  let minD = Infinity;
  for (const [k, c] of Object.entries(CITY_DATA)) {
    const d = (lat - c.lat) ** 2 + (lng - c.lng) ** 2;
    if (d < minD) { minD = d; nearest = k; }
  }
  return nearest;
}

/** All cities that appear as from OR to in any route */
function allCities(): string[] {
  const s = new Set<string>();
  getAllRoutes().forEach(r => { s.add(r.from); s.add(r.to); });
  return Array.from(s).sort();
}

/** Valid destinations from a given origin */
function getDestinations(from: string): string[] {
  return getAllRoutes()
    .filter(r => r.from === from || r.to === from)
    .map(r => r.from === from ? r.to : r.from);
}

/** Find the route for a city pair (bidirectional) */
function findRoute(from: string, to: string): Route | null {
  return getAllRoutes().find(r =>
    (r.from === from && r.to === to) ||
    (r.from === to && r.to === from)
  ) ?? null;
}

// ── Status config ──────────────────────────────────────────────────────────────

const S_DOT: Record<string, string> = {
  open: "bg-emerald-400", closed: "bg-red-500", congested: "bg-amber-400",
  military: "bg-purple-500", slow: "bg-yellow-400", unknown: "bg-muted-foreground/30",
};
const S_RING: Record<string, string> = {
  open: "ring-emerald-500/30", closed: "ring-red-500/50", congested: "ring-amber-500/40",
  military: "ring-purple-500/50", slow: "ring-yellow-500/30", unknown: "ring-border/30",
};
const S_LINE: Record<string, string> = {
  open: "bg-emerald-600/25", closed: "bg-red-600/40", congested: "bg-amber-600/30",
  military: "bg-purple-600/35", slow: "bg-yellow-600/20", unknown: "bg-border/15",
};
const S_TEXT: Record<string, string> = {
  open: "text-emerald-400", closed: "text-red-400", congested: "text-amber-400",
  military: "text-purple-400", slow: "text-yellow-400", unknown: "text-muted-foreground",
};

// ── Slide animation ────────────────────────────────────────────────────────────

const stepVariants = {
  enter:  { opacity: 0, y: 16 },
  center: { opacity: 1, y: 0 },
  exit:   { opacity: 0, y: -10 },
};

// ── Phase type ─────────────────────────────────────────────────────────────────

type Phase = "from" | "to" | "checkpoints" | "journey";

const PHASE_STEPS: Record<Phase, number> = { from: 1, to: 2, checkpoints: 3, journey: 4 };

// ── Origin city list (for "from" step — matches "to" design language) ────────

function OriginCityList({ cities, checkpoints, onSelect }: {
  cities: string[];
  checkpoints: Checkpoint[];
  onSelect: (city: string) => void;
}) {
  // Count checkpoints per region (city maps loosely to regions)
  const cpMap: Record<string, string> = {};
  checkpoints.forEach(cp => { cpMap[cp.canonical_key] = cp.status; });

  return (
    <div className="space-y-2">
      {cities.map((city, i) => {
        // Count routes available from this city
        const dests = getDestinations(city);
        // Aggregate checkpoint statuses across all routes from this city
        let openCount = 0, closedCount = 0, congestedCount = 0;
        const seenKeys = new Set<string>();
        dests.forEach(dest => {
          const route = findRoute(city, dest);
          route?.checkpoints.forEach(c => {
            if (seenKeys.has(c.canonical_key)) return;
            seenKeys.add(c.canonical_key);
            const s = cpMap[c.canonical_key];
            if (s === "open") openCount++;
            else if (s === "closed" || s === "military") closedCount++;
            else if (s === "congested" || s === "slow") congestedCount++;
          });
        });

        return (
          <motion.button
            key={city}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(city)}
            className="w-full flex items-center gap-3.5 bg-card/50 border border-border/30 rounded-2xl px-4 py-4 text-start active:scale-[0.98] transition-all"
          >
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-foreground">{cityAr(city)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dests.length} وجهة · {seenKeys.size} حاجز
              </p>
            </div>

            {/* Mini status indicators */}
            <div className="flex items-center gap-1.5 shrink-0">
              {closedCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {closedCount}
                </span>
              )}
              {congestedCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {congestedCount}
                </span>
              )}
              {openCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {openCount}
                </span>
              )}
              <ChevronLeft className="w-4 h-4 text-muted-foreground/40" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Destination list (for "to" step — vertical with route preview) ──────────

function DestinationList({ destinations, from, checkpoints, onSelect }: {
  destinations: string[];
  from: string;
  checkpoints: Checkpoint[];
  onSelect: (city: string) => void;
}) {
  return (
    <div className="space-y-2">
      {destinations.map((city, i) => {
        const route = findRoute(from, city);
        // Count statuses on this route
        const cpMap: Record<string, string> = {};
        checkpoints.forEach(cp => { cpMap[cp.canonical_key] = cp.status; });
        const routeCps = route?.checkpoints ?? [];
        const openCount = routeCps.filter(c => cpMap[c.canonical_key] === "open").length;
        const closedCount = routeCps.filter(c => {
          const s = cpMap[c.canonical_key];
          return s === "closed" || s === "military";
        }).length;
        const congestedCount = routeCps.filter(c => {
          const s = cpMap[c.canonical_key];
          return s === "congested" || s === "slow";
        }).length;

        return (
          <motion.button
            key={city}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(city)}
            className="w-full flex items-center gap-3.5 bg-card/50 border border-border/30 rounded-2xl px-4 py-4 text-start active:scale-[0.98] transition-all"
          >
            {/* City name */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-foreground">{cityAr(city)}</p>
              {route && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {route.distance_km} كم · ~{route.estimated_time_min} د · {routeCps.length} حاجز
                </p>
              )}
            </div>

            {/* Mini status indicators */}
            <div className="flex items-center gap-1.5 shrink-0">
              {closedCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {closedCount}
                </span>
              )}
              {congestedCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {congestedCount}
                </span>
              )}
              {openCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {openCount}
                </span>
              )}
              <ChevronLeft className="w-4 h-4 text-muted-foreground/40" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Journey checkpoint row (spine + expandable card + bypass banner) ─────────

function JourneyCheckpointRow({
  routeCp,
  liveCp,
  updates,
  isLast,
  isExpanded,
  onToggle,
  onBypass,
}: {
  routeCp: RouteCheckpoint;
  liveCp: Checkpoint | undefined;
  updates: CheckpointUpdate[];
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onBypass: () => void;
}) {
  const { t, lang } = useLang();
  const status = liveCp?.status ?? "unknown";
  const isClosed = status === "closed" || status === "military";

  return (
    <div className="flex gap-3">
      {/* Transit spine */}
      <div className="flex flex-col items-center w-5 shrink-0 pt-4">
        <motion.div
          animate={isClosed ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.6, repeat: isClosed ? Infinity : 0, repeatDelay: 2 }}
          className={cn(
            "w-3.5 h-3.5 rounded-full ring-2 shrink-0",
            S_DOT[status] ?? S_DOT.unknown,
            S_RING[status] ?? S_RING.unknown,
            isClosed && "ring-offset-1 ring-offset-background"
          )}
        />
        {!isLast && (
          <div className={cn("w-0.5 flex-1 min-h-[24px] mt-1", S_LINE[status] ?? S_LINE.unknown)} />
        )}
      </div>

      {/* Card + bypass */}
      <div className="flex-1 min-w-0 pb-2">
        {liveCp ? (
          <CheckpointCard
            checkpoint={liveCp}
            updates={updates}
            isExpanded={isExpanded}
            onToggle={onToggle}
          />
        ) : (
          /* No live data — static placeholder */
          <div className="flex items-center gap-3 bg-muted/20 border border-border/15 rounded-2xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground/70">{routeCp.name_ar}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.noData}</p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {routeCp.distance_from_start_km} كم
            </span>
          </div>
        )}

        {/* Bypass banner for closed/military */}
        {isClosed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-1.5 flex items-center justify-between px-3 py-2.5 bg-red-950/40 border border-red-700/30 rounded-xl overflow-hidden"
          >
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-xs text-red-300 font-medium">
                {status === "military" ? "حاجز عسكري" : "الحاجز مغلق"} · ابحث عن بديل
              </span>
            </div>
            <button
              onClick={onBypass}
              className="flex items-center gap-1 text-xs text-primary font-semibold active:opacity-70 shrink-0 ms-2"
            >
              <SkipForward className="w-3 h-3" />
              تخطّي
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface RouteScreenProps {
  activeRoute: Route | null;
  checkpoints: Checkpoint[];
  checkpointUpdates: CheckpointUpdate[];
  userLocation?: UserLocation | null;
  onRouteConfirmed: (route: Route) => void;
  onClearRoute: () => void;
  isRouteSaved?: boolean;
  onSaveRoute?: () => void;
}

export function RouteScreen({
  activeRoute,
  checkpoints,
  checkpointUpdates,
  userLocation,
  onRouteConfirmed,
  onClearRoute,
  isRouteSaved,
  onSaveRoute,
}: RouteScreenProps) {
  const { t, lang } = useLang();

  const [phase, setPhase] = useState<Phase>(activeRoute ? "journey" : "from");
  const [fromCity, setFromCity] = useState<string | null>(null);
  const [toCity, setToCity] = useState<string | null>(null);
  const [pendingRoute, setPendingRoute] = useState<Route | null>(activeRoute);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(activeRoute?.checkpoints.map(c => c.canonical_key) ?? [])
  );
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Sync when parent confirms / clears route externally (e.g. from settings)
  useEffect(() => {
    if (activeRoute) {
      setPendingRoute(activeRoute);
      setSelectedKeys(new Set(activeRoute.checkpoints.map(c => c.canonical_key)));
      setPhase("journey");
    }
  }, [activeRoute?.id]);

  // Resolve "use my location" → nearest city
  const handleUseLocation = useCallback(() => {
    const city = userLocation
      ? getNearestCity(userLocation.latitude, userLocation.longitude)
      : "Ramallah";
    setFromCity(city);
    setPhase("to");
  }, [userLocation]);

  // City selections
  const handleFromSelect = useCallback((city: string) => {
    setFromCity(city);
    setToCity(null);
    setPhase("to");
  }, []);

  const handleToSelect = useCallback((city: string) => {
    if (!fromCity) return;
    const route = findRoute(fromCity, city);
    if (!route) return;
    setToCity(city);
    setPendingRoute(route);
    setSelectedKeys(new Set(route.checkpoints.map(c => c.canonical_key)));
    setPhase("checkpoints");
  }, [fromCity]);

  const handleStartJourney = useCallback(() => {
    if (!pendingRoute) return;
    onRouteConfirmed(pendingRoute);
    setPhase("journey");
  }, [pendingRoute, onRouteConfirmed]);

  const handleChangeRoute = useCallback(() => {
    setFromCity(null);
    setToCity(null);
    setPhase("from");
  }, []);

  // Derived data for journey view
  const checkpointMap = useMemo(() => {
    const m: Record<string, Checkpoint> = {};
    checkpoints.forEach(cp => { m[cp.canonical_key] = cp; });
    return m;
  }, [checkpoints]);

  const updatesByKey = useMemo(() => {
    const m: Record<string, CheckpointUpdate[]> = {};
    checkpointUpdates.forEach(u => { (m[u.canonical_key] ??= []).push(u); });
    return m;
  }, [checkpointUpdates]);

  const health = useMemo(() => {
    if (!pendingRoute) return null;
    const sm: Record<string, string> = {};
    checkpoints.forEach(cp => { sm[cp.canonical_key] = cp.status; });
    return getRouteHealth(pendingRoute, sm);
  }, [pendingRoute, checkpoints]);

  const activeCps = useMemo(() =>
    (pendingRoute?.checkpoints ?? []).filter(cp => selectedKeys.has(cp.canonical_key))
  , [pendingRoute, selectedKeys]);

  const blockedCount = useMemo(() =>
    activeCps.filter(cp => {
      const s = checkpointMap[cp.canonical_key]?.status;
      return s === "closed" || s === "military";
    }).length
  , [activeCps, checkpointMap]);

  // ── PHASE: from ─────────────────────────────────────────────────────────────
  if (phase === "from") {
    const cities = allCities();
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <StepHeader
          step={1}
          title="من أين ستنطلق؟"
          subtitle="اختر مدينة أو موقعك الحالي"
          canGoBack={!!activeRoute}
          onBack={() => setPhase("journey")}
        />
        <motion.div
          key="from"
          variants={stepVariants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto px-4 pb-6 space-y-3 pt-1"
        >
          {/* Use location */}
          <button
            onClick={handleUseLocation}
            className="w-full flex items-center gap-3 bg-primary/10 border border-primary/25 rounded-2xl px-4 py-3.5 active:scale-[0.98] transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="text-start">
              <p className="text-sm font-bold text-primary">موقعي الحالي</p>
              {userLocation
                ? <p className="text-xs text-muted-foreground">تم تحديد موقعك</p>
                : <p className="text-xs text-muted-foreground">سيتم اكتشاف أقرب مدينة</p>
              }
            </div>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[11px] text-muted-foreground">أو اختر مدينة</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          <OriginCityList cities={cities} checkpoints={checkpoints} onSelect={handleFromSelect} />
        </motion.div>
        <StepDots total={4} current={1} />
      </div>
    );
  }

  // ── PHASE: to ───────────────────────────────────────────────────────────────
  if (phase === "to" && fromCity) {
    const dests = getDestinations(fromCity);
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <StepHeader
          step={2}
          title="إلى أين؟"
          subtitle={`المسار من ${cityAr(fromCity)}`}
          canGoBack
          onBack={() => setPhase("from")}
        />
        <motion.div
          key="to"
          variants={stepVariants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto px-4 pb-6 pt-1"
        >
          {dests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Navigation className="w-10 h-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">لا توجد مسارات من {cityAr(fromCity)}</p>
              <button onClick={() => setPhase("from")} className="text-xs text-primary">
                اختر مدينة أخرى
              </button>
            </div>
          ) : (
            <DestinationList
              destinations={dests}
              from={fromCity}
              checkpoints={checkpoints}
              onSelect={handleToSelect}
            />
          )}
        </motion.div>
        <StepDots total={4} current={2} />
      </div>
    );
  }

  // ── PHASE: checkpoints ──────────────────────────────────────────────────────
  if (phase === "checkpoints" && pendingRoute) {
    const selectedCount = pendingRoute.checkpoints.filter(cp => selectedKeys.has(cp.canonical_key)).length;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <StepHeader
          step={3}
          title="الحواجز"
          subtitle={`${cityAr(pendingRoute.from)} → ${cityAr(pendingRoute.to)}`}
          canGoBack
          onBack={() => setPhase("to")}
        />
        <motion.div
          key="checkpoints"
          variants={stepVariants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto px-4 pb-4 pt-1 space-y-2"
        >
          <p className="text-xs text-muted-foreground pb-1">
            أزل علامة الحواجز التي لن تمر بها
          </p>
          {pendingRoute.checkpoints.map((rcp, i) => {
            const liveCp = checkpointMap[rcp.canonical_key];
            const status = liveCp?.status ?? "unknown";
            const isSelected = selectedKeys.has(rcp.canonical_key);
            return (
              <motion.button
                key={rcp.canonical_key}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedKeys(prev => {
                  const next = new Set(prev);
                  isSelected ? next.delete(rcp.canonical_key) : next.add(rcp.canonical_key);
                  return next;
                })}
                className={cn(
                  "w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 border text-start transition-all active:scale-[0.98]",
                  isSelected
                    ? "bg-card/50 border-border/30"
                    : "bg-muted/10 border-border/10 opacity-50"
                )}
              >
                {/* Toggle circle */}
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                  isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                )}>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{rcp.name_ar}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{rcp.distance_from_start_km} كم من البداية</p>
                </div>

                {/* Live status */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={cn("w-2 h-2 rounded-full", S_DOT[status] ?? S_DOT.unknown)} />
                  <span className={cn("text-xs font-semibold", S_TEXT[status] ?? S_TEXT.unknown)}>
                    {getStatusLabel(status, t)}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* CTA */}
        <div className="shrink-0 px-4 pb-6 pt-2 border-t border-border/20">
          <button
            onClick={handleStartJourney}
            disabled={selectedCount === 0}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground text-base font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-lg shadow-primary/20 disabled:opacity-40"
          >
            <Navigation className="w-5 h-5" />
            ابدأ الرحلة
            {selectedCount > 0 && (
              <span className="text-sm font-normal opacity-80">({selectedCount} حواجز)</span>
            )}
          </button>
        </div>
        <StepDots total={4} current={3} />
      </div>
    );
  }

  // ── PHASE: journey (navigator view) ─────────────────────────────────────────
  if (phase === "journey" && pendingRoute) {
    const congestedOnRoute = activeCps.filter(cp => {
      const s = checkpointMap[cp.canonical_key]?.status;
      return s === "congested" || s === "slow";
    }).length;

    // Find nearest checkpoint based on user location
    const nearestIdx = userLocation ? (() => {
      let minD = Infinity;
      let idx = 0;
      activeCps.forEach((rcp, i) => {
        const liveCp = checkpointMap[rcp.canonical_key];
        if (liveCp?.latitude && liveCp?.longitude) {
          const d = (userLocation.latitude - liveCp.latitude) ** 2 + (userLocation.longitude - liveCp.longitude) ** 2;
          if (d < minD) { minD = d; idx = i; }
        }
      });
      return minD < 0.01 ? idx : -1; // ~1km threshold
    })() : -1;

    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Navigator header */}
        <div className="shrink-0 px-4 pt-3 pb-3 border-b border-border/20">
          {/* Route + status */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-black text-foreground truncate">
                  {cityAr(pendingRoute.from)}
                </span>
                <ArrowLeftRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-sm font-black text-foreground truncate">
                  {cityAr(pendingRoute.to)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {pendingRoute.distance_km} كم · ~{pendingRoute.estimated_time_min} د
              </p>
            </div>

            {/* Status pill */}
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold shrink-0",
              blockedCount > 0 ? "bg-red-950/60 text-red-300" :
              congestedOnRoute > 0 ? "bg-amber-950/50 text-amber-300" :
              "bg-emerald-950/50 text-emerald-300"
            )}>
              {blockedCount > 0
                ? <><AlertTriangle className="w-3 h-3" />{blockedCount} مغلق</>
                : congestedOnRoute > 0
                ? <><Clock className="w-3 h-3" />{congestedOnRoute} مزدحم</>
                : <><CheckCircle2 className="w-3 h-3" />{t.allClear}</>
              }
            </div>
          </div>

          {/* Mini checkpoint status bar */}
          <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-muted/20 mb-2">
            {activeCps.map((rcp, idx) => {
              const s = checkpointMap[rcp.canonical_key]?.status ?? "unknown";
              return (
                <div
                  key={rcp.canonical_key}
                  className={cn(
                    "flex-1 rounded-full transition-all",
                    S_DOT[s] ?? S_DOT.unknown,
                    nearestIdx === idx && "ring-1 ring-white/80"
                  )}
                />
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button onClick={handleChangeRoute} className="text-xs text-primary font-medium active:opacity-70">
              تغيير المسار
            </button>
            <button onClick={onClearRoute} className="text-xs text-muted-foreground active:opacity-70">
              إلغاء المسار
            </button>
            {onSaveRoute && (
              <button onClick={onSaveRoute} className="flex items-center gap-1 text-xs text-muted-foreground active:opacity-70 ms-auto">
                {isRouteSaved
                  ? <><BookmarkCheck className="w-3.5 h-3.5 text-primary" /><span className="text-primary">محفوظ</span></>
                  : <><Bookmark className="w-3.5 h-3.5" />حفظ</>
                }
              </button>
            )}
          </div>
        </div>

        {/* Journey timeline */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6">
          {activeCps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Navigation className="w-10 h-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">لم تختر أي حاجز</p>
              <button onClick={() => setPhase("checkpoints")} className="text-xs text-primary">
                العودة لاختيار الحواجز
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Origin marker */}
              <div className="flex gap-3 mb-1">
                <div className="flex flex-col items-center w-5 shrink-0">
                  <div className="w-4 h-4 rounded-full bg-primary ring-2 ring-primary/30 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  </div>
                  <div className="w-0.5 flex-1 min-h-[16px] bg-primary/20" />
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-xs font-bold text-primary">{cityAr(pendingRoute.from)}</p>
                  <p className="text-[10px] text-muted-foreground">نقطة الانطلاق</p>
                </div>
              </div>

              {/* User location indicator (if near a checkpoint) */}
              {nearestIdx === 0 && userLocation && (
                <div className="flex gap-3 mb-1">
                  <div className="flex flex-col items-center w-5 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-500/40 animate-pulse" />
                    <div className="w-0.5 flex-1 min-h-[8px] bg-blue-500/15" />
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="text-[10px] text-blue-400 font-semibold">موقعك الحالي</p>
                  </div>
                </div>
              )}

              {activeCps.map((rcp, idx) => {
                const liveCp = checkpointMap[rcp.canonical_key];
                const isLast = idx === activeCps.length - 1;
                const isNearest = nearestIdx === idx;
                const nextRcp = activeCps[idx + 1];
                const distToNext = nextRcp
                  ? Math.abs(nextRcp.distance_from_start_km - rcp.distance_from_start_km).toFixed(1)
                  : null;

                return (
                  <div key={rcp.canonical_key}>
                    {/* Location indicator between checkpoints */}
                    {isNearest && idx > 0 && userLocation && (
                      <div className="flex gap-3 mb-1 -mt-1">
                        <div className="flex flex-col items-center w-5 shrink-0">
                          <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-500/40 animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-blue-400 font-semibold">موقعك الحالي</p>
                        </div>
                      </div>
                    )}

                    <JourneyCheckpointRow
                      routeCp={rcp}
                      liveCp={liveCp}
                      updates={updatesByKey[rcp.canonical_key] ?? []}
                      isLast={isLast}
                      isExpanded={expandedKey === rcp.canonical_key}
                      onToggle={() => setExpandedKey(k => k === rcp.canonical_key ? null : rcp.canonical_key)}
                      onBypass={() => {
                        setSelectedKeys(prev => {
                          const next = new Set(prev);
                          next.delete(rcp.canonical_key);
                          return next;
                        });
                      }}
                    />

                    {/* Distance to next checkpoint */}
                    {distToNext && !isLast && (
                      <div className="flex gap-3 -mt-1 mb-0.5">
                        <div className="w-5 shrink-0" />
                        <p className="text-[10px] text-muted-foreground/60 ps-2">
                          {distToNext} كم
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Destination marker */}
              <div className="flex gap-3 mt-1">
                <div className="flex flex-col items-center w-5 shrink-0">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30 flex items-center justify-center">
                    <MapPin className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-emerald-400">{cityAr(pendingRoute.to)}</p>
                  <p className="text-[10px] text-muted-foreground">الوجهة · {pendingRoute.distance_km} كم</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <StepDots total={4} current={4} />
      </div>
    );
  }

  // Fallback (shouldn't reach here)
  return null;
}

// ── Step header ────────────────────────────────────────────────────────────────

function StepHeader({ step, title, subtitle, canGoBack, onBack }: {
  step: number; title: string; subtitle?: string; canGoBack?: boolean; onBack?: () => void;
}) {
  return (
    <div className="shrink-0 px-4 pt-4 pb-3">
      <div className="flex items-center gap-2 mb-1">
        {canGoBack && (
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground active:scale-90 transition-all shrink-0">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Step progress dots ─────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="shrink-0 flex justify-center gap-1.5 py-3 border-t border-border/10" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i + 1 === current ? "w-5 bg-primary" :
            i + 1 < current ? "w-1.5 bg-primary/40" : "w-1.5 bg-border/40"
          )}
        />
      ))}
    </div>
  );
}
