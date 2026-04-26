import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';

interface Props {
  revenue: number;
  expenses: number;
  pendingCount: number;
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function SummaryCards({ revenue, expenses, pendingCount }: Props) {
  const profit = revenue - expenses;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-l-4 border-l-[hsl(var(--success))]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{formatCurrency(revenue)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-[hsl(var(--success))]" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Despesas Totais</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{formatCurrency(expenses)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card className={`border-l-4 ${profit >= 0 ? 'border-l-[hsl(var(--success))]' : 'border-l-destructive'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lucro Líquido</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{formatCurrency(profit)}</p>
            </div>
            <DollarSign className={`h-8 w-8 ${profit >= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}`} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-[hsl(var(--warning))]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Contas Pendentes</p>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{pendingCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-[hsl(var(--warning))]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
