import { useState, useMemo } from 'react';
import { useCMV } from '@/hooks/useCMV';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertTriangle, DollarSign, Percent, BarChart3, Lightbulb, ExternalLink } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { Link } from 'react-router-dom';

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function getSemaphoreColor(cmv: number) {
  if (cmv < 30) return { bg: 'bg-[hsl(var(--success))]/10', border: 'border-[hsl(var(--success))]', text: 'text-[hsl(var(--success))]', label: 'Excelente' };
  if (cmv <= 38) return { bg: 'bg-[hsl(var(--warning))]/10', border: 'border-[hsl(var(--warning))]', text: 'text-[hsl(var(--warning))]', label: 'Atenção' };
  return { bg: 'bg-destructive/10', border: 'border-destructive', text: 'text-destructive', label: 'Crítico' };
}

function getMarginBadge(margin: number) {
  if (margin > 35) return <Badge className="bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30">{margin.toFixed(1)}%</Badge>;
  if (margin >= 25) return <Badge className="bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30">{margin.toFixed(1)}%</Badge>;
  return <Badge variant="destructive">{margin.toFixed(1)}%</Badge>;
}

type PeriodKey = 'week' | 'month' | 'quarter';

export default function CMVPage() {
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [cmvGoal, setCmvGoal] = useState(35);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('35');

  const { start, end } = useMemo(() => {
    const now = new Date();
    if (period === 'week') return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    if (period === 'quarter') return { start: startOfMonth(subDays(now, 90)), end: endOfMonth(now) };
    return { start: startOfMonth(now), end: endOfMonth(now) };
  }, [period]);

  const { data, isLoading } = useCMV(start, end, cmvGoal);

  const saveGoal = () => {
    const v = parseFloat(goalInput);
    if (v > 0 && v < 100) setCmvGoal(v);
    setEditingGoal(false);
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!data) return null;

  const sem = getSemaphoreColor(data.cmvPercent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>CMV — Custo da Mercadoria Vendida</h1>
          <p className="text-sm text-muted-foreground">Análise detalhada de custos por item vendido</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta semana</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="quarter">Trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* SEÇÃO 1 — Painel de Controle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`border-l-4 ${sem.border}`}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">CMV do Período</p>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{fmt(data.cmvTotal)}</p>
            <div className={`mt-1 flex items-center gap-1 text-xs ${sem.text}`}>
              <div className={`h-3 w-3 rounded-full ${sem.text === 'text-[hsl(var(--success))]' ? 'bg-[hsl(var(--success))]' : sem.text === 'text-[hsl(var(--warning))]' ? 'bg-[hsl(var(--warning))]' : 'bg-destructive'}`} />
              {sem.label}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${sem.border}`}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">CMV %</p>
            <p className={`text-2xl font-bold ${sem.text}`} style={{ fontFamily: 'Nunito' }}>{data.cmvPercent.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">sobre receita de {fmt(data.revenueTotal)}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meta CMV</p>
                {editingGoal ? (
                  <div className="flex items-center gap-1 mt-1">
                    <Input className="h-8 w-16 text-sm" type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} />
                    <span className="text-sm">%</span>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={saveGoal}>OK</Button>
                  </div>
                ) : (
                  <p className="text-2xl font-bold cursor-pointer" style={{ fontFamily: 'Nunito' }} onClick={() => { setGoalInput(String(cmvGoal)); setEditingGoal(true); }}>{cmvGoal}%</p>
                )}
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${data.variation <= 0 ? 'border-l-[hsl(var(--success))]' : 'border-l-destructive'}`}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Variação vs Anterior</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${data.variation <= 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}`} style={{ fontFamily: 'Nunito' }}>
                {data.variation > 0 ? '+' : ''}{data.variation.toFixed(1)}%
              </p>
              {data.variation <= 0 ? <TrendingDown className="h-5 w-5 text-[hsl(var(--success))]" /> : <TrendingUp className="h-5 w-5 text-destructive" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insight */}
      <Card className={`${sem.bg} ${sem.border} border`}>
        <CardContent className="p-4 flex items-center gap-3">
          <Lightbulb className={`h-5 w-5 ${sem.text} flex-shrink-0`} />
          <p className="text-sm">
            Seu CMV está em <strong>{data.cmvPercent.toFixed(1)}%</strong>. Para cada <strong>R$100</strong> vendidos, <strong>{fmt(data.cmvPercent)}</strong> foram gastos com insumos.
            {data.cmvPercent > cmvGoal && ` Sua meta é ${cmvGoal}% — você está ${(data.cmvPercent - cmvGoal).toFixed(1)} pontos acima.`}
            {data.cmvPercent <= cmvGoal && ` Parabéns! Você está dentro da meta de ${cmvGoal}%.`}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="category" className="space-y-4">
        <TabsList>
          <TabsTrigger value="category">Por Categoria</TabsTrigger>
          <TabsTrigger value="product">Por Produto</TabsTrigger>
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="waste">Desperdício</TabsTrigger>
          <TabsTrigger value="projection">Projeção</TabsTrigger>
        </TabsList>

        {/* SEÇÃO 2 — Por Categoria */}
        <TabsContent value="category" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">CMV por Categoria</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">CMV%</TableHead>
                      <TableHead className="text-right">Margem%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.byCategory.map(c => (
                      <TableRow key={c.category} className={c.cmvPercent > cmvGoal ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium">{c.category}</TableCell>
                        <TableCell className="text-right">{c.qtySold}</TableCell>
                        <TableCell className="text-right">{fmt(c.costTotal)}</TableCell>
                        <TableCell className="text-right">{fmt(c.revenueTotal)}</TableCell>
                        <TableCell className="text-right">{c.cmvPercent > cmvGoal ? <span className="text-destructive font-bold">{c.cmvPercent.toFixed(1)}%</span> : `${c.cmvPercent.toFixed(1)}%`}</TableCell>
                        <TableCell className="text-right">{getMarginBadge(c.marginPercent)}</TableCell>
                      </TableRow>
                    ))}
                    {data.byCategory.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma venda no período</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">CMV% por Categoria</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="category" className="text-xs" />
                    <YAxis unit="%" className="text-xs" />
                    <RechartsTooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                    <ReferenceLine y={cmvGoal} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `Meta ${cmvGoal}%`, fill: 'hsl(var(--destructive))' }} />
                    <Bar dataKey="cmvPercent" name="CMV%">
                      {data.byCategory.map((c, i) => (
                        <Cell key={i} fill={c.cmvPercent > cmvGoal ? 'hsl(var(--destructive))' : c.cmvPercent > 30 ? 'hsl(var(--warning))' : 'hsl(var(--success))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEÇÃO 3 — Por Produto */}
        <TabsContent value="product">
          <Card>
            <CardHeader><CardTitle className="text-base">Top 20 Produtos — Maior Impacto no CMV</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Custo Total</TableHead>
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead className="text-right">Margem R$</TableHead>
                    <TableHead className="text-right">Margem%</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byProduct.map(p => (
                    <TableRow key={p.menuItemId}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">{p.qtySold}</TableCell>
                      <TableCell className="text-right">{fmt(p.costUnit)}</TableCell>
                      <TableCell className="text-right">{fmt(p.costTotal)}</TableCell>
                      <TableCell className="text-right">{fmt(p.salePrice)}</TableCell>
                      <TableCell className="text-right">{fmt(p.marginValue)}</TableCell>
                      <TableCell className="text-right">{getMarginBadge(p.marginPercent)}</TableCell>
                      <TableCell>
                        {p.hasRecipe && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link to="/fichas-tecnicas">
                                <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="h-3 w-3" /></Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Ver ficha técnica</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.byProduct.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhuma venda no período</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEÇÃO 4 — Evolução */}
        <TabsContent value="evolution">
          <Card>
            <CardHeader><CardTitle className="text-base">Evolução do CMV% — Últimos 12 Meses</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" className="text-xs" />
                  <YAxis unit="%" className="text-xs" />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm space-y-1">
                          <p className="font-semibold">{d.label}</p>
                          <p>CMV: {fmt(d.cmvValue)} ({d.cmvPercent.toFixed(1)}%)</p>
                          <p>Receita: {fmt(d.revenue)}</p>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={cmvGoal} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `Meta ${cmvGoal}%`, fill: 'hsl(var(--destructive))', fontSize: 12 }} />
                  <Line type="monotone" dataKey="cmvPercent" name="CMV%" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEÇÃO 5 — Desperdício */}
        <TabsContent value="waste" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Custo Total de Desperdício</p>
                <p className="text-2xl font-bold text-destructive" style={{ fontFamily: 'Nunito' }}>{fmt(data.wasteAnalysis.reduce((s, w) => s + w.wasteCost, 0))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Impacto no CMV</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{data.wasteAnalysis.reduce((s, w) => s + w.impactOnCmv, 0).toFixed(2)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Ingredientes com Perda</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{data.wasteAnalysis.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Análise de Desperdício por Ingrediente</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead className="text-right">Desperdício%</TableHead>
                    <TableHead className="text-right">Custo Desperdício</TableHead>
                    <TableHead className="text-right">Impacto CMV%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.wasteAnalysis.map(w => (
                    <TableRow key={w.productId}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell className="text-right">{w.wastePercent.toFixed(0)}%</TableCell>
                      <TableCell className="text-right text-destructive">{fmt(w.wasteCost)}</TableCell>
                      <TableCell className="text-right">{w.impactOnCmv.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                  {data.wasteAnalysis.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum desperdício registrado nas fichas técnicas</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {data.wasteAnalysis.length > 0 && (
            <Card className="bg-muted/30 border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-sm">
                  Reduzir 2% o desperdício de <strong>{data.wasteAnalysis[0]?.name}</strong> economizaria aproximadamente <strong>{fmt(data.wasteAnalysis[0]?.wasteCost * 0.4)}</strong> por mês.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SEÇÃO 6 — Projeção */}
        <TabsContent value="projection">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Receita Projetada (30d)</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{fmt(data.projection.projectedRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">CMV Projetado</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{fmt(data.projection.projectedCmv)}</p>
              </CardContent>
            </Card>
            <Card className={`border-l-4 ${getSemaphoreColor(data.projection.projectedCmvPercent).border}`}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">CMV Projetado %</p>
                <p className={`text-2xl font-bold ${getSemaphoreColor(data.projection.projectedCmvPercent).text}`} style={{ fontFamily: 'Nunito' }}>{data.projection.projectedCmvPercent.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Margem Projetada</p>
                <p className="text-2xl font-bold text-[hsl(var(--success))]" style={{ fontFamily: 'Nunito' }}>{fmt(data.projection.projectedMargin)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
