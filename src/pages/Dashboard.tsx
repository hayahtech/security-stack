import { useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Users, Target, Percent, Wallet, PiggyBank, Receipt,
  AlertTriangle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  currentMonth, monthlyEvolution, companyInfo, kpis, formatCurrency, formatCompact, formatPercentage,
} from "@/mock/financialData";
import { Skeleton } from "@/components/ui/skeleton";

// Sparkline data generators
const spark = (base: number, variance: number, n = 8) =>
  Array.from({ length: n }, (_, i) => ({ v: base + (Math.random() - 0.4) * variance * (1 + i * 0.1) }));

const scorecards = [
  { title: "MRR", value: "R$ 4,85M", change: 2.1, spark: spark(4600000, 200000), icon: DollarSign, variant: "default" as const },
  { title: "ARR", value: "R$ 58,2M", change: 28.4, spark: spark(48000000, 3000000), icon: TrendingUp, variant: "success" as const },
  { title: "Margem EBITDA", value: "40,4%", change: 0.5, spark: spark(38, 3), icon: Percent, variant: "success" as const },
  { title: "Margem Líquida", value: "26,1%", change: 1.2, spark: spark(24, 2), icon: PiggyBank, variant: "success" as const },
  { title: "Clientes Ativos", value: "847", change: 1.2, spark: spark(820, 20), icon: Users, variant: "default" as const },
  { title: "Ticket Médio", value: "R$ 5.727", change: 2.1, spark: spark(5400, 300), icon: Receipt, variant: "default" as const },
  { title: "Churn Rate", value: "2,3%", change: -0.3, spark: spark(2.5, 0.5), icon: Wallet, variant: "warning" as const },
  { title: "NRR", value: "118%", change: 1.5, spark: spark(115, 3), icon: Target, variant: "success" as const },
];

const revenueComposition = [
  { name: "Enterprise", value: 2432400, pct: 50.2 },
  { name: "Professional", value: 1828750, pct: 37.7 },
  { name: "Basic", value: 589680, pct: 12.1 },
];

const pieColors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--success))"];

const alerts = [
  { id: 1, type: "critical", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", msg: "3 títulos vencem hoje (R$ 284.000)", time: "Agora" },
  { id: 2, type: "warning", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10", msg: "Fluxo de caixa previsto negativo em 18 dias", time: "Projeção" },
  { id: 3, type: "critical", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", msg: "Cliente 'Empresa XYZ' com 45 dias de atraso (R$ 87.000)", time: "Cobrança" },
  { id: 4, type: "success", icon: CheckCircle2, color: "text-success", bg: "bg-success/10", msg: "Meta de margem EBITDA atingida no mês", time: "Hoje" },
  { id: 5, type: "warning", icon: TrendingUp, color: "text-yellow-400", bg: "bg-yellow-500/10", msg: "CMV subiu 2,1% vs mês anterior", time: "Análise" },
  { id: 6, type: "success", icon: CheckCircle2, color: "text-success", bg: "bg-success/10", msg: "Pagamento recebido: TechCorp R$ 156.000", time: "1h atrás" },
];

const ebitdaMarginData = monthlyEvolution.map((m) => ({
  month: m.month,
  margin: parseFloat(((m.netProfit / m.grossRevenue) * 100 + 15).toFixed(1)),
}));

export default function Dashboard() {
  const [loading, setLoading] = useState(false);

  const todaySummary = {
    saldo: 4366500,
    entradasHoje: 342000,
    saidasHoje: 187000,
    alertasCriticos: 2,
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard Executivo</h1>
          <p className="text-muted-foreground font-data text-sm">Visão geral financeira • {companyInfo.segment} • Março 2025</p>
        </div>
        <Badge className="bg-success/20 text-success border-success/30 gap-1">
          <Zap className="w-3 h-3" /> Score: 87/100
        </Badge>
      </div>

      {/* Section A: Resumo do Dia */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Saldo Atual", value: formatCurrency(todaySummary.saldo), icon: Wallet, accent: "text-primary", arrow: null },
          { label: "Entradas Hoje", value: formatCurrency(todaySummary.entradasHoje), icon: ArrowUpRight, accent: "text-success", arrow: "up" },
          { label: "Saídas Hoje", value: formatCurrency(todaySummary.saidasHoje), icon: ArrowDownRight, accent: "text-destructive", arrow: "down" },
          { label: "Alertas Críticos", value: todaySummary.alertasCriticos.toString(), icon: AlertTriangle, accent: "text-destructive", arrow: null },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-border/50 bg-card/80">
              <CardContent className="pt-3 pb-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-data">{item.label}</p>
                    <p className={`text-lg font-bold font-data ${item.accent}`}>{item.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${item.accent === "text-destructive" ? "bg-destructive/10" : item.accent === "text-success" ? "bg-success/10" : "bg-primary/10"}`}>
                    <Icon className={`w-4 h-4 ${item.accent}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section B: Scorecards with Sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {scorecards.map((sc) => {
          const Icon = sc.icon;
          const isPos = sc.change > 0;
          return (
            <Card key={sc.title} className="border-border/50 bg-card/80 hover:border-primary/30 transition-colors">
              <CardContent className="pt-3 pb-3 px-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground font-data">{sc.title}</p>
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold font-data text-foreground">{sc.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1">
                    {isPos ? <TrendingUp className="w-3 h-3 text-success" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
                    <span className={`text-xs font-data ${isPos ? "text-success" : "text-destructive"}`}>
                      {isPos ? "+" : ""}{sc.change}%
                    </span>
                  </div>
                  {/* Mini sparkline */}
                  <svg width="48" height="16" className="opacity-60">
                    <polyline
                      fill="none"
                      stroke={isPos ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                      strokeWidth="1.5"
                      points={sc.spark.map((p, i) => {
                        const min = Math.min(...sc.spark.map(s => s.v));
                        const max = Math.max(...sc.spark.map(s => s.v));
                        const range = max - min || 1;
                        return `${i * 7},${16 - ((p.v - min) / range) * 14}`;
                      }).join(" ")}
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section C: Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue 12m */}
        <Card className="border-border/50 bg-card/80 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-data">Receita — Últimos 12 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyEvolution}>
                <defs>
                  <linearGradient id="gGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(187,100%,50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(187,100%,50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152,100%,50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152,100%,50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatCompact} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => formatCompact(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="grossRevenue" name="Faturamento Bruto" stroke="hsl(187,100%,50%)" strokeWidth={2} fill="url(#gGross)" />
                <Area type="monotone" dataKey="netProfit" name="Lucro Líquido" stroke="hsl(152,100%,50%)" strokeWidth={2} fill="url(#gProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Composition Donut */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-data">Composição da Receita</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={revenueComposition} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, pct }) => `${name} ${pct}%`}>
                  {revenueComposition.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              {revenueComposition.map((r, i) => (
                <div key={r.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: pieColors[i] }} />
                  <span className="text-[10px] text-muted-foreground font-data">{r.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EBITDA Margin Line + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/80 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-data">Margem EBITDA — Evolução 12 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ebitdaMarginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[30, 50]} tickFormatter={(v) => `${v}%`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="margin" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} name="Margem EBITDA" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Section D: Alerts & Tasks */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-data flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" /> Alertas & Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {alerts.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.id} className={`flex items-start gap-2 p-2 rounded-lg ${a.bg}`}>
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-data text-foreground leading-tight">{a.msg}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
