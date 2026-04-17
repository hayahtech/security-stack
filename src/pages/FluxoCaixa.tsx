import { useState, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  TrendingUp,
  Wallet,
  AlertCircle,
  Brain,
  Lightbulb,
  SlidersHorizontal,
  Save,
  RotateCcw,
  X,
  BarChart3,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ComposedChart,
  Line,
  Cell,
  LineChart,
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

// ═══ DADOS PREDITIVOS 90 DIAS ═══
const predictiveData = [
  { day: 0, label: "Hoje", value: 4366500 },
  { day: 5, label: "D+5", value: 4180000 },
  { day: 10, label: "D+10", value: 4050000 },
  { day: 15, label: "D+15", value: 3820000 },
  { day: 20, label: "D+20", value: 3600000 },
  { day: 25, label: "D+25", value: 4200000 },
  { day: 30, label: "D+30", value: 4950000 },
  { day: 35, label: "D+35", value: 4600000 },
  { day: 40, label: "D+40", value: 3800000 },
  { day: 45, label: "D+45", value: 3100000 },
  { day: 50, label: "D+50", value: 3500000 },
  { day: 55, label: "D+55", value: 4200000 },
  { day: 60, label: "D+60", value: 5280000 },
  { day: 65, label: "D+65", value: 5100000 },
  { day: 70, label: "D+70", value: 4900000 },
  { day: 75, label: "D+75", value: 4720000 },
  { day: 80, label: "D+80", value: 5200000 },
  { day: 85, label: "D+85", value: 5700000 },
  { day: 90, label: "D+90", value: 6100000 },
];

// Sazonalidade histórica
const seasonalityData = [
  { month: "Jan", y2023: 3200000, y2024: 3800000, y2025: 4100000 },
  { month: "Fev", y2023: 3400000, y2024: 3600000, y2025: 4000000 },
  { month: "Mar", y2023: 3800000, y2024: 4200000, y2025: 4366500 },
  { month: "Abr", y2023: 3600000, y2024: 4500000, y2025: null },
  { month: "Mai", y2023: 4200000, y2024: 4800000, y2025: null },
  { month: "Jun", y2023: 3900000, y2024: 4100000, y2025: null },
];

interface SavedScenario {
  id: number;
  name: string;
  capex: number;
  revenueVar: number;
  anticipation: number;
  newMrr: number;
  minCash: number;
  cash90: number;
}

export default function FluxoCaixa() {
  const [method, setMethod] = useState<"direct" | "indirect">("direct");
  const [activeTab, setActiveTab] = useState<"predictive" | "classic">("predictive");

  // What-If state
  const [capex, setCapex] = useState(0);
  const [capexParcelas, setCapexParcelas] = useState("36");
  const [revenueVar, setRevenueVar] = useState(0);
  const [anticipation, setAnticipation] = useState(0);
  const [newMrr, setNewMrr] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);

  const data = method === "direct" ? cashFlowDirect : cashFlowIndirect;
  const avgDailyExpense = Math.abs(cashFlowDirect.totalExits) / 30;
  const daysOfCash = Math.round(cashFlowDirect.finalBalance / avgDailyExpense);
  const liquidityStatus = daysOfCash > 30 ? "green" : daysOfCash >= 15 ? "yellow" : "red";

  // Calcular curva simulada
  const simulatedData = useMemo(() => {
    if (!showSimulation) return null;
    const monthlyCapex = capex / parseInt(capexParcelas || "36");
    const monthlyRevenueImpact = (revenueVar / 100) * 4850000;
    const anticipationNet = anticipation * 0.982; // 1.8% custo
    const monthlyImpact = monthlyRevenueImpact - monthlyCapex + (anticipationNet / 3) + newMrr;

    return predictiveData.map((point) => {
      const monthFraction = point.day / 30;
      const impact = monthlyImpact * monthFraction;
      const anticipationBoost = point.day <= 15 ? anticipationNet * (1 - point.day / 30) : 0;
      return {
        ...point,
        simulated: Math.round(point.value + impact + anticipationBoost),
      };
    });
  }, [showSimulation, capex, capexParcelas, revenueVar, anticipation, newMrr]);

  const scenarioMinCash = useMemo(() => {
    if (!simulatedData) return 3100000;
    return Math.min(...simulatedData.map((d) => d.simulated));
  }, [simulatedData]);

  const scenarioCash90 = useMemo(() => {
    if (!simulatedData) return 6100000;
    return simulatedData[simulatedData.length - 1]?.simulated ?? 6100000;
  }, [simulatedData]);

  const scenarioViability = scenarioMinCash >= 2000000 ? "viable" : scenarioMinCash >= 500000 ? "caution" : "critical";

  const handleRecalculate = () => setShowSimulation(true);

  const handleSaveScenario = () => {
    if (savedScenarios.length >= 5) return;
    setSavedScenarios((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: `Cenário ${prev.length + 1}`,
        capex, revenueVar, anticipation, newMrr,
        minCash: scenarioMinCash,
        cash90: scenarioCash90,
      },
    ]);
  };

  const handleReset = () => {
    setCapex(0);
    setRevenueVar(0);
    setAnticipation(0);
    setNewMrr(0);
    setShowSimulation(false);
  };

  // Waterfall chart data
  const waterfallChartData = (() => {
    let cumulative = 0;
    return waterfallData.map((item) => {
      if (item.type === "initial") {
        cumulative = item.value;
        return { ...item, start: 0, end: item.value };
      } else if (item.type === "total") {
        return { ...item, start: 0, end: item.value };
      } else {
        const start = cumulative;
        cumulative += item.value;
        return { ...item, start, end: cumulative };
      }
    });
  })();

  // Chart data com zonas
  const chartData = showSimulation && simulatedData
    ? simulatedData.map((d) => ({
        ...d,
        original: d.value,
        simulated: d.simulated,
      }))
    : predictiveData.map((d) => ({ ...d, original: d.value }));

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
          <p className="text-muted-foreground font-data">{data.period}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setActiveTab("predictive")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "predictive" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <Brain className="inline-block h-4 w-4 mr-1.5" />
              Preditivo IA
            </button>
            <button
              onClick={() => setActiveTab("classic")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "classic" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <BarChart3 className="inline-block h-4 w-4 mr-1.5" />
              Clássico
            </button>
          </div>

          {activeTab === "classic" && (
            <div className="flex items-center gap-2">
              <Button variant={method === "direct" ? "default" : "outline"} size="sm" onClick={() => setMethod("direct")}>
                Método Direto
              </Button>
              <Button variant={method === "indirect" ? "default" : "outline"} size="sm" onClick={() => setMethod("indirect")}>
                Método Indireto
              </Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                Simular Cenário
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-display">
                  <Zap className="h-5 w-5 text-primary" />
                  Simulador de Impacto no Caixa
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-8">
                {/* CAPEX */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Novo Investimento (CAPEX)</label>
                  <Slider
                    value={[capex]}
                    onValueChange={([v]) => setCapex(v)}
                    max={5000000}
                    step={50000}
                    className="py-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>R$ 0</span>
                    <span className="text-sm font-data text-foreground">{formatCurrency(capex)}</span>
                    <span>R$ 5M</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Parcelas:</span>
                    <Select value={capexParcelas} onValueChange={setCapexParcelas}>
                      <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["12", "24", "36", "48", "60"].map((v) => (
                          <SelectItem key={v} value={v}>{v}x</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {capex > 0 && (
                      <span className="text-xs text-muted-foreground">
                        = {formatCurrency(capex / parseInt(capexParcelas))}/mês
                      </span>
                    )}
                  </div>
                </div>

                {/* Revenue Variation */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Variação na Receita</label>
                  <Slider
                    value={[revenueVar]}
                    onValueChange={([v]) => setRevenueVar(v)}
                    min={-30}
                    max={30}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>-30%</span>
                    <span className={cn("text-sm font-data", revenueVar >= 0 ? "text-success" : "text-destructive")}>
                      {revenueVar >= 0 ? "+" : ""}{revenueVar}%
                      ({revenueVar >= 0 ? "+" : ""}{formatCurrency(Math.abs((revenueVar / 100) * 4850000))}/mês)
                    </span>
                    <span>+30%</span>
                  </div>
                </div>

                {/* Anticipation */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Antecipação de Recebíveis</label>
                  <Slider
                    value={[anticipation]}
                    onValueChange={([v]) => setAnticipation(v)}
                    max={3000000}
                    step={50000}
                    className="py-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>R$ 0</span>
                    <span className="text-sm font-data text-foreground">{formatCurrency(anticipation)}</span>
                    <span>R$ 3M</span>
                  </div>
                  {anticipation > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Custo: 1,8%/mês → Desconto: {formatCurrency(anticipation * 0.018)}
                    </p>
                  )}
                </div>

                {/* New MRR */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Novo Contrato (MRR)</label>
                  <Input
                    type="number"
                    placeholder="Valor mensal recorrente"
                    value={newMrr || ""}
                    onChange={(e) => setNewMrr(Number(e.target.value))}
                    className="h-9"
                  />
                </div>

                <Button onClick={handleRecalculate} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Recalcular Projeção
                </Button>

                {/* Resultado */}
                {showSimulation && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <h4 className="font-display font-semibold text-sm">Resultado do Cenário</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Caixa mínimo</span>
                        <div className="text-right">
                          <span className="font-data font-semibold">{formatCurrency(scenarioMinCash)}</span>
                          <span className={cn("text-xs ml-2", scenarioMinCash < 3100000 ? "text-destructive" : "text-success")}>
                            ({scenarioMinCash >= 3100000 ? "+" : ""}{formatCurrency(scenarioMinCash - 3100000)})
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Caixa em 90 dias</span>
                        <div className="text-right">
                          <span className="font-data font-semibold">{formatCurrency(scenarioCash90)}</span>
                          <span className={cn("text-xs ml-2", scenarioCash90 >= 6100000 ? "text-success" : "text-destructive")}>
                            ({scenarioCash90 >= 6100000 ? "+" : ""}{formatCurrency(scenarioCash90 - 6100000)})
                          </span>
                        </div>
                      </div>
                      {capex > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Breakeven investimento</span>
                          <span className="font-data font-semibold">mês 14</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="font-semibold">Semáforo</span>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold",
                          scenarioViability === "viable" && "bg-success/20 text-success",
                          scenarioViability === "caution" && "bg-yellow-500/20 text-yellow-500",
                          scenarioViability === "critical" && "bg-destructive/20 text-destructive",
                        )}>
                          {scenarioViability === "viable" ? "🟢 VIÁVEL" : scenarioViability === "caution" ? "🟡 ATENÇÃO" : "🔴 CRÍTICO"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={handleSaveScenario} disabled={savedScenarios.length >= 5}>
                        <Save className="h-3.5 w-3.5 mr-1" />
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1" onClick={handleReset}>
                        Limpar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Saved scenarios */}
                {savedScenarios.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-display font-semibold text-sm">Cenários Salvos ({savedScenarios.length}/5)</h4>
                    {savedScenarios.map((sc) => (
                      <div key={sc.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-xs">
                        <div>
                          <p className="font-semibold">{sc.name}</p>
                          <p className="text-muted-foreground">
                            Min: {formatCompact(sc.minCash)} | 90d: {formatCompact(sc.cash90)}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setSavedScenarios((prev) => prev.filter((s) => s.id !== sc.id))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {activeTab === "predictive" ? (
        <>
          {/* ═══ ALERTAS PREDITIVOS ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Margem de Segurança OK</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Caixa mínimo previsto: <span className="font-data text-success">R$ 3.100.000</span> em 45 dias — dentro da margem
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Concentração de Saídas</p>
                <p className="text-xs text-muted-foreground mt-1">
                  R$ 1.840.000 em 5 dias entre D+12 e D+17 (folha + impostos)
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Sugestão da IA</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Antecipar R$ 420.000 em recebíveis para cobrir o vale de D+45
                </p>
              </div>
            </div>
          </div>

          {/* ═══ TERMÔMETRO 90 DIAS ═══ */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Termômetro de Caixa — 90 Dias
              </h3>
              {showSimulation && (
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-muted-foreground inline-block" style={{ borderTop: "2px dashed" }} />
                    Atual
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-primary inline-block" />
                    Simulado
                  </span>
                </div>
              )}
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <defs>
                    <linearGradient id="greenZone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(152, 100%, 50%)" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(152, 100%, 50%)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="simGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                  <XAxis dataKey="label" stroke="hsl(215, 20%, 55%)" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="hsl(215, 20%, 55%)"
                    fontSize={11}
                    tickFormatter={(v) => formatCompact(v)}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 35%, 13%)",
                      border: "1px solid hsl(222, 30%, 20%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "original" ? "Projeção Atual" : "Cenário Simulado",
                    ]}
                  />
                  {/* Zona crítica */}
                  <ReferenceArea y1={0} y2={500000} fill="hsl(354, 100%, 64%)" fillOpacity={0.08} />
                  {/* Zona atenção */}
                  <ReferenceArea y1={500000} y2={2000000} fill="hsl(45, 100%, 50%)" fillOpacity={0.06} />
                  {/* Linhas de referência */}
                  <ReferenceLine y={2000000} stroke="hsl(45, 100%, 50%)" strokeDasharray="5 5" strokeOpacity={0.5} />
                  <ReferenceLine y={500000} stroke="hsl(354, 100%, 64%)" strokeDasharray="5 5" strokeOpacity={0.5} />

                  <Area
                    type="monotone"
                    dataKey="original"
                    stroke={showSimulation ? "hsl(215, 20%, 55%)" : "hsl(152, 100%, 50%)"}
                    strokeWidth={showSimulation ? 2 : 2.5}
                    strokeDasharray={showSimulation ? "6 4" : undefined}
                    fill={showSimulation ? "transparent" : "url(#greenZone)"}
                    dot={{ r: 3, fill: showSimulation ? "hsl(215, 20%, 55%)" : "hsl(152, 100%, 50%)" }}
                  />
                  {showSimulation && (
                    <Area
                      type="monotone"
                      dataKey="simulated"
                      stroke="hsl(187, 100%, 50%)"
                      strokeWidth={2.5}
                      fill="url(#simGradient)"
                      dot={{ r: 4, fill: "hsl(187, 100%, 50%)" }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* Legenda de zonas */}
            <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-success/20 border border-success/40" />
                Zona Segura (&gt; R$ 2M)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-yellow-500/20 border border-yellow-500/40" />
                Zona de Atenção (R$ 500K–R$ 2M)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-destructive/20 border border-destructive/40" />
                Zona Crítica (&lt; R$ 500K)
              </span>
            </div>
          </div>

          {/* KPIs + Sazonalidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Saldo Atual</span>
              </div>
              <p className="text-2xl font-display font-bold text-primary">{formatCurrency(4366500)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <ArrowDownLeft className="h-5 w-5 text-destructive" />
                <span className="text-sm text-muted-foreground">Caixa Mínimo (90d)</span>
              </div>
              <p className="text-2xl font-display font-bold text-yellow-500">{formatCurrency(3100000)}</p>
              <p className="text-xs text-muted-foreground">em D+45</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <ArrowUpRight className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Caixa em 90 Dias</span>
              </div>
              <p className="text-2xl font-display font-bold text-success">{formatCurrency(6100000)}</p>
              <p className="text-xs text-success">+39,7% vs hoje</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-5 w-5 text-secondary" />
                <span className="text-sm text-muted-foreground">Dias de Caixa</span>
              </div>
              <p className="text-2xl font-display font-bold">{daysOfCash} dias</p>
              <div className={cn(
                "w-2 h-2 rounded-full inline-block mr-1.5",
                liquidityStatus === "green" && "bg-success",
                liquidityStatus === "yellow" && "bg-yellow-500",
                liquidityStatus === "red" && "bg-destructive",
              )} />
              <span className="text-xs text-muted-foreground">
                {liquidityStatus === "green" ? "Confortável" : liquidityStatus === "yellow" ? "Atenção" : "Crítico"}
              </span>
            </div>
          </div>

          {/* Sazonalidade */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-secondary" />
                Modelo de Sazonalidade — Comparativo 3 Anos
              </h3>
              <span className="text-xs bg-secondary/20 text-secondary px-3 py-1 rounded-full font-data">
                Padrão similar a Mar/2024 — desvio de 8,3%
              </span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seasonalityData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={11} tickFormatter={(v) => formatCompact(v)} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 35%, 13%)",
                      border: "1px solid hsl(222, 30%, 20%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number | null) => [value ? formatCurrency(value) : "—", ""]}
                  />
                  <Line type="monotone" dataKey="y2023" name="2023" stroke="hsl(215, 20%, 45%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="y2024" name="2024" stroke="hsl(45, 100%, 50%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="y2025" name="2025" stroke="hsl(152, 100%, 50%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(152, 100%, 50%)" }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ═══ VISTA CLÁSSICA (original) ═══ */}
          {/* Semáforo + Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={cn(
              "rounded-xl border p-5 flex items-center gap-4",
              liquidityStatus === "green" && "bg-success/10 border-success/30",
              liquidityStatus === "yellow" && "bg-yellow-500/10 border-yellow-500/30",
              liquidityStatus === "red" && "bg-destructive/10 border-destructive/30"
            )}>
              <div className={cn(
                "w-4 h-4 rounded-full animate-pulse",
                liquidityStatus === "green" && "bg-success",
                liquidityStatus === "yellow" && "bg-yellow-500",
                liquidityStatus === "red" && "bg-destructive"
              )} />
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
              <p className="text-2xl font-display font-bold text-success">{formatCurrency(cashFlowDirect.totalEntries)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-2">
                <ArrowDownLeft className="h-5 w-5 text-destructive" />
                <span className="text-sm text-muted-foreground">Total Saídas</span>
              </div>
              <p className="text-2xl font-display font-bold text-destructive">{formatCurrency(Math.abs(cashFlowDirect.totalExits))}</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Saldo Final</span>
              </div>
              <p className="text-2xl font-display font-bold text-primary">{formatCurrency(cashFlowDirect.finalBalance)}</p>
            </div>
          </div>

          {/* Tabela + Waterfall */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-display font-semibold text-lg mb-4">
                <TrendingUp className="inline-block h-5 w-5 mr-2 text-primary" />
                Gráfico de Cascata
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={10} tickLine={false} angle={-45} textAnchor="end" height={60} />
                    <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(value) => formatCompact(value)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }}
                      formatter={(value: number) => [formatCurrency(Math.abs(value)), ""]}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {waterfallData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.type === "positive" ? "hsl(152, 100%, 50%)" : entry.type === "negative" ? "hsl(354, 100%, 64%)" : "hsl(187, 100%, 50%)"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Projeções */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Bar dataKey="projected" radius={[2, 2, 0, 0]}>
                      {dailyCashProjection.slice(0, 15).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.projected >= 0 ? "hsl(152, 100%, 50%)" : "hsl(354, 100%, 64%)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

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
                      contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                    <Bar dataKey="inflow" name="Entradas" fill="hsl(152, 100%, 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outflow" name="Saídas" fill="hsl(354, 100%, 64%)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="breakeven" name="Ponto de Equilíbrio" stroke="hsl(45, 100%, 50%)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
