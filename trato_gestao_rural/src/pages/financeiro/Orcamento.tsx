import React, { useState, useMemo, useCallback } from "react";
import {
  Calculator, ChevronDown, ChevronRight, Copy, Plus, Eye, Pencil,
  TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  Legend, ResponsiveContainer,
} from "recharts";

/* ─── Constants ─── */
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtShort = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0);

/* ─── Types ─── */
interface SubCategory {
  id: string;
  name: string;
  budgeted: number[];   // 12 months
  realized: number[];   // 12 months
}

interface Category {
  id: string;
  name: string;
  type: "receita" | "despesa";
  children: SubCategory[];
  expanded: boolean;
}

/* ─── Initial Mock Data ─── */
function createInitialData(): Category[] {
  return [
    {
      id: "cat-1", name: "Receitas de Vendas", type: "receita", expanded: true,
      children: [
        { id: "sub-1a", name: "Venda de Gado", budgeted: [40000,35000,45000,38000,42000,50000,48000,40000,55000,60000,45000,70000], realized: [42000,33000,47000,36000,44000,0,0,0,0,0,0,0] },
        { id: "sub-1b", name: "Venda de Leite", budgeted: [12000,12000,13000,12000,14000,13000,12000,13000,14000,13000,12000,15000], realized: [11800,12500,13200,12100,14500,0,0,0,0,0,0,0] },
        { id: "sub-1c", name: "Arrendamento", budgeted: [8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000], realized: [8000,8000,8000,8000,8000,0,0,0,0,0,0,0] },
      ],
    },
    {
      id: "cat-2", name: "Outras Receitas", type: "receita", expanded: false,
      children: [
        { id: "sub-2a", name: "Serviços Prestados", budgeted: [2000,1500,2000,1500,2000,1500,2000,1500,2000,1500,2000,2500], realized: [2200,1400,2100,1600,1800,0,0,0,0,0,0,0] },
      ],
    },
    {
      id: "cat-3", name: "Custos de Produção", type: "despesa", expanded: true,
      children: [
        { id: "sub-3a", name: "Ração e Suplementos", budgeted: [8000,8000,9000,8500,8000,8500,9000,9000,8500,8000,8500,9000], realized: [8200,8400,9500,8300,8100,0,0,0,0,0,0,0] },
        { id: "sub-3b", name: "Medicamentos", budgeted: [3000,2500,3000,2800,3000,2500,3000,2800,3000,2500,3000,3500], realized: [3200,2300,3100,2900,2800,0,0,0,0,0,0,0] },
        { id: "sub-3c", name: "Combustível", budgeted: [2000,2000,2200,2000,2200,2000,2200,2200,2000,2000,2200,2500], realized: [2100,1900,2400,2100,2300,0,0,0,0,0,0,0] },
      ],
    },
    {
      id: "cat-4", name: "Despesas Operacionais", type: "despesa", expanded: true,
      children: [
        { id: "sub-4a", name: "Folha de Pagamento", budgeted: [15000,15000,15000,15000,15000,15000,15000,15000,15000,15000,15000,20000], realized: [15000,15000,15000,15000,15000,0,0,0,0,0,0,0] },
        { id: "sub-4b", name: "Manutenção", budgeted: [3000,2000,3500,2500,3000,2000,3500,2500,3000,2000,3500,4000], realized: [2800,2200,3800,2400,3200,0,0,0,0,0,0,0] },
        { id: "sub-4c", name: "Energia e Água", budgeted: [1500,1500,1600,1500,1400,1300,1400,1500,1600,1500,1500,1800], realized: [1550,1480,1620,1510,1380,0,0,0,0,0,0,0] },
      ],
    },
    {
      id: "cat-5", name: "Despesas Administrativas", type: "despesa", expanded: false,
      children: [
        { id: "sub-5a", name: "Contabilidade", budgeted: [1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200,1200], realized: [1200,1200,1200,1200,1200,0,0,0,0,0,0,0] },
        { id: "sub-5b", name: "Seguros", budgeted: [800,800,800,800,800,800,800,800,800,800,800,800], realized: [800,800,800,800,800,0,0,0,0,0,0,0] },
      ],
    },
  ];
}

