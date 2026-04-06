import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/api/types";
import { useLang } from "@/lib/i18n";
import { environment } from "@/config/environment";

interface SentinelProfileProps {
  connectionStatus: ConnectionStatus;
  userLocation: { latitude: number; longitude: number } | null;
  locationName: string;
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setTheme(newTheme);
  };

  return { theme, toggleTheme };
}

export function SentinelProfile({ connectionStatus, userLocation, locationName }: SentinelProfileProps) {
  const { t, lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  
  const [notifications, setNotifications] = useState({
    critical: true,
    checkpoints: true,
    military: true,
  });

  return (
    <div className="flex flex-col min-h-full pb-[100px]">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-5xl font-headline font-bold text-on-surface tracking-tighter leading-none px-1" dir="auto">
          {t.settings || "Settings"}
        </h1>
      </div>

      <div className="px-4 space-y-6 mt-4">
        
        {/* --- Location & Connection --- */}
        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/20 relative overflow-hidden">
          <div className="absolute top-0 end-0 p-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[80px]">public</span>
          </div>
          
          <h2 className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">sensors</span>
            {t.location}
          </h2>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-headline font-bold text-on-surface mb-0.5">Connection</p>
              <p className="text-xs font-body text-on-surface-variant line-clamp-1">
                {connectionStatus === "connected" ? "Real-time updates active" : 
                 connectionStatus === "connecting" ? "Establishing secure connection..." : "Offline mode fallback"}
              </p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-label font-bold uppercase tracking-widest border",
              connectionStatus === "connected" ? "bg-tertiary/10 text-tertiary border-tertiary/30 shadow-[0_0_10px_rgba(75,238,116,0.1)]" :
              connectionStatus === "connecting" ? "bg-secondary/10 text-secondary border-secondary/30" :
              "bg-error/10 text-error border-error/30"
            )}>
              {connectionStatus}
            </div>
          </div>
          
          <div className="h-[1px] w-full bg-outline-variant/30 my-3" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-headline font-bold text-on-surface mb-0.5" dir="auto">{t.location}</p>
              <p className="text-xs font-body text-on-surface-variant" dir="auto">
                {locationName} {userLocation ? `(${userLocation.latitude.toFixed(2)}, ${userLocation.longitude.toFixed(2)})` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* --- Notification Preferences --- */}
        <div>
          <h2 className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-3 ms-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">notifications_active</span>
            {t.pushNotifications || "Push Notifications"}
          </h2>
          
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
              <div>
                <p className="text-sm font-headline font-bold text-on-surface">{t.criticalAlerts}</p>
              </div>
              <div 
                className={cn("w-12 h-6 rounded-full p-1 cursor-pointer transition-colors relative", notifications.critical ? "bg-error" : "bg-surface-container-high border border-outline-variant/50")}
                onClick={() => setNotifications(p => ({...p, critical: !p.critical}))}
              >
                <div className={cn("w-4 h-4 bg-background rounded-full transition-transform shadow-md", notifications.critical ? (lang === 'ar' ? "-translate-x-6" : "translate-x-6") : "translate-x-0")} />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
              <div>
                <p className="text-sm font-headline font-bold text-on-surface">{t.military || "Military Operations"}</p>
              </div>
              <div 
                className={cn("w-12 h-6 rounded-full p-1 cursor-pointer transition-colors relative", notifications.military ? "bg-purple-500" : "bg-surface-container-high border border-outline-variant/50")}
                onClick={() => setNotifications(p => ({...p, military: !p.military}))}
              >
                <div className={cn("w-4 h-4 bg-background rounded-full transition-transform shadow-md", notifications.military ? (lang === 'ar' ? "-translate-x-6" : "translate-x-6") : "translate-x-0")} />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
              <div>
                <p className="text-sm font-headline font-bold text-on-surface">{t.checkpoints}</p>
              </div>
              <div 
                className={cn("w-12 h-6 rounded-full p-1 cursor-pointer transition-colors relative", notifications.checkpoints ? "bg-secondary" : "bg-surface-container-high border border-outline-variant/50")}
                onClick={() => setNotifications(p => ({...p, checkpoints: !p.checkpoints}))}
              >
                <div className={cn("w-4 h-4 bg-background rounded-full transition-transform shadow-md", notifications.checkpoints ? (lang === 'ar' ? "-translate-x-6" : "translate-x-6") : "translate-x-0")} />
              </div>
            </div>
          </div>
        </div>

        {/* --- Language & App Settings --- */}
        <div>
          <h2 className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-3 ms-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">settings</span>
            {lang === 'ar' ? 'إعدادات النظام' : 'System Settings'}
          </h2>
          
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/10">
              <div>
                <p className="text-sm font-headline font-bold text-on-surface">{t.language || "Language"}</p>
              </div>
              <div className="flex bg-surface-container p-1 rounded-lg border border-outline-variant/30">
                <button 
                  onClick={() => setLang('en')}
                  className={cn("px-3 py-1 rounded text-xs font-bold font-label transition-colors flex items-center gap-1", lang === 'en' ? "bg-surface-container-highest text-on-surface" : "text-on-surface-variant hover:text-on-surface")}
                >
                  <span className="text-[14px]">🇺🇸</span>
                  EN
                </button>
                <button 
                  onClick={() => setLang('ar')}
                  className={cn("px-3 py-1 rounded text-xs font-bold font-label transition-colors flex items-center gap-1", lang === 'ar' ? "bg-surface-container-highest text-on-surface" : "text-on-surface-variant hover:text-on-surface")}
                >
                  <span className="text-[14px]">🇵🇸</span>
                  عربي
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-headline font-bold text-on-surface">{lang === 'ar' ? "المظهر" : "Theme Style"}</p>
              </div>
              <div 
                className={cn("w-14 h-7 rounded-full p-1 cursor-pointer transition-colors relative", theme === 'dark' ? "bg-surface-container border border-outline-variant/30" : "bg-secondary/20 border border-secondary")}
                onClick={toggleTheme}
              >
                <div className={cn("w-5 h-5 bg-background rounded-full transition-transform shadow flex items-center justify-center", theme === 'light' ? (lang === 'ar' ? "-translate-x-7" : "translate-x-7") : "translate-x-0")}>
                  {theme === 'dark' ? <span className="text-[12px]">🌙</span> : <span className="text-[12px]">☀️</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 pb-2 text-center text-on-surface-variant opacity-50 flex flex-col items-center gap-1">
          <span className="material-symbols-outlined text-[24px] mb-1">security</span>
          <p className="text-[10px] font-label font-bold uppercase tracking-widest">
            The Guardian Sentinel
          </p>
          <p className="text-[9px] font-body">
            Version {environment.API_VERSION || "2.1.0"}
          </p>
        </div>

      </div>
    </div>
  );
}
