import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target, TrendingUp, TrendingDown, AlertTriangle, Copy, Calculator } from 'lucide-react';
import { useBudgets, useUpsertBudgets, useBudgetVsActual, usePreviousBudgets, useAverageTransactions } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';

const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function BudgetPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showModal, setShowModal] = useState(false);

  const { data: budgets = [] } = useBudgets(month, year);
  const { data: actual = {} } = useBudgetVsActual(month, year);
  const { data: categories = [] } = useCategories();

  // Build comparison data
  const comparisonData = useMemo(() => {
    const allCatIds = new Set<string>();
    budgets.forEach(b => { if (b.category_id) allCatIds.add(b.category_id); });
    Object.keys(actual).forEach(id => allCatIds.add(id));

    const rows: { categoryId: string; name: string; group: string; type: string; budgeted: number; realized: number; diff: number; pct: number }[] = [];

    allCatIds.forEach(catId => {
      const budget = budgets.find(b => b.category_id === catId);
      const act = actual[catId];
      const cat = categories.find((c: any) => c.id === catId);
      const name = budget?.name || act?.catName || cat?.name || 'Sem categoria';
      const group = act?.catGroup || cat?.group || 'Outros';
      const type = budget?.type || act?.catType || cat?.type || 'expense';
      const budgeted = budget?.amount || 0;
      const realized = type === 'revenue' ? (act?.revenue || 0) : (act?.expense || 0);
      const diff = realized - budgeted;
      const pct = budgeted > 0 ? (realized / budgeted) * 100 : 0;
      rows.push({ categoryId: catId, name, group, type, budgeted, realized, diff, pct });
    });

    return rows;
  }, [budgets, actual, categories]);

  const revenueRows = comparisonData.filter(r => r.type === 'revenue');
  const expenseRows = comparisonData.filter(r => r.type !== 'revenue');

  const totalBudgetedRev = revenueRows.reduce((s, r) => s + r.budgeted, 0);
  const totalRealizedRev = revenueRows.reduce((s, r) => s + r.realized, 0);
  const totalBudgetedExp = expenseRows.reduce((s, r) => s + r.budgeted, 0);
  const totalRealizedExp = expenseRows.reduce((s, r) => s + r.realized, 0);

  // Projection
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const projectedExp = month === now.getMonth() + 1 && year === now.getFullYear()
    ? (totalRealizedExp / dayOfMonth) * daysInMonth
    : null;

  // Chart data (top 10)
  const chartData = useMemo(() => {
    return [...comparisonData]
      .filter(r => r.budgeted > 0 || r.realized > 0)
      .sort((a, b) => b.budgeted - a.budgeted)
      .slice(0, 10)
      .map(r => ({
        name: r.name.length > 15 ? r.name.substring(0, 15) + '…' : r.name,
        Orçado: r.budgeted,
        Realizado: r.realized,
      }));
  }, [comparisonData]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderRow = (r: typeof comparisonData[0]) => {
    const isGood = r.type === 'revenue' ? r.realized >= r.budgeted : r.realized <= r.budgeted;
    return (
      <TableRow key={r.categoryId}>
        <TableCell className="font-medium">{r.name}</TableCell>
        <TableCell className="text-right">{fmt(r.budgeted)}</TableCell>
        <TableCell className="text-right">{fmt(r.realized)}</TableCell>
        <TableCell className={`text-right font-semibold ${r.budgeted === 0 ? 'text-muted-foreground' : isGood ? 'text-green-600' : 'text-red-600'}`}>
          {fmt(r.diff)}
        </TableCell>
        <TableCell className="text-right">
          {r.budgeted > 0 && (
            <Badge variant={isGood ? 'default' : 'destructive'} className="text-xs">
              {r.pct.toFixed(0)}%
            </Badge>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamento Mensal</h1>
          <p className="text-muted-foreground">Planeje e acompanhe receitas e despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowModal(true)}>
            <Target className="h-4 w-4 mr-2" /> Definir Orçamento
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Receitas Orçadas</div>
            <div className="text-2xl font-bold">{fmt(totalBudgetedRev)}</div>
            <div className={`text-sm ${totalRealizedRev >= totalBudgetedRev ? 'text-green-600' : 'text-red-600'}`}>
              Realizado: {fmt(totalRealizedRev)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Despesas Orçadas</div>
            <div className="text-2xl font-bold">{fmt(totalBudgetedExp)}</div>
            <div className={`text-sm ${totalRealizedExp <= totalBudgetedExp ? 'text-green-600' : 'text-red-600'}`}>
              Realizado: {fmt(totalRealizedExp)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Resultado Orçado</div>
            <div className="text-2xl font-bold">{fmt(totalBudgetedRev - totalBudgetedExp)}</div>
            <div className="text-sm text-muted-foreground">
              Resultado real: {fmt(totalRealizedRev - totalRealizedExp)}
            </div>
          </CardContent>
        </Card>
        {projectedExp !== null && (
          <Card className={projectedExp > totalBudgetedExp ? 'border-destructive' : 'border-green-500'}>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Projeção Despesas
              </div>
              <div className="text-2xl font-bold">{fmt(projectedExp)}</div>
              <div className={`text-sm ${projectedExp > totalBudgetedExp ? 'text-red-600' : 'text-green-600'}`}>
                {projectedExp > totalBudgetedExp
                  ? `${fmt(projectedExp - totalBudgetedExp)} acima do orçado`
                  : `${fmt(totalBudgetedExp - projectedExp)} abaixo do orçado`}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Orçado vs Realizado</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="Orçado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Realizado" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Orçamento vs Realizado</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Orçado</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueRows.length > 0 && (
                <>
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={5} className="font-semibold text-green-700">
                      <TrendingUp className="h-4 w-4 inline mr-1" /> Receitas
                    </TableCell>
                  </TableRow>
                  {revenueRows.map(renderRow)}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total Receitas</TableCell>
                    <TableCell className="text-right">{fmt(totalBudgetedRev)}</TableCell>
                    <TableCell className="text-right">{fmt(totalRealizedRev)}</TableCell>
                    <TableCell className={`text-right ${totalRealizedRev >= totalBudgetedRev ? 'text-green-600' : 'text-red-600'}`}>
                      {fmt(totalRealizedRev - totalBudgetedRev)}
                    </TableCell>
                    <TableCell className="text-right">
                      {totalBudgetedRev > 0 && <Badge>{((totalRealizedRev / totalBudgetedRev) * 100).toFixed(0)}%</Badge>}
                    </TableCell>
                  </TableRow>
                </>
              )}
              {expenseRows.length > 0 && (
                <>
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={5} className="font-semibold text-red-700">
                      <TrendingDown className="h-4 w-4 inline mr-1" /> Despesas
                    </TableCell>
                  </TableRow>
                  {expenseRows.map(renderRow)}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total Despesas</TableCell>
                    <TableCell className="text-right">{fmt(totalBudgetedExp)}</TableCell>
                    <TableCell className="text-right">{fmt(totalRealizedExp)}</TableCell>
                    <TableCell className={`text-right ${totalRealizedExp <= totalBudgetedExp ? 'text-green-600' : 'text-red-600'}`}>
                      {fmt(totalRealizedExp - totalBudgetedExp)}
                    </TableCell>
                    <TableCell className="text-right">
                      {totalBudgetedExp > 0 && <Badge variant={totalRealizedExp > totalBudgetedExp ? 'destructive' : 'default'}>{((totalRealizedExp / totalBudgetedExp) * 100).toFixed(0)}%</Badge>}
                    </TableCell>
                  </TableRow>
                </>
              )}
              {revenueRows.length === 0 && expenseRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum orçamento definido para este mês. Clique em "Definir Orçamento" para começar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <BudgetModal open={showModal} onOpenChange={setShowModal} month={month} year={year} budgets={budgets} categories={categories} />
    </div>
  );
}

function BudgetModal({ open, onOpenChange, month, year, budgets, categories }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  month: number;
  year: number;
  budgets: any[];
  categories: any[];
}) {
  const [values, setValues] = useState<Record<string, number>>({});
  const upsert = useUpsertBudgets();
  const { data: prevBudgets = [] } = usePreviousBudgets(month, year);
  const { data: avgData = {} } = useAverageTransactions(month, year);

  useEffect(() => {
    const v: Record<string, number> = {};
    budgets.forEach((b: any) => { if (b.category_id) v[b.category_id] = b.amount; });
    setValues(v);
  }, [budgets]);

  const copyFromPrevious = () => {
    const v: Record<string, number> = {};
    prevBudgets.forEach((b: any) => { if (b.category_id) v[b.category_id] = b.amount; });
    setValues(v);
  };

  const useAverage = () => {
    const v: Record<string, number> = {};
    Object.entries(avgData).forEach(([catId, d]) => {
      v[catId] = (d as any).total;
    });
    setValues(v);
  };

  const handleSave = () => {
    const items = categories
      .filter((c: any) => values[c.id] && values[c.id] > 0)
      .map((c: any) => ({
        category_id: c.id,
        name: c.name,
        amount: values[c.id],
        month,
        year,
        type: c.type === 'revenue' ? 'receita' : 'despesa',
      }));
    upsert.mutate(items, { onSuccess: () => onOpenChange(false) });
  };

  const revCats = categories.filter((c: any) => c.type === 'revenue');
  const expCats = categories.filter((c: any) => c.type === 'expense');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Definir Orçamento — {months[month - 1]} {year}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={copyFromPrevious}>
            <Copy className="h-3 w-3 mr-1" /> Copiar mês anterior
          </Button>
          <Button variant="outline" size="sm" onClick={useAverage}>
            <Calculator className="h-3 w-3 mr-1" /> Média 3 meses
          </Button>
        </div>

        {revCats.length > 0 && (
          <>
            <h3 className="font-semibold text-green-700 text-sm mb-2">Receitas</h3>
            <div className="space-y-2 mb-4">
              {revCats.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-sm flex-1">{c.name}</span>
                  <Input
                    type="number"
                    className="w-32 text-right"
                    placeholder="0,00"
                    value={values[c.id] || ''}
                    onChange={e => setValues(prev => ({ ...prev, [c.id]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {expCats.length > 0 && (
          <>
            <h3 className="font-semibold text-red-700 text-sm mb-2">Despesas</h3>
            <div className="space-y-2 mb-4">
              {expCats.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-sm flex-1">{c.name}</span>
                  <Input
                    type="number"
                    className="w-32 text-right"
                    placeholder="0,00"
                    value={values[c.id] || ''}
                    onChange={e => setValues(prev => ({ ...prev, [c.id]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={upsert.isPending}>
            {upsert.isPending ? 'Salvando...' : 'Salvar Orçamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
