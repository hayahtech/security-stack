import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = "default",
}: KpiCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const variantStyles = {
    default: "from-primary/10 to-transparent border-primary/20",
    success: "from-success/10 to-transparent border-success/20",
    warning: "from-yellow-500/10 to-transparent border-yellow-500/20",
    danger: "from-destructive/10 to-transparent border-destructive/20",
  };

  const iconStyles = {
    default: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-yellow-500 bg-yellow-500/10",
    danger: "text-destructive bg-destructive/10",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02]",
        "bg-card hover:shadow-lg",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-data">{title}</p>
          <p className="text-2xl font-display font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : isNegative ? (
                <TrendingDown className="h-4 w-4 text-destructive" />
              ) : null}
              <span
                className={cn(
                  "text-sm font-data font-medium",
                  isPositive && "text-success",
                  isNegative && "text-destructive",
                  !isPositive && !isNegative && "text-muted-foreground"
                )}
              >
                {isPositive && "+"}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
