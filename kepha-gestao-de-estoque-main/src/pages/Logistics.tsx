import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { CDArea, ServiceOrder, ServiceOrderType, PickingItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Thermometer, Package, Search, Plus, ArrowRightLeft, ClipboardList,
  RefreshCw, Eye, CheckCircle2, AlertTriangle, Calendar, MapPin, Truck,
  RotateCcw, Scan, X,
} from 'lucide-react';
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const soTypeConfig: Record<ServiceOrderType, { label: string; icon: typeof Package; color: string }> = {
  REABASTECIMENTO: { label: 'Reabastecimento', icon: RefreshCw, color: 'bg-blue-500/20 text-blue-400' },
  SEPARACAO: { label: 'Separação', icon: Package, color: 'bg-emerald-500/20 text-emerald-400' },
  TRANSFERENCIA: { label: 'Transferência', icon: ArrowRightLeft, color: 'bg-purple-500/20 text-purple-400' },
  INVENTARIO: { label: 'Inventário', icon: ClipboardList, color: 'bg-amber-500/20 text-amber-400' },
  REORGANIZACAO: { label: 'Reorganização', icon: RotateCcw, color: 'bg-muted text-muted-foreground' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  URGENTE: { label: 'Urgente', color: 'bg-destructive/20 text-destructive' },
  ALTA: { label: 'Alta', color: 'bg-orange-500/20 text-orange-400' },
  NORMAL: { label: 'Normal', color: 'bg-blue-500/20 text-blue-400' },
  BAIXA: { label: 'Baixa', color: 'bg-muted text-muted-foreground' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ABERTA: { label: 'Aberta', color: 'bg-blue-500/20 text-blue-400' },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-amber-500/20 text-amber-400' },
  CONCLUIDA: { label: 'Concluída', color: 'bg-emerald-500/20 text-emerald-400' },
  CANCELADA: { label: 'Cancelada', color: 'bg-muted text-muted-foreground line-through' },
};

function occupancyColor(pct: number) {
  if (pct > 90) return 'bg-destructive/20 border-destructive/40';
  if (pct > 70) return 'bg-amber-500/15 border-amber-500/40';
  return 'bg-emerald-500/10 border-emerald-500/30';
}

function occupancyText(pct: number) {
  if (pct > 90) return 'text-destructive';
  if (pct > 70) return 'text-amber-500';
  return 'text-emerald-500';
}

export default function Logistics() {
  const { cdAreas, serviceOrders, replenishmentSuggestions, cycleCountSchedules, updateCDArea, updateServiceOrder, updateCycleCount, skus, users } = useAppStore();
  const { toast } = useToast();

  // Live temperature simulation
  const [areas, setAreas] = useState(cdAreas);
  useEffect(() => {
    const interval = setInterval(() => {
      setAreas(prev => prev.map(a => {
        if (a.temperature === undefined) return a;
        return { ...a, temperature: parseFloat((a.temperature + (Math.random() - 0.5)).toFixed(1)) };
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [pickingOrder, setPickingOrder] = useState<ServiceOrder | null>(null);
  const [pickingItems, setPickingItems] = useState<PickingItem[]>([]);
  const [newOsModal, setNewOsModal] = useState(false);
  const [selectedReplen, setSelectedReplen] = useState<Set<string>>(new Set());

  const filteredOrders = useMemo(() => {
    return serviceOrders.filter(o => {
      if (typeFilter !== 'all' && o.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return o.number.toLowerCase().includes(q) || o.operator.toLowerCase().includes(q) || o.skuNames.some(n => n.toLowerCase().includes(q));
      }
      return true;
    }).sort((a, b) => {
      const pOrder = { URGENTE: 0, ALTA: 1, NORMAL: 2, BAIXA: 3 };
      return pOrder[a.priority] - pOrder[b.priority];
    });
  }, [serviceOrders, search, typeFilter]);

  const openPicking = (order: ServiceOrder) => {
    if (!order.items) return;
    setPickingItems(order.items.map(i => ({ ...i })));
    setPickingOrder(order);
  };

  const updatePickingItem = (idx: number, qty: number) => {
    setPickingItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return { ...item, collectedQty: qty, status: qty >= item.requestedQty ? 'collected' : 'pending' };
    }));
  };

  const reportProblem = (idx: number, note: string) => {
    setPickingItems(prev => prev.map((item, i) => i === idx ? { ...item, status: 'problem', problemNote: note } : item));
  };

  const pickingProgress = pickingItems.length > 0 ? (pickingItems.filter(i => i.status !== 'pending').length / pickingItems.length) * 100 : 0;
  const pickingDone = pickingItems.length > 0 && pickingItems.every(i => i.status !== 'pending');

  const completePicking = () => {
    if (!pickingOrder) return;
    updateServiceOrder(pickingOrder.id, { status: 'CONCLUIDA' });
    toast({ title: '✅ Separação concluída', description: `${pickingOrder.number} — ${pickingItems.filter(i => i.status === 'collected').length} itens coletados` });
    setPickingOrder(null);
    setPickingItems([]);
  };

  const generateReplenOs = () => {
    const selected = replenishmentSuggestions.filter(r => selectedReplen.has(r.id));
    toast({ title: `${selected.length} OS de reabastecimento geradas`, description: 'Ordens criadas com sucesso' });
    setSelectedReplen(new Set());
  };

  // CD Map layout data
  const mapAreas = [
    { area: areas.find(a => a.type === 'DOCA_RECEBIMENTO')!, gridArea: '1/1/2/3', label: 'DOCAS RECEBIMENTO' },
    { area: areas.find(a => a.type === 'DOCA_EXPEDICAO')!, gridArea: '1/3/2/5', label: 'DOCAS EXPEDIÇÃO' },
    { area: areas.find(a => a.type === 'CAMARA_FRIA')!, gridArea: '2/1/4/2', label: 'CÂMARA FRIA' },
    { area: areas.find(a => a.type === 'AREA_SECA')!, gridArea: '2/2/4/5', label: 'ÁREA SECA' },
    { area: areas.find(a => a.type === 'CAMARA_RESFRIADA')!, gridArea: '4/1/6/2', label: 'CÂMARA RESFR.' },
    { area: areas.find(a => a.type === 'AREA_FLV')!, gridArea: '4/2/6/5', label: 'ÁREA FLV' },
    { area: areas.find(a => a.type === 'AREA_SEPARACAO')!, gridArea: '6/1/7/5', label: 'ÁREA DE SEPARAÇÃO' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Logística Interna & Picking</h1>
          <p className="text-xs text-muted-foreground">Centro de Distribuição · {serviceOrders.filter(o => o.status === 'ABERTA' || o.status === 'EM_ANDAMENTO').length} OS ativas</p>
        </div>
        <Button size="sm" className="h-7 text-xs" onClick={() => setNewOsModal(true)}>
          <Plus className="h-3 w-3 mr-1" /> Nova OS
        </Button>
      </div>

      {/* CD MAP */}
      <Card>
        <CardHeader className="pb-1 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-1"><MapPin className="h-4 w-4" /> Mapa do Centro de Distribuição</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-rows-[auto_1fr_1fr_1fr_1fr_auto] grid-cols-4 gap-1.5 max-w-2xl mx-auto" style={{ minHeight: 280 }}>
            {mapAreas.map(({ area, gridArea, label }) => (
              <Tooltip key={area.id}>
                <TooltipTrigger asChild>
                  <div
                    className={cn('border-2 rounded-md p-2 cursor-pointer transition-all hover:scale-[1.02]', occupancyColor(area.occupancyPercent))}
                    style={{ gridArea }}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider">{label}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-sm font-bold', occupancyText(area.occupancyPercent))}>{area.occupancyPercent}%</span>
                      {area.temperature !== undefined && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Thermometer className="h-3 w-3" />{area.temperature}°C
                        </span>
                      )}
                      {area.activeAlerts > 0 && (
                        <Badge className="bg-destructive/20 text-destructive border-0 text-[9px] px-1">{area.activeAlerts} ⚠</Badge>
                      )}
                    </div>
                    {area.corridors.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {area.corridors.map(c => (
                          <span key={c} className="text-[9px] bg-muted px-1 rounded">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="space-y-0.5">
                    <div className="font-medium">{area.name}</div>
                    <div>Ocupação: {area.occupancyPercent}%</div>
                    {area.temperature !== undefined && <div>Temperatura: {area.temperature}°C (alvo: {area.targetTemp}°C)</div>}
                    <div>Alertas: {area.activeAlerts}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SERVICE ORDERS */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Ordens de Serviço Internas</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar OS..." className="pl-7 h-7 text-xs w-36" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos Tipos</SelectItem>
                  {Object.entries(soTypeConfig).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead className="h-8">OS#</TableHead>
                  <TableHead className="h-8">Tipo</TableHead>
                  <TableHead className="h-8">Prioridade</TableHead>
                  <TableHead className="h-8 text-center">SKUs</TableHead>
                  <TableHead className="h-8">Origem</TableHead>
                  <TableHead className="h-8">Destino</TableHead>
                  <TableHead className="h-8">Operador</TableHead>
                  <TableHead className="h-8">Prazo</TableHead>
                  <TableHead className="h-8">Status</TableHead>
                  <TableHead className="h-8">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(order => {
                  const tCfg = soTypeConfig[order.type];
                  const pCfg = priorityConfig[order.priority];
                  const sCfg = statusConfig[order.status];
                  const Icon = tCfg.icon;
                  const hoursLeft = differenceInHours(order.deadline, new Date());
                  return (
                    <TableRow key={order.id} className={cn('text-xs', order.priority === 'URGENTE' && order.status !== 'CONCLUIDA' && 'bg-destructive/5')}>
                      <TableCell className="py-1.5 font-mono text-[11px]">{order.number}</TableCell>
                      <TableCell className="py-1.5">
                        <Badge className={cn('text-[10px] border-0 gap-0.5', tCfg.color)}><Icon className="h-3 w-3" />{tCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="py-1.5"><Badge className={cn('text-[10px] border-0', pCfg.color)}>{pCfg.label}</Badge></TableCell>
                      <TableCell className="py-1.5 text-center">{order.skuIds.length}</TableCell>
                      <TableCell className="py-1.5 text-[11px]">{order.origin}</TableCell>
                      <TableCell className="py-1.5 text-[11px]">{order.destination}</TableCell>
                      <TableCell className="py-1.5">{order.operator}</TableCell>
                      <TableCell className={cn('py-1.5 font-mono text-[11px]', hoursLeft < 2 && order.status !== 'CONCLUIDA' ? 'text-destructive' : 'text-muted-foreground')}>
                        {hoursLeft > 0 ? `${hoursLeft}h` : 'Vencido'}
                      </TableCell>
                      <TableCell className="py-1.5"><Badge className={cn('text-[10px] border-0', sCfg.color)}>{sCfg.label}</Badge></TableCell>
                      <TableCell className="py-1.5">
                        {order.type === 'SEPARACAO' && order.items && order.status !== 'CONCLUIDA' && (
                          <Button variant="outline" size="sm" className="h-5 text-[10px]" onClick={() => openPicking(order)}>
                            <Scan className="h-3 w-3 mr-0.5" /> Picking
                          </Button>
                        )}
                        {order.status === 'ABERTA' && (
                          <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={() => { updateServiceOrder(order.id, { status: 'EM_ANDAMENTO' }); toast({ title: `${order.number} iniciada` }); }}>
                            Iniciar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* REPLENISHMENT */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-1"><RefreshCw className="h-4 w-4" /> Sugestões de Reabastecimento</CardTitle>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={selectedReplen.size === 0} onClick={generateReplenOs}>
                Gerar OS Selecionadas ({selectedReplen.size})
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={() => { toast({ title: `${replenishmentSuggestions.length} OS geradas` }); }}>
                Gerar Todas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="h-8 w-8"></TableHead>
                <TableHead className="h-8">SKU</TableHead>
                <TableHead className="h-8">Produto</TableHead>
                <TableHead className="h-8">Bin Atual</TableHead>
                <TableHead className="h-8 text-center">Qtd Atual</TableHead>
                <TableHead className="h-8 text-center">Mínima</TableHead>
                <TableHead className="h-8 text-center">Sugerida</TableHead>
                <TableHead className="h-8">Origem</TableHead>
                <TableHead className="h-8">Urgência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {replenishmentSuggestions.map(r => (
                <TableRow key={r.id} className="text-xs">
                  <TableCell className="py-1.5">
                    <Checkbox checked={selectedReplen.has(r.id)} onCheckedChange={c => {
                      const next = new Set(selectedReplen);
                      c ? next.add(r.id) : next.delete(r.id);
                      setSelectedReplen(next);
                    }} />
                  </TableCell>
                  <TableCell className="py-1.5 font-mono text-[11px]">{r.skuId}</TableCell>
                  <TableCell className="py-1.5 max-w-[140px] truncate">{r.skuName}</TableCell>
                  <TableCell className="py-1.5 font-mono text-[11px]">{r.currentBin}</TableCell>
                  <TableCell className={cn('py-1.5 text-center font-mono font-bold', r.currentQty <= 3 ? 'text-destructive' : 'text-amber-500')}>{r.currentQty}</TableCell>
                  <TableCell className="py-1.5 text-center font-mono text-muted-foreground">{r.minQty}</TableCell>
                  <TableCell className="py-1.5 text-center font-mono font-semibold text-emerald-500">{r.suggestedQty}</TableCell>
                  <TableCell className="py-1.5 font-mono text-[11px] text-muted-foreground">{r.sourceLocation}</TableCell>
                  <TableCell className="py-1.5">
                    <Badge className={cn('text-[10px] border-0', r.urgency === 'ALTA' ? 'bg-destructive/20 text-destructive' : r.urgency === 'MEDIA' ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground')}>{r.urgency}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CYCLE COUNT */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-1"><Calendar className="h-4 w-4" /> Inventário Cíclico — Programação Semanal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="h-8">Data</TableHead>
                <TableHead className="h-8">Área</TableHead>
                <TableHead className="h-8">Corredor</TableHead>
                <TableHead className="h-8 text-center">Bins</TableHead>
                <TableHead className="h-8">Responsável</TableHead>
                <TableHead className="h-8 text-center">Diverg.</TableHead>
                <TableHead className="h-8">Status</TableHead>
                <TableHead className="h-8">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycleCountSchedules.map(cc => {
                const isToday_ = isToday(cc.scheduledDate);
                const isTomorrow_ = isTomorrow(cc.scheduledDate);
                return (
                  <TableRow key={cc.id} className={cn('text-xs', isToday_ && 'bg-primary/5')}>
                    <TableCell className="py-1.5 font-mono text-[11px]">
                      {isToday_ ? <Badge className="bg-primary/20 text-primary border-0 text-[10px]">HOJE</Badge> : isTomorrow_ ? 'Amanhã' : format(cc.scheduledDate, 'EEE dd/MM', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="py-1.5">{cc.area}</TableCell>
                    <TableCell className="py-1.5 font-mono">{cc.corridor}</TableCell>
                    <TableCell className="py-1.5 text-center">{cc.binsCount}</TableCell>
                    <TableCell className="py-1.5">{cc.assignedTo || '—'}</TableCell>
                    <TableCell className="py-1.5 text-center">
                      {cc.divergences !== undefined ? (
                        <Badge className={cn('text-[10px] border-0', cc.divergences > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400')}>{cc.divergences}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge className={cn('text-[10px] border-0',
                        cc.status === 'CONCLUIDO' ? 'bg-emerald-500/20 text-emerald-400' :
                        cc.status === 'EM_ANDAMENTO' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-muted text-muted-foreground'
                      )}>{cc.status}</Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      {cc.status === 'PENDENTE' && isToday_ && (
                        <Button variant="outline" size="sm" className="h-5 text-[10px]" onClick={() => { updateCycleCount(cc.id, { status: 'EM_ANDAMENTO', assignedTo: 'Carlos Silva' }); toast({ title: 'Contagem iniciada', description: `${cc.area} — ${cc.corridor}` }); }}>
                          Iniciar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PICKING MODAL */}
      <Dialog open={!!pickingOrder} onOpenChange={(v) => !v && setPickingOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Scan className="h-4 w-4" /> Picking — {pickingOrder?.number}
              <Badge variant="outline" className="text-[10px] ml-2">{pickingOrder?.operator}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {pickingItems.filter(i => i.status !== 'pending').length} de {pickingItems.length} itens
            </span>
            <Progress value={pickingProgress} className="w-48 h-2" />
          </div>

          {pickingDone ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <div className="text-lg font-bold">Separação Completa!</div>
              <div className="text-xs text-muted-foreground">
                {pickingItems.filter(i => i.status === 'collected').length} itens coletados ·
                {pickingItems.filter(i => i.status === 'problem').length} problemas reportados
              </div>
              <Button onClick={completePicking} className="mt-4">Finalizar Separação</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {pickingItems.map((item, idx) => (
                <div key={idx} className={cn(
                  'border rounded-lg p-3 transition-all',
                  item.status === 'collected' && 'bg-emerald-500/5 border-emerald-500/30 opacity-60',
                  item.status === 'problem' && 'bg-destructive/5 border-destructive/30 opacity-60',
                )}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-bold font-mono text-primary">[{item.location}]</div>
                      <div className="text-xs font-medium mt-0.5">{item.skuName}</div>
                      {item.lot && <div className="text-[10px] text-muted-foreground">Lote: {item.lot} · Val: {item.expiry}</div>}
                    </div>
                    {item.status === 'collected' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    {item.status === 'problem' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="text-xs text-muted-foreground">Solicitado: <span className="font-bold text-foreground">{item.requestedQty} UN</span></div>
                    {item.status === 'pending' && (
                      <>
                        <Input
                          type="number" min={0} placeholder="Qtd"
                          className="h-9 w-24 text-center text-base font-mono font-bold"
                          onKeyDown={e => { if (e.key === 'Enter') updatePickingItem(idx, parseInt((e.target as HTMLInputElement).value) || 0); }}
                        />
                        <Button size="sm" className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => updatePickingItem(idx, item.requestedQty)}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 text-xs text-destructive" onClick={() => reportProblem(idx, 'Produto não encontrado na localização')}>
                          Problema
                        </Button>
                      </>
                    )}
                    {item.status === 'collected' && <span className="text-xs text-emerald-500 font-mono">✓ {item.collectedQty} coletados</span>}
                    {item.status === 'problem' && <span className="text-xs text-destructive">{item.problemNote}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NEW OS MODAL */}
      <Dialog open={newOsModal} onOpenChange={setNewOsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">Nova Ordem de Serviço</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select defaultValue="REABASTECIMENTO">
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(soTypeConfig).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Origem</Label>
                <Input placeholder="Área de origem" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Destino</Label>
                <Input placeholder="Área de destino" className="h-8 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Operador</Label>
                <Select>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {['Marcos Pereira', 'Luciana Santos', 'Fernando Gomes', 'Patricia Lima', 'Ricardo Souza', 'Camila Alves'].map(n => <SelectItem key={n} value={n} className="text-xs">{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Prioridade</Label>
                <Select defaultValue="NORMAL">
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewOsModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => { toast({ title: 'OS criada' }); setNewOsModal(false); }}>Criar OS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
