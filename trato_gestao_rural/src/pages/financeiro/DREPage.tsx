import React, { useState, useMemo } from "react";
import {
  FileBarChart, TrendingUp, TrendingDown, Minus, FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { costCenters } from "@/data/financeiro-mock";

const fmt = (v: number) => `R$ ${Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const pct = (cur: number, prev: number) => prev === 0 ? 0 : ((cur - prev) / Math.abs(prev)) * 100;

// ── DRE Line Types ────────────────────────────────────────
interface DRELine {
  id: string;
  label: string;
  level: number; // 0 = total, 1 = group, 2 = detail
  sign: "+" | "-" | "=";
  current: number;
  previous: number;
  isTotal?: boolean;
  isHighlight?: boolean;
}

// ── Mock DRE Data ─────────────────────────────────────────
const dreDataMar: DRELine[] = [
  { id: "rb", label: "RECEITA BRUTA", level: 0, sign: "+", current: 56200, previous: 57800, isTotal: true },
  { id: "rb-1", label: "Venda de Animais", level: 2, sign: "+", current: 30000, previous: 32000 },
  { id: "rb-2", label: "Venda de Leite", level: 2, sign: "+", current: 16700, previous: 15600 },
  { id: "rb-3", label: "Aluguel de Pasto", level: 2, sign: "+", current: 3000, previous: 3000 },
  { id: "rb-4", label: "Receitas Diversas", level: 2, sign: "+", current: 6500, previous: 7200 },

  { id: "ded", label: "DEDUÇÕES E IMPOSTOS", level: 0, sign: "-", current: 3930, previous: 4050, isTotal: true },
  { id: "ded-1", label: "Funrural (2,3%)", level: 2, sign: "-", current: 1293, previous: 1330 },
  { id: "ded-2", label: "ICMS", level: 2, sign: "-", current: 1687, previous: 1720 },
  { id: "ded-3", label: "Outros Impostos", level: 2, sign: "-", current: 950, previous: 1000 },

  { id: "rl", label: "RECEITA LÍQUIDA", level: 0, sign: "=", current: 52270, previous: 53750, isTotal: true, isHighlight: true },

  { id: "cop", label: "CUSTOS OPERACIONAIS", level: 0, sign: "-", current: 19400, previous: 22630, isTotal: true },
  { id: "cop-1", label: "Alimentação Animal", level: 2, sign: "-", current: 12800, previous: 16200 },
  { id: "cop-2", label: "Veterinário", level: 2, sign: "-", current: 3500, previous: 3200 },
  { id: "cop-3", label: "Manutenção de Pastos", level: 2, sign: "-", current: 1800, previous: 1830 },
  { id: "cop-4", label: "Combustível Operacional", level: 2, sign: "-", current: 1300, previous: 1400 },

  { id: "lb", label: "LUCRO BRUTO", level: 0, sign: "=", current: 32870, previous: 31120, isTotal: true, isHighlight: true },

  { id: "dop", label: "DESPESAS OPERACIONAIS", level: 0, sign: "-", current: 22900, previous: 20430, isTotal: true },
  { id: "dop-a", label: "Administrativas", level: 1, sign: "-", current: 3900, previous: 3830 },
  { id: "dop-a1", label: "Energia / Água / Telefone", level: 2, sign: "-", current: 1900, previous: 1830 },
  { id: "dop-a2", label: "Material de Escritório", level: 2, sign: "-", current: 500, previous: 500 },
  { id: "dop-a3", label: "Seguros", level: 2, sign: "-", current: 1500, previous: 1500 },
  { id: "dop-c", label: "Comerciais", level: 1, sign: "-", current: 1500, previous: 1600 },
  { id: "dop-c1", label: "Frete / Transporte", level: 2, sign: "-", current: 1200, previous: 1300 },
  { id: "dop-c2", label: "Comissões", level: 2, sign: "-", current: 300, previous: 300 },
  { id: "dop-p", label: "Pessoal", level: 1, sign: "-", current: 17500, previous: 15000 },
  { id: "dop-p1", label: "Salários", level: 2, sign: "-", current: 15000, previous: 15000 },
  { id: "dop-p2", label: "Encargos / Benefícios", level: 2, sign: "-", current: 2500, previous: 0 },

  { id: "ebitda", label: "EBITDA", level: 0, sign: "=", current: 9970, previous: 10690, isTotal: true, isHighlight: true },

  { id: "dep", label: "Depreciação e Amortização", level: 0, sign: "-", current: 2200, previous: 2200, isTotal: true },

  { id: "ebit", label: "EBIT", level: 0, sign: "=", current: 7770, previous: 8490, isTotal: true, isHighlight: true },

  { id: "rf", label: "RESULTADO FINANCEIRO", level: 0, sign: "+", current: -850, previous: -720, isTotal: true },
  { id: "rf-1", label: "Receitas Financeiras", level: 2, sign: "+", current: 350, previous: 280 },
  { id: "rf-2", label: "Despesas Financeiras / Juros", level: 2, sign: "-", current: 1200, previous: 1000 },

  { id: "rair", label: "RESULTADO ANTES DO IR", level: 0, sign: "=", current: 6920, previous: 7770, isTotal: true, isHighlight: true },

  { id: "ir", label: "Impostos (IR / CSLL)", level: 0, sign: "-", current: 1038, previous: 1166, isTotal: true },

  { id: "rl2", label: "RESULTADO LÍQUIDO", level: 0, sign: "=", current: 5882, previous: 6604, isTotal: true, isHighlight: true },
];

// ── Waterfall Chart Data ──────────────────────────────────
function buildWaterfallData(lines: DRELine[]) {
  const keys = ["rb", "ded", "cop", "dop", "dep", "rf", "ir", "rl2"];
  const labels: Record<string, string> = {
    rb: "Receita Bruta", ded: "Deduções", cop: "Custos Op.", dop: "Desp. Op.",
    dep: "Deprec.", rf: "Result. Fin.", ir: "IR/CSLL", rl2: "Result. Líq.",
  };
  let running = 0;
  return keys.map((k) => {
    const line = lines.find((l) => l.id === k)!;
    const value = line.sign === "-" ? -line.current : line.current;
    const start = running;
    running += value;
    const isResult = k === "rl2";
    return {
      name: labels[k],
      value: isResult ? running : value,
      start: isResult ? 0 : Math.min(start, start + value),
      end: isResult ? running : Math.max(start, start + value),
      fill: isResult
        ? running >= 0 ? "hsl(142, 50%, 45%)" : "hsl(0, 84%, 60%)"
        : value >= 0 ? "hsl(142, 50%, 45%)" : "hsl(0, 84%, 60%)",
    };
  });
}

// ── Main Component ────────────────────────────────────────
export default function DREPage() {
  const [period, setPeriod] = useState("mes");
  const [compare, setCompare] = useState(true);
  const [costCenter, setCostCenter] = useState("all");

  const data = dreDataMar;
  const maxValue = Math.max(...data.map((d) => Math.abs(d.current)));
  const waterfall = useMemo(() => buildWaterfallData(data), [data]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <FileBarChart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">DRE — Demonstração do Resultado</h1>
              <p className="text-sm text-muted-foreground">Março 2026</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1"><FileText className="h-4 w-4" /> Exportar PDF</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Mês</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="ano">Ano</SelectItem>
            </SelectContent>
          </Select>
          <Select value={costCenter} onValueChange={setCostCenter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os centros</SelectItem>
              {costCenters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch checked={compare} onCheckedChange={setCompare} id="compare" />
            <Label htmlFor="compare" className="text-sm">Comparar com anterior</Label>
          </div>
        </div>

        {/* DRE Table */}
        <Card className="border-border">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40%]">Descrição</TableHead>
                  <TableHead className="text-right">Atual</TableHead>
                  {compare && <TableHead className="text-right">Anterior</TableHead>}
                  {compare && <TableHead className="text-right w-[100px]">Variação</TableHead>}
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((line) => {
                  const variation = pct(line.current, line.previous);
                  const barWidth = (Math.abs(line.current) / maxValue) * 100;
                  const isPositive = line.current >= 0;

                  return (
                    <TableRow
                      key={line.id}
                      className={
                        line.isHighlight
                          ? "bg-primary/5 font-bold"
                          : line.isTotal
                            ? "bg-muted/30 font-semibold"
                            : ""
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${line.level * 20}px` }}>
                          {line.isTotal && (
                            <span className="text-xs text-muted-foreground w-5 shrink-0">
                              {line.sign === "+" ? "(+)" : line.sign === "-" ? "(−)" : "(=)"}
                            </span>
                          )}
                          <span className={`text-sm ${line.isTotal ? "text-foreground" : "text-muted-foreground"} ${line.isHighlight ? "text-foreground" : ""}`}>
                            {line.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right text-sm whitespace-nowrap ${
                        line.isHighlight
                          ? line.current >= 0 ? "text-primary" : "text-destructive"
                          : "text-foreground"
                      }`}>
                        {line.sign === "-" && !line.isTotal && line.level > 0 ? "- " : ""}
                        {fmt(line.current)}
                      </TableCell>
                      {compare && (
                        <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                          {fmt(line.previous)}
                        </TableCell>
                      )}
                      {compare && (
                        <TableCell className="text-right">
                          {line.previous !== 0 && (
                            <Badge
                              variant="secondary"
                              className={`text-[10px] gap-0.5 ${
                                variation > 0 ? "text-primary" : variation < 0 ? "text-destructive" : ""
                              }`}
                            >
                              {variation > 0 ? <TrendingUp className="h-3 w-3" /> : variation < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {Math.abs(variation).toFixed(1)}%
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isPositive ? "bg-primary/40" : "bg-destructive/40"}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Waterfall Chart */}
        <Card className="border-border">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-foreground mb-4">Composição do Resultado — Waterfall</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={waterfall} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => [fmt(Math.abs(value)), ""]}
                />
                {/* Invisible bar for the "start" offset */}
                <Bar dataKey="start" stackId="waterfall" fill="transparent" />
                {/* Visible bar showing the actual value range */}
                <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]}>
                  {waterfall.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
