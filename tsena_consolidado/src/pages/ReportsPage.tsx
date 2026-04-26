import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Download, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const modules = [
  { value: 'visitantes', label: 'Visitantes' },
  { value: 'veiculos', label: 'Veículos' },
  { value: 'entregas', label: 'Entregas' },
  { value: 'blacklist', label: 'Blacklist' },
  { value: 'panico', label: 'Acionamentos de Pânico' },
  { value: 'nfe', label: 'Barreira Fiscal (NF-e)' },
  { value: 'balanca', label: 'Balança' },
  { value: 'patio', label: 'Gestão de Pátio' },
  { value: 'sst', label: 'SST' },
  { value: 'sorteio', label: 'Sorteio de Revista' },
  { value: 'refeitorio', label: 'Refeitório' },
];

const mockReportData: Record<string, { columns: string[]; rows: string[][] }> = {
  visitantes: {
    columns: ['Nome', 'CPF', 'Empresa', 'Entrada', 'Saída', 'Status'],
    rows: [
      ['João Silva', '123.456.789-00', 'Tech Corp', '17/03 09:00', '17/03 11:30', 'Saiu'],
      ['Ana Costa', '987.654.321-00', 'Consult SA', '17/03 10:15', '—', 'Dentro'],
      ['Pedro Souza', '111.222.333-44', 'Manut Ltda', '16/03 14:00', '16/03 17:00', 'Saiu'],
    ],
  },
  veiculos: {
    columns: ['Placa', 'Modelo', 'Motorista', 'Entrada', 'Saída', 'Vaga'],
    rows: [
      ['ABC-1234', 'Fiat Toro', 'Carlos M.', '17/03 08:00', '—', 'V-01'],
      ['DEF-5678', 'VW Gol', 'Ana P.', '17/03 09:30', '17/03 12:00', 'V-03'],
    ],
  },
  entregas: {
    columns: ['Remetente', 'Destinatário', 'Recebido por', 'Data', 'Status', 'Entregue para'],
    rows: [
      ['Amazon', 'João Silva - TI', 'Porteiro Carlos', '17/03 09:00', 'Aguardando', '—'],
      ['Fornecedor ABC', 'Carlos Compras', 'Porteiro Ana', '16/03 14:30', 'Entregue', 'Carlos Compras'],
    ],
  },
  blacklist: {
    columns: ['Nome', 'CPF', 'Motivo', 'Incluído em', 'Por'],
    rows: [
      ['Fulano Bloqueado', '000.111.222-33', 'Furto', '10/01/2026', 'Segurança'],
    ],
  },
};

const ReportsPage = () => {
  const [selectedModule, setSelectedModule] = useState('visitantes');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const data = mockReportData[selectedModule];

  const handleExport = () => {
    const m = modules.find(m => m.value === selectedModule);
    const toast = (window as any).__sonnerToast;
    // Simple CSV simulation
    alert(`Exportando relatório de ${m?.label || selectedModule} em CSV...`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-primary" />
            Relatórios
          </h2>
          <p className="text-xs text-muted-foreground">Consulte dados de todos os módulos do sistema</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card card-shadow p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <Label className="text-xs text-muted-foreground">Módulo</Label>
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="mt-1 bg-secondary border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {modules.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mt-1 bg-secondary border-border text-foreground w-[150px]" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Até</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mt-1 bg-secondary border-border text-foreground w-[150px]" />
          </div>
          <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-ros hover:brightness-110">
            <Filter className="h-3.5 w-3.5" />
            Filtrar
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-2 text-xs font-medium text-foreground transition-ros hover:bg-muted">
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {data ? (
        <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                {data.columns.map(col => (
                  <th key={col} className="px-4 py-2.5 font-medium text-muted-foreground">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 transition-ros hover:bg-secondary/50"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-foreground">{cell}</td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card card-shadow p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum dado disponível para este módulo.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
