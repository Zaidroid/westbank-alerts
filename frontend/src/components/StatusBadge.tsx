import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type BadgeVariant = "critical" | "high" | "medium" | "low" | "open" | "closed" | "congested" | "military" | "slow" | "unknown" | "default";

interface StatusBadgeProps {
  variant: BadgeVariant | string;
  label: string;
  className?: string;
}

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  const getColors = (v: string) => {
    switch (v) {
      case "critical":
      case "closed":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "high":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "congested":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "slow":
        return "bg-amber-500/20 text-amber-500 border-amber-500/30";
      case "low":
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
      case "open":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "military":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Badge variant="outline" className={cn("font-mono text-[10px] uppercase tracking-wider", getColors(variant), className)}>
      {label}
    </Badge>
  );
}
