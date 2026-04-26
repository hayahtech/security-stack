import { useState } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ReportHeader } from './ReportHeader';
import { PeriodSelector } from './PeriodSelector';
import { exportPDF, exportExcel, formatCurrency, formatDate } from '@/lib/export-utils';

export function StockReport() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [exporting, setExporting] = useState(false);

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['stock-report', user?.id, startStr, endStr],
    queryFn: async () => {
      const [productsRes, movementsRes] = await Promise.all([
        supabase.from('products').select('id, name, unit, quantity_current, quantity_min, cost_price, category').eq('user_id', user!.id).order('name'),
        supabase.from('stock_movements').select('product_id, type, quantity, date, reason').eq('user_id', user!.id).gte('date', startStr).lte('date', endStr).order('date'),
      ]);

      const products = productsRes.data || [];
      const movements = movementsRes.data || [];

      const productMap = new Map<string, { name: string; unit: string; current: number; min: number; costPrice: number; category: string; entradas: number; saidas: number; ajustes: number }>();

      products.forEach(p => {
        productMap.set(p.id, {
          name: p.name, unit: p.unit, current: Number(p.quantity_current),
          min: Number(p.quantity_min), costPrice: Number(p.cost_price),
          category: p.category, entradas: 0, saidas: 0, ajustes: 0,
        });
      });

      movements.forEach(m => {
        const prod = productMap.get(m.product_id);
        if (!prod) return;
        if (m.type === 'entrada') prod.entradas += Number(m.quantity);
        else if (m.type === 'saida') prod.saidas += Number(m.quantity);
        else prod.ajustes += Number(m.quantity);
      });

      return {
        products: Array.from(productMap.entries()).map(([id, p]) => ({ id, ...p })),
        movements,
        totalProducts: products.length,
        lowStock: products.filter(p => Number(p.quantity_current) < Number(p.quantity_min)).length,
        totalValue: products.reduce((s, p) => s + Number(p.quantity_current) * Number(p.cost_price), 0),
      };
    },
    enabled: !!user,
  });

  const handleExportPDF = async () => {
    setExporting(true);
    await exportPDF('stock-report', `Estoque_${startStr}_${endStr}`);
    setExporting(false);
  };

  const handleExportExcel = () => {
    if (!data) return;
    exportExcel(data.products.map(p => ({
      Produto: p.name,
      Categoria: p.category,
      Unidade: p.unit,
      'Estoque Atual': p.current,
      'Estoque Mín.': p.min,
      Entradas: p.entradas,
      Saídas: p.saidas,
      Ajustes: p.ajustes,
      'Custo Unit.': p.costPrice,
      'Valor Total': p.current * p.costPrice,
    })), 'Estoque', `Estoque_${startStr}_${endStr}`);
  };

  return (
    <div>
      <PeriodSelector startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} exportingPDF={exporting} />

      <div id="stock-report" className="bg-card rounded-xl border p-6">
        <ReportHeader title="Relatório de Estoque" startDate={startDate} endDate={endDate} subtitle="Entradas, saídas e saldo por produto" />

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Carregando...</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-sm text-muted-foreground">Total de Produtos</p>
                <p className="text-lg font-bold">{data.totalProducts}</p>
              </div>
              <div className="p-4 rounded-lg border bg-destructive/10">
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-lg font-bold text-destructive">{data.lowStock}</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-sm text-muted-foreground">Valor em Estoque</p>
                <p className="text-lg font-bold">{formatCurrency(data.totalValue)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3">Produto</th>
                    <th className="py-2 px-3">Un.</th>
                    <th className="py-2 px-3 text-right">Atual</th>
                    <th className="py-2 px-3 text-right">Mín.</th>
                    <th className="py-2 px-3 text-right">Entradas</th>
                    <th className="py-2 px-3 text-right">Saídas</th>
                    <th className="py-2 px-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map(p => (
                    <tr key={p.id} className={`border-b border-border/30 ${p.current < p.min ? 'bg-destructive/5' : ''}`}>
                      <td className="py-2 px-3 font-medium">{p.name}</td>
                      <td className="py-2 px-3">{p.unit}</td>
                      <td className={`py-2 px-3 text-right ${p.current < p.min ? 'text-destructive font-bold' : ''}`}>{p.current}</td>
                      <td className="py-2 px-3 text-right">{p.min}</td>
                      <td className="py-2 px-3 text-right text-green-600">{p.entradas > 0 ? `+${p.entradas}` : '-'}</td>
                      <td className="py-2 px-3 text-right text-destructive">{p.saidas > 0 ? `-${p.saidas}` : '-'}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(p.current * p.costPrice)}</td>
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
