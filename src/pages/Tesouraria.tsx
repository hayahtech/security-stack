import {
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PiggyBank,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bankAccounts,
  totalAvailable,
  minimumCashRequired,
  recentTransactions,
} from "@/mock/cashFlowData";
import { formatCurrency } from "@/mock/financialData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function Tesouraria() {
  const hasAlert = bankAccounts.some((acc) => acc.balance < 500000);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Tesouraria
          </h1>
          <p className="text-muted-foreground font-data">
            Gestão de disponibilidades e movimentações
          </p>
        </div>

        {hasAlert && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
            <span className="text-sm font-data text-destructive">
              Alerta: Conta com saldo abaixo de R$ 500.000
            </span>
          </div>
        )}
      </div>

      {/* Bank Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {bankAccounts.map((account) => (
          <div
            key={account.id}
            className={cn(
              "rounded-xl border bg-card p-5 transition-all hover:scale-[1.02]",
              account.balance < 500000
                ? "border-destructive/50 bg-destructive/5"
                : "border-border"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: account.color }}
                />
                <div>
                  <p className="font-display font-semibold text-foreground text-sm">
                    {account.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{account.type}</p>
                </div>
              </div>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>

            <p className="text-2xl font-display font-bold text-foreground mb-2">
              {formatCurrency(account.balance)}
            </p>

            <div className="flex items-center gap-1">
              {account.variation >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={cn(
                  "text-sm font-data",
                  account.variation >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {account.variation >= 0 ? "+" : ""}
                {account.variation}%
              </span>
              <span className="text-xs text-muted-foreground">hoje</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total + Gráfico + Caixa Mínimo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Disponível */}
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6">
          <div className="flex items-center gap-3 mb-4">
            <PiggyBank className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Disponível</p>
              <p className="text-3xl font-display font-bold text-primary">
                {formatCurrency(totalAvailable)}
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Caixa Mínimo Necessário</span>
              <span className="font-data">{formatCurrency(minimumCashRequired)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Excedente</span>
              <span className="font-data text-success">
                {formatCurrency(totalAvailable - minimumCashRequired)}
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                style={{
                  width: `${Math.min((totalAvailable / (minimumCashRequired * 2)) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>Mínimo: {formatCurrency(minimumCashRequired)}</span>
              <span>{formatCurrency(minimumCashRequired * 2)}</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Composição */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h3 className="font-display font-semibold text-lg mb-4">
            Composição do Caixa
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bankAccounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="balance"
                  nameKey="name"
                >
                  {bankAccounts.map((entry, index) => (
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
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela de Movimentações */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-semibold text-lg">
            Movimentações Recentes
          </h3>
          <p className="text-sm text-muted-foreground">Últimas 20 transações</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-display">Data</TableHead>
                <TableHead className="font-display">Descrição</TableHead>
                <TableHead className="font-display">Conta</TableHead>
                <TableHead className="font-display">Categoria</TableHead>
                <TableHead className="font-display text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/20">
                  <TableCell className="font-data text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="font-data">{tx.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-data">
                      {tx.account}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-data text-muted-foreground">
                    {tx.category}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-data font-medium tabular-nums",
                      tx.type === "credit" ? "text-success" : "text-destructive"
                    )}
                  >
                    {tx.type === "credit" ? "+" : ""}
                    {formatCurrency(tx.value)}
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