/* ─── Component ─── */
export default function Orcamento() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [categories, setCategories] = useState<Category[]>(createInitialData);
  const [mode, setMode] = useState<"edit" | "track">("edit");
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  /* ─ Toggle category expansion ─ */
  const toggleExpand = useCallback((catId: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, expanded: !c.expanded } : c)),
    );
  }, []);

  /* ─ Update budgeted value ─ */
  const updateBudget = useCallback((subId: string, monthIdx: number, value: number) => {
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        children: c.children.map((s) =>
          s.id === subId
            ? { ...s, budgeted: s.budgeted.map((v, i) => (i === monthIdx ? value : v)) }
            : s,
        ),
      })),
    );
  }, []);

  /* ─ Category totals ─ */
  const catTotals = useMemo(() => {
    const map: Record<string, { budgeted: number[]; realized: number[] }> = {};
    categories.forEach((c) => {
      const b = Array(12).fill(0);
      const r = Array(12).fill(0);
      c.children.forEach((s) => {
        s.budgeted.forEach((v, i) => (b[i] += v));
        s.realized.forEach((v, i) => (r[i] += v));
      });
      map[c.id] = { budgeted: b, realized: r };
    });
    return map;
  }, [categories]);

  /* ─ Grand totals ─ */
  const grandTotals = useMemo(() => {
    const revenue = { budgeted: Array(12).fill(0), realized: Array(12).fill(0) };
    const expense = { budgeted: Array(12).fill(0), realized: Array(12).fill(0) };
    categories.forEach((c) => {
      const target = c.type === "receita" ? revenue : expense;
      const t = catTotals[c.id];
      t.budgeted.forEach((v, i) => (target.budgeted[i] += v));
      t.realized.forEach((v, i) => (target.realized[i] += v));
    });
    const net = {
      budgeted: revenue.budgeted.map((v, i) => v - expense.budgeted[i]),
      realized: revenue.realized.map((v, i) => v - expense.realized[i]),
    };
    return { revenue, expense, net };
  }, [categories, catTotals]);

  /* ─ Dashboard data ─ */
  const chartData = useMemo(() =>
    MONTHS.map((m, i) => ({
      month: m,
      orcado: grandTotals.net.budgeted[i],
      realizado: grandTotals.net.realized[i],
    })),
  [grandTotals]);

  const categoryAnalysis = useMemo(() => {
    const above: { name: string; pct: number }[] = [];
    const below: { name: string; pct: number }[] = [];
    categories.forEach((c) => {
      const t = catTotals[c.id];
      const totalB = t.budgeted.reduce((a, b) => a + b, 0);
      const totalR = t.realized.reduce((a, b) => a + b, 0);
      if (totalB === 0) return;
      const pct = ((totalR - totalB) / totalB) * 100;
      if (c.type === "despesa" && pct > 5) above.push({ name: c.name, pct });
      else if (c.type === "despesa" && pct < -5) below.push({ name: c.name, pct: Math.abs(pct) });
      else if (c.type === "receita" && pct > 5) below.push({ name: c.name, pct });
      else if (c.type === "receita" && pct < -5) above.push({ name: c.name, pct: Math.abs(pct) });
    });
    return { above, below };
  }, [categories, catTotals]);

  const executionPct = useMemo(() => {
    const totalB = grandTotals.revenue.budgeted.reduce((a, b) => a + b, 0);
    const totalR = grandTotals.revenue.realized.reduce((a, b) => a + b, 0);
    return totalB > 0 ? (totalR / totalB) * 100 : 0;
  }, [grandTotals]);

  /* ─ Actions ─ */
  const createBudget = () => {
    setCategories(createInitialData());
    toast({ title: `Orçamento ${year} criado`, description: "Preencha os valores mensais." });
  };

  const copyFromPrevious = () => {
    setCopyDialogOpen(false);
    setCategories(createInitialData());
    toast({ title: `Orçamento copiado`, description: `Valores de ${Number(year) - 1} foram copiados para ${year}.` });
  };

  /* ─ Render helpers ─ */
  const renderVariation = (budgeted: number, realized: number, type: "receita" | "despesa") => {
    if (budgeted === 0 || realized === 0) return null;
    const pct = ((realized - budgeted) / budgeted) * 100;
    const isGood =
      (type === "receita" && pct >= 0) || (type === "despesa" && pct <= 0);
    return (
      <span className={cn("flex items-center gap-0.5 text-[10px] font-medium",
        isGood ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
        {pct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(pct).toFixed(0)}%
      </span>
    );
  };

  const renderCell = (sub: SubCategory, monthIdx: number, type: "receita" | "despesa") => {
    if (mode === "edit") {
      return (
        <Input
          type="number"
          value={sub.budgeted[monthIdx] || ""}
          onChange={(e) => updateBudget(sub.id, monthIdx, Number(e.target.value) || 0)}
          className="h-7 w-full text-xs text-right font-mono px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={`${sub.name} ${MONTHS[monthIdx]}`}
        />
      );
    }
    const b = sub.budgeted[monthIdx];
    const r = sub.realized[monthIdx];
    const pct = b > 0 ? Math.min((r / b) * 100, 150) : 0;
    return (
      <div className="space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground font-mono">{fmtShort(b)}</span>
          <span className="text-xs font-mono font-medium">{fmtShort(r)}</span>
        </div>
        <Progress value={Math.min(pct, 100)} className="h-1" />
        {r > 0 && renderVariation(b, r, type)}
      </div>
    );
  };

  const sumArr = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Orçamento
          </h1>
          <p className="text-sm text-muted-foreground">
            Planeje e acompanhe receitas e despesas por categoria
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[100px]" aria-label="Selecionar ano">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={createBudget} className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar {year}
          </Button>
          <Button variant="outline" onClick={() => setCopyDialogOpen(true)} className="gap-1.5">
            <Copy className="h-4 w-4" /> Copiar Anterior
          </Button>

          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setMode("edit")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "edit"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-accent",
              )}
              aria-label="Modo edição"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </button>
            <button
              onClick={() => setMode("track")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "track"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-accent",
              )}
              aria-label="Modo acompanhamento"
            >
              <Eye className="h-3.5 w-3.5" /> Acompanhar
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Dashboard (track mode) ═══ */}
      {mode === "track" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{executionPct.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Execução Orçamentária</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Receita Orçada (Ano)</p>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {fmt(sumArr(grandTotals.revenue.budgeted))}
                </p>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm flex items-center gap-1.5 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Acima do Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {categoryAnalysis.above.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma</p>
                ) : (
                  <ul className="space-y-1">
                    {categoryAnalysis.above.map((c) => (
                      <li key={c.name} className="flex justify-between text-xs">
                        <span>{c.name}</span>
                        <Badge variant="outline" className="text-destructive text-[10px]">
                          +{c.pct.toFixed(0)}%
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Abaixo do Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                {categoryAnalysis.below.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma</p>
                ) : (
                  <ul className="space-y-1">
                    {categoryAnalysis.below.map((c) => (
                      <li key={c.name} className="flex justify-between text-xs">
                        <span>{c.name}</span>
                        <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                          -{c.pct.toFixed(0)}%
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Orçado vs Realizado — Resultado Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tickFormatter={(v) => fmtShort(v)} className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <RTooltip
                      formatter={(v: number) => fmt(v)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="orcado" name="Orçado" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ Budget Table ═══ */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[1200px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 pl-4 w-[200px] sticky left-0 bg-muted/50 z-10">Categoria</th>
                {MONTHS.map((m) => (
                  <th key={m} className={cn("text-center p-2 w-[80px]", mode === "track" ? "w-[100px]" : "")}>
                    {m}
                  </th>
                ))}
                <th className="text-right p-2 pr-4 w-[110px] font-bold">Total Anual</th>
              </tr>
            </thead>

            <tbody>
              {/* Receitas header */}
              <tr className="bg-emerald-50/50 dark:bg-emerald-900/10">
                <td colSpan={14} className="p-2 pl-4 font-bold text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider">
                  📈 Receitas
                </td>
              </tr>

              {categories.filter((c) => c.type === "receita").map((cat) => {
                const t = catTotals[cat.id];
                return (
                  <React.Fragment key={cat.id}>
                    {/* Category row */}
                    <tr
                      className="border-b bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpand(cat.id)}
                    >
                      <td className="p-2 pl-4 font-semibold flex items-center gap-1.5 sticky left-0 bg-muted/30 z-10">
                        {cat.expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        {cat.name}
                      </td>
                      {t.budgeted.map((v, i) => (
                        <td key={i} className="text-center p-2 font-mono text-xs font-semibold">
                          {mode === "edit" ? fmtShort(v) : (
                            <div className="text-center">
                              <span className="text-muted-foreground text-[10px]">{fmtShort(v)}</span>
                              {t.realized[i] > 0 && (
                                <div className="font-bold">{fmtShort(t.realized[i])}</div>
                              )}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="text-right p-2 pr-4 font-mono font-bold">
                        {fmt(sumArr(mode === "track" ? t.realized : t.budgeted))}
                      </td>
                    </tr>

                    {/* Subcategory rows */}
                    {cat.expanded && cat.children.map((sub) => (
                      <tr key={sub.id} className="border-b hover:bg-accent/30 transition-colors">
                        <td className="p-2 pl-10 text-muted-foreground sticky left-0 bg-background z-10">
                          {sub.name}
                        </td>
                        {MONTHS.map((_, i) => (
                          <td key={i} className="p-1 text-center">
                            {renderCell(sub, i, cat.type)}
                          </td>
                        ))}
                        <td className="text-right p-2 pr-4 font-mono text-sm">
                          {fmt(sumArr(mode === "track" ? sub.realized : sub.budgeted))}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}

              {/* Total Receitas */}
              <tr className="border-b-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 font-bold">
                <td className="p-2 pl-4 text-emerald-700 dark:text-emerald-400 sticky left-0 bg-emerald-50 dark:bg-emerald-900/20 z-10">
                  Total Receitas
                </td>
                {grandTotals.revenue.budgeted.map((v, i) => (
                  <td key={i} className="text-center p-2 font-mono text-xs text-emerald-700 dark:text-emerald-400">
                    {mode === "track" ? fmtShort(grandTotals.revenue.realized[i]) : fmtShort(v)}
                  </td>
                ))}
                <td className="text-right p-2 pr-4 font-mono text-emerald-700 dark:text-emerald-400">
                  {fmt(sumArr(mode === "track" ? grandTotals.revenue.realized : grandTotals.revenue.budgeted))}
                </td>
              </tr>

              {/* Despesas header */}
              <tr className="bg-red-50/50 dark:bg-red-900/10">
                <td colSpan={14} className="p-2 pl-4 font-bold text-destructive text-xs uppercase tracking-wider">
                  📉 Despesas
                </td>
              </tr>

              {categories.filter((c) => c.type === "despesa").map((cat) => {
                const t = catTotals[cat.id];
                return (
                  <React.Fragment key={cat.id}>
                    <tr
                      className="border-b bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpand(cat.id)}
                    >
                      <td className="p-2 pl-4 font-semibold flex items-center gap-1.5 sticky left-0 bg-muted/30 z-10">
                        {cat.expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        {cat.name}
                      </td>
                      {t.budgeted.map((v, i) => (
                        <td key={i} className="text-center p-2 font-mono text-xs font-semibold">
                          {mode === "edit" ? fmtShort(v) : (
                            <div className="text-center">
                              <span className="text-muted-foreground text-[10px]">{fmtShort(v)}</span>
                              {t.realized[i] > 0 && (
                                <div className="font-bold">{fmtShort(t.realized[i])}</div>
                              )}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="text-right p-2 pr-4 font-mono font-bold">
                        {fmt(sumArr(mode === "track" ? t.realized : t.budgeted))}
                      </td>
                    </tr>

                    {cat.expanded && cat.children.map((sub) => (
                      <tr key={sub.id} className="border-b hover:bg-accent/30 transition-colors">
                        <td className="p-2 pl-10 text-muted-foreground sticky left-0 bg-background z-10">
                          {sub.name}
                        </td>
                        {MONTHS.map((_, i) => (
                          <td key={i} className="p-1 text-center">
                            {renderCell(sub, i, cat.type)}
                          </td>
                        ))}
                        <td className="text-right p-2 pr-4 font-mono text-sm">
                          {fmt(sumArr(mode === "track" ? sub.realized : sub.budgeted))}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}

              {/* Total Despesas */}
              <tr className="border-b-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 font-bold">
                <td className="p-2 pl-4 text-destructive sticky left-0 bg-red-50 dark:bg-red-900/20 z-10">
                  Total Despesas
                </td>
                {grandTotals.expense.budgeted.map((v, i) => (
                  <td key={i} className="text-center p-2 font-mono text-xs text-destructive">
                    {mode === "track" ? fmtShort(grandTotals.expense.realized[i]) : fmtShort(v)}
                  </td>
                ))}
                <td className="text-right p-2 pr-4 font-mono text-destructive">
                  {fmt(sumArr(mode === "track" ? grandTotals.expense.realized : grandTotals.expense.budgeted))}
                </td>
              </tr>

              {/* RESULTADO LÍQUIDO */}
              <tr className="bg-primary/10 font-bold text-base">
                <td className="p-3 pl-4 text-primary sticky left-0 bg-primary/10 z-10">
                  ✅ RESULTADO LÍQUIDO
                </td>
                {grandTotals.net.budgeted.map((v, i) => {
                  const val = mode === "track" ? grandTotals.net.realized[i] : v;
                  return (
                    <td key={i} className={cn("text-center p-2 font-mono text-xs",
                      val >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")}>
                      {fmtShort(val)}
                    </td>
                  );
                })}
                <td className={cn("text-right p-3 pr-4 font-mono",
                  sumArr(mode === "track" ? grandTotals.net.realized : grandTotals.net.budgeted) >= 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-destructive")}>
                  {fmt(sumArr(mode === "track" ? grandTotals.net.realized : grandTotals.net.budgeted))}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Copy Dialog */}
      <AlertDialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copiar Orçamento Anterior</AlertDialogTitle>
            <AlertDialogDescription>
              Os valores de {Number(year) - 1} serão copiados para {year}. Valores existentes serão substituídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={copyFromPrevious}>Copiar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
