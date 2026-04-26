import { useState } from "react";
import {
  FileBarChart, DollarSign, Beef, Milk, Landmark, Users,
  ArrowLeft, Printer, FileDown, FileSpreadsheet, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { mockAnimals, speciesLabels, breeds, statusLabels, type Animal } from "@/data/rebanho-mock";
import { toast } from "sonner";

/* ── Report definitions ───────────────────────────── */
interface ReportDef {
  id: string;
  title: string;
  desc: string;
}

interface ReportCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  reports: ReportDef[];
}

const categories: ReportCategory[] = [
  {
    id: "financeiro", label: "Financeiros", icon: <DollarSign className="h-5 w-5" />,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    reports: [
      { id: "fluxo-caixa", title: "Fluxo de Caixa", desc: "Diário, semanal e mensal" },
      { id: "dre", title: "DRE", desc: "Demonstração do Resultado" },
      { id: "dfc", title: "DFC", desc: "Demonstração do Fluxo de Caixa" },
      { id: "extrato-conta", title: "Extrato por Conta", desc: "Movimentações por instrumento" },
      { id: "extrato-categoria", title: "Extrato por Categoria", desc: "Lançamentos agrupados" },
      { id: "contas-pagar-receber", title: "Contas a Pagar e Receber", desc: "Vencimentos e pendências" },
      { id: "parcelamentos", title: "Parcelamentos Ativos", desc: "Controle de parcelas" },
      { id: "recorrentes", title: "Lançamentos Recorrentes", desc: "Compromissos fixos" },
    ],
  },
  {
    id: "rebanho", label: "Rebanho", icon: <Beef className="h-5 w-5" />,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    reports: [
      { id: "inventario", title: "Inventário do Rebanho", desc: "Por categoria, raça e sexo" },
      { id: "curva-peso", title: "Curva de Peso", desc: "Evolução de peso dos animais" },
      { id: "gmd", title: "GMD por Lote", desc: "Ganho de peso médio diário" },
      { id: "nascimentos", title: "Nascimentos", desc: "Relatório por período" },
      { id: "vendas-animais", title: "Vendas de Animais", desc: "Valor por arroba e total" },
      { id: "abates", title: "Abates e Consumo Próprio", desc: "Controle de abates" },
      { id: "mortes", title: "Mortes e Causas", desc: "Registro de óbitos" },
      { id: "sanitario", title: "Histórico Sanitário", desc: "Vacinas e tratamentos" },
      { id: "reprodutivo", title: "Controle Reprodutivo", desc: "Cio, prenhez, parto, aborto" },
    ],
  },
  {
    id: "leite", label: "Leite", icon: <Milk className="h-5 w-5" />,
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    reports: [
      { id: "producao-diaria", title: "Produção Diária de Leite", desc: "Coleta por dia" },
      { id: "producao-vaca", title: "Produção por Vaca", desc: "Individual por animal" },
      { id: "producao-mensal", title: "Produção Mensal Consolidada", desc: "Totais mensais" },
      { id: "comparativo-ano", title: "Comparativo Ano a Ano", desc: "Evolução anual" },
    ],
  },
  {
    id: "fazenda", label: "Fazenda", icon: <Landmark className="h-5 w-5" />,
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    reports: [
      { id: "ocupacao-pastos", title: "Ocupação de Pastos", desc: "Lotação atual" },
      { id: "movimentacoes-pastos", title: "Movimentações entre Pastos", desc: "Transferências" },
      { id: "historico-atividades", title: "Histórico de Atividades", desc: "Registro geral" },
    ],
  },
  {
    id: "pessoal", label: "Pessoal", icon: <Users className="h-5 w-5" />,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    reports: [
      { id: "folha-pagamento", title: "Folha de Pagamento", desc: "Resumo mensal" },
      { id: "pagamentos-funcionario", title: "Pagamentos por Funcionário", desc: "Histórico individual" },
      { id: "controle-diarias", title: "Controle de Diárias", desc: "Dias trabalhados" },
    ],
  },
];

/* ── Helpers ───────────────────────────────────────── */
function handleExport(type: string) {
  toast.info(`Exportação ${type} será implementada com backend`);
}

