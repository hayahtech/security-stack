import { useEffect } from 'react';
import { Square, X, Calendar, Clock, Timer } from 'lucide-react';
import { Projeto } from '@/cronometro/types';
import { formatTime, startOfDay, startOfWeek, startOfMonth } from '@/cronometro/lib/time';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  projeto: Projeto;
  elapsedSeconds: number;
  getTotalSeconds: (id: string, since?: Date) => number;
  onStop: (id: string) => void;
  onClose: () => void;
}

const NEON_LIME = 'hsl(82, 100%, 55%)';
const GLOW_LIME = 'rgba(180, 255, 0, 0.25)';

const DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

export function FullscreenTimer({ projeto, elapsedSeconds, getTotalSeconds, onStop, onClose }: Props) {
  const totalDia = getTotalSeconds(projeto.id, startOfDay());
  const totalSemana = getTotalSeconds(projeto.id, startOfWeek());
  const totalMes = getTotalSeconds(projeto.id, startOfMonth());
  const mainTime = formatTime(elapsedSeconds);

  const today = new Date().getDay();
  const activeDayIndex = today === 0 ? 6 : today - 1;

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{ background: 'hsl(220, 25%, 3%)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: 'hsl(220, 15%, 10%)', border: '1px solid hsl(220, 15%, 18%)' }}
        >
          <X className="h-5 w-5 text-white/60" />
        </button>

        {/* Project name */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-8"
        >
          <h2 className="text-lg font-semibold text-white/70">{projeto.nome}</h2>
          <p className="text-xs text-white/30">{projeto.contratante}</p>
        </motion.div>

        {/* Day-of-week bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-5 mb-6"
        >
          {DAY_LABELS.map((label, i) => (
            <span
              key={label}
              className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                i === activeDayIndex ? '' : 'text-white/15'
              }`}
              style={i === activeDayIndex ? { color: NEON_LIME } : undefined}
            >
              {label}
            </span>
          ))}
        </motion.div>

        {/* Main timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="animate-led-pulse"
        >
          <span className="inline-flex items-baseline gap-1">
            {mainTime.split('').map((ch, i) => (
              <span
                key={i}
                className={ch === ':' ? 'mx-1 animate-led-blink' : ''}
                style={{
                  color: NEON_LIME,
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: 'clamp(5rem, 15vw, 12rem)',
                  lineHeight: 1,
                  letterSpacing: '0.04em',
                  textShadow: `0 0 10px ${NEON_LIME}, 0 0 30px ${GLOW_LIME}, 0 0 60px ${GLOW_LIME}, 0 0 120px ${GLOW_LIME}`,
                }}
              >
                {ch}
              </span>
            ))}
          </span>
        </motion.div>

        {/* Status label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs font-medium tracking-[0.3em] uppercase mt-4 mb-10"
          style={{ color: NEON_LIME, opacity: 0.5 }}
        >
          ● Cronometrando
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex gap-12 mb-12"
        >
          {[
            { label: 'Dia', icon: Clock, value: formatTime(totalDia) },
            { label: 'Semana', icon: Calendar, value: formatTime(totalSemana) },
            { label: 'Mês', icon: Timer, value: formatTime(totalMes) },
          ].map(({ label, icon: Icon, value }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="h-4 w-4 text-white/20" />
              <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">{label}</span>
              <span
                className="text-base font-extrabold"
                style={{ color: NEON_LIME, fontFamily: "'Manrope', sans-serif", opacity: 0.7 }}
              >
                {value}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Stop button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          onClick={() => { onStop(projeto.id); onClose(); }}
          className="w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{
            background: `radial-gradient(circle, ${GLOW_LIME}, transparent 70%)`,
            border: `2px solid ${NEON_LIME}60`,
            boxShadow: `0 0 30px ${GLOW_LIME}, 0 0 60px ${GLOW_LIME}`,
          }}
        >
          <Square className="h-7 w-7" style={{ color: NEON_LIME }} />
        </motion.button>
        <p className="text-[10px] text-white/25 mt-3 tracking-wider">PRESSIONE ESC PARA SAIR</p>
      </motion.div>
    </AnimatePresence>
  );
}
