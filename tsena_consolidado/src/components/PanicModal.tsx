import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Phone, ShieldAlert, X } from 'lucide-react';

interface PanicModalProps {
  open: boolean;
  onClose: () => void;
}

const PanicModal = ({ open, onClose }: PanicModalProps) => {
  const [countdown, setCountdown] = useState(5);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open) {
      setCountdown(5);
      setConfirmed(false);
      return;
    }

    if (confirmed) return;

    if (countdown <= 0) {
      setConfirmed(true);
      return;
    }

    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, countdown, confirmed]);

  if (!open) return null;

  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-destructive"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <ShieldAlert className="mx-auto h-24 w-24 text-destructive-foreground animate-pulse" />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-destructive-foreground">
            SEGURANÇA ACIONADA
          </h1>
          <p className="mt-2 text-lg text-destructive-foreground/80 font-mono">
            {new Date().toLocaleString('pt-BR')}
          </p>
        </motion.div>

        <div className="mt-12 flex gap-4">
          <button
            onClick={() => window.open('tel:190')}
            className="flex items-center gap-2 rounded-md bg-destructive-foreground/20 px-6 py-3 text-sm font-semibold text-destructive-foreground border border-destructive-foreground/30 transition-ros hover:bg-destructive-foreground/30"
          >
            <Phone className="h-4 w-4" />
            Ligar 190
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-md bg-destructive-foreground/10 px-6 py-3 text-sm font-medium text-destructive-foreground border border-destructive-foreground/20 transition-ros hover:bg-destructive-foreground/20"
          >
            <X className="h-4 w-4" />
            Cancelar Alerta
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="w-full max-w-md rounded-lg border border-destructive/50 bg-card p-8 text-center card-shadow"
      >
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-bold text-foreground">
          Acionar Segurança?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O alerta será acionado automaticamente em:
        </p>
        <div className="mt-4 text-5xl font-bold font-mono text-destructive">
          {countdown}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-ros hover:bg-muted"
        >
          Cancelar
        </button>
      </motion.div>
    </motion.div>
  );
};

export default PanicModal;
