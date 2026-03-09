import {
  ShieldAlert, AlertTriangle, CheckCircle2, Users,
  Building2, TrendingDown, TrendingUp, ArrowRight, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  companyRisks, clientRisks, supplierRisks, type Risk,
} from "@/mock/kpisRiskData";
import { formatCurrency } from "@/mock/financialData";
import { cn } from "@/lib/utils";

function ProbabilityBadge({ level }: { level: "low" | "medium" | "high" }) {
  const m = { low: "bg-success/20 text-success border-success/30", medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30", high: "bg-destructive/20 text-destructive border-destructive/30" };
  const l = { low: "Baixa", medium: "Média", high: "Alta" };
  return <Badge className={m[level]}>{l[level]}</Badge>;
}

function RiskScoreBadge({ score }: { score: number }) {
  const cls = score >= 80 ? "bg-success/20 text-success border-success/30" : score >= 50 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : "bg-destructive/20 text-destructive border-destructive/30";
  return <Badge className={cls}>{score}</Badge>;
}

function TrendIcon({ trend }: { trend: "improving" | "stable" | "deteriorating" }) {
  if (trend === "improving") return <TrendingUp className="h-4 w-4 text-success" />;
  if (trend === "stable") return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
  return <TrendingDown className="h-4 w-4 text-destructive" />;
}

function ReliabilityBadge({ r }: { r: string }) {
  const m: Record<string, string> = { excellent: "bg-success/20 text-success border-success/30", good: "bg-primary/20 text-primary border-primary/30", fair: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30", poor: "bg-destructive/20 text-destructive border-destructive/30" };
  return <Badge className={m[r] || m.fair}>{r}</Badge>;
}

export default function AnaliseRiscos() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Análise de Riscos</h1>
        <p className="text-muted-foreground font-data">Matriz de riscos, scoring de clientes e fornecedores</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="company" className="gap-2 data-[state=active]:bg-card">
            <ShieldAlert className="h-4 w-4" /> Risco da Empresa
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2 data-[state=active]:bg-card">
            <Users className="h-4 w-4" /> Risco de Clientes
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2 data-[state=active]:bg-card">
            <Building2 className="h-4 w-4" /> Risco de Fornecedores
          </TabsTrigger>
        </TabsList>

        {/* ═══ RISCO DA EMPRESA ═══ */}
        <TabsContent value="company" className="space-y-6 mt-6">
          {/* Risk Matrix */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg mb-4">Matriz de Riscos (Probabilidade × Impacto)</h3>
            <div className="relative w-full max-w-xl mx-auto aspect-square">
              {/* Grid background */}
              <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
                {Array.from({ length: 25 }, (_, i) => {
                  const row = Math.floor(i / 5);
                  const col = i % 5;
                  const severity = row + col;
                  const bg = severity >= 6 ? "bg-destructive/10" : severity >= 4 ? "bg-yellow-500/10" : "bg-success/10";
                  return <div key={i} className={cn("border border-border/30", bg)} />;
                })}
              </div>
              {/* Axis labels */}
              <div className="absolute -left-8 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground py-2">
                {["5", "4", "3", "2", "1"].map((l) => <span key={l}>{l}</span>)}
              </div>
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
                {["1", "2", "3", "4", "5"].map((l) => <span key={l}>{l}</span>)}
              </div>
              <p className="absolute -left-16 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground whitespace-nowrap">Impacto →</p>
              <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">Probabilidade →</p>
              {/* Risk dots */}
              {companyRisks.map((risk) => (
                <div
                  key={risk.id}
                  className="absolute w-8 h-8 rounded-full bg-destructive/80 flex items-center justify-center text-xs font-bold text-destructive-foreground border-2 border-destructive cursor-pointer hover:scale-110 transition-transform z-10"
                  style={{
                    left: `${(risk.x - 1) * 20 + 10}%`,
                    bottom: `${(risk.y - 1) * 20 + 10}%`,
                    transform: "translate(-50%, 50%)",
                  }}
                  title={risk.name}
                >
                  {risk.id}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Details */}
          <div className="space-y-4">
            {companyRisks.map((risk) => (
              <div key={risk.id} className={cn(
                "rounded-xl border p-5",
                risk.probability === "high" ? "border-destructive/30 bg-destructive/5" : risk.probability === "medium" ? "border-yellow-500/30 bg-yellow-500/5" : "border-success/30 bg-success/5"
              )}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-7 h-7 rounded-full bg-card flex items-center justify-center text-sm font-bold">{risk.id}</span>
                      <h4 className="font-display font-semibold text-foreground">{risk.name}</h4>
                      <ProbabilityBadge level={risk.probability} />
                      <ProbabilityBadge level={risk.impact} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{risk.description}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Impacto financeiro estimado:</span> <strong className="text-destructive">{formatCurrency(risk.financialImpact)}/mês</strong></p>
                  </div>
                  <div className="lg:text-right space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Mitigação:</span> <span className="text-foreground">{risk.mitigation}</span></p>
                    <p><span className="text-muted-foreground">Responsável:</span> <span className="text-primary">{risk.responsible}</span></p>
                    <p><span className="text-muted-foreground">Prazo:</span> <span>{risk.deadline}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ═══ RISCO DE CLIENTES ═══ */}
        <TabsContent value="clients" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-1" />
              <p className="text-2xl font-display font-bold">{clientRisks.filter((c) => c.risk === "low").length}</p>
              <p className="text-sm text-muted-foreground">Risco Baixo</p>
            </div>
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
              <p className="text-2xl font-display font-bold">{clientRisks.filter((c) => c.risk === "medium").length}</p>
              <p className="text-sm text-muted-foreground">Risco Médio</p>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
              <XCircle className="h-6 w-6 text-destructive mx-auto mb-1" />
              <p className="text-2xl font-display font-bold">{clientRisks.filter((c) => c.risk === "high").length}</p>
              <p className="text-sm text-muted-foreground">Risco Alto</p>
            </div>
          </div>

          {/* Alert */}
          {clientRisks.filter((c) => c.trend === "deteriorating").length > 0 && (
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm">
                <strong className="text-destructive">{clientRisks.filter((c) => c.trend === "deteriorating").length} clientes</strong> com deterioração de score — ação necessária
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-display">Cliente</TableHead>
                    <TableHead className="font-display text-right">MRR</TableHead>
                    <TableHead className="font-display text-center">Atraso Médio</TableHead>
                    <TableHead className="font-display text-center">Relacionamento</TableHead>
                    <TableHead className="font-display text-center">Score</TableHead>
                    <TableHead className="font-display text-center">Risco</TableHead>
                    <TableHead className="font-display text-center">Tendência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientRisks.map((c) => (
                    <TableRow key={c.id} className={cn("hover:bg-muted/20", c.risk === "high" && "bg-destructive/5")}>
                      <TableCell className="font-data font-medium">{c.name}</TableCell>
                      <TableCell className="font-data text-right tabular-nums">{formatCurrency(c.mrr)}</TableCell>
                      <TableCell className="text-center font-data">{c.avgDelay}d</TableCell>
                      <TableCell className="text-center font-data">{c.relationship}m</TableCell>
                      <TableCell className="text-center"><RiskScoreBadge score={c.score} /></TableCell>
                      <TableCell className="text-center"><ProbabilityBadge level={c.risk} /></TableCell>
                      <TableCell className="text-center"><TrendIcon trend={c.trend} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ═══ RISCO DE FORNECEDORES ═══ */}
        <TabsContent value="suppliers" className="space-y-6 mt-6">
          <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm">
              <strong className="text-yellow-500">Concentração alta:</strong> Top 3 fornecedores representam 58% dos custos. Recomenda-se diversificação.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-display">Fornecedor</TableHead>
                    <TableHead className="font-display text-right">% Custos</TableHead>
                    <TableHead className="font-display text-center">Alternativas</TableHead>
                    <TableHead className="font-display text-center">SLA (%)</TableHead>
                    <TableHead className="font-display text-center">Entrega</TableHead>
                    <TableHead className="font-display text-center">Confiabilidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierRisks.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/20">
                      <TableCell className="font-data font-medium">{s.name}</TableCell>
                      <TableCell className="font-data text-right tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${s.costShare * 2.5}%` }} />
                          </div>
                          {s.costShare}%
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-data">{s.alternatives}</TableCell>
                      <TableCell className="text-center font-data">{s.slaCompliance}%</TableCell>
                      <TableCell className="text-center font-data">{s.deliveryScore}/100</TableCell>
                      <TableCell className="text-center"><ReliabilityBadge r={s.reliability} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
