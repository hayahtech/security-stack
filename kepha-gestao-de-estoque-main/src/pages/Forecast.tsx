import { useState, useMemo, useCallback } from 'react';
import {
  actualMonths, forecastBase, forecastOptimistic, forecastPessimistic,
  MIN_CASH, predictedFlows, savedScenarios, seasonalityPatterns, seasonalityHeatmap,
  type PredictedFlow, type SavedScenario, type ForecastMonth, type PredictionConfidence,
} from '@/data/forecastData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle,
  Zap, Save, Eye, Plus, Wallet, Target, BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, Legend, ReferenceLine,
  BarChart, Bar,
} from 'recharts';

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function fmtBRL(v: number) {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
  return `R$ ${v.toLocaleString('pt-BR')}`;
}

function fmtFull(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

const confidenceConfig: Record<PredictionConfidence, { label: string; color: string; pct: string }> = {
  CONTRATUAL: { label: 'Contratual', color: 'bg-emerald-500/20 text-emerald-400', pct: '100%' },
  HISTORICO: { label: 'Histórico', color: 'bg-primary/20 text-primary', pct: '85%' },
  ESTIMADO: { label: 'Estimado', color: 'bg-amber-500/20 text-amber-400', pct: '60%' },
  INCERTO: { label: 'Incerto', color: 'bg-destructive/20 text-destructive', pct: '30%' },
};

export default function Forecast() {
  const { toast } = useToast();

  // Simulator state
  const [financing, setFinancing] = useState(0);
  const [financingMonths, setFinancingMonths] = useState(36);
  const [financingRate, setFinancingRate] = useState(1.5);
  const [revenueChange, setRevenueChange] = useState(0);
  const [expenseAnticipation, setExpenseAnticipation] = useState(0);
  const [newHeadcount, setNewHeadcount] = useState(0);
  const [avgSalary, setAvgSalary] = useState(5000);

  const [scenarios, setScenarios] = useState(savedScenarios);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDesc, setScenarioDesc] = useState('');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Compute simulated forecast
  const simulatedForecast = useMemo(() => {
    const monthlyFinancing = financing > 0 && financingMonths > 0
      ? financing * (financingRate / 100) * Math.pow(1 + financingRate / 100, financingMonths) / (Math.pow(1 + financingRate / 100, financingMonths) - 1)
      : 0;
    const monthlyHeadcost = newHeadcount * avgSalary * 1.7; // encargos
    const revMult = 1 + revenueChange / 100;

    let cum = actualMonths[actualMonths.length - 1].cumulative;
    if (financing > 0) cum += financing; // loan disbursement
    if (expenseAnticipation > 0) cum -= expenseAnticipation;

    return forecastBase.map((m, i) => {
      const adjRevenue = Math.round(m.revenue * revMult);
      const adjCosts = Math.round(m.costs + monthlyFinancing + monthlyHeadcost);
      const balance = adjRevenue - adjCosts;
      cum += balance;
      return { ...m, revenue: adjRevenue, costs: adjCosts, balance, cumulative: cum };
    });
  }, [financing, financingMonths, financingRate, revenueChange, expenseAnticipation, newHeadcount, avgSalary]);

  const hasSimulation = financing > 0 || revenueChange !== 0 || expenseAnticipation > 0 || newHeadcount > 0;

  // Chart data: last 12 actuals + 12 forecast
  const chartData = useMemo(() => {
    const recentActuals = actualMonths.slice(-12);
    return [
      ...recentActuals.map(m => ({
        month: m.month,
        realizado: m.cumulative,
        base: null as number | null,
        otimista: null as number | null,
        pessimista: null as number | null,
        simulado: null as number | null,
      })),
      ...forecastBase.map((m, i) => ({
        month: m.month,
        realizado: null as number | null,
        base: m.cumulative,
        otimista: forecastOptimistic[i].cumulative,
        pessimista: forecastPessimistic[i].cumulative,
        simulado: hasSimulation ? simulatedForecast[i].cumulative : null,
      })),
    ];
  }, [simulatedForecast, hasSimulation]);

  // KPI cards
  const currentCash = actualMonths[actualMonths.length - 1].cumulative;
  const cash30d = forecastBase[0]?.cumulative || 0;
  const cash90d = forecastBase[2]?.cumulative || 0;
  const cash12m = forecastBase[11]?.cumulative || 0;
  const simCash12m = simulatedForecast[11]?.cumulative || 0;

  const criticalPointBase = forecastBase.find(m => m.cumulative < MIN_CASH);
  const criticalPointSim = simulatedForecast.find(m => m.cumulative < MIN_CASH);

  // Entries and exits
  const entries = predictedFlows.filter(f => f.type === 'ENTRADA');
  const exits = predictedFlows.filter(f => f.type === 'SAIDA');

  // Heatmap color
  const heatColor = (val: number) => {
    if (val >= 125) return 'bg-emerald-500/40 text-emerald-300';
    if (val >= 110) return 'bg-emerald-500/20 text-emerald-400';
    if (val >= 95) return 'bg-secondary text-foreground';
    if (val >= 85) return 'bg-amber-500/20 text-amber-400';
    return 'bg-destructive/20 text-destructive';
  };

  const handleSaveScenario = useCallback(() => {
    if (!scenarioName.trim()) return;
    const sc: SavedScenario = {
      id: `SC${Date.now()}`,
      name: scenarioName,
      description: scenarioDesc,
      createdAt: new Date(),
      variables: { financing, financingMonths, financingRate, revenueChange, expenseAnticipation, newHeadcount, avgSalary },
      resultCash12m: simCash12m,
      criticalPoint: criticalPointSim?.month,
    };
    setScenarios(prev => [...prev, sc]);
    setSaveModalOpen(false);
    setScenarioName('');
    setScenarioDesc('');
    toast({ title: 'Cenário salvo com sucesso' });
  }, [scenarioName, scenarioDesc, financing, financingMonths, financingRate, revenueChange, expenseAnticipation, newHeadcount, avgSalary, simCash12m, criticalPointSim, toast]);

  const loadScenario = useCallback((sc: SavedScenario) => {
    setFinancing(sc.variables.financing);
    setFinancingMonths(sc.variables.financingMonths);
    setFinancingRate(sc.variables.financingRate);
    setRevenueChange(sc.variables.revenueChange);
    setExpenseAnticipation(sc.variables.expenseAnticipation);
    setNewHeadcount(sc.variables.newHeadcount);
    setAvgSalary(sc.variables.avgSalary);
    setActiveScenarioId(sc.id);
    toast({ title: `Cenário "${sc.name}" carregado` });
  }, [toast]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Previsibilidade & Cenários</h1>
        <p className="text-xs text-muted-foreground">Inteligência preditiva com simulações what-if</p>
      </div>

      {/* ===== MAIN CHART ===== */}
      <Card className="bg-card border-border">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Projeção de Caixa — 12 Meses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="coneGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval={1} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => fmtBRL(v)} />
              <RechartsTooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }}
                formatter={(v: number | null, name: string) => v != null ? [fmtFull(v), name] : ['-', name]}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={MIN_CASH} stroke="hsl(var(--destructive))" strokeDasharray="8 4" label={{ value: 'Caixa Mínimo', position: 'right', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
              <Area type="monotone" dataKey="otimista" stroke="transparent" fill="url(#coneGrad)" name="Cone Otimista" />
              <Area type="monotone" dataKey="pessimista" stroke="transparent" fill="hsl(var(--destructive))" fillOpacity={0.05} name="Cone Pessimista" />
              <Line type="monotone" dataKey="realizado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} name="Realizado" connectNulls={false} />
              <Line type="monotone" dataKey="base" stroke="#22c55e" strokeWidth={2} dot={false} name="Previsto Base" connectNulls={false} />
              <Line type="monotone" dataKey="otimista" stroke="#86efac" strokeWidth={1} strokeDasharray="5 3" dot={false} name="Otimista" connectNulls={false} />
              <Line type="monotone" dataKey="pessimista" stroke="hsl(var(--destructive))" strokeWidth={1} strokeDasharray="5 3" dot={false} name="Pessimista" connectNulls={false} />
              {hasSimulation && <Line type="monotone" dataKey="simulado" stroke="#f59e0b" strokeWidth={2.5} dot={false} name="Simulado" connectNulls={false} />}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Saldo Atual', value: currentCash, icon: Wallet, color: 'text-primary' },
          { label: 'Em 30 dias', value: cash30d, icon: Calendar },
          { label: 'Em 90 dias', value: cash90d, icon: Calendar },
          { label: 'Em 12 meses', value: cash12m, icon: Target },
          { label: 'Ponto Crítico', value: criticalPointBase ? criticalPointBase.month : 'Nenhum ✓', icon: AlertTriangle, isText: true },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          const isCritical = i === 4 && criticalPointBase;
          return (
            <Card key={i} className={cn('bg-card border-border', isCritical && 'border-destructive/40')}>
              <CardContent className="p-3">
                <Icon className={cn('h-3.5 w-3.5 mb-1', kpi.color || (isCritical ? 'text-destructive' : 'text-muted-foreground'))} />
                <p className={cn('text-lg font-mono font-bold', isCritical ? 'text-destructive' : 'text-foreground')}>
                  {(kpi as any).isText ? kpi.value : fmtBRL(kpi.value as number)}
                </p>
                <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ===== ENTRIES & EXITS ===== */}
      <div className="grid grid-cols-2 gap-3">
        {[{ title: 'Entradas Previstas', data: entries, color: 'text-emerald-500' },
          { title: 'Saídas Previstas', data: exits, color: 'text-destructive' }].map((section) => (
          <Card key={section.title} className="bg-card border-border">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-[10px] h-7">Descrição</TableHead>
                    <TableHead className="text-[10px] h-7 text-right">Valor</TableHead>
                    <TableHead className="text-[10px] h-7">Recorrência</TableHead>
                    <TableHead className="text-[10px] h-7">Confiança</TableHead>
                    <TableHead className="text-[10px] h-7">Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.data.map(f => {
                    const conf = confidenceConfig[f.confidence];
                    return (
                      <TableRow key={f.id} className="border-border">
                        <TableCell className="text-xs py-1.5">{f.description}</TableCell>
                        <TableCell className={cn('text-xs py-1.5 text-right font-mono', section.color)}>{fmtBRL(f.value)}</TableCell>
                        <TableCell className="text-xs py-1.5">
                          <Badge className="bg-secondary text-muted-foreground text-[9px]">{f.recurrence}</Badge>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Badge className={cn('text-[9px]', conf.color)}>{conf.label} ({conf.pct})</Badge>
                        </TableCell>
                        <TableCell className="text-xs py-1.5 text-muted-foreground">{f.origin}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===== WHAT-IF SIMULATOR ===== */}
      <Card className={cn(
        'border-2 transition-all',
        criticalPointSim ? 'border-destructive/60 bg-destructive/5 animate-pulse' : 'border-primary/30 bg-primary/5'
      )}>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Simulador de Cenários
          </CardTitle>
          <p className="text-xs text-muted-foreground">Teste o impacto de decisões antes de tomá-las</p>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Financing */}
            <div className="space-y-2 p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">📦 Novo Financiamento</div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Valor: {fmtBRL(financing)}</Label>
                <Slider value={[financing]} onValueChange={v => setFinancing(v[0])} max={2_000_000} step={50_000} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Parcelas: {financingMonths}</Label>
                <Slider value={[financingMonths]} onValueChange={v => setFinancingMonths(v[0])} min={12} max={60} step={6} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Taxa mensal: {financingRate.toFixed(1)}%</Label>
                <Slider value={[financingRate * 10]} onValueChange={v => setFinancingRate(v[0] / 10)} min={8} max={30} step={1} className="mt-1" />
              </div>
            </div>

            {/* Revenue Change */}
            <div className="space-y-2 p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">📉 Variação de Receita</div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Variação: {revenueChange > 0 ? '+' : ''}{revenueChange}%</Label>
                <Slider value={[revenueChange]} onValueChange={v => setRevenueChange(v[0])} min={-30} max={30} step={1} className="mt-1" />
              </div>
            </div>

            {/* Expense Anticipation */}
            <div className="space-y-2 p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">💸 Antecipação de Despesa</div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Valor: {fmtBRL(expenseAnticipation)}</Label>
                <Slider value={[expenseAnticipation]} onValueChange={v => setExpenseAnticipation(v[0])} max={500_000} step={10_000} className="mt-1" />
              </div>
            </div>

            {/* Headcount */}
            <div className="space-y-2 p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">👥 Novo Headcount</div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Funcionários: {newHeadcount}</Label>
                <Slider value={[newHeadcount]} onValueChange={v => setNewHeadcount(v[0])} max={50} step={1} className="mt-1" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Salário médio: {fmtBRL(avgSalary)}</Label>
                <Slider value={[avgSalary]} onValueChange={v => setAvgSalary(v[0])} min={2000} max={15000} step={500} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Simulation Result */}
          {hasSimulation && (
            <Card className={cn(
              'border-2',
              criticalPointSim ? 'border-destructive/60 bg-destructive/5' : 'border-emerald-500/40 bg-emerald-500/5'
            )}>
              <CardContent className="p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Impacto do Cenário Simulado</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Caixa em 12 meses</p>
                    <p className="text-xs text-muted-foreground">Sem simulação: <span className="font-mono">{fmtBRL(cash12m)}</span></p>
                    <p className="text-sm font-bold text-foreground">
                      Com simulação: <span className={cn('font-mono', simCash12m < cash12m ? 'text-destructive' : 'text-emerald-500')}>{fmtBRL(simCash12m)}</span>
                      <span className={cn('text-xs ml-1', simCash12m < cash12m ? 'text-destructive' : 'text-emerald-500')}>
                        {simCash12m < cash12m ? '▼' : '▲'} {Math.abs(((simCash12m - cash12m) / cash12m) * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Ponto crítico</p>
                    <p className="text-xs text-muted-foreground">Sem simulação: {criticalPointBase?.month || 'Nenhum ✓'}</p>
                    <p className={cn('text-sm font-bold', criticalPointSim ? 'text-destructive' : 'text-emerald-500')}>
                      Com simulação: {criticalPointSim ? `⚠ ${criticalPointSim.month}` : 'Nenhum ✓'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Meses no negativo</p>
                    <p className="text-xs text-muted-foreground">Sem: {forecastBase.filter(m => m.cumulative < MIN_CASH).length}</p>
                    <p className={cn('text-sm font-bold', simulatedForecast.filter(m => m.cumulative < MIN_CASH).length > 0 ? 'text-destructive' : 'text-emerald-500')}>
                      Com: {simulatedForecast.filter(m => m.cumulative < MIN_CASH).length} meses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save + Scenarios */}
          <div className="flex items-center gap-2">
            <Button size="sm" className="text-xs gap-1" onClick={() => setSaveModalOpen(true)} disabled={!hasSimulation}>
              <Save className="h-3 w-3" /> Salvar Cenário
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => {
              setFinancing(0); setRevenueChange(0); setExpenseAnticipation(0); setNewHeadcount(0); setActiveScenarioId(null);
            }}>Limpar</Button>
          </div>

          {/* Saved Scenarios */}
          <div className="grid grid-cols-3 gap-2">
            {scenarios.map(sc => (
              <Card key={sc.id} className={cn('bg-card border cursor-pointer hover:border-primary/50 transition-all',
                activeScenarioId === sc.id ? 'border-primary' : 'border-border'
              )} onClick={() => loadScenario(sc)}>
                <CardContent className="p-3">
                  <p className="text-xs font-semibold text-foreground">{sc.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{sc.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={cn('text-xs font-mono font-bold', sc.resultCash12m >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                      {fmtBRL(sc.resultCash12m)}
                    </span>
                    {sc.criticalPoint && <Badge className="bg-destructive/20 text-destructive text-[9px]">⚠ {sc.criticalPoint}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== SEASONALITY ===== */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-border">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Padrões Históricos Detectados</CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-2">
            {seasonalityPatterns.map((p, i) => (
              <Card key={i} className={cn('border', p.type === 'peak' ? 'border-emerald-500/20' : 'border-amber-500/20')}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{p.icon}</span>
                    <span className="text-xs font-semibold text-foreground">{p.title}</span>
                  </div>
                  <p className="text-xs text-foreground">{p.months}</p>
                  <p className={cn('text-sm font-mono font-bold', p.variation >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                    {p.variation >= 0 ? '+' : ''}{p.variation}% acima da média
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.description} · Baseado em {p.yearsOfData} anos</p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card className="bg-card border-border">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Heatmap de Sazonalidade</CardTitle>
          </CardHeader>
          <CardContent className="p-2 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-[9px] h-7 w-24">Categoria</TableHead>
                  {monthNames.map(m => (
                    <TableHead key={m} className="text-[9px] h-7 text-center w-9">{m}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasonalityHeatmap.map((row, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-[10px] py-1 font-medium">{row.category}</TableCell>
                    {row.months.map((val, j) => (
                      <TableCell key={j} className={cn('text-[9px] py-1 text-center font-mono', heatColor(val))}>
                        {val}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-[9px] text-muted-foreground mt-2">Valores relativos: 100 = média anual. Verde = acima, Vermelho = abaixo.</p>
          </CardContent>
        </Card>
      </div>

      {/* ===== SAVE SCENARIO MODAL ===== */}
      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Salvar Cenário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Nome do Cenário</Label>
              <Input className="h-8 text-xs mt-1" value={scenarioName} onChange={e => setScenarioName(e.target.value)} placeholder="Ex: Expansão CD Recife" />
            </div>
            <div>
              <Label className="text-xs">Descrição</Label>
              <Input className="h-8 text-xs mt-1" value={scenarioDesc} onChange={e => setScenarioDesc(e.target.value)} placeholder="Breve descrição..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setSaveModalOpen(false)}>Cancelar</Button>
            <Button size="sm" className="text-xs" onClick={handleSaveScenario}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
