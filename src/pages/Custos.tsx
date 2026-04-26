import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import { TrendingDown, DollarSign, Target, Users, Scissors, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { costBreakdown, breakevenData, costCenters, costEvolution, efficiencyMetrics, costReductionOpportunities, heatmapData } from "@/mock/costData";

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;
const fmtK = (v: number) => `R$ ${(v / 1000).toFixed(0)}K`;

const pieColors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--success))", "hsl(187 80% 60%)", "hsl(252 80% 80%)"];

const statusIcons: Record<string, typeof CheckCircle2> = {
  "Concluído": CheckCircle2,
  "Em andamento": Clock,
  "Em análise": AlertTriangle,
  "Planejado": Target,
};

export default function Custos() {
  const totalCustos = costBreakdown.fixos.total + costBreakdown.variaveis.total + costBreakdown.semivariaveis.total;

  const classificationPie = [
    { name: "Fixos", value: costBreakdown.fixos.total },
    { name: "Variáveis", value: costBreakdown.variaveis.total },
    { name: "Semivariáveis", value: costBreakdown.semivariaveis.total },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Custos & Despesas</h1>
        <p className="text-muted-foreground font-data text-sm">Gestão e análise de custos operacionais</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Custo Total", value: fmtBRL(totalCustos), icon: DollarSign, accent: "text-primary" },
          { label: "Ponto de Equilíbrio", value: fmtK(breakevenData.receitaMinima), icon: Target, accent: "text-secondary" },
          { label: "Margem Segurança", value: `${breakevenData.margemSeguranca}%`, icon: TrendingDown, accent: "text-success" },
          { label: "Custo/Cliente", value: fmtBRL(efficiencyMetrics.custoPerCliente), icon: Users, accent: "text-muted-foreground" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-border/50 bg-card/80">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-data">{item.label}</p>
                    <p className={`text-xl font-bold font-data ${item.accent}`}>{item.value}</p>
                  </div>
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="classificacao" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="classificacao">Classificação</TabsTrigger>
          <TabsTrigger value="centros">Centros de Custo</TabsTrigger>
          <TabsTrigger value="heatmap">Mapa de Calor</TabsTrigger>
          <TabsTrigger value="reducao">Redução de Custos</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="classificacao">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-data">Composição dos Custos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={classificationPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {classificationPie.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {[
              { title: "Custos Fixos", data: costBreakdown.fixos, color: "primary" },
              { title: "Custos Variáveis", data: costBreakdown.variaveis, color: "secondary" },
            ].map((section) => (
              <Card key={section.title} className="border-border/50 bg-card/80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-data">{section.title}</CardTitle>
                    <span className={`text-sm font-bold font-data text-${section.color}`}>{fmtBRL(section.data.total)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {section.data.items.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-data">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span>{fmtBRL(item.value)} ({item.pct}%)</span>
                      </div>
                      <Progress value={item.pct} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Breakeven */}
          <Card className="border-border/50 bg-card/80 mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-data">Análise de Ponto de Equilíbrio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-data">
                  <span className="text-muted-foreground">Receita Mínima (Break-even)</span>
                  <span className="text-destructive font-semibold">{fmtBRL(breakevenData.receitaMinima)}</span>
                </div>
                <div className="relative h-6 bg-muted/50 rounded-full overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-destructive/30 rounded-full" style={{ width: `${(breakevenData.receitaMinima / breakevenData.receitaAtual) * 100}%` }} />
                  <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: "100%", background: "linear-gradient(90deg, hsl(var(--success)) 0%, hsl(var(--primary)) 100%)", opacity: 0.3 }} />
                  <div className="absolute top-0 h-full w-0.5 bg-destructive" style={{ left: `${(breakevenData.receitaMinima / breakevenData.receitaAtual) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm font-data">
                  <span className="text-muted-foreground">Receita Atual</span>
                  <span className="text-success font-semibold">{fmtBRL(breakevenData.receitaAtual)}</span>
                </div>
                <p className="text-xs text-muted-foreground font-data">Margem de segurança: <span className="text-success font-semibold">{breakevenData.margemSeguranca}%</span> — receita pode cair até {breakevenData.margemSeguranca}% antes do prejuízo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="centros">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50 bg-card/80">
              <CardHeader><CardTitle className="text-base font-data">Distribuição por Centro de Custo</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={costCenters} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, pct }) => `${name} ${pct}%`}>
                      {costCenters.map((c, i) => <Cell key={i} fill={pieColors[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtBRL(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/80">
              <CardHeader><CardTitle className="text-base font-data">Detalhamento</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {costCenters.map((c, i) => (
                  <div key={c.name} className="space-y-1">
                    <div className="flex justify-between text-sm font-data">
                      <span className="text-foreground">{c.name}</span>
                      <span className="font-semibold">{fmtBRL(c.value)} <span className="text-muted-foreground text-xs">({c.pct}%)</span></span>
                    </div>
                    <Progress value={c.pct * 3.4} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="heatmap">
          <Card className="border-border/50 bg-card/80">
            <CardHeader><CardTitle className="text-base font-data">Mapa de Calor de Gastos (R$ mil)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-data">Categoria</TableHead>
                    <TableHead className="font-data text-center">Jan/25</TableHead>
                    <TableHead className="font-data text-center">Fev/25</TableHead>
                    <TableHead className="font-data text-center">Mar/25</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatmapData.map((row) => {
                    const max = Math.max(row.jan, row.fev, row.mar);
                    const getIntensity = (v: number) => {
                      const ratio = v / max;
                      if (ratio > 0.9) return "bg-destructive/30 text-destructive";
                      if (ratio > 0.7) return "bg-yellow-500/20 text-yellow-400";
                      return "bg-success/20 text-success";
                    };
                    return (
                      <TableRow key={row.category}>
                        <TableCell className="font-data text-sm">{row.category}</TableCell>
                        {[row.jan, row.fev, row.mar].map((v, i) => (
                          <TableCell key={i} className="text-center">
                            <span className={`inline-block px-3 py-1 rounded font-data text-xs font-semibold ${getIntensity(v)}`}>{v}</span>
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reducao">
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-data flex items-center gap-2"><Scissors className="w-4 h-4" /> Oportunidades de Redução</CardTitle>
                <Badge className="bg-success/20 text-success border-success/30">Potencial: -R$ 163.000/mês</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-data">Iniciativa</TableHead>
                    <TableHead className="font-data text-right">Economia/mês</TableHead>
                    <TableHead className="font-data text-right">Redução</TableHead>
                    <TableHead className="font-data text-right">ROI</TableHead>
                    <TableHead className="font-data">Responsável</TableHead>
                    <TableHead className="font-data">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costReductionOpportunities.map((opp) => {
                    const Icon = statusIcons[opp.status] || Clock;
                    return (
                      <TableRow key={opp.id}>
                        <TableCell className="font-data text-sm font-medium">{opp.initiative}</TableCell>
                        <TableCell className="font-data text-sm text-right text-success font-semibold">-{fmtBRL(opp.saving)}</TableCell>
                        <TableCell className="font-data text-sm text-right">{opp.pctSaving}%</TableCell>
                        <TableCell className="font-data text-sm text-right text-primary">{opp.roi}</TableCell>
                        <TableCell className="font-data text-xs text-muted-foreground">{opp.responsible}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs gap-1">
                            <Icon className="w-3 h-3" />{opp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs font-data text-muted-foreground">
                  <strong className="text-foreground">Economia anual projetada:</strong> R$ 1.956.000 — equivalente a{" "}
                  <span className="text-success font-semibold">6,9% da receita</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolucao">
          <Card className="border-border/50 bg-card/80">
            <CardHeader><CardTitle className="text-base font-data">Custos vs Receita (R$ mil)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={costEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="custos" fill="hsl(var(--destructive))" fillOpacity={0.6} name="Custos" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="receita" stroke="hsl(var(--success))" strokeWidth={2} name="Receita" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
