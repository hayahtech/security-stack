import { useState } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ReportHeader } from './ReportHeader';
import { PeriodSelector } from './PeriodSelector';
import { exportPDF, exportExcel, formatCurrency } from '@/lib/export-utils';

export function DREReport() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [exporting, setExporting] = useState(false);

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['dre-report', user?.id, startStr, endStr],
    queryFn: async () => {
      const [salesRes, transactionsRes, billsRes] = await Promise.all([
        supabase.from('sales').select('total_amount, discount_amount').eq('user_id', user!.id).eq('status', 'fechado').gte('date', startStr).lte('date', endStr),
        supabase.from('transactions').select('amount, type, scope').eq('user_id', user!.id).eq('status', 'paid').eq('scope', 'business').gte('date', startStr).lte('date', endStr),
        supabase.from('bills').select('amount, type, status').eq('user_id', user!.id).eq('status', 'paid').gte('due_date', startStr).lte('due_date', endStr),
      ]);

      const sales = salesRes.data || [];
      const transactions = transactionsRes.data || [];
      const bills = billsRes.data || [];

      const receitaBruta = sales.reduce((s, v) => s + Number(v.total_amount), 0)
        + transactions.filter(t => t.type === 'revenue').reduce((s, t) => s + Number(t.amount), 0);
      
      const descontos = sales.reduce((s, v) => s + Number(v.discount_amount), 0);
      const receitaLiquida = receitaBruta - descontos;

      // Expenses from transactions
      const expenses = transactions.filter(t => t.type === 'expense');
      const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount), 0);

      // Bills paid
      const billsPagar = bills.filter(b => b.type === 'pagar');
      const totalBills = billsPagar.reduce((s, b) => s + Number(b.amount), 0);

      const totalDespesas = totalExpenses + totalBills;
      const lucroLiquido = receitaLiquida - totalDespesas;
      const margem = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

      return {
        receitaBruta,
        descontos,
        receitaLiquida,
        totalDespesas,
        lucroLiquido,
        margem,
        totalExpenses,
        totalBills,
      };
    },
    enabled: !!user,
  });

  const handleExportPDF = async () => {
    setExporting(true);
    await exportPDF('dre-report', `DRE_${startStr}_${endStr}`);
    setExporting(false);
  };

  const handleExportExcel = () => {
    if (!data) return;
    exportExcel([
      { Descrição: 'Receita Bruta', Valor: data.receitaBruta },
      { Descrição: '(-) Descontos', Valor: -data.descontos },
      { Descrição: '= Receita Líquida', Valor: data.receitaLiquida },
      { Descrição: '(-) Despesas Operacionais', Valor: -data.totalExpenses },
      { Descrição: '(-) Contas Pagas', Valor: -data.totalBills },
      { Descrição: '= Total Despesas', Valor: -data.totalDespesas },
      { Descrição: '= LUCRO LÍQUIDO', Valor: data.lucroLiquido },
      { Descrição: 'Margem Líquida (%)', Valor: Number(data.margem.toFixed(1)) },
    ], 'DRE', `DRE_${startStr}_${endStr}`);
  };

  const Row = ({ label, value, bold, negative, highlight }: { label: string; value: number; bold?: boolean; negative?: boolean; highlight?: boolean }) => (
    <div className={`flex justify-between py-2 px-4 ${bold ? 'font-bold' : ''} ${highlight ? 'bg-primary/10 rounded-lg' : 'border-b border-border/50'}`}>
      <span>{label}</span>
      <span className={negative && value < 0 ? 'text-destructive' : value > 0 && highlight ? 'text-green-600 dark:text-green-400' : ''}>
        {negative ? `- ${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
      </span>
    </div>
  );

  return (
    <div>
      <PeriodSelector
        startDate={startDate} endDate={endDate}
        onStartChange={setStartDate} onEndChange={setEndDate}
        onExportPDF={handleExportPDF} onExportExcel={handleExportExcel}
        exportingPDF={exporting}
      />

      <div id="dre-report" className="bg-card rounded-xl border p-6">
        <ReportHeader title="DRE — Demonstração do Resultado" startDate={startDate} endDate={endDate} subtitle="Demonstração simplificada de resultado do exercício" />

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Carregando...</div>
        ) : data ? (
          <div className="space-y-1">
            <Row label="Receita Bruta" value={data.receitaBruta} bold />
            <Row label="(-) Descontos" value={data.descontos} negative />
            <Row label="= Receita Líquida" value={data.receitaLiquida} bold />
            <div className="my-2" />
            <Row label="(-) Despesas Operacionais" value={data.totalExpenses} negative />
            <Row label="(-) Contas a Pagar (pagas)" value={data.totalBills} negative />
            <Row label="= Total de Despesas" value={data.totalDespesas} negative bold />
            <div className="my-2" />
            <Row label="= LUCRO LÍQUIDO" value={data.lucroLiquido} bold highlight />
            <div className="mt-4 text-sm text-muted-foreground text-right px-4">
              Margem Líquida: <span className="font-semibold">{data.margem.toFixed(1)}%</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
