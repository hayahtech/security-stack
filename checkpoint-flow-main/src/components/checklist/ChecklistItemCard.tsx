import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Camera, X } from 'lucide-react';
import { StatusButton } from './StatusButton';
import type { ChecklistItem, ItemStatus } from '@/types/checklist';
import { cn } from '@/lib/utils';

interface Props {
  item: ChecklistItem;
  onStatusChange: (id: string, status: ItemStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onPhotoChange: (id: string, photo: string | undefined) => void;
  disabled?: boolean;
}

export function ChecklistItemCard({ item, onStatusChange, onNotesChange, onPhotoChange, disabled = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFailed = item.isCritical && item.status === 'NOT_OK';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onPhotoChange(item.id, reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'rounded-lg border bg-card p-4 shadow-[var(--shadow-card)] transition-fast',
        isFailed && 'border-destructive/50 bg-destructive/5',
        item.status === 'OK' && 'border-success/30',
        disabled && 'opacity-60'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {item.isCritical && (
              <span className={cn(
                'shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                isFailed ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'
              )}>
                <AlertTriangle className="w-3 h-3" />
                Obrigatório
              </span>
            )}
            <span className="text-sm font-medium text-card-foreground leading-tight">{item.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <StatusButton status="OK" currentStatus={item.status} onClick={() => !disabled && onStatusChange(item.id, 'OK')} label="OK" />
          <StatusButton status="NOT_OK" currentStatus={item.status} onClick={() => !disabled && onStatusChange(item.id, 'NOT_OK')} label="Não OK" />
          <StatusButton status="NA" currentStatus={item.status} onClick={() => !disabled && onStatusChange(item.id, 'NA')} label="N/A" />
          <button
            onClick={() => !disabled && fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              'p-1.5 rounded-md border text-muted-foreground hover:text-primary hover:border-primary/40 transition-fast',
              item.photo && 'border-primary/40 text-primary bg-primary/5'
            )}
            title="Capturar foto"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Photo thumbnail */}
      {item.photo && (
        <div className="mt-2 relative inline-block">
          <img
            src={item.photo}
            alt="Inspeção"
            className="w-[60px] h-[60px] object-cover rounded-lg border"
          />
          {!disabled && (
            <button
              onClick={() => onPhotoChange(item.id, undefined)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-fast"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {item.notes ? 'Ver observação' : 'Adicionar observação'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <textarea
              value={item.notes}
              onChange={(e) => onNotesChange(item.id, e.target.value)}
              placeholder="Observações..."
              maxLength={500}
              disabled={disabled}
              className="mt-2 w-full rounded-md border bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
              rows={2}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
