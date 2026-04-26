import React, { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Minus, BarChart2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { paymentInstruments } from "@/data/financeiro-mock";

const fmt = (v: number) =>
  `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtSigned = (v: number) =>
  `${v < 0 ? "- " : ""}R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

// ── DFC Line ──────────────────────────────────────────────
interface DFCLine {
  id: string;
  label: string;
  level: number; // 0=section, 1=detail, 2=subtotal
  sign: "+" | "-" | "=";
  value: number;
  isTotal?: boolean;
  isHighlight?: boolean;
}

// ── Mock Data ─────────────────────────────────────────────
const dfcDireto: DFCLine[] = [
  // Operacional
  { id: "op-title", label: "ATIVIDADES OPERACIONAIS", level: 0, sign: "+", value: 0, isTotal: true },
  { id: "op-1", label: "Recebimentos de Clientes / Vendas", level: 1, sign: "+", value: 48500 },
  { id: "op-2", label: "Outros Recebimentos Operacionais", level: 1, sign: "+", value: 6200 },
  { id: "op-3", label: "Pagamentos a Fornecedores", level: 1, sign: "-", value: -18400 },
  { id: "op-4", label: "Pagamentos de Pessoal", level: 1, sign: "-", value: -12800 },
  { id: "op-5", label: "Outros Pagamentos Operacionais", level: 1, sign: "-", value: -5100 },
  { id: "op-sub", label: "CAIXA LÍQUIDO OPERACIONAL", level: 2, sign: "=", value: 18400, isTotal: true, isHighlight: true },

  // Investimento
  { id: "inv-title", label: "ATIVIDADES DE INVESTIMENTO", level: 0, sign: "+", value: 0, isTotal: true },
  { id: "inv-1", label: "Compra de Ativos / Equipamentos", level: 1, sign: "-", value: -8500 },
  { id: "inv-2", label: "Venda de Ativos", level: 1, sign: "+", value: 2000 },
  { id: "inv-3", label: "Compra de Animais", level: 1, sign: "-", value: -12000 },
  { id: "inv-4", label: "Venda de Animais (investimento)", level: 1, sign: "+", value: 5500 },
  { id: "inv-sub", label: "CAIXA LÍQUIDO INVESTIMENTO", level: 2, sign: "=", value: -13000, isTotal: true, isHighlight: true },

  // Financiamento
  { id: "fin-title", label: "ATIVIDADES DE FINANCIAMENTO", level: 0, sign: "+", value: 0, isTotal: true },
  { id: "fin-1", label: "Empréstimos Recebidos", level: 1, sign: "+", value: 15000 },
  { id: "fin-2", label: "Amortização de Dívidas", level: 1, sign: "-", value: -8200 },
  { id: "fin-sub", label: "CAIXA LÍQUIDO FINANCIAMENTO", level: 2, sign: "=", value: 6800, isTotal: true, isHighlight: true },

  // Resultado
  { id: "var", label: "VARIAÇÃO LÍQUIDA DO CAIXA", level: 0, sign: "=", value: 12200, isTotal: true, isHighlight: true },
];

const dfcIndireto: DFCLine[] = [
  { id: "op-title", label: "ATIVIDADES OPERACIONAIS", level: 0, sign: "+", value: 0, isTotal: true },
  { id: "op-1", label: "Resultado Líquido do Período", level: 1, sign: "+", value: 14850 },
  { id: "op-2", label: "(+) Depreciação e Amortização", level: 1, sign: "+", value: 2800 },
  { id: "op-3", label: "(+/-) Variação de Contas a Receber", level: 1, sign: "-", value: -1200 },
  { id: "op-4", label: "(+/-) Variação de Estoques", level: 1, sign: "+", value: 800 },
  { id: "op-5", label: "(+/-) Variação de Fornecedores", level: 1, sign: "+", value: 1150 },
  { id: "op-sub", label: "CAIXA LÍQUIDO OPERACIONAL", level: 2, sign: "=", value: 18400, isTotal: true, isHighlight: true },

  { id: "inv-title", label: "ATIVIDADES DE INVESTIMENTO", level: 0, sign: "+", value: 0, isTotal: true },
  { id: "inv-1", label: "Compra de Ativos / Equipamentos", level: 1, sign: "-", value: -8500 },
  { id: "inv-2", label: "Venda de Ativos", level: 1, sign: "+", value: 2000 },
  { id: "inv-3", label: "Compra de Animais", level: 1, sign: "-", value: -12000 },
  { id: "inv-4", label: "Venda de Animais (investimento)", level: 1, sign: "+", value: 5500 },
  { id: "inv-sub", label: "CAIXA LÍQUIDO INVESTIMENTO", level: 2, sign: "=", value: -13000, isTotal: true, isHighlight: true },

  { id: "fin-title", label: "ATIVIDADES DE FINANCIAMENTO", level: 0, sign: "+", value: 0, isTotal: true },
  { id: "fin-1", label: "Empréstimos Recebidos", level: 1, sign: "+", value: 15000 },
  { id: "fin-2", label: "Amortização de Dívidas", level: 1, sign: "-", value: -8200 },
  { id: "fin-sub", label: "CAIXA LÍQUIDO FINANCIAMENTO", level: 2, sign: "=", value: 6800, isTotal: true, isHighlight: true },

  { id: "var", label: "VARIAÇÃO LÍQUIDA DO CAIXA", level: 0, sign: "=", value: 12200, isTotal: true, isHighlight: true },
];

const saldoInicial = 175250;

// ── Stacked area chart data ───────────────────────────────
const areaData = [
  { mes: "Out", operacional: 15200, investimento: -5000, financiamento: 3000, saldo: 162000 },
  { mes: "Nov", operacional: 16800, investimento: -8200, financiamento: -2000, saldo: 168600 },
  { mes: "Dez", operacional: 14500, investimento: -3500, financiamento: 1200, saldo: 180800 },
  { mes: "Jan", operacional: 17200, investimento: -10000, financiamento: 5000, saldo: 193000 },
  { mes: "Fev", operacional: 15800, investimento: -6500, financiamento: -3000, saldo: 199300 },
  { mes: "Mar", operacional: 18400, investimento: -13000, financiamento: 6800, saldo: 211500 },
];

// ── Component ─────────────────────────────────────────────
export default function DFCPage() {
  const [periodo, setPeriodo] = useState("mensal");
  const [metodo, setMetodo] = useState<"direto" | "indireto">("direto");
  const [conta, setConta] = useState("todas");

  const lines = metodo === "direto" ? dfcDireto : dfcIndireto;
  const saldoFinal = saldoInicial + 12200;

  const contas = [
    { value: "todas", label: "Todas as Contas" },
    ...paymentInstruments
      .filter((p) => p.type !== "cartao_credito")
      .map((p) => ({ value: p.id, label: p.name })),
  ];

  const maxAbs = useMemo(
    () => Math.max(...lines.filter((l) => l.value !== 0).map((l) => Math.abs(l.value)), 1),
    [lines],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-primary" />
          DFC — Demonstração do Fluxo de Caixa
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão detalhada das entradas e saídas de caixa por atividade
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Método</Label>
            <RadioGroup
              value={metodo}
              onValueChange={(v) => setMetodo(v as "direto" | "indireto")}
              className="flex gap-4 pt-1"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="direto" id="direto" />
                <Label htmlFor="direto" className="text-sm cursor-pointer">Direto</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="indireto" id="indireto" />
                <Label htmlFor="indireto" className="text-sm cursor-pointer">Indireto</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Conta</Label>
            <Select value={conta} onValueChange={setConta}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                {contas.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Saldo Inicial</p>
            <p className="text-lg font-bold text-foreground">{fmt(saldoInicial)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Variação Líquida</p>
            <p className={`text-lg font-bold ${12200 >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {fmtSigned(12200)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Saldo Final</p>
            <p className="text-lg font-bold text-foreground">{fmt(saldoFinal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* DFC Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Descrição</TableHead>
                <TableHead className="text-right w-[20%]">Valor</TableHead>
                <TableHead className="w-[30%]">Proporção</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.filter((l) => !(l.level === 0 && l.value === 0 && !l.isHighlight)).map((line) => {
                const showBar = line.value !== 0 && line.level !== 0;
                const barWidth = showBar ? (Math.abs(line.value) / maxAbs) * 100 : 0;
                const isPositive = line.value >= 0;

                return (
                  <TableRow
                    key={line.id}
                    className={
                      line.isHighlight
                        ? "bg-primary/5 font-bold"
                        : line.level === 0
                        ? "bg-muted/40"
                        : ""
                    }
                  >
                    <TableCell
                      className={`${
                        line.level === 1 ? "pl-8" : line.level === 2 ? "pl-6" : "pl-4"
                      } ${line.isTotal ? "font-semibold" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        {line.isHighlight && (
                          line.value > 0
                            ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                            : line.value < 0
                            ? <TrendingDown className="h-4 w-4 text-red-500" />
                            : <Minus className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={line.level === 0 ? "text-xs uppercase tracking-wider text-muted-foreground" : ""}>
                          {line.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm ${
                      line.isTotal || line.isHighlight ? "font-bold" : ""
                    } ${
                      line.value > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : line.value < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}>
                      {line.value !== 0 ? fmtSigned(line.value) : ""}
                    </TableCell>
                    <TableCell>
                      {showBar && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isPositive
                                  ? "bg-emerald-500/70"
                                  : "bg-red-500/70"
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {Math.round(barWidth)}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Saldo lines */}
              <TableRow className="border-t-2 border-primary/20">
                <TableCell className="pl-4 font-semibold">Saldo Inicial</TableCell>
                <TableCell className="text-right font-mono font-bold text-foreground">{fmt(saldoInicial)}</TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell className="pl-4 font-semibold">Variação</TableCell>
                <TableCell className={`text-right font-mono font-bold ${12200 >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {fmtSigned(12200)}
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow className="bg-primary/10">
                <TableCell className="pl-4 font-bold text-primary">SALDO FINAL</TableCell>
                <TableCell className="text-right font-mono font-bold text-primary">{fmt(saldoFinal)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stacked Area Chart */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Evolução do Caixa por Categoria
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gOp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="gFin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="mes" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <RechartsTooltip
                  formatter={(value: number, name: string) => [fmtSigned(value), name]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone" dataKey="operacional" name="Operacional"
                  stroke="hsl(var(--primary))" fill="url(#gOp)" stackId="1"
                />
                <Area
                  type="monotone" dataKey="investimento" name="Investimento"
                  stroke="#f59e0b" fill="url(#gInv)" stackId="1"
                />
                <Area
                  type="monotone" dataKey="financiamento" name="Financiamento"
                  stroke="#8b5cf6" fill="url(#gFin)" stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
