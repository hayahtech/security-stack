import { useState } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ReportHeader } from './ReportHeader';
import { PeriodSelector } from './PeriodSelector';
import { exportPDF, exportExcel } from '@/lib/export-utils';

export function LoyaltyReport() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [exporting, setExporting] = useState(false);

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['loyalty-report', user?.id, startStr, endStr],
    queryFn: async () => {
      const [pointsRes, customersRes, programsRes] = await Promise.all([
        supabase.from('loyalty_points').select('customer_id, points, type, description, created_at, program_id').gte('created_at', `${startStr}T00:00:00`).lte('created_at', `${endStr}T23:59:59`),
        supabase.from('customers').select('id, name').eq('user_id', user!.id),
        supabase.from('loyalty_programs').select('id, name').eq('user_id', user!.id),
      ]);

      const points = pointsRes.data || [];
      const customers = new Map((customersRes.data || []).map(c => [c.id, c.name]));
      const programs = new Map((programsRes.data || []).map(p => [p.id, p.name]));

      const earned = points.filter(p => p.type === 'earn');
      const redeemed = points.filter(p => p.type === 'redeem');

      const totalEarned = earned.reduce((s, p) => s + p.points, 0);
      const totalRedeemed = redeemed.reduce((s, p) => s + Math.abs(p.points), 0);

      // Top customers by earned points
      const customerPoints = new Map<string, { name: string; earned: number; redeemed: number }>();
      points.forEach(p => {
        const entry = customerPoints.get(p.customer_id) || { name: customers.get(p.customer_id) || 'Desconhecido', earned: 0, redeemed: 0 };
        if (p.type === 'earn') entry.earned += p.points;
        else entry.redeemed += Math.abs(p.points);
        customerPoints.set(p.customer_id, entry);
      });

      const topCustomers = Array.from(customerPoints.entries())
        .map(([id, c]) => ({ id, ...c }))
        .sort((a, b) => b.earned - a.earned)
        .slice(0, 20);

      return {
        totalEarned,
        totalRedeemed,
        totalTransactions: points.length,
        topCustomers,
        programNames: programs,
      };
    },
    enabled: !!user,
  });

  const handleExportPDF = async () => {
    setExporting(true);
    await exportPDF('loyalty-report', `Fidelidade_${startStr}_${endStr}`);
    setExporting(false);
  };

  const handleExportExcel = () => {
    if (!data) return;
    exportExcel(data.topCustomers.map(c => ({
      Cliente: c.name,
      'Pontos Ganhos': c.earned,
      'Pontos Resgatados': c.redeemed,
      'Saldo': c.earned - c.redeemed,
    })), 'Fidelidade', `Fidelidade_${startStr}_${endStr}`);
  };

  return (
    <div>
      <PeriodSelector startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} exportingPDF={exporting} />

      <div id="loyalty-report" className="bg-card rounded-xl border p-6">
        <ReportHeader title="Relatório de Fidelidade" startDate={startDate} endDate={endDate} subtitle="Pontos emitidos vs resgatados por cliente" />

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Carregando...</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <p className="text-sm text-muted-foreground">Pontos Emitidos</p>
                <p className="text-lg font-bold text-green-600">{data.totalEarned.toLocaleString('pt-BR')}</p>
              </div>
              <div className="p-4 rounded-lg border bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                <p className="text-sm text-muted-foreground">Pontos Resgatados</p>
                <p className="text-lg font-bold text-orange-600">{data.totalRedeemed.toLocaleString('pt-BR')}</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-sm text-muted-foreground">Transações</p>
                <p className="text-lg font-bold">{data.totalTransactions}</p>
              </div>
            </div>

            <h4 className="font-semibold mb-3">Top Clientes por Pontos</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Cliente</th>
                    <th className="py-2 px-3 text-right">Ganhos</th>
                    <th className="py-2 px-3 text-right">Resgatados</th>
                    <th className="py-2 px-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCustomers.map((c, i) => (
                    <tr key={c.id} className="border-b border-border/30">
                      <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 px-3 font-medium">{c.name}</td>
                      <td className="py-2 px-3 text-right text-green-600">+{c.earned}</td>
                      <td className="py-2 px-3 text-right text-orange-600">-{c.redeemed}</td>
                      <td className="py-2 px-3 text-right font-semibold">{c.earned - c.redeemed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
