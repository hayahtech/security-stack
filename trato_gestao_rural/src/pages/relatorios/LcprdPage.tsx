import { useState, useMemo } from "react";
import {
  ArrowLeft, Settings2, FileDown, FileSpreadsheet, Printer,
  BookOpen, TrendingUp, TrendingDown, DollarSign, ExternalLink,
  ChevronDown, ChevronUp, Calculator, FileText, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  defaultConfig, LcprdConfig, mockRevenues, mockExpenses, mockAssets,
  revenueCategories, deductibleExpenseCategories, nonDeductibleCategories,
  activityLabels, taxRegimeLabels, assetTypeLabels, defaultDepreciationRates,
  getMonthlyData, type LcprdRevenue, type LcprdExpense, type DepreciationAsset,
} from "@/data/lcprd-mock";

/* ── Helpers ──────────────────────────────── */
const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const SEFAZ_URL = "https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx";

function handleExport(type: string) {
  toast.info(`Exportação ${type} do LCPRD será implementada com backend`);
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════ */
export default function LcprdPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<LcprdConfig>({ ...defaultConfig });
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [configOpen, setConfigOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<LcprdConfig>({ ...defaultConfig });

  const year = config.exerciseYear;

  // Filter data
  const revenues = useMemo(() => {
    let data = mockRevenues.filter(r => r.date.startsWith(String(year)));
    if (filterMonth !== "all") data = data.filter(r => r.date.substring(5, 7) === filterMonth);
    return data;
  }, [year, filterMonth]);

  const expenses = useMemo(() => {
    let data = mockExpenses.filter(e => e.date.startsWith(String(year)));
    if (filterMonth !== "all") data = data.filter(e => e.date.substring(5, 7) === filterMonth);
    return data;
  }, [year, filterMonth]);

  const deductibleExpenses = expenses.filter(e => e.deductible);
  const nonDeductibleExpenses = expenses.filter(e => !e.deductible);

  const totalRevenue = revenues.filter(r => r.rural).reduce((s, r) => s + r.amount, 0);
  const totalDeductible = deductibleExpenses.reduce((s, e) => s + e.amount, 0);
  const resultado = totalRevenue - totalDeductible;
  const presumido = totalRevenue * 0.75;
  const baseCalculo = config.taxRegime === "resultado_presumido" ? presumido : Math.max(resultado, 0);

  const monthlyData = useMemo(
    () => getMonthlyData(mockRevenues, mockExpenses, year),
    [year],
  );

  const totalDepreciationAnnual = mockAssets.reduce((s, a) => s + (a.acquisitionValue * a.depreciationRate / 100), 0);

  const saveConfig = () => {
    setConfig({ ...tempConfig });
    setConfigOpen(false);
    toast.success("Configuração do LCPRD salva");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/relatorios")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              LCPRD — Livro Caixa do Produtor Rural
            </h1>
            <p className="text-sm text-muted-foreground">
              Exercício {year} • {activityLabels[config.mainActivity]} • {taxRegimeLabels[config.taxRegime]}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setTempConfig({ ...config })}>
                <Settings2 className="h-4 w-4 mr-1" />Configurar LCPRD
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configuração do LCPRD</DialogTitle>
              </DialogHeader>
              <ConfigForm config={tempConfig} onChange={setTempConfig} />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={saveConfig}>Salvar Configuração</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Ano de Exercício</Label>
              <Select value={String(year)} onValueChange={v => setConfig(c => ({ ...c, exerciseYear: Number(v) }))}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mês</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ano Completo</SelectItem>
                  {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m, i) => (
                    <SelectItem key={m} value={m}>{["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][i]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Receita Bruta" value={totalRevenue} icon={<TrendingUp className="h-5 w-5" />} color="text-emerald-600 dark:text-emerald-400" />
        <SummaryCard title="Despesas Dedutíveis" value={totalDeductible} icon={<TrendingDown className="h-5 w-5" />} color="text-red-600 dark:text-red-400" />
        <SummaryCard
          title="Resultado da Atividade Rural"
          value={resultado}
          icon={<DollarSign className="h-5 w-5" />}
          color={resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
          subtitle={resultado < 0 ? "Prejuízo a compensar" : undefined}
        />
        {config.taxRegime === "resultado_presumido" && (
          <SummaryCard title="Resultado Presumido (75%)" value={presumido} icon={<Calculator className="h-5 w-5" />} color="text-amber-600 dark:text-amber-400" />
        )}
        <SummaryCard title="Base de Cálculo IR" value={baseCalculo} icon={<FileText className="h-5 w-5" />} color="text-primary" />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Receitas vs Despesas — Mensal ({year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="receita" name="Receitas" fill="hsl(142, 60%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" name="Despesas" fill="hsl(0, 60%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="receitas">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="depreciacao">Depreciação</TabsTrigger>
          <TabsTrigger value="demonstrativo">Demonstrativo Anual</TabsTrigger>
          <TabsTrigger value="exportacao">Exportação</TabsTrigger>
        </TabsList>

        {/* ── RECEITAS ────────────────────────── */}
        <TabsContent value="receitas" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Receitas da Atividade Rural</h3>
            <Button variant="outline" size="sm" onClick={() => toast.info("Classificação de transações será implementada com backend")}>
              Classificar Transações
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>NF-e</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenues.filter(r => r.rural).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm whitespace-nowrap">{fmtDate(r.date)}</TableCell>
                      <TableCell className="font-medium text-sm">{r.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.origin}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{r.category}</Badge></TableCell>
                      <TableCell>
                        {r.nfeKey ? (
                          <a href={SEFAZ_URL} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 font-mono">
                            {r.nfeKey.substring(0, 10)}…
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">{fmt(r.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {revenues.filter(r => r.rural).length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma receita no período</TableCell></TableRow>
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="font-semibold">Total Receitas</TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalRevenue)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
          <div className="text-xs text-muted-foreground">
            Categorias aceitas: {revenueCategories.join(" • ")}
          </div>
        </TabsContent>

        {/* ── DESPESAS ────────────────────────── */}
        <TabsContent value="despesas" className="mt-4 space-y-4">
          <h3 className="font-semibold text-foreground">Despesas Dedutíveis</h3>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>NF-e</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductibleExpenses.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm whitespace-nowrap">{fmtDate(e.date)}</TableCell>
                      <TableCell className="font-medium text-sm">{e.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.supplier}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{e.category}</Badge></TableCell>
                      <TableCell>
                        {e.nfeKey ? (
                          <a href={SEFAZ_URL} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 font-mono">
                            {e.nfeKey.substring(0, 10)}…
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600 dark:text-red-400">{fmt(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="font-semibold">Total Despesas Dedutíveis</TableCell>
                    <TableCell className="text-right font-mono font-bold text-red-600 dark:text-red-400">{fmt(totalDeductible)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Non-deductible */}
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                Despesas NÃO Dedutíveis (informativo)
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Card className="border-dashed">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nonDeductibleExpenses.map(e => (
                        <TableRow key={e.id} className="opacity-60">
                          <TableCell className="text-sm">{fmtDate(e.date)}</TableCell>
                          <TableCell className="text-sm">{e.description}</TableCell>
                          <TableCell className="text-sm">{e.supplier}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{e.category}</Badge></TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(e.amount)}</TableCell>
                        </TableRow>
                      ))}
                      {nonDeductibleExpenses.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Nenhuma despesa não dedutível</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground mt-2">
                Categorias não dedutíveis: {nonDeductibleCategories.join(" • ")}
              </p>
            </CollapsibleContent>
          </Collapsible>

          <div className="text-xs text-muted-foreground">
            Categorias dedutíveis: {deductibleExpenseCategories.join(" • ")}
          </div>
        </TabsContent>

        {/* ── DEPRECIAÇÃO ─────────────────────── */}
        <TabsContent value="depreciacao" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Depreciação de Bens do Ativo Rural</h3>
            <Badge variant="secondary">Quota Anual Total: {fmt(totalDepreciationAnnual)}</Badge>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bem</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor Original</TableHead>
                    <TableHead className="text-right">Vida Útil</TableHead>
                    <TableHead className="text-right">Taxa (%)</TableHead>
                    <TableHead className="text-right">Depr. Acumulada</TableHead>
                    <TableHead className="text-right">Valor Residual</TableHead>
                    <TableHead className="text-right">Quota Anual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAssets.map(a => {
                    const quotaAnual = a.acquisitionValue * a.depreciationRate / 100;
                    const residual = a.acquisitionValue - a.accumulatedDepreciation;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-sm">{a.name}</TableCell>
                        <TableCell className="text-sm">{assetTypeLabels[a.type]}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(a.acquisitionValue)}</TableCell>
                        <TableCell className="text-right text-sm">{a.usefulLifeYears} anos</TableCell>
                        <TableCell className="text-right text-sm">{a.depreciationRate}%</TableCell>
                        <TableCell className="text-right font-mono text-sm text-red-600 dark:text-red-400">{fmt(a.accumulatedDepreciation)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{fmt(residual)}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold">{fmt(quotaAnual)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-semibold">Totais</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(mockAssets.reduce((s, a) => s + a.acquisitionValue, 0))}</TableCell>
                    <TableCell colSpan={2} />
                    <TableCell className="text-right font-mono font-bold text-red-600 dark:text-red-400">{fmt(mockAssets.reduce((s, a) => s + a.accumulatedDepreciation, 0))}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(mockAssets.reduce((s, a) => s + (a.acquisitionValue - a.accumulatedDepreciation), 0))}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(totalDepreciationAnnual)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Taxas padrão da Receita Federal:</p>
            <p>Tratores e máquinas agrícolas: 10 anos (10% a.a.) • Veículos: 5 anos (20% a.a.) • Equipamentos: 10 anos (10% a.a.) • Benfeitorias: 25 anos (4% a.a.)</p>
          </div>
        </TabsContent>

        {/* ── DEMONSTRATIVO ANUAL ─────────────── */}
        <TabsContent value="demonstrativo" className="mt-4 space-y-4">
          <h3 className="font-semibold text-foreground">Demonstrativo Anual — LCPRD {year}</h3>

          {/* Producer header */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 text-sm space-y-1">
              <p><strong>Produtor:</strong> {config.producerName} — CPF: {config.cpf}</p>
              <p><strong>Propriedade:</strong> {config.address} — {config.municipality}/{config.state} — {config.totalArea} ha</p>
              <p><strong>IE:</strong> {config.ie} — <strong>Atividade:</strong> {activityLabels[config.mainActivity]} — <strong>Regime:</strong> {taxRegimeLabels[config.taxRegime]}</p>
            </CardContent>
          </Card>

          {/* Revenue monthly */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Receitas da Atividade Rural</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Receita Bruta</TableHead>
                    <TableHead className="text-right">Receita Financ.</TableHead>
                    <TableHead className="text-right">Total Receitas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map(m => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium text-sm">{m.month}/{year}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(m.receita)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">—</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{fmt(m.receita)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">TOTAL</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(monthlyData.reduce((s, m) => s + m.receita, 0))}</TableCell>
                    <TableCell className="text-right font-mono">—</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(monthlyData.reduce((s, m) => s + m.receita, 0))}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Expense monthly */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Despesas da Atividade Rural</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Custeio</TableHead>
                    <TableHead className="text-right">Investimento</TableHead>
                    <TableHead className="text-right">Total Despesas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.map(m => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium text-sm">{m.month}/{year}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(m.despesa)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">—</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">{fmt(m.despesa)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">TOTAL</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(monthlyData.reduce((s, m) => s + m.despesa, 0))}</TableCell>
                    <TableCell className="text-right font-mono">—</TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(monthlyData.reduce((s, m) => s + m.despesa, 0))}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Result monthly */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Resultado</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Resultado do Mês</TableHead>
                    <TableHead className="text-right">Resultado Acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyData.reduce<{ month: string; resultado: number; acumulado: number }[]>((acc, m) => {
                    const prevAcumulado = acc.length > 0 ? acc[acc.length - 1].acumulado : 0;
                    acc.push({ month: m.month, resultado: m.resultado, acumulado: prevAcumulado + m.resultado });
                    return acc;
                  }, []).map(m => (
                    <TableRow key={m.month}>
                      <TableCell className="font-medium text-sm">{m.month}/{year}</TableCell>
                      <TableCell className={`text-right font-mono text-sm ${m.resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {fmt(m.resultado)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm font-semibold ${m.acumulado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {fmt(m.acumulado)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">TOTAL DO EXERCÍCIO</TableCell>
                    <TableCell />
                    <TableCell className={`text-right font-mono font-bold text-lg ${resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {fmt(resultado)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2} className="text-sm">
                      {resultado >= 0 ? "→ Base de cálculo do IR" : "→ Prejuízo a compensar nos próximos exercícios"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">{fmt(baseCalculo)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── EXPORTAÇÃO ──────────────────────── */}
        <TabsContent value="exportacao" className="mt-4 space-y-4">
          <h3 className="font-semibold text-foreground">Exportação do LCPRD — Exercício {year}</h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => handleExport("PDF")}>
              <CardContent className="p-6 text-center space-y-3">
                <FileDown className="h-10 w-10 mx-auto text-red-500" />
                <div>
                  <p className="font-semibold">Exportar PDF — LCPRD</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Documento completo com dados do produtor, tabelas mensais de receitas e despesas, demonstrativo anual e rodapé com data de geração
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => handleExport("Excel")}>
              <CardContent className="p-6 text-center space-y-3">
                <FileSpreadsheet className="h-10 w-10 mx-auto text-emerald-500" />
                <div>
                  <p className="font-semibold">Exportar Excel — LCPRD</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Planilha com abas: Receitas | Despesas | Depreciação | Demonstrativo Anual
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => handleExport("Resumo IR")}>
              <CardContent className="p-6 text-center space-y-3">
                <Printer className="h-10 w-10 mx-auto text-primary" />
                <div>
                  <p className="font-semibold">Resumo para IR</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Resumo de 1 página com valores para a ficha "Atividade Rural" do IRPF: Receita Bruta, Despesas Dedutíveis, Resultado, Estoque de animais
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* IR Preview */}
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Preview — Resumo para Declaração de IR ({year})
              </CardTitle>
              <CardDescription>Valores a informar na ficha "Atividade Rural" da DIRPF</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs text-muted-foreground">Receita Bruta da Atividade Rural</p>
                  <p className="text-lg font-bold font-mono">{fmt(totalRevenue)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs text-muted-foreground">Despesas de Custeio e Investimentos</p>
                  <p className="text-lg font-bold font-mono">{fmt(totalDeductible + totalDepreciationAnnual)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs text-muted-foreground">Resultado da Atividade Rural</p>
                  <p className={`text-lg font-bold font-mono ${resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {fmt(resultado - totalDepreciationAnnual)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-xs text-muted-foreground">Estoque Inicial / Final de Animais</p>
                  <p className="text-sm font-mono text-muted-foreground">Informar com base no inventário do rebanho</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Summary Card ──────────────────────────── */
function SummaryCard({ title, value, icon, color, subtitle }: {
  title: string; value: number; icon: React.ReactNode; color: string; subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{title}</span>
          <span className={color}>{icon}</span>
        </div>
        <p className={`text-xl font-bold font-mono ${color}`}>{fmt(value)}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

/* ── Config Form ───────────────────────────── */
function ConfigForm({ config, onChange }: { config: LcprdConfig; onChange: (c: LcprdConfig) => void }) {
  const u = (field: keyof LcprdConfig, value: string | number) =>
    onChange({ ...config, [field]: value });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Nome completo do produtor rural</Label>
          <Input value={config.producerName} onChange={e => u("producerName", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">CPF</Label>
          <Input value={config.cpf} onChange={e => u("cpf", e.target.value)} placeholder="000.000.000-00" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Inscrição Estadual (IE)</Label>
          <Input value={config.ie} onChange={e => u("ie", e.target.value)} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Endereço completo da propriedade</Label>
          <Input value={config.address} onChange={e => u("address", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Município</Label>
          <Input value={config.municipality} onChange={e => u("municipality", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Estado</Label>
          <Select value={config.state} onValueChange={v => u("state", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Área total (ha)</Label>
          <Input type="number" value={config.totalArea} onChange={e => u("totalArea", Number(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ano de exercício</Label>
          <Select value={String(config.exerciseYear)} onValueChange={v => u("exerciseYear", Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Atividade principal</Label>
          <Select value={config.mainActivity} onValueChange={v => u("mainActivity", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(activityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Regime de tributação</Label>
          <Select value={config.taxRegime} onValueChange={v => u("taxRegime", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(taxRegimeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
