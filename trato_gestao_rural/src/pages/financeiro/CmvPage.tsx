import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3, PieChart as PieIcon, Beef, Milk, Wheat, Settings2,
  ChevronDown, Download, TrendingUp, TrendingDown, Target, DollarSign, FileText
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import {
  defaultRateio, RateioConfig,
  getMockConsolidado, getMockCorte, getMockLeite, getMockAgricultura,
  getComposicaoCmv, getWaterfallData, getEvolucaoMensalCorte, getEvolucaoMensalLeite
} from "@/data/cmv-mock";
import { useProfile } from "@/contexts/ProfileContext";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

// ── Consolidada ──
function AbaConsolidada() {
  const [rateio, setRateio] = useState<RateioConfig>(defaultRateio);
  const [rateioOpen, setRateioOpen] = useState(false);
  const [periodo, setPeriodo] = useState("ano");
  const consolidado = getMockConsolidado();
  const composicao = getComposicaoCmv();
  const waterfall = getWaterfallData();

  const updateRateio = (cat: keyof RateioConfig, key: keyof RateioConfig["maoDeObra"], val: number) => {
    setRateio(prev => ({ ...prev, [cat]: { ...prev[cat], [key]: val } }));
  };

  return (
    <div className="space-y-6">
      {/* Rateio */}
      <Collapsible open={rateioOpen} onOpenChange={setRateioOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Configuração de Rateio de Custos Indiretos</CardTitle>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${rateioOpen ? "rotate-180" : ""}`} />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {(["maoDeObra", "energia", "manutencao", "administrativo"] as const).map(cat => {
                const labels: Record<string, string> = { maoDeObra: "Mão de obra geral", energia: "Energia elétrica geral", manutencao: "Manutenção de infraestrutura", administrativo: "Despesas administrativas" };
                return (
                  <div key={cat} className="space-y-2">
                    <Label className="text-sm font-medium">{labels[cat]}</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["corte", "leiteiro", "agricultura"] as const).map(k => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground capitalize w-20">{k === "corte" ? "Pec. Corte" : k === "leiteiro" ? "Pec. Leiteira" : "Agricultura"}</span>
                          <Input type="number" className="h-8 w-20" value={rateio[cat][k]} onChange={e => updateRateio(cat, k, +e.target.value)} />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <Button size="sm" className="mt-2">Salvar configuração de rateio</Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Período */}
      <div className="flex items-center gap-3">
        <Label>Período:</Label>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Mês</SelectItem>
            <SelectItem value="trimestre">Trimestre</SelectItem>
            <SelectItem value="semestre">Semestre</SelectItem>
            <SelectItem value="ano">Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela consolidada */}
      <Card>
        <CardHeader><CardTitle className="text-base">Resultado Consolidado por Atividade</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Atividade</TableHead>
                <TableHead className="text-right">Receita Bruta</TableHead>
                <TableHead className="text-right">CMV Direto</TableHead>
                <TableHead className="text-right">CMV Indireto</TableHead>
                <TableHead className="text-right">CMV Total</TableHead>
                <TableHead className="text-right">Lucro Bruto</TableHead>
                <TableHead className="text-right">Margem Bruta</TableHead>
                <TableHead className="text-right">Desp. Operac.</TableHead>
                <TableHead className="text-right">Lucro Líq.</TableHead>
                <TableHead className="text-right">Margem Líq.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consolidado.map(l => (
                <TableRow key={l.atividade} className={l.atividade === "TOTAL" ? "font-bold bg-muted/50" : ""}>
                  <TableCell>{l.atividade}</TableCell>
                  <TableCell className="text-right">{fmt(l.receitaBruta)}</TableCell>
                  <TableCell className="text-right text-destructive">{fmt(l.cmvDireto)}</TableCell>
                  <TableCell className="text-right text-destructive">{fmt(l.cmvIndireto)}</TableCell>
                  <TableCell className="text-right text-destructive">{fmt(l.cmvTotal)}</TableCell>
                  <TableCell className="text-right text-primary">{fmt(l.lucroBruto)}</TableCell>
                  <TableCell className="text-right">{fmtPct(l.margemBruta)}</TableCell>
                  <TableCell className="text-right text-destructive">{fmt(l.despesasOp)}</TableCell>
                  <TableCell className={`text-right ${l.lucroLiquido >= 0 ? "text-primary" : "text-destructive"}`}>{fmt(l.lucroLiquido)}</TableCell>
                  <TableCell className="text-right">{fmtPct(l.margemLiquida)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Waterfall */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Waterfall — DRE Consolidada</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={waterfall}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(Math.abs(v))} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {waterfall.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pizza */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieIcon className="h-4 w-4" />Composição do CMV Total</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={composicao} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {composicao.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Exportar relatório de CMV</Button>
      </div>
    </div>
  );
}

// ── Helper: Custo detail card ──
function CustoCard({ titulo, itens, unidade, totalLabel }: { titulo: string; itens: { label: string; valor: number }[]; unidade?: string; totalLabel?: string }) {
  const total = itens.reduce((s, i) => s + i.valor, 0);
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm">{titulo}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {itens.map(it => (
          <div key={it.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{it.label}</span>
            <span>{fmt(it.valor)}</span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between font-semibold text-sm">
          <span>{totalLabel || "Subtotal"}</span>
          <span>{fmt(total)}</span>
        </div>
        {unidade && (
          <div className="text-xs text-muted-foreground text-right">Custo por {unidade}</div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Pecuária de Corte ──
function AbaCorte() {
  const d = getMockCorte();
  const evolucao = getEvolucaoMensalCorte();
  const cmvDireto = d.custoAquisicao + d.custoAlimentacao + d.custoSanidade + d.custoPastagem + d.custoMaoObra + d.custoMaquinas;
  const cmvTotal = cmvDireto + d.cmvIndireto;
  const cmvPorArroba = cmvTotal / d.arrobasTotais;
  const cmvPorCab = cmvTotal / d.animaisVendidos;
  const lucroBruto = d.receitaTotal - cmvTotal;
  const margemBruta = (lucroBruto / d.receitaTotal) * 100;
  const pontoEquilibrio = cmvTotal / d.arrobasTotais;
  const benchmarkBR = 195;

  return (
    <div className="space-y-6">
      {/* Receita */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Receita — Vendas de Bovinos de Corte</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-muted-foreground">Animais vendidos</p><p className="text-xl font-bold">{d.animaisVendidos}</p></div>
            <div><p className="text-xs text-muted-foreground">Arrobas totais</p><p className="text-xl font-bold">{fmtN(d.arrobasTotais)}</p></div>
            <div><p className="text-xs text-muted-foreground">Receita total</p><p className="text-xl font-bold text-primary">{fmt(d.receitaTotal)}</p></div>
            <div><p className="text-xs text-muted-foreground">Preço médio / @</p><p className="text-xl font-bold">{fmt(d.precoMedioArroba)}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Custos diretos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CustoCard titulo="B1 — Aquisição / Formação" itens={[{ label: "Custo de aquisição / formação", valor: d.custoAquisicao }]} unidade={`@ = ${fmt(d.custoAquisicao / d.arrobasTotais)}`} />
        <CustoCard titulo="B2 — Alimentação" itens={[
          { label: "Ração / concentrado", valor: 112_000 },
          { label: "Sal mineral", valor: 48_000 },
          { label: "Silagem / feno", valor: 56_000 },
          { label: "Suplementos", valor: 32_000 },
        ]} unidade={`@ = ${fmt(d.custoAlimentacao / d.arrobasTotais)}`} />
        <CustoCard titulo="B3 — Sanidade" itens={[
          { label: "Vacinas", valor: 18_000 },
          { label: "Vermífugos", valor: 12_000 },
          { label: "Antibióticos e outros", valor: 12_000 },
        ]} unidade={`@ = ${fmt(d.custoSanidade / d.arrobasTotais)}`} />
        <CustoCard titulo="B4 — Pastagem" itens={[
          { label: "Formação (amortizada)", valor: 68_000 },
          { label: "Manutenção", valor: 60_000 },
        ]} unidade={`@ = ${fmt(d.custoPastagem / d.arrobasTotais)}`} />
        <CustoCard titulo="B5 — Mão de Obra Direta" itens={[
          { label: "Salários + encargos", valor: d.custoMaoObra },
        ]} unidade={`@ = ${fmt(d.custoMaoObra / d.arrobasTotais)}`} />
        <CustoCard titulo="B6 — Máquinas e Combustível" itens={[
          { label: "Custo de máquinas", valor: d.custoMaquinas },
        ]} unidade={`@ = ${fmt(d.custoMaquinas / d.arrobasTotais)}`} />
      </div>

      {/* Resumo */}
      <Card className="border-primary/30">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Resumo — Pecuária de Corte</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">CMV Total / @</p>
              <p className="text-3xl font-bold text-destructive">{fmt(cmvPorArroba)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">CMV Total / Cabeça</p>
              <p className="text-2xl font-bold">{fmt(cmvPorCab)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Lucro Bruto</p>
              <p className="text-2xl font-bold text-primary">{fmt(lucroBruto)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Margem Bruta</p>
              <p className="text-2xl font-bold">{fmtPct(margemBruta)}</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Ponto de Equilíbrio</p>
              <p className="text-sm text-muted-foreground">Preço mínimo da @ para cobrir o CMV: <span className="font-bold text-foreground">{fmt(pontoEquilibrio)}</span></p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Benchmark</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Média CO (Brasil)</span><span>{fmt(benchmarkBR)}/@</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sua fazenda</span><span className="font-bold">{fmt(cmvPorArroba)}/@</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diferença</span>
                  <span className={cmvPorArroba < benchmarkBR ? "text-primary font-bold" : "text-destructive font-bold"}>
                    {cmvPorArroba < benchmarkBR ? <TrendingDown className="inline h-3 w-3 mr-1" /> : <TrendingUp className="inline h-3 w-3 mr-1" />}
                    {fmt(Math.abs(cmvPorArroba - benchmarkBR))}/@
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolução mensal */}
      <Card>
        <CardHeader><CardTitle className="text-base">Evolução Mensal — CMV/@ vs Preço Recebido/@</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="cmvArroba" stroke="hsl(0, 72%, 50%)" name="CMV / @" strokeWidth={2} />
              <Line type="monotone" dataKey="precoArroba" stroke="hsl(149, 62%, 26%)" name="Preço / @" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-2"><FileText className="h-4 w-4" />Exportar PDF</Button>
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Exportar Excel</Button>
      </div>
    </div>
  );
}

// ── Pecuária Leiteira ──
function AbaLeite() {
  const d = getMockLeite();
  const evolucao = getEvolucaoMensalLeite();
  const cmvDireto = d.custoAlimentacao + d.custoSanidade + d.custoMaoObra + d.custoEnergia + d.custoDepreciacao + d.custoInseminacao;
  const cmvTotal = cmvDireto + d.cmvIndireto;
  const cmvPorLitro = cmvTotal / d.litrosProduzidos;
  const lucroBruto = d.receitaTotal - cmvTotal;
  const margemBruta = (lucroBruto / d.receitaTotal) * 100;
  const perdaDescarte = d.litrosDescartados * d.precoMedioLitro;
  const pontoEquilibrio = cmvTotal / d.litrosVendidos;
  const benchmarkBR = 1.35;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Receita — Venda de Leite</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div><p className="text-xs text-muted-foreground">Litros produzidos</p><p className="text-xl font-bold">{d.litrosProduzidos.toLocaleString("pt-BR")}</p></div>
            <div><p className="text-xs text-muted-foreground">Litros vendidos</p><p className="text-xl font-bold">{d.litrosVendidos.toLocaleString("pt-BR")}</p></div>
            <div><p className="text-xs text-muted-foreground">Descartados</p><p className="text-xl font-bold text-destructive">{d.litrosDescartados.toLocaleString("pt-BR")}</p></div>
            <div><p className="text-xs text-muted-foreground">Receita total</p><p className="text-xl font-bold text-primary">{fmt(d.receitaTotal)}</p></div>
            <div><p className="text-xs text-muted-foreground">Preço médio / litro</p><p className="text-xl font-bold">{fmt(d.precoMedioLitro)}</p></div>
          </div>
          <p className="text-xs text-destructive mt-2">Perda por descarte (carência/mastite): {fmt(perdaDescarte)}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CustoCard titulo="B1 — Alimentação (Lactação)" itens={[
          { label: "Ração / concentrado", valor: 118_000 },
          { label: "Volumoso (silagem)", valor: 72_000 },
          { label: "Sal e suplementos", valor: 45_000 },
        ]} unidade={`litro = ${fmt(d.custoAlimentacao / d.litrosProduzidos)}`} />
        <CustoCard titulo="B2 — Sanidade" itens={[
          { label: "Vacinas e medicamentos", valor: 22_000 },
          { label: "Tratamento mastite", valor: 16_000 },
        ]} unidade={`litro = ${fmt(d.custoSanidade / d.litrosProduzidos)}`} />
        <CustoCard titulo="B3 — Mão de Obra (Ordenha)" itens={[
          { label: "Ordenhadores", valor: d.custoMaoObra },
        ]} unidade={`litro = ${fmt(d.custoMaoObra / d.litrosProduzidos)}`} />
        <CustoCard titulo="B4 — Energia Elétrica" itens={[
          { label: "Resfriador + ordenha", valor: d.custoEnergia },
        ]} unidade={`litro = ${fmt(d.custoEnergia / d.litrosProduzidos)}`} />
        <CustoCard titulo="B5 — Depreciação Equipamento" itens={[
          { label: "Equip. ordenha (mensal)", valor: d.custoDepreciacao },
        ]} unidade={`litro = ${fmt(d.custoDepreciacao / d.litrosProduzidos)}`} />
        <CustoCard titulo="B6 — Inseminação e Reprodução" itens={[
          { label: "Sêmen + protocolos + vet", valor: d.custoInseminacao },
        ]} unidade={`litro = ${fmt(d.custoInseminacao / d.litrosProduzidos)}`} />
      </div>

      <Card className="border-primary/30">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Resumo — Pecuária Leiteira</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">CMV Total / litro</p>
              <p className="text-3xl font-bold text-destructive">{fmt(cmvPorLitro)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Lucro Bruto</p>
              <p className="text-2xl font-bold text-primary">{fmt(lucroBruto)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Margem Bruta</p>
              <p className="text-2xl font-bold">{fmtPct(margemBruta)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Ponto Equilíbrio</p>
              <p className="text-2xl font-bold">{fmt(pontoEquilibrio)}/L</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Benchmark</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Média Brasil</span><span>{fmt(benchmarkBR)}/L</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sua fazenda</span><span className="font-bold">{fmt(cmvPorLitro)}/L</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diferença</span>
                  <span className={cmvPorLitro < benchmarkBR ? "text-primary font-bold" : "text-destructive font-bold"}>
                    {fmt(Math.abs(cmvPorLitro - benchmarkBR))}/L {cmvPorLitro < benchmarkBR ? "abaixo" : "acima"}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Impacto do Descarte</p>
              <p className="text-sm text-muted-foreground">Litros descartados: {d.litrosDescartados.toLocaleString("pt-BR")} ({fmtPct((d.litrosDescartados / d.litrosProduzidos) * 100)})</p>
              <p className="text-sm text-destructive font-medium">Perda financeira: {fmt(perdaDescarte)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Evolução Mensal — CMV/litro vs Preço Recebido/litro</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="cmvLitro" stroke="hsl(0, 72%, 50%)" name="CMV / litro" strokeWidth={2} />
              <Line type="monotone" dataKey="precoLitro" stroke="hsl(149, 62%, 26%)" name="Preço / litro" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-2"><FileText className="h-4 w-4" />Exportar PDF</Button>
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Exportar Excel</Button>
      </div>
    </div>
  );
}

// ── Agricultura ──
function AbaAgricultura() {
  const d = getMockAgricultura();
  const cmvDireto = d.custoInsumos + d.custoMecanizacao + d.custoMaoObra + d.custoArrendamento + d.custoTransporteSecagem;
  const cmvTotal = cmvDireto + d.cmvIndireto;
  const cmvPorSaca = cmvTotal / d.producaoSacas;
  const cmvPorHa = cmvTotal / d.areaHa;
  const lucroBruto = d.receitaTotal - cmvTotal;
  const margemBruta = (lucroBruto / d.receitaTotal) * 100;
  const pontoEquilibrioPre = cmvTotal / d.producaoSacas;
  const pontoEquilibrioSc = cmvTotal / d.precoMedioSaca;
  const benchmarkBR = 58;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <Label className="text-xs text-muted-foreground">Cultura</Label>
          <Badge variant="outline" className="ml-2">{d.cultura}</Badge>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Safra</Label>
          <Badge variant="outline" className="ml-2">{d.safra}</Badge>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Área</Label>
          <Badge variant="outline" className="ml-2">{d.areaHa} ha</Badge>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Receita — {d.cultura}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-muted-foreground">Produção total</p><p className="text-xl font-bold">{d.producaoSacas.toLocaleString("pt-BR")} sc</p></div>
            <div><p className="text-xs text-muted-foreground">Vendidas</p><p className="text-xl font-bold">{d.vendidaSacas.toLocaleString("pt-BR")} sc</p></div>
            <div><p className="text-xs text-muted-foreground">Receita total</p><p className="text-xl font-bold text-primary">{fmt(d.receitaTotal)}</p></div>
            <div><p className="text-xs text-muted-foreground">Preço médio / sc</p><p className="text-xl font-bold">{fmt(d.precoMedioSaca)}</p></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Produtividade: {fmtN(d.producaoSacas / d.areaHa)} sc/ha</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CustoCard titulo="B1 — Insumos" itens={[
          { label: "Sementes", valor: 38_000 },
          { label: "Fertilizantes base (NPK)", valor: 48_000 },
          { label: "Fertilizantes cobertura", valor: 28_000 },
          { label: "Defensivos", valor: 36_000 },
          { label: "Calcário e gesso", valor: 18_000 },
        ]} unidade={`sc = ${fmt(d.custoInsumos / d.producaoSacas)}`} />
        <CustoCard titulo="B2 — Mecanização" itens={[
          { label: "Preparo + plantio + colheita", valor: d.custoMecanizacao },
        ]} unidade={`sc = ${fmt(d.custoMecanizacao / d.producaoSacas)}`} />
        <CustoCard titulo="B3 — Mão de Obra" itens={[
          { label: "Tratoristas e aplicadores", valor: d.custoMaoObra },
        ]} unidade={`sc = ${fmt(d.custoMaoObra / d.producaoSacas)}`} />
        <CustoCard titulo="B4 — Arrendamento" itens={[
          { label: "Valor proporcional", valor: d.custoArrendamento },
        ]} unidade={`ha = ${fmt(d.custoArrendamento / d.areaHa)}`} />
        <CustoCard titulo="B5 — Transporte e Secagem" itens={[
          { label: "Frete + secagem", valor: d.custoTransporteSecagem },
        ]} unidade={`sc = ${fmt(d.custoTransporteSecagem / d.producaoSacas)}`} />
      </div>

      <Card className="border-primary/30">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Resumo — Agricultura ({d.cultura})</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">CMV Total / saca</p>
              <p className="text-3xl font-bold text-destructive">{fmt(cmvPorSaca)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">CMV Total / ha</p>
              <p className="text-2xl font-bold">{fmt(cmvPorHa)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Lucro Bruto</p>
              <p className="text-2xl font-bold text-primary">{fmt(lucroBruto)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Margem Bruta</p>
              <p className="text-2xl font-bold">{fmtPct(margemBruta)}</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Ponto de Equilíbrio</p>
              <p className="text-sm text-muted-foreground">Preço mín. / saca: <span className="font-bold text-foreground">{fmt(pontoEquilibrioPre)}</span></p>
              <p className="text-sm text-muted-foreground">Produtividade mín.: <span className="font-bold text-foreground">{fmtN(pontoEquilibrioSc / d.areaHa)} sc/ha</span></p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Benchmark (CONAB)</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Média Brasil ({d.cultura})</span><span>{fmt(benchmarkBR)}/sc</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sua fazenda</span><span className="font-bold">{fmt(cmvPorSaca)}/sc</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diferença</span>
                  <span className={cmvPorSaca < benchmarkBR ? "text-primary font-bold" : "text-destructive font-bold"}>
                    {fmt(Math.abs(cmvPorSaca - benchmarkBR))}/sc {cmvPorSaca < benchmarkBR ? "abaixo" : "acima"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" className="gap-2"><FileText className="h-4 w-4" />Exportar PDF</Button>
        <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />Exportar Excel</Button>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function CmvPage() {
  const { isEmpresarial } = useProfile();

  if (!isEmpresarial) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>O módulo CMV está disponível apenas no perfil Empresarial.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CMV — Custo da Mercadoria Vendida</h1>
        <p className="text-muted-foreground">Análise detalhada de custos por atividade produtiva — GHG Protocol Agro</p>
      </div>

      <Tabs defaultValue="consolidada" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="consolidada" className="gap-1.5"><BarChart3 className="h-4 w-4" />Consolidada</TabsTrigger>
          <TabsTrigger value="corte" className="gap-1.5"><Beef className="h-4 w-4" />Pec. Corte</TabsTrigger>
          <TabsTrigger value="leite" className="gap-1.5"><Milk className="h-4 w-4" />Pec. Leiteira</TabsTrigger>
          <TabsTrigger value="agricultura" className="gap-1.5"><Wheat className="h-4 w-4" />Agricultura</TabsTrigger>
        </TabsList>
        <TabsContent value="consolidada"><AbaConsolidada /></TabsContent>
        <TabsContent value="corte"><AbaCorte /></TabsContent>
        <TabsContent value="leite"><AbaLeite /></TabsContent>
        <TabsContent value="agricultura"><AbaAgricultura /></TabsContent>
      </Tabs>
    </div>
  );
}
