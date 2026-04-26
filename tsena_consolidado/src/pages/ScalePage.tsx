import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Plus } from 'lucide-react';
import { toast } from 'sonner';

const mockWeighings = [
  { id: '1', plate: 'ABC-1234', type: 'entrada', tare: 8500, gross: null, net: null, date: '17/03/2026 08:30' },
  { id: '2', plate: 'DEF-5678', type: 'saida', tare: 9200, gross: 32400, net: 23200, date: '17/03/2026 09:15' },
  { id: '3', plate: 'GHI-9012', type: 'saida', tare: 7800, gross: 28600, net: 20800, date: '16/03/2026 16:45' },
];

const ScalePage = () => {
  const [plate, setPlate] = useState('');
  const [weight, setWeight] = useState('');
  const [type, setType] = useState<'entrada' | 'saida'>('entrada');

  const simulateCapture = () => {
    const simulated = Math.floor(Math.random() * 30000) + 5000;
    toast.success(`Simulando leitura serial... peso capturado: ${simulated.toLocaleString('pt-BR')} kg`);
    setWeight(String(simulated));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Balança Rodoviária</h2>
        <p className="text-xs text-muted-foreground">Registro de pesagens de veículos</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 card-shadow">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Placa</label>
            <input
              value={plate}
              onChange={e => setPlate(e.target.value)}
              placeholder="ABC-1234"
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
            <div className="flex gap-1">
              {(['entrada', 'saida'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-md px-2 py-2 text-xs font-medium transition-ros ${
                    type === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {t === 'entrada' ? 'Tara (Entrada)' : 'Bruto (Saída)'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Peso (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={simulateCapture}
              className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-ros hover:bg-muted"
            >
              Capturar da Balança
            </button>
            <button className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-ros hover:brightness-110">
              Salvar
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Placa</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Tara (kg)</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Bruto (kg)</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Líquido (kg)</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Data</th>
            </tr>
          </thead>
          <tbody>
            {mockWeighings.map((w, i) => (
              <motion.tr
                key={w.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 transition-ros hover:bg-secondary/50"
              >
                <td className="px-4 py-2.5 font-mono font-medium text-foreground">{w.plate}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    w.type === 'entrada' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                  }`}>
                    {w.type === 'entrada' ? 'Tara' : 'Bruto'}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{w.tare?.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{w.gross?.toLocaleString('pt-BR') || '—'}</td>
                <td className="px-4 py-2.5 font-mono font-semibold text-success">{w.net?.toLocaleString('pt-BR') || '—'}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{w.date}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScalePage;
