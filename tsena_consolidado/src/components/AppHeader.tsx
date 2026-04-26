import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Siren, Users, Clock, Settings, Sun, Moon } from 'lucide-react';
import { useAppMode } from '@/contexts/AppModeContext';
import PanicModal from './PanicModal';
import tsenaLogo from '@/assets/tsena-logo.png';

const AppHeader = () => {
  const { mode, setMode } = useAppMode();
  const [time, setTime] = useState(new Date());
  const [panicOpen, setPanicOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('tsena-theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const modeLabel = mode === 'recepcao' ? 'Recepção' : 'Guarita';
  const visitorsInside = 42; // mock

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={tsenaLogo} alt="Tsena" className="h-10 w-10 rounded-md object-contain" />
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-none">
                Tsena
              </h1>
              <span className="text-[10px] text-muted-foreground">Empresa Demo</span>
            </div>
          </div>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            {modeLabel}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Clock className="h-3.5 w-3.5" />
            {time.toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            })}
          </div>

          <div className="flex items-center gap-1.5 rounded bg-secondary px-2.5 py-1">
            <Users className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-semibold text-foreground">{visitorsInside}</span>
            <span className="text-[10px] text-muted-foreground">no local</span>
          </div>

          <button
            onClick={toggleTheme}
            className="rounded p-1.5 text-muted-foreground transition-ros hover:bg-secondary hover:text-foreground"
            title={isDark ? 'Modo claro' : 'Modo escuro'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setMode(null)}
            className="rounded p-1.5 text-muted-foreground transition-ros hover:bg-secondary hover:text-foreground"
            title="Configurações"
          >
            <Settings className="h-4 w-4" />
          </button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setPanicOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground border border-destructive-foreground/20 glow-destructive transition-ros hover:brightness-110"
          >
            <Siren className="h-4 w-4 animate-pulse" />
            <span className="hidden sm:inline">Pânico</span>
          </motion.button>
        </div>
      </header>
      <PanicModal open={panicOpen} onClose={() => setPanicOpen(false)} />
    </>
  );
};

export default AppHeader;
