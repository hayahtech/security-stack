import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChevronRight, ChevronDown, FolderTree, Grid3X3, Sliders, BarChart3, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { costCentersTree, heatmapCCData, rateioRules, type CostCenter, type RateioRule } from "@/mock/costCentersData";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtK = (v: number) => `R$ ${(v / 1000).toFixed(0)}K`;

/* ─── Cost Center Tree Node ─── */
function CCNode({ cc, level = 0 }: { cc: CostCenter; level?: number }) {
  const [open, setOpen] = useState(level === 0);
  const pct = Math.round((cc.actual / cc.budget) * 100);
  const variance = cc.actual - cc.budget;
  const hasChildren = cc.children && cc.children.length > 0;
  const isOver = variance > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer",
          level === 0 && "border-b border-border/20"
        )}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {hasChildren ? (
          open ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <div className="w-4 h-4 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("font-data text-sm", level === 0 ? "font-semibold text-foreground" : "text-foreground/80")}>{cc.name}</span>
            <Badge variant="outline" className="text-[9px] text-muted-foreground">{cc.id}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-24 text-right">
            <p className="text-xs text-muted-foreground font-data">Orçado</p>
            <p className="text-xs font-data font-medium">{fmtK(cc.budget)}</p>
          </div>
          <div className="w-24 text-right">
            <p className="text-xs text-muted-foreground font-data">Realizado</p>
            <p className="text-xs font-data font-medium">{fmtK(cc.actual)}</p>
          </div>
          <div className="w-20 text-right">
            <p className={cn("text-xs font-data font-semibold", isOver ? "text-destructive" : "text-success")}>
              {isOver ? "+" : ""}{fmtK(variance)}
            </p>
          </div>
          <div className="w-28">
            <div className="flex items-center gap-1.5">
              <Progress value={Math.min(pct, 100)} className="h-1.5 flex-1" />
              <span className={cn("text-[10px] font-data font-semibold", pct > 100 ? "text-destructive" : pct > 90 ? "text-yellow-400" : "text-success")}>{pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {open && hasChildren && cc.children!.map((child) => <CCNode key={child.id} cc={child} level={level + 1} />)}
    </div>
  );
}

/* ─── Rateio Editor ─── */
function RateioEditor({ rule: initialRule }: { rule: RateioRule }) {
  const [rule, setRule] = useState(initialRule);
  const total = rule.allocations.reduce((s, a) => s + a.pct, 0);
  const isValid = total === 100;

  const updatePct = (idx: number, newPct: number) => {
    setRule((prev) => ({
      ...prev,
      allocations: prev.allocations.map((a, i) => i === idx ? { ...a, pct: newPct } : a),
    }));
  };

  return (
    <Card className={cn("border-border/50 bg-card/80", !rule.active && "opacity-60")}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch checked={rule.active} onCheckedChange={(v) => setRule({ ...rule, active: v })} />
            <div>
              <p className="text-sm font-data font-medium">{rule.account}</p>
              <p className="text-xs text-muted-foreground font-data">{fmtBRL(rule.totalValue)}/mês</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={rule.basis} onValueChange={(v) => setRule({ ...rule, basis: v as RateioRule["basis"] })}>
              <SelectTrigger className="w-[160px] h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">% Manual</SelectItem>
                <SelectItem value="headcount">Headcount</SelectItem>
                <SelectItem value="area">m² Ocupado</SelectItem>
                <SelectItem value="revenue">Receita Proporcional</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className={cn("text-[10px]", isValid ? "text-success border-success/30" : "text-destructive border-destructive/30")}>
              {total}%
            </Badge>
          </div>
        </div>

        {rule.active && (
          <div className="space-y-2.5">
            {rule.allocations.map((alloc, i) => (
              <div key={alloc.ccId} className="flex items-center gap-3">
                <span className="text-xs font-data text-muted-foreground w-20 flex-shrink-0">{alloc.ccName}</span>
                <Slider
                  value={[alloc.pct]}
                  onValueChange={(v) => updatePct(i, v[0])}
                  min={0} max={100} step={1}
                  className="flex-1"
                />
                <span className="text-xs font-data font-semibold w-10 text-right">{alloc.pct}%</span>
                <span className="text-[10px] font-data text-muted-foreground w-20 text-right">{fmtBRL(rule.totalValue * alloc.pct / 100)}</span>
              </div>
            ))}
            {!isValid && (
              <p className="text-xs text-destructive font-data flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Soma deve ser 100% (atual: {total}%)
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ─── */
export default function CentrosCusto() {
  const totalBudget = costCentersTree.reduce((s, c) => s + c.budget, 0);
  const totalActual = costCentersTree.reduce((s, c) => s + c.actual, 0);
  const totalVariance = totalActual - totalBudget;

  const months = ["Out", "Nov", "Dez", "Jan", "Fev", "Mar"];
  const maxHeat = Math.max(...heatmapCCData.flatMap((r) => [r.out, r.nov, r.dez, r.jan, r.fev, r.mar]));

  const getHeatColor = (v: number) => {
    const ratio = v / maxHeat;
    if (ratio > 0.9) return "bg-destructive/30 text-destructive";
    if (ratio > 0.7) return "bg-yellow-500/20 text-yellow-400";
    if (ratio > 0.5) return "bg-primary/20 text-primary";
    return "bg-success/20 text-success";
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Centros de Custo & Rateio</h1>
          <p className="text-muted-foreground font-data text-sm">Gestão hierárquica e rateio multidimensional</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-data text-xs">Orçado: {fmtK(totalBudget)}</Badge>
          <Badge variant="outline" className="font-data text-xs">Real: {fmtK(totalActual)}</Badge>
          <Badge variant="outline" className={cn("font-data text-xs", totalVariance > 0 ? "text-destructive border-destructive/30" : "text-success border-success/30")}>
            {totalVariance > 0 ? "+" : ""}{fmtK(totalVariance)}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="arvore" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="arvore"><FolderTree className="w-3.5 h-3.5 mr-1" /> Árvore</TabsTrigger>
          <TabsTrigger value="heatmap"><Grid3X3 className="w-3.5 h-3.5 mr-1" /> Mapa de Calor</TabsTrigger>
          <TabsTrigger value="rateio"><Sliders className="w-3.5 h-3.5 mr-1" /> Motor de Rateio</TabsTrigger>
          <TabsTrigger value="relatorio"><BarChart3 className="w-3.5 h-3.5 mr-1" /> Relatório</TabsTrigger>
        </TabsList>

        {/* Árvore */}
        <TabsContent value="arvore">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-data">Estrutura Hierárquica de Centros de Custo</CardTitle>
                <div className="flex items-center gap-4 text-[10px] font-data text-muted-foreground">
                  <span>Orçado</span><span>Realizado</span><span>Variação</span><span>Utilização</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {costCentersTree.map((cc) => <CCNode key={cc.id} cc={cc} />)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heatmap */}
        <TabsContent value="heatmap">
          <Card className="border-border/50 bg-card/80">
            <CardHeader><CardTitle className="text-base font-data">Mapa de Calor — Gastos por Centro × Mês (R$ mil)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-data">Centro de Custo</TableHead>
                    {months.map((m) => <TableHead key={m} className="font-data text-center">{m}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatmapCCData.map((row) => {
                    const vals = [row.out, row.nov, row.dez, row.jan, row.fev, row.mar];
                    return (
                      <TableRow key={row.cc}>
                        <TableCell className="font-data text-sm font-medium">{row.cc}</TableCell>
                        {vals.map((v, i) => (
                          <TableCell key={i} className="text-center">
                            <span className={cn("inline-block px-3 py-1.5 rounded font-data text-xs font-semibold min-w-[50px]", getHeatColor(v))}>
                              {v}
                            </span>
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

        {/* Rateio */}
        <TabsContent value="rateio" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-data">Configure as regras de rateio por conta. A soma das alocações deve ser exatamente 100%.</p>
            <Button size="sm" className="gap-1" onClick={() => toast({ title: "Simulação executada", description: "Impacto calculado com sucesso para todos os CCs" })}>
              <Sliders className="w-3.5 h-3.5" /> Simular Impacto
            </Button>
          </div>
          {rateioRules.map((rule) => <RateioEditor key={rule.id} rule={rule} />)}
        </TabsContent>

        {/* Relatório */}
        <TabsContent value="relatorio">
          <Card className="border-border/50 bg-card/80">
            <CardHeader><CardTitle className="text-base font-data">Relatório de Rateio — Distribuição por Conta</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-data">Conta</TableHead>
                    <TableHead className="font-data text-right">Total</TableHead>
                    {["Produto", "Comercial", "Operações", "Marketing", "G&A"].map((cc) => (
                      <TableHead key={cc} className="font-data text-right">{cc}</TableHead>
                    ))}
                    <TableHead className="font-data text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateioRules.filter((r) => r.active).map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-data text-sm">{rule.account}</TableCell>
                      <TableCell className="font-data text-sm text-right font-medium">{fmtBRL(rule.totalValue)}</TableCell>
                      {rule.allocations.map((a) => (
                        <TableCell key={a.ccId} className="font-data text-xs text-right">
                          <div>
                            <span className="text-foreground">{fmtBRL(rule.totalValue * a.pct / 100)}</span>
                            <br />
                            <span className="text-muted-foreground">{a.pct}%</span>
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <CheckCircle2 className="w-4 h-4 text-success mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
