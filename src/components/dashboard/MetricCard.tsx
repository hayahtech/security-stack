import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number;
  format?: "currency" | "percent" | "number" | "compact";
  variation?: number; // percentage
  sparkline?: number[];
  status?: "success" | "warning" | "danger" | "neutral";
  className?: string;
}

function formatValue(value: number, format: MetricCardProps["format"]) {
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "compact":
      if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
      return `R$ ${value}`;
    default:
      return value.toLocaleString("pt-BR");
  }
}

const statusColors = {
  success: "bg-success",
  warning: "bg-yellow-500",
  danger: "bg-destructive",
  neutral: "bg-muted-foreground",
};

export function MetricCard({ label, value, format = "currency", variation, sparkline, status = "neutral", className }: MetricCardProps) {
  const animatedValue = useCountUp(value);

  const TrendIcon = variation == null || variation === 0 ? Minus : variation > 0 ? TrendingUp : TrendingDown;
  const trendColor = variation == null || variation === 0 ? "text-muted-foreground" : variation > 0 ? "text-success" : "text-destructive";

  // Mini sparkline SVG
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    const max = Math.max(...sparkline);
    const min = Math.min(...sparkline);
    const range = max - min || 1;
    const h = 24;
    const w = 64;
    const points = sparkline.map((v, i) => `${(i / (sparkline.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
    return (
      <svg width={w} height={h} className="opacity-60">
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className={cn(
      "relative rounded-xl border border-border/50 bg-card p-5 overflow-hidden group hover:border-border transition-all duration-200",
      className
    )}>
      {/* Status dot */}
      <div className={cn("absolute top-3 right-3 w-2 h-2 rounded-full", statusColors[status])} />

      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-foreground leading-tight">
        {formatValue(animatedValue, format)}
      </p>

      <div className="flex items-center justify-between mt-3">
        {variation != null && (
          <div className={cn("flex items-center gap-1 text-xs font-data font-medium", trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{variation > 0 ? "+" : ""}{variation.toFixed(1)}%</span>
          </div>
        )}
        {renderSparkline()}
      </div>
    </div>
  );
}
