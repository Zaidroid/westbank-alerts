import { useState, useMemo } from "react";
import {
  Navigation, AlertTriangle, CheckCircle2,
  Radio, Zap, Clock,
  Map as MapIcon, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, formatRelativeTime, getTypeLabel } from "@/lib/i18n";
import { getRouteHealth } from "@/lib/routes";
import { CheckpointCard } from "@/components/mobile/CheckpointsScreen";
import type { Alert, Checkpoint, CheckpointUpdate } from "@/lib/api/types";
import type { Route } from "@/lib/routes";

interface HomeScreenProps {
  alerts: Alert[];
  checkpoints: Checkpoint[];
  checkpointUpdates: CheckpointUpdate[];
  activeRoute: Route | null;
  onRoutePress: () => void;
  onClearRoute: () => void;
  onGoToRouteTab: () => void;
  onGoToAlertsTab: () => void;
  onShowMap: () => void;
  onViewCheckpoints: (filter?: string) => void;
}

// ── Section wrapper ─────────────────────────────────────────────────────────

function Section({ icon, title, action, children }: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{title}</p>
        {action && <div className="ms-auto">{action}</div>}
      </div>
      {children}
    </div>
  );
}

// ── KPI mini-cards for new user state ──────────────────────────────────────

function KpiCard({ count, label, dotClass, textClass, onClick }: {
  count: number; label: string; dotClass: string; textClass: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-1 bg-card/50 border border-border/30 rounded-xl py-3 transition-all active:scale-[0.96]",
        onClick && "cursor-pointer"
      )}
    >
      <div className={cn("w-3 h-3 rounded-full", dotClass)} />
      <p className={cn("text-xl font-black", textClass)}>{count}</p>
      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function HomeScreen({
  alerts,
  checkpoints,
  checkpointUpdates,
  activeRoute,
  onRoutePress,
  onClearRoute,
  onGoToRouteTab,
  onGoToAlertsTab,
  onShowMap,
  onViewCheckpoints,
}: HomeScreenProps) {
  const { t, lang } = useLang();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

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
    if (!activeRoute) return null;
    const sm: Record<string, string> = {};
    checkpoints.forEach(cp => { sm[cp.canonical_key] = cp.status; });
    return getRouteHealth(activeRoute, sm);
  }, [activeRoute, checkpoints]);

  const routeCps = useMemo(() => {
    if (!activeRoute) return [];
    return activeRoute.checkpoints
      .map(rcp => ({ rcp, cp: checkpointMap[rcp.canonical_key] }))
      .filter(({ cp }) => !!cp);
  }, [activeRoute, checkpointMap]);

  const blockedCps = useMemo(
    () => routeCps.filter(({ cp }) => cp.status === "closed" || cp.status === "military" || cp.status === "congested"),
    [routeCps]
  );

  const criticalAlerts = useMemo(
    () => alerts.filter(a => a.severity === "critical" || a.severity === "high").slice(0, 3),
    [alerts]
  );

  // Get checkpoints that have recent updates, sorted by most recent update time.
  // Patches last_updated with the feed timestamp so CheckpointCard shows the right time.
  const recentlyUpdatedCps = useMemo(() => {
    const latestUpdate: Record<string, string> = {};
    for (const u of checkpointUpdates) {
      if (!latestUpdate[u.canonical_key] ||
          new Date(u.timestamp).getTime() > new Date(latestUpdate[u.canonical_key]).getTime()) {
        latestUpdate[u.canonical_key] = u.timestamp;
      }
    }
    return Object.entries(latestUpdate)
      .sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 6)
      .map(([key, ts]) => {
        const cp = checkpointMap[key];
        if (!cp) return null;
        // Use the more recent of snapshot vs feed timestamp
        const feedTime = new Date(ts).getTime();
        const snapshotTime = new Date(cp.last_updated).getTime();
        if (feedTime > snapshotTime) {
          return { ...cp, last_updated: ts };
        }
        return cp;
      })
      .filter(Boolean) as Checkpoint[];
  }, [checkpointUpdates, checkpointMap]);

  const kpi = useMemo(() => ({
    open:      checkpoints.filter(c => c.status === "open").length,
    closed:    checkpoints.filter(c => c.status === "closed").length,
    military:  checkpoints.filter(c => c.status === "military").length,
    congested: checkpoints.filter(c => c.status === "congested").length,
  }), [checkpoints]);

  // Map toggle button
  const MapToggle = (
    <button
      onClick={onShowMap}
      className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border/40 px-2.5 py-1 rounded-full active:scale-[0.97] transition-all"
    >
      <MapIcon className="w-3.5 h-3.5" />
      خريطة
    </button>
  );

  // ── NO ROUTE ──────────────────────────────────────────────────────────────
  if (!activeRoute) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="px-4 pt-4 pb-4 space-y-4">
          {/* KPI cards */}
          {checkpoints.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">الحالة العامة</p>
                <div className="flex items-center gap-2">
                  {MapToggle}
                  <button onClick={() => onViewCheckpoints()} className="text-xs text-primary font-semibold active:opacity-70">
                    عرض الكل ←
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <KpiCard count={kpi.open}      label={t.open}      dotClass="bg-emerald-400" textClass="text-emerald-400" onClick={() => onViewCheckpoints("open")} />
                {kpi.closed > 0    && <KpiCard count={kpi.closed}    label={t.closed}    dotClass="bg-red-500"    textClass="text-red-400"    onClick={() => onViewCheckpoints("closed")} />}
                {kpi.military > 0  && <KpiCard count={kpi.military}  label={t.military}  dotClass="bg-purple-500" textClass="text-purple-400" onClick={() => onViewCheckpoints("military")} />}
                {kpi.congested > 0 && <KpiCard count={kpi.congested} label={t.congested} dotClass="bg-amber-400"  textClass="text-amber-400"  onClick={() => onViewCheckpoints("congested")} />}
              </div>
            </div>
          )}

          {/* Pick route CTA */}
          <button
            onClick={onRoutePress}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-lg shadow-primary/20"
          >
            <Navigation className="w-5 h-5" />
            {t.browseRoutes}
          </button>

          {/* Critical alerts */}
          {criticalAlerts.length > 0 && (
            <button
              onClick={onGoToAlertsTab}
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-950/50 border border-red-800/40 rounded-xl text-start active:scale-[0.97] transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-sm text-red-300 font-medium">{criticalAlerts.length} {t.criticalAlerts}</span>
              <span className="text-xs text-muted-foreground ms-auto">عرض ←</span>
            </button>
          )}

          {/* Live feed */}
          {recentlyUpdatedCps.length > 0 && (
            <Section icon={<Zap className="w-3.5 h-3.5 text-primary" />} title="تحديثات مباشرة">
              <div className="space-y-2">
                {recentlyUpdatedCps.map(cp => (
                  <CheckpointCard
                    key={cp.canonical_key}
                    checkpoint={cp}
                    updates={updatesByKey[cp.canonical_key] ?? []}
                    isExpanded={expandedKey === cp.canonical_key}
                    onToggle={() => setExpandedKey(k => k === cp.canonical_key ? null : cp.canonical_key)}
                  />
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    );
  }

  // ── ROUTE SELECTED — compact dashboard ────────────────────────────────────
  const routeHealth = {
    open: health?.open ?? 0,
    closed: (health?.closed ?? 0) + (health?.military ?? 0),
    congested: (health?.congested ?? 0) + (health?.slow ?? 0),
  };
  const totalOnRoute = routeHealth.open + routeHealth.closed + routeHealth.congested;
  const isDanger = routeHealth.closed > 0;
  const isCaution = !isDanger && routeHealth.congested > 0;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto">
      <div className="px-4 pt-4 pb-6 space-y-4">

        {/* ── Route info bar ──────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="w-4 h-4 text-primary shrink-0" />
              <h2 className="text-base font-black text-foreground truncate">
                {activeRoute.name_ar}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {activeRoute.distance_km} كم · ~{activeRoute.estimated_time_min} د · {activeRoute.checkpoints.length} حاجز
            </p>
          </div>
          {MapToggle}
        </div>

        {/* ── Route status strip ──────────────────────────────────────── */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-2xl border",
          isDanger  ? "bg-red-950/30 border-red-800/30" :
          isCaution ? "bg-amber-950/25 border-amber-700/25" :
                      "bg-emerald-950/25 border-emerald-700/25"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
            isDanger  ? "bg-red-900/50" :
            isCaution ? "bg-amber-900/40" :
                        "bg-emerald-900/40"
          )}>
            {isDanger
              ? <AlertTriangle className="w-5 h-5 text-red-400" />
              : <CheckCircle2 className={cn("w-5 h-5", isCaution ? "text-amber-400" : "text-emerald-400")} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-bold",
              isDanger ? "text-red-300" : isCaution ? "text-amber-300" : "text-emerald-300"
            )}>
              {isDanger
                ? `${routeHealth.closed} حاجز مغلق على مسارك`
                : isCaution
                ? `${routeHealth.congested} حاجز مزدحم`
                : t.allClear}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {routeHealth.open}/{totalOnRoute} سالك
            </p>
          </div>
        </div>

        {/* ── Route checkpoint mini-stats ──────────────────────────────── */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-emerald-950/20 border border-emerald-700/20 rounded-xl px-3 py-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm font-bold text-emerald-300">{routeHealth.open}</span>
            <span className="text-[10px] text-emerald-400/70">سالك</span>
          </div>
          {routeHealth.congested > 0 && (
            <div className="flex-1 flex items-center gap-2 bg-amber-950/20 border border-amber-700/20 rounded-xl px-3 py-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-sm font-bold text-amber-300">{routeHealth.congested}</span>
              <span className="text-[10px] text-amber-400/70">مزدحم</span>
            </div>
          )}
          {routeHealth.closed > 0 && (
            <div className="flex-1 flex items-center gap-2 bg-red-950/20 border border-red-700/20 rounded-xl px-3 py-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-sm font-bold text-red-300">{routeHealth.closed}</span>
              <span className="text-[10px] text-red-400/70">مغلق</span>
            </div>
          )}
        </div>

        {/* ── Quick actions ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGoToRouteTab}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary/15 text-primary text-sm font-semibold rounded-xl active:scale-[0.97] transition-all"
          >
            <Shield className="w-4 h-4" />
            تفاصيل المسار
          </button>
          <button
            onClick={onClearRoute}
            className="px-4 py-2.5 bg-muted/40 text-muted-foreground text-sm rounded-xl active:scale-[0.97] transition-all"
          >
            {t.clearRoute}
          </button>
        </div>

        {/* ── Blocked/problematic checkpoints — expandable cards ─────── */}
        {blockedCps.length > 0 && (
          <Section
            icon={<AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
            title={`${blockedCps.length} حاجز يحتاج انتباهك`}
          >
            <div className="space-y-2">
              {blockedCps.map(({ rcp, cp }) => (
                <CheckpointCard
                  key={rcp.canonical_key}
                  checkpoint={cp}
                  updates={updatesByKey[rcp.canonical_key] ?? []}
                  isExpanded={expandedKey === rcp.canonical_key}
                  onToggle={() => setExpandedKey(k => k === rcp.canonical_key ? null : rcp.canonical_key)}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Live feed */}
        {recentlyUpdatedCps.length > 0 && (
          <Section
            icon={<Zap className="w-3.5 h-3.5 text-primary" />}
            title="تحديثات مباشرة"
          >
            <div className="space-y-2">
              {recentlyUpdatedCps.map(cp => (
                <CheckpointCard
                  key={cp.canonical_key}
                  checkpoint={cp}
                  updates={updatesByKey[cp.canonical_key] ?? []}
                  isExpanded={expandedKey === cp.canonical_key}
                  onToggle={() => setExpandedKey(k => k === cp.canonical_key ? null : cp.canonical_key)}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Critical alerts */}
        {criticalAlerts.length > 0 && (
          <Section icon={<Radio className="w-3.5 h-3.5 text-amber-400" />} title={t.criticalAlerts}
            action={
              <button onClick={onGoToAlertsTab} className="text-xs text-primary font-semibold active:opacity-70">عرض الكل ←</button>
            }
          >
            <div className="space-y-1.5">
              {criticalAlerts.map(alert => (
                <button key={alert.id} onClick={onGoToAlertsTab}
                  className="w-full flex items-center gap-3 text-start bg-card/50 border border-border/30 rounded-xl px-3 py-2.5 active:scale-[0.98] transition-all"
                >
                  <div className={cn("w-2 h-2 rounded-full shrink-0", alert.severity === "critical" ? "bg-red-500" : "bg-amber-400")} />
                  <span className="text-sm text-foreground flex-1 truncate">
                    {alert.title_ar || getTypeLabel(alert.type, t)}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{formatRelativeTime(alert.timestamp, t, lang)}</span>
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
