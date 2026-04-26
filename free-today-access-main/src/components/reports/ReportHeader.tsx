import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pizza } from 'lucide-react';

interface ReportHeaderProps {
  title: string;
  startDate: Date;
  endDate: Date;
  subtitle?: string;
}

export function ReportHeader({ title, startDate, endDate, subtitle }: ReportHeaderProps) {
  return (
    <div className="mb-6 pb-4 border-b-2 border-primary/20">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-primary text-primary-foreground rounded-lg p-2">
          <Pizza className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">PizzaFlow</h2>
          <p className="text-xs text-muted-foreground">Sistema de Gestão para Pizzarias</p>
        </div>
      </div>
      <h3 className="text-lg font-semibold mt-3">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      <p className="text-sm text-muted-foreground mt-1">
        Período: {format(startDate, "dd/MM/yyyy", { locale: ptBR })} a {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
      </p>
      <p className="text-xs text-muted-foreground">
        Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </p>
    </div>
  );
}
