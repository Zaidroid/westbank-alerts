import { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { X, Download, RefreshCw, Share } from "lucide-react";

// BeforeInstallPromptEvent is not in the standard TS lib
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode(): boolean {
  return ("standalone" in navigator && (navigator as any).standalone === true)
    || window.matchMedia("(display-mode: standalone)").matches;
}

const IOS_PROMPT_KEY = "wb-ios-install-dismissed";

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (r) {
        // Check for updates every 5 minutes for faster rollout
        r.update();
        setInterval(() => r.update(), 5 * 60 * 1000);
      }
    },
  });

  // Android: beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowInstall(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // iOS: show manual instructions if not installed and not previously dismissed
  useEffect(() => {
    if (isIos() && !isInStandaloneMode()) {
      try {
        if (!localStorage.getItem(IOS_PROMPT_KEY)) {
          setTimeout(() => setShowIosPrompt(true), 4000);
        }
      } catch {}
    }
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setShowInstall(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowInstall(false);
  };

  const handleDismissIos = () => {
    setShowIosPrompt(false);
    try { localStorage.setItem(IOS_PROMPT_KEY, "1"); } catch {}
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
    setNeedRefresh(false);
  };

  // SW update banner takes priority
  if (needRefresh) {
    return (
      <div className="fixed bottom-[68px] md:bottom-4 inset-x-0 md:inset-x-auto md:right-4 md:left-auto md:max-w-sm z-[70] px-3 md:px-0" dir="rtl">
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">تحديث متاح</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              نسخة جديدة من التطبيق جاهزة.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleUpdate}
              className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg active:scale-95 transition-all"
            >
              تحديث
            </button>
            <button onClick={() => setNeedRefresh(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (dismissed && !showIosPrompt) return null;

  // iOS install instructions
  if (showIosPrompt) {
    return (
      <div className="fixed bottom-[68px] md:bottom-4 inset-x-0 md:inset-x-auto md:right-4 md:left-auto md:max-w-sm z-[70] px-3 md:px-0" dir="rtl">
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Share className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">ثبّت التطبيق</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              اضغط على زر المشاركة
              <span className="inline-block mx-1 align-middle">
                <Share className="w-3.5 h-3.5 inline" />
              </span>
              ثم اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong>
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleDismissIos}
                className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 active:opacity-70"
              >
                فهمت
              </button>
            </div>
          </div>
          <button onClick={handleDismissIos} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Android install prompt
  if (!showInstall || !installPrompt) return null;

  return (
    <div className="fixed bottom-[68px] md:bottom-4 inset-x-0 md:inset-x-auto md:right-4 md:left-auto md:max-w-sm z-[70] px-3 md:px-0" dir="rtl">
      <div className="bg-card border border-border rounded-xl shadow-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">ثبّت التطبيق</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            أضف للشاشة الرئيسية للوصول السريع وتلقي آخر تحديثات الحواجز.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg active:scale-95 transition-all"
            >
              تثبيت
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1.5"
            >
              لاحقاً
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