function ExportButtons() {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleExport("PDF")}><FileDown className="h-4 w-4 mr-1" />PDF</Button>
      <Button variant="outline" size="sm" onClick={() => handleExport("Excel")}><FileSpreadsheet className="h-4 w-4 mr-1" />Excel</Button>
      <Button variant="outline" size="sm" onClick={() => handleExport("Impressão")}><Printer className="h-4 w-4 mr-1" />Imprimir</Button>
    </div>
  );
}

/* ── MOCK: Vendas ──────────────────────────────────── */
interface Venda {
  id: string;
  animal_id: string;
  ear_tag: string;
  name: string;
  breed: string;
  weight_kg: number;
  arroba_price: number;
  total: number;
  buyer: string;
  date: string;
}

const mockVendas: Venda[] = [
  { id: "v1", animal_id: "an-7", ear_tag: "BR007", name: "Valente", breed: "Nelore", weight_kg: 680, arroba_price: 320, total: 14506.67, buyer: "Frigorífico ABC", date: "2026-01-15" },
  { id: "v2", animal_id: "v-x1", ear_tag: "BR015", name: "Faisão", breed: "Angus", weight_kg: 550, arroba_price: 335, total: 12283.33, buyer: "JBS Unidade Sul", date: "2025-11-20" },
  { id: "v3", animal_id: "v-x2", ear_tag: "BR020", name: "Guerreiro", breed: "Nelore", weight_kg: 710, arroba_price: 310, total: 14673.33, buyer: "Frigorífico ABC", date: "2025-10-05" },
  { id: "v4", animal_id: "v-x3", ear_tag: "BR022", name: "Princesa", breed: "Brahman", weight_kg: 490, arroba_price: 325, total: 10616.67, buyer: "Marchante local", date: "2025-08-12" },
  { id: "v5", animal_id: "v-x4", ear_tag: "BR025", name: "Bandido", breed: "Senepol", weight_kg: 620, arroba_price: 340, total: 14053.33, buyer: "Frigorífico ABC", date: "2025-06-28" },
];

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(210, 60%, 50%)",
  "hsl(40, 80%, 50%)",
  "hsl(340, 60%, 50%)",
  "hsl(160, 50%, 45%)",
  "hsl(270, 50%, 55%)",
];

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
export default function Relatorios() {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const openReport = (id: string) => {
    if (id === "inventario" || id === "vendas-animais") {
      setActiveReport(id);
    } else {
      toast.info("Relatório será implementado em breve");
    }
  };

  if (activeReport) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setActiveReport(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" />Voltar aos Relatórios
        </Button>
        {activeReport === "inventario" && <ReportInventario />}
        {activeReport === "vendas-animais" && <ReportVendas />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileBarChart className="h-6 w-6 text-primary" /> Central de Relatórios
        </h1>
        <p className="text-sm text-muted-foreground">Selecione um relatório para gerar</p>
      </div>

      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-md border ${cat.color}`}>{cat.icon}</div>
              <h2 className="text-lg font-semibold text-foreground">{cat.label}</h2>
              <Badge variant="secondary" className="text-xs">{cat.reports.length}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cat.reports.map((r) => {
                const implemented = r.id === "inventario" || r.id === "vendas-animais";
                return (
                  <Card
                    key={r.id}
                    className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/40 ${implemented ? "border-primary/20" : ""}`}
                    onClick={() => openReport(r.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm text-foreground">{r.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                        </div>
                        {implemented && <Badge className="text-[10px] bg-primary/15 text-primary border-primary/30">Ativo</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   REPORT: Inventário do Rebanho
   ══════════════════════════════════════════════════════ */
function ReportInventario() {
  const [filterSpecies, setFilterSpecies] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSex, setFilterSex] = useState<string>("all");

  const animals = mockAnimals.filter((a) => {
    if (filterSpecies !== "all" && a.species !== filterSpecies) return false;
    if (filterStatus !== "all" && a.current_status !== filterStatus) return false;
    if (filterSex !== "all" && a.sex !== filterSex) return false;
    return true;
  });

  /* chart data */
  const byBreed = animals.reduce<Record<string, number>>((acc, a) => {
    acc[a.breed] = (acc[a.breed] || 0) + 1;
    return acc;
  }, {});
  const breedChart = Object.entries(byBreed).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const bySex = [
    { name: "Machos", value: animals.filter((a) => a.sex === "M").length },
    { name: "Fêmeas", value: animals.filter((a) => a.sex === "F").length },
  ];

  const bySpecies = Object.entries(
    animals.reduce<Record<string, number>>((acc, a) => {
      acc[speciesLabels[a.species]] = (acc[speciesLabels[a.species]] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const totalWeight = animals.reduce((s, a) => s + a.current_weight, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Inventário do Rebanho</h2>
          <p className="text-sm text-muted-foreground">{animals.length} animais • {(totalWeight / 1000).toFixed(1)}t peso total</p>
        </div>
        <ExportButtons />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3"><Filter className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Filtros</span></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Espécie</Label>
              <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(speciesLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sexo</Label>
              <Select value={filterSex} onValueChange={setFilterSex}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="M">Macho</SelectItem>
                  <SelectItem value="F">Fêmea</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="tabela">
        <TabsList>
          <TabsTrigger value="tabela">Tabela</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="tabela" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brinco</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Espécie</TableHead>
                    <TableHead>Raça</TableHead>
                    <TableHead>Sexo</TableHead>
                    <TableHead>Peso (kg)</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {animals.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.ear_tag}</TableCell>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>{speciesLabels[a.species]}</TableCell>
                      <TableCell>{a.breed}</TableCell>
                      <TableCell>{a.sex === "M" ? "♂ Macho" : "♀ Fêmea"}</TableCell>
                      <TableCell className="font-mono">{a.current_weight}</TableCell>
                      <TableCell className="text-sm">{a.paddock || "—"}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{statusLabels[a.current_status]}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {animals.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum animal encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graficos" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* By Breed */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Por Raça</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={breedChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* By Sex */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Por Sexo</CardTitle></CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={bySex} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {bySex.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* By Species */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Por Espécie</CardTitle></CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={bySpecies} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {bySpecies.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   REPORT: Vendas de Animais
   ══════════════════════════════════════════════════════ */
function ReportVendas() {
  const [dateFrom, setDateFrom] = useState("2025-01-01");
  const [dateTo, setDateTo] = useState("2026-12-31");

  const filtered = mockVendas.filter((v) => v.date >= dateFrom && v.date <= dateTo);
  const totalValue = filtered.reduce((s, v) => s + v.total, 0);
  const totalWeight = filtered.reduce((s, v) => s + v.weight_kg, 0);
  const avgArroba = filtered.length ? filtered.reduce((s, v) => s + v.arroba_price, 0) / filtered.length : 0;

  /* chart: vendas por mês */
  const byMonth = filtered.reduce<Record<string, number>>((acc, v) => {
    const m = v.date.substring(0, 7);
    acc[m] = (acc[m] || 0) + v.total;
    return acc;
  }, {});
  const monthChart = Object.entries(byMonth).sort().map(([month, total]) => ({ month, total }));

  /* chart: por comprador */
  const byBuyer = filtered.reduce<Record<string, number>>((acc, v) => {
    acc[v.buyer] = (acc[v.buyer] || 0) + v.total;
    return acc;
  }, {});
  const buyerChart = Object.entries(byBuyer).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Vendas de Animais</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} vendas no período</p>
        </div>
        <ExportButtons />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Vendido</p><p className="text-xl font-bold text-foreground">R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Peso Total</p><p className="text-xl font-bold text-foreground">{totalWeight.toLocaleString("pt-BR")} kg</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Animais Vendidos</p><p className="text-xl font-bold text-foreground">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Média @</p><p className="text-xl font-bold text-foreground">R$ {avgArroba.toFixed(2)}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3"><Filter className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Período</span></div>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="space-y-1"><Label className="text-xs">De</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Até</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tabela">
        <TabsList>
          <TabsTrigger value="tabela">Tabela</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="tabela" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Brinco</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Raça</TableHead>
                    <TableHead>Peso (kg)</TableHead>
                    <TableHead>Preço @</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Comprador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{new Date(v.date + "T12:00").toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="font-mono text-xs">{v.ear_tag}</TableCell>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell>{v.breed}</TableCell>
                      <TableCell className="font-mono">{v.weight_kg}</TableCell>
                      <TableCell className="font-mono">R$ {v.arroba_price.toFixed(2)}</TableCell>
                      <TableCell className="font-mono font-semibold text-primary">R$ {v.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{v.buyer}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma venda no período</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graficos" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Vendas por Mês (R$)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Por Comprador</CardTitle></CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={buyerChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                      {buyerChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
