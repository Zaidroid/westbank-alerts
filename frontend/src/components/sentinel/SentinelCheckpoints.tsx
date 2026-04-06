import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Checkpoint, CheckpointUpdate } from "@/lib/api/types";
import { SentinelCheckpointCard } from "./SentinelCheckpointCard";
import { useLang } from "@/lib/i18n";

interface SentinelCheckpointsProps {
  checkpoints: Checkpoint[];
  checkpointUpdates: CheckpointUpdate[];
  onNavigateMap: () => void;
}

export function SentinelCheckpoints({ 
  checkpoints, 
  checkpointUpdates,
  onNavigateMap
}: SentinelCheckpointsProps) {
  const { t, lang } = useLang();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "open" | "closed" | "military" | "congested">("all");

  const updatesMap = useMemo(() => {
    const map = new Map<string, CheckpointUpdate[]>();
    for (const u of checkpointUpdates) {
      if (!map.has(u.canonical_key)) map.set(u.canonical_key, []);
      map.get(u.canonical_key)!.push(u);
    }
    return map;
  }, [checkpointUpdates]);

  const filteredCheckpoints = useMemo(() => {
    return checkpoints.filter(cp => {
      // Filter by status
      if (activeFilter !== "all") {
        if (activeFilter === "congested" && cp.status !== "congested" && cp.status !== "slow") return false;
        if (activeFilter !== "congested" && cp.status !== activeFilter) return false;
      }
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNameAr = cp.name_ar.toLowerCase().includes(query);
        const matchNameEn = cp.name_en?.toLowerCase().includes(query) || false;
        const matchRegion = cp.region?.toLowerCase().includes(query) || false;
        if (!matchNameAr && !matchNameEn && !matchRegion) return false;
      }
      
      return true;
    });
  }, [checkpoints, activeFilter, searchQuery]);

  const FILTERS = [
    { id: "all", label: t.all },
    { id: "open", label: t.open },
    { id: "closed", label: t.closed },
    { id: "military", label: t.military },
    { id: "congested", label: t.congested },
  ] as const;

  return (
    <div className="flex flex-col min-h-full pb-[100px]">
      {/* --- Floating map CTA for checkpoints specifically --- */}
      <div className="fixed bottom-[85px] end-4 z-30 mb-[var(--safe-area-inset-bottom,0px)]">
        <button 
          onClick={onNavigateMap}
          className="w-[52px] h-[52px] rounded-2xl bg-secondary text-secondary-container flex items-center justify-center shadow-[0_4px_20px_rgba(254,179,0,0.3)] active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[24px]">map</span>
        </button>
      </div>

      <div className="px-4 pt-6 pb-2">
        <h1 className="text-5xl font-headline font-bold text-on-surface tracking-tighter leading-none px-1" dir="auto">
          {t.checkpoints}
        </h1>
        <p className="text-sm border-s-2 border-secondary ps-3 text-on-surface-variant mt-3 ms-2 font-body max-w-[250px] leading-snug" dir="auto">
          {lang === 'ar' ? "حالة الحواجز ونقاط التفتيش في الضفة في الوقت الفعلي." : "Real-time transit node status across all territories."}
        </p>
      </div>

      {/* --- Search and Filter Area --- */}
      <div className="bg-background/95 backdrop-blur-md pt-4 pb-2 px-4">
        {/* Search */}
        <div className="relative mb-3">
          <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-high text-on-surface border border-outline-variant/50 rounded-xl py-3.5 ps-11 pe-4 font-body text-sm placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all"
            dir="auto"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x">
          {FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "snap-start shrink-0 px-4 py-2 rounded-full text-xs font-bold font-label tracking-wider transition-all",
                activeFilter === filter.id 
                  ? "bg-secondary text-secondary-container" 
                  : "bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- Checkpoints List --- */}
      <div className="px-4 py-4 space-y-3">
        {filteredCheckpoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <span className="material-symbols-outlined text-[48px] text-surface-container-highest mb-3">
              search_off
            </span>
            <h3 className="text-lg font-headline font-bold text-on-surface mb-1">{t.noCheckpointsFound}</h3>
          </div>
        ) : (
          filteredCheckpoints.map(cp => (
            <SentinelCheckpointCard 
              key={cp.canonical_key} 
              checkpoint={cp} 
              updates={updatesMap.get(cp.canonical_key) || []} 
            />
          ))
        )}
      </div>
      
      <div className="h-12" />
    </div>
  );
}
