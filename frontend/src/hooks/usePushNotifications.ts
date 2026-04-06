/**
 * usePushNotifications
 *
 * Manages browser Notification permission and fires foreground notifications
 * when new critical/high alerts arrive.
 *
 * Background push (VAPID) requires a server-side subscription endpoint.
 * This hook handles the foreground case — works while the tab is open.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { Alert } from "@/lib/api/types";

export type NotificationPermission = "default" | "granted" | "denied";

const NOTIF_ENABLED_KEY = "wb_notif_enabled";

function canNotify() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function usePushNotifications(alerts: Alert[]) {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (!canNotify()) return "denied";
    return Notification.permission as NotificationPermission;
  });

  // User explicitly opted in to notifications
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(NOTIF_ENABLED_KEY) === "true"; }
    catch { return false; }
  });

  // Track latest alert ID we've notified about
  const lastNotifiedId = useRef<number>(-1);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!canNotify()) return false;
    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
    if (result === "granted") {
      setEnabled(true);
      try { localStorage.setItem(NOTIF_ENABLED_KEY, "true"); } catch {}
    }
    return result === "granted";
  }, []);

  const disableNotifications = useCallback(() => {
    setEnabled(false);
    try { localStorage.removeItem(NOTIF_ENABLED_KEY); } catch {}
  }, []);

  // Fire notification when new critical/high alerts arrive
  useEffect(() => {
    if (!enabled || permission !== "granted" || !canNotify()) return;
    if (alerts.length === 0) return;

    const latest = alerts[0];
    if (latest.id <= lastNotifiedId.current) return;
    if (latest.severity !== "critical" && latest.severity !== "high") return;

    lastNotifiedId.current = latest.id;

    try {
      const title = latest.title_ar || latest.title || "تنبيه جديد";
      const body = latest.area
        ? `${latest.area} — ${latest.body?.slice(0, 80) || ""}`
        : latest.body?.slice(0, 100) || "";

      const n = new Notification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: `wb-alert-${latest.id}`,
        silent: false,
      });

      // Auto-close after 8s
      setTimeout(() => n.close(), 8000);
    } catch {
      // Notification API might be unavailable in some contexts
    }
  }, [alerts, enabled, permission]);

  return {
    permission,
    enabled,
    isSupported: canNotify(),
    requestPermission,
    disableNotifications,
  };
}
