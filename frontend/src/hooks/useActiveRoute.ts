import { useState, useCallback, useEffect } from "react";
import type { Route } from "@/lib/routes";
import { getRouteById } from "@/lib/routes";

const STORAGE_KEY = "wb_active_route";

export function useActiveRoute() {
  const [activeRoute, setActiveRouteState] = useState<Route | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const route = getRouteById(saved);
        return route ?? null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const setActiveRoute = useCallback((route: Route | null) => {
    setActiveRouteState(route);
    try {
      if (route) {
        localStorage.setItem(STORAGE_KEY, route.id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const clearActiveRoute = useCallback(() => setActiveRoute(null), [setActiveRoute]);

  return { activeRoute, setActiveRoute, clearActiveRoute };
}
