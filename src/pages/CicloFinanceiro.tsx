import { useState } from "react";
import {
  RefreshCcw,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sliders,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import {
  cycleData, cycleHistory, cycleBenchmark,
} from "@/mock/marginsData";
import { cn } from "@/lib/utils";

export default function CicloFinanceiro() {
  const [simPmr, setSimPmr] = useState(cycleData.pmr);
  const simOperational = cycleData.pme + simPmr;
  const simFinancial = simOperational - cycleData.pmp;

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Ciclo Financeiro</h1>
        <p className="text-muted-foreground font-data">PME, PMR, PMP e ciclos operacional/financeiro</p>
      </div>

      {/* Cycle Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "PME", value: `${cycleData.pme.toFixed(1)}d`, sub: "Estocagem", color: "border-primary/30 bg-primary/10" },
          { label: "PMR", value: `${cycleData.pmr.toFixed(1)}d`, sub: "Recebimento", color: "border-secondary/30 bg-secondary/10" },
          { label: "PMP", value: `${cycleData.pmp.toFixed(1)}d`, sub: "Pagamento", color: "border-success/30 bg-success/10" },
          { label: "C. Operacional", value: `${cycleData.operationalCycle.toFixed(1)}d`, sub: "PME + PMR", color: "border-yellow-500/30 bg-yellow-500/10" },
          { label: "C. Financeiro", value: `${cycleData.financialCycle.toFixed(1)}d`, sub: "Favorável ✓", color: "border-success/30 bg-success/10" },
        ].map((c) => (
          <div key={c.label} className={cn("rounded-xl border p-4 text-center", c.color)}>
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-display font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Visual Timeline */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold text-lg mb-6">Diagrama do Ciclo</h3>
        <div className="relative">
          {/* Timeline bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {/* PME */}
            <div className="flex-shrink-0 text-center">
              <p className="text-xs text-muted-foreground mb-2">Compra</p>
              <div className="w-3 h-3 rounded-full bg-primary mx-auto" />
            </div>
            <div className="flex-1 h-2 rounded-full bg-primary/30 relative min-w-[60px]" style={{ flex: `${cycleData.pme}` }}>
              <div className="absolute inset-0 bg-primary/60 rounded-full animate-pulse" />
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-data text-primary whitespace-nowrap">PME: {cycleData.pme.toFixed(1)}d</span>
            </div>

            {/* PMR */}
            <div className="flex-shrink-0 text-center">
              <p className="text-xs text-muted-foreground mb-2">Venda</p>
              <div className="w-3 h-3 rounded-full bg-secondary mx-auto" />
            </div>
            <div className="flex-1 h-2 rounded-full bg-secondary/30 relative min-w-[200px]" style={{ flex: `${cycleData.pmr}` }}>
              <div className="absolute inset-0 bg-secondary/60 rounded-full" />
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-data text-secondary whitespace-nowrap">PMR: {cycleData.pmr.toFixed(1)}d</span>
            </div>

            <div className="flex-shrink-0 text-center">
              <p className="text-xs text-muted-foreground mb-2">Recebe</p>
              <div className="w-3 h-3 rounded-full bg-success mx-auto" />
            </div>
          </div>

          {/* PMP bar below */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex-shrink-0 text-center">
              <div className="w-3 h-3 rounded-full bg-destructive mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">Compra</p>
            </div>
            <div className="flex-1 h-2 rounded-full bg-destructive/30 relative" style={{ flex: `${cycleData.pmp}` }}>
              <div className="absolute inset-0 bg-destructive/40 rounded-full" />
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-data text-destructive whitespace-nowrap">PMP: {cycleData.pmp.toFixed(1)}d</span>
            </div>
            <div className="flex-shrink-0 text-center">
              <div className="w-3 h-3 rounded-full bg-destructive mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">Paga</p>
            </div>
          </div>
        </div>

        <div className="mt-10 p-4 rounded-lg bg-success/5 border border-success/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="font-display font-semibold text-success">Ciclo Financeiro Negativo: {cycleData.financialCycle.toFixed(1)} dias</span>
          </div>
          <p className="text-sm text-muted-foreground">
            A empresa recebe de seus clientes <strong>antes</strong> de pagar seus fornecedores.
            Isso representa uma vantagem competitiva significativa, gerando capital de giro espontâneo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulador */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            <Sliders className="inline-block h-5 w-5 mr-2 text-secondary" />
            Simulador: E se o PMR mudar?
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">PMR: {simPmr.toFixed(1)} dias</span>
                <span className="text-sm text-muted-foreground">Atual: {cycleData.pmr.toFixed(1)}d</span>
              </div>
              <Slider
                value={[simPmr]}
                onValueChange={(v) => setSimPmr(v[0])}
                min={20}
                max={90}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ciclo Operacional</span>
                <span className="font-data font-medium">{simOperational.toFixed(1)} dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ciclo Financeiro</span>
                <span className={cn("font-display font-bold text-lg", simFinancial <= 0 ? "text-success" : "text-destructive")}>
                  {simFinancial.toFixed(1)} dias
                </span>
              </div>
              <Badge className={cn(
                "w-full justify-center py-2",
                simFinancial <= 0 ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"
              )}>
                {simFinancial <= 0 ? "✓ Ciclo favorável" : "⚠ Ciclo desfavorável — necessita capital de giro"}
              </Badge>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            <Clock className="inline-block h-5 w-5 mr-2 text-primary" />
            Evolução — 6 Meses
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cycleHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }} formatter={(v: number) => [`${v} dias`, ""]} />
                <ReferenceLine y={0} stroke="hsl(215, 20%, 55%)" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="pmr" name="PMR" stroke="hsl(252, 100%, 69%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pmp" name="PMP" stroke="hsl(152, 100%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="financial" name="C. Financeiro" stroke="hsl(187, 100%, 50%)" strokeWidth={3} dot={{ r: 4 }} />
                <Legend formatter={(v) => <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>{v}</span>} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
