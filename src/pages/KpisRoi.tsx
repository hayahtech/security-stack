import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, PieChart,
  Pie, Cell,
} from "recharts";
import {
  ticketData, planSegmentation, ticketEvolution,
} from "@/mock/marginsData";
import { formatCurrency, formatCompact } from "@/mock/financialData";

export default function KpisRoi() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">KPIs & ROI</h1>
        <p className="text-muted-foreground font-data">Métricas SaaS: Ticket Médio, LTV, CAC e segmentação</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: Users, label: "Clientes Ativos", value: ticketData.totalClients.toLocaleString("pt-BR"), color: "border-primary/30 bg-primary/10", iconCls: "text-primary" },
          { icon: DollarSign, label: "Ticket Médio", value: formatCurrency(ticketData.avgTicket), color: "border-secondary/30 bg-secondary/10", iconCls: "text-secondary" },
          { icon: TrendingUp, label: "LTV Médio", value: formatCurrency(ticketData.ltv), color: "border-success/30 bg-success/10", iconCls: "text-success" },
          { icon: Target, label: "CAC", value: formatCurrency(ticketData.cac), color: "border-yellow-500/30 bg-yellow-500/10", iconCls: "text-yellow-500" },
          { icon: Zap, label: "LTV/CAC", value: `${ticketData.ltvCacRatio}x`, color: "border-success/30 bg-success/10", iconCls: "text-success" },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.color}`}>
            <kpi.icon className={`h-5 w-5 mb-2 ${kpi.iconCls}`} />
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-xl font-display font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* LTV/CAC interpretation */}
      <div className="p-4 rounded-lg bg-success/5 border border-success/20 flex items-center gap-3">
        <Zap className="h-6 w-6 text-success flex-shrink-0" />
        <div>
          <p className="font-display font-semibold text-success">LTV/CAC de {ticketData.ltvCacRatio}x — Excelente!</p>
          <p className="text-sm text-muted-foreground">Benchmark SaaS: &gt;3x é saudável. A TechBR recupera o CAC quase 30 vezes no ciclo de vida do cliente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segmentation by Plan */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Segmentação por Plano</h3>
          <div className="space-y-4 mb-6">
            {planSegmentation.map((plan) => (
              <div key={plan.plan} className="p-4 rounded-lg bg-muted/20 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span className="font-display font-semibold">{plan.plan}</span>
                  </div>
                  <Badge variant="outline">{plan.clients} clientes</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ticket: {formatCurrency(plan.ticket)}</span>
                  <span className="font-data font-medium">{formatCurrency(plan.revenue)}/mês</span>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Pie */}
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planSegmentation} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="revenue" nameKey="plan">
                  {planSegmentation.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }} formatter={(v: number) => [formatCurrency(v), ""]} />
                <Legend formatter={(v) => <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ticket Evolution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            <TrendingUp className="inline-block h-5 w-5 mr-2 text-primary" />
            Evolução do Ticket Médio — 12 Meses
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketEvolution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={10} tickLine={false} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(v) => formatCompact(v)} domain={[4500, 6000]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222, 35%, 13%)", border: "1px solid hsl(222, 30%, 20%)", borderRadius: "8px" }} formatter={(v: number) => [formatCurrency(v), ""]} />
                <Bar dataKey="ticket" name="Ticket Médio" fill="hsl(187, 100%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Crescimento de <strong className="text-success">+15%</strong> nos últimos 12 meses (meta: 5%/trimestre)
          </p>
        </div>
      </div>
    </div>
  );
}
