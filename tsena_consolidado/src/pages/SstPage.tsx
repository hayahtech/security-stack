import { motion } from 'framer-motion';
import { HardHat, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const mockWorkers = [
  { id: '1', name: 'José Pereira', company: 'Elétrica Forte', cpf: '111.222.333-44', role: 'Eletricista',
    certs: [
      { name: 'ASO', expiry: '2026-08-15', status: 'regular' },
      { name: 'NR-10', expiry: '2026-04-01', status: 'vencendo' },
      { name: 'NR-35', expiry: '2025-12-01', status: 'vencido' },
    ]},
  { id: '2', name: 'Marcos Alves', company: 'Manutenção Total', cpf: '555.666.777-88', role: 'Mecânico',
    certs: [
      { name: 'ASO', expiry: '2026-10-20', status: 'regular' },
      { name: 'NR-12', expiry: '2027-01-15', status: 'regular' },
    ]},
];

const statusIcon: Record<string, { icon: typeof CheckCircle; style: string; label: string }> = {
  regular: { icon: CheckCircle, style: 'text-success', label: 'Regular' },
  vencendo: { icon: Clock, style: 'text-warning', label: 'Vencendo' },
  vencido: { icon: AlertTriangle, style: 'text-destructive', label: 'Vencido' },
};

const SstPage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-foreground">SST — Segurança do Trabalho</h2>
      <p className="text-xs text-muted-foreground">Gestão de certificações de terceiros</p>
    </div>

    <div className="space-y-4">
      {mockWorkers.map((w, i) => {
        const worstStatus = w.certs.some(c => c.status === 'vencido') ? 'vencido'
          : w.certs.some(c => c.status === 'vencendo') ? 'vencendo' : 'regular';
        const worst = statusIcon[worstStatus];

        return (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-border bg-card p-4 card-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{w.name}</h3>
                <p className="text-xs text-muted-foreground">{w.company} · {w.role}</p>
                <p className="text-xs font-mono text-muted-foreground">{w.cpf}</p>
              </div>
              <div className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium ${worst.style}`}>
                <worst.icon className="h-3 w-3" />
                {worst.label}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {w.certs.map(c => {
                const s = statusIcon[c.status];
                return (
                  <div key={c.name} className={`flex items-center gap-1.5 rounded border border-border bg-secondary px-2.5 py-1.5`}>
                    <s.icon className={`h-3 w-3 ${s.style}`} />
                    <span className="text-[10px] font-medium text-foreground">{c.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{c.expiry}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
);

export default SstPage;
