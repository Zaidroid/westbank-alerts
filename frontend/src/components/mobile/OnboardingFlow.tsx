/**
 * OnboardingFlow — immersive first-time user experience.
 *
 * Full-screen, animated walkthrough of every major feature.
 * Shows once per device (localStorage). Integrates permission prompts
 * inline so the user doesn't see a separate sheet afterward.
 *
 * Steps: Welcome → Dashboard → Checkpoints → Routes → Alerts → Permissions → Ready
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, PanInfo } from "framer-motion";
import {
  Shield, Navigation, Bell, Map as MapIcon,
  MapPin, ChevronLeft, Zap,
  AlertTriangle, Clock,
  Wifi, ArrowRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Persistence ────────────────────────────────────────────────────────────

const ONBOARDING_KEY = "wb-onboarding-done";

export function hasCompletedOnboarding(): boolean {
  try { return !!localStorage.getItem(ONBOARDING_KEY); } catch { return false; }
}

function markOnboardingDone() {
  try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
}

// ── Animated illustrations (pure CSS/SVG) ──────────────────────────────────

function PulseRing({ color = "primary", delay = 0 }: { color?: string; delay?: number }) {
  return (
    <motion.div
      className={cn("absolute inset-0 rounded-full border-2", `border-${color}/30`)}
      initial={{ scale: 0.8, opacity: 0.8 }}
      animate={{ scale: 2.2, opacity: 0 }}
      transition={{ duration: 2.5, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

function WelcomeIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Outer pulse rings */}
      <PulseRing delay={0} />
      <PulseRing delay={0.8} />
      <PulseRing delay={1.6} />

      {/* Center signal icon */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center backdrop-blur-sm">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" className="text-primary">
            <motion.path
              d="M1 6C1 6 5 2 12 2C19 2 23 6 23 6"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            />
            <motion.path
              d="M4 10C4 10 7 7 12 7C17 7 20 10 20 10"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
            <motion.path
              d="M7.5 14C7.5 14 9 12 12 12C15 12 16.5 14 16.5 14"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            <motion.circle
              cx="12" cy="18" r="2" fill="currentColor"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            />
          </svg>
        </div>
      </motion.div>

      {/* Floating dots representing data points */}
      {[
        { x: 15, y: 20, size: 6, delay: 0.5 },
        { x: 140, y: 30, size: 5, delay: 1.0 },
        { x: 25, y: 130, size: 4, delay: 1.5 },
        { x: 155, y: 120, size: 7, delay: 0.8 },
        { x: 80, y: 5, size: 5, delay: 1.2 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/40"
          style={{ left: dot.x, top: dot.y, width: dot.size, height: dot.size }}
          animate={{
            y: [0, -8, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: dot.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function DashboardIllustration() {
  return (
    <div className="relative w-56 h-48 mx-auto">
      {/* Phone frame */}
      <motion.div
        className="absolute inset-x-4 inset-y-0 rounded-2xl border-2 border-primary/20 bg-card/30 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Status bar */}
        <div className="h-6 bg-primary/10 flex items-center justify-center gap-1">
          <Wifi className="w-2.5 h-2.5 text-primary/50" />
          <div className="w-8 h-1.5 rounded-full bg-primary/20" />
        </div>

        {/* KPI pills row */}
        <div className="flex gap-1.5 px-2 py-2">
          {[
            { color: "bg-red-500/20", dot: "bg-red-500", w: "w-10" },
            { color: "bg-amber-500/20", dot: "bg-amber-500", w: "w-12" },
            { color: "bg-emerald-500/20", dot: "bg-emerald-500", w: "w-9" },
          ].map((pill, i) => (
            <motion.div
              key={i}
              className={cn("h-5 rounded-full flex items-center gap-1 px-1.5", pill.color, pill.w)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.15 }}
            >
              <div className={cn("w-1.5 h-1.5 rounded-full", pill.dot)} />
              <div className="flex-1 h-1 rounded-full bg-foreground/10" />
            </motion.div>
          ))}
        </div>

        {/* Live feed cards */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="mx-2 mb-1.5 p-2 rounded-lg bg-muted/30 border border-border/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.2 }}
          >
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-2 h-2 rounded-full",
                i === 0 ? "bg-red-500" : i === 1 ? "bg-amber-500" : "bg-emerald-500"
              )} />
              <div className="h-1.5 rounded-full bg-foreground/15 flex-1" />
              <div className="h-1 rounded-full bg-foreground/8 w-6" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Floating live indicator */}
      <motion.div
        className="absolute -top-2 -right-1 flex items-center gap-1 bg-red-500/15 border border-red-500/30 rounded-full px-2 py-0.5"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
        <span className="text-[8px] font-bold text-red-400">LIVE</span>
      </motion.div>
    </div>
  );
}

function CheckpointsIllustration() {
  const statuses = [
    { color: "bg-emerald-500", ring: "ring-emerald-500/30", label: "مفتوح" },
    { color: "bg-red-500", ring: "ring-red-500/30", label: "مغلق" },
    { color: "bg-amber-500", ring: "ring-amber-500/30", label: "مزدحم" },
    { color: "bg-emerald-500", ring: "ring-emerald-500/30", label: "مفتوح" },
  ];

  return (
    <div className="relative w-56 h-48 mx-auto flex items-center justify-center">
      {/* Road path */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 224 192">
        <motion.path
          d="M 30 170 C 60 120, 80 100, 112 96 S 164 72, 194 22"
          stroke="currentColor"
          className="text-primary/20"
          strokeWidth="3"
          fill="none"
          strokeDasharray="8 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>

      {/* Checkpoint nodes along the path */}
      {statuses.map((s, i) => {
        const positions = [
          { x: 22, y: 155 },
          { x: 72, y: 115 },
          { x: 128, y: 85 },
          { x: 182, y: 28 },
        ];
        return (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center"
            style={{ left: positions[i].x, top: positions[i].y }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.25, type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className={cn(
              "w-5 h-5 rounded-full ring-4 flex items-center justify-center",
              s.color, s.ring
            )}>
              <Shield className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-[7px] font-bold text-foreground/50 mt-0.5 whitespace-nowrap">
              {s.label}
            </span>
          </motion.div>
        );
      })}

      {/* Animated car */}
      <motion.div
        className="absolute"
        initial={{ left: 25, top: 158 }}
        animate={{
          left: [25, 70, 125, 180],
          top: [158, 118, 88, 32],
        }}
        transition={{ duration: 4, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
      >
        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
      </motion.div>
    </div>
  );
}

function RoutesIllustration() {
  return (
    <div className="relative w-56 h-48 mx-auto flex items-center justify-center">
      {/* City nodes */}
      {[
        { x: 40, y: 30, name: "نابلس", delay: 0.3 },
        { x: 160, y: 30, name: "جنين", delay: 0.5 },
        { x: 30, y: 100, name: "رام الله", delay: 0.4 },
        { x: 170, y: 100, name: "طولكرم", delay: 0.6 },
        { x: 100, y: 160, name: "القدس", delay: 0.7 },
      ].map((city, i) => (
        <motion.div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: city.x - 16, top: city.y - 12 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: city.delay, type: "spring", stiffness: 300 }}
        >
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[8px] font-bold text-foreground/60 mt-0.5">{city.name}</span>
        </motion.div>
      ))}

      {/* Animated route line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 224 192">
        <motion.path
          d="M 40 42 C 50 70, 35 90, 38 100 S 60 140, 100 160"
          stroke="currentColor"
          className="text-primary"
          strokeWidth="2.5"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
        />
        {/* Route glow */}
        <motion.path
          d="M 40 42 C 50 70, 35 90, 38 100 S 60 140, 100 160"
          stroke="currentColor"
          className="text-primary"
          strokeWidth="6"
          fill="none"
          opacity="0.15"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
        />
      </svg>

      {/* "Selected route" badge */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 bottom-2 flex items-center gap-1.5 bg-primary/15 border border-primary/30 rounded-full px-3 py-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <Navigation className="w-3 h-3 text-primary" />
        <span className="text-[9px] font-bold text-primary">نابلس ← القدس</span>
      </motion.div>
    </div>
  );
}

function AlertsIllustration() {
  const alerts = [
    { icon: Zap, color: "border-red-500/40 bg-red-500/10", iconColor: "text-red-500", delay: 0.4 },
    { icon: Shield, color: "border-amber-500/40 bg-amber-500/10", iconColor: "text-amber-500", delay: 0.7 },
    { icon: AlertTriangle, color: "border-primary/40 bg-primary/10", iconColor: "text-primary", delay: 1.0 },
  ];

  return (
    <div className="relative w-56 h-48 mx-auto flex flex-col items-center justify-center gap-2.5">
      {alerts.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.div
            key={i}
            className={cn("w-full max-w-[200px] rounded-xl border p-3 flex items-center gap-3", a.color)}
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: a.delay, type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="shrink-0">
              <Icon className={cn("w-5 h-5", a.iconColor)} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-2 rounded-full bg-foreground/15 w-3/4" />
              <div className="h-1.5 rounded-full bg-foreground/8 w-1/2" />
            </div>
            <Clock className="w-3 h-3 text-foreground/20 shrink-0" />
          </motion.div>
        );
      })}

      {/* Bell notification badge */}
      <motion.div
        className="absolute -top-1 right-4"
        animate={{ rotate: [-5, 5, -5], y: [0, -2, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="relative">
          <Bell className="w-7 h-7 text-primary/40" />
          <motion.div
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.3, type: "spring" }}
          >
            <span className="text-[7px] font-bold text-white">3</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function MapIllustration() {
  return (
    <div className="relative w-56 h-48 mx-auto overflow-hidden rounded-2xl border-2 border-primary/15 bg-card/20">
      {/* Fake map grid */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 224 192">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 24} x2="224" y2={i * 24} stroke="currentColor" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 24} y1="0" x2={i * 24} y2="192" stroke="currentColor" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Map pins with different statuses */}
      {[
        { x: 60, y: 50, color: "bg-emerald-500", pulse: true },
        { x: 140, y: 40, color: "bg-red-500", pulse: false },
        { x: 90, y: 110, color: "bg-amber-500", pulse: false },
        { x: 170, y: 90, color: "bg-emerald-500", pulse: false },
        { x: 45, y: 140, color: "bg-red-500", pulse: true },
      ].map((pin, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: pin.x - 5, top: pin.y - 5 }}
          initial={{ scale: 0, y: -10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.2, type: "spring", stiffness: 300 }}
        >
          {pin.pulse && (
            <motion.div
              className={cn("absolute inset-0 rounded-full", pin.color, "opacity-30")}
              animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <div className={cn("w-3 h-3 rounded-full border-2 border-white shadow-lg", pin.color)} />
        </motion.div>
      ))}

      {/* User location */}
      <motion.div
        className="absolute"
        style={{ left: 105, top: 85 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.2, type: "spring" }}
      >
        <motion.div
          className="absolute -inset-3 rounded-full bg-blue-500/15"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="w-4 h-4 rounded-full bg-blue-500 border-3 border-white shadow-lg" />
      </motion.div>

      {/* "Live Map" label */}
      <motion.div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur rounded-full px-3 py-1 flex items-center gap-1.5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <MapIcon className="w-3 h-3 text-primary" />
        <span className="text-[9px] font-bold text-foreground/70">الخريطة المباشرة</span>
      </motion.div>
    </div>
  );
}

function ReadyIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      {/* Success ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-emerald-500/20"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full border border-emerald-500/10"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1, type: "spring" }}
      />

      {/* Center checkmark */}
      <motion.div
        className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-primary/10 border border-emerald-500/30 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-emerald-500">
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          />
        </svg>
      </motion.div>

      {/* Confetti-like particles */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 85;
        return (
          <motion.div
            key={i}
            className={cn(
              "absolute w-1.5 h-1.5 rounded-full",
              i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-emerald-500" : "bg-amber-500"
            )}
            style={{ left: "50%", top: "50%" }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{ duration: 1.2, delay: 0.6 + i * 0.05, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

// ── Permissions step (interactive — not just illustration) ────────────────

function PermissionsPanel({
  onRequestLocation,
  onRequestNotifications,
}: {
  onRequestLocation?: () => Promise<boolean>;
  onRequestNotifications?: () => Promise<boolean | void>;
}) {
  const [locStatus, setLocStatus] = useState<"idle" | "granted" | "denied">("idle");
  const [notifStatus, setNotifStatus] = useState<"idle" | "granted" | "denied">("idle");
  const [busy, setBusy] = useState(false);

  const handleLocation = async () => {
    if (busy || !onRequestLocation) return;
    setBusy(true);
    try {
      const granted = await onRequestLocation();
      setLocStatus(granted ? "granted" : "denied");
    } catch {
      setLocStatus("denied");
    }
    setBusy(false);
  };

  const handleNotifications = async () => {
    if (busy || !onRequestNotifications) return;
    setBusy(true);
    try {
      await onRequestNotifications();
      setNotifStatus("granted");
    } catch {
      setNotifStatus("denied");
    }
    setBusy(false);
  };

  return (
    <div className="w-60 mx-auto space-y-3">
      {/* Location permission */}
      <motion.button
        onClick={handleLocation}
        disabled={locStatus !== "idle" || busy}
        className={cn(
          "w-full rounded-2xl border p-4 flex items-center gap-3 text-right transition-all",
          locStatus === "granted"
            ? "bg-emerald-500/10 border-emerald-500/30"
            : locStatus === "denied"
              ? "bg-muted/30 border-border/20 opacity-60"
              : "bg-blue-500/5 border-blue-500/20 active:scale-[0.97]"
        )}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          locStatus === "granted" ? "bg-emerald-500/15" : "bg-blue-500/10"
        )}>
          {locStatus === "granted" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-500">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <MapPin className="w-5 h-5 text-blue-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">الموقع الجغرافي</p>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">لعرض موقعك على الخريطة ومعرفة الحواجز القريبة</p>
        </div>
        {locStatus === "idle" && (
          <motion.div
            className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-500"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            تفعيل
          </motion.div>
        )}
      </motion.button>

      {/* Notifications permission */}
      <motion.button
        onClick={handleNotifications}
        disabled={notifStatus !== "idle" || busy}
        className={cn(
          "w-full rounded-2xl border p-4 flex items-center gap-3 text-right transition-all",
          notifStatus === "granted"
            ? "bg-emerald-500/10 border-emerald-500/30"
            : notifStatus === "denied"
              ? "bg-muted/30 border-border/20 opacity-60"
              : "bg-amber-500/5 border-amber-500/20 active:scale-[0.97]"
        )}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          notifStatus === "granted" ? "bg-emerald-500/15" : "bg-amber-500/10"
        )}>
          {notifStatus === "granted" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-500">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <Bell className="w-5 h-5 text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">الإشعارات الفورية</p>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">لتنبيهك عند إغلاق حاجز على مسارك أو وقوع حادثة</p>
        </div>
        {notifStatus === "idle" && (
          <motion.div
            className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            تفعيل
          </motion.div>
        )}
      </motion.button>

      <motion.p
        className="text-[10px] text-muted-foreground/50 text-center pt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        يمكنك تغيير هذه الإعدادات لاحقاً
      </motion.p>
    </div>
  );
}

// ── Step definitions ───────────────────────────────────────────────────────

interface OnboardingStep {
  id: string;
  illustration: React.ReactNode | "permissions"; // "permissions" = special interactive step
  title: string;
  subtitle: string;
  body: string;
  gradient: string;
  accentColor: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    illustration: <WelcomeIllustration />,
    title: "متتبع الضفة الغربية",
    subtitle: "أهلاً بك",
    body: "رفيقك اليومي لمعرفة أحوال الطرق والحواجز والتنبيهات الأمنية لحظة بلحظة.",
    gradient: "from-primary/8 via-transparent to-transparent",
    accentColor: "bg-primary",
  },
  {
    id: "dashboard",
    illustration: <DashboardIllustration />,
    title: "لوحة المعلومات",
    subtitle: "نظرة شاملة",
    body: "شاشة رئيسية تعرض حالة الحواجز، عدد الإغلاقات، آخر التحديثات، والأحداث الطارئة — كلها في مكان واحد.",
    gradient: "from-blue-500/8 via-transparent to-transparent",
    accentColor: "bg-blue-500",
  },
  {
    id: "checkpoints",
    illustration: <CheckpointsIllustration />,
    title: "الحواجز العسكرية",
    subtitle: "حالة فورية",
    body: "تتبّع حالة كل حاجز — مفتوح، مغلق، أو مزدحم — مع تحديثات فورية من المجتمع والمصادر الموثوقة.",
    gradient: "from-emerald-500/8 via-transparent to-transparent",
    accentColor: "bg-emerald-500",
  },
  {
    id: "routes",
    illustration: <RoutesIllustration />,
    title: "تخطيط المسار",
    subtitle: "طريقك الآمن",
    body: "اختر نقطة البداية والوجهة لمعرفة حالة الحواجز على مسارك، واحصل على تنبيهات مخصصة لطريقك.",
    gradient: "from-violet-500/8 via-transparent to-transparent",
    accentColor: "bg-violet-500",
  },
  {
    id: "alerts",
    illustration: <AlertsIllustration />,
    title: "التنبيهات الأمنية",
    subtitle: "لحظة بلحظة",
    body: "تنبيهات فورية عن صواريخ وإنذارات، عمليات عسكرية، اعتداءات مستوطنين، وإغلاقات طرق — مصنّفة حسب الخطورة.",
    gradient: "from-red-500/8 via-transparent to-transparent",
    accentColor: "bg-red-500",
  },
  {
    id: "map",
    illustration: <MapIllustration />,
    title: "الخريطة المباشرة",
    subtitle: "رؤية كاملة",
    body: "خريطة تفاعلية تعرض جميع الحواجز والأحداث ومسارك وموقعك الحالي — كل شيء بنقرة واحدة.",
    gradient: "from-amber-500/8 via-transparent to-transparent",
    accentColor: "bg-amber-500",
  },
  {
    id: "permissions",
    illustration: "permissions",
    title: "أذونات التطبيق",
    subtitle: "خطوة أخيرة",
    body: "فعّل الصلاحيات للحصول على أفضل تجربة — يمكنك تغييرها لاحقاً من الإعدادات.",
    gradient: "from-cyan-500/8 via-transparent to-transparent",
    accentColor: "bg-cyan-500",
  },
  {
    id: "ready",
    illustration: <ReadyIllustration />,
    title: "أنت جاهز",
    subtitle: "ابدأ الآن",
    body: "التطبيق جاهز. اكتشف حالة الحواجز، خطط مسارك، واحصل على تنبيهات فورية لتبقى آمناً.",
    gradient: "from-emerald-500/8 via-transparent to-transparent",
    accentColor: "bg-emerald-500",
  },
];

// ── Main component ─────────────────────────────────────────────────────────

interface OnboardingFlowProps {
  onComplete: () => void;
  onRequestLocation?: () => Promise<boolean>;
  onRequestNotifications?: () => Promise<boolean | void>;
}

export function OnboardingFlow({
  onComplete,
  onRequestLocation,
  onRequestNotifications,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = back, 1 = forward
  const [exiting, setExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;
  const progress = (currentStep + 1) / STEPS.length;

  const goNext = useCallback(() => {
    if (isLast) {
      markOnboardingDone();
      setExiting(true);
      setTimeout(onComplete, 500);
      return;
    }
    setDirection(1);
    setCurrentStep(s => s + 1);
  }, [isLast, onComplete]);

  const goBack = useCallback(() => {
    if (isFirst) return;
    setDirection(-1);
    setCurrentStep(s => s - 1);
  }, [isFirst]);

  const handleSkip = useCallback(() => {
    markOnboardingDone();
    setExiting(true);
    setTimeout(onComplete, 500);
  }, [onComplete]);

  // Swipe gesture handling
  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 60;
    // RTL: swipe right = next, swipe left = back
    if (info.offset.x > threshold && info.velocity.x > 0) {
      goNext();
    } else if (info.offset.x < -threshold && info.velocity.x < 0) {
      goBack();
    }
  }, [goNext, goBack]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        // RTL: left arrow = back, right arrow = next
        if (e.key === "ArrowRight") goNext();
        else goBack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goBack]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? -300 : 300, // RTL: forward = slide from left
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          ref={containerRef}
          key="onboarding"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[200] bg-background flex flex-col overflow-hidden select-none"
          dir="rtl"
        >
          {/* ── Top section with gradient and illustration ── */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            {/* Background gradient */}
            <motion.div
              key={step.id + "-gradient"}
              className={cn("absolute inset-0 bg-gradient-to-b", step.gradient)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />

            {/* Skip button */}
            {!isLast && (
              <div className="relative z-10 flex items-center justify-between px-5 pt-[max(12px,env(safe-area-inset-top))]">
                <button
                  onClick={handleSkip}
                  className="text-xs text-muted-foreground/70 font-medium py-2 px-1 active:opacity-50 transition-opacity"
                >
                  تخطّي
                </button>
                <span className="text-[10px] text-muted-foreground/50 font-medium tabular-nums">
                  {currentStep + 1} / {STEPS.length}
                </span>
              </div>
            )}

            {/* Illustration area — swipeable */}
            <motion.div
              className="flex-1 flex items-center justify-center px-6"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              style={{ x: dragX, touchAction: "pan-y" }}
            >
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {step.illustration === "permissions" ? (
                    <PermissionsPanel
                      onRequestLocation={onRequestLocation}
                      onRequestNotifications={onRequestNotifications}
                    />
                  ) : (
                    step.illustration
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── Bottom section: text + controls ── */}
          <div className="shrink-0 px-6 pb-[max(20px,env(safe-area-inset-bottom))]">
            {/* Progress bar */}
            <div className="w-full h-0.5 bg-border/30 rounded-full mb-6 overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            {/* Text content */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step.id + "-text"}
                custom={direction}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center mb-6"
              >
                <motion.p
                  className="text-xs font-semibold text-primary mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {step.subtitle}
                </motion.p>
                <h2 className="text-2xl font-black text-foreground mb-2.5 leading-tight">
                  {step.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
                  {step.body}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Step dots */}
            <div className="flex justify-center gap-1.5 mb-5">
              {STEPS.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => {
                    setDirection(i > currentStep ? 1 : -1);
                    setCurrentStep(i);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentStep
                      ? cn("w-6", step.accentColor)
                      : i < currentStep
                        ? "w-1.5 bg-primary/30"
                        : "w-1.5 bg-border/50"
                  )}
                  whileTap={{ scale: 0.8 }}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {!isFirst && (
                <motion.button
                  onClick={goBack}
                  className="w-14 h-14 rounded-2xl bg-muted/50 border border-border/30 flex items-center justify-center text-muted-foreground active:scale-90 transition-all"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </motion.button>
              )}

              <motion.button
                onClick={goNext}
                className={cn(
                  "flex-1 h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-all",
                  isLast
                    ? "bg-gradient-to-l from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                )}
                whileTap={{ scale: 0.97 }}
              >
                {isLast ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>ابدأ الاستخدام</span>
                  </>
                ) : (
                  <>
                    <span>التالي</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
