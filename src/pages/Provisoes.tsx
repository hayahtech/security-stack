import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lightbulb, CheckCircle2, AlertTriangle, Clock, RefreshCcw, TrendingUp, TrendingDown,
  ArrowRight, Plus, BarChart3,
} from "lucide-react";
import { provisions, cashVsAccrual } from "@/mock/provisionsData";
import { cn } from "@/lib/utils";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "✅ Ativa", color: "bg-success/20 text-success border-success/30", icon: CheckCircle2 },
  realized: { label: "✅ Realizada", color: "bg-primary/20 text-primary border-primary/30", icon: CheckCircle2 },
  review: { label: "⚠️ Revisão", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30", icon: AlertTriangle },
  in_progress: { label: "✅ Em curso", color: "bg-primary/20 text-primary border-primary/30", icon: Clock },
};

export default function Provisoes() {
  const totalProvisioned = provisions.filter((p) => p.status === "active" || p.status === "in_progress").reduce((a, p) => a + p.value, 0);

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Provisões & Regime de Competência</h1>
        <p className="text-muted-foreground font-data text-sm">Contabilidade • Motor de provisões e reconciliação caixa vs competência</p>
      </div>

      {/* Concept card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-data text-foreground font-semibold">Regime de Competência</p>
            <p className="text-xs text-muted-foreground font-data mt-1">
              A despesa/receita é reconhecida quando ocorre o fato gerador, não quando o dinheiro entra ou sai.
              Isso garante que sua DRE reflita a realidade econômica do período.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="provisoes" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="provisoes" className="font-data text-xs">Provisões Ativas</TabsTrigger>
          <TabsTrigger value="reconciliacao" className="font-data text-xs">Caixa vs Competência</TabsTrigger>
          <TabsTrigger value="novo" className="font-data text-xs">Novo Lançamento</TabsTrigger>
        </TabsList>

        <TabsContent value="provisoes" className="space-y-4">
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Provisionado", value: formatCurrency(totalProvisioned), color: "text-primary" },
              { label: "Provisões Ativas", value: provisions.filter((p) => p.status === "active").length.toString(), color: "text-success" },
              { label: "Em Revisão", value: provisions.filter((p) => p.status === "review").length.toString(), color: "text-yellow-500" },
              { label: "Diferimentos", value: provisions.filter((p) => p.type === "Diferimento").length.toString(), color: "text-primary" },
            ].map((k) => (
              <Card key={k.label} className="border-border/50 bg-card/80">
                <CardContent className="pt-3 pb-3 px-4">
                  <p className="text-[11px] text-muted-foreground font-data">{k.label}</p>
                  <p className={`text-lg font-bold font-data ${k.color}`}>{k.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-data">Provisões</CardTitle>
              <Button size="sm" className="text-xs gap-1"><Plus className="w-3 h-3" /> Nova Provisão</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="text-xs text-right">Valor</TableHead>
                    <TableHead className="text-xs">Competência</TableHead>
                    <TableHead className="text-xs">Pagamento</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {provisions.map((p) => {
                    const st = statusMap[p.status];
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-data">
                          {p.description}
                          {p.details && (
                            <div className="mt-1">
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span>Total: {formatCurrency(p.details.totalPaid!)}</span>
                                <span>•</span>
                                <span>{formatCurrency(p.details.monthlyRecognition!)}/mês</span>
                                <span>•</span>
                                <span>{p.details.monthsConsumed}/{p.details.monthsTotal} meses</span>
                              </div>
                              <Progress value={(p.details.monthsConsumed! / p.details.monthsTotal!) * 100} className="h-1.5 mt-1" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-data text-right font-semibold">{formatCurrency(p.value)}</TableCell>
                        <TableCell className="text-xs font-data">{p.competence}</TableCell>
                        <TableCell className="text-xs font-data">{p.payment}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-data">{p.type}</Badge></TableCell>
                        <TableCell><Badge className={cn("text-[10px]", st.color)}>{st.label}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliacao" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50 bg-card/80">
              <CardContent className="pt-4 pb-4 px-4 text-center">
                <p className="text-xs text-muted-foreground font-data">DRE pelo Caixa</p>
                <p className="text-2xl font-bold font-data text-foreground mt-1">{formatCurrency(cashVsAccrual.cashResult)}</p>
                <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mt-1" />
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-4 pb-4 px-4 text-center">
                <p className="text-xs text-primary font-data font-semibold">DRE pela Competência</p>
                <p className="text-2xl font-bold font-data text-primary mt-1">{formatCurrency(cashVsAccrual.accrualResult)}</p>
                <BarChart3 className="w-4 h-4 text-primary mx-auto mt-1" />
              </CardContent>
            </Card>
            <Card className="border-success/30 bg-success/5">
              <CardContent className="pt-4 pb-4 px-4 text-center">
                <p className="text-xs text-success font-data font-semibold">Diferença</p>
                <p className="text-2xl font-bold font-data text-success mt-1">+{formatCurrency(cashVsAccrual.difference)}</p>
                <p className="text-[10px] text-muted-foreground font-data mt-1">Explicada pelas provisões</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-data">Explicação da Diferença</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cashVsAccrual.explanations.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-xs font-data text-foreground">{e.desc}</span>
                  <span className={cn("text-xs font-data font-semibold", e.value > 0 ? "text-success" : "text-destructive")}>
                    {e.value > 0 ? "+" : ""}{formatCurrency(e.value)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="novo" className="space-y-4">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-data">Novo Lançamento com Competência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-xs font-data text-foreground font-semibold">Este lançamento tem data de competência diferente do pagamento?</p>
                  <p className="text-[10px] text-muted-foreground font-data mt-1">Ex: Nota de dezembro, paga em janeiro → Data pagamento: 15/01 | Competência: 31/12</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-data block mb-1">Data do pagamento</label>
                  <input type="date" className="w-full p-2 rounded-lg bg-muted/50 border border-border text-xs font-data text-foreground" defaultValue="2025-03-15" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-data block mb-1">Data de competência</label>
                  <input type="date" className="w-full p-2 rounded-lg bg-muted/50 border border-border text-xs font-data text-foreground" defaultValue="2025-02-28" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-data block mb-1">Descrição</label>
                <input type="text" placeholder="Ex: Aluguel fevereiro pago em março" className="w-full p-2 rounded-lg bg-muted/50 border border-border text-xs font-data text-foreground placeholder:text-muted-foreground" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-data block mb-1">Valor</label>
                <input type="text" placeholder="R$ 0,00" className="w-full p-2 rounded-lg bg-muted/50 border border-border text-xs font-data text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs">Salvar rascunho</Button>
                <Button size="sm" className="text-xs">Confirmar lançamento</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
