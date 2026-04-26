import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp,
  Search, Plus, FileText, Sheet, MoreHorizontal,
  Edit, Trash2, Copy, Eye, CalendarIcon,
  ChevronLeft, ChevronRight, ArrowUpDown, Paperclip,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  mockTransactions, paymentInstruments, categories, costCenters,
  chartDataMonthly,
} from "@/data/financeiro-mock";
import { Transaction } from "@/data/types";
import { TransactionFormDrawer } from "@/components/financeiro/TransactionFormDrawer";
import { toast } from "@/hooks/use-toast";
import { DocumentViewerModal } from "@/components/financeiro/DocumentUpload";

const ITEMS_PER_PAGE = 20;

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

type SortKey = "txn_date" | "description" | "amount" | "category" | "status";
type SortDir = "asc" | "desc";

export default function FluxoDeCaixa() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [period, setPeriod] = useState("mes");
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [costCenterFilter, setCostCenterFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("txn_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [docViewerOpen, setDocViewerOpen] = useState(false);

  // Filter
  const filtered = useMemo(() => {
    let list = [...transactions];
    if (instrumentFilter !== "all") list = list.filter((t) => t.instrument_id === instrumentFilter);
    if (categoryFilter !== "all") list = list.filter((t) => t.category_id === categoryFilter);
    if (costCenterFilter !== "all") list = list.filter((t) => t.cost_center_id === costCenterFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.description.toLowerCase().includes(q) || t.merchant.toLowerCase().includes(q));
    }
    return list;
  }, [transactions, instrumentFilter, categoryFilter, costCenterFilter, search]);

  // Sort
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "txn_date") cmp = a.txn_date.localeCompare(b.txn_date);
      else if (sortKey === "description") cmp = a.description.localeCompare(b.description);
      else if (sortKey === "amount") cmp = a.amount - b.amount;
      else if (sortKey === "category") cmp = a.category_id.localeCompare(b.category_id);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Summary
  const totalEntradas = filtered.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const totalSaidas = filtered.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
  const saldoPeriodo = totalEntradas - totalSaidas;

  // Chart data with cumulative
  const chartData = useMemo(() => {
    let acc = 0;
    return chartDataMonthly.map((d) => {
      acc += d.entradas - d.saidas;
      return { ...d, acumulado: acc };
    });
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const handleSave = (txn: Transaction) => {
    setTransactions((prev) => [txn, ...prev]);
    setDrawerOpen(false);
    toast({ title: "Transação adicionada", description: txn.description });
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Transação excluída" });
  };

  const handleDuplicate = (txn: Transaction) => {
    const dup = { ...txn, id: `txn-dup-${Date.now()}`, description: `${txn.description} (cópia)` };
    setTransactions((prev) => [dup, ...prev]);
    toast({ title: "Transação duplicada" });
  };

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const getInstrumentName = (id: string) => paymentInstruments.find((p) => p.id === id)?.name ?? id;

  const SortButton = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <Button variant="ghost" size="sm" className="h-auto p-0 gap-1 font-medium" onClick={() => toggleSort(k)}>
      {children}
      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
    </Button>
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1"><FileText className="h-4 w-4" /> PDF</Button>
            <Button variant="outline" size="sm" className="gap-1"><Sheet className="h-4 w-4" /> Excel</Button>
            <Button size="sm" className="gap-1" onClick={() => setDrawerOpen(true)}><Plus className="h-4 w-4" /> Nova Transação</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Mês Atual</SelectItem>
              <SelectItem value="trimestre">Trimestre</SelectItem>
              <SelectItem value="semestre">Semestre</SelectItem>
              <SelectItem value="ano">Ano</SelectItem>
              <SelectItem value="mes_especifico">Mês Específico</SelectItem>
              <SelectItem value="ano_especifico">Ano Específico</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {period === "mes_especifico" && (
            <>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]"><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          {period === "ano_especifico" && (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]"><SelectValue placeholder="Ano" /></SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Conta/Cartão" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {paymentInstruments.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={costCenterFilter} onValueChange={setCostCenterFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos centros</SelectItem>
              {costCenters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Entradas", value: totalEntradas, icon: ArrowDownCircle, color: "text-primary", bg: "bg-primary/10" },
            { label: "Total Saídas", value: totalSaidas, icon: ArrowUpCircle, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Saldo do Período", value: saldoPeriodo, icon: Wallet, color: saldoPeriodo >= 0 ? "text-primary" : "text-destructive", bg: saldoPeriodo >= 0 ? "bg-primary/10" : "bg-destructive/10" },
            { label: "Saldo Acumulado", value: 187450, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
          ].map((c) => (
            <Card key={c.label} className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{c.label}</span>
                  <div className={`${c.bg} ${c.color} rounded-lg p-2`}><c.icon className="h-4 w-4" /></div>
                </div>
                <p className={`text-xl font-bold font-display ${c.color}`}>{fmt(c.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground mb-4">Entradas vs Saídas + Saldo Acumulado</p>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${v / 1000}k`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, name: string) => [fmt(value), name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="entradas" fill="hsl(142, 50%, 45%)" radius={[4, 4, 0, 0]} name="Entradas" />
                <Bar dataKey="saidas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Saídas" />
                <Line type="monotone" dataKey="acumulado" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 3 }} name="Acumulado" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><SortButton k="txn_date">Data</SortButton></TableHead>
                    <TableHead><SortButton k="description">Descrição</SortButton></TableHead>
                    <TableHead><SortButton k="category">Categoria</SortButton></TableHead>
                    <TableHead>Subcategoria</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right"><SortButton k="amount">Valor</SortButton></TableHead>
                    <TableHead><SortButton k="status">Status</SortButton></TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((txn) => (
                    <TableRow key={txn.id} className="group">
                      <TableCell className="whitespace-nowrap text-sm">{format(new Date(txn.txn_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {txn.has_attachment && (
                            <button
                              type="button"
                              onClick={() => setDocViewerOpen(true)}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title="Ver documento anexado"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">{txn.description}</p>
                            <p className="text-xs text-muted-foreground">{txn.merchant}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{getCategoryName(txn.category_id)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{txn.subcategory}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{getInstrumentName(txn.instrument_id)}</TableCell>
                      <TableCell className={`text-right font-medium whitespace-nowrap ${txn.type === "receita" ? "text-primary" : "text-destructive"}`}>
                        {txn.type === "receita" ? "+" : "-"} {fmt(txn.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={txn.status === "confirmado" ? "default" : txn.status === "pendente" ? "secondary" : "destructive"} className="text-xs">
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2"><Edit className="h-3.5 w-3.5" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleDuplicate(txn)}><Copy className="h-3.5 w-3.5" /> Duplicar</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2"><Eye className="h-3.5 w-3.5" /> Ver Comprovante</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(txn.id)}>
                              <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma transação encontrada.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">{filtered.length} transações</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TransactionFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} onSave={handleSave} />
      <DocumentViewerModal
        file={docViewerOpen ? { name: "nota-fiscal.pdf", url: "#", type: "application/pdf" } : null}
        open={docViewerOpen}
        onOpenChange={setDocViewerOpen}
      />
    </div>
  );
}
