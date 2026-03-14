import { useState, useEffect, useMemo } from "react";
import {
  agingBuckets, pddDebtors, macroScenarios, currentClosing, pddHistory,
  totalEAD, totalECL, totalPddBalance, coverageRatio, nplRatio, weightedECL,
  type PddDebtor, type AgingBucket,
} from "@/mock/pddData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Play, CheckCircle2, Download, FileText, Calculator, BookOpen,
  AlertTriangle, TrendingUp, TrendingDown, Shield, Eye, Info,
  ChevronUp, ChevronDown, Minus, Settings, BarChart3, Brain,
  RefreshCcw, Plus, X, GitBranch,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine,
} from "recharts";

// ── Motor ECL ──

function calcStage(debtor: PddDebtor): 1 | 2 | 3 {
  if (debtor.daysOverdue > 90) return 3;
  if (debtor.internalRating === "D") return 3;
  if (debtor.internalRating === "CCC" && debtor.daysOverdue > 60) return 3;
  if (debtor.isRestructured) return 2;
  if (debtor.isOnWatchlist) return 2;
  if (debtor.daysOverdue > 30) return 2;
  if (debtor.internalRating === "CCC") return 2;
  if (debtor.internalRating === "B" &&
    ["AAA", "AA", "A", "BBB", "BB"].includes(debtor.ratingPreviousMonth)) return 2;
  return 1;
}

function calcSICRReasons(debtor: PddDebtor): string[] {
  const reasons: string[] = [];
  if (debtor.isRestructured) reasons.push("Operação reestruturada / forbearance");
  if (debtor.isOnWatchlist) reasons.push("Inclusão na watchlist de monitoramento");
  if (debtor.daysOverdue > 30) reasons.push(`Atraso de ${debtor.daysOverdue} dias (limite Stage 2: 30d)`);
  if (debtor.internalRating === "CCC") reasons.push("Rating interno rebaixado para CCC");
  debtor.recentNegativeEvents.forEach(e => reasons.push(e));
  return reasons;
}

function calcPD(daysOverdue: number, buckets: AgingBucket[]): number {
  if (daysOverdue === 0) return buckets[0].pdPercent;
  const bucket = buckets.find(b => daysOverdue >= b.daysFrom && (b.daysTo === null || daysOverdue <= b.daysTo));
  return bucket ? bucket.pdPercent : buckets[buckets.length - 1].pdPercent;
}

function calcLGD(debtor: PddDebtor, buckets: AgingBucket[]): number {
  const baseBucket = buckets.find(b => debtor.daysOverdue >= b.daysFrom && (b.daysTo === null || debtor.daysOverdue <= b.daysTo)) ?? buckets[0];
  const baseLGD = baseBucket.lgdPercent;
  const collateralCoverage = debtor.hasCollateral ? Math.min(debtor.collateralValue / debtor.ead, 0.5) : 0;
  return Math.max(baseLGD - collateralCoverage * 0.3, 0.05);
}

function calcECL(debtor: PddDebtor, buckets: AgingBucket[]): number {
  const pd = calcPD(debtor.daysOverdue, buckets);
  const lgd = calcLGD(debtor, buckets);
  return debtor.ead * pd * lgd;
}

function calcEarlyWarningScore(debtor: PddDebtor): number {
  let score = 0;
  if (debtor.daysOverdue > 0 && debtor.daysOverdue <= 30) score += 15;
  else if (debtor.daysOverdue > 30 && debtor.daysOverdue <= 60) score += 35;
  else if (debtor.daysOverdue > 60 && debtor.daysOverdue <= 90) score += 55;
  else if (debtor.daysOverdue > 90) score += 75;
  if (debtor.isOnWatchlist) score += 15;
  if (debtor.isRestructured) score += 10;
  if (["CCC", "D"].includes(debtor.internalRating)) score += 20;
  else if (debtor.internalRating === "B") score += 10;
  score += debtor.recentNegativeEvents.length * 5;
  if (debtor.hasCollateral && debtor.collateralValue > debtor.ead * 0.5) score = Math.max(score - 10, 0);
  return Math.min(score, 100);
}

function applyMultipliers(
  debtors: PddDebtor[], buckets: AgingBucket[],
  pdMult: number, lgdMult: number
): number {
  return debtors.reduce((sum, d) => {
    const pd = Math.min(calcPD(d.daysOverdue, buckets) * pdMult, 1);
    const lgd = Math.min(calcLGD(d, buckets) * lgdMult, 1);
    return sum + d.ead * pd * lgd;
  }, 0);
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => (v * 100).toFixed(1) + "%";
const fmtDate = (s: string) => new Date(s).toLocaleDateString("pt-BR");

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
};

// ── Component ──

