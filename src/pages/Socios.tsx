import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, Percent, AlertTriangle, FileText, PieChart } from "lucide-react";
import { partners, profitDistribution, proLaboreHistory } from "@/mock/partnersData";
import { cn } from "@/lib/utils";

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Socios() {
  const dist = profitDistribution;

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Sócios & Distribuição</h1>
        <p className="text-muted-foreground font-data text-sm">Configurações → Societário • Quadro societário e distribuição de lucros</p>
      </div>

      <Tabs defaultValue="quadro" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="quadro" className="font-data text-xs">👥 Quadro Societário</TabsTrigger>
          <TabsTrigger value="distribuicao" className="font-data text-xs">💰 Distribuição de Lucros</TabsTrigger>
          <TabsTrigger value="prolabore" className="font-data text-xs">📊 Pró-labore</TabsTrigger>
        </TabsList>

        <TabsContent value="quadro" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {partners.map((p) => (
              <Card key={p.id} className="border-border/50 bg-card/80">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="font-display font-bold text-sm text-primary-foreground">{p.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="text-sm font-data font-semibold text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground font-data">{p.cpfCnpj}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Participação</span><span className="font-semibold text-primary">{p.participation}%</span></div>
                    <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Pró-labore</span><span>{p.proLabore > 0 ? formatCurrency(p.proLabore) : "—"}</span></div>
                    <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Função</span><Badge variant="outline" className="text-[10px]">{p.role}</Badge></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="distribuicao" className="space-y-4">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-data">Calculadora de Distribuição de Lucros — Q1 2025</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Lucro líquido do trimestre", value: dist.quarterlyProfit, bold: true },
                { label: "(-) Reserva de contingência (10%)", value: -dist.contingencyReserve, color: "text-destructive" },
                { label: "(-) Reserva para reinvestimento (20%)", value: -dist.reinvestmentReserve, color: "text-destructive" },
                { label: "(=) Lucro disponível para distribuição", value: dist.distributable, bold: true, color: "text-success" },
              ].map((item) => (
                <div key={item.label} className={cn("flex justify-between p-2 rounded-lg", item.bold && "bg-muted/30")}>
                  <span className={cn("text-xs font-data", item.bold ? "font-semibold text-foreground" : "text-muted-foreground")}>{item.label}</span>
                  <span className={cn("text-xs font-data font-semibold", item.color || "text-foreground")}>{formatCurrency(Math.abs(item.value))}</span>
                </div>
              ))}

              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-data font-semibold text-foreground">Distribuição por sócio:</p>
                {partners.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-primary/5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-data text-foreground">{p.name}</span>
                      <Badge variant="outline" className="text-[10px]">{p.participation}%</Badge>
                    </div>
                    <span className="text-sm font-data font-bold text-primary">{formatCurrency(dist.distributable * (p.participation / 100))}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] font-data text-foreground">Distribuição de lucros é isenta de IRPF para sócios PF. Pró-labore é tributável (tabela progressiva).</p>
              </div>

              <Button size="sm" className="text-xs gap-1"><FileText className="w-3 h-3" /> Gerar recibo de distribuição</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prolabore" className="space-y-4">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-data">Histórico de Pró-labore — Últimos 6 Meses</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Mês</TableHead>
                    <TableHead className="text-xs text-right">João Silva</TableHead>
                    <TableHead className="text-xs text-right">Maria Souza</TableHead>
                    <TableHead className="text-xs text-right">INSS Patronal</TableHead>
                    <TableHead className="text-xs text-right">IRRF Retido</TableHead>
                    <TableHead className="text-xs text-right font-semibold">Custo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proLaboreHistory.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell className="text-xs font-data">{m.month}</TableCell>
                      <TableCell className="text-xs font-data text-right">{formatCurrency(m.joao)}</TableCell>
                      <TableCell className="text-xs font-data text-right">{formatCurrency(m.maria)}</TableCell>
                      <TableCell className="text-xs font-data text-right text-destructive">{formatCurrency(m.inssPatronal)}</TableCell>
                      <TableCell className="text-xs font-data text-right text-destructive">{formatCurrency(m.irrf)}</TableCell>
                      <TableCell className="text-xs font-data text-right font-semibold">{formatCurrency(m.totalCost)}</TableCell>
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
