import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calculator, Target, TrendingUp, Percent, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Precificacao() {
  const [productName, setProductName] = useState("Plano Professional FinanceOS");
  const [infra, setInfra] = useState(180);
  const [support, setSupport] = useState(85);
  const [licenses, setLicenses] = useState(45);
  const [ga, setGa] = useState(120);
  const [desiredMargin, setDesiredMargin] = useState(65);
  const [discountPct, setDiscountPct] = useState(15);

  const cmv = infra + support + licenses;
  const salesPct = 15;
  const marketingPct = 8;
  const totalDirectCost = cmv + ga;
  const suggestedPrice = totalDirectCost / (1 - desiredMargin / 100);
  const currentPrice = 1890;
  const currentMargin = ((currentPrice - totalDirectCost) / currentPrice) * 100;
  const salesCost = suggestedPrice * (salesPct / 100);
  const marketingCost = suggestedPrice * (marketingPct / 100);

  const discountedPrice = currentPrice * (1 - discountPct / 100);
  const discountedMargin = ((discountedPrice - totalDirectCost) / discountedPrice) * 100;
  const annualImpact = (currentPrice - discountedPrice) * 12;
  const minMargin = 60;
  const discountViable = discountedMargin >= minMargin;
  const clientsToCompensate = Math.ceil(annualImpact / (currentPrice * 12));

  const breakEven = 623;
  const currentClients = 847;

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Calculadora de Precificação</h1>
        <p className="text-muted-foreground font-data text-sm">Custos & Despesas • Formação de preço com análise de margem</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Calculator */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-data flex items-center gap-2"><Calculator className="w-4 h-4 text-primary" /> Calculadora de Preço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-data block mb-1">Produto/Serviço</label>
              <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)}
                className="w-full p-2 rounded-lg bg-muted/50 border border-border text-xs font-data text-foreground" />
            </div>

            <div>
              <p className="text-xs font-data font-semibold text-foreground mb-2">CUSTOS DIRETOS (CMV):</p>
              {[
                { label: "Infraestrutura cloud", value: infra, set: setInfra },
                { label: "Suporte técnico", value: support, set: setSupport },
                { label: "Licenças de terceiros", value: licenses, set: setLicenses },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-data text-muted-foreground w-40">{c.label}</span>
                  <input type="number" value={c.value} onChange={(e) => c.set(Number(e.target.value))}
                    className="w-24 p-1.5 rounded bg-muted/50 border border-border text-xs font-data text-foreground text-right" />
                  <span className="text-[10px] text-muted-foreground font-data">/cliente/mês</span>
                </div>
              ))}
              <div className="flex justify-between p-2 rounded bg-muted/30 text-xs font-data">
                <span className="font-semibold">Total CMV</span><span className="font-semibold">{formatCurrency(cmv)}/mês</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-data font-semibold text-foreground mb-2">CUSTOS INDIRETOS:</p>
              <div className="flex items-center justify-between text-xs font-data text-muted-foreground mb-1">
                <span>Vendas ({salesPct}% da receita)</span><span>{formatCurrency(salesCost)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-data text-muted-foreground mb-1">
                <span>Marketing ({marketingPct}%)</span><span>{formatCurrency(marketingCost)}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-data text-muted-foreground w-40">G&A rateado</span>
                <input type="number" value={ga} onChange={(e) => setGa(Number(e.target.value))}
                  className="w-24 p-1.5 rounded bg-muted/50 border border-border text-xs font-data text-foreground text-right" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-data block mb-1">Margem desejada: {desiredMargin}%</label>
              <input type="range" min={30} max={85} value={desiredMargin} onChange={(e) => setDesiredMargin(Number(e.target.value))} className="w-full accent-primary" />
            </div>

            {/* Result */}
            <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 space-y-2">
              <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Preço sugerido</span><span className="text-xl font-bold text-primary">{formatCurrency(suggestedPrice)}/mês</span></div>
              <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Preço atual</span><span>{formatCurrency(currentPrice)}/mês</span></div>
              <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Margem atual</span>
                <Badge className={cn("text-[10px]", currentMargin >= desiredMargin ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30")}>
                  {currentMargin.toFixed(1)}% {currentMargin >= desiredMargin ? "✅" : "⚠️"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discount Simulator + Break-even */}
        <div className="space-y-4">
          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-data flex items-center gap-2"><Percent className="w-4 h-4 text-primary" /> Simulador de Desconto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-data block mb-1">Desconto oferecido: {discountPct}%</label>
                <input type="range" min={5} max={40} value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Preço com desconto</span><span className="font-semibold">{formatCurrency(discountedPrice)}/mês</span></div>
                <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Nova margem</span>
                  <span className={cn("font-semibold", discountViable ? "text-success" : "text-destructive")}>{discountedMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Impacto anual/cliente</span><span className="text-destructive">-{formatCurrency(annualImpact)}/ano</span></div>
                <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Clientes extras p/ compensar</span><span>{clientsToCompensate}</span></div>
              </div>
              <div className={cn("p-3 rounded-lg border flex items-center gap-2",
                discountViable ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
              )}>
                {discountViable ? <CheckCircle2 className="w-4 h-4 text-success" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
                <span className={cn("text-xs font-data font-semibold", discountViable ? "text-success" : "text-destructive")}>
                  {discountViable ? "🟢 DESCONTO VIÁVEL" : "🔴 DESCONTO INVIÁVEL — margem abaixo do mínimo"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-data flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Ponto de Equilíbrio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Break-even</span><span className="font-semibold">{breakEven} clientes</span></div>
              <div className="flex justify-between text-xs font-data"><span className="text-muted-foreground">Clientes atuais</span><span className="font-semibold text-success">{currentClients}</span></div>
              <Progress value={(breakEven / currentClients) * 100} className="h-3" />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-xs font-data text-success font-semibold">{currentClients} (atual) &gt; {breakEven} (mínimo) ✅</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
