import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Dock, DockStatus, ReceivingHistory, ScheduleStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Truck, Clock, Package, Search, Plus, Download, Calendar,
  CheckCircle2, AlertTriangle, Ban, Loader2, Timer,
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NewScheduleModal } from '@/components/receiving/NewScheduleModal';
import { ConferenceModal } from '@/components/receiving/ConferenceModal';

const dockStatusConfig: Record<DockStatus, { label: string; color: string; icon: typeof Truck }> = {
  LIVRE: { label: 'Livre', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  OCUPADA: { label: 'Ocupada', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Truck },
  AGUARDANDO_CONFERENCIA: { label: 'Aguardando', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Package },
  BLOQUEADA: { label: 'Bloqueada', color: 'bg-destructive/20 text-destructive border-destructive/30', icon: Ban },
};

const scheduleStatusConfig: Record<ScheduleStatus, { label: string; color: string }> = {
  AGENDADO: { label: 'Agendado', color: 'bg-muted text-muted-foreground' },
  CONFIRMADO: { label: 'Confirmado', color: 'bg-blue-500/20 text-blue-400' },
  EM_TRANSITO: { label: 'Em Trânsito', color: 'bg-amber-500/20 text-amber-400' },
  CHEGOU: { label: 'Chegou', color: 'bg-emerald-500/20 text-emerald-400' },
  ATRASADO: { label: 'Atrasado', color: 'bg-destructive/20 text-destructive' },
  CANCELADO: { label: 'Cancelado', color: 'bg-muted text-muted-foreground line-through' },
};

const historyStatusConfig: Record<ReceivingHistory['status'], { label: string; color: string }> = {
  CONCLUIDO: { label: 'Concluído', color: 'bg-emerald-500/20 text-emerald-400' },
  COM_DIVERGENCIAS: { label: 'Com Divergências', color: 'bg-amber-500/20 text-amber-400' },
  RECUSADO: { label: 'Recusado', color: 'bg-destructive/20 text-destructive' },
};

function ElapsedTimer({ since }: { since: Date }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const mins = differenceInMinutes(now, since);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return <span className="font-mono text-xs">{h > 0 ? `${h}h ${m}m` : `${m}m`}</span>;
}

export default function Receiving() {
  const { docks, receivingSchedules, receivingHistory, updateDockStatus } = useAppStore();
  const { toast } = useToast();

  const [scheduleModal, setScheduleModal] = useState(false);
  const [conferenceDock, setConferenceDock] = useState<Dock | null>(null);
  const [histSearch, setHistSearch] = useState('');
  const [histStatus, setHistStatus] = useState<string>('all');

  const handleDockAction = (dock: Dock) => {
    switch (dock.status) {
      case 'LIVRE':
        setScheduleModal(true);
        break;
      case 'OCUPADA':
        updateDockStatus(dock.id, { status: 'AGUARDANDO_CONFERENCIA' });
        toast({ title: `${dock.name} — Descarga concluída`, description: 'Aguardando conferência' });
        break;
      case 'AGUARDANDO_CONFERENCIA':
        setConferenceDock(dock);
        break;
      case 'BLOQUEADA':
        updateDockStatus(dock.id, { status: 'LIVRE', supplierId: undefined, supplierName: undefined, poId: undefined, poNumber: undefined, arrivalTime: undefined });
        toast({ title: `${dock.name} liberada`, description: 'Doca disponível para recebimento' });
        break;
    }
  };

  const dockActionLabel: Record<DockStatus, string> = {
    LIVRE: 'Agendar Chegada',
    OCUPADA: 'Iniciar Conferência',
    AGUARDANDO_CONFERENCIA: 'Finalizar Recebimento',
    BLOQUEADA: 'Liberar Doca',
  };

  const filteredHistory = useMemo(() => {
    return receivingHistory.filter(h => {
      if (histStatus !== 'all' && h.status !== histStatus) return false;
      if (histSearch) {
        const q = histSearch.toLowerCase();
        return h.supplierName.toLowerCase().includes(q) || h.poNumber.toLowerCase().includes(q) || h.inspector.toLowerCase().includes(q) || h.nfNumber.includes(q);
      }
      return true;
    });
  }, [receivingHistory, histSearch, histStatus]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Recebimento de Mercadorias</h1>
          <p className="text-xs text-muted-foreground">Painel de Docas · Centro de Distribuição</p>
        </div>
        <Button size="sm" className="h-7 text-xs" onClick={() => setScheduleModal(true)}>
          <Plus className="h-3 w-3 mr-1" /> Novo Agendamento
        </Button>
      </div>

      {/* DOCK PANEL */}
      <div>
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-1"><Truck className="h-4 w-4" /> Painel de Docas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {docks.map(dock => {
            const cfg = dockStatusConfig[dock.status];
            const Icon = cfg.icon;
            return (
              <Card key={dock.id} className={cn('relative overflow-hidden', dock.status === 'BLOQUEADA' && 'opacity-70')}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide">DOCA {String(dock.number).padStart(2, '0')}</span>
                    <Badge className={cn('text-[10px] border', cfg.color)}><Icon className="h-3 w-3 mr-0.5" />{cfg.label}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{dock.name}</div>

                  {(dock.status === 'OCUPADA' || dock.status === 'AGUARDANDO_CONFERENCIA') && (
                    <div className="space-y-1 text-[11px]">
                      <div className="truncate font-medium">{dock.supplierName}</div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-mono">{dock.poNumber}</span>
                        {dock.arrivalTime && (
                          <span className="flex items-center gap-0.5"><Timer className="h-3 w-3" /><ElapsedTimer since={dock.arrivalTime} /></span>
                        )}
                      </div>
                      {dock.arrivalTime && (
                        <div className="text-[10px] text-muted-foreground">Chegada: {format(dock.arrivalTime, 'HH:mm', { locale: ptBR })}</div>
                      )}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant={dock.status === 'BLOQUEADA' ? 'destructive' : dock.status === 'LIVRE' ? 'outline' : 'default'}
                    className="w-full h-6 text-[10px]"
                    onClick={() => handleDockAction(dock)}
                  >
                    {dockActionLabel[dock.status]}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SCHEDULE QUEUE */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm flex items-center gap-1">
            <Calendar className="h-4 w-4" /> Agendamentos do Dia — {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead className="h-8">Horário</TableHead>
                  <TableHead className="h-8">Fornecedor</TableHead>
                  <TableHead className="h-8">PO</TableHead>
                  <TableHead className="h-8 text-center">Itens</TableHead>
                  <TableHead className="h-8 text-center">Peso (kg)</TableHead>
                  <TableHead className="h-8">Doca</TableHead>
                  <TableHead className="h-8">Motorista</TableHead>
                  <TableHead className="h-8">Placa</TableHead>
                  <TableHead className="h-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivingSchedules.map(s => {
                  const sCfg = scheduleStatusConfig[s.status];
                  return (
                    <TableRow key={s.id} className="text-xs">
                      <TableCell className="py-1.5 font-mono">{format(s.scheduledTime, 'HH:mm')}</TableCell>
                      <TableCell className="py-1.5 max-w-[160px] truncate">{s.supplierName}</TableCell>
                      <TableCell className="py-1.5 font-mono">{s.poNumber}</TableCell>
                      <TableCell className="py-1.5 text-center">{s.expectedItems}</TableCell>
                      <TableCell className="py-1.5 text-center font-mono">{s.estimatedWeight.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="py-1.5">{s.dockName || '—'}</TableCell>
                      <TableCell className="py-1.5">{s.driverName}</TableCell>
                      <TableCell className="py-1.5 font-mono">{s.licensePlate}</TableCell>
                      <TableCell className="py-1.5">
                        <Badge className={cn('text-[10px] border-0', sCfg.color)}>{sCfg.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* HISTORY */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-1"><Clock className="h-4 w-4" /> Histórico de Recebimentos</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Buscar..." className="pl-7 h-7 text-xs w-40" />
              </div>
              <Select value={histStatus} onValueChange={setHistStatus}>
                <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos</SelectItem>
                  <SelectItem value="CONCLUIDO" className="text-xs">Concluído</SelectItem>
                  <SelectItem value="COM_DIVERGENCIAS" className="text-xs">Com Divergências</SelectItem>
                  <SelectItem value="RECUSADO" className="text-xs">Recusado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-7 text-xs"><Download className="h-3 w-3 mr-1" /> CSV</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="h-8">Data</TableHead>
                <TableHead className="h-8">Fornecedor</TableHead>
                <TableHead className="h-8">PO</TableHead>
                <TableHead className="h-8">NF</TableHead>
                <TableHead className="h-8 text-center">Itens</TableHead>
                <TableHead className="h-8 text-right">Valor R$</TableHead>
                <TableHead className="h-8 text-center">Diverg.</TableHead>
                <TableHead className="h-8">Conferente</TableHead>
                <TableHead className="h-8">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map(h => {
                const hCfg = historyStatusConfig[h.status];
                return (
                  <TableRow key={h.id} className="text-xs">
                    <TableCell className="py-1.5 font-mono">{format(h.date, 'dd/MM/yy')}</TableCell>
                    <TableCell className="py-1.5 max-w-[160px] truncate">{h.supplierName}</TableCell>
                    <TableCell className="py-1.5 font-mono">{h.poNumber}</TableCell>
                    <TableCell className="py-1.5 font-mono">{h.nfNumber}</TableCell>
                    <TableCell className="py-1.5 text-center">{h.totalItems}</TableCell>
                    <TableCell className="py-1.5 text-right font-mono">{h.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="py-1.5 text-center">
                      {h.divergences > 0 ? <Badge variant="outline" className="text-[10px] text-amber-400">{h.divergences}</Badge> : <span className="text-muted-foreground">0</span>}
                    </TableCell>
                    <TableCell className="py-1.5">{h.inspector}</TableCell>
                    <TableCell className="py-1.5"><Badge className={cn('text-[10px] border-0', hCfg.color)}>{hCfg.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NewScheduleModal open={scheduleModal} onOpenChange={setScheduleModal} />
      {conferenceDock && (
        <ConferenceModal open={!!conferenceDock} onOpenChange={(v) => !v && setConferenceDock(null)} dock={conferenceDock} />
      )}
    </div>
  );
}
