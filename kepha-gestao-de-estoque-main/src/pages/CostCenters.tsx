import { useState, useMemo, useCallback } from 'react';
import { CostEntity, AllocationRule, AllocationMethod, CostEntry, ConsolidationRow } from '@/types';
import { costEntities, allocationRules, costEntries, consolidationRows } from '@/data/costCenterData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Building2, ChevronRight, ChevronDown, Plus, Settings, Play, Pause,
  TrendingUp, TrendingDown, DollarSign, Percent, BarChart3,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, Cell,
} from 'recharts';

const methodLabels: Record<AllocationMethod, string> = {
  PERCENTUAL_FIXO: 'Percentual Fixo',
  PROPORCIONAL_RECEITA: 'Proporcional à Receita',
  PROPORCIONAL_AREA: 'Proporcional à Área (m²)',
  PROPORCIONAL_HEADCOUNT: 'Proporcional ao Headcount',
  PROPORCIONAL_CONSUMO: 'Proporcional ao Consumo',
};

function fmtBRL(v: number) {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
  return `R$ ${v.toLocaleString('pt-BR')}`;
}

function fmtFull(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// ==================== COMPONENT ====================

export default function CostCenters() {
  const { toast } = useToast();

  const [selectedEntityId, setSelectedEntityId] = useState('GRP001');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['GRP001', 'EMP001', 'UNI001']));
  const [viewMode, setViewMode] = useState<'individual' | 'consolidated'>('individual');
  const [dimension, setDimension] = useState<'entity' | 'unit' | 'cost_center'>('entity');
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [rules, setRules] = useState(allocationRules);

  // New entry state
  const [newEntry, setNewEntry] = useState({ description: '', value: '', supplier: '', autoAlloc: true });
  const [manualAllocs, setManualAllocs] = useState<{ entityId: string; entityName: string; percent: number }[]>([]);

  // New rule state
  const [newRule, setNewRule] = useState({ name: '', accountOrigin: '', method: 'PERCENTUAL_FIXO' as AllocationMethod, periodicity: 'MENSAL' as 'MENSAL' | 'SEMANAL' | 'POR_LANCAMENTO' });

  const selectedEntity = useMemo(() => costEntities.find(e => e.id === selectedEntityId), [selectedEntityId]);

  const getChildren = useCallback((parentId: string) =>
    costEntities.filter(e => e.parentId === parentId), []);

  const toggleNode = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Waterfall data
  const waterfallData = useMemo(() => {
    if (!selectedEntity) return [];
    return [
      { name: 'Receita', value: selectedEntity.revenue, fill: 'hsl(var(--primary))' },
      { name: '(-) Custos Diretos', value: -selectedEntity.directCosts, fill: 'hsl(var(--destructive))' },
      { name: '(-) Custos Rateados', value: -selectedEntity.allocatedCosts, fill: '#f59e0b' },
      { name: 'Resultado', value: selectedEntity.result, fill: selectedEntity.result >= 0 ? '#22c55e' : 'hsl(var(--destructive))' },
    ];
  }, [selectedEntity]);

  // Profitability by dimension
  const profitabilityData = useMemo(() => {
    const typeFilter = dimension === 'entity' ? 'COMPANY' : dimension === 'unit' ? 'UNIT' : 'COST_CENTER';
    return costEntities
      .filter(e => e.type === typeFilter)
      .sort((a, b) => b.margin - a.margin)
      .map(e => ({
        name: e.name,
        revenue: e.revenue,
        directCosts: e.directCosts,
        allocatedCosts: e.allocatedCosts,
        margin: e.margin,
        result: e.result,
      }));
  }, [dimension]);

  // Cost center list for manual allocation
  const costCenterList = useMemo(() =>
    costEntities.filter(e => e.type === 'COST_CENTER'), []);

  const allocTotal = manualAllocs.reduce((s, a) => s + a.percent, 0);

  // ===== TREE RENDERER =====
  const renderTreeNode = (entity: CostEntity, depth = 0) => {
    const children = getChildren(entity.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(entity.id);
    const isSelected = selectedEntityId === entity.id;

    return (
      <div key={entity.id}>
        <div
          className={cn(
            'flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-all text-xs',
            isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-accent/50 text-foreground',
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setSelectedEntityId(entity.id)}
        >
          {hasChildren ? (
            <button onClick={(e) => { e.stopPropagation(); toggleNode(entity.id); }} className="p-0.5">
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : <span className="w-4" />}
          <span>{entity.icon}</span>
          <span className="flex-1 truncate">{entity.name}</span>
          <Badge className={cn(
            'text-[9px] px-1 font-mono',
            entity.result >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive'
          )}>
            {entity.result >= 0 ? '+' : ''}{fmtBRL(entity.result)}
          </Badge>
        </div>
        {hasChildren && isExpanded && children.map(c => renderTreeNode(c, depth + 1))}
      </div>
    );
  };

  const rootEntities = costEntities.filter(e => !e.parentId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Centros de Custo & Rateio</h1>
          <p className="text-xs text-muted-foreground">Gestão de entidades, rateios e consolidação</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-secondary rounded-md p-1">
            <Button
              variant={viewMode === 'individual' ? 'default' : 'ghost'}
              size="sm" className="text-xs h-7"
              onClick={() => setViewMode('individual')}
            >Individual</Button>
            <Button
              variant={viewMode === 'consolidated' ? 'default' : 'ghost'}
              size="sm" className="text-xs h-7"
              onClick={() => setViewMode('consolidated')}
            >Consolidada</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        {/* ===== LEFT SIDEBAR: ENTITY TREE ===== */}
        <div className="col-span-3">
          <Card className="bg-card border-border">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entidades</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 px-1.5" onClick={() => toast({ title: 'Em desenvolvimento' })}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-1">
              <ScrollArea className="h-[calc(100vh-220px)]">
                {rootEntities.map(e => renderTreeNode(e))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="col-span-9 space-y-4">
          {viewMode === 'individual' ? (
            <>
              {/* KPI Cards */}
              {selectedEntity && (
                <>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: 'Receita', value: selectedEntity.revenue, icon: DollarSign, color: 'text-primary' },
                      { label: 'Custos Diretos', value: selectedEntity.directCosts, icon: TrendingDown, color: 'text-destructive' },
                      { label: 'Custos Rateados', value: selectedEntity.allocatedCosts, icon: ArrowRight, color: 'text-amber-500' },
                      { label: 'Resultado', value: selectedEntity.result, icon: TrendingUp, color: selectedEntity.result >= 0 ? 'text-emerald-500' : 'text-destructive' },
                      { label: 'Margem', value: selectedEntity.margin, icon: Percent, color: selectedEntity.margin >= 30 ? 'text-emerald-500' : 'text-amber-500', isMarg: true },
                    ].map((kpi, i) => {
                      const Icon = kpi.icon;
                      return (
                        <Card key={i} className="bg-card border-border">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <Icon className={cn('h-3.5 w-3.5', kpi.color)} />
                            </div>
                            <p className={cn('text-lg font-mono font-bold', kpi.color)}>
                              {(kpi as any).isMarg ? `${kpi.value}%` : fmtBRL(kpi.value)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Waterfall */}
                  <Card className="bg-card border-border">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Cascata de Resultado — {selectedEntity.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={waterfallData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => fmtBRL(v)} />
                          <RechartsTooltip
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }}
                            formatter={(v: number) => [fmtFull(Math.abs(v)), 'Valor']}
                          />
                          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                            {waterfallData.map((d, i) => (
                              <Cell key={i} fill={d.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* ALLOCATION RULES */}
              <Card className="bg-card border-border">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Regras de Rateio Automático</CardTitle>
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setRuleModalOpen(true)}>
                      <Plus className="h-3 w-3" /> Nova Regra
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {rules.map(rule => (
                      <Card key={rule.id} className={cn('border', rule.active ? 'border-border' : 'border-border opacity-50')}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">💡</span>
                              <span className="text-xs font-semibold text-foreground">{rule.name}</span>
                            </div>
                            <Badge className="text-[9px] bg-secondary text-muted-foreground">{methodLabels[rule.method]}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-2">Origem: {rule.accountOrigin}</p>
                          <div className="space-y-1">
                            {rule.destinations.map((d, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground w-24 truncate">• {d.entityName}</span>
                                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                  <div className="h-full bg-primary/60 rounded-full" style={{ width: `${d.percent}%` }} />
                                </div>
                                <span className="text-[10px] font-mono text-foreground w-8 text-right">{d.percent}%</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]">Editar</Button>
                            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]">Simular</Button>
                            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => {
                              setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
                            }}>
                              {rule.active ? <><Pause className="h-2.5 w-2.5 mr-0.5" />Desativar</> : <><Play className="h-2.5 w-2.5 mr-0.5" />Ativar</>}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* NEW ENTRY */}
              <Card className="bg-card border-border">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Novo Lançamento com Rateio</CardTitle>
                    <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => {
                      setManualAllocs(costCenterList.slice(0, 3).map((cc, i) => ({
                        entityId: cc.id, entityName: cc.name, percent: i === 2 ? 100 - 45 - 30 : i === 0 ? 45 : 30,
                      })));
                      setEntryModalOpen(true);
                    }}>
                      <Plus className="h-3 w-3" /> Novo Lançamento
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* PROFITABILITY */}
              <Card className="bg-card border-border">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Rentabilidade por Dimensão
                    </CardTitle>
                    <div className="flex gap-1">
                      {(['entity', 'unit', 'cost_center'] as const).map(d => (
                        <Button key={d} variant={dimension === d ? 'default' : 'outline'} size="sm" className="text-[10px] h-6 px-2"
                          onClick={() => setDimension(d)}>
                          {d === 'entity' ? 'Entidade' : d === 'unit' ? 'Unidade' : 'Centro de Custo'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <ResponsiveContainer width="100%" height={Math.max(180, profitabilityData.length * 35)}>
                    <BarChart data={profitabilityData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => fmtBRL(v)} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={120} />
                      <RechartsTooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }}
                        formatter={(v: number) => [fmtFull(v), '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Receita" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="directCosts" fill="hsl(var(--destructive))" name="Custos Diretos" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="allocatedCosts" fill="#f59e0b" name="Custos Rateados" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            /* ===== CONSOLIDATED VIEW ===== */
            <Card className="bg-card border-border">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm">Visão Consolidada do Grupo</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-[10px] h-8">Conta</TableHead>
                        <TableHead className="text-[10px] h-8 text-right">Atacadão SP</TableHead>
                        <TableHead className="text-[10px] h-8 text-right">Fort PR</TableHead>
                        <TableHead className="text-[10px] h-8 text-right">Pessoal</TableHead>
                        <TableHead className="text-[10px] h-8 text-right">Eliminações</TableHead>
                        <TableHead className="text-[10px] h-8 text-right font-bold">TOTAL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consolidationRows.map((row, i) => (
                        <TableRow key={i} className={cn(
                          'border-border',
                          row.isIntercompany && 'bg-primary/5',
                          row.account === 'EBITDA' && 'font-bold bg-secondary/50'
                        )}>
                          <TableCell className={cn('text-xs py-1.5', row.isIntercompany && 'text-primary')}>
                            {row.isIntercompany && '🔗 '}{row.account}
                          </TableCell>
                          {['Atacadão SP', 'Fort PR', 'Pessoal'].map(key => (
                            <TableCell key={key} className={cn('text-xs py-1.5 text-right font-mono', row.values[key] < 0 && 'text-destructive')}>
                              {fmtBRL(row.values[key])}
                            </TableCell>
                          ))}
                          <TableCell className={cn('text-xs py-1.5 text-right font-mono', row.eliminations !== 0 && 'text-amber-500')}>
                            {row.eliminations !== 0 ? fmtBRL(row.eliminations) : '—'}
                          </TableCell>
                          <TableCell className={cn('text-xs py-1.5 text-right font-mono font-bold', row.total < 0 && 'text-destructive')}>
                            {fmtBRL(row.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ===== NEW RULE MODAL ===== */}
      <Dialog open={ruleModalOpen} onOpenChange={setRuleModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Nova Regra de Rateio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome da Regra</Label>
                <Input className="h-8 text-xs mt-1" value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Energia Elétrica" />
              </div>
              <div>
                <Label className="text-xs">Conta Contábil de Origem</Label>
                <Input className="h-8 text-xs mt-1" value={newRule.accountOrigin} onChange={e => setNewRule(p => ({ ...p, accountOrigin: e.target.value }))} placeholder="Ex: Custos Gerais" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Método de Rateio</Label>
                <Select value={newRule.method} onValueChange={v => setNewRule(p => ({ ...p, method: v as AllocationMethod }))}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(methodLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Periodicidade</Label>
                <Select value={newRule.periodicity} onValueChange={v => setNewRule(p => ({ ...p, periodicity: v as any }))}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MENSAL" className="text-xs">Mensal</SelectItem>
                    <SelectItem value="SEMANAL" className="text-xs">Semanal</SelectItem>
                    <SelectItem value="POR_LANCAMENTO" className="text-xs">Por Lançamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setRuleModalOpen(false)}>Cancelar</Button>
            <Button size="sm" className="text-xs" onClick={() => {
              toast({ title: 'Regra criada com sucesso' });
              setRuleModalOpen(false);
            }}>Criar Regra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== NEW ENTRY MODAL ===== */}
      <Dialog open={entryModalOpen} onOpenChange={setEntryModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Novo Lançamento com Rateio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input className="h-8 text-xs mt-1" value={newEntry.description} onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Valor (R$)</Label>
                <Input className="h-8 text-xs mt-1" type="number" value={newEntry.value} onChange={e => setNewEntry(p => ({ ...p, value: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Fornecedor</Label>
              <Input className="h-8 text-xs mt-1" value={newEntry.supplier} onChange={e => setNewEntry(p => ({ ...p, supplier: e.target.value }))} />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={!newEntry.autoAlloc} onCheckedChange={v => setNewEntry(p => ({ ...p, autoAlloc: !v }))} />
              <Label className="text-xs">Rateio manual</Label>
            </div>

            {!newEntry.autoAlloc && (
              <div className="space-y-2">
                {/* Distribution bar */}
                <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                  {manualAllocs.map((a, i) => (
                    <div key={i} className="h-full" style={{
                      width: `${a.percent}%`,
                      backgroundColor: ['hsl(var(--primary))', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'][i % 5],
                    }} />
                  ))}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-[10px] h-7">Centro de Custo</TableHead>
                      <TableHead className="text-[10px] h-7 w-20 text-center">%</TableHead>
                      <TableHead className="text-[10px] h-7 w-24 text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualAllocs.map((a, i) => {
                      const val = parseFloat(newEntry.value) || 0;
                      return (
                        <TableRow key={i} className="border-border">
                          <TableCell className="text-xs py-1">{a.entityName}</TableCell>
                          <TableCell className="py-1">
                            <Input
                              className="h-6 text-xs text-center w-16"
                              type="number"
                              value={a.percent}
                              onChange={e => {
                                const v = parseInt(e.target.value) || 0;
                                setManualAllocs(prev => prev.map((x, j) => j === i ? { ...x, percent: v } : x));
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-xs py-1 text-right font-mono">
                            R$ {(val * a.percent / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-border">
                      <TableCell className="text-xs py-1 font-bold">TOTAL</TableCell>
                      <TableCell className={cn('text-xs py-1 text-center font-bold', allocTotal === 100 ? 'text-emerald-500' : 'text-destructive')}>
                        {allocTotal}%
                      </TableCell>
                      <TableCell className="text-xs py-1 text-right font-mono font-bold">
                        R$ {(parseFloat(newEntry.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                {allocTotal !== 100 && (
                  <p className="text-[10px] text-destructive">Total deve ser exatamente 100%</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setEntryModalOpen(false)}>Cancelar</Button>
            <Button size="sm" className="text-xs" disabled={!newEntry.autoAlloc && allocTotal !== 100} onClick={() => {
              toast({ title: 'Lançamento registrado com sucesso' });
              setEntryModalOpen(false);
            }}>Lançar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
