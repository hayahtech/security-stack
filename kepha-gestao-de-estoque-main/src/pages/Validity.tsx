import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Batch, BatchCategory, LossReason } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, Search, Download, CalendarClock, Package, Truck,
  MapPin, ArrowRightLeft, Tag, Trash2, PercentIcon, ShoppingCart,
  Clock, TrendingDown, CheckCircle2, XCircle,
} from 'lucide-react';
import { format, differenceInDays, startOfWeek, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const allCategories: BatchCategory[] = ['Alimentos', 'Frios', 'Laticínios', 'Bebidas', 'Limpeza', 'FLV', 'Padaria'];
const lossReasonLabels: Record<LossReason, string> = {
  VENCIMENTO: 'Vencimento', AVARIA: 'Avaria', FURTO: 'Furto',
  ERRO_OPERACIONAL: 'Erro Operacional', PRODUTO_IMPROPRIO: 'Produto Impróprio',
};

function daysRemaining(batch: Batch) {
  return differenceInDays(batch.expiryDate, new Date());
}

function daysColor(days: number) {
  if (days < 0) return 'text-destructive';
  if (days <= 3) return 'text-red-500 font-bold';
  if (days <= 7) return 'text-orange-500 font-semibold';
  if (days <= 15) return 'text-amber-500';
  return 'text-emerald-500';
}

function statusBadge(status: Batch['status']) {
  const map: Record<Batch['status'], { label: string; color: string }> = {
    NORMAL: { label: 'Normal', color: 'bg-emerald-500/20 text-emerald-400' },
    ATENCAO: { label: 'Atenção', color: 'bg-amber-500/20 text-amber-400' },
    CRITICO: { label: 'Crítico', color: 'bg-orange-500/20 text-orange-400' },
    VENCIDO: { label: 'Vencido', color: 'bg-destructive/20 text-destructive' },
    BAIXA_REALIZADA: { label: 'Baixa', color: 'bg-muted text-muted-foreground' },
  };
  const c = map[status];
  return <Badge className={cn('text-[10px] border-0', c.color)}>{c.label}</Badge>;
}

export default function Validity() {
  const { batches, batchTraceEvents, lossRecords, warehouses, updateBatch, addLossRecord } = useAppStore();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [whFilter, setWhFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [traceModal, setTraceModal] = useState<Batch | null>(null);
  const [discountModal, setDiscountModal] = useState<Batch | null>(null);
  const [discountPct, setDiscountPct] = useState(30);
  const [lossModal, setLossModal] = useState<Batch | null>(null);
  const [lossReason, setLossReason] = useState<LossReason>('VENCIMENTO');

  const activeBatches = batches.filter(b => b.status !== 'BAIXA_REALIZADA');

  // Dashboard counts
  const expiredToday = activeBatches.filter(b => daysRemaining(b) < 0).length;
  const expiresIn3 = activeBatches.filter(b => { const d = daysRemaining(b); return d >= 0 && d <= 3; }).length;
  const expiresIn7 = activeBatches.filter(b => { const d = daysRemaining(b); return d > 3 && d <= 7; }).length;
  const expiresIn30 = activeBatches.filter(b => { const d = daysRemaining(b); return d > 7 && d <= 30; }).length;

  // Chart data: next 4 weeks
  const chartData = useMemo(() => {
    const now = new Date();
    const weeks = Array.from({ length: 5 }, (_, i) => {
      const weekStart = i === 0 ? now : startOfWeek(addWeeks(now, i), { locale: ptBR });
      const weekEnd = addWeeks(weekStart, 1);
      const inRange = activeBatches.filter(b => b.expiryDate >= weekStart && b.expiryDate < weekEnd);
      const expired = inRange.filter(b => daysRemaining(b) < 0).length;
      const critical = inRange.filter(b => { const d = daysRemaining(b); return d >= 0 && d < 7; }).length;
      const attention = inRange.filter(b => { const d = daysRemaining(b); return d >= 7 && d <= 15; }).length;
      const normal = inRange.filter(b => daysRemaining(b) > 15).length;
      return { name: i === 0 ? 'Esta semana' : `Sem ${i + 1}`, expired, critical, attention, normal, total: inRange.length };
    });
    return weeks;
  }, [activeBatches]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter(b => {
      if (search) {
        const q = search.toLowerCase();
        if (!b.skuName.toLowerCase().includes(q) && !b.lotNumber.toLowerCase().includes(q) && !b.skuId.toLowerCase().includes(q)) return false;
      }
      if (catFilter !== 'all' && b.category !== catFilter) return false;
      if (whFilter !== 'all' && b.warehouseId !== whFilter) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => daysRemaining(a) - daysRemaining(b));
  }, [batches, search, catFilter, whFilter, statusFilter]);

  // FEFO suggestions
  const fefoSuggestions = useMemo(() => {
    const skuGroups: Record<string, Batch[]> = {};
    activeBatches.forEach(b => {
      if (!skuGroups[b.skuId]) skuGroups[b.skuId] = [];
      skuGroups[b.skuId].push(b);
    });
    const suggestions: { skuId: string; skuName: string; priority: Batch; posterior: Batch }[] = [];
    Object.values(skuGroups).forEach(group => {
      if (group.length < 2) return;
      const sorted = [...group].sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());
      if (sorted[0].expiryDate < sorted[1].expiryDate) {
        suggestions.push({ skuId: sorted[0].skuId, skuName: sorted[0].skuName, priority: sorted[0], posterior: sorted[1] });
      }
    });
    return suggestions;
  }, [activeBatches]);

  // Loss stats
  const totalLossValue = lossRecords.reduce((s, l) => s + l.value, 0);
  const totalLossQty = lossRecords.length;
  const categoryLosses = useMemo(() => {
    const map: Record<string, number> = {};
    lossRecords.forEach(l => { map[l.category] = (map[l.category] || 0) + l.value; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [lossRecords]);

  const handleDiscount = () => {
    if (!discountModal) return;
    updateBatch(discountModal.id, { discountApplied: discountPct });
    toast({ title: `Desconto de ${discountPct}% aplicado`, description: `Lote ${discountModal.lotNumber} — ${discountModal.skuName}` });
    setDiscountModal(null);
  };

  const handleLoss = () => {
    if (!lossModal) return;
    addLossRecord({
      id: `LOSS${Date.now()}`, date: new Date(), batchId: lossModal.id, lotNumber: lossModal.lotNumber,
      skuId: lossModal.skuId, skuName: lossModal.skuName, quantity: lossModal.quantity,
      value: lossModal.quantity * 10, reason: lossReason, responsible: 'Carlos Silva', category: lossModal.category,
    });
    updateBatch(lossModal.id, { status: 'BAIXA_REALIZADA' });
    toast({ title: 'Baixa realizada', description: `Lote ${lossModal.lotNumber} descartado — ${lossReasonLabels[lossReason]}` });
    setLossModal(null);
  };

  const traceEvents = traceModal ? batchTraceEvents.filter(e => e.batchId === traceModal.id).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) : [];

  const traceIcon: Record<string, typeof Package> = {
    ORIGEM: Package, RECEBIMENTO: Truck, ARMAZENAMENTO: MapPin, MOVIMENTACAO: ArrowRightLeft, SAIDA: Tag,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Validade & Rastreabilidade</h1>
          <p className="text-xs text-muted-foreground">Controle FEFO · {activeBatches.length} lotes ativos</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Vencidos Hoje', value: expiredToday, color: 'text-destructive', bg: 'bg-destructive/10', icon: XCircle },
          { label: 'Vencem em 3 Dias', value: expiresIn3, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle },
          { label: 'Vencem em 7 Dias', value: expiresIn7, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: CalendarClock },
          { label: 'Vencem em 30 Dias', value: expiresIn30, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={cn('p-1.5 rounded', kpi.bg)}><kpi.icon className={cn('h-4 w-4', kpi.color)} /></div>
                <div>
                  <div className={cn('text-xl font-bold', kpi.color)}>{kpi.value}</div>
                  <div className="text-[10px] text-muted-foreground">{kpi.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm">Distribuição de Vencimentos — Próximas 5 Semanas</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="expired" stackId="a" fill="hsl(0, 84%, 60%)" name="Vencido" />
              <Bar dataKey="critical" stackId="a" fill="hsl(25, 95%, 53%)" name="< 7 dias" />
              <Bar dataKey="attention" stackId="a" fill="hsl(48, 96%, 53%)" name="7-15 dias" />
              <Bar dataKey="normal" stackId="a" fill="hsl(142, 71%, 45%)" name="> 15 dias" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* LOT TABLE */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Gestão de Lotes</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lote, SKU..." className="pl-7 h-7 text-xs w-40" />
              </div>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Categoria</SelectItem>
                  {allCategories.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={whFilter} onValueChange={setWhFilter}>
                <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Armazém</SelectItem>
                  {warehouses.map(w => <SelectItem key={w.id} value={w.id} className="text-xs">{w.city}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Status</SelectItem>
                  <SelectItem value="NORMAL" className="text-xs">Normal</SelectItem>
                  <SelectItem value="ATENCAO" className="text-xs">Atenção</SelectItem>
                  <SelectItem value="CRITICO" className="text-xs">Crítico</SelectItem>
                  <SelectItem value="VENCIDO" className="text-xs">Vencido</SelectItem>
                  <SelectItem value="BAIXA_REALIZADA" className="text-xs">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead className="h-8">Lote</TableHead>
                  <TableHead className="h-8">SKU</TableHead>
                  <TableHead className="h-8">Produto</TableHead>
                  <TableHead className="h-8">Cat.</TableHead>
                  <TableHead className="h-8 text-center">Qtd</TableHead>
                  <TableHead className="h-8">Armazém</TableHead>
                  <TableHead className="h-8">Bin</TableHead>
                  <TableHead className="h-8">Fabricação</TableHead>
                  <TableHead className="h-8">Validade</TableHead>
                  <TableHead className="h-8 text-center">Dias</TableHead>
                  <TableHead className="h-8">Status</TableHead>
                  <TableHead className="h-8">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map(batch => {
                  const days = daysRemaining(batch);
                  return (
                    <TableRow key={batch.id} className={cn('text-xs', days < 0 && 'bg-destructive/5')}>
                      <TableCell className="py-1.5 font-mono text-[11px]">{batch.lotNumber}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px]">{batch.skuId}</TableCell>
                      <TableCell className="py-1.5 max-w-[140px] truncate">{batch.skuName}</TableCell>
                      <TableCell className="py-1.5">{batch.category}</TableCell>
                      <TableCell className="py-1.5 text-center font-mono">{batch.quantity}</TableCell>
                      <TableCell className="py-1.5 text-[11px] truncate max-w-[100px]">{batch.warehouseName}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px]">{batch.binLocation}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px]">{format(batch.manufacturingDate, 'dd/MM/yy')}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px]">{format(batch.expiryDate, 'dd/MM/yy')}</TableCell>
                      <TableCell className={cn('py-1.5 text-center font-mono', daysColor(days))}>
                        {days < 0 ? <Badge className="bg-destructive/20 text-destructive border-0 text-[10px]">VENCIDO</Badge> : days}
                      </TableCell>
                      <TableCell className="py-1.5">{statusBadge(batch.status)}</TableCell>
                      <TableCell className="py-1.5">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => setDiscountModal(batch)} title="Aplicar Desconto">
                            <PercentIcon className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => { toast({ title: 'Transferido para promoção', description: batch.skuName }); }} title="Promoção">
                            <ShoppingCart className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => setLossModal(batch)} title="Realizar Baixa">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => setTraceModal(batch)} title="Rastreabilidade">
                            <ArrowRightLeft className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* FEFO Suggestions */}
      {fefoSuggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-amber-500" /> Sugestões FEFO</CardTitle>
              <Button size="sm" className="h-7 text-xs" onClick={() => toast({ title: 'Sugestões FEFO aplicadas', description: `${fefoSuggestions.length} ordens de picking atualizadas` })}>
                Aplicar Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead className="h-8">SKU</TableHead>
                  <TableHead className="h-8">Produto</TableHead>
                  <TableHead className="h-8">Lote Prioritário</TableHead>
                  <TableHead className="h-8">Validade</TableHead>
                  <TableHead className="h-8 text-center">Qtd</TableHead>
                  <TableHead className="h-8">Lote Posterior</TableHead>
                  <TableHead className="h-8">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fefoSuggestions.map((s, i) => (
                  <TableRow key={i} className="text-xs">
                    <TableCell className="py-1.5 font-mono">{s.skuId}</TableCell>
                    <TableCell className="py-1.5">{s.skuName}</TableCell>
                    <TableCell className="py-1.5 font-mono">{s.priority.lotNumber}</TableCell>
                    <TableCell className={cn('py-1.5 font-mono', daysColor(daysRemaining(s.priority)))}>{format(s.priority.expiryDate, 'dd/MM/yy')}</TableCell>
                    <TableCell className="py-1.5 text-center">{s.priority.quantity}</TableCell>
                    <TableCell className="py-1.5 font-mono text-muted-foreground">{s.posterior.lotNumber}</TableCell>
                    <TableCell className="py-1.5">
                      <Button variant="outline" size="sm" className="h-5 text-[10px]">Reordenar picking</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Loss Report */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-1"><TrendingDown className="h-4 w-4 text-destructive" /> Relatório de Perdas — Mês Atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="border rounded p-2 text-center">
              <div className="text-lg font-bold text-destructive">R$ {totalLossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-muted-foreground">Valor Total de Perdas</div>
            </div>
            <div className="border rounded p-2 text-center">
              <div className="text-lg font-bold">{totalLossQty}</div>
              <div className="text-[10px] text-muted-foreground">Lotes Descartados</div>
            </div>
            <div className="border rounded p-2">
              <div className="text-[10px] text-muted-foreground mb-1">Top Categorias</div>
              {categoryLosses.map(([cat, val]) => (
                <div key={cat} className="flex justify-between text-[11px]">
                  <span>{cat}</span><span className="font-mono text-destructive">R$ {val.toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border rounded p-2 text-center">
              <div className="text-lg font-bold text-amber-500">+12%</div>
              <div className="text-[10px] text-muted-foreground">vs. Mês Anterior</div>
            </div>
          </div>

          <div className="overflow-auto max-h-[250px]">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead className="h-8">Data</TableHead>
                  <TableHead className="h-8">Lote</TableHead>
                  <TableHead className="h-8">SKU</TableHead>
                  <TableHead className="h-8 text-center">Qtd</TableHead>
                  <TableHead className="h-8 text-right">Valor</TableHead>
                  <TableHead className="h-8">Motivo</TableHead>
                  <TableHead className="h-8">Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lossRecords.map(l => (
                  <TableRow key={l.id} className="text-xs">
                    <TableCell className="py-1.5 font-mono">{format(l.date, 'dd/MM/yy')}</TableCell>
                    <TableCell className="py-1.5 font-mono">{l.lotNumber}</TableCell>
                    <TableCell className="py-1.5 truncate max-w-[120px]">{l.skuName}</TableCell>
                    <TableCell className="py-1.5 text-center font-mono">{l.quantity}</TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-destructive">R$ {l.value.toFixed(2)}</TableCell>
                    <TableCell className="py-1.5"><Badge variant="outline" className="text-[10px]">{lossReasonLabels[l.reason]}</Badge></TableCell>
                    <TableCell className="py-1.5">{l.responsible}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* TRACEABILITY MODAL */}
      <Dialog open={!!traceModal} onOpenChange={(v) => !v && setTraceModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Rastreabilidade — Lote {traceModal?.lotNumber}</DialogTitle>
          </DialogHeader>
          {traceModal && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{traceModal.skuName} · {traceModal.category}</div>
              <div className="relative pl-6 space-y-4 border-l-2 border-border ml-3 py-2">
                {traceEvents.map((ev, i) => {
                  const Icon = traceIcon[ev.type] || Package;
                  return (
                    <div key={ev.id} className="relative">
                      <div className="absolute -left-[calc(1.5rem+1px)] top-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <Icon className="h-3 w-3 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{ev.type}</Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">{format(ev.timestamp, 'dd/MM/yy HH:mm')}</span>
                        </div>
                        <div className="text-xs">{ev.description}</div>
                        <div className="text-[10px] text-muted-foreground">Responsável: {ev.user}</div>
                        {ev.details && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(ev.details).map(([k, v]) => (
                              <Badge key={k} variant="secondary" className="text-[10px]">{k}: {v}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DISCOUNT MODAL */}
      <Dialog open={!!discountModal} onOpenChange={(v) => !v && setDiscountModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Aplicar Desconto</DialogTitle>
          </DialogHeader>
          {discountModal && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">{discountModal.skuName} — Lote {discountModal.lotNumber}</div>
              <div className="text-xs">Validade: <span className={cn('font-mono', daysColor(daysRemaining(discountModal)))}>{format(discountModal.expiryDate, 'dd/MM/yyyy')}</span> ({daysRemaining(discountModal)} dias)</div>
              <div className="space-y-1">
                <Label className="text-xs">Desconto sugerido (%)</Label>
                <Input type="number" value={discountPct} onChange={e => setDiscountPct(Number(e.target.value))} min={5} max={90} className="h-8 text-xs" />
              </div>
              <div className="text-[10px] text-muted-foreground">
                {daysRemaining(discountModal) <= 3 ? 'Sugestão: 50% — vencimento iminente' : daysRemaining(discountModal) <= 7 ? 'Sugestão: 30% — atenção' : 'Sugestão: 15% — preventivo'}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDiscountModal(null)}>Cancelar</Button>
            <Button size="sm" onClick={handleDiscount}>Aplicar Desconto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LOSS MODAL */}
      <Dialog open={!!lossModal} onOpenChange={(v) => !v && setLossModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Realizar Baixa</DialogTitle>
          </DialogHeader>
          {lossModal && (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">{lossModal.skuName} — Lote {lossModal.lotNumber} — {lossModal.quantity} un</div>
              <div className="space-y-1">
                <Label className="text-xs">Motivo da Baixa</Label>
                <Select value={lossReason} onValueChange={(v) => setLossReason(v as LossReason)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(lossReasonLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLossModal(null)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={handleLoss}>Confirmar Baixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
