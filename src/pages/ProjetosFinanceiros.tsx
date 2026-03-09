import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FolderOpen, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Clock, Eye, Plus,
} from "lucide-react";
import { projects } from "@/mock/partnersData";
import { cn } from "@/lib/utils";

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusMap: Record<string, { label: string; color: string }> = {
  on_track: { label: "No prazo", color: "bg-success/20 text-success border-success/30" },
  over_budget: { label: "🔴 Acima orçamento", color: "bg-destructive/20 text-destructive border-destructive/30" },
  at_risk: { label: "⚠️ Em risco", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
  completed: { label: "✅ Concluído", color: "bg-primary/20 text-primary border-primary/30" },
};

export default function ProjetosFinanceiros() {
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null);

  const totalBudgeted = projects.reduce((a, p) => a + p.budgeted, 0);
  const totalActual = projects.reduce((a, p) => a + p.actual, 0);
  const avgMargin = projects.reduce((a, p) => a + p.margin, 0) / projects.length;
  const overBudget = projects.filter((p) => p.status === "over_budget").length;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Gestão de Projetos Financeiros</h1>
          <p className="text-muted-foreground font-data text-sm">Controle de orçamento, margem e progresso por projeto</p>
        </div>
        <Button size="sm" className="gap-1 text-xs"><Plus className="w-3 h-3" /> Novo Projeto</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Orçado", value: formatCurrency(totalBudgeted), color: "text-foreground", icon: DollarSign },
          { label: "Total Realizado", value: formatCurrency(totalActual), color: "text-primary", icon: TrendingUp },
          { label: "Margem Média", value: `${avgMargin.toFixed(1)}%`, color: "text-success", icon: TrendingUp },
          { label: "Acima do Orçamento", value: overBudget.toString(), color: "text-destructive", icon: AlertTriangle },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="border-border/50 bg-card/80">
              <CardContent className="pt-3 pb-3 px-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground font-data">{k.label}</p>
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className={`text-lg font-bold font-data ${k.color}`}>{k.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Project alerts */}
      {projects.filter((p) => p.status === "over_budget").map((p) => (
        <div key={p.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-xs font-data text-foreground">
            ⚠️ <span className="font-semibold">{p.name}</span>: custos {Math.abs(p.margin).toFixed(0)}% acima do orçado — revisar escopo ou renegociar
          </p>
        </div>
      ))}

      {/* Table */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-data">Projetos Ativos ({projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Projeto</TableHead>
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs text-right">Orçado</TableHead>
                <TableHead className="text-xs text-right">Realizado</TableHead>
                <TableHead className="text-xs text-right">Margem</TableHead>
                <TableHead className="text-xs">% Concluído</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => {
                const st = statusMap[p.status];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-data font-medium">{p.name}</TableCell>
                    <TableCell className="text-xs font-data">{p.client}</TableCell>
                    <TableCell className="text-xs font-data text-right">{formatCurrency(p.budgeted)}</TableCell>
                    <TableCell className="text-xs font-data text-right">{formatCurrency(p.actual)}</TableCell>
                    <TableCell className={cn("text-xs font-data text-right font-semibold", p.margin >= 0 ? "text-success" : "text-destructive")}>{p.margin.toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={p.progress} className="h-1.5 w-16" />
                        <span className="text-[10px] font-data text-muted-foreground">{p.progress}%</span>
                      </div>
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

      {/* Project detail dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="font-data text-base">{selectedProject.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-muted/30"><p className="text-[10px] text-muted-foreground font-data">Cliente</p><p className="text-xs font-data font-semibold">{selectedProject.client}</p></div>
                  <div className="p-2 rounded-lg bg-muted/30"><p className="text-[10px] text-muted-foreground font-data">Margem</p><p className={cn("text-xs font-data font-semibold", selectedProject.margin >= 0 ? "text-success" : "text-destructive")}>{selectedProject.margin.toFixed(1)}%</p></div>
                </div>

                <div>
                  <p className="text-xs font-data font-semibold text-foreground mb-2">Timeline & Milestones</p>
                  <div className="space-y-2">
                    {selectedProject.milestones.map((ms, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                          ms.status === "done" ? "bg-success/20" : ms.status === "in_progress" ? "bg-primary/20" : "bg-muted"
                        )}>
                          {ms.status === "done" ? <CheckCircle2 className="w-3 h-3 text-success" /> :
                           ms.status === "in_progress" ? <Clock className="w-3 h-3 text-primary" /> :
                           <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-data text-foreground">{ms.name}</p>
                        </div>
                        <span className="text-xs font-data text-muted-foreground">{formatCurrency(ms.value)}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {ms.status === "done" ? "✅" : ms.status === "in_progress" ? "🔄" : "⏳"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground font-data">Orçado</p>
                    <p className="text-sm font-bold font-data">{formatCurrency(selectedProject.budgeted)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground font-data">Realizado</p>
                    <p className="text-sm font-bold font-data">{formatCurrency(selectedProject.actual)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground font-data">Progresso</p>
                    <p className="text-sm font-bold font-data text-primary">{selectedProject.progress}%</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
