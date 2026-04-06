import { formatDistanceToNow } from "date-fns";
import { Checkpoint } from "@/lib/api";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { Users, Clock, MapPin } from "lucide-react";
import { useLang, formatRelativeTime, getStatusLabel } from "@/lib/i18n";
import { motion } from "framer-motion";

interface CheckpointItemProps {
  checkpoint: Checkpoint;
  onClick?: (checkpoint: Checkpoint) => void;
  className?: string;
  index?: number;
}

export function CheckpointItem({ checkpoint, onClick, className, index = 0 }: CheckpointItemProps) {
  const { t } = useLang();

  const getStatusBorder = (status: string) => {
    switch (status) {
      case "open": return "border-s-green-500";
      case "closed": return "border-s-destructive";
      case "congested": return "border-s-orange-500";
      case "military": return "border-s-purple-500";
      case "slow": return "border-s-amber-500";
      default: return "border-s-slate-500";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-2 md:gap-3 border border-s-4 border-e-border border-y-border bg-card p-3 md:p-4 transition-all hover:bg-muted/30 hover:scale-[1.01] hover:shadow-md",
        getStatusBorder(checkpoint.status),
        className
      )}
      onClick={() => onClick?.(checkpoint)}
      data-testid={`checkpoint-item-${checkpoint.canonical_key}`}
    >
      <div className="absolute top-3 end-3">
        <StatusBadge variant={checkpoint.status} label={getStatusLabel(checkpoint.status, t)} />
      </div>

      <div className="flex flex-col pe-16 gap-1">
        <h4 className="font-bold text-base md:text-lg leading-tight font-arabic" dir="auto">{checkpoint.name_ar}</h4>
        <h5 className="text-xs md:text-sm text-muted-foreground font-sans truncate" dir="ltr">{checkpoint.name_en}</h5>
      </div>
      
      <div className="mt-auto pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{checkpoint.region ?? "Unknown"}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {checkpoint.crowd_reports_1h > 0 && (
             <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase tracking-wider bg-orange-500/10 px-1.5 py-0.5 rounded">
               {t.crowded}
             </span>
          )}
          {checkpoint.is_stale && (
             <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded">
               {t.stale}
             </span>
          )}
          {checkpoint.last_updated && (
            <span className="text-xs text-muted-foreground font-mono" dir="ltr">
              {formatRelativeTime(new Date(checkpoint.last_updated), t)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}