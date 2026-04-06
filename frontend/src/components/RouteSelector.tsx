/**
 * RouteSelector Component
 *
 * Allows users to select routes between WB cities.
 * Shows route health (checkpoint status counts).
 * Mobile-first design for navigation on the road.
 */

import { useState, useMemo } from 'react';
import { Search, MapPin, Navigation2, ChevronRight, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLang } from '@/lib/i18n';
import { getAllRoutes, searchRoutesByCity, getRouteHealth, Route } from '@/lib/routes';
import type { Checkpoint } from '@/lib/api/types';

const STATUS_COLORS = {
  open: 'bg-green-500',
  closed: 'bg-red-500',
  congested: 'bg-orange-500',
  military: 'bg-purple-500',
  slow: 'bg-yellow-500',
  unknown: 'bg-gray-500',
};

const STATUS_TEXT_COLORS = {
  open: 'text-green-600 dark:text-green-400',
  closed: 'text-red-600 dark:text-red-400',
  congested: 'text-orange-600 dark:text-orange-400',
  military: 'text-purple-600 dark:text-purple-400',
  slow: 'text-yellow-600 dark:text-yellow-400',
  unknown: 'text-gray-600 dark:text-gray-400',
};

interface RouteSelectorProps {
  checkpoints: Checkpoint[];
  onRouteSelected: (route: Route) => void;
  selectedRoute?: Route | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function RouteHealthBadge({ route, checkpointStatusMap }: { route: Route; checkpointStatusMap: Record<string, string> }) {
  const health = getRouteHealth(route, checkpointStatusMap);
  const total = route.checkpoints.length;
  const problematic = health.closed + health.congested;

  if (problematic === 0) {
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-xs font-medium text-green-600 dark:text-green-400">{total} open</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {health.closed > 0 && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs font-medium text-red-600 dark:text-red-400">{health.closed} closed</span>
        </div>
      )}
      {health.congested > 0 && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">{health.congested} congested</span>
        </div>
      )}
    </div>
  );
}

function RouteCard({ route, checkpointStatusMap, isSelected, onClick }: {
  route: Route;
  checkpointStatusMap: Record<string, string>;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { t } = useLang();
  const health = getRouteHealth(route, checkpointStatusMap);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border-2 transition-all',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm" dir="auto">
            {route.name_ar}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {route.distance_km} km • {route.estimated_time_min} min
          </div>
        </div>
        {isSelected && (
          <div className="shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-3">
        <RouteHealthBadge route={route} checkpointStatusMap={checkpointStatusMap} />
      </div>

      {route.checkpoints.length > 0 && (
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <Navigation2 className="w-3 h-3" />
          <span>{route.checkpoints.length} checkpoints</span>
        </div>
      )}
    </button>
  );
}

export function RouteSelector({
  checkpoints,
  onRouteSelected,
  selectedRoute,
  isOpen,
  onOpenChange,
}: RouteSelectorProps) {
  const { t, lang } = useLang();
  const [searchQuery, setSearchQuery] = useState('');

  // Build checkpoint status map
  const checkpointStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    checkpoints.forEach(cp => {
      if (cp.canonical_key && cp.status) {
        map[cp.canonical_key] = cp.status;
      }
    });
    return map;
  }, [checkpoints]);

  // Search routes
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) {
      return getAllRoutes();
    }
    return searchRoutesByCity(searchQuery);
  }, [searchQuery]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-end md:items-center md:justify-center">
      <div className="w-full md:w-96 bg-background rounded-t-2xl md:rounded-lg border border-border md:max-h-[80vh] flex flex-col overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-sm">{lang === 'ar' ? 'اختر مسارك' : 'Select Route'}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={lang === 'ar' ? 'ابحث عن مدينة...' : 'Search city...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Routes List */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {filteredRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MapPin className="w-6 h-6 mb-2" />
              <p className="text-sm">{lang === 'ar' ? 'لم يتم العثور على مسارات' : 'No routes found'}</p>
            </div>
          ) : (
            filteredRoutes.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                checkpointStatusMap={checkpointStatusMap}
                isSelected={selectedRoute?.id === route.id}
                onClick={() => {
                  onRouteSelected(route);
                  onOpenChange(false);
                }}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-3 shrink-0 bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">
            {lang === 'ar'
              ? 'اختر مسار لمشاهدة حالة الحواجز في الوقت الفعلي'
              : 'Select a route to track checkpoint status in real-time'}
          </p>
        </div>
      </div>
    </div>
  );
}
