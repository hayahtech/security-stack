import { useState, useMemo } from 'react';
import { useProjects } from '@/cronometro/hooks/useProjects';
import { getSessoesByProjeto } from '@/cronometro/lib/storage';
import { formatDuration, formatTime, startOfDay, startOfWeek, startOfMonth } from '@/cronometro/lib/time';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SessaoTempo } from '@/cronometro/types';

const SORT_OPTIONS = [
  { value: 'default', label: 'Padrão' },
  { value: 'maior-tempo', label: 'Maior Tempo' },
  { value: 'menor-tempo', label: 'Menor Tempo' },
  { value: 'mais-sessoes', label: '+ Sessões' },
  { value: 'menos-sessoes', label: '- Sessões' },
];

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '15d', label: '15 dias' },
  { value: '30d', label: '30 dias' },
  { value: '60d', label: '60 dias' },
  { value: '90d', label: '90 dias' },
  { value: '6m', label: '6 meses' },
  { value: '1y', label: '1 ano' },
  { value: 'all', label: 'Tudo' },
];

function getPeriodDate(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case 'today': return startOfDay();
    case '7d': return new Date(now.getTime() - 7 * 86400000);
    case '15d': return new Date(now.getTime() - 15 * 86400000);
    case '30d': return new Date(now.getTime() - 30 * 86400000);
    case '60d': return new Date(now.getTime() - 60 * 86400000);
    case '90d': return new Date(now.getTime() - 90 * 86400000);
    case '6m': return new Date(now.getTime() - 180 * 86400000);
    case '1y': return new Date(now.getTime() - 365 * 86400000);
    default: return null;
  }
}

const CronometroRelatorios = () => {
  const { projetos } = useProjects();
  const [selectedId, setSelectedId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const [period, setPeriod] = useState<string>('all');

  const periodDate = getPeriodDate(period);

  const allSessoes: SessaoTempo[] = projetos.flatMap(p => getSessoesByProjeto(p.id));
  const sessoes: SessaoTempo[] = useMemo(() => {
    let base = selectedId === 'all' ? allSessoes : getSessoesByProjeto(selectedId);
    if (periodDate) {
      base = base.filter(s => new Date(s.hora_inicio) >= periodDate);
    }
    return base.sort((a, b) => new Date(b.hora_inicio).getTime() - new Date(a.hora_inicio).getTime());
  }, [selectedId, allSessoes, periodDate]);

  const totalGeral = sessoes.reduce((acc, s) => acc + (s.duracao_segundos ?? 0), 0);

  const calcTotal = (since: Date) =>
    sessoes
      .filter(s => new Date(s.hora_inicio) >= since)
      .reduce((acc, s) => acc + (s.duracao_segundos ?? 0), 0);

  const formatTimeParts = (totalSeconds: number) => {
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return { h, m, s };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios de Tempo</h1>
        <p className="text-muted-foreground">Análise das sessões de trabalho registradas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[180px]">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Projeto</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projetos.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[160px]">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Ordenar por</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px]">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 block">Período</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Hoje', value: calcTotal(startOfDay()) },
          { label: 'Semana', value: calcTotal(startOfWeek()) },
          { label: 'Mês', value: calcTotal(startOfMonth()) },
          { label: 'Total', value: totalGeral },
        ].map(item => {
          const parts = formatTimeParts(item.value);
          return (
            <div
              key={item.label}
              className="relative rounded-2xl overflow-hidden bg-background border border-border"
              style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.08)' }}
            >
              <div className="absolute bottom-0 left-0 right-0 h-12 rounded-b-2xl" style={{ background: 'linear-gradient(to top, hsl(var(--primary) / 0.15), transparent)' }} />
              <div className="p-4 flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{item.label}</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-4xl font-extralight tracking-tight text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {parts.h}:{parts.m}
                  </span>
                  <span className="text-lg font-light text-primary" style={{ fontVariantNumeric: 'tabular-nums', verticalAlign: 'super' }}>
                    {parts.s}
                  </span>
                </div>
                <div className="h-1 rounded-full w-full" style={{ background: `linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.3))` }} />
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessões de Trabalho</CardTitle>
        </CardHeader>
        <CardContent>
          {sessoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma sessão registrada para este período</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessoes.map(s => {
                  const projeto = projetos.find(p => p.id === s.projeto_id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-medium">{projeto?.nome ?? '—'}</TableCell>
                      <TableCell className="text-xs font-mono">{new Date(s.hora_inicio).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {s.hora_fim ? new Date(s.hora_fim).toLocaleString('pt-BR') : <span className="text-primary">Em andamento</span>}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {s.duracao_segundos != null ? formatDuration(s.duracao_segundos) : '—'}
                      </TableCell>
                      <TableCell className="text-xs">{s.observacoes || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CronometroRelatorios;
