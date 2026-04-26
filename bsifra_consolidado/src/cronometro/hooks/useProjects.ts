import { useState, useCallback } from 'react';
import { Projeto } from '@/cronometro/types';
import { getProjetos, saveProjeto, deleteProjeto } from '@/cronometro/lib/storage';

export function useProjects() {
  const [projetos, setProjetos] = useState<Projeto[]>(getProjetos);

  const refresh = useCallback(() => setProjetos(getProjetos()), []);

  const save = useCallback((p: Projeto) => {
    saveProjeto(p);
    refresh();
  }, [refresh]);

  const remove = useCallback((id: string) => {
    deleteProjeto(id);
    refresh();
  }, [refresh]);

  return { projetos, refresh, save, remove };
}
