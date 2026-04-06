/**
 * CheckpointsScreen — full real-time checkpoint status board.
 * Starts with region city cards, drills into filtered checkpoint list.
 */

import { useState, useMemo, useEffect } from "react";
import { Search, X, ChevronDown, ChevronLeft, Clock, Users, Zap, Shield, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLang, formatRelativeTime, getStatusLabel } from "@/lib/i18n";
import type { Checkpoint, CheckpointUpdate, CheckpointStatus, CheckpointType } from "@/lib/api/types";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, {
  dot: string; text: string; bg: string; border: string; chip: string; chipActive: string;
}> = {
  open:      { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-950/30",  border: "border-emerald-700/30",  chip: "bg-emerald-950/40 border-emerald-700/30 text-emerald-300",  chipActive: "bg-emerald-900/60 border-emerald-600/60 text-emerald-200" },
  closed:    { dot: "bg-red-500",     text: "text-red-400",     bg: "bg-red-950/30",      border: "border-red-700/30",      chip: "bg-red-950/40 border-red-700/30 text-red-300",              chipActive: "bg-red-900/60 border-red-600/60 text-red-200" },
  congested: { dot: "bg-amber-400",   text: "text-amber-400",   bg: "bg-amber-950/30",    border: "border-amber-700/30",    chip: "bg-amber-950/40 border-amber-700/30 text-amber-300",        chipActive: "bg-amber-900/60 border-amber-600/60 text-amber-200" },
  military:  { dot: "bg-purple-500",  text: "text-purple-400",  bg: "bg-purple-950/30",   border: "border-purple-700/30",   chip: "bg-purple-950/40 border-purple-700/30 text-purple-300",     chipActive: "bg-purple-900/60 border-purple-600/60 text-purple-200" },
  slow:      { dot: "bg-yellow-400",  text: "text-yellow-400",  bg: "bg-yellow-950/30",   border: "border-yellow-700/30",   chip: "bg-yellow-950/40 border-yellow-700/30 text-yellow-300",     chipActive: "bg-yellow-900/60 border-yellow-600/60 text-yellow-200" },
  unknown:   { dot: "bg-muted-foreground/40", text: "text-muted-foreground", bg: "bg-muted/20", border: "border-border/20", chip: "bg-muted/40 border-border/20 text-muted-foreground", chipActive: "bg-muted/60 border-border/40 text-foreground" },
};

const TYPE_LABELS: Partial<Record<CheckpointType, string>> = {
  checkpoint:    "حاجز",
  gate:          "بوابة",
  police:        "شرطة",
  traffic_signal:"إشارة مرور",
  roundabout:    "دوار",
  bridge:        "جسر",
  entrance:      "مدخل",
  bypass_road:   "طريق التفافي",
  tunnel:        "نفق",
  crossing:      "معبر",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "عالية", medium: "متوسطة", low: "منخفضة",
};

const STATUS_FILTERS: { status: CheckpointStatus | "all"; label: string }[] = [
  { status: "all",       label: "الكل" },
  { status: "closed",    label: "مغلق" },
  { status: "military",  label: "عسكري" },
  { status: "congested", label: "مزدحم" },
  { status: "slow",      label: "بطيء" },
  { status: "open",      label: "مفتوح" },
];

// ── Region name Arabic mapping ─────────────────────────────────────────────────

const REGION_AR: Record<string, string> = {
  nablus:    "نابلس",
  ramallah:  "رام الله",
  jerusalem: "القدس",
  bethlehem: "بيت لحم",
  hebron:    "الخليل",
  jenin:     "جنين",
  tulkarm:   "طولكرم",
  qalqilya:  "قلقيليه",
  jericho:   "أريحا",
  salfit:    "سلفيت",
  tubas:     "طوباس",
};

function regionAr(region: string): string {
  return REGION_AR[region.toLowerCase()] ?? region;
}

// ── Checkpoint card ───────────────────────────────────────────────────────────

export function CheckpointCard({
  checkpoint,
  updates,
  isExpanded,
  onToggle,
}: {
  checkpoint: Checkpoint;
  updates: CheckpointUpdate[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { t, lang } = useLang();
  const cfg = STATUS_CFG[checkpoint.status] ?? STATUS_CFG.unknown;

  const hasLiveUpdate = updates.length > 0 &&
    (Date.now() - new Date(updates[0].timestamp).getTime()) < 30 * 60 * 1000;

  return (
    <motion.div
      layout="position"
      className={cn(
        "rounded-2xl border overflow-hidden bg-card/40 transition-colors",
        cfg.border
      )}
    >
      {/* Collapsed row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-start active:bg-muted/20 transition-colors"
      >
        {/* Status dot with live pulse */}
        <div className="relative shrink-0">
          <div className={cn("w-3 h-3 rounded-full", cfg.dot)} />
          {hasLiveUpdate && (
            <span className="absolute -top-0.5 -end-0.5 w-2 h-2 rounded-full bg-primary animate-ping opacity-75" />
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight truncate">
            {checkpoint.name_ar}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {checkpoint.region && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {regionAr(checkpoint.region)}
              </span>
            )}
            {checkpoint.crowd_reports_1h > 0 && (
              <span className="text-[10px] text-primary flex items-center gap-0.5">
                <Users className="w-2.5 h-2.5" />
                {checkpoint.crowd_reports_1h} تقرير
              </span>
            )}
            {checkpoint.is_stale && (
              <span className="text-[10px] text-muted-foreground/50">قديم</span>
            )}
          </div>
        </div>

        {/* Status + time */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className={cn("text-xs font-bold", cfg.text)}>
            {getStatusLabel(checkpoint.status, t)}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {formatRelativeTime(checkpoint.last_updated, t, lang)}
          </span>
        </div>

        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground/60 shrink-0 transition-transform ms-1",
          isExpanded && "rotate-180"
        )} />
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-border/20 space-y-3">

              {/* Status raw text */}
              {checkpoint.status_raw && (
                <div className={cn("rounded-xl px-3 py-2.5 border", cfg.bg, cfg.border)}>
                  <p className="text-xs text-foreground/90 leading-relaxed" dir="rtl">
                    {checkpoint.status_raw}
                  </p>
                </div>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-2">
                {checkpoint.checkpoint_type && (
                  <div className="bg-muted/30 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">النوع</p>
                    <p className="text-xs font-semibold text-foreground">
                      {TYPE_LABELS[checkpoint.checkpoint_type] ?? checkpoint.checkpoint_type}
                    </p>
                  </div>
                )}
                <div className="bg-muted/30 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground mb-0.5">الموثوقية</p>
                  <p className={cn("text-xs font-semibold",
                    checkpoint.confidence === "high"   ? "text-emerald-400" :
                    checkpoint.confidence === "medium" ? "text-amber-400"   : "text-muted-foreground"
                  )}>
                    {CONFIDENCE_LABELS[checkpoint.confidence] ?? checkpoint.confidence}
                  </p>
                </div>
                {checkpoint.direction && (
                  <div className="bg-muted/30 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">الاتجاه</p>
                    <p className="text-xs font-semibold text-foreground">
                      {checkpoint.direction === "inbound" ? "دخول فقط" :
                       checkpoint.direction === "outbound" ? "خروج فقط" : "الاتجاهين"}
                    </p>
                  </div>
                )}
                <div className="bg-muted/30 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground mb-0.5">المصدر</p>
                  <p className="text-xs font-semibold text-foreground">
                    {checkpoint.last_source_type === "admin" ? "✓ موثّق" : "إبلاغ جماعي"}
                  </p>
                </div>
              </div>

              {/* Recent live updates for this checkpoint */}
              {updates.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" />
                    آخر التحديثات
                  </p>
                  {updates.slice(0, 3).map((u, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 bg-muted/20 rounded-xl">
                      <div className={cn("w-2 h-2 rounded-full mt-1 shrink-0",
                        STATUS_CFG[u.status]?.dot ?? "bg-muted-foreground/40"
                      )} />
                      <div className="flex-1 min-w-0">
                        {u.status_raw && (
                          <p className="text-xs text-foreground/80 leading-snug" dir="rtl">
                            {u.status_raw}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatRelativeTime(u.timestamp, t, lang)} · {u.source_channel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Region city card ──────────────────────────────────────────────────────────

function RegionCard({ region, checkpoints, onClick }: {
  region: string;
  checkpoints: Checkpoint[];
  onClick: () => void;
}) {
  const openCount = checkpoints.filter(c => c.status === "open").length;
  const closedCount = checkpoints.filter(c => c.status === "closed" || c.status === "military").length;
  const congestedCount = checkpoints.filter(c => c.status === "congested" || c.status === "slow").length;

  return (
    <motion.button
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className="w-full flex items-center gap-3.5 bg-card/50 border border-border/30 rounded-2xl px-4 py-4 text-start active:scale-[0.98] transition-all"
    >
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-foreground">{regionAr(region)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {checkpoints.length} حاجز
        </p>
      </div>

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
}

// ── Main screen ───────────────────────────────────────────────────────────────

interface CheckpointsScreenProps {
  checkpoints: Checkpoint[];
  checkpointUpdates: CheckpointUpdate[];
  initialFilter?: CheckpointStatus | null;
}

export function CheckpointsScreen({
  checkpoints,
  checkpointUpdates,
  initialFilter,
}: CheckpointsScreenProps) {
  const { lang } = useLang();
  const [view, setView] = useState<"regions" | "list">(initialFilter ? "list" : "regions");
  const [statusFilter, setStatusFilter] = useState<CheckpointStatus | "all">(initialFilter ?? "all");
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Sync if parent changes the initial filter (e.g. KPI card navigation)
  useEffect(() => {
    if (initialFilter) {
      setStatusFilter(initialFilter);
      setView("list");
    }
  }, [initialFilter]);

  // Updates indexed by canonical_key
  const updatesByKey = useMemo(() => {
    const m: Record<string, CheckpointUpdate[]> = {};
    checkpointUpdates.forEach(u => {
      (m[u.canonical_key] ??= []).push(u);
    });
    return m;
  }, [checkpointUpdates]);

  // Unique regions from data
  const regions = useMemo(() =>
    Array.from(new Set(checkpoints.map(cp => cp.region).filter(Boolean) as string[])).sort()
  , [checkpoints]);

  // Checkpoints grouped by region
  const byRegion = useMemo(() => {
    const m: Record<string, Checkpoint[]> = {};
    checkpoints.forEach(cp => {
      const r = cp.region || "أخرى";
      (m[r] ??= []).push(cp);
    });
    return m;
  }, [checkpoints]);

  // Counts per status
  const counts = useMemo(() => ({
    all:       checkpoints.length,
    open:      checkpoints.filter(c => c.status === "open").length,
    closed:    checkpoints.filter(c => c.status === "closed").length,
    congested: checkpoints.filter(c => c.status === "congested").length,
    military:  checkpoints.filter(c => c.status === "military").length,
    slow:      checkpoints.filter(c => c.status === "slow").length,
  }), [checkpoints]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let result = checkpoints;
    if (statusFilter !== "all") result = result.filter(cp => cp.status === statusFilter);
    if (regionFilter) result = result.filter(cp => cp.region === regionFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(cp =>
        cp.name_ar.includes(q) ||
        cp.name_en?.toLowerCase().includes(q) ||
        cp.region?.toLowerCase().includes(q)
      );
    }
    // Sort by freshness (most recently updated first)
    return [...result].sort((a, b) =>
      new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
    );
  }, [checkpoints, statusFilter, regionFilter, search]);

  // Live update count (last 30 min)
  const liveCount = useMemo(() =>
    checkpointUpdates.filter(u =>
      Date.now() - new Date(u.timestamp).getTime() < 30 * 60 * 1000
    ).length
  , [checkpointUpdates]);

  const handleRegionSelect = (region: string) => {
    setRegionFilter(region);
    setView("list");
  };

  const handleBackToRegions = () => {
    setRegionFilter(null);
    setStatusFilter("all");
    setSearch("");
    setView("regions");
  };

  // ── Regions landing view ──────────────────────────────────────────────────
  if (view === "regions") {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background">
        {/* Header */}
        <div className="shrink-0 px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-base font-black text-foreground">الحواجز</h2>
              <span className="text-xs bg-muted/60 border border-border/30 text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                {counts.all}
              </span>
            </div>
            {liveCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {liveCount} تحديث
              </div>
            )}
          </div>

          {/* Mini status summary */}
          <div className="flex gap-2 mb-3">
            {counts.closed > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-950/40 border border-red-700/30">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-red-300">{counts.closed}</span>
                <span className="text-[10px] text-red-400/70">مغلق</span>
              </div>
            )}
            {counts.military > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-950/40 border border-purple-700/30">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-xs font-bold text-purple-300">{counts.military}</span>
                <span className="text-[10px] text-purple-400/70">عسكري</span>
              </div>
            )}
            {counts.congested > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-700/30">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-amber-300">{counts.congested}</span>
                <span className="text-[10px] text-amber-400/70">مزدحم</span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/30 border border-emerald-700/20 ms-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">{counts.open}</span>
              <span className="text-[10px] text-emerald-400/70">مفتوح</span>
            </div>
          </div>

          {/* "Show all" + Search */}
          <div className="space-y-2">
            <button
              onClick={() => setView("list")}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 border border-primary/25 rounded-xl text-sm font-semibold text-primary active:scale-[0.98] transition-all"
            >
              <Search className="w-4 h-4" />
              بحث في جميع الحواجز
            </button>
          </div>
        </div>

        {/* Region cards */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 pt-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
            حسب المنطقة
          </p>
          {regions.map((region, i) => (
            <RegionCard
              key={region}
              region={region}
              checkpoints={byRegion[region] ?? []}
              onClick={() => handleRegionSelect(region)}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── List view (filtered checkpoints) ──────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ── Header with back button ─────────────────────────────────────── */}
      <div className="shrink-0 px-4 pt-3 pb-0">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={handleBackToRegions}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground active:scale-90 transition-all shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-foreground">
              {regionFilter ? regionAr(regionFilter) : "جميع الحواجز"}
            </h2>
          </div>
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-primary shrink-0">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {liveCount} تحديث
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky filters ──────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-2 space-y-2">

        {/* Search */}
        <div className="flex items-center gap-2 bg-muted/40 border border-border/20 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="ابحث عن حاجز..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground outline-none text-foreground"
            dir="rtl"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Status chips */}
        <div
          className="flex gap-1.5 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {STATUS_FILTERS.map(({ status, label }) => {
            const count = counts[status as keyof typeof counts] ?? counts.all;
            const isActive = statusFilter === status;
            const cfg = status !== "all" ? STATUS_CFG[status] : null;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all",
                  isActive
                    ? (cfg ? cfg.chipActive : "bg-primary/20 border-primary/40 text-primary")
                    : "bg-muted/40 border-border/20 text-muted-foreground"
                )}
              >
                {cfg && <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />}
                {label}
                <span className={cn(
                  "text-[10px] font-bold",
                  isActive ? "opacity-90" : "opacity-50"
                )}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Region chips (only when not pre-filtered by region) */}
        {!regionFilter && regions.length > 1 && (
          <div
            className="flex gap-1.5 overflow-x-auto"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          >
            <button
              onClick={() => setRegionFilter(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium shrink-0 border transition-all",
                !regionFilter
                  ? "bg-primary/15 border-primary/25 text-primary"
                  : "bg-muted/40 border-border/20 text-muted-foreground"
              )}
            >
              جميع المناطق
            </button>
            {regions.map(r => (
              <button
                key={r}
                onClick={() => setRegionFilter(r === regionFilter ? null : r)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium shrink-0 border transition-all",
                  r === regionFilter
                    ? "bg-primary/15 border-primary/25 text-primary"
                    : "bg-muted/40 border-border/20 text-muted-foreground"
                )}
              >
                {regionAr(r)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Results count ───────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-2 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">
          {filtered.length} حاجز
          {statusFilter !== "all" && ` · ${STATUS_FILTERS.find(f => f.status === statusFilter)?.label}`}
          {regionFilter && ` · ${regionAr(regionFilter)}`}
        </p>
        {(statusFilter !== "all" || regionFilter || search) && (
          <button
            onClick={handleBackToRegions}
            className="text-[11px] text-primary flex items-center gap-0.5 active:opacity-70"
          >
            <X className="w-3 h-3" /> إعادة ضبط
          </button>
        )}
      </div>

      {/* ── Checkpoint list ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Shield className="w-12 h-12 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">لا توجد حواجز مطابقة</p>
            {(statusFilter !== "all" || regionFilter || search) && (
              <button
                onClick={handleBackToRegions}
                className="text-xs text-primary active:opacity-70"
              >
                إعادة ضبط الفلاتر
              </button>
            )}
          </div>
        ) : (
          filtered.map(cp => (
            <CheckpointCard
              key={cp.canonical_key}
              checkpoint={cp}
              updates={updatesByKey[cp.canonical_key] ?? []}
              isExpanded={expandedKey === cp.canonical_key}
              onToggle={() => setExpandedKey(k => k === cp.canonical_key ? null : cp.canonical_key)}
            />
          ))
        )}
      </div>
    </div>
  );
}
