import {
  TrendingUp, Award, Target, Zap, BarChart3,
  Users, Percent, RefreshCcw, Heart, Flame,
  CheckCircle2, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GaugeChart } from "@/components/indicators/GaugeChart";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, BarChart, Bar, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  profitabilityKpis, healthCategories, kpiTargets,
  quarterlyComparison, rentabilityHistory,
} from "@/mock/kpisRiskData";
import { formatCurrency, formatCompact } from "@/mock/financialData";
import { cn } from "@/lib/utils";

export default function KpisAvancados() {
  const pk = profitabilityKpis;

  const mainKpis = [
    { label: "ROE", value: `${pk.roe}%`, sub: "Return on Equity", icon: Award, color: "border-primary/30 bg-primary/10", iconCls: "text-primary" },
    { label: "ROA", value: `${pk.roa}%`, sub: "Return on Assets", icon: BarChart3, color: "border-secondary/30 bg-secondary/10", iconCls: "text-secondary" },
    { label: "ROIC", value: `${pk.roic}%`, sub: "Return on Invested Capital", icon: Target, color: "border-success/30 bg-success/10", iconCls: "text-success" },
    { label: "ROCE", value: `${pk.roce}%`, sub: "Return on Capital Employed", icon: TrendingUp, color: "border-yellow-500/30 bg-yellow-500/10", iconCls: "text-yellow-500" },
  ];

  const secondaryKpis = [
    { label: "NPS", value: `${pk.nps}`, icon: Heart },
    { label: "Churn", value: `${pk.churnRate}%`, icon: Users },
    { label: "NRR", value: `${pk.nrr}%`, icon: RefreshCcw },
    { label: "Burn Multiple", value: `${pk.burnMultiple}x`, icon: Flame },
    { label: "MoM", value: `+${pk.momGrowth}%`, icon: TrendingUp },
    { label: "YoY", value: `+${pk.yoyGrowth}%`, icon: Zap },
    { label: "CAPEX/Rec", value: `${pk.capexToRevenue}%`, icon: Percent },
    { label: "Spread ROIC-WACC", value: `+${pk.roicWaccSpread}%`, icon: Target },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">KPIs de Rentabilidade</h1>
        <p className="text-muted-foreground font-data">ROE, ROA, ROIC, ROCE e métricas SaaS avançadas</p>
      </div>

      {/* Health Score + Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-primary/30 bg-card p-5 flex flex-col items-center justify-center lg:col-span-1">
          <GaugeChart value={pk.healthScore} max={100} benchmarkExcellent={80} benchmarkAdequate={60} label="Saúde Financeira" size={140} />
          <Badge className="mt-2 bg-success/20 text-success border-success/30">Excelente</Badge>
        </div>
        {healthCategories.map((cat) => (
          <div key={cat.category} className={cn(
            "rounded-xl border p-5 flex flex-col items-center justify-center",
            cat.status === "excellent" ? "border-success/30 bg-success/10" : "border-yellow-500/30 bg-yellow-500/10"
          )}>
            {cat.status === "excellent" ? <CheckCircle2 className="h-8 w-8 text-success mb-2" /> : <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />}
            <p className="font-display font-semibold text-foreground">{cat.category}</p>
            <p className="text-2xl font-display font-bold">{cat.score}</p>
          </div>
        ))}
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainKpis.map((kpi) => (
          <div key={kpi.label} className={cn("rounded-xl border p-5", kpi.color)}>
            <kpi.icon className={cn("h-6 w-6 mb-3", kpi.iconCls)} />
            <p className="text-3xl font-display font-bold text-foreground">{kpi.value}</p>
            <p className="text-sm text-muted-foreground font-data mt-1">{kpi.label}</p>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
            <Badge className="mt-2 bg-success/20 text-success border-success/30 text-xs">Excelente ✓✓</Badge>
          </div>
        ))}
      </div>

      {/* ROIC vs WACC */}
      <div className="p-4 rounded-lg bg-success/5 border border-success/20 flex items-center gap-3">
        <Zap className="h-6 w-6 text-success flex-shrink-0" />
        <div>
          <p className="font-display font-semibold text-success">ROIC {pk.roic}% vs WACC {pk.wacc}% = Spread +{pk.roicWaccSpread}%</p>
          <p className="text-sm text-muted-foreground">A empresa está criando valor significativo — ROIC supera o custo do capital em mais de 76 pontos percentuais.</p>
        </div>
      </div>

      {/* Secondary KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {secondaryKpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-3 text-center">
            <kpi.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-display font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta vs Realizado */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Meta vs Realizado</h3>
          <div className="space-y-3">
            {kpiTargets.map((kpi) => {
              const achieved = kpi.kpi === "Churn" ? kpi.actual <= kpi.target : kpi.actual >= kpi.target;
              const pct = kpi.kpi === "Churn"
                ? Math.min(((kpi.target - kpi.actual) / kpi.target) * 100 + 100, 100)
                : Math.min((kpi.actual / kpi.target) * 100, 150);
              return (
                <div key={kpi.kpi}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-data">{kpi.kpi}</span>
                    <div className="flex gap-3">
                      <span className={cn("font-data font-medium", achieved ? "text-success" : "text-destructive")}>
                        {kpi.actual}{kpi.unit}
                      </span>
                      <span className="text-muted-foreground">meta: {kpi.target}{kpi.unit}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", achieved ? "bg-success" : "bg-destructive")}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quarterly Comparison */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Evolução Trimestral</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyComparison} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                <XAxis dataKey="quarter" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }} formatter={(v: number) => [`${v}%`, ""]} />
                <Bar dataKey="roe" name="ROE" fill="hsl(187, 100%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="roa" name="ROA" fill="hsl(252, 100%, 69%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="roic" name="ROIC" fill="hsl(152, 100%, 50%)" radius={[4, 4, 0, 0]} />
                <Legend formatter={(v) => <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>{v}</span>} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold text-lg mb-4">ROE & ROA — Últimos 6 Meses</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rentabilityHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} />
              <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }} formatter={(v: number) => [`${v}%`, ""]} />
              <Line type="monotone" dataKey="roe" name="ROE" stroke="hsl(187, 100%, 50%)" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="roa" name="ROA" stroke="hsl(252, 100%, 69%)" strokeWidth={3} dot={{ r: 4 }} />
              <Legend formatter={(v) => <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>{v}</span>} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
