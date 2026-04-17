import { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Table2,
  MessageSquare,
  RotateCcw,
  Percent,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  months,
  budgetLines as initialLines,
  currentMonthIndex,
  computeForecastRolling,
  deviationComments,
  type BudgetLine,
} from "@/mock/budgetData";
import { formatCurrency, formatCompact } from "@/mock/financialData";
import { cn } from "@/lib/utils";

export default function Orcamento() {
  const [lines, setLines] = useState<BudgetLine[]>(initialLines);
  const [forecastMode, setForecastMode] = useState(false);
  const [growthRate, setGrowthRate] = useState(2);

  const displayLines = forecastMode ? computeForecastRolling(lines) : lines;

  const revenueLines = displayLines.filter((l) => l.type === "revenue");
  const expenseLines = displayLines.filter((l) => l.type === "expense");

  const totalBudgetedRevenue = revenueLines.reduce((s, l) => s + l.budgeted.reduce((a, b) => a + b, 0), 0);
  const totalBudgetedExpense = expenseLines.reduce((s, l) => s + l.budgeted.reduce((a, b) => a + b, 0), 0);
  const totalActualRevenue = revenueLines.reduce((s, l) => s + l.actual.slice(0, currentMonthIndex + 1).reduce((a, b) => a + b, 0), 0);
  const totalActualExpense = expenseLines.reduce((s, l) => s + l.actual.slice(0, currentMonthIndex + 1).reduce((a, b) => a + b, 0), 0);

  const originalTotal = initialLines.reduce((s, l) => {
    const t = l.budgeted.reduce((a, b) => a + b, 0);
    return l.type === "revenue" ? s + t : s - t;
  }, 0);

  const forecastTotal = computeForecastRolling(lines).reduce((s, l) => {
    const t = l.budgeted.reduce((a, b) => a + b, 0);
    return l.type === "revenue" ? s + t : s - t;
  }, 0);

  // Budget adherence (YTD)
  const budgetedYTDRev = revenueLines.reduce((s, l) => s + l.budgeted.slice(0, currentMonthIndex + 1).reduce((a, b) => a + b, 0), 0);
  const adherence = budgetedYTDRev > 0 ? (totalActualRevenue / budgetedYTDRev) * 100 : 100;

  // Chart data
  const monthlyChartData = months.map((m, i) => ({
    month: m,
    budgeted: revenueLines.reduce((s, l) => s + l.budgeted[i], 0),
    actual: i <= currentMonthIndex ? revenueLines.reduce((s, l) => s + l.actual[i], 0) : 0,
  }));

  // Top deviations
  const deviations = displayLines
    .map((line) => {
      const budYTD = line.budgeted.slice(0, currentMonthIndex + 1).reduce((s, v) => s + v, 0);
      const actYTD = line.actual.slice(0, currentMonthIndex + 1).reduce((s, v) => s + v, 0);
      const diff = actYTD - budYTD;
      const pct = budYTD > 0 ? (diff / budYTD) * 100 : 0;
      return { ...line, budYTD, actYTD, diff, pct };
    })
    .filter((d) => d.actYTD > 0)
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

  const handleCellEdit = (lineId: string, monthIdx: number, value: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? { ...l, budgeted: l.budgeted.map((v, i) => (i === monthIdx ? Math.max(0, value) : v)) }
          : l
      )
    );
  };

  const applyUniformGrowth = () => {
    const rate = growthRate / 100;
    setLines((prev) =>
      prev.map((l) => ({
        ...l,
        budgeted: l.budgeted.map((v, i) => (i === 0 ? v : Math.round(l.budgeted[0] * Math.pow(1 + rate, i)))),
      }))
    );
  };

  const getStatus = (pct: number, type: "revenue" | "expense") => {
    const absPct = Math.abs(pct);
    const isGood = type === "revenue" ? pct >= 0 : pct <= 0;
    if (absPct < 5) return { icon: <CheckCircle2 className="h-4 w-4 text-success" />, label: "OK", color: "text-success" };
    if (absPct < 15) return { icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />, label: "Atenção", color: "text-yellow-500" };
    return { icon: <AlertTriangle className="h-4 w-4 text-destructive" />, label: "Crítico", color: "text-destructive" };
  };

  const renderBudgetTable = (tableLines: BudgetLine[], title: string) => (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h4 className="font-display font-semibold">{title}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground sticky left-0 bg-card min-w-[160px]">Conta</th>
              {months.map((m, i) => (
                <th key={m} className={cn("text-right px-2 py-2 font-semibold min-w-[90px]", i <= currentMonthIndex ? "text-foreground" : "text-muted-foreground")}>
                  {m}
                  {i < currentMonthIndex && <span className="text-[9px] block text-success">realizado</span>}
                  {i === currentMonthIndex && <span className="text-[9px] block text-primary">atual</span>}
                </th>
              ))}
              <th className="text-right px-3 py-2 font-semibold text-foreground min-w-[100px]">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {tableLines.map((line) => {
              const total = line.budgeted.reduce((s, v) => s + v, 0);
              return (
                <tr key={line.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium sticky left-0 bg-card">{line.label}</td>
                  {line.budgeted.map((val, i) => (
                    <td key={i} className="px-2 py-1 text-right">
                      {i < currentMonthIndex && !forecastMode ? (
                        <span className="font-data text-muted-foreground">{formatCompact(val)}</span>
                      ) : (
                        <input
                          type="text"
                          className="w-full text-right bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none font-data px-1 py-0.5 rounded"
                          defaultValue={formatCompact(val)}
                          onBlur={(e) => {
                            const raw = e.target.value.replace(/[^\d]/g, "");
                            const num = parseInt(raw) || 0;
                            const multiplier = e.target.value.toLowerCase().includes("m") ? 1000000 : e.target.value.toLowerCase().includes("k") ? 1000 : 1;
                            handleCellEdit(line.id, i, num * multiplier);
                          }}
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-data font-semibold">{formatCompact(total)}</td>
                </tr>
              );
            })}
            {/* Total row */}
            <tr className="border-t-2 border-border bg-muted/30 font-semibold">
              <td className="px-3 py-2 sticky left-0 bg-muted/30">TOTAL</td>
              {months.map((_, i) => {
                const colTotal = tableLines.reduce((s, l) => s + l.budgeted[i], 0);
                return <td key={i} className="px-2 py-2 text-right font-data">{formatCompact(colTotal)}</td>;
              })}
              <td className="px-3 py-2 text-right font-data">{formatCompact(tableLines.reduce((s, l) => s + l.budgeted.reduce((a, b) => a + b, 0), 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Orçamento 2025</h1>
          <p className="text-muted-foreground font-data">Budget anual com controle orçado vs realizado</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setForecastMode(false)}
              className={cn("px-4 py-2 text-sm font-medium transition-colors", !forecastMode ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}
            >
              Orçamento Original
            </button>
            <button
              onClick={() => setForecastMode(true)}
              className={cn("px-4 py-2 text-sm font-medium transition-colors", forecastMode ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground")}
            >
              <RotateCcw className="inline h-3.5 w-3.5 mr-1" />
              Forecast Rolling
            </button>
          </div>
        </div>
      </div>

      {/* Forecast diff banner */}
      {forecastMode && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-yellow-500 shrink-0" />
          <p className="text-sm">
            Forecast rolling projeta <span className="font-data font-semibold">{formatCurrency(forecastTotal)}</span> vs orçamento de{" "}
            <span className="font-data">{formatCurrency(originalTotal)}</span>{" "}
            <span className={cn("font-semibold", forecastTotal < originalTotal ? "text-destructive" : "text-success")}>
              ({((forecastTotal - originalTotal) / originalTotal * 100).toFixed(1)}%)
            </span>
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Receita Orçada (Ano)</p>
          <p className="text-2xl font-display font-bold">{formatCompact(totalBudgetedRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Despesa Orçada (Ano)</p>
          <p className="text-2xl font-display font-bold text-destructive">{formatCompact(totalBudgetedExpense)}</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/5 p-5">
          <p className="text-sm text-muted-foreground">Receita Realizada (YTD)</p>
          <p className="text-2xl font-display font-bold text-success">{formatCurrency(totalActualRevenue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Aderência ao Budget</p>
          <p className="text-2xl font-display font-bold">{adherence.toFixed(1)}%</p>
          <Progress value={Math.min(adherence, 100)} className="h-1.5 mt-2" />
        </div>
      </div>

      <Tabs defaultValue="budget" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="budget" className="font-data"><Table2 className="h-4 w-4 mr-1.5" />Construção</TabsTrigger>
          <TabsTrigger value="monthly" className="font-data"><ArrowUpDown className="h-4 w-4 mr-1.5" />Orçado vs Real</TabsTrigger>
          <TabsTrigger value="charts" className="font-data"><BarChart3 className="h-4 w-4 mr-1.5" />Gráficos</TabsTrigger>
          <TabsTrigger value="deviations" className="font-data"><MessageSquare className="h-4 w-4 mr-1.5" />Desvios</TabsTrigger>
        </TabsList>

        {/* ═══ CONSTRUÇÃO DO ORÇAMENTO ═══ */}
        <TabsContent value="budget" className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => setLines(initialLines)}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Usar histórico como base
            </Button>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="w-20 h-8 text-xs"
              />
              <Button size="sm" variant="outline" onClick={applyUniformGrowth}>
                <Percent className="h-3.5 w-3.5 mr-1" /> Crescimento uniforme
              </Button>
            </div>
          </div>

          {renderBudgetTable(revenueLines, "RECEITAS")}
          {renderBudgetTable(expenseLines, "DESPESAS")}
        </TabsContent>

        {/* ═══ ORÇADO VS REALIZADO ═══ */}
        <TabsContent value="monthly" className="space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Conta</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Orçado (YTD)</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Realizado (YTD)</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Variação (R$)</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Variação (%)</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deviations.map((d) => {
                    const status = getStatus(d.pct, d.type);
                    const isGoodVariation = d.type === "revenue" ? d.diff >= 0 : d.diff <= 0;
                    return (
                      <tr key={d.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{d.label}</td>
                        <td className="px-4 py-3 text-right font-data">{formatCurrency(d.budYTD)}</td>
                        <td className="px-4 py-3 text-right font-data">{formatCurrency(d.actYTD)}</td>
                        <td className={cn("px-4 py-3 text-right font-data font-semibold", isGoodVariation ? "text-success" : "text-destructive")}>
                          {d.diff >= 0 ? "+" : ""}{formatCurrency(d.diff)}
                        </td>
                        <td className={cn("px-4 py-3 text-right font-data font-semibold", isGoodVariation ? "text-success" : "text-destructive")}>
                          {d.pct >= 0 ? "+" : ""}{d.pct.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("inline-flex items-center gap-1 text-xs", status.color)}>
                            {status.icon} {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ═══ GRÁFICOS ═══ */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar chart */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Receita: Orçado × Realizado</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} />
                    <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} tickFormatter={(v) => formatCompact(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Legend />
                    <Bar dataKey="budgeted" name="Orçado" fill="hsl(215, 20%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Realizado" fill="hsl(187, 100%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Adherence gauge */}
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center">
              <h3 className="font-display font-semibold text-lg mb-4">Aderência ao Budget</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={[{ value: Math.min(adherence, 100), fill: adherence >= 90 ? "hsl(152, 100%, 50%)" : "hsl(45, 100%, 50%)" }]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(222, 30%, 20%)" }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-3xl font-display font-bold mt-[-40px]">{adherence.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">Meta: &gt;90%</p>
            </div>
          </div>

          {/* Top 5 deviations */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Top 5 Maiores Desvios</h3>
            <div className="space-y-3">
              {deviations.slice(0, 5).map((d) => {
                const isGood = d.type === "revenue" ? d.diff >= 0 : d.diff <= 0;
                return (
                  <div key={d.id} className="flex items-center gap-4">
                    <span className="text-sm w-44 truncate font-medium">{d.label}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", isGood ? "bg-success" : "bg-destructive")}
                        style={{ width: `${Math.min(Math.abs(d.pct) * 3, 100)}%` }}
                      />
                    </div>
                    <span className={cn("text-sm font-data font-semibold w-16 text-right", isGood ? "text-success" : "text-destructive")}>
                      {d.pct >= 0 ? "+" : ""}{d.pct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground w-28 text-right">{formatCurrency(d.diff)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* ═══ ANÁLISE DE DESVIOS ═══ */}
        <TabsContent value="deviations" className="space-y-4">
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">{deviations.filter((d) => Math.abs(d.pct) > 10).length} contas</span> com desvio superior a 10% requerem justificativa do gestor
            </p>
          </div>

          {deviations
            .filter((d) => Math.abs(d.pct) > 5)
            .map((d) => {
              const comment = deviationComments.find((c) => c.lineId === d.id);
              const isGood = d.type === "revenue" ? d.diff >= 0 : d.diff <= 0;
              return (
                <div key={d.id} className={cn("rounded-xl border bg-card p-5", Math.abs(d.pct) > 15 ? "border-destructive/30" : "border-yellow-500/30")}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-display font-semibold">{d.label}</h4>
                      <p className="text-xs text-muted-foreground">{d.group}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-lg font-data font-bold", isGood ? "text-success" : "text-destructive")}>
                        {d.pct >= 0 ? "+" : ""}{d.pct.toFixed(1)}%
                      </span>
                      <p className="text-xs text-muted-foreground">{formatCurrency(d.diff)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span>Orçado: <span className="font-data">{formatCurrency(d.budYTD)}</span></span>
                    <span>Realizado: <span className="font-data">{formatCurrency(d.actYTD)}</span></span>
                  </div>
                  {comment ? (
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold">{comment.author}</span>
                        <Badge className={cn("text-[9px]", comment.status === "approved" ? "bg-success/20 text-success" : "bg-yellow-500/20 text-yellow-500")}>
                          {comment.status === "approved" ? "Aprovado pelo CFO" : "Pendente"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground italic">"{comment.comment}"</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-yellow-500/30 p-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs text-yellow-500">Justificativa pendente — aguardando gestor responsável</span>
                    </div>
                  )}
                </div>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
