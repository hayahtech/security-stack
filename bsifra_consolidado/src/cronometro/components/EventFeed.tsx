import { LogEvento, Projeto } from '@/cronometro/types';
import { getLogs } from '@/cronometro/lib/storage';
import { formatDuration } from '@/cronometro/lib/time';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  projetos: Projeto[];
  refreshKey: number;
}

export function EventFeed({ projetos, refreshKey }: Props) {
  const logs = getLogs().sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
  const projetoMap = Object.fromEntries(projetos.map(p => [p.id, p.nome]));

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground mb-3">Feed de Eventos</h2>
      <ScrollArea className="h-[400px]">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento registrado</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 text-xs border-b border-border pb-2">
                <span
                  className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                    log.tipo_evento === 'INÍCIO' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground truncate">
                      {projetoMap[log.projeto_id] || 'Desconhecido'}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        log.tipo_evento === 'INÍCIO' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {log.tipo_evento}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{new Date(log.data_hora).toLocaleString('pt-BR')}</span>
                    {log.tipo_evento === 'FIM' && log.duracao_segundos != null && (
                      <span className="text-foreground font-mono">{formatDuration(log.duracao_segundos)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
