import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

export const parkingGrid = [
  { id: 'V-01', type: 'Visitante', occupied: false },
  { id: 'V-02', type: 'Visitante', occupied: true },
  { id: 'V-03', type: 'Visitante', occupied: true },
  { id: 'V-04', type: 'Visitante', occupied: false },
  { id: 'D-01', type: 'Diretoria', occupied: true },
  { id: 'D-02', type: 'Diretoria', occupied: false },
  { id: 'PCD-01', type: 'PCD', occupied: false },
  { id: 'C-01', type: 'Carga', occupied: true },
  { id: 'C-02', type: 'Carga', occupied: false },
  { id: 'C-03', type: 'Carga', occupied: false },
  { id: 'F-01', type: 'Funcionário', occupied: true },
  { id: 'F-02', type: 'Funcionário', occupied: true },
  { id: 'F-03', type: 'Funcionário', occupied: false },
  { id: 'F-04', type: 'Funcionário', occupied: true },
  { id: 'F-05', type: 'Funcionário', occupied: false },
];

interface ParkingMapProps {
  title?: string;
  compact?: boolean;
}

const ParkingMap = ({ title = 'Mapa de Vagas', compact = false }: ParkingMapProps) => {
  const occupied = parkingGrid.filter(s => s.occupied).length;
  const free = parkingGrid.filter(s => !s.occupied).length;

  return (
    <div className={`rounded-lg border border-border bg-card card-shadow ${compact ? '' : 'p-4'}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Livre ({free})</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Ocupada ({occupied})</span>
          </div>
        </div>
      )}
      {compact && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> {free}</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> {occupied}</span>
          </div>
        </div>
      )}
      <div className={`grid grid-cols-5 sm:grid-cols-10 gap-2 ${compact ? 'p-4' : ''}`}>
        {parkingGrid.map(spot => (
          <motion.div
            key={spot.id}
            whileHover={{ scale: 1.05 }}
            className={`flex flex-col items-center justify-center rounded-md border p-2 text-center transition-ros cursor-pointer ${
              spot.occupied
                ? 'border-destructive/30 bg-destructive/10'
                : 'border-success/30 bg-success/10'
            }`}
          >
            <Car className={`h-3.5 w-3.5 ${spot.occupied ? 'text-destructive' : 'text-success'}`} />
            <span className="mt-0.5 text-[9px] font-mono font-medium text-foreground">{spot.id}</span>
            <span className="text-[8px] text-muted-foreground">{spot.type}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ParkingMap;
