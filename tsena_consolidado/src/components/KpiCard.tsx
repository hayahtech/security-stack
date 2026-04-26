import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  subtitle?: string;
}

const variantStyles = {
  default: 'text-primary bg-primary/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  destructive: 'text-destructive bg-destructive/10',
};

const KpiCard = ({ title, value, icon: Icon, variant = 'default', subtitle }: KpiCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-lg border border-border bg-card p-4 card-shadow"
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${variantStyles[variant]}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="mt-2">
      <span className="text-2xl font-bold text-foreground font-mono">{value}</span>
      {subtitle && <p className="mt-0.5 text-[10px] text-muted-foreground">{subtitle}</p>}
    </div>
  </motion.div>
);

export default KpiCard;
