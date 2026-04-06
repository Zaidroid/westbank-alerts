import { Bell, BellOff, Moon, Sun, Navigation, Bookmark, BookmarkX, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { getAllRoutes } from "@/lib/routes";
import type { Route } from "@/lib/routes";
import type { NotificationPermission } from "@/hooks/usePushNotifications";

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Notifications
  notifPermission: NotificationPermission;
  notifEnabled: boolean;
  notifSupported: boolean;
  onEnableNotifications: () => void;
  onDisableNotifications: () => void;
  // Saved routes
  savedRoutes: Route[];
  activeRoute: Route | null;
  onSelectRoute: (route: Route) => void;
  onRemoveSavedRoute: (routeId: string) => void;
  isCurrentRouteSaved: boolean;
  onSaveCurrentRoute: () => void;
}

function ToggleRow({
  icon,
  label,
  sublabel,
  active,
  onToggle,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 py-3 text-start transition-opacity",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      {/* Toggle */}
      <div className={cn(
        "w-11 h-6 rounded-full relative transition-colors shrink-0",
        active ? "bg-primary" : "bg-muted"
      )}>
        <div className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
          active ? "translate-x-5 start-1" : "translate-x-0 start-1"
        )} />
      </div>
    </button>
  );
}

export function SettingsSheet({
  isOpen,
  onOpenChange,
  notifPermission,
  notifEnabled,
  notifSupported,
  onEnableNotifications,
  onDisableNotifications,
  savedRoutes,
  activeRoute,
  onSelectRoute,
  onRemoveSavedRoute,
  isCurrentRouteSaved,
  onSaveCurrentRoute,
}: SettingsSheetProps) {
  const { t, lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();

  const notifSubLabel = !notifSupported
    ? "غير مدعوم في هذا المتصفح"
    : notifPermission === "denied"
    ? "مرفوض — فعّل من إعدادات المتصفح"
    : notifEnabled
    ? "تصلك تنبيهات عند وصول إشعارات حرجة"
    : "اضغط لتفعيل التنبيهات";

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80dvh] flex flex-col p-0 rounded-t-2xl">
        <SheetHeader className="px-5 pt-5 pb-3 shrink-0 border-b border-border/30">
          <SheetTitle className="text-base font-bold">الإعدادات</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-8 divide-y divide-border/30">
          {/* === APPEARANCE === */}
          <div className="pt-4 pb-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              المظهر
            </p>
            <ToggleRow
              icon={theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              label={theme === "dark" ? "الوضع الليلي" : "الوضع النهاري"}
              sublabel={theme === "dark" ? "خلفية داكنة" : "خلفية فاتحة"}
              active={theme === "dark"}
              onToggle={toggleTheme}
            />

            {/* Language */}
            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground">
                ع
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">اللغة / Language</p>
              </div>
              <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
                <button
                  onClick={() => setLang("ar")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                    lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  عربي
                </button>
                <button
                  onClick={() => setLang("en")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold transition-all",
                    lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  EN
                </button>
              </div>
            </div>
          </div>

          {/* === NOTIFICATIONS === */}
          <div className="pt-4 pb-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
              الإشعارات
            </p>
            <ToggleRow
              icon={notifEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              label="تنبيهات فورية"
              sublabel={notifSubLabel}
              active={notifEnabled && notifPermission === "granted"}
              onToggle={notifEnabled ? onDisableNotifications : onEnableNotifications}
              disabled={!notifSupported || notifPermission === "denied"}
            />
          </div>

          {/* === SAVED ROUTES === */}
          <div className="pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                مسارات محفوظة
              </p>
              {activeRoute && !isCurrentRouteSaved && (
                <button
                  onClick={onSaveCurrentRoute}
                  className="flex items-center gap-1 text-xs text-primary font-medium active:opacity-70"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  حفظ الحالي
                </button>
              )}
            </div>

            {savedRoutes.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                لا توجد مسارات محفوظة. اختر مساراً واحفظه للوصول السريع.
              </p>
            )}

            <div className="space-y-1.5">
              {savedRoutes.map(route => (
                <div
                  key={route.id}
                  className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2.5"
                >
                  <Navigation className="w-4 h-4 text-muted-foreground shrink-0" />
                  <button
                    className="flex-1 text-start min-w-0"
                    onClick={() => { onSelectRoute(route); onOpenChange(false); }}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{route.name_ar}</p>
                    <p className="text-xs text-muted-foreground">{route.distance_km} كم</p>
                  </button>
                  {activeRoute?.id === route.id && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                  <button
                    onClick={() => onRemoveSavedRoute(route.id)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <BookmarkX className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
