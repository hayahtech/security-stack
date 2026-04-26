import React, { useState, useMemo } from "react";
import {
  Leaf, TrendingDown, TrendingUp, Minus, Download, Target,
  BarChart3, Info, ExternalLink, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, LineChart, Line, ReferenceLine,
} from "recharts";
import {
  calcBalancoAtual, getHistorico, FATORES, BENCHMARK, mockMeta, PROGRAMAS_CERTIFICACAO,
} from "@/data/carbono-mock";

const COLORS = ["#ef4444", "#f97316", "#3b82f6", "#8b5cf6", "#06b6d4"];

export default function PegadaCarbono() {
  const [tab, setTab] = useState("painel");
  const [creditoMin, setCreditoMin] = useState(30);
  const [creditoMax, setCreditoMax] = useState(80);

  const balanco = useMemo(() => calcBalancoAtual(), []);
  const historico = useMemo(() => getHistorico(), []);

  const isLowCarbon = balanco.balancoLiquido < 0;

  // Pie chart data
  const pieData = [
    { name: "Fermentação entérica", value: balanco.rebanho.emissaoEnterica / 1000 },
    { name: "Dejetos animais", value: balanco.rebanho.emissaoDejetos / 1000 },
    { name: "Combustíveis", value: balanco.combustivel.total / 1000 },
    { name: "Energia elétrica", value: balanco.energia.total / 1000 },
    { name: "Fertilizantes", value: balanco.fertilizante.total / 1000 },
  ];

  // Bar chart data
  const barData = historico.map((h) => ({
    ano: h.ano.toString(),
    "Emissões brutas": Number(h.emissoesBrutas.toFixed(1)),
    "Sequestro": Number(Math.abs(h.sequestroTotal).toFixed(1)),
    "Balanço líquido": Number(h.balancoLiquido.toFixed(1)),
  }));

  // Line chart (histórico)
  const lineData = historico.map((h) => ({
    ano: h.ano.toString(),
    balanco: Number(h.balancoLiquido.toFixed(1)),
    emissaoArroba: h.emissaoPorArroba,
  }));

  // Benchmark gauge position (0-100)
  const benchmarkMax = 12;
  const gaugePosition = Math.min(100, (balanco.emissaoPorArroba / benchmarkMax) * 100);
  const gaugeBrPos = (BENCHMARK.media_brasileira / benchmarkMax) * 100;
  const gaugeSustPos = (BENCHMARK.media_sustentavel / benchmarkMax) * 100;

  const creditosPotenciais = isLowCarbon ? Math.abs(balanco.balancoLiquido) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Leaf className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Pegada de Carbono
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            GHG Protocol Agro • IPCC — Ano {balanco.ano}
          </p>
        </div>
        <div className="flex gap-2">
          {isLowCarbon && (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-sm py-1.5 px-3">
              ✅ Fazenda de Baixo Carbono
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => toast({ title: "Gerando Relatório PDF..." })} className="gap-1">
            <Download className="h-3.5 w-3.5" /> Relatório PDF
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="painel">Painel Geral</TabsTrigger>
          <TabsTrigger value="emissoes">Fontes de Emissão</TabsTrigger>
          <TabsTrigger value="sequestro">Sequestro</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório & Certificação</TabsTrigger>
        </TabsList>

        {/* ══════════ ABA 1 — PAINEL GERAL ══════════ */}
        <TabsContent value="painel" className="space-y-6 mt-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Emissões brutas</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{balanco.emissoesBrutas.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">tCO₂eq</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Sequestro total</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{balanco.sequestroTotal.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">tCO₂eq</p>
              </CardContent>
            </Card>
            <Card className={isLowCarbon ? "border-emerald-300 dark:border-emerald-700" : "border-amber-300 dark:border-amber-700"}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Balanço líquido</p>
                <p className={`text-2xl font-bold ${isLowCarbon ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {balanco.balancoLiquido > 0 ? "+" : ""}{balanco.balancoLiquido.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">tCO₂eq</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Por arroba</p>
                <p className="text-2xl font-bold text-foreground">{balanco.emissaoPorArroba}</p>
                <p className="text-xs text-muted-foreground">kgCO₂eq/@</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Por hectare</p>
                <p className="text-2xl font-bold text-foreground">{balanco.emissaoPorHectare}</p>
                <p className="text-xs text-muted-foreground">tCO₂eq/ha</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Arrobas prod.</p>
                <p className="text-2xl font-bold text-foreground">{balanco.arrobasProduzidas}</p>
                <p className="text-xs text-muted-foreground">@ no ano</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Fontes de Emissão</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v.toFixed(1)} tCO₂eq`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bar chart */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Comparativo Anual</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="ano" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(v: number) => `${v} tCO₂eq`} />
                    <Legend />
                    <Bar dataKey="Emissões brutas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Sequestro" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Balanço líquido" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Benchmark gauge */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" /> Benchmark — Emissão por Arroba</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="relative h-10 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 overflow-hidden">
                {/* Sustainable marker */}
                <div className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: `${gaugeSustPos}%` }}>
                  <span className="absolute -top-5 -translate-x-1/2 text-[10px] font-medium text-foreground whitespace-nowrap">
                    Sustentável: {BENCHMARK.media_sustentavel}
                  </span>
                </div>
                {/* Brazilian avg marker */}
                <div className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: `${gaugeBrPos}%` }}>
                  <span className="absolute -bottom-5 -translate-x-1/2 text-[10px] font-medium text-foreground whitespace-nowrap">
                    Média BR: {BENCHMARK.media_brasileira}
                  </span>
                </div>
                {/* Your position */}
                <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-foreground border-2 border-background shadow-lg flex items-center justify-center" style={{ left: `calc(${gaugePosition}% - 10px)` }}>
                  <span className="text-[8px] font-bold text-background">▼</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-2">
                <span>0 kgCO₂eq/@</span>
                <span className="font-semibold text-primary">Sua fazenda: {balanco.emissaoPorArroba} kgCO₂eq/@</span>
                <span>{benchmarkMax} kgCO₂eq/@</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ ABA 2 — FONTES DE EMISSÃO ══════════ */}
        <TabsContent value="emissoes" className="space-y-6 mt-4">
          {/* Rebanho */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">🐄 Rebanho — Fermentação Entérica e Dejetos</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => toast({ title: "Dados atualizados do rebanho atual!" })}>
                  <RefreshCw className="h-3.5 w-3.5" /> Atualizar do rebanho
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Bovinos de corte</p>
                  <p className="text-xl font-bold text-foreground">{balanco.rebanho.bovinosCorte}</p>
                  <p className="text-xs text-muted-foreground">× {FATORES.enterica_corte} kgCO₂eq/cab/ano</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Bovinos leiteiros</p>
                  <p className="text-xl font-bold text-foreground">{balanco.rebanho.bovinosLeiteiros}</p>
                  <p className="text-xs text-muted-foreground">× {FATORES.enterica_leiteiro} kgCO₂eq/cab/ano</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Emissão entérica</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{(balanco.rebanho.emissaoEnterica / 1000).toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">tCO₂eq</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Emissão dejetos</p>
                  <p className="text-xl font-bold text-foreground">{(balanco.rebanho.emissaoDejetos / 1000).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">tCO₂eq</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Badge variant="outline" className="text-sm">Total rebanho: {(balanco.rebanho.total / 1000).toFixed(1)} tCO₂eq</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Combustíveis */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">⛽ Combustíveis</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Combustível</TableHead>
                    <TableHead className="text-right">Consumo (litros)</TableHead>
                    <TableHead className="text-right">Fator (kgCO₂eq/L)</TableHead>
                    <TableHead className="text-right">Emissão (tCO₂eq)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Diesel</TableCell>
                    <TableCell className="text-right font-mono">{balanco.combustivel.dieselLitros.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{FATORES.diesel}</TableCell>
                    <TableCell className="text-right font-mono">{(balanco.combustivel.totalDiesel / 1000).toFixed(1)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Gasolina</TableCell>
                    <TableCell className="text-right font-mono">{balanco.combustivel.gasolinaLitros.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{FATORES.gasolina}</TableCell>
                    <TableCell className="text-right font-mono">{(balanco.combustivel.totalGasolina / 1000).toFixed(1)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Etanol</TableCell>
                    <TableCell className="text-right font-mono">{balanco.combustivel.etanolLitros.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{FATORES.etanol}</TableCell>
                    <TableCell className="text-right font-mono">{(balanco.combustivel.totalEtanol / 1000).toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="flex justify-end mt-3">
                <Badge variant="outline" className="text-sm">Total combustíveis: {(balanco.combustivel.total / 1000).toFixed(1)} tCO₂eq</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Energia */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">⚡ Energia Elétrica</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Consumo</p>
                  <p className="text-xl font-bold text-foreground">{balanco.energia.kwh.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground">kWh</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Fator</p>
                  <p className="text-xl font-bold text-foreground">{FATORES.energia_eletrica}</p>
                  <p className="text-xs text-muted-foreground">kgCO₂eq/kWh</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Emissão</p>
                  <p className="text-xl font-bold text-foreground">{(balanco.energia.total / 1000).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">tCO₂eq</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fertilizantes */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">🧪 Fertilizantes e Corretivos</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead className="text-right">Quantidade (kg)</TableHead>
                    <TableHead className="text-right">Fator (kgCO₂eq/kg)</TableHead>
                    <TableHead className="text-right">Emissão (tCO₂eq)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Calcário</TableCell>
                    <TableCell className="text-right font-mono">{balanco.fertilizante.calcarioKg.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{FATORES.calcario}</TableCell>
                    <TableCell className="text-right font-mono">{(balanco.fertilizante.totalCalcario / 1000).toFixed(1)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Ureia</TableCell>
                    <TableCell className="text-right font-mono">{balanco.fertilizante.ureiaKg.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{FATORES.ureia}</TableCell>
                    <TableCell className="text-right font-mono">{(balanco.fertilizante.totalUreia / 1000).toFixed(1)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Outros nitrogenados</TableCell>
                    <TableCell className="text-right font-mono">{balanco.fertilizante.outrosNKg.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">0,73</TableCell>
                    <TableCell className="text-right font-mono">{(balanco.fertilizante.totalOutros / 1000).toFixed(1)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="flex justify-end mt-3">
                <Badge variant="outline" className="text-sm">Total fertilizantes: {(balanco.fertilizante.total / 1000).toFixed(1)} tCO₂eq</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ ABA 3 — SEQUESTRO ══════════ */}
        <TabsContent value="sequestro" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">🌿 Pastagens</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-muted-foreground">Bem manejada</p>
                  <p className="text-xl font-bold text-foreground">{balanco.pastagem.areaBemManejada.toFixed(0)} ha</p>
                  <p className="text-xs text-muted-foreground">× {FATORES.sequestro_pastagem} tCO₂eq/ha/ano</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Degradada (fator 0)</p>
                  <p className="text-xl font-bold text-foreground">{balanco.pastagem.areaDegradada.toFixed(0)} ha</p>
                  <p className="text-xs text-muted-foreground">Sem sequestro</p>
                </div>
                <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-muted-foreground">Sequestro pastagens</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{balanco.pastagem.total.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">tCO₂eq/ano</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">🌳 Reserva Legal e Mata Nativa</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-muted-foreground">Área de RL/mata</p>
                  <p className="text-xl font-bold text-foreground">{balanco.mata.areaHa} ha</p>
                  <p className="text-xs text-muted-foreground">{"Dados de Propriedades > Ambiental"}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Fator de sequestro</p>
                  <p className="text-xl font-bold text-foreground">{FATORES.sequestro_mata}</p>
                  <p className="text-xs text-muted-foreground">tCO₂eq/ha/ano</p>
                </div>
                <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-muted-foreground">Sequestro mata</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{balanco.mata.total.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">tCO₂eq/ano</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">🌲 Reflorestamento / Silvicultura</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Área</p>
                  <p className="text-xl font-bold text-foreground">{balanco.reflorestamento.areaHa} ha</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Espécie</p>
                  <p className="text-xl font-bold text-foreground">{balanco.reflorestamento.especie}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground">Idade média</p>
                  <p className="text-xl font-bold text-foreground">{balanco.reflorestamento.idadeMedia} anos</p>
                </div>
                <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs text-muted-foreground">Sequestro</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{balanco.reflorestamento.total.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">tCO₂eq/ano</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="border-emerald-300 dark:border-emerald-700">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Total de Sequestro de Carbono</p>
              <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{balanco.sequestroTotal.toFixed(1)} tCO₂eq/ano</p>
              <p className="text-xs text-muted-foreground mt-2">
                Pastagens ({balanco.pastagem.total.toFixed(1)}) + Mata ({balanco.mata.total.toFixed(1)}) + Reflorestamento ({balanco.reflorestamento.total.toFixed(1)})
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ ABA 4 — HISTÓRICO ══════════ */}
        <TabsContent value="historico" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Evolução do Balanço de Carbono</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="ano" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `${v} tCO₂eq`} />
                  <Legend />
                  <Line type="monotone" dataKey="balanco" name="Balanço líquido (tCO₂eq)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 5 }} />
                  <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" label="Neutro" />
                  <ReferenceLine y={-100} stroke="#22c55e" strokeDasharray="5 5" label={`Meta: ${mockMeta.metaKgArroba} kgCO₂eq/@`} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Meta de Carbono</CardTitle>
                <Badge variant="outline">Meta: {mockMeta.metaKgArroba} kgCO₂eq/@ até {mockMeta.anoMeta}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Atual: {balanco.emissaoPorArroba} kgCO₂eq/@</span>
                <Progress value={Math.max(0, 100 - ((balanco.emissaoPorArroba - mockMeta.metaKgArroba) / balanco.emissaoPorArroba) * 100)} className="h-3 flex-1" />
                <span className="text-sm font-medium text-foreground whitespace-nowrap">Meta: {mockMeta.metaKgArroba}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Tabela Histórica</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-right">Emissões (tCO₂eq)</TableHead>
                    <TableHead className="text-right">Sequestro (tCO₂eq)</TableHead>
                    <TableHead className="text-right">Balanço (tCO₂eq)</TableHead>
                    <TableHead className="text-right">kgCO₂eq/@</TableHead>
                    <TableHead className="text-right">Arrobas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((h) => (
                    <TableRow key={h.ano}>
                      <TableCell className="font-medium">{h.ano}</TableCell>
                      <TableCell className="text-right font-mono text-red-600 dark:text-red-400">{h.emissoesBrutas.toFixed(1)}</TableCell>
                      <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">{h.sequestroTotal.toFixed(1)}</TableCell>
                      <TableCell className={`text-right font-mono font-bold ${h.balancoLiquido < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {h.balancoLiquido > 0 ? "+" : ""}{h.balancoLiquido.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono">{h.emissaoPorArroba}</TableCell>
                      <TableCell className="text-right font-mono">{h.arrobasProduzidas}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ ABA 5 — RELATÓRIO & CERTIFICAÇÃO ══════════ */}
        <TabsContent value="relatorio" className="space-y-6 mt-4">
          {/* Report generation */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">📄 Relatório de Pegada de Carbono</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gerar documento PDF completo com inventário de emissões, sequestro, balanço líquido e indicadores de eficiência.
                Metodologia: GHG Protocol Agro + IPCC.
              </p>
              <div className="p-3 rounded-lg border bg-muted/30 text-xs text-muted-foreground space-y-1">
                <p>O relatório incluirá:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Dados da fazenda (NIRF, área, rebanho)</li>
                  <li>Metodologia utilizada</li>
                  <li>Inventário de emissões detalhado por fonte</li>
                  <li>Inventário de sequestro por área</li>
                  <li>Balanço líquido e indicadores de eficiência</li>
                  <li>Gráficos incluídos</li>
                  <li>Rodapé: dados sujeitos a verificação por auditoria independente</li>
                </ul>
              </div>
              <Button className="gap-1" onClick={() => toast({ title: "Gerando Relatório de Pegada de Carbono...", description: "O PDF será gerado em instantes." })}>
                <Download className="h-4 w-4" /> Gerar Relatório PDF
              </Button>
            </CardContent>
          </Card>

          {/* Carbon credits calculator */}
          <Card className={isLowCarbon ? "border-emerald-300 dark:border-emerald-700" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                💰 Calculadora de Créditos de Carbono
                <Badge variant="outline" className="text-xs">Educativo</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLowCarbon ? (
                <>
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <p className="text-sm text-foreground font-medium">
                      ✅ Sua fazenda sequestrou <span className="font-bold text-emerald-600 dark:text-emerald-400">{creditosPotenciais.toFixed(1)} tCO₂eq</span> a mais do que emitiu
                    </p>
                    <p className="text-sm text-foreground">
                      Isso equivale a aproximadamente <span className="font-bold">{Math.floor(creditosPotenciais)} créditos de carbono</span> (1 crédito = 1 tCO₂eq)
                    </p>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Valor estimado no mercado voluntário:</p>
                      <div className="flex items-center gap-4">
                        <div>
                          <Label className="text-xs">Mínimo (R$/crédito)</Label>
                          <Input type="number" value={creditoMin} onChange={(e) => setCreditoMin(Number(e.target.value))} className="w-24 h-8 text-sm" />
                        </div>
                        <div>
                          <Label className="text-xs">Máximo (R$/crédito)</Label>
                          <Input type="number" value={creditoMax} onChange={(e) => setCreditoMax(Number(e.target.value))} className="w-24 h-8 text-sm" />
                        </div>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        R$ {(creditosPotenciais * creditoMin).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} a R$ {(creditosPotenciais * creditoMax).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-xs text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                    <p>Para monetizar créditos de carbono é necessário verificação por auditoria independente credenciada (Verra, Gold Standard ou equivalente). Valores estimados para fins de planejamento.</p>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-lg bg-muted/30 border text-center">
                  <p className="text-sm text-muted-foreground">
                    Sua fazenda emite mais do que sequestra. Para gerar créditos de carbono, o balanço líquido precisa ser negativo.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Dicas: recuperar pastagens degradadas, ampliar áreas de reflorestamento e melhorar eficiência do rebanho.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certification programs */}
          <h3 className="text-base font-semibold text-foreground">🏅 Programas de Certificação</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {PROGRAMAS_CERTIFICACAO.map((prog) => (
              <Card key={prog.nome}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {prog.nome}
                    <Badge variant="outline" className="text-xs">{prog.orgao}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{prog.descricao}</p>
                  <Separator />
                  <p className="text-xs"><span className="font-medium text-foreground">Como aderir:</span> {prog.como}</p>
                  <a href={prog.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Acessar site oficial
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
