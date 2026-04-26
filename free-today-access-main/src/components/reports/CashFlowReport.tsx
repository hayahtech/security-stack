import { useState } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ReportHeader } from './ReportHeader';
import { PeriodSelector } from './PeriodSelector';
import { exportPDF, exportExcel, formatCurrency, formatDate } from '@/lib/export-utils';

export function CashFlowReport() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [exporting, setExporting] = useState(false);

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['cashflow-report', user?.id, startStr, endStr],
    queryFn: async () => {
      const [transRes, salesRes, billsRes] = await Promise.all([
        supabase.from('transactions').select('date, amount, type, description, scope').eq('user_id', user!.id).eq('scope', 'business').gte('date', startStr).lte('date', endStr).order('date'),
        supabase.from('sales').select('date, total_amount, channel, payment_method').eq('user_id', user!.id).eq('status', 'fechado').gte('date', startStr).lte('date', endStr).order('date'),
        supabase.from('bills').select('due_date, amount, description, type, status').eq('user_id', user!.id).gte('due_date', startStr).lte('due_date', endStr).order('due_date'),
      ]);

      const entries: { data: string; tipo: string; descricao: string; entrada: number; saida: number }[] = [];

      (salesRes.data || []).forEach(s => {
        entries.push({ data: s.date, tipo: 'Venda', descricao: `${s.channel} - ${s.payment_method}`, entrada: Number(s.total_amount), saida: 0 });
      });

      (transRes.data || []).forEach(t => {
        if (t.type === 'revenue') {
          entries.push({ data: t.date, tipo: 'Receita', descricao: t.description, entrada: Number(t.amount), saida: 0 });
        } else {
          entries.push({ data: t.date, tipo: 'Despesa', descricao: t.description, entrada: 0, saida: Number(t.amount) });
        }
      });

      (billsRes.data || []).forEach(b => {
        if (b.type === 'receber' && b.status === 'paid') {
          entries.push({ data: b.due_date, tipo: 'Recebimento', descricao: b.description, entrada: Number(b.amount), saida: 0 });
        } else if (b.type === 'pagar' && b.status === 'paid') {
          entries.push({ data: b.due_date, tipo: 'Pagamento', descricao: b.description, entrada: 0, saida: Number(b.amount) });
        }
      });

      entries.sort((a, b) => a.data.localeCompare(b.data));

      const totalEntradas = entries.reduce((s, e) => s + e.entrada, 0);
      const totalSaidas = entries.reduce((s, e) => s + e.saida, 0);
      const saldo = totalEntradas - totalSaidas;

      return { entries, totalEntradas, totalSaidas, saldo };
    },
    enabled: !!user,
  });

  const handleExportPDF = async () => {
    setExporting(true);
    await exportPDF('cashflow-report', `FluxoCaixa_${startStr}_${endStr}`);
    setExporting(false);
  };

  const handleExportExcel = () => {
    if (!data) return;
    const rows = data.entries.map(e => ({
      Data: formatDate(e.data),
      Tipo: e.tipo,
      Descrição: e.descricao,
      Entrada: e.entrada || '',
      Saída: e.saida || '',
      Saldo: e.entrada - e.saida,
    }));
    rows.push({ Data: 'TOTAL', Tipo: '', Descrição: '', Entrada: data.totalEntradas as any, Saída: data.totalSaidas as any, Saldo: data.saldo });
    exportExcel(rows, 'Fluxo de Caixa', `FluxoCaixa_${startStr}_${endStr}`);
  };

  return (
    <div>
      <PeriodSelector startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} exportingPDF={exporting} />

      <div id="cashflow-report" className="bg-card rounded-xl border p-6">
        <ReportHeader title="Fluxo de Caixa Mensal" startDate={startDate} endDate={endDate} subtitle="Relatório detalhado para contabilidade" />

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Carregando...</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(data.totalEntradas)}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-lg font-bold text-destructive">{formatCurrency(data.totalSaidas)}</p>
              </div>
              <div className={`p-4 rounded-lg border ${data.saldo >= 0 ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-lg font-bold ${data.saldo >= 0 ? 'text-blue-600' : 'text-destructive'}`}>{formatCurrency(data.saldo)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3">Data</th>
                    <th className="py-2 px-3">Tipo</th>
                    <th className="py-2 px-3">Descrição</th>
                    <th className="py-2 px-3 text-right">Entrada</th>
                    <th className="py-2 px-3 text-right">Saída</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((e, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-2 px-3">{formatDate(e.data)}</td>
                      <td className="py-2 px-3">{e.tipo}</td>
                      <td className="py-2 px-3">{e.descricao}</td>
                      <td className="py-2 px-3 text-right text-green-600">{e.entrada > 0 ? formatCurrency(e.entrada) : ''}</td>
                      <td className="py-2 px-3 text-right text-destructive">{e.saida > 0 ? formatCurrency(e.saida) : ''}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold border-t-2">
                    <td className="py-2 px-3" colSpan={3}>TOTAL</td>
                    <td className="py-2 px-3 text-right text-green-600">{formatCurrency(data.totalEntradas)}</td>
                    <td className="py-2 px-3 text-right text-destructive">{formatCurrency(data.totalSaidas)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
