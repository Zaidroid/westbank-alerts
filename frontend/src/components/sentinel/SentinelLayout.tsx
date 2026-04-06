import { ReactNode, useRef } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import type { ConnectionStatus } from "@/lib/api/types";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type TabId = "home" | "news" | "checkpoints" | "map" | "profile";

const TAB_ORDER: TabId[] = ["home", "checkpoints", "map", "news", "profile"];

interface SentinelLayoutProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  locationName: string;
  connectionStatus: ConnectionStatus;
  badges?: {
    home?: number;
    news?: number;
    checkpoints?: number;
    map?: number;
    profile?: number;
  };
  onSosPress?: () => void;
  onPillPress: (type: any) => void;
}

export function SentinelLayout({
  children,
  activeTab,
  onTabChange,
  locationName,
  connectionStatus,
  badges,
  onSosPress,
  onPillPress,
}: SentinelLayoutProps) {
  const { lang } = useLang();
  const prevTabRef = useRef<TabId>(activeTab);
  const prevIdx = TAB_ORDER.indexOf(prevTabRef.current);
  const currIdx = TAB_ORDER.indexOf(activeTab);
  const direction = currIdx >= prevIdx ? 1 : -1;

  if (prevTabRef.current !== activeTab) {
    prevTabRef.current = activeTab;
  }

  const isMapTab = activeTab === "map";

  return (
    <div className="flex flex-col h-full bg-background text-on-background overflow-hidden font-body relative">
      {!isMapTab && (
        <TopBar
          locationName={locationName}
          connectionStatus={connectionStatus}
          onSosPress={onSosPress}
          onPillPress={onPillPress}
        />
      )}

      {/* Connection lost banner — persistent, sits above content */}
      <AnimatePresence>
        {connectionStatus === "disconnected" && !isMapTab && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden z-20 relative"
          >
            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-error/10 border-b border-error/20">
              <span className="material-symbols-outlined text-[14px] text-error">wifi_off</span>
              <span className="text-[10px] font-label font-bold text-error uppercase tracking-widest">
                {lang === 'ar' ? 'غير متصل — البيانات قد تكون قديمة' : 'DISCONNECTED — DATA MAY BE STALE'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background ambient glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <main className="flex-1 relative overflow-hidden z-10" id="sentinel-scroll-container">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -15 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full h-full overflow-y-auto scrollbar-hide pb-[calc(100px+var(--safe-area-inset-bottom,0px))]"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        badges={badges}
      />
    </div>
  );
}
