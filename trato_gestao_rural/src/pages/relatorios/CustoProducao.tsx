import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";

const custoArrobaData = [
  { component: "Alimentação (ração, sal, pasto)", valor: 98.50 },
  { component: "Sanidade (vacinas, vermífugos)", valor: 12.30 },
  { component: "Mão de obra", valor: 28.40 },
  { component: "Depreciação de máquinas", valor: 8.70 },
  { component: "Financeiro (juros)", valor: 5.20 },
  { component: "Outros", valor: 6.90 },
];
const totalArroba = custoArrobaData.reduce((s, c) => s + c.valor, 0);
const precoVendaArroba = 310;

const custoLeiteData = [
  { component: "Alimentação", valor: 1.85 },
  { component: "Sanidade", valor: 0.22 },
  { component: "Mão de obra", valor: 0.65 },
  { component: "Depreciação", valor: 0.18 },
  { component: "Financeiro", valor: 0.08 },
  { component: "Outros", valor: 0.12 },
];
const totalLeite = custoLeiteData.reduce((s, c) => s + c.valor, 0);

const custoPeixeData = [
  { component: "Ração", valor: 6.80 },
  { component: "Alevinos", valor: 1.20 },
  { component: "Tratamentos", valor: 0.45 },
  { component: "Mão de obra", valor: 1.50 },
  { component: "Outros", valor: 0.55 },
];
const totalPeixe = custoPeixeData.reduce((s, c) => s + c.valor, 0);

const custoAgriData = [
  { cultura: "Alface", custoKg: 2.80, precoVenda: 4.50 },
  { cultura: "Tomate", custoKg: 3.20, precoVenda: 6.00 },
  { cultura: "Mandioca", custoKg: 1.10, precoVenda: 2.50 },
  { cultura: "Banana", custoKg: 1.50, precoVenda: 3.80 },
];

const evolucaoCusto = [
  { mes: "Jan", custo: 168, preco: 295 },
  { mes: "Fev", custo: 172, preco: 298 },
  { mes: "Mar", custo: 165, preco: 302 },
  { mes: "Abr", custo: 158, preco: 308 },
  { mes: "Mai", custo: 155, preco: 312 },
  { mes: "Jun", custo: 160, preco: 305 },
  { mes: "Jul", custo: 162, preco: 310 },
  { mes: "Ago", custo: 158, preco: 315 },
  { mes: "Set", custo: 155, preco: 308 },
  { mes: "Out", custo: 160, preco: 310 },
  { mes: "Nov", custo: 157, preco: 318 },
  { mes: "Dez", custo: 160, preco: 325 },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CustoTable({ data, unit, totalCusto, precoVenda, precoUnit }: {
  data: { component: string; valor: number }[];
  unit: string;
  totalCusto: number;
  precoVenda?: number;
  precoUnit?: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Componente</TableHead>
          <TableHead className="text-right">R$/{unit}</TableHead>
          <TableHead className="text-right">% do Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(row => (
          <TableRow key={row.component}>
            <TableCell>{row.component}</TableCell>
            <TableCell className="text-right">{fmt(row.valor)}</TableCell>
            <TableCell className="text-right">{((row.valor / totalCusto) * 100).toFixed(1)}%</TableCell>
          </TableRow>
        ))}
        <TableRow className="font-bold border-t-2">
          <TableCell>TOTAL</TableCell>
          <TableCell className="text-right">{fmt(totalCusto)}</TableCell>
          <TableCell className="text-right">100%</TableCell>
        </TableRow>
        {precoVenda !== undefined && (
          <TableRow>
            <TableCell className="text-muted-foreground">Preço médio de venda ({precoUnit || unit})</TableCell>
            <TableCell className="text-right font-medium">{fmt(precoVenda)}</TableCell>
            <TableCell className="text-right">
              <Badge variant={precoVenda > totalCusto ? "default" : "destructive"}>
                {precoVenda > totalCusto ? `+${fmt(precoVenda - totalCusto)} lucro` : `${fmt(precoVenda - totalCusto)} prejuízo`}
              </Badge>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default function CustoProducao() {
  const [tipo, setTipo] = useState("arroba");

  const chartConfig = {
    custo: { label: "Custo/@", color: "hsl(0 84% 60%)" },
    preco: { label: "Preço Venda/@", color: "hsl(142 71% 45%)" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Select defaultValue="ano">
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Mês</SelectItem>
            <SelectItem value="trimestre">Trimestre</SelectItem>
            <SelectItem value="ano">Ano</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="todas">
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Fazendas</SelectItem>
            <SelectItem value="f1">Fazenda São João</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="arroba">Carne / Arroba</SelectItem>
            <SelectItem value="leite">Leite / Litro</SelectItem>
            <SelectItem value="peixe">Peixe / kg</SelectItem>
            <SelectItem value="agricultura">Agricultura / kg</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tipo === "arroba" && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Custo por Arroba Produzida — Pecuária de Corte</CardTitle></CardHeader>
          <CardContent><CustoTable data={custoArrobaData} unit="@" totalCusto={totalArroba} precoVenda={precoVendaArroba} precoUnit="@" /></CardContent>
        </Card>
      )}
      {tipo === "leite" && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Custo por Litro — Produção Leiteira</CardTitle></CardHeader>
          <CardContent><CustoTable data={custoLeiteData} unit="L" totalCusto={totalLeite} precoVenda={3.40} precoUnit="L" /></CardContent>
        </Card>
      )}
      {tipo === "peixe" && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Custo por kg — Piscicultura</CardTitle></CardHeader>
          <CardContent><CustoTable data={custoPeixeData} unit="kg" totalCusto={totalPeixe} precoVenda={18.50} precoUnit="kg" /></CardContent>
        </Card>
      )}
      {tipo === "agricultura" && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Custo por kg — Agricultura</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cultura</TableHead>
                  <TableHead className="text-right">Custo/kg</TableHead>
                  <TableHead className="text-right">Preço Venda/kg</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custoAgriData.map(row => (
                  <TableRow key={row.cultura}>
                    <TableCell>{row.cultura}</TableCell>
                    <TableCell className="text-right">{fmt(row.custoKg)}</TableCell>
                    <TableCell className="text-right">{fmt(row.precoVenda)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={row.precoVenda > row.custoKg ? "default" : "destructive"}>
                        {((row.precoVenda - row.custoKg) / row.custoKg * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Gráfico Evolução Custo vs Preço */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Evolução do Custo de Produção vs Preço de Venda (por @)</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <AreaChart data={evolucaoCusto}>
              <defs>
                <linearGradient id="greenArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="redArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="preco" stroke="hsl(142 71% 45%)" fill="url(#greenArea)" strokeWidth={2} strokeDasharray="6 3" name="Preço Venda/@" />
              <Area type="monotone" dataKey="custo" stroke="hsl(0 84% 60%)" fill="url(#redArea)" strokeWidth={2} name="Custo/@" />
            </AreaChart>
          </ChartContainer>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "hsl(142 71% 45%)" }} />Preço {">"} Custo = Lucro</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "hsl(0 84% 60%)" }} />Custo {">"} Preço = Prejuízo</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
