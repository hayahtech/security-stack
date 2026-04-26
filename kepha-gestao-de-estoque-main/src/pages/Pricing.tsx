import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Category, Promotion, PromotionType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Search, TrendingUp, PercentIcon, AlertTriangle, DollarSign,
  Tag, Plus, Upload, CheckCircle2, ArrowUpDown,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const categories: Category[] = ['Eletrônicos', 'Vestuário', 'Casa', 'Alimentos', 'Industrial'];
const catColors: Record<Category, string> = {
  'Eletrônicos': 'hsl(210, 79%, 56%)',
  'Vestuário': 'hsl(280, 65%, 60%)',
  'Casa': 'hsl(142, 71%, 45%)',
  'Alimentos': 'hsl(25, 95%, 53%)',
  'Industrial': 'hsl(48, 96%, 53%)',
};

const promoTypeLabels: Record<PromotionType, string> = {
  PERCENTUAL: 'Percentual', VALOR_FIXO: 'Valor Fixo', LEVE_X_PAGUE_Y: 'Leve X Pague Y',
  COMBO: 'Combo', PRECO_ESPECIAL_ATACADO: 'Atacado Especial',
};

export default function Pricing() {
  const { skus, updateSKU, promotions, marginRules, updateMarginRule, addPromotion } = useAppStore();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [showLowMarginOnly, setShowLowMarginOnly] = useState(false);
  const [editingMarkup, setEditingMarkup] = useState<{ id: string; value: string } | null>(null);
  const [editingRule, setEditingRule] = useState<{ cat: string; field: string; value: string } | null>(null);
  const [promoModal, setPromoModal] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [batchPreview, setBatchPreview] = useState<{ id: string; name: string; oldCost: number; newCost: number; oldPrice: number; newPrice: number; marginOld: number; marginNew: number }[]>([]);

  // New promo state
  const [newPromo, setNewPromo] = useState({ name: '', description: '', type: 'PERCENTUAL' as PromotionType, discount: 10, startDate: '', endDate: '', skuSearch: '' });
  const [selectedPromoSkus, setSelectedPromoSkus] = useState<Set<string>>(new Set());

  // Derived data
  const activeSkus = skus.filter(s => s.status === 'active');

  const avgMargin = useMemo(() => {
    const margins = activeSkus.map(s => ((s.price - s.cost) / s.price) * 100);
    return margins.length ? margins.reduce((a, b) => a + b, 0) / margins.length : 0;
  }, [activeSkus]);

  const marginByCategory = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    activeSkus.forEach(s => {
      if (!map[s.category]) map[s.category] = { total: 0, count: 0 };
      map[s.category].total += ((s.price - s.cost) / s.price) * 100;
      map[s.category].count += 1;
    });
    return Object.entries(map).map(([cat, v]) => ({ category: cat, margin: v.total / v.count }));
  }, [activeSkus]);

  const belowMinMarginCount = useMemo(() => {
    return activeSkus.filter(s => {
      const rule = marginRules.find(r => r.category === s.category);
      if (!rule) return false;
      const margin = ((s.price - s.cost) / s.price) * 100;
      return margin < rule.minMargin;
    }).length;
  }, [activeSkus, marginRules]);

  const activePromoImpact = promotions.filter(p => p.status === 'ATIVA').reduce((s, p) => s + p.marginImpact, 0);

  // Scatter data
  const scatterData = useMemo(() => {
    return activeSkus.map(s => ({
      x: s.salesVolume,
      y: parseFloat(((s.price - s.cost) / s.price * 100).toFixed(1)),
      name: s.name,
      category: s.category,
      id: s.id,
    }));
  }, [activeSkus]);

  // Filtered pricing table
  const filteredSkus = useMemo(() => {
    return activeSkus.filter(s => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
      }
      if (catFilter !== 'all' && s.category !== catFilter) return false;
      if (showLowMarginOnly) {
        const rule = marginRules.find(r => r.category === s.category);
        const margin = ((s.price - s.cost) / s.price) * 100;
        if (rule && margin >= rule.minMargin) return false;
      }
      return true;
    });
  }, [activeSkus, search, catFilter, showLowMarginOnly, marginRules]);

  const handleMarkupSave = useCallback((id: string, newMarkup: number) => {
    const sku = skus.find(s => s.id === id);
    if (!sku) return;
    const newPrice = parseFloat((sku.cost * (1 + newMarkup / 100)).toFixed(2));
    updateSKU(id, { markupPercent: newMarkup, price: newPrice });
    setEditingMarkup(null);
    toast({ title: 'Markup atualizado', description: `${sku.name}: ${newMarkup}% → R$ ${newPrice.toFixed(2)}` });
  }, [skus, updateSKU, toast]);

  const handleApplyDefaultMarkup = (category: Category) => {
    const rule = marginRules.find(r => r.category === category);
    if (!rule) return;
    const catSkus = skus.filter(s => s.category === category && s.status === 'active');
    catSkus.forEach(s => {
      const newPrice = parseFloat((s.cost * (1 + rule.defaultMarkup / 100)).toFixed(2));
      updateSKU(s.id, { markupPercent: rule.defaultMarkup, price: newPrice });
    });
    toast({ title: `Markup padrão aplicado: ${category}`, description: `${catSkus.length} SKUs atualizados com ${rule.defaultMarkup}%` });
  };

  const handleRuleSave = (category: string, field: string, value: number) => {
    updateMarginRule(category, { [field]: value });
    setEditingRule(null);
    toast({ title: 'Regra atualizada', description: `${category} — ${field}: ${value}%` });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Simulate CSV parse
    const preview = skus.slice(0, 8).map(s => {
      const newCost = parseFloat((s.cost * (1 + (Math.random() * 0.1 - 0.05))).toFixed(2));
      const newPrice = parseFloat((newCost * (1 + s.markupPercent / 100)).toFixed(2));
      return {
        id: s.id, name: s.name, oldCost: s.cost, newCost, oldPrice: s.price, newPrice,
        marginOld: ((s.price - s.cost) / s.price) * 100,
        marginNew: ((newPrice - newCost) / newPrice) * 100,
      };
    });
    setBatchPreview(preview);
    setBatchModal(true);
  };

  const handleBatchConfirm = () => {
    batchPreview.forEach(bp => {
      updateSKU(bp.id, { cost: bp.newCost, price: bp.newPrice });
    });
    toast({ title: 'Atualização em lote confirmada', description: `${batchPreview.length} SKUs atualizados` });
    setBatchModal(false);
    setBatchPreview([]);
  };

  const handleCreatePromo = () => {
    if (!newPromo.name || selectedPromoSkus.size === 0) {
      toast({ title: 'Preencha nome e selecione SKUs', variant: 'destructive' });
      return;
    }
    addPromotion({
      id: `PROMO${Date.now()}`, name: newPromo.name, description: newPromo.description,
      type: newPromo.type, discount: newPromo.discount, skuIds: Array.from(selectedPromoSkus),
      startDate: newPromo.startDate ? new Date(newPromo.startDate) : new Date(),
      endDate: newPromo.endDate ? new Date(newPromo.endDate) : new Date(),
      status: 'PROGRAMADA', marginImpact: Math.floor(newPromo.discount * selectedPromoSkus.size * 100),
    });
    toast({ title: 'Promoção criada', description: newPromo.name });
    setPromoModal(false);
    setNewPromo({ name: '', description: '', type: 'PERCENTUAL', discount: 10, startDate: '', endDate: '', skuSearch: '' });
    setSelectedPromoSkus(new Set());
  };

  const promoSkuResults = newPromo.skuSearch ? activeSkus.filter(s => s.name.toLowerCase().includes(newPromo.skuSearch.toLowerCase()) || s.id.toLowerCase().includes(newPromo.skuSearch.toLowerCase())).slice(0, 6) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Precificação & Margens</h1>
          <p className="text-xs text-muted-foreground">Gestão de markup, margens e promoções · {activeSkus.length} SKUs ativos</p>
        </div>
        <div className="flex gap-1.5">
          <label>
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileUpload} />
            <Button variant="outline" size="sm" className="h-7 text-xs" asChild><span><Upload className="h-3 w-3 mr-1" /> Importar Lote</span></Button>
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-emerald-500/10"><TrendingUp className="h-4 w-4 text-emerald-500" /></div>
              <div>
                <div className="text-xl font-bold">{avgMargin.toFixed(1)}%</div>
                <div className="text-[10px] text-muted-foreground">Margem Bruta Média</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[10px] text-muted-foreground mb-1">Margem por Categoria</div>
            <div className="space-y-0.5">
              {marginByCategory.map(mc => (
                <div key={mc.category} className="flex justify-between text-[11px]">
                  <span>{mc.category}</span><span className="font-mono font-medium">{mc.margin.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-destructive/10"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
              <div>
                <div className="text-xl font-bold text-destructive">{belowMinMarginCount}</div>
                <div className="text-[10px] text-muted-foreground">Abaixo da Margem Mín.</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-amber-500/10"><Tag className="h-4 w-4 text-amber-500" /></div>
              <div>
                <div className="text-xl font-bold text-amber-500">R$ {activePromoImpact.toLocaleString('pt-BR')}</div>
                <div className="text-[10px] text-muted-foreground">Impacto Promoções Ativas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scatter Chart */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm">Volume de Vendas × Margem % (por SKU)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="x" name="Volume" tick={{ fontSize: 10 }} className="fill-muted-foreground" label={{ value: 'Volume mensal', position: 'bottom', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="y" name="Margem %" tick={{ fontSize: 10 }} className="fill-muted-foreground" label={{ value: 'Margem %', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}
                formatter={(val: number, name: string) => [name === 'x' ? `${val} un` : `${val}%`, name === 'x' ? 'Volume' : 'Margem']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
              />
              <Scatter data={scatterData}>
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={catColors[entry.category as Category] || '#888'} fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-3 justify-center mt-1">
            {categories.map(c => (
              <div key={c} className="flex items-center gap-1 text-[10px]">
                <div className="w-2 h-2 rounded-full" style={{ background: catColors[c] }} />
                {c}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Table */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Tabela de Precificação</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar SKU..." className="pl-7 h-7 text-xs w-36" />
              </div>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todas</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Switch checked={showLowMarginOnly} onCheckedChange={setShowLowMarginOnly} className="scale-75" />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">Só margem baixa</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[350px]">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead className="h-8">SKU</TableHead>
                  <TableHead className="h-8">Produto</TableHead>
                  <TableHead className="h-8 text-right">Custo</TableHead>
                  <TableHead className="h-8 text-center">Markup %</TableHead>
                  <TableHead className="h-8 text-right">Preço Varejo</TableHead>
                  <TableHead className="h-8 text-right">Preço Atacado</TableHead>
                  <TableHead className="h-8 text-right">Preço Mín.</TableHead>
                  <TableHead className="h-8 text-center">Margem %</TableHead>
                  <TableHead className="h-8 text-right">Concorrente</TableHead>
                  <TableHead className="h-8 text-center">Δ Conc.</TableHead>
                  <TableHead className="h-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSkus.map(sku => {
                  const margin = ((sku.price - sku.cost) / sku.price) * 100;
                  const rule = marginRules.find(r => r.category === sku.category);
                  const delta = ((sku.price - sku.competitorPrice) / sku.competitorPrice) * 100;
                  const isEditing = editingMarkup?.id === sku.id;

                  let pricingStatus = 'OK';
                  let statusColor = 'bg-emerald-500/20 text-emerald-400';
                  if (sku.price <= sku.cost) { pricingStatus = 'ABAIXO CUSTO'; statusColor = 'bg-destructive/20 text-destructive'; }
                  else if (rule && margin < rule.minMargin) { pricingStatus = 'MARGEM BAIXA'; statusColor = 'bg-amber-500/20 text-amber-400'; }
                  const inPromo = promotions.some(p => p.status === 'ATIVA' && p.skuIds.includes(sku.id));
                  if (inPromo) { pricingStatus = 'EM PROMOÇÃO'; statusColor = 'bg-blue-500/20 text-blue-400'; }

                  return (
                    <TableRow key={sku.id} className={cn('text-xs', pricingStatus === 'ABAIXO CUSTO' && 'bg-destructive/5')}>
                      <TableCell className="py-1.5 font-mono text-[11px]">{sku.id}</TableCell>
                      <TableCell className="py-1.5 max-w-[140px] truncate">{sku.name}</TableCell>
                      <TableCell className="py-1.5 text-right font-mono">R$ {sku.cost.toFixed(2)}</TableCell>
                      <TableCell className="py-1.5 text-center">
                        {isEditing ? (
                          <Input
                            autoFocus
                            type="number"
                            defaultValue={editingMarkup.value}
                            className="h-6 w-16 text-xs text-center mx-auto"
                            onKeyDown={e => { if (e.key === 'Enter') handleMarkupSave(sku.id, parseFloat((e.target as HTMLInputElement).value)); if (e.key === 'Escape') setEditingMarkup(null); }}
                            onBlur={e => handleMarkupSave(sku.id, parseFloat(e.target.value))}
                          />
                        ) : (
                          <button className="font-mono hover:text-primary cursor-pointer" onClick={() => setEditingMarkup({ id: sku.id, value: String(sku.markupPercent) })}>
                            {sku.markupPercent.toFixed(1)}%
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono font-medium">R$ {sku.price.toFixed(2)}</TableCell>
                      <TableCell className="py-1.5 text-right font-mono text-muted-foreground">R$ {sku.priceWholesale.toFixed(2)}</TableCell>
                      <TableCell className="py-1.5 text-right font-mono text-muted-foreground">R$ {sku.minPrice.toFixed(2)}</TableCell>
                      <TableCell className={cn('py-1.5 text-center font-mono font-semibold', margin < (rule?.minMargin || 15) ? 'text-destructive' : margin > (rule?.targetMargin || 30) ? 'text-emerald-500' : 'text-amber-500')}>
                        {margin.toFixed(1)}%
                      </TableCell>
                      <TableCell className="py-1.5 text-right font-mono text-muted-foreground">R$ {sku.competitorPrice.toFixed(2)}</TableCell>
                      <TableCell className="py-1.5 text-center">
                        <Badge className={cn('text-[10px] border-0', Math.abs(delta) <= 2 ? 'bg-muted text-muted-foreground' : delta < 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive')}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Badge className={cn('text-[10px] border-0', statusColor)}>{pricingStatus}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Margin Rules */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <CardTitle className="text-sm flex items-center gap-1"><ArrowUpDown className="h-4 w-4" /> Regras de Margem por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="h-8">Categoria</TableHead>
                <TableHead className="h-8 text-center">Margem Mín. %</TableHead>
                <TableHead className="h-8 text-center">Markup Padrão %</TableHead>
                <TableHead className="h-8 text-center">Margem Alvo %</TableHead>
                <TableHead className="h-8 text-center">Tolerância %</TableHead>
                <TableHead className="h-8">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marginRules.map(rule => (
                <TableRow key={rule.category} className="text-xs">
                  <TableCell className="py-1.5 font-medium">{rule.category}</TableCell>
                  {(['minMargin', 'defaultMarkup', 'targetMargin', 'tolerance'] as const).map(field => (
                    <TableCell key={field} className="py-1.5 text-center">
                      {editingRule?.cat === rule.category && editingRule.field === field ? (
                        <Input
                          autoFocus type="number" defaultValue={editingRule.value}
                          className="h-6 w-16 text-xs text-center mx-auto"
                          onKeyDown={e => { if (e.key === 'Enter') handleRuleSave(rule.category, field, parseFloat((e.target as HTMLInputElement).value)); if (e.key === 'Escape') setEditingRule(null); }}
                          onBlur={e => handleRuleSave(rule.category, field, parseFloat(e.target.value))}
                        />
                      ) : (
                        <button className="font-mono hover:text-primary cursor-pointer" onClick={() => setEditingRule({ cat: rule.category, field, value: String(rule[field]) })}>
                          {rule[field]}%
                        </button>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="py-1.5">
                    <Button variant="outline" size="sm" className="h-5 text-[10px]" onClick={() => handleApplyDefaultMarkup(rule.category as Category)}>
                      Aplicar Markup
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Promotions */}
      <Card>
        <CardHeader className="pb-2 px-4 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-1"><Tag className="h-4 w-4" /> Promoções Ativas e Programadas</CardTitle>
            <Button size="sm" className="h-7 text-xs" onClick={() => setPromoModal(true)}>
              <Plus className="h-3 w-3 mr-1" /> Nova Promoção
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {promotions.map(promo => {
              const daysLeft = differenceInDays(promo.endDate, new Date());
              const statusColor = promo.status === 'ATIVA' ? 'bg-emerald-500/20 text-emerald-400' : promo.status === 'PROGRAMADA' ? 'bg-blue-500/20 text-blue-400' : 'bg-muted text-muted-foreground';
              return (
                <Card key={promo.id} className="border">
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{promo.name}</span>
                      <Badge className={cn('text-[10px] border-0', statusColor)}>{promo.status}</Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{promo.description}</div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <Badge variant="outline" className="text-[10px]">{promoTypeLabels[promo.type]}</Badge>
                      <span className="font-mono">{promo.discount}%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {format(promo.startDate, 'dd/MM')} — {format(promo.endDate, 'dd/MM')}
                      {daysLeft > 0 && <span className="ml-1 text-primary">({daysLeft}d restantes)</span>}
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>{promo.skuIds.length} SKUs</span>
                      <span className="text-destructive font-mono">-R$ {promo.marginImpact.toLocaleString('pt-BR')}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* New Promo Modal */}
      <Dialog open={promoModal} onOpenChange={setPromoModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">Nova Promoção</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome *</Label>
                <Input value={newPromo.name} onChange={e => setNewPromo(p => ({ ...p, name: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={newPromo.type} onValueChange={v => setNewPromo(p => ({ ...p, type: v as PromotionType }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(promoTypeLabels).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descrição</Label>
              <Textarea value={newPromo.description} onChange={e => setNewPromo(p => ({ ...p, description: e.target.value }))} rows={2} className="text-xs" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Desconto %</Label>
                <Input type="number" value={newPromo.discount} onChange={e => setNewPromo(p => ({ ...p, discount: Number(e.target.value) }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Início</Label>
                <Input type="date" value={newPromo.startDate} onChange={e => setNewPromo(p => ({ ...p, startDate: e.target.value }))} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fim</Label>
                <Input type="date" value={newPromo.endDate} onChange={e => setNewPromo(p => ({ ...p, endDate: e.target.value }))} className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SKUs ({selectedPromoSkus.size} selecionados)</Label>
              <Input value={newPromo.skuSearch} onChange={e => setNewPromo(p => ({ ...p, skuSearch: e.target.value }))} placeholder="Buscar SKU..." className="h-8 text-xs" />
              {promoSkuResults.length > 0 && (
                <div className="border rounded max-h-32 overflow-y-auto">
                  {promoSkuResults.map(s => (
                    <label key={s.id} className="flex items-center gap-2 px-2 py-1 hover:bg-muted/50 cursor-pointer text-xs">
                      <Checkbox checked={selectedPromoSkus.has(s.id)} onCheckedChange={c => {
                        const next = new Set(selectedPromoSkus);
                        c ? next.add(s.id) : next.delete(s.id);
                        setSelectedPromoSkus(next);
                      }} />
                      <span className="font-mono text-[10px]">{s.id}</span>
                      <span className="truncate">{s.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedPromoSkus.size > 0 && (
              <div className="border rounded p-2 bg-muted/30">
                <div className="text-[10px] text-muted-foreground">Impacto estimado na margem</div>
                <div className="text-sm font-bold text-destructive">-R$ {(newPromo.discount * selectedPromoSkus.size * 100).toLocaleString('pt-BR')}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPromoModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreatePromo}>Criar Promoção</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Update Modal */}
      <Dialog open={batchModal} onOpenChange={setBatchModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">Preview de Atualização em Lote</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="h-8">SKU</TableHead>
                <TableHead className="h-8">Produto</TableHead>
                <TableHead className="h-8 text-right">Custo Atual</TableHead>
                <TableHead className="h-8 text-right">Novo Custo</TableHead>
                <TableHead className="h-8 text-right">Preço Atual</TableHead>
                <TableHead className="h-8 text-right">Novo Preço</TableHead>
                <TableHead className="h-8 text-center">Margem</TableHead>
                <TableHead className="h-8">Impacto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchPreview.map(bp => {
                const marginDelta = bp.marginNew - bp.marginOld;
                return (
                  <TableRow key={bp.id} className="text-xs">
                    <TableCell className="py-1.5 font-mono">{bp.id}</TableCell>
                    <TableCell className="py-1.5 truncate max-w-[120px]">{bp.name}</TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-muted-foreground">R$ {bp.oldCost.toFixed(2)}</TableCell>
                    <TableCell className="py-1.5 text-right font-mono">R$ {bp.newCost.toFixed(2)}</TableCell>
                    <TableCell className="py-1.5 text-right font-mono text-muted-foreground">R$ {bp.oldPrice.toFixed(2)}</TableCell>
                    <TableCell className="py-1.5 text-right font-mono">R$ {bp.newPrice.toFixed(2)}</TableCell>
                    <TableCell className="py-1.5 text-center font-mono">{bp.marginNew.toFixed(1)}%</TableCell>
                    <TableCell className="py-1.5">
                      <Badge className={cn('text-[10px] border-0', marginDelta >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive')}>
                        {marginDelta >= 0 ? '+' : ''}{marginDelta.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBatchModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleBatchConfirm}><CheckCircle2 className="h-3 w-3 mr-1" /> Confirmar Atualização</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
