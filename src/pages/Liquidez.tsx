import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Wallet,
  Building2,
  Shield,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Area,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { GaugeChart } from "@/components/indicators/GaugeChart";
import {
  liquidityIndicators,
  liquidityHistory,
  liquidityHistoryMonths,
  workingCapital,
  debtData,
  amortizationSchedule,
  saasBenchmarks,
  balanceSheet,
} from "@/mock/indicatorsData";
import { formatCurrency, formatCompact } from "@/mock/financialData";
import { cn } from "@/lib/utils";

function StatusIcon({ status }: { status: "excellent" | "good" | "attention" }) {
  if (status === "excellent") return <CheckCircle2 className="h-5 w-5 text-success" />;
  if (status === "good") return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  return <XCircle className="h-5 w-5 text-destructive" />;
}

export default function Liquidez() {
  // Sparkline data
  const sparklineData = liquidityHistoryMonths.map((month, i) => ({
    month,
    current: liquidityHistory.current[i],
    quick: liquidityHistory.quick[i],
    immediate: liquidityHistory.immediate[i],
    general: liquidityHistory.general[i],
  }));

  const debtComposition = [
    { name: "Curto Prazo", value: debtData.shortTermDebt, color: "hsl(354, 100%, 64%)" },
    { name: "Longo Prazo", value: debtData.longTermDebt, color: "hsl(252, 100%, 69%)" },
  ];

  const wcgDiagram = [
    { name: "Contas a Receber", value: workingCapital.receivables, color: "hsl(187, 100%, 50%)" },
    { name: "Estoques", value: workingCapital.inventory, color: "hsl(152, 100%, 50%)" },
    { name: "(-) Fornecedores", value: workingCapital.suppliers, color: "hsl(354, 100%, 64%)" },
  ];

  const getDebtStatus = (indicator: string, value: number) => {
    const rules: Record<string, (v: number) => "excellent" | "good" | "attention"> = {
      "netDebtToEbitda": (v) => v < 1 ? "excellent" : v < 2 ? "good" : "attention",
      "debtRatio": (v) => v < 50 ? "excellent" : v < 65 ? "good" : "attention",
      "interestCoverage": (v) => v > 5 ? "excellent" : v > 3 ? "good" : "attention",
      "gaf": (v) => v < 1.5 ? "excellent" : v < 2 ? "good" : "attention",
    };
    return (rules[indicator] || (() => "good"))(value);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Indicadores Financeiros</h1>
        <p className="text-muted-foreground font-data">Liquidez, Capital de Giro, Dívida e Alavancagem</p>
      </div>

      <Tabs defaultValue="liquidity">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="liquidity" className="gap-2 data-[state=active]:bg-card">
            <Scale className="h-4 w-4" /> Liquidez
          </TabsTrigger>
          <TabsTrigger value="working-capital" className="gap-2 data-[state=active]:bg-card">
            <Wallet className="h-4 w-4" /> Capital de Giro
          </TabsTrigger>
          <TabsTrigger value="debt" className="gap-2 data-[state=active]:bg-card">
            <Building2 className="h-4 w-4" /> Dívida & Alavancagem
          </TabsTrigger>
        </TabsList>

        {/* ═══ LIQUIDEZ ═══ */}
        <TabsContent value="liquidity" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.entries(liquidityIndicators) as [string, typeof liquidityIndicators.current][]).map(([key, ind]) => {
              const status = ind.value >= ind.benchmark.excellent ? "excellent" : ind.value >= ind.benchmark.adequate ? "adequate" : "attention";
              return (
                <div key={key} className="rounded-xl border border-border bg-card p-5 flex flex-col items-center">
                  <GaugeChart
                    value={ind.value}
                    max={2.5}
                    benchmarkExcellent={ind.benchmark.excellent}
                    benchmarkAdequate={ind.benchmark.adequate}
                    label={ind.formula}
                  />
                  <p className="font-display font-semibold text-foreground mt-2">{ind.label}</p>
                  <Badge className={cn(
                    "mt-2",
                    status === "excellent" && "bg-success/20 text-success border-success/30",
                    status === "adequate" && "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
                    status === "attention" && "bg-destructive/20 text-destructive border-destructive/30",
                  )}>
                    {status === "excellent" ? "Excelente" : status === "adequate" ? "Adequado" : "Atenção"}
                  </Badge>
                </div>
              );
            })}
          </div>

          {/* Histórico 6 meses */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Evolução dos Índices — 6 Meses</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} domain={[0, 2]} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="current" name="Corrente" stroke="hsl(187, 100%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="quick" name="Seca" stroke="hsl(252, 100%, 69%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="immediate" name="Imediata" stroke="hsl(152, 100%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="general" name="Geral" stroke="hsl(45, 100%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Legend formatter={(v) => <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>{v}</span>} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ═══ CAPITAL DE GIRO ═══ */}
        <TabsContent value="working-capital" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
              <p className="text-sm text-muted-foreground">Capital de Giro Líquido (CGL)</p>
              <p className="text-3xl font-display font-bold text-primary">{formatCurrency(workingCapital.cgl)}</p>
              <p className="text-xs text-muted-foreground mt-1">AC - PC</p>
            </div>
            <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-5">
              <p className="text-sm text-muted-foreground">Necessidade de Capital de Giro (NCG)</p>
              <p className="text-3xl font-display font-bold text-secondary">{formatCurrency(workingCapital.ncg)}</p>
              <p className="text-xs text-muted-foreground mt-1">Recebíveis + Estoques - Fornecedores</p>
            </div>
            <div className="rounded-xl border border-success/30 bg-success/10 p-5">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">Saldo de Tesouraria</p>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              <p className="text-3xl font-display font-bold text-success">{formatCurrency(workingCapital.treasuryBalance)}</p>
              <p className="text-xs text-muted-foreground mt-1">CGL - NCG (Positivo ✓)</p>
            </div>
          </div>

          {/* Diagrama visual */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Composição da NCG</h3>
              <div className="space-y-4">
                {wcgDiagram.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-data text-muted-foreground">{item.name}</span>
                      <span className="font-data font-medium">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.value / workingCapital.receivables) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-border flex justify-between font-semibold">
                  <span>NCG</span>
                  <span className="text-secondary">{formatCurrency(workingCapital.ncg)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Fluxo do Capital de Giro</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-data font-medium">Ativo Circulante</p>
                      <p className="text-xs text-muted-foreground">Caixa + Recebíveis + Estoques</p>
                    </div>
                  </div>
                  <span className="font-display font-bold text-xl text-primary">{formatCurrency(balanceSheet.currentAssets)}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-3">
                    <ArrowDownRight className="h-6 w-6 text-destructive" />
                    <div>
                      <p className="font-data font-medium">Passivo Circulante</p>
                      <p className="text-xs text-muted-foreground">Obrigações de curto prazo</p>
                    </div>
                  </div>
                  <span className="font-display font-bold text-xl text-destructive">{formatCurrency(balanceSheet.currentLiabilities)}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-success/5 border border-success/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <div>
                      <p className="font-data font-bold">= Capital de Giro</p>
                    </div>
                  </div>
                  <span className="font-display font-bold text-xl text-success">{formatCurrency(workingCapital.cgl)}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ DÍVIDA & ALAVANCAGEM ═══ */}
        <TabsContent value="debt" className="space-y-6 mt-6">
          {/* Indicator Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Dívida Líquida/EBITDA", value: `${debtData.netDebtToEbitda}x`, sub: "< 2x = Saudável", key: "netDebtToEbitda", raw: debtData.netDebtToEbitda },
              { label: "Endividamento", value: `${debtData.debtRatio}%`, sub: "Passivo / Ativo Total", key: "debtRatio", raw: debtData.debtRatio },
              { label: "Cobertura de Juros", value: `${debtData.interestCoverage}x`, sub: "EBIT / Desp. Financeiras", key: "interestCoverage", raw: debtData.interestCoverage },
              { label: "GAF (Alavancagem Fin.)", value: `${debtData.gaf}x`, sub: "Grau de Alavancagem", key: "gaf", raw: debtData.gaf },
              { label: "GAO (Alavancagem Oper.)", value: `${debtData.gao}x`, sub: "Grau de Alavancagem", key: "gao", raw: debtData.gao },
              { label: "Dívida Líquida", value: formatCurrency(debtData.netDebt), sub: "Dívida Bruta - Caixa", key: "netDebt", raw: 0 },
            ].map((card) => {
              const status = card.key === "netDebt" ? "good" : getDebtStatus(card.key, card.raw);
              return (
                <div key={card.key} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="text-2xl font-display font-bold text-foreground mt-1">{card.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                    </div>
                    <StatusIcon status={status} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Composição da Dívida */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Composição da Dívida</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={debtComposition} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" nameKey="name">
                      {debtComposition.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Legend formatter={(v) => <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-sm mt-2 px-4">
                <span className="text-muted-foreground">Curto prazo: <strong className="text-destructive">33,7%</strong></span>
                <span className="text-muted-foreground">Longo prazo: <strong className="text-secondary">66,3%</strong></span>
              </div>
            </div>

            {/* Benchmark SaaS */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-lg mb-4">
                <Shield className="inline-block h-5 w-5 mr-2 text-primary" />
                Benchmark Setor SaaS
              </h3>
              <div className="space-y-3">
                {saasBenchmarks.map((b) => (
                  <div key={b.indicator} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={b.status} />
                      <span className="text-sm font-data">{b.indicator}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="font-data font-medium text-foreground">
                        {typeof b.company === "number" && b.company % 1 !== 0 ? b.company.toFixed(2) : b.company}
                        {b.indicator.includes("%") || b.indicator === "Endividamento" ? "%" : "x"}
                      </span>
                      <span className="font-data text-muted-foreground">
                        Setor: {typeof b.sector === "number" && b.sector % 1 !== 0 ? b.sector.toFixed(1) : b.sector}
                        {b.indicator.includes("%") || b.indicator === "Endividamento" ? "%" : "x"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cronograma de Amortização */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4">
              Cronograma de Amortização — 24 Meses
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={amortizationSchedule} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={10} tickLine={false} angle={-45} textAnchor="end" height={50} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(v) => formatCompact(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }}
                    formatter={(value: number) => [formatCurrency(value), ""]}
                  />
                  <Bar dataKey="principal" name="Principal" stackId="a" fill="hsl(187, 100%, 50%)" />
                  <Bar dataKey="interest" name="Juros" stackId="a" fill="hsl(354, 100%, 64%)" radius={[4, 4, 0, 0]} />
                  <Legend formatter={(v) => <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>{v}</span>} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
