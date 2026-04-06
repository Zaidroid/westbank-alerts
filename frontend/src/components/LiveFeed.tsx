import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Filter } from "lucide-react";
import type { Alert } from "@/lib/api";
import type { CheckpointUpdate } from "@/lib/api/types";
import { LiveFeedItem, type FeedItem } from "./LiveFeedItem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LiveFeedProps {
  alerts: Alert[];
  checkpointUpdates: CheckpointUpdate[];
  isPaused: boolean;
  onTogglePause: () => void;
  onAlertClick: (a: Alert) => void;
  onCheckpointClick?: (update: CheckpointUpdate) => void;
}

export function LiveFeed({ alerts, checkpointUpdates, isPaused, onTogglePause, onAlertClick, onCheckpointClick }: LiveFeedProps) {
  const { t } = useLang();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Convert alerts to feed items
  const alertItems: FeedItem[] = useMemo(() => alerts.map(a => ({
    type: "alert" as const,
    id: `alert-${a.id}`,
    timestamp: a.timestamp,
    data: a,
  })), [alerts]);

  // Convert checkpoint updates to feed items
  const updateItems: FeedItem[] = useMemo(() => checkpointUpdates.map(u => ({
    type: "checkpoint_update" as const,
    id: `cp-${u.id || u.canonical_key}-${u.timestamp}`,
    timestamp: u.timestamp,
    data: u,
  })), [checkpointUpdates]);

  // Merge and sort by timestamp (newest first)
  const allItems = useMemo(() => {
    const merged = [...alertItems, ...updateItems];
    return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [alertItems, updateItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Type filter
      if (typeFilter === "alerts" && item.type !== "alert") return false;
      if (typeFilter === "checkpoints" && item.type !== "checkpoint_update") return false;
      
      // Severity filter (only for alerts)
      if (severityFilter !== "all" && item.type === "alert") {
        const alert = item.data as Alert;
        if (alert.severity !== severityFilter) return false;
      }
      
      return true;
    });
  }, [allItems, severityFilter, typeFilter]);

  const handleItemClick = (item: FeedItem) => {
    if (item.type === "alert") {
      onAlertClick(item.data as Alert);
    } else {
      onCheckpointClick?.(item.data as CheckpointUpdate);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold tracking-tight">{t.liveFeed}</h2>
          <Badge variant="secondary" className="font-mono text-xs">{filteredItems.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue placeholder={t.all} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.all}</SelectItem>
              <SelectItem value="alerts">{t.alerts}</SelectItem>
              <SelectItem value="checkpoints">{t.checkpoints}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <Filter className="h-3 w-3 mr-2" />
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allSeverities}</SelectItem>
              <SelectItem value="critical">{t.critical}</SelectItem>
              <SelectItem value="high">{t.high}</SelectItem>
              <SelectItem value="medium">{t.medium}</SelectItem>
              <SelectItem value="low">{t.low}</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant={isPaused ? "default" : "outline"} 
            size="icon" 
            className="h-8 w-8" 
            onClick={onTogglePause}
            title={isPaused ? t.resume : t.pause}
            data-testid="btn-toggle-pause"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2 gap-2">
          <AnimatePresence initial={false}>
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <LiveFeedItem item={item} onClick={handleItemClick} />
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredItems.length === 0 && (
            <div className="text-center p-8 text-muted-foreground text-sm font-mono">
              {t.noAlertsFound}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
