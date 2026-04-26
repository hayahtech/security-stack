import { motion } from 'framer-motion';
import { Users, Car, Package, AlertTriangle, ArrowDownUp, CarFront } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import ParkingMap from '@/components/ParkingMap';
import { useAppMode } from '@/contexts/AppModeContext';

const mockMovements = [
  { id: 1, name: 'Carlos Silva', type: 'check-in', time: '09:15', cpf: '123.456.789-00', company: 'TechCorp' },
  { id: 2, name: 'Ana Santos', type: 'check-out', time: '09:32', cpf: '987.654.321-00', company: 'LogisBR' },
  { id: 3, name: 'Pedro Oliveira', type: 'check-in', time: '09:45', cpf: '456.789.123-00', company: 'Manutenção Rápida' },
  { id: 4, name: 'Maria Costa', type: 'check-in', time: '10:02', cpf: '321.654.987-00', company: 'AgroSul' },
  { id: 5, name: 'João Mendes', type: 'check-out', time: '10:18', cpf: '654.321.987-00', company: 'Transportes MG' },
  { id: 6, name: 'Fernanda Lima', type: 'check-in', time: '10:30', cpf: '789.123.456-00', company: 'ConsultPRO' },
];

const heatmapData = [
  { hour: '06', value: 2 }, { hour: '07', value: 8 }, { hour: '08', value: 15 },
  { hour: '09', value: 22 }, { hour: '10', value: 18 }, { hour: '11', value: 12 },
  { hour: '12', value: 5 }, { hour: '13', value: 14 }, { hour: '14', value: 20 },
  { hour: '15', value: 16 }, { hour: '16', value: 10 }, { hour: '17', value: 6 },
  { hour: '18', value: 3 }, { hour: '19', value: 1 },
];

const getHeatColor = (value: number) => {
  const max = 22;
  const intensity = value / max;
  if (intensity > 0.7) return 'bg-primary';
  if (intensity > 0.4) return 'bg-primary/60';
  if (intensity > 0.15) return 'bg-primary/30';
  return 'bg-primary/10';
};

const DashboardPage = () => {
  const { mode } = useAppMode();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        <p className="text-xs text-muted-foreground">Controle de Acesso: Operação Normal</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Visitantes no local" value={42} icon={Users} variant="success" subtitle="+5 na última hora" />
        <KpiCard title="Veículos no pátio" value={18} icon={Car} variant="default" subtitle="3 vagas livres" />
        <KpiCard title="Veículos de funcionários" value={3} icon={CarFront} variant="default" subtitle="2 vagas livres" />
        <KpiCard title="Entregas pendentes" value={7} icon={Package} variant="warning" subtitle="2 há mais de 24h" />
        <KpiCard title="Alertas ativos" value={0} icon={AlertTriangle} variant="destructive" subtitle="Nenhum alerta" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Movements Table */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card card-shadow">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Últimas Movimentações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Hora</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">CPF</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Empresa</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {mockMovements.map((m, i) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 transition-ros hover:bg-secondary/50"
                  >
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{m.time}</td>
                    <td className="px-4 py-2.5 font-medium text-foreground">{m.name}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{m.cpf}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{m.company}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        m.type === 'check-in'
                          ? 'bg-success/10 text-success'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {m.type === 'check-in' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Heat Map */}
        <div className="rounded-lg border border-border bg-card card-shadow">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Mapa de Calor</h3>
            <p className="text-[10px] text-muted-foreground">Entradas por hora — últimos 7 dias</p>
          </div>
          <div className="p-4 space-y-1.5">
            {heatmapData.map(d => (
              <div key={d.hour} className="flex items-center gap-2">
                <span className="w-6 text-right text-[10px] font-mono text-muted-foreground">{d.hour}h</span>
                <div className="flex-1 h-5 rounded-sm bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.value / 22) * 100}%` }}
                    transition={{ duration: 0.5, delay: Number(d.hour) * 0.02 }}
                    className={`h-full rounded-sm ${getHeatColor(d.value)}`}
                  />
                </div>
                <span className="w-5 text-right text-[10px] font-mono text-muted-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Parking Map */}
      <ParkingMap title="Vagas do Pátio" compact />
    </div>
  );
};

export default DashboardPage;
