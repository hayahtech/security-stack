import { cn } from '@/lib/utils';

type BadgeVariant = 'pendente' | 'pago' | 'cancelado' | 'dentro' | 'proximo' | 'estourado' | 'planejada' | 'em_andamento' | 'finalizada' | 'info' | 'warning' | 'danger';

const variantMap: Record<BadgeVariant, string> = {
  pendente: 'bg-warning/15 text-warning border-warning/30',
  pago: 'bg-success/15 text-success border-success/30',
  cancelado: 'bg-muted text-muted-foreground border-border',
  dentro: 'bg-success/15 text-success border-success/30',
  proximo: 'bg-warning/15 text-warning border-warning/30',
  estourado: 'bg-danger/15 text-danger border-danger/30',
  planejada: 'bg-azul-light text-azul border-azul/30',
  em_andamento: 'bg-success/15 text-success border-success/30',
  finalizada: 'bg-muted text-muted-foreground border-border',
  info: 'bg-azul-light text-azul border-azul/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
};

const labelMap: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
  dentro: 'No limite',
  proximo: 'Quase no limite',
  estourado: 'Estourado',
  planejada: 'Planejada',
  em_andamento: 'Em andamento',
  finalizada: 'Finalizada',
  info: 'Info',
  warning: 'Atenção',
  danger: 'Crítico',
};

interface StatusBadgeProps {
  status: BadgeVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variantMap[status] || variantMap.info,
      className,
    )}>
      {label || labelMap[status] || status}
    </span>
  );
}
