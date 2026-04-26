import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

const pastoData = [
  { pasto: "Pasto 1 — Braquiarão", area: 25, animais: 42, lotacao: 1.68, custo: 12500, receita: 28000, resultado: 15500, resultadoHa: 620, gmd: 0.52, variacao: 8.2 },
  { pasto: "Pasto 2 — Mombaça", area: 18, animais: 35, lotacao: 1.94, custo: 10800, receita: 24500, resultado: 13700, resultadoHa: 761, gmd: 0.58, variacao: 12.5 },
  { pasto: "Pasto 3 — Tifton", area: 12, animais: 20, lotacao: 1.67, custo: 7200, receita: 15000, resultado: 7800, resultadoHa: 650, gmd: 0.49, variacao: -3.1 },
  { pasto: "Pasto 4 — Marandu", area: 30, animais: 48, lotacao: 1.60, custo: 16000, receita: 30000, resultado: 14000, resultadoHa: 467, gmd: 0.45, variacao: -5.8 },
  { pasto: "Pasto 5 — Tanzânia", area: 22, animais: 38, lotacao: 1.73, custo: 11000, receita: 22000, resultado: 11000, resultadoHa: 500, gmd: 0.51, variacao: 2.3 },
];

const centroCustoData = [
  { centro: "Pecuária de Corte", tipo: "Produção", custo: 186000, receita: 285000, resultado: 99000, pctTotal: 44.2 },
  { centro: "Leite", tipo: "Produção", custo: 62000, receita: 78000, resultado: 16000, pctTotal: 7.1 },
  { centro: "Piscicultura", tipo: "Produção", custo: 28000, receita: 42000, resultado: 14000, pctTotal: 6.3 },
  { centro: "Agricultura", tipo: "Produção", custo: 22000, receita: 35000, resultado: 13000, pctTotal: 5.8 },
  { centro: "Administração", tipo: "Overhead", custo: 45000, receita: 0, resultado: -45000, pctTotal: -20.1 },
  { centro: "Manutenção", tipo: "Suporte", custo: 28000, receita: 0, resultado: -28000, pctTotal: -12.5 },
];

const atividadeData = [
  { nome: "Pecuária de Corte", receita: 285000, custo: 186000, resultado: 99000, margem: 34.7, icon: "🐂" },
  { nome: "Leite", receita: 78000, custo: 62000, resultado: 16000, margem: 20.5, icon: "🥛" },
  { nome: "Piscicultura", receita: 42000, custo: 28000, resultado: 14000, margem: 33.3, icon: "🐟" },
  { nome: "Agricultura", receita: 35000, custo: 22000, resultado: 13000, margem: 37.1, icon: "🌱" },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const heatColor = (value: number, max: number, min: number) => {
  const ratio = (value - min) / (max - min);
  if (ratio > 0.75) return "bg-green-600/20 border-green-600/30 text-green-700 dark:text-green-400";
  if (ratio > 0.5) return "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400";
  if (ratio > 0.25) return "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400";
  return "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400";
};

const ccChartData = centroCustoData.map(c => ({ nome: c.centro, resultado: c.resultado }));

export default function ResultadosPorArea() {
  const ranking = [...pastoData].sort((a, b) => b.resultadoHa - a.resultadoHa);
  const maxHa = Math.max(...pastoData.map(p => p.resultadoHa));
  const minHa = Math.min(...pastoData.map(p => p.resultadoHa));

  const chartConfig = {
    resultado: { label: "Resultado", color: "hsl(var(--primary))" },
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
      </div>

      {/* Ranking de Pastos */}
      <div className="grid md:grid-cols-3 gap-4">
        {ranking.slice(0, 3).map((p, i) => (
          <Card key={p.pasto} className={i === 0 ? "border-primary/30" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{["🥇", "🥈", "🥉"][i]}</span>
                <span className="text-sm font-medium text-foreground">{p.pasto}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{fmt(p.resultadoHa)}/ha</p>
              <Badge variant={p.variacao > 0 ? "default" : "destructive"} className="mt-1">
                {p.variacao > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {p.variacao > 0 ? "+" : ""}{p.variacao}% vs anterior
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela de Pastos */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Resultado por Pasto/Área</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pasto</TableHead>
                <TableHead className="text-right">Área (ha)</TableHead>
                <TableHead className="text-right">Animais</TableHead>
                <TableHead className="text-right">Lotação (UA/ha)</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Resultado</TableHead>
                <TableHead className="text-right">R$/ha</TableHead>
                <TableHead className="text-right">GMD</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastoData.map(p => (
                <TableRow key={p.pasto}>
                  <TableCell className="font-medium">{p.pasto}</TableCell>
                  <TableCell className="text-right">{p.area}</TableCell>
                  <TableCell className="text-right">{p.animais}</TableCell>
                  <TableCell className="text-right">{p.lotacao.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{fmt(p.custo)}</TableCell>
                  <TableCell className="text-right">{fmt(p.receita)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(p.resultado)}</TableCell>
                  <TableCell className="text-right font-bold">{fmt(p.resultadoHa)}</TableCell>
                  <TableCell className="text-right">{p.gmd.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mapa de Calor */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Mapa de Calor — Resultado por Hectare</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {pastoData.map(p => (
              <div key={p.pasto} className={`rounded-lg border p-4 text-center ${heatColor(p.resultadoHa, maxHa, minHa)}`}>
                <p className="text-xs font-medium truncate">{p.pasto.split("—")[0]}</p>
                <p className="text-lg font-bold mt-1">{fmt(p.resultadoHa)}</p>
                <p className="text-xs opacity-70">/ha</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-6 rounded bg-green-600/20" />Melhor</span>
            <span className="flex items-center gap-1"><span className="h-2 w-6 rounded bg-yellow-500/10" />Médio</span>
            <span className="flex items-center gap-1"><span className="h-2 w-6 rounded bg-red-500/10" />Pior</span>
          </div>
        </CardContent>
      </Card>

      {/* Centro de Custo */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Resultado por Centro de Custo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centro de Custo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Resultado</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centroCustoData.map(c => (
                <TableRow key={c.centro}>
                  <TableCell className="font-medium">{c.centro}</TableCell>
                  <TableCell><Badge variant="outline">{c.tipo}</Badge></TableCell>
                  <TableCell className="text-right">{fmt(c.custo)}</TableCell>
                  <TableCell className="text-right">{c.receita > 0 ? fmt(c.receita) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <span className={c.resultado >= 0 ? "text-primary" : "text-destructive"}>{fmt(c.resultado)}</span>
                  </TableCell>
                  <TableCell className="text-right">{c.pctTotal.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart data={ccChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} className="fill-muted-foreground" />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 11 }} width={120} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="resultado" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Resultado" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Resultado por Atividade */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Resultado por Atividade</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {atividadeData.sort((a, b) => b.resultado - a.resultado).map((a, i) => (
              <Card key={a.nome} className={i === 0 ? "border-primary/30" : ""}>
                <CardContent className="p-4 text-center">
                  <span className="text-2xl">{a.icon}</span>
                  <p className="text-sm font-medium text-foreground mt-1">{a.nome}</p>
                  <p className="text-xl font-bold text-foreground mt-2">{fmt(a.resultado)}</p>
                  <p className="text-xs text-muted-foreground">Margem: {a.margem}%</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    Receita: {fmt(a.receita)}<br />Custo: {fmt(a.custo)}
                  </div>
                  {i === 0 && <Badge className="mt-2">Mais Rentável</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
