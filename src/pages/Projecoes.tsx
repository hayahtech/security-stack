import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import { TrendingUp, Target, Rocket, ShieldAlert, Calculator, CalendarClock } from "lucide-react";
import { scenarios, generateProjection, projectedDRE, cashFlowProjection, capitalGiroProjection } from "@/mock/projectionsData";

const fmt = (v: number) => `R$ ${(v / 1000000).toFixed(2)}M`;
const fmtK = (v: number) => `R$ ${(v / 1000).toFixed(0)}K`;

export default function Projecoes() {
  const [growthRate, setGrowthRate] = useState(2.5);
  const [churnRate, setChurnRate] = useState(2.3);
  const [ebitdaMargin, setEbitdaMargin] = useState(40);

  const baseData = useMemo(() => generateProjection(scenarios.base.growthRate, scenarios.base.churnRate), []);
  const optData = useMemo(() => generateProjection(scenarios.optimistic.growthRate, scenarios.optimistic.churnRate), []);
  const pessData = useMemo(() => generateProjection(scenarios.pessimistic.growthRate, scenarios.pessimistic.churnRate), []);
  const customData = useMemo(() => generateProjection(growthRate, churnRate), [growthRate, churnRate]);

  const fanChartData = baseData.map((d, i) => ({
    month: d.month,
    otimista: optData[i]?.mrr || 0,
    base: d.mrr,
    pessimista: pessData[i]?.mrr || 0,
    custom: customData[i]?.mrr || 0,
  }));

  const customFinalMRR = customData[customData.length - 1]?.mrr || 0;
  const customARR = customFinalMRR * 12;
  const monthsTo100M = customARR > 0 ? Math.ceil(Math.log(100000000 / customARR) / Math.log(1 + (growthRate - churnRate) / 100)) : Infinity;

  const scenarioCards = [
    { ...scenarios.base, icon: Target, data: baseData },
    { ...scenarios.optimistic, icon: Rocket, data: optData },
    { ...scenarios.pessimistic, icon: ShieldAlert, data: pessData },
  ];

  const months = ["Mar/25", "Abr/25", "Mai/25", "Jun/25", "Jul/25", "Ago/25", "Set/25", "Out/25", "Nov/25", "Dez/25", "Jan/26", "Fev/26", "Mar/26"];

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Projeções & Forecasting</h1>
        <p className="text-muted-foreground font-data text-sm">Cenários de projeção financeira para 12 meses</p>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarioCards.map((s) => {
          const Icon = s.icon;
          const final = s.data[s.data.length - 1]?.mrr || 0;
          return (
            <Card key={s.name} className="border-border/50 bg-card/80">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-data">{s.name}</CardTitle>
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold font-data" style={{ color: s.color }}>{fmt(final)}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-data">Cresc. {s.growthRate}%/mês</Badge>
                  <Badge variant="outline" className="text-xs font-data">Churn {s.churnRate}%</Badge>
                  <Badge variant="outline" className="text-xs font-data">EBITDA {s.ebitdaMargin}%</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="cenarios" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="cenarios">Fan Chart</TabsTrigger>
          <TabsTrigger value="simulador">Simulador</TabsTrigger>
          <TabsTrigger value="dre">Projeção DRE</TabsTrigger>
          <TabsTrigger value="caixa">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="capgiro">Capital de Giro</TabsTrigger>
        </TabsList>

        <TabsContent value="cenarios">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-data">Cone de Incerteza — MRR 12 Meses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={fanChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => fmt(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="otimista" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.1} name="Otimista" />
                  <Area type="monotone" dataKey="base" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="Base" strokeWidth={2} />
                  <Area type="monotone" dataKey="pessimista" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.1} name="Pessimista" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulador">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-border/50 bg-card/80 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base font-data flex items-center gap-2"><Calculator className="w-4 h-4" /> Variáveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-data">
                    <span className="text-muted-foreground">Crescimento MRR</span>
                    <span className="text-foreground font-semibold">{growthRate.toFixed(1)}%/mês</span>
                  </div>
                  <Slider value={[growthRate]} onValueChange={(v) => setGrowthRate(v[0])} min={0} max={8} step={0.1} />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-data">
                    <span className="text-muted-foreground">Churn Rate</span>
                    <span className="text-foreground font-semibold">{churnRate.toFixed(1)}%</span>
                  </div>
                  <Slider value={[churnRate]} onValueChange={(v) => setChurnRate(v[0])} min={0} max={8} step={0.1} />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-data">
                    <span className="text-muted-foreground">Margem EBITDA</span>
                    <span className="text-foreground font-semibold">{ebitdaMargin}%</span>
                  </div>
                  <Slider value={[ebitdaMargin]} onValueChange={(v) => setEbitdaMargin(v[0])} min={10} max={60} step={1} />
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm font-data">
                    <span className="text-muted-foreground">MRR em 12 meses</span>
                    <span className="text-primary font-bold">{fmt(customFinalMRR)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-data">
                    <span className="text-muted-foreground">ARR projetado</span>
                    <span className="text-primary font-bold">{fmt(customARR)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-data">
                    <span className="text-muted-foreground">EBITDA projetado</span>
                    <span className="text-primary font-bold">{fmt(customFinalMRR * ebitdaMargin / 100)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-data pt-2 border-t border-border">
                    <span className="text-muted-foreground flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Meta R$ 100M ARR</span>
                    <span className="text-secondary font-bold">{monthsTo100M < 999 ? `${monthsTo100M} meses` : "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-data">Projeção Customizada vs Cenários</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={fanChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => fmt(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="base" stroke="hsl(var(--primary))" strokeDasharray="5 5" name="Base" dot={false} />
                    <Line type="monotone" dataKey="otimista" stroke="hsl(var(--success))" strokeDasharray="5 5" name="Otimista" dot={false} />
                    <Line type="monotone" dataKey="pessimista" stroke="hsl(var(--destructive))" strokeDasharray="5 5" name="Pessimista" dot={false} />
                    <Line type="monotone" dataKey="custom" stroke="hsl(var(--secondary))" strokeWidth={3} name="Customizado" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dre">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-data">Projeção de DRE — 12 Meses (R$ mil)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <table className="w-full text-xs font-data">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground sticky left-0 bg-card">Item</th>
                    {months.map((m) => (
                      <th key={m} className="text-right p-2 text-muted-foreground whitespace-nowrap">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projectedDRE.map((row) => {
                    const isNeg = row.values[0] < 0;
                    const isTotal = row.item === "Lucro Bruto" || row.item === "EBITDA" || row.item === "Lucro Líquido";
                    return (
                      <tr key={row.item} className={`border-b border-border/30 ${isTotal ? "font-semibold" : ""}`}>
                        <td className={`p-2 sticky left-0 bg-card ${isNeg ? "text-muted-foreground" : "text-foreground"}`}>{row.item}</td>
                        {row.values.map((v, i) => (
                          <td key={i} className={`text-right p-2 whitespace-nowrap ${isNeg ? "text-destructive/70" : isTotal ? "text-primary" : "text-foreground"}`}>
                            {v < 0 ? `(${Math.abs(v).toLocaleString("pt-BR")})` : v.toLocaleString("pt-BR")}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caixa">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-data">Projeção de Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={cashFlowProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => fmtK(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmtK(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="entradas" fill="hsl(var(--success))" fillOpacity={0.7} name="Entradas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" fill="hsl(var(--destructive))" fillOpacity={0.7} name="Saídas" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="saldo" stroke="hsl(var(--primary))" strokeWidth={2} name="Saldo Acumulado" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capgiro">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="text-base font-data">Necessidade vs Disponibilidade de Capital de Giro</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={capitalGiroProjection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => fmt(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="disponivel" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.15} name="Disponível" />
                  <Area type="monotone" dataKey="necessidade" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.15} name="Necessidade" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
