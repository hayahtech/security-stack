import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import NewVehicleModal from '@/components/NewVehicleModal';
import ParkingMap from '@/components/ParkingMap';

const mockVehicles = [
  { id: '1', plate: 'ABC-1234', model: 'Fiorino', color: 'Branco', driver: 'Carlos Silva', entry: '08:15', exit: null, spot: 'V-03' },
  { id: '2', plate: 'DEF-5678', model: 'HR Baú', color: 'Azul', driver: 'Pedro Oliveira', entry: '09:00', exit: null, spot: 'C-01' },
  { id: '3', plate: 'GHI-9012', model: 'Corolla', color: 'Prata', driver: 'Ana Santos', entry: '07:30', exit: '10:00', spot: '—' },
];

const VehiclesPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Controle de Veículos</h2>
          <p className="text-xs text-muted-foreground">{mockVehicles.filter(v => !v.exit).length} veículos no pátio</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-ros hover:brightness-110">
          <Plus className="h-3.5 w-3.5" />
          Registrar Entrada
        </button>
      </div>

      {/* Shared Parking Map */}
      <ParkingMap />

      {/* Table */}
      <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Placa</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Modelo</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Cor</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Motorista</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Entrada</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Saída</th>
              <th className="px-4 py-2.5 font-medium text-muted-foreground">Vaga</th>
            </tr>
          </thead>
          <tbody>
            {mockVehicles.map((v, i) => (
              <motion.tr
                key={v.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 transition-ros hover:bg-secondary/50"
              >
                <td className="px-4 py-2.5 font-mono font-medium text-foreground">{v.plate}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.model}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.color}</td>
                <td className="px-4 py-2.5 text-foreground">{v.driver}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{v.entry}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{v.exit || '—'}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{v.spot}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <NewVehicleModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default VehiclesPage;
