import { motion } from 'framer-motion';
import { LayoutGrid, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

const docks = [
  { id: 'D-01', status: 'ocupada', vehicle: 'ABC-1234', since: Date.now() - 3600000 },
  { id: 'D-02', status: 'livre', vehicle: null, since: null },
  { id: 'D-03', status: 'ocupada', vehicle: 'DEF-5678', since: Date.now() - 7200000 },
  { id: 'D-04', status: 'limpeza', vehicle: null, since: null },
  { id: 'D-05', status: 'livre', vehicle: null, since: null },
  { id: 'D-06', status: 'ocupada', vehicle: 'GHI-9012', since: Date.now() - 1800000 },
];

const queue = [
  { plate: 'JKL-3456', arrival: '08:15', driver: 'Fernando Santos' },
  { plate: 'MNO-7890', arrival: '08:45', driver: 'Roberto Lima' },
  { plate: 'PQR-1234', arrival: '09:10', driver: 'Claudio Mendes' },
];

const statusStyles: Record<string, { label: string; bg: string; text: string }> = {
  livre: { label: 'Livre', bg: 'bg-success/10 border-success/30', text: 'text-success' },
  ocupada: { label: 'Ocupada', bg: 'bg-destructive/10 border-destructive/30', text: 'text-destructive' },
  limpeza: { label: 'Em limpeza', bg: 'bg-warning/10 border-warning/30', text: 'text-warning' },
};

const formatElapsed = (since: number | null) => {
  if (!since) return '';
  const diff = Math.floor((Date.now() - since) / 60000);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h${m.toString().padStart(2, '0')}m`;
};

const YardPage = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Gestão de Pátio (YMS)</h2>
        <p className="text-xs text-muted-foreground">Controle de docas e fila de espera</p>
      </div>

      {/* Docks Grid */}
      <div className="rounded-lg border border-border bg-card p-4 card-shadow">
        <h3 className="text-sm font-semibold text-foreground mb-3">Docas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {docks.map(d => {
            const style = statusStyles[d.status];
            return (
              <motion.div
                key={d.id}
                whileHover={{ scale: 1.02 }}
                className={`rounded-lg border ${style.bg} p-3 text-center cursor-pointer transition-ros`}
              >
                <span className="text-sm font-bold font-mono text-foreground">{d.id}</span>
                <p className={`text-[10px] font-medium mt-1 ${style.text}`}>{style.label}</p>
                {d.vehicle && (
                  <>
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">{d.vehicle}</p>
                    <p className="text-[10px] font-mono text-muted-foreground flex items-center justify-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {formatElapsed(d.since)}
                    </p>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Queue */}
      <div className="rounded-lg border border-border bg-card card-shadow">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Fila de Espera</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-2.5 font-medium text-muted-foreground">#</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Placa</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Motorista</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Chegada</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Ação</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((q, i) => (
              <tr key={q.plate} className="border-b border-border/50 transition-ros hover:bg-secondary/50">
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-2.5 font-mono font-medium text-foreground">{q.plate}</td>
                <td className="px-4 py-2.5 text-foreground">{q.driver}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{q.arrival}</td>
                <td className="px-4 py-2.5">
                  <button className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground transition-ros hover:brightness-110">
                    Chamar para Doca
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default YardPage;
