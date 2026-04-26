import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  FolderOpen, DollarSign, TrendingUp, TrendingDown, AlertTriangle, AlertCircle, CheckCircle2,
  Clock, Circle, Eye, Plus, Brain, Download, FileText, FileSpreadsheet, ArrowUp, ArrowDown, Info,
  Shield, Users, Target,
} from "lucide-react";
import { GaugeChart } from "@/components/indicators/GaugeChart";
import { projectsData, type Project } from "@/mock/projectsData";
import { cn } from "@/lib/utils";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatCurrencyK = (v: number) =>
  `R$ ${(v / 1000).toFixed(0)}K`;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR");

const statusMap: Record<string, { label: string; color: string }> = {
  on_track: { label: "No prazo", color: "bg-success/20 text-success border-success/30" },
  over_budget: { label: "Acima orçamento", color: "bg-destructive/20 text-destructive border-destructive/30" },
  at_risk: { label: "Em risco", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
  completed: { label: "Concluído", color: "bg-primary/20 text-primary border-primary/30" },
  paused: { label: "Pausado", color: "bg-muted text-muted-foreground border-border" },
};

const categoryMap: Record<string, { label: string; color: string }> = {
  implementation: { label: "Implementação", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  consulting: { label: "Consultoria", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  development: { label: "Desenvolvimento", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  audit: { label: "Auditoria", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  infrastructure: { label: "Infraestrutura", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
};

function calcEVM(project: Project) {
  const last = project.burnHistory[project.burnHistory.length - 1];
  const BAC = project.budgeted;
  const AC = last.actual;
  const EV = last.earned;
  const PV = last.planned;
  const CPI = AC > 0 ? EV / AC : 1;
  const SPI = PV > 0 ? EV / PV : 1;
  const EAC = CPI > 0 ? BAC / CPI : BAC;
  const VAC = BAC - EAC;
  const ETC = EAC - AC;
  const TCPI = (BAC - AC) > 0 ? (BAC - EV) / (BAC - AC) : 1;
  return { CPI, SPI, EAC, VAC, ETC, TCPI };
}

function simulateScenario(project: Project, speedFactor: number, costFactor: number) {
  const { CPI, SPI } = calcEVM(project);
  const adjustedCPI = CPI * (costFactor / 100);
  const adjustedSPI = SPI * (speedFactor / 100);
  const newEAC = adjustedCPI > 0 ? project.budgeted / adjustedCPI : project.budgeted;
  const newMargin = ((project.budgeted - newEAC) / project.budgeted) * 100;
  const remainingWork = 1 - project.progress / 100;
  const daysRemaining = adjustedSPI > 0 ? (remainingWork / adjustedSPI) * 30 : 999;
  const newEndDate = new Date();
  newEndDate.setDate(newEndDate.getDate() + Math.round(daysRemaining));
  return {
    newEAC,
    newMargin,
    newEndDate: newEndDate.toISOString().split("T")[0],
    adjustedCPI,
    adjustedSPI,
    feasible: adjustedCPI > 0.7 && adjustedSPI > 0.7,
  };
}

type SortField = "name" | "budgeted" | "cpi" | "spi" | "aiRiskScore" | "progress" | "margin";
type SortDir = "asc" | "desc";
type FilterTab = "all" | "active" | "at_risk" | "completed";

const riskColor = (score: number) =>
  score <= 40 ? "text-success" : score <= 70 ? "text-yellow-400" : "text-destructive";

const riskBadgeColor = (score: number) =>
  score <= 40
    ? "bg-success/20 text-success border-success/30"
    : score <= 70
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-destructive/20 text-destructive border-destructive/30";

const evmColor = (v: number) =>
  v >= 1.0 ? "text-success" : v >= 0.85 ? "text-yellow-400" : "text-destructive";

const SCATTER_COLORS: Record<string, string> = {
  on_track: "hsl(152, 100%, 50%)",
  over_budget: "hsl(354, 100%, 64%)",
  at_risk: "hsl(45, 100%, 50%)",
  completed: "hsl(217, 91%, 60%)",
  paused: "hsl(215, 20%, 65%)",
};

const probabilityLabel: Record<string, string> = { low: "Baixa", medium: "Média", high: "Alta" };
const impactLabel: Record<string, string> = { low: "Baixo", medium: "Médio", high: "Alto" };
const probabilityIdx: Record<string, number> = { high: 0, medium: 1, low: 2 };
const impactIdx: Record<string, number> = { low: 0, medium: 1, high: 2 };

const matrixColors = [
  ["bg-yellow-500/20", "bg-yellow-500/30", "bg-destructive/20"],
  ["bg-success/20", "bg-yellow-500/20", "bg-yellow-500/30"],
  ["bg-success/30", "bg-success/20", "bg-yellow-500/20"],
];

export default function ProjetosFinanceiros() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sortField, setSortField] = useState<SortField>("aiRiskScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [speedFactor, setSpeedFactor] = useState(100);
  const [costFactor, setCostFactor] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setSpeedFactor(100);
    setCostFactor(100);
  }, [selectedProject]);

  // filtering
  const filtered = useMemo(() => {
    let list = [...projectsData];
    if (activeTab === "active") list = list.filter((p) => ["on_track", "at_risk", "over_budget"].includes(p.status));
    if (activeTab === "at_risk") list = list.filter((p) => ["at_risk", "over_budget"].includes(p.status));
    if (activeTab === "completed") list = list.filter((p) => p.status === "completed");
    list.sort((a, b) => {
      const av = a[sortField] as number;
      const bv = b[sortField] as number;
      if (typeof av === "string") return sortDir === "asc" ? (av as string).localeCompare(bv as unknown as string) : (bv as unknown as string).localeCompare(av as string);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [activeTab, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3 inline ml-1" /> : <ArrowDown className="w-3 h-3 inline ml-1" />) : null;

  // KPIs
  const totalBudgeted = projectsData.reduce((a, p) => a + p.budgeted, 0);
  const totalEAC = projectsData.reduce((a, p) => a + p.eac, 0);
  const weightedMargin = projectsData.reduce((a, p) => a + p.aiPredictedMargin * p.budgeted, 0) / totalBudgeted;
  const avgCPI = projectsData.reduce((a, p) => a + p.cpi, 0) / projectsData.length;
  const avgSPI = projectsData.reduce((a, p) => a + p.spi, 0) / projectsData.length;
  const riskCount = projectsData.filter((p) => ["over_budget", "at_risk"].includes(p.status)).length;

  // AI panel
  const alertProjects = projectsData.filter((p) => p.aiRiskScore > 55);
  const avgCompletion = projectsData.reduce((a, p) => a + p.aiCompletionProbability, 0) / projectsData.length;
  const starCount = projectsData.filter((p) => p.cpi >= 1 && p.spi >= 1).length;
  const riskQuadrant = projectsData.filter((p) => (p.cpi < 1 || p.spi < 1) && p.status !== "completed" && p.aiRiskScore <= 70).length;
  const criticalCount = projectsData.filter((p) => p.aiRiskScore > 70).length;

  // Scatter data
  const scatterData = projectsData.map((p) => ({
    x: p.spi,
    y: p.cpi,
    z: p.budgeted / 10000,
    name: p.name,
    status: p.status,
  }));

  // Bar chart data
  const barData = projectsData.map((p) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + "…" : p.name,
    budgeted: p.budgeted,
    eac: p.eac,
  }));

  // Scenario simulation
  const scenario = useMemo(() => {
    if (!selectedProject) return null;
    return simulateScenario(selectedProject, speedFactor, costFactor);
  }, [selectedProject, speedFactor, costFactor]);

  // Team cost chart
  const teamCostData = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.team.map((m) => ({
      name: m.name.split(" ")[0],
      custo: Math.round(m.costPerHour * (m.allocation / 100) * 160),
    }));
  }, [selectedProject]);

  // Burn rate (weekly delta)
  const burnRateData = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.burnHistory.slice(1).map((e, i) => ({
      week: e.week,
      burnRate: e.actual - selectedProject.burnHistory[i].actual,
    }));
  }, [selectedProject]);

  const rechartTooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Gestão de Projetos Financeiros</h1>
          <p className="text-muted-foreground font-data text-sm">Engine EVM + Análise Preditiva</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1 text-xs"><Plus className="w-3 h-3" /> Novo Projeto</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 text-xs"><Download className="w-3 h-3" /> Exportar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="text-xs gap-2"><FileText className="w-3 h-3" /> Exportar PDF</DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2"><FileSpreadsheet className="w-3 h-3" /> Exportar Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* FILTER TABS */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all" className="text-xs">Todos ({projectsData.length})</TabsTrigger>
          <TabsTrigger value="active" className="text-xs">Ativos ({projectsData.filter((p) => ["on_track", "at_risk", "over_budget"].includes(p.status)).length})</TabsTrigger>
          <TabsTrigger value="at_risk" className="text-xs">Em Risco ({riskCount})</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">Concluídos ({projectsData.filter((p) => p.status === "completed").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Receita Orçada", value: formatCurrency(totalBudgeted), icon: DollarSign, color: "text-foreground" },
          { label: "EAC Total Portfolio", value: formatCurrency(totalEAC), icon: Target, color: totalEAC > totalBudgeted ? "text-destructive" : "text-success" },
          { label: "Margem Ponderada", value: `${weightedMargin.toFixed(1)}%`, icon: TrendingUp, color: "text-success" },
          { label: "CPI Médio", value: avgCPI.toFixed(2), icon: avgCPI >= 1 ? TrendingUp : TrendingDown, color: evmColor(avgCPI) },
          { label: "SPI Médio", value: avgSPI.toFixed(2), icon: avgSPI >= 1 ? TrendingUp : TrendingDown, color: evmColor(avgSPI) },
          { label: "Projetos em Risco", value: riskCount.toString(), icon: AlertTriangle, color: "text-destructive" },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border-border/50 bg-card/80">
              <CardContent className="pt-3 pb-3 px-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground font-data">{k.label}</p>
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className={cn("text-lg font-bold font-data", k.color)}>{k.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI RISK PANEL */}
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-data flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            🤖 Análise Preditiva — Engine FinanceOS
            <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] animate-pulse">LIVE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Alert projects */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">Projetos em Alerta</p>
              {alertProjects.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum projeto em alerta 🎉</p>
              ) : (
                <div className="space-y-3">
                  {alertProjects.map((p) => (
                    <div key={p.id} className="p-3 rounded-lg bg-card/60 border border-border/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-foreground">{p.name}</span>
                        <Badge className={cn("text-[10px]", riskBadgeColor(p.aiRiskScore))}>{p.aiRiskScore}</Badge>
                      </div>
                      <Progress value={p.aiRiskScore} className={cn("h-1.5 mb-2", p.aiRiskScore > 75 ? "[&>div]:bg-destructive" : "[&>div]:bg-yellow-500")} />
                      {p.aiAlerts.slice(0, 2).map((a, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground leading-tight mt-1">• {a}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Right: Portfolio health */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">Saúde do Portfolio</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/50">
                  <span className="text-xs text-muted-foreground">EAC Total vs BAC Total</span>
                  <span className={cn("text-xs font-bold", totalEAC > totalBudgeted ? "text-destructive" : "text-success")}>
                    Δ {formatCurrency(totalEAC - totalBudgeted)}
                  </span>
                </div>
                <div className="flex items-center gap-4 p-2 rounded-lg bg-card/60 border border-border/50">
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                    <circle cx="25" cy="25" r="20" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
                      strokeDasharray={`${(avgCompletion / 100) * 125.6} 125.6`}
                      strokeLinecap="round" transform="rotate(-90 25 25)" />
                    <text x="25" y="29" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="11" fontWeight="bold">
                      {avgCompletion.toFixed(0)}%
                    </text>
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Prob. Entrega no Prazo</p>
                    <p className="text-[11px] text-muted-foreground">Média ponderada do portfolio</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-success/10 border border-success/20 text-center">
                    <p className="text-lg font-bold text-success">{starCount}</p>
                    <p className="text-[10px] text-muted-foreground">⭐ Estrela</p>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <p className="text-lg font-bold text-yellow-400">{riskQuadrant}</p>
                    <p className="text-[10px] text-muted-foreground">⚠️ Em risco</p>
                  </div>
                  <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                    <p className="text-lg font-bold text-destructive">{criticalCount}</p>
                    <p className="text-[10px] text-muted-foreground">🔴 Crítico</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MAIN TABLE */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-data flex items-center gap-2">
            <FolderOpen className="w-4 h-4" /> Projetos ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs cursor-pointer" onClick={() => toggleSort("name")}>Projeto<SortIcon field="name" /></TableHead>
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs">Manager</TableHead>
                <TableHead className="text-xs text-right cursor-pointer" onClick={() => toggleSort("budgeted")}>Orçado / EAC<SortIcon field="budgeted" /></TableHead>
                <TableHead className="text-xs text-center cursor-pointer" onClick={() => toggleSort("cpi")}>CPI<SortIcon field="cpi" /></TableHead>
                <TableHead className="text-xs text-center cursor-pointer" onClick={() => toggleSort("spi")}>SPI<SortIcon field="spi" /></TableHead>
                <TableHead className="text-xs text-right cursor-pointer" onClick={() => toggleSort("margin")}>Margem Prev.<SortIcon field="margin" /></TableHead>
                <TableHead className="text-xs">Prazo</TableHead>
                <TableHead className="text-xs cursor-pointer" onClick={() => toggleSort("progress")}>Progresso<SortIcon field="progress" /></TableHead>
                <TableHead className="text-xs text-center cursor-pointer" onClick={() => toggleSort("aiRiskScore")}>Risk<SortIcon field="aiRiskScore" /></TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const st = statusMap[p.status];
                const cat = categoryMap[p.category];
                const late = p.forecastEnd > p.endDate;
                return (
                  <TableRow key={p.id} className="group">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-data font-semibold">{p.name}</span>
                        <Badge className={cn("text-[9px] w-fit", cat.color)}>{cat.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-data">{p.client}</TableCell>
                    <TableCell className="text-xs font-data">{p.manager}</TableCell>
                    <TableCell className="text-right">
                      <p className="text-[10px] text-muted-foreground font-data">{formatCurrencyK(p.budgeted)}</p>
                      <p className={cn("text-xs font-bold font-data", p.eac > p.budgeted ? "text-destructive" : "text-foreground")}>{formatCurrencyK(p.eac)}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("text-xs font-bold font-data", evmColor(p.cpi))}>{p.cpi.toFixed(2)}</span>
                      {p.cpi >= 1 ? <ArrowUp className="w-3 h-3 text-success inline ml-0.5" /> : <ArrowDown className="w-3 h-3 text-destructive inline ml-0.5" />}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("text-xs font-bold font-data", evmColor(p.spi))}>{p.spi.toFixed(2)}</span>
                      {p.spi >= 1 ? <ArrowUp className="w-3 h-3 text-success inline ml-0.5" /> : <ArrowDown className="w-3 h-3 text-destructive inline ml-0.5" />}
                    </TableCell>
                    <TableCell className={cn("text-xs font-data text-right font-semibold", p.aiPredictedMargin >= 0 ? "text-success" : "text-destructive")}>
                      {p.aiPredictedMargin.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {late ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-data line-through text-muted-foreground">{formatDate(p.endDate)}</span>
                          <span className="text-xs font-data text-destructive flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" />{formatDate(p.forecastEnd)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-data">{formatDate(p.endDate)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={p.progress} className="h-1.5 w-14" />
                        <span className="text-[10px] font-data text-muted-foreground">{p.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn("text-[10px]", riskBadgeColor(p.aiRiskScore))}>{p.aiRiskScore}</Badge>
                    </TableCell>
                    <TableCell><Badge className={cn("text-[10px]", st.color)}>{st.label}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedProject(p)}>
                        <Eye className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PORTFOLIO CHARTS */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Scatter / Bubble */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-data">Mapa EVM — CPI vs SPI</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[260px] w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" dataKey="x" name="SPI" domain={[0.5, 1.5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} label={{ value: "SPI", position: "bottom", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="number" dataKey="y" name="CPI" domain={[0.5, 1.5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} label={{ value: "CPI", angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <ReferenceLine x={1} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <ReferenceLine y={1} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Tooltip contentStyle={rechartTooltipStyle} formatter={(value: number, name: string) => [value.toFixed(2), name]} labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ""} />
                  <Scatter data={scatterData} fill="hsl(var(--primary))">
                    {scatterData.map((entry, i) => (
                      <Cell key={i} fill={SCATTER_COLORS[entry.status] || "hsl(var(--primary))"} r={Math.max(entry.z, 4)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
            <div className="grid grid-cols-2 gap-1 mt-2 text-[9px] text-muted-foreground">
              <span>💸 Caro (CPI alto, SPI baixo)</span>
              <span className="text-right">⭐ Estrela (ambos &gt; 1)</span>
              <span>🔴 Crítico (ambos &lt; 1)</span>
              <span className="text-right">⏰ Atrasado (CPI baixo, SPI alto)</span>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart: Budgeted vs EAC */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-data">Orçado vs Previsão Real (EAC)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[260px] w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={formatCurrencyK} />
                  <Tooltip contentStyle={rechartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="budgeted" name="Orçado" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="eac" name="EAC" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DETAIL SHEET */}
      <Sheet open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <SheetContent className="w-[700px] sm:max-w-[700px] overflow-y-auto bg-card border-border p-0">
          {selectedProject && (
            <div className="p-6 space-y-4">
              <SheetHeader>
                <SheetTitle className="font-data text-base flex items-center gap-2">
                  {selectedProject.name}
                  <Badge className={cn("text-[10px]", categoryMap[selectedProject.category].color)}>{categoryMap[selectedProject.category].label}</Badge>
                  <Badge className={cn("text-[10px]", statusMap[selectedProject.status].color)}>{statusMap[selectedProject.status].label}</Badge>
                </SheetTitle>
                <p className="text-xs text-muted-foreground">{selectedProject.client} • {selectedProject.manager}</p>
              </SheetHeader>

              <Tabs defaultValue="overview">
                <TabsList className="bg-muted/50 w-full">
                  <TabsTrigger value="overview" className="text-xs flex-1">Visão Geral</TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs flex-1">IA Preditiva</TabsTrigger>
                  <TabsTrigger value="team" className="text-xs flex-1">Equipe</TabsTrigger>
                  <TabsTrigger value="risks" className="text-xs flex-1">Riscos</TabsTrigger>
                </TabsList>

                {/* TAB 1: Overview */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* EVM metrics */}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "CPI", value: selectedProject.cpi.toFixed(2), tooltip: "Cost Performance Index", color: evmColor(selectedProject.cpi) },
                      { label: "SPI", value: selectedProject.spi.toFixed(2), tooltip: "Schedule Performance Index", color: evmColor(selectedProject.spi) },
                      { label: "EAC", value: formatCurrencyK(selectedProject.eac), tooltip: "Estimate at Completion", color: selectedProject.eac > selectedProject.budgeted ? "text-destructive" : "text-success" },
                      { label: "VAC", value: formatCurrencyK(selectedProject.vac), tooltip: "Variance at Completion", color: selectedProject.vac >= 0 ? "text-success" : "text-destructive" },
                      { label: "TCPI", value: selectedProject.tcpi.toFixed(2), tooltip: "To Complete Performance Index", color: selectedProject.tcpi > 1.2 ? "text-destructive" : "text-success" },
                    ].map((m) => (
                      <div key={m.label} className="p-2 rounded-lg bg-muted/30 border border-border/50 text-center" title={m.tooltip}>
                        <p className="text-[10px] text-muted-foreground">{m.label}</p>
                        <p className={cn("text-sm font-bold font-data", m.color)}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* S-Curve */}
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Curva S — Earned Value</p>
                    {isLoading ? <Skeleton className="h-[220px] w-full" /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={selectedProject.burnHistory} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={formatCurrencyK} />
                          <Tooltip contentStyle={rechartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                          <Area type="monotone" dataKey="planned" name="Planejado (PV)" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.15} strokeWidth={1.5} />
                          <Area type="monotone" dataKey="actual" name="Realizado (AC)" stroke="hsl(25, 95%, 53%)" fill="hsl(25, 95%, 53%)" fillOpacity={0.2} strokeWidth={1.5} />
                          <Area type="monotone" dataKey="earned" name="Valor Agregado (EV)" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.2} strokeWidth={1.5} />
                          <ReferenceLine x={selectedProject.burnHistory[selectedProject.burnHistory.length - 1]?.week} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: "Hoje", fontSize: 10, fill: "hsl(var(--primary))" }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Milestones */}
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Milestones</p>
                    <div className="space-y-1.5">
                      {selectedProject.milestones.map((ms, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                          {ms.status === "done" ? <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" /> :
                            ms.status === "in_progress" ? <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" /> :
                              <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                          <span className="text-xs font-data flex-1">{ms.name}</span>
                          <span className="text-[10px] text-muted-foreground font-data">{formatDate(ms.dueDate)}</span>
                          <span className="text-xs font-data font-semibold">{formatCurrencyK(ms.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: AI Predictive */}
                <TabsContent value="ai" className="space-y-4 mt-4">
                  <div className="flex items-start gap-6">
                    <GaugeChart value={selectedProject.aiRiskScore} max={100} benchmarkExcellent={30} benchmarkAdequate={60} label="Risk Score" size={160} />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Probabilidade de Conclusão no Prazo</p>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedProject.aiCompletionProbability} className="h-4 flex-1" />
                          <span className="text-sm font-bold font-data">{selectedProject.aiCompletionProbability}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Delta de Margem</p>
                        <p className="text-xs font-data">
                          Contratada <span className="font-bold">{selectedProject.margin.toFixed(1)}%</span>
                          <span className="mx-2">→</span>
                          Prevista <span className={cn("font-bold", selectedProject.aiPredictedMargin >= selectedProject.margin ? "text-success" : "text-destructive")}>{selectedProject.aiPredictedMargin.toFixed(1)}%</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedProject.aiAlerts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">Alertas IA</p>
                      {selectedProject.aiAlerts.map((a, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                          <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-foreground">{a}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-3">Simulador de Cenários</p>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[11px] text-muted-foreground">Velocidade de Execução</span>
                          <span className="text-xs font-bold font-data">{speedFactor}%</span>
                        </div>
                        <Slider value={[speedFactor]} onValueChange={(v) => setSpeedFactor(v[0])} min={50} max={150} step={5} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[11px] text-muted-foreground">Controle de Custos</span>
                          <span className="text-xs font-bold font-data">{costFactor}%</span>
                        </div>
                        <Slider value={[costFactor]} onValueChange={(v) => setCostFactor(v[0])} min={50} max={150} step={5} />
                      </div>
                      {scenario && (
                        <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Novo EAC</p>
                            <p className={cn("text-sm font-bold font-data", scenario.newEAC > selectedProject.budgeted ? "text-destructive" : "text-success")}>{formatCurrencyK(scenario.newEAC)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Nova Margem</p>
                            <p className={cn("text-sm font-bold font-data", scenario.newMargin >= 0 ? "text-success" : "text-destructive")}>{scenario.newMargin.toFixed(1)}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Novo Término</p>
                            <p className="text-sm font-bold font-data">{formatDate(scenario.newEndDate)}</p>
                          </div>
                        </div>
                      )}
                      {scenario && (
                        <Badge className={cn("text-xs", scenario.feasible ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30")}>
                          {scenario.feasible ? "Cenário Viável ✅" : "Cenário Inviável ❌"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 3: Team & Costs */}
                <TabsContent value="team" className="space-y-4 mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Membro</TableHead>
                        <TableHead className="text-xs">Função</TableHead>
                        <TableHead className="text-xs">Alocação</TableHead>
                        <TableHead className="text-xs text-right">R$/h</TableHead>
                        <TableHead className="text-xs text-right">Custo/mês</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProject.team.map((m, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-data font-semibold">{m.name}</TableCell>
                          <TableCell className="text-xs font-data">{m.role}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={m.allocation} className="h-1.5 w-12" />
                              <span className="text-[10px] font-data">{m.allocation}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-data text-right">{formatCurrency(m.costPerHour)}</TableCell>
                          <TableCell className="text-xs font-data text-right font-semibold">{formatCurrency(Math.round(m.costPerHour * (m.allocation / 100) * 160))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Custo por Membro (mensal)</p>
                    {isLoading ? <Skeleton className="h-[180px] w-full" /> : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={teamCostData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={formatCurrencyK} />
                          <Tooltip contentStyle={rechartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                          <Bar dataKey="custo" name="Custo" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Burn Rate Semanal</p>
                    {isLoading ? <Skeleton className="h-[160px] w-full" /> : (
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={burnRateData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={formatCurrencyK} />
                          <Tooltip contentStyle={rechartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                          <Line type="monotone" dataKey="burnRate" name="Burn Rate" stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 4: Risks */}
                <TabsContent value="risks" className="space-y-4 mt-4">
                  {/* Risk Matrix */}
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Matriz de Riscos</p>
                    <div className="grid grid-cols-4 gap-0.5 text-center">
                      <div />
                      <div className="text-[10px] text-muted-foreground p-1">Baixo</div>
                      <div className="text-[10px] text-muted-foreground p-1">Médio</div>
                      <div className="text-[10px] text-muted-foreground p-1">Alto</div>
                      {(["high", "medium", "low"] as const).map((prob, pi) => (
                        <>
                          <div key={`l-${prob}`} className="text-[10px] text-muted-foreground p-1 flex items-center justify-end pr-2">{probabilityLabel[prob]}</div>
                          {(["low", "medium", "high"] as const).map((imp, ii) => {
                            const risksInCell = selectedProject.risks.filter((r) => r.probability === prob && r.impact === imp);
                            return (
                              <div key={`${prob}-${imp}`} className={cn("rounded p-2 min-h-[40px] flex items-center justify-center", matrixColors[pi][ii])}>
                                {risksInCell.map((_, ri) => (
                                  <div key={ri} className="w-5 h-5 rounded-full bg-foreground/20 flex items-center justify-center text-[8px] font-bold text-foreground">
                                    R{selectedProject.risks.indexOf(_) + 1}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </>
                      ))}
                    </div>
                  </div>

                  {/* Risk list */}
                  <div className="space-y-2">
                    {selectedProject.risks.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhum risco registrado 🎉</p>
                    ) : (
                      selectedProject.risks.map((r, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/50">
                          <div className="flex items-start gap-2 mb-1.5">
                            <Shield className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs font-data font-semibold text-foreground">{r.description}</p>
                          </div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="outline" className="text-[9px]">Prob: {probabilityLabel[r.probability]}</Badge>
                            <Badge variant="outline" className="text-[9px]">Impacto: {impactLabel[r.impact]}</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">Mitigação: {r.mitigation}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => setRiskDialogOpen(true)}>
                    <Plus className="w-3 h-3" /> Registrar Novo Risco
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* New Risk Dialog */}
      <Dialog open={riskDialogOpen} onOpenChange={setRiskDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-data">Registrar Novo Risco</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Descrição</label>
              <textarea className="w-full mt-1 p-2 text-xs rounded-lg bg-muted/30 border border-border/50 h-20 resize-none" placeholder="Descreva o risco..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Probabilidade</label>
                <select className="w-full mt-1 p-2 text-xs rounded-lg bg-muted/30 border border-border/50">
                  <option>Baixa</option><option>Média</option><option>Alta</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Impacto</label>
                <select className="w-full mt-1 p-2 text-xs rounded-lg bg-muted/30 border border-border/50">
                  <option>Baixo</option><option>Médio</option><option>Alto</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Mitigação</label>
              <textarea className="w-full mt-1 p-2 text-xs rounded-lg bg-muted/30 border border-border/50 h-16 resize-none" placeholder="Plano de mitigação..." />
            </div>
            <Button size="sm" className="w-full text-xs" onClick={() => setRiskDialogOpen(false)}>Salvar Risco</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
