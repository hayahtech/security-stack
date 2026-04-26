import { useState } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ReportHeader } from './ReportHeader';
import { PeriodSelector } from './PeriodSelector';
import { exportPDF, exportExcel, formatCurrency } from '@/lib/export-utils';

export function PayrollReport() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [exporting, setExporting] = useState(false);

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-report', user?.id, startStr, endStr],
    queryFn: async () => {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name, role, phone, salary, hire_date, status')
        .eq('user_id', user!.id)
        .order('name');

      const list = (employees || []).map(e => ({
        ...e,
        salary: Number(e.salary),
      }));

      const active = list.filter(e => e.status === 'ativo');
      const totalFolha = active.reduce((s, e) => s + e.salary, 0);

      return { employees: list, totalFolha, activeCount: active.length, inactiveCount: list.length - active.length };
    },
    enabled: !!user,
  });

  const handleExportPDF = async () => {
    setExporting(true);
    await exportPDF('payroll-report', `Folha_${startStr}_${endStr}`);
    setExporting(false);
  };

  const handleExportExcel = () => {
    if (!data) return;
    exportExcel(data.employees.map(e => ({
      Nome: e.name,
      Cargo: e.role || '-',
      Telefone: e.phone || '-',
      'Data Admissão': e.hire_date,
      Status: e.status,
      Salário: e.salary,
    })), 'Folha', `Folha_${startStr}_${endStr}`);
  };

  return (
    <div>
      <PeriodSelector startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} exportingPDF={exporting} />

      <div id="payroll-report" className="bg-card rounded-xl border p-6">
        <ReportHeader title="Relatório de Funcionários e Folha" startDate={startDate} endDate={endDate} subtitle="Quadro de pessoal e custos com folha de pagamento" />

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">Carregando...</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-lg font-bold">{data.activeCount}</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-lg font-bold">{data.inactiveCount}</p>
              </div>
              <div className="p-4 rounded-lg border bg-primary/10">
                <p className="text-sm text-muted-foreground">Total Folha Mensal</p>
                <p className="text-lg font-bold">{formatCurrency(data.totalFolha)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3">Nome</th>
                    <th className="py-2 px-3">Cargo</th>
                    <th className="py-2 px-3">Admissão</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Salário</th>
                  </tr>
                </thead>
                <tbody>
                  {data.employees.map(e => (
                    <tr key={e.id} className="border-b border-border/30">
                      <td className="py-2 px-3 font-medium">{e.name}</td>
                      <td className="py-2 px-3">{e.role || '-'}</td>
                      <td className="py-2 px-3">{new Date(e.hire_date).toLocaleDateString('pt-BR')}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${e.status === 'ativo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{formatCurrency(e.salary)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold border-t-2">
                    <td className="py-2 px-3" colSpan={4}>TOTAL FOLHA</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(data.totalFolha)}</td>
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
