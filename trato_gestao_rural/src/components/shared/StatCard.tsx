import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  onClick?: () => void;
}

const variantStyles = {
  default: 'border-border',
  success: 'border-success/30 bg-success/5',
  danger: 'border-danger/30 bg-danger/5',
  warning: 'border-warning/30 bg-warning/5',
};

const iconVariant = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, variant = 'default', onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'stat-card animate-fade-in',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        {Icon && (
          <div className={cn('p-2 rounded-lg', iconVariant[variant])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {(subtitle || trend) && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend && (
            <>
              {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-success" />}
              {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-danger" />}
              {trend === 'neutral' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
            </>
          )}
          {trendValue && <span className={cn('text-xs font-medium', trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-muted-foreground')}>{trendValue}</span>}
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
