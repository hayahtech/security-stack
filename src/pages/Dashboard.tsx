import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Percent,
  Wallet,
  PiggyBank,
  Receipt,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import {
  currentMonth,
  annualData,
  companyInfo,
  kpis,
  formatCurrency,
  formatPercentage,
} from "@/mock/financialData";

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground font-data">
            Visão geral financeira • {companyInfo.segment}
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Faturamento Bruto"
          value={formatCurrency(currentMonth.grossRevenue)}
          change={5.2}
          changeLabel="vs mês anterior"
          icon={DollarSign}
          variant="default"
        />
        <KpiCard
          title="Faturamento Líquido"
          value={formatCurrency(currentMonth.netRevenue)}
          change={4.8}
          changeLabel="vs mês anterior"
          icon={TrendingUp}
          variant="default"
        />
        <KpiCard
          title="Lucro Líquido"
          value={formatCurrency(currentMonth.netProfit)}
          change={3.1}
          changeLabel="vs mês anterior"
          icon={PiggyBank}
          variant="success"
        />
        <KpiCard
          title="EBITDA"
          value={formatCurrency(currentMonth.ebitda)}
          change={2.5}
          changeLabel="vs mês anterior"
          icon={Target}
          variant="success"
        />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Clientes Ativos"
          value={companyInfo.activeClients.toLocaleString("pt-BR")}
          change={1.2}
          icon={Users}
        />
        <KpiCard
          title="Ticket Médio"
          value={formatCurrency(kpis.averageTicket)}
          change={2.1}
          icon={Receipt}
        />
        <KpiCard
          title="Margem EBITDA"
          value={formatPercentage(kpis.ebitdaMargin)}
          change={0.5}
          icon={Percent}
          variant="success"
        />
        <KpiCard
          title="Churn Rate"
          value={formatPercentage(kpis.churnRate)}
          change={-0.3}
          icon={Wallet}
          variant="warning"
        />
      </div>

      {/* Main Chart */}
      <RevenueChart />

      {/* Bottom Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Estrutura de Custos
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-data">CMV</span>
              <span className="text-sm font-data font-medium text-foreground">
                {formatPercentage(kpis.cmvPercentage)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${kpis.cmvPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-data">
                Despesas Operacionais
              </span>
              <span className="text-sm font-data font-medium text-foreground">
                {formatPercentage(kpis.operatingExpensesPercentage)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full"
                style={{ width: `${kpis.operatingExpensesPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-data">
                Despesas Financeiras
              </span>
              <span className="text-sm font-data font-medium text-foreground">
                {formatPercentage(kpis.financialExpensesPercentage)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-destructive rounded-full"
                style={{ width: `${kpis.financialExpensesPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Dados Anuais (Acumulado)
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground font-data">
                Faturamento Bruto
              </span>
              <span className="text-sm font-data font-medium text-foreground">
                {formatCurrency(annualData.grossRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-muted-foreground font-data">
                Faturamento Líquido
              </span>
              <span className="text-sm font-data font-medium text-foreground">
                {formatCurrency(annualData.netRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground font-data">
                Colaboradores
              </span>
              <span className="text-sm font-data font-medium text-foreground">
                {companyInfo.employees}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">
            Margens
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-data">
                Margem Bruta
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full"
                    style={{ width: "70%" }}
                  />
                </div>
                <span className="text-sm font-data font-medium text-success">70%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-data">
                Margem EBITDA
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: "25%" }}
                  />
                </div>
                <span className="text-sm font-data font-medium text-primary">25%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-data">
                Margem Líquida
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full"
                    style={{ width: "20%" }}
                  />
                </div>
                <span className="text-sm font-data font-medium text-secondary">20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
