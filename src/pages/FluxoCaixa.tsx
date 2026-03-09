import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  TrendingUp,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Line,
  Cell,
} from "recharts";
import {
  cashFlowDirect,
  cashFlowIndirect,
  waterfallData,
  dailyCashProjection,
  quarterlyProjection,
} from "@/mock/cashFlowData";
import { formatCurrency, formatCompact } from "@/mock/financialData";
import { cn } from "@/lib/utils";

export default function FluxoCaixa() {
  const [method, setMethod] = useState<"direct" | "indirect">("direct");
  const data = method === "direct" ? cashFlowDirect : cashFlowIndirect;

  // Calcular dias de caixa
  const avgDailyExpense = Math.abs(cashFlowDirect.totalExits) / 30;
  const daysOfCash = Math.round(cashFlowDirect.finalBalance / avgDailyExpense);
  const liquidityStatus =
    daysOfCash > 30 ? "green" : daysOfCash >= 15 ? "yellow" : "red";

  // Dados para waterfall chart acumulado
  let cumulative = 0;
  const waterfallChartData = waterfallData.map((item) => {
    const start = cumulative;
    if (item.type === "initial") {
      cumulative = item.value;
      return { ...item, start: 0, end: item.value };
    } else if (item.type === "total") {
      return { ...item, start: 0, end: item.value };
    } else {
      cumulative += item.value;
      return { ...item, start, end: cumulative };
    }
  });

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Fluxo de Caixa
          </h1>
          <p className="text-muted-foreground font-data">{data.period}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={method === "direct" ? "default" : "outline"}
            size="sm"
            onClick={() => setMethod("direct")}
            className={method === "direct" ? "bg-primary text-primary-foreground" : ""}
          >
            Método Direto
          </Button>
          <Button
            variant={method === "indirect" ? "default" : "outline"}
            size="sm"
            onClick={() => setMethod("indirect")}
            className={method === "indirect" ? "bg-secondary text-secondary-foreground" : ""}
          >
            Método Indireto
          </Button>
        </div>
      </div>

      {/* Semáforo de Liquidez + Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={cn(
            "rounded-xl border p-5 flex items-center gap-4",
            liquidityStatus === "green" && "bg-success/10 border-success/30",
            liquidityStatus === "yellow" && "bg-yellow-500/10 border-yellow-500/30",
            liquidityStatus === "red" && "bg-destructive/10 border-destructive/30"
          )}
        >
          <div
            className={cn(
              "w-4 h-4 rounded-full animate-pulse",
              liquidityStatus === "green" && "bg-success glow-success",
              liquidityStatus === "yellow" && "bg-yellow-500",
              liquidityStatus === "red" && "bg-destructive glow-destructive"
            )}
          />
          <div>
            <p className="text-sm text-muted-foreground font-data">Liquidez</p>
            <p className="text-xl font-display font-bold">{daysOfCash} dias</p>
            <p className="text-xs text-muted-foreground">de caixa disponível</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpRight className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Total Entradas</span>
          </div>
          <p className="text-2xl font-display font-bold text-success">
            {formatCurrency(cashFlowDirect.totalEntries)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <ArrowDownLeft className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Total Saídas</span>
          </div>
          <p className="text-2xl font-display font-bold text-destructive">
            {formatCurrency(Math.abs(cashFlowDirect.totalExits))}
          </p>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Saldo Final</span>
          </div>
          <p className="text-2xl font-display font-bold text-primary">
            {formatCurrency(cashFlowDirect.finalBalance)}
          </p>
        </div>
      </div>

      {/* Detalhamento do Método */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela de Fluxo */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            {method === "direct" ? "Fluxo Direto" : "Fluxo Indireto"}
          </h3>

          {method === "direct" ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-success mb-2">ENTRADAS</p>
                {cashFlowDirect.entries.map((item) => (
                  <div key={item.id} className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-success font-data">{formatCurrency(item.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t border-border mt-2 font-semibold">
                  <span>Total Entradas</span>
                  <span className="text-success">{formatCurrency(cashFlowDirect.totalEntries)}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-destructive mb-2">SAÍDAS</p>
                {cashFlowDirect.exits.map((item) => (
                  <div key={item.id} className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-destructive font-data">({formatCurrency(Math.abs(item.value))})</span>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t border-border mt-2 font-semibold">
                  <span>Total Saídas</span>
                  <span className="text-destructive">({formatCurrency(Math.abs(cashFlowDirect.totalExits))})</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-primary/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo Inicial</span>
                  <span className="font-data">{formatCurrency(cashFlowDirect.initialBalance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo do Período</span>
                  <span className="font-data text-success">{formatCurrency(cashFlowDirect.periodBalance)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Saldo Final</span>
                  <span className="text-primary">{formatCurrency(cashFlowDirect.finalBalance)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-primary mb-2">ATIVIDADES OPERACIONAIS</p>
                {cashFlowIndirect.operationalActivities.map((item) => (
                  <div key={item.id} className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={cn("font-data", item.value >= 0 ? "text-success" : "text-destructive")}>
                      {item.value >= 0 ? formatCurrency(item.value) : `(${formatCurrency(Math.abs(item.value))})`}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-secondary mb-2">ATIVIDADES DE INVESTIMENTO</p>
                {cashFlowIndirect.investmentActivities.map((item) => (
                  <div key={item.id} className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-destructive font-data">({formatCurrency(Math.abs(item.value))})</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-yellow-500 mb-2">ATIVIDADES DE FINANCIAMENTO</p>
                {cashFlowIndirect.financingActivities.map((item) => (
                  <div key={item.id} className="flex justify-between py-1 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={cn("font-data", item.value >= 0 ? "text-success" : "text-destructive")}>
                      {item.value >= 0 ? formatCurrency(item.value) : `(${formatCurrency(Math.abs(item.value))})`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-2 border-primary/30 space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Saldo Final</span>
                  <span className="text-primary">{formatCurrency(cashFlowIndirect.finalBalance)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gráfico Waterfall */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            <TrendingUp className="inline-block h-5 w-5 mr-2 text-primary" />
            Gráfico de Cascata
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={10}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={12}
                  tickFormatter={(value) => formatCompact(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 35%, 13%)",
                    border: "1px solid hsl(222, 30%, 20%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(Math.abs(value)), ""]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.type === "positive"
                          ? "hsl(152, 100%, 50%)"
                          : entry.type === "negative"
                          ? "hsl(354, 100%, 64%)"
                          : "hsl(187, 100%, 50%)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Calendário e Projeção */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendário 30 dias */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            <Calendar className="inline-block h-5 w-5 mr-2 text-secondary" />
            Projeção 30 Dias
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyCashProjection.slice(0, 15)} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(215, 20%, 55%)" fontSize={10} tickLine={false} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={10} tickFormatter={(v) => formatCompact(v)} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 35%, 13%)",
                    border: "1px solid hsl(222, 30%, 20%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), ""]}
                />
                <Bar dataKey="projected" radius={[2, 2, 0, 0]}>
                  {dailyCashProjection.slice(0, 15).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.projected >= 0 ? "hsl(152, 100%, 50%)" : "hsl(354, 100%, 64%)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projeção Trimestral */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            <AlertCircle className="inline-block h-5 w-5 mr-2 text-yellow-500" />
            Projeção Trimestral + Ponto de Equilíbrio
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={quarterlyProjection} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={10} tickFormatter={(v) => formatCompact(v)} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 35%, 13%)",
                    border: "1px solid hsl(222, 30%, 20%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), ""]}
                />
                <Bar dataKey="inflow" name="Entradas" fill="hsl(152, 100%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Saídas" fill="hsl(354, 100%, 64%)" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="breakeven"
                  name="Ponto de Equilíbrio"
                  stroke="hsl(45, 100%, 50%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
