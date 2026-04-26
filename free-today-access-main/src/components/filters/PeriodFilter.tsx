import { Button } from '@/components/ui/button';
import { PeriodFilter as PeriodFilterType } from '@/types';

interface Props {
  value: PeriodFilterType;
  onChange: (v: PeriodFilterType) => void;
}

const periods: { label: string; type: PeriodFilterType['type'] }[] = [
  { label: 'Dia', type: 'day' },
  { label: 'Semana', type: 'week' },
  { label: 'Mês', type: 'month' },
  { label: 'Ano', type: 'year' },
];

export function PeriodFilterBar({ value, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {periods.map(p => (
        <Button
          key={p.type}
          size="sm"
          variant={value.type === p.type ? 'default' : 'outline'}
          onClick={() => onChange({ ...value, type: p.type })}
          className="text-xs"
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
