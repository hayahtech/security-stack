import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Plus, Trash2, BarChart3, DollarSign, Percent as PercentIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  useCostCenterSummary, useCostCenterAllocations, useSaveAllocation, useDeleteAllocation,
  COST_CENTERS, type CostCenterAllocation, type ChannelSummary,
} from '@/hooks/useCostCenters';
import { useCategories } from '@/hooks/useCategories';
import { toast } from 'sonner';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const CHANNEL_COLORS: Record<string, string> = {
  salao: '#16a34a',
  delivery: '#2563eb',
  ifood: '#dc2626',
  rappi: '#f97316',
  whatsapp: '#22c55e',
  eventos: '#8b5cf6',
  geral: '#6b7280',
};

// ─── Channel Summary Cards ───
function ChannelCards({ summaries, loading }: { summaries: ChannelSummary[]; loading: boolean }) {
  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}</div>;

  const active = summaries.filter(s => s.revenue > 0 || s.expenses > 0);

  if (active.length === 0) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum dado no período selecionado</CardContent></Card>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {active.map(s => (
        <Card key={s.channel} className="border-l-4" style={{ borderLeftColor: CHANNEL_COLORS[s.channel] }}>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              {s.label}
              <Badge variant={s.margin >= 30 ? 'default' : s.margin >= 0 ? 'secondary' : 'destructive'} className="text-[10px]">
                {s.margin.toFixed(1)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />Receita</span>
              <span className="text-green-600 font-medium">{formatCurrency(s.revenue)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" />Despesas</span>
              <span className="text-destructive font-medium">{formatCurrency(s.expenses)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t">
              <span>Lucro</span>
              <span className={s.profit >= 0 ? 'text-green-600' : 'text-destructive'}>{formatCurrency(s.profit)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Margin Chart ───
function MarginChart({ summaries }: { summaries: ChannelSummary[] }) {
  const data = summaries.filter(s => s.revenue > 0 || s.expenses > 0);
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Margem por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" />
            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
            <Bar dataKey="margin" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Allocation Dialog ───
function AllocationDialog({ existing, onClose }: { existing?: CostCenterAllocation; onClose: () => void }) {
  const save = useSaveAllocation();
  const [form, setForm] = useState({
    id: existing?.id,
    description: existing?.description || '',
    category_id: existing?.category_id || null,
    salao: existing?.salao || 0,
    delivery: existing?.delivery || 0,
    ifood: existing?.ifood || 0,
    rappi: existing?.rappi || 0,
    whatsapp: existing?.whatsapp || 0,
    eventos: existing?.eventos || 0,
    geral: existing?.geral || 100,
  });

  const total = form.salao + form.delivery + form.ifood + form.rappi + form.whatsapp + form.eventos + form.geral;

  const handleSave = async () => {
    if (Math.abs(total - 100) > 0.01) {
      toast.error('O rateio deve somar 100%');
      return;
    }
    if (!form.description) {
      toast.error('Preencha a descrição');
      return;
    }
    try {
      await save.mutateAsync(form);
      toast.success('Rateio salvo!');
      onClose();
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: 'salao', label: 'Salão' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'ifood', label: 'iFood' },
    { key: 'rappi', label: 'Rappi' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'eventos', label: 'Eventos' },
    { key: 'geral', label: 'Geral' },
  ];

  return (
    <div className="space-y-3">
      <div>
        <Label>Descrição da despesa</Label>
        <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Aluguel, Energia, Salários" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(f => (
          <div key={f.key}>
            <Label className="text-xs">{f.label} (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form[f.key] as number}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${Math.abs(total - 100) > 0.01 ? 'text-destructive' : 'text-green-600'}`}>
          Total: {total.toFixed(1)}%
        </span>
        <Button onClick={handleSave} disabled={save.isPending}>
          {save.isPending ? 'Salvando...' : 'Salvar Rateio'}
        </Button>
      </div>
    </div>
  );
}

// ─── Allocation Table ───
function AllocationTab() {
  const { data: allocations, isLoading } = useCostCenterAllocations();
  const deleteAlloc = useDeleteAllocation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const editing = allocations?.find(a => a.id === editingId);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Configure como despesas compartilhadas são distribuídas entre os canais.</p>
        <Dialog open={showNew || !!editingId} onOpenChange={v => { if (!v) { setShowNew(false); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Novo Rateio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Editar Rateio' : 'Novo Rateio'}</DialogTitle></DialogHeader>
            <AllocationDialog existing={editing} onClose={() => { setShowNew(false); setEditingId(null); }} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (allocations || []).length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum rateio configurado. Adicione para distribuir despesas compartilhadas.</CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Despesa</TableHead>
                {COST_CENTERS.filter(c => c.value !== 'geral').map(c => (
                  <TableHead key={c.value} className="text-center text-xs">{c.label}</TableHead>
                ))}
                <TableHead className="text-center text-xs">Geral</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(allocations || []).map(a => (
                <TableRow key={a.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setEditingId(a.id)}>
                  <TableCell className="font-medium text-sm">{a.description}</TableCell>
                  {(['salao', 'delivery', 'ifood', 'rappi', 'whatsapp', 'eventos'] as const).map(key => (
                    <TableCell key={key} className="text-center text-xs">{a[key] > 0 ? `${a[key]}%` : '-'}</TableCell>
                  ))}
                  <TableCell className="text-center text-xs">{a.geral > 0 ? `${a.geral}%` : '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); deleteAlloc.mutate(a.id); }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ─── DRE por Canal ───
function DREByChannel({ summaries }: { summaries: ChannelSummary[] }) {
  const active = summaries.filter(s => s.revenue > 0 || s.expenses > 0);
  const totals = active.reduce((acc, s) => ({
    revenue: acc.revenue + s.revenue,
    expenses: acc.expenses + s.expenses,
    profit: acc.profit + s.profit,
  }), { revenue: 0, expenses: 0, profit: 0 });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" />DRE Comparativo por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Sem dados no período</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  {active.map(s => <TableHead key={s.channel} className="text-right text-xs">{s.label}</TableHead>)}
                  <TableHead className="text-right text-xs font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Receita Bruta</TableCell>
                  {active.map(s => <TableCell key={s.channel} className="text-right text-green-600">{formatCurrency(s.revenue)}</TableCell>)}
                  <TableCell className="text-right font-bold text-green-600">{formatCurrency(totals.revenue)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">(-) Despesas</TableCell>
                  {active.map(s => <TableCell key={s.channel} className="text-right text-destructive">{formatCurrency(s.expenses)}</TableCell>)}
                  <TableCell className="text-right font-bold text-destructive">{formatCurrency(totals.expenses)}</TableCell>
                </TableRow>
                <TableRow className="border-t-2">
                  <TableCell className="font-bold">Lucro Bruto</TableCell>
                  {active.map(s => <TableCell key={s.channel} className={`text-right font-bold ${s.profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>{formatCurrency(s.profit)}</TableCell>)}
                  <TableCell className={`text-right font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>{formatCurrency(totals.profit)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Margem</TableCell>
                  {active.map(s => <TableCell key={s.channel} className="text-right">{s.margin.toFixed(1)}%</TableCell>)}
                  <TableCell className="text-right font-bold">{totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : '0.0'}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───
export default function CostCenterPage() {
  const [refDate, setRefDate] = useState(new Date());
  const startDate = format(startOfMonth(refDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(refDate), 'yyyy-MM-dd');

  const { data: summaries, isLoading } = useCostCenterSummary(startDate, endDate);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Centro de Custos
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setRefDate(d => subMonths(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center capitalize">
            {format(refDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setRefDate(d => addMonths(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="resumo">
        <TabsList>
          <TabsTrigger value="resumo">Resumo por Canal</TabsTrigger>
          <TabsTrigger value="rateio">Rateio de Despesas</TabsTrigger>
          <TabsTrigger value="dre">DRE por Canal</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <ChannelCards summaries={summaries || []} loading={isLoading} />
          <MarginChart summaries={summaries || []} />
        </TabsContent>

        <TabsContent value="rateio">
          <AllocationTab />
        </TabsContent>

        <TabsContent value="dre">
          <DREByChannel summaries={summaries || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
