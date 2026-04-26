import { Play, Square, Calendar, Clock, Timer, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Projeto } from '@/cronometro/types';
import { formatTime, startOfDay, startOfWeek, startOfMonth } from '@/cronometro/lib/time';

const NEON_LIME = 'hsl(82, 100%, 55%)';
const NEON_PURPLE = 'hsl(270, 100%, 65%)';

interface Props {
  projeto: Projeto;
  isRunning: boolean;
  elapsedSeconds: number;
  getTotalSeconds: (id: string, since?: Date) => number;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  hasBeenActivated: boolean;
  onFullscreen?: () => void;
}

function DigitDisplay({ value, color, active }: { value: string; color: string; active?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-[2px]">
      {value.split('').map((ch, i) => (
        <span
          key={i}
          className={`${ch === ':' ? 'mx-[2px]' : ''} ${active && ch === ':' ? 'animate-led-blink' : ''}`}
          style={{
            color,
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            letterSpacing: '0.02em',
            textShadow: active
              ? `0 0 8px ${color}, 0 0 20px ${color}90, 0 0 40px ${color}50, 0 0 80px ${color}20`
              : `0 0 4px ${color}40`,
            filter: active ? 'brightness(1.15)' : 'none',
            transition: 'text-shadow 0.3s, filter 0.3s',
          }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

function DayIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${
        active ? '' : 'text-white/20'
      }`}
      style={active ? { color: NEON_LIME } : undefined}
    >
      {label}
    </span>
  );
}

const DAY_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

export function ProjectCard({ projeto, isRunning, elapsedSeconds, getTotalSeconds, onStart, onStop, hasBeenActivated, onFullscreen }: Props) {
  const totalDia = getTotalSeconds(projeto.id, startOfDay());
  const totalSemana = getTotalSeconds(projeto.id, startOfWeek());
  const totalMes = getTotalSeconds(projeto.id, startOfMonth());

  const today = new Date().getDay();
  const activeDayIndex = today === 0 ? 6 : today - 1;

  const mainTime = isRunning ? formatTime(elapsedSeconds) : formatTime(totalDia);

  const getMainColor = () => {
    if (isRunning) return NEON_LIME;
    if (hasBeenActivated) return NEON_PURPLE; // was activated before = paused
    if (projeto.status === 'pausado') return NEON_PURPLE;
    if (!hasBeenActivated && projeto.status !== 'concluido') return 'hsl(0, 80%, 55%)'; // never started
    return 'hsl(0, 0%, 60%)';
  };

  const getGlowColor = () => {
    if (isRunning) return 'rgba(180, 255, 0, 0.15)';
    if (hasBeenActivated || projeto.status === 'pausado') return 'rgba(160, 60, 255, 0.12)';
    if (!hasBeenActivated && projeto.status !== 'concluido') return 'rgba(255, 60, 60, 0.1)';
    return 'transparent';
  };

  const mainColor = getMainColor();

  return (
    <Link
      to={`/cronometro/editar/${projeto.id}`}
      className="block group"
    >
      <div
        className="relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
        style={{
          background: 'hsl(220, 20%, 6%)',
          boxShadow: `0 0 40px ${getGlowColor()}, 0 8px 32px rgba(0,0,0,0.5)`,
        }}
      >
        <div
          className="m-[3px] rounded-[21px] overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, hsl(220, 18%, 10%), hsl(220, 20%, 5%))',
            border: '1px solid hsl(220, 15%, 12%)',
          }}
        >
          {/* Day-of-week bar */}
          <div className="flex justify-center gap-3 pt-4 pb-2">
            {DAY_LABELS.map((label, i) => (
              <DayIndicator key={label} label={label} active={i === activeDayIndex} />
            ))}
          </div>

          {/* Main timer display */}
          <div className="flex flex-col items-center px-6 py-3">
            <div className={`text-5xl md:text-[3.5rem] leading-none tracking-wider ${isRunning ? 'animate-led-pulse' : ''}`}>
              <DigitDisplay value={mainTime} color={mainColor} active={isRunning} />
            </div>
            <p className="text-[9px] font-medium tracking-[0.25em] uppercase mt-2"
              style={{ color: mainColor, opacity: 0.6 }}>
              {isRunning ? '● Cronometrando' : 'Tempo Hoje'}
            </p>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px" style={{
            background: `linear-gradient(90deg, transparent, ${mainColor}40, transparent)`,
          }} />

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1 px-5 py-3">
            <div className="flex flex-col items-center gap-0.5">
              <Clock className="h-3 w-3 text-white/25" />
              <span className="text-[10px] font-bold text-white/30 uppercase">Dia</span>
              <span className="text-xs font-extrabold" style={{ color: mainColor, fontFamily: "'Manrope', sans-serif" }}>
                {formatTime(totalDia)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Calendar className="h-3 w-3 text-white/25" />
              <span className="text-[10px] font-bold text-white/30 uppercase">Semana</span>
              <span className="text-xs font-extrabold" style={{ color: mainColor, fontFamily: "'Manrope', sans-serif" }}>
                {formatTime(totalSemana)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <Timer className="h-3 w-3 text-white/25" />
              <span className="text-[10px] font-bold text-white/30 uppercase">Mês</span>
              <span className="text-xs font-extrabold" style={{ color: mainColor, fontFamily: "'Manrope', sans-serif" }}>
                {formatTime(totalMes)}
              </span>
            </div>
          </div>

          {/* Bottom: project name + actions */}
          <div className="flex items-center justify-between px-5 pb-4 pt-1">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-white/90 truncate">{projeto.nome}</h3>
              <p className="text-[10px] text-white/35 truncate">{projeto.contratante}</p>
            </div>

            <div className="flex items-center gap-2 ml-3">
              {/* Fullscreen button (only when running) */}
              {isRunning && onFullscreen && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFullscreen(); }}
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    background: 'hsl(220, 15%, 12%)',
                    border: `1px solid ${mainColor}40`,
                  }}
                >
                  <Maximize2 className="h-3.5 w-3.5" style={{ color: mainColor }} />
                </button>
              )}

              {projeto.status !== 'concluido' && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    isRunning ? onStop(projeto.id) : onStart(projeto.id);
                  }}
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  style={{
                    background: isRunning
                      ? `radial-gradient(circle, ${mainColor}30, transparent 70%)`
                      : 'hsl(220, 15%, 12%)',
                    border: `2px solid ${mainColor}60`,
                    boxShadow: isRunning ? `0 0 20px ${mainColor}40` : 'none',
                  }}
                >
                  {isRunning ? (
                    <Square className="h-4 w-4" style={{ color: mainColor }} />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" style={{ color: mainColor }} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
