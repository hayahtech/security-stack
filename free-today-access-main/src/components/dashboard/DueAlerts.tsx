import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TransactionLike {
  id: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending';
  due_date?: string;
  type: 'revenue' | 'expense';
}

interface Props {
  transactions: TransactionLike[];
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function DueAlerts({ transactions }: Props) {
  const pending = transactions
    .filter(t => t.status === 'pending' && t.due_date)
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  if (pending.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Contas a Vencer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma conta pendente 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" /> Contas a Vencer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.map(t => {
          const dueDate = new Date(t.due_date!);
          const isOverdue = dueDate < new Date();
          return (
            <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">{t.description}</p>
                <p className="text-xs text-muted-foreground">
                  Vence: {dueDate.toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{formatCurrency(t.amount)}</span>
                {isOverdue && <Badge variant="destructive" className="text-xs">Atrasada</Badge>}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
