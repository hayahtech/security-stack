import { useState, useEffect, useCallback, useRef } from 'react';
import { SessaoTempo, LogEvento } from '@/cronometro/types';
import { getOpenSession, saveSessao, addLog, getSessoesByProjeto, getSessoes } from '@/cronometro/lib/storage';

function genId() {
  return crypto.randomUUID();
}

export function useTimers(onEvent?: () => void) {
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Force re-render every second for active timers
  useEffect(() => {
    intervalRef.current = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const getActiveSession = useCallback((projetoId: string): SessaoTempo | undefined => {
    return getOpenSession(projetoId);
  }, [tick]); // eslint-disable-line

  const start = useCallback((projetoId: string) => {
    if (getOpenSession(projetoId)) return; // already running
    const sessaoId = genId();
    const now = new Date().toISOString();
    const sessao: SessaoTempo = {
      id: sessaoId,
      projeto_id: projetoId,
      hora_inicio: now,
      hora_fim: null,
      duracao_segundos: null,
      observacoes: '',
    };
    saveSessao(sessao);
    const log: LogEvento = {
      id: genId(),
      projeto_id: projetoId,
      tipo_evento: 'INÍCIO',
      data_hora: now,
      sessao_id: sessaoId,
    };
    addLog(log);
    onEvent?.();
  }, [onEvent]);

  const stop = useCallback((projetoId: string) => {
    const sessao = getOpenSession(projetoId);
    if (!sessao) return;
    const now = new Date();
    const duracao = Math.floor((now.getTime() - new Date(sessao.hora_inicio).getTime()) / 1000);
    sessao.hora_fim = now.toISOString();
    sessao.duracao_segundos = duracao;
    saveSessao(sessao);
    const log: LogEvento = {
      id: genId(),
      projeto_id: projetoId,
      tipo_evento: 'FIM',
      data_hora: now.toISOString(),
      sessao_id: sessao.id,
      duracao_segundos: duracao,
    };
    addLog(log);
    onEvent?.();
  }, [onEvent]);

  const getElapsedSeconds = useCallback((projetoId: string): number => {
    const sessao = getOpenSession(projetoId);
    if (!sessao) return 0;
    return Math.floor((Date.now() - new Date(sessao.hora_inicio).getTime()) / 1000);
  }, [tick]); // eslint-disable-line

  const getTotalSeconds = useCallback((projetoId: string, since?: Date): number => {
    const sessoes = getSessoesByProjeto(projetoId);
    let total = 0;
    for (const s of sessoes) {
      if (since && new Date(s.hora_inicio) < since) continue;
      if (s.duracao_segundos != null) {
        total += s.duracao_segundos;
      } else {
        // active session
        total += Math.floor((Date.now() - new Date(s.hora_inicio).getTime()) / 1000);
      }
    }
    return total;
  }, [tick]); // eslint-disable-line

  const isRunning = useCallback((projetoId: string): boolean => {
    return !!getOpenSession(projetoId);
  }, [tick]); // eslint-disable-line

  return { start, stop, getElapsedSeconds, getTotalSeconds, isRunning, getActiveSession, tick };
}
