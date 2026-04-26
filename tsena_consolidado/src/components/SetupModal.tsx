import { motion } from 'framer-motion';
import { Building2, Factory } from 'lucide-react';
import { useAppMode } from '@/contexts/AppModeContext';
import tsenaLogo from '@/assets/tsena-logo.png';

const SetupModal = () => {
  const { isSetupComplete, setMode } = useAppMode();

  if (isSetupComplete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-2xl px-6"
      >
        <div className="text-center mb-8">
          <img src={tsenaLogo} alt="Tsena" className="h-24 w-24 mx-auto mb-3 rounded-lg object-contain" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tsena
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Selecione o modo de operação para configurar o sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('recepcao')}
            className="group relative flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-left transition-ros hover:border-primary/50 hover:glow-primary card-shadow"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">Recepção</h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Escritórios e empresas de serviços. Foco em visitantes, correspondências e reuniões.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
              {['Visitantes', 'Entregas', 'Correspondências'].map(tag => (
                <span key={tag} className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('guarita')}
            className="group relative flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-left transition-ros hover:border-primary/50 hover:glow-primary card-shadow"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Factory className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">Guarita</h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Fábricas, agronegócio e CDs. Foco em NF-e, balança, pátio e SST.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
              {['NF-e', 'Balança', 'Pátio', 'SST'].map(tag => (
                <span key={tag} className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default SetupModal;
