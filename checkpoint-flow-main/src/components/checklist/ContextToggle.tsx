import { useState, useEffect } from 'react';
import { Truck, Package, Skull, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChecklistContext } from '@/types/checklist';
import { QRScanner } from './QRScanner';

interface Props {
  context: ChecklistContext;
  onToggle: (key: keyof ChecklistContext) => void;
  vehiclePlate: string;
  onVehiclePlateChange: (plate: string) => void;
}

const toggles: { key: keyof ChecklistContext; label: string; icon: React.ReactNode; description: string }[] = [
  { key: 'vehicle', label: 'Veículo envolvido', icon: <Truck className="w-5 h-5" />, description: 'Inclui inspeção veicular' },
  { key: 'fragile', label: 'Produtos frágeis', icon: <Package className="w-5 h-5" />, description: 'Inclui verificação extra de embalagem' },
  { key: 'hazmat', label: 'Material perigoso', icon: <Skull className="w-5 h-5" />, description: 'Inclui checklist de segurança e conformidade' },
];

export function ContextToggle({ context, onToggle, vehiclePlate, onVehiclePlateChange }: Props) {
  const [showQR, setShowQR] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        setHasCamera(devices.some(d => d.kind === 'videoinput'));
      }).catch(() => setHasCamera(false));
    } else {
      setHasCamera(false);
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {toggles.map(t => (
          <button
            key={t.key}
            onClick={() => onToggle(t.key)}
            className={cn(
              'flex items-center gap-3 rounded-lg border p-3 transition-fast text-left',
              context[t.key]
                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40'
            )}
          >
            <div className={cn(
              'p-2 rounded-md',
              context[t.key] ? 'bg-primary/15' : 'bg-muted'
            )}>
              {t.icon}
            </div>
            <div>
              <p className="text-sm font-semibold">{t.label}</p>
              <p className="text-[10px] text-muted-foreground">{t.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Vehicle plate field */}
      {context.vehicle && (
        <div className="flex items-center gap-2 max-w-md">
          <input
            type="text"
            placeholder="Placa do veículo"
            value={vehiclePlate}
            onChange={(e) => onVehiclePlateChange(e.target.value.toUpperCase())}
            maxLength={10}
            className="flex-1 rounded-md border bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {hasCamera && (
            <button
              onClick={() => setShowQR(true)}
              className="p-2 rounded-md border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-fast"
              title="Escanear QR Code"
            >
              <QrCode className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {showQR && (
        <QRScanner
          open={showQR}
          onClose={() => setShowQR(false)}
          onResult={(val) => onVehiclePlateChange(val.toUpperCase())}
        />
      )}
    </div>
  );
}
