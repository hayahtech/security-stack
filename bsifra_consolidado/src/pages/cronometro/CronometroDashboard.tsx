import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '@/cronometro/hooks/useProjects';
import { useTimers } from '@/cronometro/hooks/useTimers';
import { ProjectCard } from '@/cronometro/components/ProjectCard';
import { FullscreenTimer } from '@/cronometro/components/FullscreenTimer';
import { EventFeed } from '@/cronometro/components/EventFeed';
import { getSessoesByProjeto } from '@/cronometro/lib/storage';
import { Button } from '@/components/ui/button';
import { Plus, Timer } from 'lucide-react';
import { MotionDiv, staggerContainer, fadeUp } from '@/lib/motion';

const CronometroDashboard = () => {
  const [eventKey, setEventKey] = useState(0);
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const { projetos, refresh } = useProjects();
  const handleEvent = useCallback(() => { setEventKey(k => k + 1); refresh(); }, [refresh]);
  const { start, stop, getElapsedSeconds, getTotalSeconds, isRunning } = useTimers(handleEvent);

  const sortedProjetos = useMemo(() => {
    return [...projetos].sort((a, b) => {
      const aRunning = isRunning(a.id); const bRunning = isRunning(b.id);
      if (aRunning && !bRunning) return -1; if (!aRunning && bRunning) return 1; return 0;
    });
  }, [projetos, isRunning]);

  const hasEverBeenActivated = useCallback((projetoId: string): boolean => {
    return getSessoesByProjeto(projetoId).length > 0;
  }, [eventKey]); // eslint-disable-line

  const fullscreenProjeto = fullscreenId ? projetos.find(p => p.id === fullscreenId) : null;

  return (
    <>
      <MotionDiv className="space-y-8" initial="hidden" animate="show" variants={staggerContainer}>
        <MotionDiv variants={fadeUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-[34px] font-extrabold text-foreground tracking-tight">Multi-Cronômetro</h1>
            <p className="text-sm font-light text-muted-foreground">Registre o tempo dedicado a cada projeto</p>
          </div>
          <Button asChild className="font-medium">
            <Link to="/cronometro/novo"><Plus className="mr-2 h-4 w-4" /> Novo Projeto</Link>
          </Button>
        </MotionDiv>

        {sortedProjetos.length === 0 ? (
          <MotionDiv variants={fadeUp} className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="rounded-full bg-muted p-6">
              <Timer className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-semibold text-foreground">Nenhum projeto ainda</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Crie seu primeiro projeto e comece a registrar o tempo dedicado a cada tarefa.
              </p>
            </div>
            <Button asChild>
              <Link to="/cronometro/novo"><Plus className="mr-2 h-4 w-4" /> Criar primeiro projeto</Link>
            </Button>
          </MotionDiv>
        ) : (
          <MotionDiv variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedProjetos.map(p => (
              <MotionDiv key={p.id} variants={fadeUp}>
                <ProjectCard
                  projeto={p}
                  isRunning={isRunning(p.id)}
                  elapsedSeconds={getElapsedSeconds(p.id)}
                  getTotalSeconds={getTotalSeconds}
                  onStart={start}
                  onStop={stop}
                  hasBeenActivated={hasEverBeenActivated(p.id)}
                  onFullscreen={() => setFullscreenId(p.id)}
                />
              </MotionDiv>
            ))}
          </MotionDiv>
        )}

        <MotionDiv variants={fadeUp}>
          <EventFeed projetos={projetos} refreshKey={eventKey} />
        </MotionDiv>
      </MotionDiv>

      {fullscreenProjeto && isRunning(fullscreenProjeto.id) && (
        <FullscreenTimer
          projeto={fullscreenProjeto}
          elapsedSeconds={getElapsedSeconds(fullscreenProjeto.id)}
          getTotalSeconds={getTotalSeconds}
          onStop={(id) => { stop(id); setFullscreenId(null); }}
          onClose={() => setFullscreenId(null)}
        />
      )}
    </>
  );
};

export default CronometroDashboard;
