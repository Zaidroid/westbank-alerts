import { useState, useCallback } from "react";
import { getRouteById } from "@/lib/routes";
import type { Route } from "@/lib/routes";

const STORAGE_KEY = "wb_saved_routes";
const MAX_SAVED = 4;

function loadSaved(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function persist(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function useSavedRoutes() {
  const [savedIds, setSavedIds] = useState<string[]>(loadSaved);

  const savedRoutes: Route[] = savedIds
    .map(id => getRouteById(id))
    .filter((r): r is Route => r !== undefined);

  const saveRoute = useCallback((route: Route) => {
    setSavedIds(prev => {
      if (prev.includes(route.id)) return prev;
      const next = [route.id, ...prev].slice(0, MAX_SAVED);
      persist(next);
      return next;
    });
  }, []);

  const removeRoute = useCallback((routeId: string) => {
    setSavedIds(prev => {
      const next = prev.filter(id => id !== routeId);
      persist(next);
      return next;
    });
  }, []);

  const isRouteSaved = useCallback(
    (routeId: string) => savedIds.includes(routeId),
    [savedIds]
  );

  return { savedRoutes, saveRoute, removeRoute, isRouteSaved };
}
