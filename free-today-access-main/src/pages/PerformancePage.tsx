import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSalesGoals, useCreateSalesGoal, useDeleteSalesGoal } from '@/hooks/useSalesGoals';
import { useCustomersWithStats, getCustomerLevel } from '@/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, Plus, Trash2, TrendingUp, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type PeriodFilter = 'today' | 'week' | 'month';

function getDateRange(period: PeriodFilter) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (period === 'today') return { start: todayStr, end: todayStr };
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    return { start: d.toISOString().split('T')[0], end: todayStr };
  }
  return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, end: todayStr };
}

function getPrevDateRange(period: PeriodFilter) {
  const now = new Date();
  if (period === 'today') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    const s = d.toISOString().split('T')[0];
    return { start: s, end: s };
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() - 7);
    const e = new Date(d);
    e.setDate(e.getDate() + 6);
    return { start: d.toISOString().split('T')[0], end: e.toISOString().split('T')[0] };
  }
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { start: prev.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
}

export default function PerformancePage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalPeriod, setGoalPeriod] = useState('mensal');
  const [goalType, setGoalType] = useState('faturamento');
  const [goalValue, setGoalValue] = useState('');
  const [clientPeriod, setClientPeriod] = useState('month');

  const range = getDateRange(period);
  const prevRange = getPrevDateRange(period);

  // Fetch sale_items with menu info for the period
  const { data: saleItems, isLoading } = useQuery({
    queryKey: ['performance_items', user?.id, range.start, range.end],
    queryFn: async () => {
      const { data: sales } = await supabase.from('sales').select('id').gte('date', range.start).lte('date', range.end).neq('status', 'cancelado');
      if (!sales || sales.length === 0) return [];
      const { data, error } = await supabase.from('sale_items').select('*, menu_items(name, category)').in('sale_id', sales.map(s => s.id));
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: prevSaleItems } = useQuery({
    queryKey: ['performance_items_prev', user?.id, prevRange.start, prevRange.end],
    queryFn: async () => {
      const { data: sales } = await supabase.from('sales').select('id').gte('date', prevRange.start).lte('date', prevRange.end).neq('status', 'cancelado');
      if (!sales || sales.length === 0) return [];
      const { data, error } = await supabase.from('sale_items').select('*, menu_items(name, category)').in('sale_id', sales.map(s => s.id));
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Current period sales for goals
  const { data: periodSales } = useQuery({
    queryKey: ['performance_sales', user?.id, range.start, range.end],
    queryFn: async () => {
      const { data, error } = await supabase.from('sales').select('*').gte('date', range.start).lte('date', range.end).neq('status', 'cancelado');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: goals } = useSalesGoals();
  const createGoal = useCreateSalesGoal();
  const deleteGoal = useDeleteSalesGoal();
  const { data: customersWithStats } = useCustomersWithStats();

  // Product ranking
  const ranking = useMemo(() => {
    if (!saleItems) return [];
    const map: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
    saleItems.forEach((item: any) => {
      const name = item.menu_items?.name || 'Desconhecido';
      const cat = item.menu_items?.category || 'outro';
      if (!map[item.menu_item_id]) map[item.menu_item_id] = { name, category: cat, qty: 0, revenue: 0 };
      map[item.menu_item_id].qty += item.quantity;
      map[item.menu_item_id].revenue += Number(item.subtotal);
    });
    const arr = Object.values(map).sort((a, b) => b.qty - a.qty);
    const totalQty = arr.reduce((s, i) => s + i.qty, 0);
    return arr.map((item, i) => ({ ...item, position: i + 1, percent: totalQty > 0 ? (item.qty / totalQty) * 100 : 0 }));
  }, [saleItems]);

  // Previous period ranking for comparison
  const prevRankingMap = useMemo(() => {
    if (!prevSaleItems) return {};
    const map: Record<string, number> = {};
    (prevSaleItems as any[]).forEach(item => {
      if (!map[item.menu_item_id]) map[item.menu_item_id] = 0;
      map[item.menu_item_id] += item.quantity;
    });
    return map;
  }, [prevSaleItems]);

  // Goals progress
  const goalProgress = useMemo(() => {
    if (!goals || !periodSales) return [];
    const totalRevenue = (periodSales || []).reduce((s, sale) => s + Number(sale.total_amount), 0);
    const totalOrders = (periodSales || []).length;
    const totalPizzas = (saleItems || []).filter((i: any) => i.menu_items?.category === 'pizza').reduce((s: number, i: any) => s + i.quantity, 0);

    const now = new Date();
    const { start } = range;
    const startDate = new Date(start + 'T00:00:00');
    const daysPassed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    return goals.map(g => {
      let current = 0;
      let unit = '';
      if (g.goal_type === 'faturamento') { current = totalRevenue; unit = 'R$'; }
      else if (g.goal_type === 'pedidos') { current = totalOrders; unit = 'pedidos'; }
      else { current = totalPizzas; unit = 'pizzas'; }

      const pct = g.target_value > 0 ? (current / g.target_value) * 100 : 0;
      const dailyRate = current / daysPassed;
      let totalDays = 1;
      if (g.period === 'mensal') totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      else if (g.period === 'semanal') totalDays = 7;
      const projection = dailyRate * totalDays;

      return { ...g, current, pct: Math.min(pct, 100), projection, unit };
    });
  }, [goals, periodSales, saleItems, range]);

  // Top clients
  const topClients = useMemo(() => {
    if (!customersWithStats) return [];
    return [...customersWithStats].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 10);
  }, [customersWithStats]);

  const handleCreateGoal = () => {
    if (!goalValue) return;
    createGoal.mutate({ period: goalPeriod, goal_type: goalType, target_value: Number(goalValue) });
    setGoalOpen(false);
    setGoalValue('');
  };

  const periodLabel: Record<string, string> = { diario: 'Diária', semanal: 'Semanal', mensal: 'Mensal' };
  const goalTypeLabel: Record<string, string> = { faturamento: 'Faturamento', pedidos: 'Pedidos', pizzas_vendidas: 'Pizzas Vendidas' };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Desempenho</h1>
          <p className="text-sm text-muted-foreground">Ranking de produtos e metas de vendas</p>
        </div>
      </div>

      <Tabs defaultValue="ranking">
        <TabsList>
          <TabsTrigger value="ranking"><Trophy className="h-4 w-4 mr-1" /> Ranking</TabsTrigger>
          <TabsTrigger value="goals"><Target className="h-4 w-4 mr-1" /> Metas</TabsTrigger>
          <TabsTrigger value="clients"><Users className="h-4 w-4 mr-1" /> Top Clientes</TabsTrigger>
        </TabsList>

        {/* RANKING TAB */}
        <TabsContent value="ranking" className="space-y-4">
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as PeriodFilter[]).map(p => (
              <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)}>
                {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
              </Button>
            ))}
          </div>

          {/* Top 5 chart */}
          {ranking.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Top 5 Mais Vendidos</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ranking.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => `${v} un`} />
                    <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Ranking table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Top 10 Produtos</CardTitle></CardHeader>
            <CardContent>
              {ranking.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma venda no período</p>
              ) : (
                <div className="space-y-2">
                  {ranking.slice(0, 10).map(item => (
                    <div key={item.position} className={`flex items-center gap-3 p-3 rounded-lg border ${item.position === 1 ? 'border-primary bg-primary/5' : ''}`}>
                      <span className="text-xl font-bold w-8 text-center" style={{ fontFamily: 'Nunito' }}>
                        {item.position === 1 ? '🏆' : `#${item.position}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ fontFamily: 'Nunito' }}>{item.qty} un</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.revenue)}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{item.percent.toFixed(1)}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GOALS TAB */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setGoalOpen(true)} size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nova Meta</Button>
          </div>

          {goalProgress.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma meta cadastrada. Crie sua primeira meta!</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goalProgress.map(g => {
                const color = g.pct >= 80 ? 'text-[hsl(var(--success))]' : g.pct >= 50 ? 'text-[hsl(var(--warning))]' : 'text-destructive';
                return (
                  <Card key={g.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="outline" className="text-xs">{periodLabel[g.period]}</Badge>
                          <p className="font-semibold mt-1">{goalTypeLabel[g.goal_type]}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                          if (confirm('Remover esta meta?')) deleteGoal.mutate(g.id);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={`font-bold ${color}`}>
                            {g.goal_type === 'faturamento' ? formatCurrency(g.current) : g.current} de {g.goal_type === 'faturamento' ? formatCurrency(g.target_value) : g.target_value}
                          </span>
                          <span className={`font-bold ${color}`}>{g.pct.toFixed(0)}%</span>
                        </div>
                        <Progress value={g.pct} className="h-3" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        Projeção: {g.goal_type === 'faturamento' ? formatCurrency(g.projection) : Math.round(g.projection)} até o fim do período
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TOP CLIENTS TAB */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Top 10 Clientes</CardTitle></CardHeader>
            <CardContent>
              {topClients.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum cliente cadastrado</p>
              ) : (
                <div className="space-y-2">
                  {topClients.map((c, i) => {
                    const level = getCustomerLevel(c.totalOrders);
                    return (
                      <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border ${i === 0 ? 'border-primary bg-primary/5' : ''}`}>
                        <span className="text-xl w-8 text-center">{i === 0 ? '🏆' : `#${i + 1}`}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.phone}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{level.emoji} {level.label}</Badge>
                        <div className="text-right">
                          <p className="font-bold" style={{ fontFamily: 'Nunito' }}>{c.totalOrders} pedidos</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(c.totalSpent)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Goal dialog */}
      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Meta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Período</Label>
              <Select value={goalPeriod} onValueChange={setGoalPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diário</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={goalType} onValueChange={setGoalType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="faturamento">Faturamento (R$)</SelectItem>
                  <SelectItem value="pedidos">Nº de Pedidos</SelectItem>
                  <SelectItem value="pizzas_vendidas">Pizzas Vendidas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor da Meta</Label>
              <Input type="number" value={goalValue} onChange={e => setGoalValue(e.target.value)} placeholder={goalType === 'faturamento' ? 'Ex: 12000' : 'Ex: 100'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateGoal} disabled={!goalValue || createGoal.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
