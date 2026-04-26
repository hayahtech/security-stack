import { MovementType } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Settings2,
  RotateCcw,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

const config: Record<MovementType, { label: string; icon: React.ElementType; className: string }> = {
  ENTRADA: { label: 'Entrada', icon: ArrowDownRight, className: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
  SAÍDA: { label: 'Saída', icon: ArrowUpRight, className: 'border-red-500/40 text-red-400 bg-red-500/10' },
  TRANSFERÊNCIA: { label: 'Transferência', icon: ArrowRightLeft, className: 'border-sky-500/40 text-sky-400 bg-sky-500/10' },
  AJUSTE: { label: 'Ajuste', icon: Settings2, className: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  DEVOLUÇÃO: { label: 'Devolução', icon: RotateCcw, className: 'border-violet-500/40 text-violet-400 bg-violet-500/10' },
  AVARIA: { label: 'Avaria', icon: AlertTriangle, className: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
  BAIXA: { label: 'Baixa', icon: Trash2, className: 'border-zinc-500/40 text-zinc-400 bg-zinc-500/10' },
};

export function MovementTypeBadge({ type }: { type: MovementType }) {
  const c = config[type];
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={`gap-1 font-mono text-[11px] px-1.5 py-0 ${c.className}`}>
      <Icon className="h-3 w-3" />
      {c.label}
    </Badge>
  );
}

export { config as movementTypeConfig };
