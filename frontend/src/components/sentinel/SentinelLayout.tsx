import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import type { ConnectionStatus } from "@/lib/api/types";
import { AnimatePresence, motion } from "framer-motion";

export type TabId = "home" | "news" | "checkpoints" | "map" | "profile";

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
  
  return (
    <div className="flex flex-col h-full bg-background text-on-background overflow-hidden font-body relative">
      <TopBar 
        locationName={locationName} 
        connectionStatus={connectionStatus}
        onSosPress={onSosPress}
        onPillPress={onPillPress}
      />
      
      {/* Background generic elements / ambient glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[100px] pointer-events-none z-0" />
      
      <main className="flex-1 relative overflow-hidden z-10" id="sentinel-scroll-container">
        {/* AnimatePresence allows components to animate out when they're removed from the tree */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
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
