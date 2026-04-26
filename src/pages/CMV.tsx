import {
  Package,
  TrendingDown,
  Lightbulb,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  cmvComposition, cmvTotal, cmvEvolution, cmvReductionOpportunities,
} from "@/mock/marginsData";
import { formatCurrency, formatCompact } from "@/mock/financialData";

export default function CMV() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">CMV — Custo da Mercadoria Vendida</h1>
        <p className="text-muted-foreground font-data">Composição e evolução dos custos diretos</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
          <Package className="h-5 w-5 text-primary mb-2" />
          <p className="text-sm text-muted-foreground">CMV Total</p>
          <p className="text-3xl font-display font-bold text-primary">{formatCurrency(cmvTotal)}</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-5">
          <TrendingDown className="h-5 w-5 text-success mb-2" />
          <p className="text-sm text-muted-foreground">% sobre Receita</p>
          <p className="text-3xl font-display font-bold text-success">30,0%</p>
          <p className="text-xs text-muted-foreground">Meta: &lt;32% ✓</p>
        </div>
        <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-5">
          <Lightbulb className="h-5 w-5 text-secondary mb-2" />
          <p className="text-sm text-muted-foreground">Economia Potencial</p>
          <p className="text-3xl font-display font-bold text-secondary">
            {formatCurrency(cmvReductionOpportunities.reduce((a, b) => a + b.saving, 0))}
          </p>
          <p className="text-xs text-muted-foreground">/mês com otimizações</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Composição do CMV</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cmvComposition} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} dataKey="value" nameKey="name">
                  {cmvComposition.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }} formatter={(v: number) => [formatCurrency(v), ""]} />
                <Legend formatter={(v) => <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "11px" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            <Target className="inline-block h-5 w-5 mr-2 text-primary" />
            CMV % sobre Receita — Evolução
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cmvEvolution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={10} tickLine={false} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} domain={[28, 34]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }} formatter={(v: number) => [`${v}%`, ""]} />
                <Bar dataKey="cmv" name="CMV %" fill="hsl(187, 100%, 50%)" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Line type="monotone" dataKey="target" name="Meta" stroke="hsl(354, 100%, 64%)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Legend formatter={(v) => <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>{v}</span>} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reduction Opportunities */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold text-lg mb-4">
          <Lightbulb className="inline-block h-5 w-5 mr-2 text-yellow-500" />
          Oportunidades de Redução de Custo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cmvReductionOpportunities.map((opp) => (
            <div key={opp.area} className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border">
              <div>
                <p className="font-data font-medium">{opp.area}</p>
                <Badge variant="outline" className="mt-1">{opp.effort}</Badge>
              </div>
              <span className="text-lg font-display font-bold text-success">
                -{formatCurrency(opp.saving)}/mês
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
