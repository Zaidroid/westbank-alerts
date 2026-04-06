import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: "home" | "news" | "checkpoints" | "map" | "profile";
  onTabChange: (tab: "home" | "news" | "checkpoints" | "map" | "profile") => void;
  badges?: {
    home?: number;
    news?: number;
    checkpoints?: number;
    map?: number;
    profile?: number;
  };
}

export function BottomNav({ activeTab, onTabChange, badges }: BottomNavProps) {
  const { t } = useLang();

  const TABS = [
    { id: "home", icon: "home", label: t.home || "HOME" },
    { id: "checkpoints", icon: "shield", label: t.checkpoints || "CHECKPOINTS" },
    { id: "map", icon: "map", label: t.liveMap || "MAP" },
    { id: "news", icon: "feed", label: t.alerts || "NEWS" },
    { id: "profile", icon: "person", label: t.settings || "PROFILE" },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex items-stretch bg-background/80 backdrop-blur-3xl border-t border-outline-variant/10 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
      style={{
        paddingBottom: "var(--safe-area-inset-bottom, 0px)",
        minHeight: "calc(70px + var(--safe-area-inset-bottom, 0px))",
      }}
    >
      {TABS.map(({ id, icon, label }) => {
        const isActive = activeTab === id;
        const badgeCount = badges?.[id as keyof typeof badges];

        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 relative transition-all duration-200 active:scale-90"
            style={{ minHeight: 70 }}
          >
            <div className="relative flex items-center justify-center w-12 h-8">
              {isActive && (
                <motion.div
                  layoutId="bottomnav-active-pill"
                  className="absolute inset-0 bg-secondary/20 rounded-full shadow-[0_0_15px_rgba(254,179,0,0.15)]"
                  transition={{ type: "spring", damping: 20, stiffness: 250 }}
                />
              )}

              <span
                className={cn(
                  "material-symbols-outlined text-[26px] z-10 transition-colors duration-200",
                  isActive ? "filled text-secondary" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {icon}
              </span>

              {badgeCount != null && badgeCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-[-2px] end-[-2px] z-20 min-w-[16px] h-4 px-1 rounded-full bg-error text-on-error font-headline text-[9px] font-bold flex items-center justify-center leading-none border-2 border-background shadow-sm"
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </motion.span>
              )}
            </div>

            <span
              className={cn(
                "text-[10px] font-label font-bold tracking-wider uppercase transition-colors duration-200",
                isActive ? "text-secondary" : "text-on-surface-variant"
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
