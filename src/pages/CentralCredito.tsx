import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, Calculator, TrendingUp, AlertTriangle, LineChart as LineIcon, BarChart3,
  CheckCircle2, XCircle, ArrowRight,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { creditModalities, activeLoans, opportunities, cashFlowWithCredit } from "@/mock/creditData";
import { cn } from "@/lib/utils";

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatCompact = (v: number) => {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return formatCurrency(v);
};

export default function CentralCredito() {
  const [amount, setAmount] = useState(500000);
  const [selectedModality, setSelectedModality] = useState("giro");
  const [installments, setInstallments] = useState(24);

  const modality = creditModalities.find((m) => m.id === selectedModality)!;
  const rate = modality.rateMonthly / 100;
  const monthlyPayment = modality.maxInstallments > 0
    ? (amount * rate * Math.pow(1 + rate, installments)) / (Math.pow(1 + rate, installments) - 1)
    : 0;
  const totalPayment = monthlyPayment * installments;
  const totalInterest = totalPayment - amount;
  const cetAnnual = ((Math.pow(1 + rate, 12) - 1) * 100).toFixed(1);

  const modalityComparison = creditModalities.filter((m) => m.maxInstallments > 0).map((m) => {
    const r = m.rateMonthly / 100;
    const inst = Math.min(installments, m.maxInstallments);
    const payment = (amount * r * Math.pow(1 + r, inst)) / (Math.pow(1 + r, inst) - 1);
    return { name: m.name, total: payment * inst, interest: payment * inst - amount };
  });

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Central de Crédito</h1>
        <p className="text-muted-foreground font-data text-sm">Tesouraria • Simulador de crédito e oportunidades financeiras</p>
      </div>

      <Tabs defaultValue="simulador" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="simulador" className="font-data text-xs">💰 Simulador</TabsTrigger>
          <TabsTrigger value="oportunidades" className="font-data text-xs">💡 Oportunidades</TabsTrigger>
          <TabsTrigger value="historico" className="font-data text-xs">📊 Crédito Ativo</TabsTrigger>
        </TabsList>

        <TabsContent value="simulador" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Calculator */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-data flex items-center gap-2"><Calculator className="w-4 h-4 text-primary" /> Simulador de Crédito</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground font-data block mb-1">Valor que precisa</label>
                  <input
                    type="text"
                    value={`R$ ${amount.toLocaleString("pt-BR")}`}
                    onChange={(e) => { const n = parseInt(e.target.value.replace(/\D/g, "")); if (!isNaN(n)) setAmount(n); }}
                    className="w-full p-2 rounded-lg bg-muted/50 border border-border text-sm font-data text-foreground font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground font-data block mb-2">Modalidade</label>
                  <div className="space-y-1">
                    {creditModalities.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModality(m.id); if (m.maxInstallments > 0) setInstallments(Math.min(installments, m.maxInstallments)); }}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left",
                          selectedModality === m.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                        )}
                      >
                        <span className="text-xs font-data text-foreground">{m.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-data text-muted-foreground">{m.rateLabel}</span>
                          {m.alert && <Badge className="text-[9px] bg-destructive/20 text-destructive border-destructive/30">{m.alert}</Badge>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {modality.maxInstallments > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground font-data block mb-1">Parcelas: {installments}x</label>
                    <input type="range" min={6} max={modality.maxInstallments} value={installments} onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-full accent-primary" />
                  </div>
                )}

                {/* Results */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                  {modality.maxInstallments > 0 ? (
                    <>
                      <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Parcela mensal</span><span className="text-lg font-bold text-primary">{formatCurrency(monthlyPayment)}</span></div>
                      <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">CET (anual)</span><span>{cetAnnual}%</span></div>
                      <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Total a pagar</span><span>{formatCurrency(totalPayment)}</span></div>
                      <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Juros totais</span><span className="text-destructive">+{formatCurrency(totalInterest)}</span></div>
                      <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Impacto Dívida/EBITDA</span>
                        <Badge className="bg-success/20 text-success border-success/30 text-[10px]">0,33x → 0,37x ✅</Badge>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs font-data text-muted-foreground text-center">Modalidade sem parcelamento fixo — consulte condições específicas</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cash flow impact */}
            <Card className="border-border/50 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-data">Impacto no Fluxo de Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cashFlowWithCredit}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={formatCompact} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: number) => formatCompact(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="sem" name="Sem crédito" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="com" name="Com crédito" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Modality comparison */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-data">Comparativo de Modalidades — Custo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={modalityComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatCompact} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oportunidades" className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-data">💡 Oportunidades Financeiras ({opportunities.length} identificadas)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {opportunities.map((opp) => (
                <div key={opp.id} className={cn("p-4 rounded-xl border", opp.severity === "green" ? "border-success/30 bg-success/5" : "border-yellow-500/30 bg-yellow-500/5")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge className={cn("text-[10px] mb-1", opp.severity === "green" ? "bg-success/20 text-success border-success/30" : "bg-yellow-500/20 text-yellow-500 border-yellow-500/30")}>
                        {opp.severity === "green" ? "🟢" : "🟡"} {opp.title}
                      </Badge>
                      <p className="text-xs font-data text-foreground mt-1">{opp.description}</p>
                    </div>
                    <span className="text-sm font-bold font-data text-success">+{formatCurrency(opp.potentialSaving)}/mês</span>
                  </div>
                  <p className="text-xs font-data text-muted-foreground">{opp.details}</p>
                  <p className="text-[10px] font-data text-muted-foreground mt-1">Risco: {opp.risk}</p>
                  <div className="flex gap-2 mt-3">
                    {opp.actions.map((a) => (
                      <Button key={a} size="sm" variant={a.includes("Simular") || a.includes("Calcular") ? "default" : "outline"} className="text-xs h-7">{a}</Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-data">Empréstimos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Banco</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs text-right">Valor Original</TableHead>
                    <TableHead className="text-xs text-right">Saldo Devedor</TableHead>
                    <TableHead className="text-xs">Taxa</TableHead>
                    <TableHead className="text-xs">Parcelas Rest.</TableHead>
                    <TableHead className="text-xs">Próx. Vcto</TableHead>
                    <TableHead className="text-xs text-right">Parcela</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeLoans.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs font-data font-medium">{l.bank}</TableCell>
                      <TableCell className="text-xs font-data">{l.type}</TableCell>
                      <TableCell className="text-xs font-data text-right">{formatCurrency(l.originalValue)}</TableCell>
                      <TableCell className="text-xs font-data text-right font-semibold">{formatCurrency(l.balance)}</TableCell>
                      <TableCell className="text-xs font-data">{l.rate}</TableCell>
                      <TableCell className="text-xs font-data">{l.installmentsLeft}x</TableCell>
                      <TableCell className="text-xs font-data">{l.nextDue}</TableCell>
                      <TableCell className="text-xs font-data text-right">{formatCurrency(l.monthlyPayment)}</TableCell>
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
