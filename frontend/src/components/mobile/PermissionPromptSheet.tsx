/**
 * PermissionPromptSheet — one-time prompt after splash for location + notifications.
 * Shows only once; decision stored in localStorage.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Bell, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "wb-permissions-prompted";

export function hasBeenPrompted(): boolean {
  try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
}

function markPrompted() {
  try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
}

interface PermissionPromptSheetProps {
  isOpen: boolean;
  onRequestLocation: () => Promise<boolean>;
  onRequestNotifications: () => Promise<void>;
  onDone: () => void;
}

type Step = "intro" | "location" | "notifications" | "done";

export function PermissionPromptSheet({
  isOpen,
  onRequestLocation,
  onRequestNotifications,
  onDone,
}: PermissionPromptSheetProps) {
  const [step, setStep] = useState<Step>("intro");
  const [locGranted, setLocGranted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const handleAllow = async () => {
    if (busy) return;
    setBusy(true);

    if (step === "intro") {
      setStep("location");
      setBusy(false);
      return;
    }

    if (step === "location") {
      const granted = await onRequestLocation();
      setLocGranted(granted);
      setStep("notifications");
      setBusy(false);
      return;
    }

    if (step === "notifications") {
      await onRequestNotifications();
      markPrompted();
      setStep("done");
      setBusy(false);
      setTimeout(onDone, 800);
    }
  };

  const handleSkip = () => {
    if (step === "location") {
      setStep("notifications");
      return;
    }
    markPrompted();
    onDone();
  };

  const STEPS: Record<Exclude<Step, "done">, {
    emoji: string;
    title: string;
    body: string;
    allow: string;
    skip: string;
    accent: string;
  }> = {
    intro: {
      emoji: "👋",
      title: "مرحباً بك في الضفة مباشر",
      body: "للحصول على أفضل تجربة، نحتاج إذنك لبعض الميزات — يمكنك تغييرها لاحقاً من الإعدادات.",
      allow: "ابدأ الإعداد",
      skip: "تخطّ",
      accent: "text-primary",
    },
    location: {
      emoji: "📍",
      title: "الموقع الجغرافي",
      body: "يُستخدم لتحديد موقعك على الخريطة ومعرفة الحواجز القريبة منك. لا يُشارك موقعك مع أي جهة.",
      allow: "السماح بالموقع",
      skip: "ليس الآن",
      accent: "text-blue-400",
    },
    notifications: {
      emoji: "🔔",
      title: "الإشعارات الفورية",
      body: "نُرسل لك تنبيهات فورية عند إغلاق حاجز على مسارك أو وقوع حادثة خطيرة قريبة منك.",
      allow: "تفعيل الإشعارات",
      skip: "ليس الآن",
      accent: "text-amber-400",
    },
  };

  const current = step !== "done" ? STEPS[step] : null;

  return (
    <AnimatePresence>
      {isOpen && step !== "done" && current && (
        <>
          {/* Backdrop */}
          <motion.div
            key="perm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key="perm-sheet"
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="fixed bottom-0 inset-x-0 z-[81] bg-background rounded-t-3xl overflow-hidden"
            style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border/50" />
            </div>

            <div className="px-6 pt-4 pb-2 space-y-6">
              {/* Emoji + title */}
              <div className="text-center space-y-3">
                <motion.span
                  key={step}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="text-5xl block"
                >
                  {current.emoji}
                </motion.span>
                <motion.h2
                  key={step + "-title"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-black text-foreground"
                >
                  {current.title}
                </motion.h2>
                <motion.p
                  key={step + "-body"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {current.body}
                </motion.p>
              </div>

              {/* Step indicators */}
              <div className="flex justify-center gap-2">
                {(["intro", "location", "notifications"] as Step[]).map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      s === step ? "w-6 bg-primary" : "w-1.5 bg-border/50"
                    )}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2.5">
                <button
                  onClick={handleAllow}
                  disabled={busy}
                  className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {busy ? "جارٍ..." : current.allow}
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full py-2.5 rounded-2xl text-muted-foreground text-sm font-medium active:opacity-60 transition-opacity"
                >
                  {current.skip}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
