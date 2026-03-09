import { useState } from "react";
import {
  AlertTriangle,
  TrendingUp,
  Shield,
  Send,
  Ban,
  Handshake,
  FileX,
  Percent,
  BarChart3,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  agingData,
  totalDelinquency,
  topDebtors,
  delinquencyEvolution,
  recoveryRate,
  type Debtor,
} from "@/mock/accountsData";
import { formatCurrency, formatCompact } from "@/mock/financialData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function RiskBadge({ risk }: { risk: Debtor["riskScore"] }) {
  const map = {
    low: { label: "Baixo", cls: "bg-success/20 text-success border-success/30" },
    medium: { label: "Médio", cls: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" },
    high: { label: "Alto", cls: "bg-destructive/20 text-destructive border-destructive/30" },
  };
  const { label, cls } = map[risk];
  return <Badge className={cls}>{label}</Badge>;
}

export default function Inadimplencia() {
  const handleAction = (action: string, name: string) => {
    toast.success(`${action}: ${name}`, { description: "Ação registrada." });
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Inadimplência
          </h1>
          <p className="text-muted-foreground font-data">
            Gestão de cobranças e recuperação de crédito
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 bg-muted/50" onClick={() => toast.success("Exportando Aging Report...")}>
          <Download className="h-4 w-4" />
          Exportar Aging Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Total Inadimplente</span>
          </div>
          <p className="text-3xl font-display font-bold text-destructive">
            {formatCurrency(totalDelinquency)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Percent className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Índice</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">14,7%</p>
          <p className="text-xs text-muted-foreground">sobre contas a receber</p>
        </div>

        <div className="rounded-xl border border-success/30 bg-success/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Taxa de Recuperação</span>
          </div>
          <p className="text-3xl font-display font-bold text-success">{recoveryRate}%</p>
          <p className="text-xs text-muted-foreground">histórico</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-5 w-5 text-secondary" />
            <span className="text-sm text-muted-foreground">Devedores Ativos</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{topDebtors.length}</p>
        </div>
      </div>

      {/* Aging by Range + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Bars */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            Aging por Faixa de Atraso
          </h3>
          <div className="space-y-4">
            {agingData.map((item) => (
              <div key={item.range}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-data text-muted-foreground">{item.range}</span>
                  <div className="flex gap-3">
                    <span className="font-data font-medium">{formatCurrency(item.value)}</span>
                    <span className="font-data text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold text-lg mb-4">
            Composição da Inadimplência
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={agingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="range"
                >
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 35%, 13%)",
                    border: "1px solid hsl(222, 30%, 20%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            {agingData.map((item) => (
              <div key={item.range} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-display font-semibold text-lg mb-4">
          <TrendingUp className="inline-block h-5 w-5 mr-2 text-destructive" />
          Evolução da Inadimplência — Últimos 6 Meses
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={delinquencyEvolution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} />
              <YAxis yAxisId="left" stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(v) => formatCompact(v)} />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 35%, 13%)",
                  border: "1px solid hsl(222, 30%, 20%)",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  name === "rate" ? `${value}%` : formatCurrency(value),
                  name === "rate" ? "Taxa" : "Valor",
                ]}
              />
              <Bar yAxisId="left" dataKey="value" name="value" fill="hsl(354, 100%, 64%)" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Line yAxisId="right" type="monotone" dataKey="rate" name="rate" stroke="hsl(45, 100%, 50%)" strokeWidth={3} dot={{ fill: "hsl(45, 100%, 50%)", r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Debtors */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold text-lg">
            Top 10 Devedores
          </h3>
          <p className="text-sm text-muted-foreground">Ranking por valor de débito</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-display w-8">#</TableHead>
                <TableHead className="font-display">Empresa</TableHead>
                <TableHead className="font-display">CNPJ</TableHead>
                <TableHead className="font-display text-right">Dívida Total</TableHead>
                <TableHead className="font-display text-center">Dias Atraso</TableHead>
                <TableHead className="font-display text-center">Risco</TableHead>
                <TableHead className="font-display text-center">Tentativas</TableHead>
                <TableHead className="font-display text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDebtors.map((d, i) => (
                <TableRow key={d.id} className="hover:bg-muted/20">
                  <TableCell className="font-data text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-data font-medium">{d.name}</TableCell>
                  <TableCell className="font-data text-muted-foreground">{d.cnpj}</TableCell>
                  <TableCell className="font-data text-right tabular-nums text-destructive font-medium">
                    {formatCurrency(d.totalDebt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-data font-medium",
                      d.daysOverdue > 60 ? "text-destructive" : d.daysOverdue > 30 ? "text-orange-500" : "text-yellow-500"
                    )}>
                      {d.daysOverdue}d
                    </span>
                  </TableCell>
                  <TableCell className="text-center"><RiskBadge risk={d.riskScore} /></TableCell>
                  <TableCell className="text-center font-data">{d.attempts}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">Ações</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-card border-border">
                        <DropdownMenuItem onClick={() => handleAction("Cobrança enviada", d.name)}>
                          <Send className="h-4 w-4 mr-2" /> Enviar Cobrança
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("Negativação solicitada", d.name)}>
                          <Ban className="h-4 w-4 mr-2" /> Negativar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("Renegociação iniciada", d.name)}>
                          <Handshake className="h-4 w-4 mr-2" /> Renegociar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("Baixa como perda", d.name)} className="text-destructive">
                          <FileX className="h-4 w-4 mr-2" /> Baixar como Perda
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