export default function PDD() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("carteira");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDebtor, setSelectedDebtor] = useState<PddDebtor | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Staging aggregations
  const stage1 = useMemo(() => pddDebtors.filter(d => d.stage === 1), []);
  const stage2 = useMemo(() => pddDebtors.filter(d => d.stage === 2), []);
  const stage3 = useMemo(() => pddDebtors.filter(d => d.stage === 3), []);

  const stage1EAD = useMemo(() => stage1.reduce((s, d) => s + d.ead, 0), [stage1]);
  const stage2EAD = useMemo(() => stage2.reduce((s, d) => s + d.ead, 0), [stage2]);
  const stage3EAD = useMemo(() => stage3.reduce((s, d) => s + d.ead, 0), [stage3]);

  const stage1ECL = useMemo(() => stage1.reduce((s, d) => s + d.ecl, 0), [stage1]);
  const stage2ECL = useMemo(() => stage2.reduce((s, d) => s + d.ecl, 0), [stage2]);
  const stage3ECL = useMemo(() => stage3.reduce((s, d) => s + d.ecl, 0), [stage3]);

  // Variation vs previous month
  const prevPdd = pddHistory[10]?.totalPdd ?? 0;
  const pddVariation = prevPdd > 0 ? ((totalPddBalance - prevPdd) / prevPdd) * 100 : 0;

  const costOfCredit = (totalECL / totalEAD) * 12;

  // Stacked bar data (last 6 months)
  const stagingBarData = pddHistory.slice(-6).map(h => ({
    month: h.month,
    "Stage 1": h.stage1Pdd / 1000,
    "Stage 2": h.stage2Pdd / 1000,
    "Stage 3": h.stage3Pdd / 1000,
  }));

  // Charts data
  const evolutionData = pddHistory.map(h => ({
    month: h.month,
    stage1: h.stage1Pdd,
    stage2: h.stage2Pdd,
    stage3: h.stage3Pdd,
    total: h.totalPdd,
  }));

  const coverageNplData = pddHistory.map(h => ({
    month: h.month,
    pdd: h.totalPdd,
    coverage: +(h.coverageRatio * 100).toFixed(1),
    npl: +(h.nplRatio * 100).toFixed(1),
  }));

  // KPI definitions
  const kpis = [
    { label: "EAD Total", value: fmt(totalEAD), icon: Shield, color: "text-foreground" },
    {
      label: "PDD Requerida (ECL)", value: fmt(totalPddBalance), icon: AlertTriangle,
      color: "text-destructive",
      badge: <Badge variant={pddVariation > 0 ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0">
        {pddVariation > 0 ? <ChevronUp className="h-3 w-3 inline" /> : <ChevronDown className="h-3 w-3 inline" />}
        {Math.abs(pddVariation).toFixed(1)}%
      </Badge>,
    },
    {
      label: "Cobertura (Coverage)", value: fmtPct(coverageRatio), icon: TrendingUp,
      color: coverageRatio >= 0.20 ? "text-success" : coverageRatio >= 0.15 ? "text-yellow-400" : "text-destructive",
    },
    { label: "NPL Ratio (Stage 3)", value: fmtPct(nplRatio), icon: BarChart3, color: "text-destructive" },
    { label: "Custo de Crédito", value: (costOfCredit * 100).toFixed(1) + "% a.a.", icon: Calculator, color: "text-foreground" },
    {
      label: "ECL Ponderado Macro", value: fmt(weightedECL), icon: Brain, color: "text-foreground",
      badge: <Badge variant="outline" className="text-[10px] px-1.5 py-0">3 Cenários</Badge>,
    },
  ];

  const stageConfigs = [
    {
      stage: 1, label: "Stage 1", subtitle: "12-Month ECL", desc: "Ativo performando",
      ead: stage1EAD, ecl: stage1ECL, count: stage1.length,
      borderColor: "border-success/30", barColor: "bg-success", textColor: "text-success",
    },
    {
      stage: 2, label: "Stage 2", subtitle: "Lifetime ECL — SICR", desc: "Risco aumentou significativamente",
      ead: stage2EAD, ecl: stage2ECL, count: stage2.length,
      borderColor: "border-yellow-500/30", barColor: "bg-yellow-500", textColor: "text-yellow-400",
    },
    {
      stage: 3, label: "Stage 3", subtitle: "Lifetime ECL — Impaired", desc: "Evidência objetiva de perda",
      ead: stage3EAD, ecl: stage3ECL, count: stage3.length,
      borderColor: "border-destructive/30", barColor: "bg-destructive", textColor: "text-destructive",
    },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* ═══ SEÇÃO A — Header ═══ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            PDD — Provisão para Devedores Duvidosos
          </h1>
          <p className="text-sm text-muted-foreground">
            Motor ECL · CPC 38/48 · IFRS 9 · Staging Automático
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs gap-1.5 py-1 px-3">
            <span>Fechamento Mar/2025</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-400">
              Aguard. Aprovação
            </Badge>
          </Badge>

          <Button
            variant="ghost" size="sm"
            onClick={() => toast({ title: "Motor ECL executado!", description: "PDD recalculada para todos os devedores." })}
          >
            <Play className="h-4 w-4 mr-1" /> Rodar Motor PDD
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={() => toast({ title: "Fechamento aprovado!", description: "Lançamento contábil gerado automaticamente." })}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar Fechamento
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => toast({ title: "Exportando Nota Explicativa..." })}>
                <FileText className="h-4 w-4 mr-2" /> Nota Explicativa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: "Exportando Memória de Cálculo..." })}>
                <Calculator className="h-4 w-4 mr-2" /> Memória de Cálculo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: "Exportando Lançamento Contábil..." })}>
                <BookOpen className="h-4 w-4 mr-2" /> Lançamento Contábil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ═══ SEÇÃO B — KPI Strip ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <kpi.icon className={`h-4 w-4 text-muted-foreground`} />
                {kpi.badge}
              </div>
              <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ═══ SEÇÃO C — Painel de Staging IFRS 9 ═══ */}
      <Card className="border-primary/30 bg-primary/5 rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Distribuição por Stage — IFRS 9 / CPC 38</CardTitle>
              <Badge variant="secondary" className="text-[10px]">Automático</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stageConfigs.map((sc) => (
              <Card key={sc.stage} className={`border ${sc.borderColor} bg-card`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${sc.textColor}`}>{sc.label}</p>
                      <p className="text-[10px] text-muted-foreground">{sc.subtitle}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{sc.count} devedores</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">{sc.desc}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">EAD</span>
                      <span className="font-medium">{fmt(sc.ead)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">ECL</span>
                      <span className={`font-medium ${sc.textColor}`}>{fmt(sc.ecl)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">% Portfólio</span>
                      <span className="font-medium">{((sc.ead / totalEAD) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={(sc.ead / totalEAD) * 100} className={`h-1.5 [&>div]:${sc.barColor}`} />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mini stacked bar — last 6 months */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Evolução por Stage — Últimos 6 meses</p>
            {isLoading ? (
              <Skeleton className="h-[100px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={stagingBarData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v: number) => v.toFixed(0) + "K"} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={40} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="Stage 1" stackId="s" fill="hsl(142,76%,36%)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Stage 2" stackId="s" fill="hsl(45,100%,50%)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Stage 3" stackId="s" fill="hsl(354,100%,64%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ═══ Tabs Placeholder ═══ */}
      <Card className="bg-card border-border">
        <CardContent className="p-8 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Tabs do módulo PDD (Carteira, Parâmetros, Cenários, Trilha Contábil) serão adicionadas em seguida.
          </p>
        </CardContent>
      </Card>

      {/* ═══ SEÇÃO E — Gráficos de Evolução ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico 1 — Evolução do Saldo PDD */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evolução do Saldo PDD — 12 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v: number) => "R$" + (v / 1000).toFixed(0) + "K"} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={65} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = { stage1: "Stage 1", stage2: "Stage 2", stage3: "Stage 3", total: "Total" };
                      return [fmt(value), labels[name] || name];
                    }}
                  />
                  <Area type="monotone" dataKey="stage1" stackId="pdd" fill="hsl(142,76%,36%)" fillOpacity={0.6} stroke="hsl(142,76%,36%)" />
                  <Area type="monotone" dataKey="stage2" stackId="pdd" fill="hsl(45,100%,50%)" fillOpacity={0.6} stroke="hsl(45,100%,50%)" />
                  <Area type="monotone" dataKey="stage3" stackId="pdd" fill="hsl(354,100%,64%)" fillOpacity={0.6} stroke="hsl(354,100%,64%)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico 2 — Coverage Ratio & NPL */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coverage Ratio & NPL — 12 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={coverageNplData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" tickFormatter={(v: number) => "R$" + (v / 1000).toFixed(0) + "K"} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={65} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => v.toFixed(0) + "%"} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={45} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar yAxisId="left" dataKey="pdd" fill="hsl(217,91%,60%)" fillOpacity={0.5} name="PDD Total" radius={[2, 2, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="coverage" stroke="hsl(142,76%,36%)" strokeWidth={2} name="Coverage %" dot={{ r: 2 }} />
                  <Line yAxisId="right" type="monotone" dataKey="npl" stroke="hsl(354,100%,64%)" strokeWidth={2} name="NPL %" dot={{ r: 2 }} />
                  <ReferenceLine yAxisId="right" y={20} strokeDasharray="4 4" stroke="hsl(45,100%,50%)" label={{ value: "Meta 20%", fontSize: 10, fill: "hsl(45,100%,50%)" }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
