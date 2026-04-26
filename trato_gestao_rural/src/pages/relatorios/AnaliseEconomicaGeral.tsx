import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3, PieChart } from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, Legend, Tooltip,
} from "recharts";

const receitaData = [
  { name: "Venda de Animais", value: 285000, color: "hsl(var(--primary))" },
  { name: "Leite", value: 78000, color: "hsl(142 71% 45%)" },
  { name: "Piscicultura", value: 42000, color: "hsl(199 89% 48%)" },
  { name: "Agricultura", value: 35000, color: "hsl(45 93% 47%)" },
  { name: "Outras", value: 12000, color: "hsl(var(--muted-foreground))" },
];

const custoData = [
  { name: "Alimentação", value: 125000, color: "hsl(var(--primary))" },
  { name: "Sanidade", value: 38000, color: "hsl(142 71% 45%)" },
  { name: "Mão de Obra", value: 62000, color: "hsl(199 89% 48%)" },
  { name: "Manutenção", value: 28000, color: "hsl(45 93% 47%)" },
  { name: "Financeiro", value: 18000, color: "hsl(0 84% 60%)" },
  { name: "Outros", value: 15000, color: "hsl(var(--muted-foreground))" },
];

const evolucaoMensal = [
  { mes: "Jan", receita: 38000, custo: 28000, margem: 26.3 },
  { mes: "Fev", receita: 35000, custo: 26000, margem: 25.7 },
  { mes: "Mar", receita: 42000, custo: 30000, margem: 28.6 },
  { mes: "Abr", receita: 48000, custo: 32000, margem: 33.3 },
  { mes: "Mai", receita: 52000, custo: 34000, margem: 34.6 },
  { mes: "Jun", receita: 45000, custo: 31000, margem: 31.1 },
  { mes: "Jul", receita: 55000, custo: 33000, margem: 40.0 },
  { mes: "Ago", receita: 60000, custo: 35000, margem: 41.7 },
  { mes: "Set", receita: 50000, custo: 32000, margem: 36.0 },
  { mes: "Out", receita: 58000, custo: 34000, margem: 41.4 },
  { mes: "Nov", receita: 62000, custo: 36000, margem: 41.9 },
  { mes: "Dez", receita: 70000, custo: 38000, margem: 45.7 },
];

const comparativo = [
  { indicador: "Receita Bruta", atual: 452000, anterior: 398000, meta: 500000 },
  { indicador: "Custo Operacional", atual: 286000, anterior: 275000, meta: 260000 },
  { indicador: "Lucro Bruto", atual: 166000, anterior: 123000, meta: 240000 },
  { indicador: "Margem Bruta %", atual: 36.7, anterior: 30.9, meta: 48.0 },
  { indicador: "ROI %", atual: 58.0, anterior: 44.7, meta: 80.0 },
  { indicador: "EBITDA", atual: 195000, anterior: 155000, meta: 270000 },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function AnaliseGeral() {
  const [periodo, setPeriodo] = useState("ano");
  const [metas, setMetas] = useState<Record<string, number>>(
    Object.fromEntries(comparativo.map(c => [c.indicador, c.meta]))
  );

  const receitaTotal = 452000;
  const custoTotal = 286000;
  const lucro = receitaTotal - custoTotal;
  const margem = (lucro / receitaTotal) * 100;
  const roi = (lucro / custoTotal) * 100;
  const ebitda = 195000;

  const cards = [
    { label: "Receita Bruta", value: fmt(receitaTotal), icon: DollarSign, trend: "+13.6%" },
    { label: "Custo Operacional", value: fmt(custoTotal), icon: TrendingDown, trend: "+4.0%" },
    { label: "Lucro Bruto", value: fmt(lucro), icon: TrendingUp, trend: "+34.9%" },
    { label: "Margem Bruta", value: `${margem.toFixed(1)}%`, icon: Percent, trend: "+5.8pp" },
    { label: "ROI", value: `${roi.toFixed(1)}%`, icon: BarChart3, trend: "+13.3pp" },
    { label: "EBITDA", value: fmt(ebitda), icon: TrendingUp, trend: "+25.8%" },
  ];

  const chartConfig = {
    receita: { label: "Receita", color: "hsl(142 71% 45%)" },
    custo: { label: "Custo", color: "hsl(0 84% 60%)" },
    margem: { label: "Margem %", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Mês</SelectItem>
            <SelectItem value="trimestre">Trimestre</SelectItem>
            <SelectItem value="semestre">Semestre</SelectItem>
            <SelectItem value="ano">Ano</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="todas">
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Fazendas</SelectItem>
            <SelectItem value="f1">Fazenda São João</SelectItem>
            <SelectItem value="f2">Fazenda Boa Vista</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="todos">
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos C. Custo</SelectItem>
            <SelectItem value="cc1">Pecuária</SelectItem>
            <SelectItem value="cc2">Leiteiro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-foreground">{c.value}</p>
              <Badge variant="secondary" className="text-xs mt-1">{c.trend}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos de Pizza */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><PieChart className="h-4 w-4" />Composição da Receita</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={receitaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {receitaData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><PieChart className="h-4 w-4" />Composição dos Custos</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie data={custoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {custoData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Mensal */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Evolução Mensal — Receita × Custo × Margem</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-72 w-full">
            <ComposedChart data={evolucaoMensal}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} className="fill-muted-foreground" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar yAxisId="left" dataKey="receita" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} barSize={18} name="Receita" />
              <Bar yAxisId="left" dataKey="custo" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} barSize={18} name="Custo" />
              <Line yAxisId="right" type="monotone" dataKey="margem" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Margem %" />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Tabela Comparativa */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Comparativo de Período</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicador</TableHead>
                <TableHead className="text-right">Período Atual</TableHead>
                <TableHead className="text-right">Período Anterior</TableHead>
                <TableHead className="text-right">Variação %</TableHead>
                <TableHead className="text-right">Meta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparativo.map(row => {
                const variacao = ((row.atual - row.anterior) / row.anterior) * 100;
                const isCurrency = !row.indicador.includes("%");
                const fmtVal = (v: number) => isCurrency ? fmt(v) : `${v.toFixed(1)}%`;
                return (
                  <TableRow key={row.indicador}>
                    <TableCell className="font-medium">{row.indicador}</TableCell>
                    <TableCell className="text-right">{fmtVal(row.atual)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtVal(row.anterior)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={variacao > 0 ? (row.indicador === "Custo Operacional" ? "destructive" : "default") : "secondary"}>
                        {variacao > 0 ? "+" : ""}{variacao.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        className="w-28 ml-auto text-right h-8"
                        value={metas[row.indicador] ?? ""}
                        onChange={e => setMetas(p => ({ ...p, [row.indicador]: Number(e.target.value) }))}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
