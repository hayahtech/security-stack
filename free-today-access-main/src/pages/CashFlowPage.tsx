import { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useLoans, useLoanInstallments } from '@/hooks/useLoans';
import { useScope } from '@/contexts/ScopeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CashFlowPage() {
  const { scope } = useScope();
  const [days, setDays] = useState(30);
  const { data: transactions, isLoading } = useTransactions({ scope });
  const { data: loans } = useLoans();

  const chartData = useMemo(() => {
    if (!transactions) return [];

    const today = new Date();
    const data: { date: string; label: string; entradas: number; saidas: number; saldo: number }[] = [];
    let runningBalance = 0;

    // Calculate starting balance from past paid transactions
    transactions.filter(t => t.status === 'paid').forEach(t => {
      if (t.type === 'revenue') runningBalance += Number(t.amount);
      else runningBalance -= Number(t.amount);
    });

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      let entradas = 0;
      let saidas = 0;

      // Pending transactions due on this date
      transactions.filter(t => t.status === 'pending' && t.due_date === dateStr).forEach(t => {
        if (t.type === 'revenue') entradas += Number(t.amount);
        else saidas += Number(t.amount);
      });

      runningBalance += entradas - saidas;
      data.push({ date: dateStr, label, entradas, saidas, saldo: runningBalance });
    }
    return data;
  }, [transactions, days]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 w-full" /></div>;

  const minBalance = Math.min(...chartData.map(d => d.saldo));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">Projeção de entradas e saídas</p>
        </div>
        <div className="flex gap-2">
          {[30, 60, 90].map(d => (
            <Button key={d} variant={days === d ? 'default' : 'outline'} size="sm" onClick={() => setDays(d)}>
              {d} dias
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Saldo Projetado — {days} dias</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Saldo" />
              <Line type="monotone" dataKey="entradas" stroke="hsl(var(--success))" strokeWidth={1} dot={false} name="Entradas" />
              <Line type="monotone" dataKey="saidas" stroke="hsl(var(--warning))" strokeWidth={1} dot={false} name="Saídas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {minBalance < 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive font-medium">
            ⚠️ Atenção: saldo projetado fica negativo ({formatCurrency(minBalance)}) durante o período. Revise suas contas!
          </CardContent>
        </Card>
      )}
    </div>
  );
}
