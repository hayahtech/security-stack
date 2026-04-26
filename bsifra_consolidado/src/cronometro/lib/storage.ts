import { Projeto, SessaoTempo, LogEvento } from '@/cronometro/types';

const KEYS = {
  projetos: 'mc_projetos',
  sessoes: 'mc_sessoes',
  logs: 'mc_logs',
};

function get<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Projetos
export function getProjetos(): Projeto[] {
  return get<Projeto>(KEYS.projetos);
}

export function saveProjeto(p: Projeto) {
  const all = get<Projeto>(KEYS.projetos);
  const idx = all.findIndex(x => x.id === p.id);
  if (idx >= 0) all[idx] = p;
  else all.push(p);
  set(KEYS.projetos, all);
}

export function deleteProjeto(id: string) {
  set(KEYS.projetos, get<Projeto>(KEYS.projetos).filter(p => p.id !== id));
  set(KEYS.sessoes, getSessoes().filter(s => s.projeto_id !== id));
  set(KEYS.logs, getLogs().filter(l => l.projeto_id !== id));
}

// Sessões
export function getSessoes(): SessaoTempo[] {
  return get<SessaoTempo>(KEYS.sessoes);
}

export function getSessoesByProjeto(projetoId: string): SessaoTempo[] {
  return getSessoes().filter(s => s.projeto_id === projetoId);
}

export function getOpenSession(projetoId: string): SessaoTempo | undefined {
  return getSessoes().find(s => s.projeto_id === projetoId && !s.hora_fim);
}

export function saveSessao(s: SessaoTempo) {
  const all = getSessoes();
  const idx = all.findIndex(x => x.id === s.id);
  if (idx >= 0) all[idx] = s;
  else all.push(s);
  set(KEYS.sessoes, all);
}

// Logs
export function getLogs(): LogEvento[] {
  return get<LogEvento>(KEYS.logs);
}

export function addLog(log: LogEvento) {
  const all = getLogs();
  all.push(log);
  set(KEYS.logs, all);
}
