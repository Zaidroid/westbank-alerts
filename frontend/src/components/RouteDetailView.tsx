/**
 * RouteDetailView Component
 *
 * Shows a detailed breakdown of a selected route.
 * Lists checkpoints in travel order with real-time status updates.
 * Mobile-optimized for navigation on the road.
 */

import { useMemo, useEffect, useState } from 'react';
import {
  AlertCircle, Navigation2, Navigation, MapPin, ChevronUp,
  RefreshCw, AlertTriangle, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang, getStatusLabel, getTypeLabel, formatRelativeTime } from '@/lib/i18n';
import { calculateDistance } from '@/hooks/useGeolocation';
import { isAreaOnRoute } from '@/lib/routes';
import type { Route } from '@/lib/routes';
import type { Checkpoint, CheckpointUpdate } from '@/lib/api/types';
import type { Alert } from '@/lib/api';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string; border: string }> = {
  open:      { bg: 'bg-green-500/10',  text: 'text-green-600 dark:text-green-400',   icon: '✓', border: 'border-green-500/30' },
  closed:    { bg: 'bg-red-500/10',    text: 'text-red-600 dark:text-red-400',       icon: '✕', border: 'border-red-500/30' },
  congested: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', icon: '⚠', border: 'border-orange-500/30' },
  military:  { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', icon: '⚔', border: 'border-purple-500/30' },
  slow:      { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', icon: '↓', border: 'border-yellow-500/30' },
  unknown:   { bg: 'bg-gray-500/10',   text: 'text-gray-600 dark:text-gray-400',     icon: '?', border: 'border-gray-500/20' },
};

const ALERT_SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500 animate-pulse',
  high:     'bg-orange-500',
  medium:   'bg-yellow-500',
  low:      'bg-slate-400',
};

interface RouteDetailViewProps {
  route: Route;
  checkpoints: Checkpoint[];
  alerts?: Alert[];
  checkpointUpdates?: CheckpointUpdate[];
  userLocation?: { latitude: number; longitude: number } | null;
  onCheckpointClick?: (checkpoint: Checkpoint) => void;
  onClose?: () => void;
  onChangeRoute?: () => void;
}

interface CheckpointWithStatus {
  canonical_key: string;
  name_ar: string;
  name_en?: string;
  latitude: number;
  longitude: number;
  distance_from_start_km?: number;
  status?: string;
  lastUpdate?: string;
  distance?: number;
}

export function RouteDetailView({
  route,
  checkpoints,
  alerts = [],
  checkpointUpdates = [],
  userLocation,
  onCheckpointClick,
  onClose,
  onChangeRoute,
}: RouteDetailViewProps) {
  const { t, lang } = useLang();

  // Track recently flashed checkpoint keys from live WS updates
  const [flashedKeys, setFlashedKeys] = useState<Set<string>>(new Set());
  const routeKeys = useMemo(() => new Set(route.checkpoints.map(cp => cp.canonical_key)), [route]);

  useEffect(() => {
    if (!checkpointUpdates.length) return;
    const relevant = checkpointUpdates
      .slice(0, 20)
      .filter(u => routeKeys.has(u.canonical_key))
      .map(u => u.canonical_key);
    if (!relevant.length) return;

    setFlashedKeys(prev => {
      const next = new Set(prev);
      relevant.forEach(k => next.add(k));
      return next;
    });
    const timer = setTimeout(() => {
      setFlashedKeys(prev => {
        const next = new Set(prev);
        relevant.forEach(k => next.delete(k));
        return next;
      });
    }, 1800);
    return () => clearTimeout(timer);
  }, [checkpointUpdates, routeKeys]);

  // Map checkpoints to their status
  const checkpointMap = useMemo(() => {
    const map: Record<string, Checkpoint> = {};
    checkpoints.forEach(cp => { if (cp.canonical_key) map[cp.canonical_key] = cp; });
    return map;
  }, [checkpoints]);

  // Enrich route checkpoints with live status
  const enrichedCheckpoints = useMemo(() => {
    return route.checkpoints.map(cp => {
      const fullData = checkpointMap[cp.canonical_key];
      const distance = userLocation
        ? calculateDistance(userLocation.latitude, userLocation.longitude, cp.latitude, cp.longitude)
        : undefined;
      return { ...cp, status: fullData?.status || 'unknown', lastUpdate: fullData?.last_updated, distance };
    });
  }, [route.checkpoints, checkpointMap, userLocation]);

  // Find next closest checkpoint to user on route
  const nextCheckpointIndex = useMemo(() => {
    if (!userLocation) return -1;
    let closest = 0, minDist = Infinity;
    enrichedCheckpoints.forEach((cp, idx) => {
      const d = calculateDistance(userLocation.latitude, userLocation.longitude, cp.latitude, cp.longitude);
      if (d < minDist) { minDist = d; closest = idx; }
    });
    return closest;
  }, [enrichedCheckpoints, userLocation]);

  const statusCounts = useMemo(() => {
    const c = { open: 0, closed: 0, congested: 0, military: 0, other: 0 };
    enrichedCheckpoints.forEach(cp => {
      if (cp.status === 'open') c.open++;
      else if (cp.status === 'closed') c.closed++;
      else if (cp.status === 'congested') c.congested++;
      else if (cp.status === 'military') c.military++;
      else c.other++;
    });
    return c;
  }, [enrichedCheckpoints]);

  const routeHealth = statusCounts.closed > 0 ? 'problematic'
    : (statusCounts.congested > 0 || statusCounts.military > 0) ? 'caution'
    : 'good';

  const routeHealthStyle = {
    good:        'bg-green-500/10 border-green-500/30',
    caution:     'bg-yellow-500/10 border-yellow-500/30',
    problematic: 'bg-red-500/10 border-red-500/30',
  };

  // Alerts relevant to this route (area-based matching)
  const routeAlerts = useMemo(() => {
    return alerts.filter(a => isAreaOnRoute(a.area, route)).slice(0, 8);
  }, [alerts, route]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border shrink-0">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base leading-tight" dir="auto">{route.name_ar}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {route.distance_km} km • {route.estimated_time_min} {lang === 'ar' ? 'دقيقة' : 'min'}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ms-2">
          {onChangeRoute && (
            <button
              onClick={onChangeRoute}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'تغيير' : 'Change'}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ChevronUp className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 pb-3">

        {/* Route Health Summary */}
        <div className={cn('mx-4 mt-3 p-3 rounded-lg border', routeHealthStyle[routeHealth])}>
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {routeHealth === 'good' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-semibold">
                    {lang === 'ar' ? 'جميع الحواجز سالكة' : 'All checkpoints clear'}
                  </span>
                </>
              ) : routeHealth === 'caution' ? (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                  <span className="text-xs font-semibold">
                    {statusCounts.congested > 0 && `${statusCounts.congested} ${lang === 'ar' ? 'مزدحم' : 'congested'}`}
                    {statusCounts.military > 0 && ` ${statusCounts.military} ${lang === 'ar' ? 'عسكري' : 'military'}`}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span className="text-xs font-semibold">
                    {statusCounts.closed} {lang === 'ar' ? 'حاجز مغلق' : 'closed checkpoint(s)'}
                  </span>
                </>
              )}
            </div>
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              {enrichedCheckpoints.length} {lang === 'ar' ? 'حاجز' : 'pts'}
            </span>
          </div>
        </div>

        {/* Checkpoint List */}
        <div className="mt-3 px-4 space-y-2">
          {enrichedCheckpoints.map((cp, idx) => {
            const fullData = checkpointMap[cp.canonical_key];
            const isNext = idx === nextCheckpointIndex && userLocation;
            const isFlashed = flashedKeys.has(cp.canonical_key);
            const sc = STATUS_COLORS[cp.status || 'unknown'] || STATUS_COLORS.unknown;

            return (
              <button
                key={cp.canonical_key}
                onClick={() => fullData && onCheckpointClick?.(fullData)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all duration-500',
                  isFlashed
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                    : isNext
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border hover:border-primary/40',
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Order number */}
                  <div className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5',
                    isNext ? 'bg-primary text-primary-foreground' : 'bg-muted',
                  )}>
                    {idx + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="font-medium text-sm leading-tight truncate" dir="auto">
                        {cp.name_ar}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-bold shrink-0', sc.bg, sc.text)}>
                        {sc.icon} {getStatusLabel(cp.status || 'unknown', t)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {cp.distance !== undefined && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{cp.distance.toFixed(1)} km
                        </span>
                      )}
                      {cp.distance_from_start_km !== undefined && (
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {lang === 'ar' ? `بعد ${cp.distance_from_start_km} كم` : `${cp.distance_from_start_km} km in`}
                        </span>
                      )}
                      {fullData?.last_updated && (
                        <span className="flex items-center gap-1 text-muted-foreground/60">
                          <Clock className="w-3 h-3" />
                          {new Date(fullData.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {isFlashed && (
                      <div className="mt-1.5 text-[10px] text-primary font-semibold animate-pulse">
                        {lang === 'ar' ? '↑ تحديث مباشر' : '↑ Live update'}
                      </div>
                    )}
                  </div>
                </div>

                {isNext && !isFlashed && (
                  <div className="mt-2 px-2 py-0.5 bg-primary/10 rounded text-[11px] text-primary font-medium text-center">
                    {lang === 'ar' ? 'الحاجز التالي على مسارك' : 'Next checkpoint on your route'}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Route Alerts Section */}
        {routeAlerts.length > 0 && (
          <div className="mt-4 px-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-semibold text-foreground">
                {lang === 'ar' ? 'تنبيهات على مسارك' : 'Alerts on This Route'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold">
                {routeAlerts.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {routeAlerts.map(alert => {
                const dot = ALERT_SEVERITY_DOT[alert.severity] || ALERT_SEVERITY_DOT.low;
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border bg-muted/30"
                  >
                    <div className={cn('w-2 h-2 rounded-full mt-1 shrink-0', dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-foreground leading-snug" dir="auto">
                        {alert.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span>{getTypeLabel(alert.type, t)}</span>
                        {alert.area && <span>· {alert.area}</span>}
                        <span>· {formatRelativeTime(new Date(alert.timestamp), t, lang)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer tip */}
        <div className="mt-4 px-4 pb-1 text-center text-[10px] text-muted-foreground/50">
          {lang === 'ar' ? 'انقر على حاجز لمشاهدة التفاصيل' : 'Tap a checkpoint for full details and history'}
        </div>
      </div>
    </div>
  );
}
