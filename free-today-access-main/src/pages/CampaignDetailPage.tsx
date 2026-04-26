import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarketingCampaign, useUpdateCampaign, useCampaignTransactions, CHANNEL_OPTIONS, OBJECTIVE_OPTIONS, STATUS_OPTIONS } from '@/hooks/useMarketingCampaigns';
import { useCreateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, DollarSign, Target, Users, TrendingUp, Trash2, Plus, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { toast } from '@/hooks/use-toast';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: campaign, isLoading } = useMarketingCampaign(id);
  const { data: linkedTx } = useCampaignTransactions(id);
  const { data: categories } = useCategories();
  const updateCampaign = useUpdateCampaign();
  const createTx = useCreateTransaction();
  const deleteTx = useDeleteTransaction();

  const [resultOpen, setResultOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [actualReach, setActualReach] = useState('');
  const [actualConversions, setActualConversions] = useState('');

  // Expense form
  const [exCategoryId, setExCategoryId] = useState('');
  const [exAmount, setExAmount] = useState('');
  const [exDate, setExDate] = useState(new Date().toISOString().split('T')[0]);
  const [exDescription, setExDescription] = useState('');

  const marketingCats = (categories || []).filter(c => c.group === 'Marketing');

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!campaign) return <div className="text-center py-12 text-muted-foreground">Campanha não encontrada</div>;

  const channel = CHANNEL_OPTIONS.find(c => c.value === campaign.channel);
  const objective = OBJECTIVE_OPTIONS.find(o => o.value === campaign.objective);
  const statusOpt = STATUS_OPTIONS.find(s => s.value === campaign.status);
  const budget = Number(campaign.budget);
  const spent = Number(campaign.spent);
  const remaining = budget - spent;
  const budgetProgress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const overBudget = spent > budget;

  // CAC for this campaign
  const campaignCAC = (campaign.actual_conversions && campaign.actual_conversions > 0)
    ? spent / campaign.actual_conversions : null;

  // ROI for this campaign (simple)
  const campaignROI = spent > 0 && campaign.actual_conversions
    ? ((campaign.actual_conversions * 50 - spent) / spent * 100) : null; // rough estimate

  // Spending timeline
  const spendingTimeline = (linkedTx || []).reduce((acc: any[], t: any) => {
    const dateStr = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const existing = acc.find(a => a.date === dateStr);
    if (existing) existing.valor += Number(t.amount);
    else acc.push({ date: dateStr, valor: Number(t.amount) });
    return acc;
  }, []);

  const handleUpdateResults = () => {
    const updates: any = { id: campaign.id };
    if (actualReach) updates.actual_reach = parseInt(actualReach);
    if (actualConversions) updates.actual_conversions = parseInt(actualConversions);
    updateCampaign.mutate(updates);
    setResultOpen(false);
  };

  const handleCloseCampaign = () => {
    if (confirm('Encerrar esta campanha?')) {
      updateCampaign.mutate({ id: campaign.id, status: 'encerrada' });
    }
  };

  const handleAddExpense = () => {
    if (!exCategoryId || !exAmount || !exDescription) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    createTx.mutate({
      category_id: exCategoryId,
      amount: parseFloat(exAmount),
      date: exDate,
      description: exDescription,
      type: 'expense',
      scope: 'business',
      status: 'paid',
      campaign_id: campaign.id,
    } as any);
    // Update campaign spent
    updateCampaign.mutate({ id: campaign.id, spent: spent + parseFloat(exAmount) });
    setExpenseOpen(false);
    setExCategoryId(''); setExAmount(''); setExDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/marketing')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>{campaign.name}</h1>
            <span className="text-xl">{channel?.icon}</span>
            <Badge variant={statusOpt?.color as any || 'secondary'}>{statusOpt?.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {objective?.label} • {new Date(campaign.start_date).toLocaleDateString('pt-BR')}
            {campaign.end_date && ` — ${new Date(campaign.end_date).toLocaleDateString('pt-BR')}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setResultOpen(true)}>Registrar Resultado</Button>
          {campaign.status !== 'encerrada' && (
            <Button variant="destructive" size="sm" onClick={handleCloseCampaign}>
              <CheckCircle className="h-4 w-4 mr-1" /> Encerrar
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Orçamento</p>
            <p className="text-lg font-bold" style={{ fontFamily: 'Nunito' }}>{formatCurrency(budget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className={`h-5 w-5 mx-auto mb-1 ${overBudget ? 'text-destructive' : 'text-primary'}`} />
            <p className="text-xs text-muted-foreground">Gasto</p>
            <p className={`text-lg font-bold ${overBudget ? 'text-destructive' : ''}`} style={{ fontFamily: 'Nunito' }}>{formatCurrency(spent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className={`h-5 w-5 mx-auto mb-1 ${remaining < 0 ? 'text-destructive' : 'text-[hsl(var(--success))]'}`} />
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-lg font-bold ${remaining < 0 ? 'text-destructive' : 'text-[hsl(var(--success))]'}`} style={{ fontFamily: 'Nunito' }}>{formatCurrency(remaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-secondary" />
            <p className="text-xs text-muted-foreground">Alcance Real</p>
            <p className="text-lg font-bold" style={{ fontFamily: 'Nunito' }}>
              {campaign.actual_reach?.toLocaleString('pt-BR') || '—'}
            </p>
            {campaign.expected_reach && (
              <p className="text-[10px] text-muted-foreground">de {campaign.expected_reach.toLocaleString('pt-BR')} esperados</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-[hsl(221,83%,53%)]" />
            <p className="text-xs text-muted-foreground">Conversões</p>
            <p className="text-lg font-bold" style={{ fontFamily: 'Nunito' }}>
              {campaign.actual_conversions ?? '—'}
            </p>
            {campaign.expected_conversions && (
              <p className="text-[10px] text-muted-foreground">de {campaign.expected_conversions} esperadas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso do Orçamento</span>
            <span className={overBudget ? 'text-destructive font-semibold' : ''}>{budgetProgress.toFixed(0)}%</span>
          </div>
          <Progress value={budgetProgress} className={`h-3 ${overBudget ? '[&>div]:bg-destructive' : ''}`} />
        </CardContent>
      </Card>

      {/* Spending Chart */}
      {spendingTimeline.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Gastos ao Longo da Campanha</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={spendingTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Linked Expenses */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Despesas Vinculadas</CardTitle>
            <Button size="sm" onClick={() => setExpenseOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Vincular Despesa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!linkedTx || linkedTx.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                      Nenhuma despesa vinculada
                    </TableCell>
                  </TableRow>
                ) : (
                  linkedTx.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{new Date(t.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-sm font-medium">{t.description}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{t.categories?.name || '—'}</Badge></TableCell>
                      <TableCell className="text-right text-sm font-semibold text-primary">-{formatCurrency(Number(t.amount))}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                          if (confirm('Desvincular esta despesa?')) deleteTx.mutate(t.id);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Result Dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Resultados</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Alcance Real</Label>
              <Input type="number" value={actualReach} onChange={e => setActualReach(e.target.value)} placeholder={campaign.actual_reach?.toString() || '0'} />
            </div>
            <div>
              <Label>Conversões Reais</Label>
              <Input type="number" value={actualConversions} onChange={e => setActualConversions(e.target.value)} placeholder={campaign.actual_conversions?.toString() || '0'} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResultOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateResults}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Categoria *</Label>
              <Select value={exCategoryId} onValueChange={setExCategoryId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {marketingCats.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" value={exAmount} onChange={e => setExAmount(e.target.value)} />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={exDate} onChange={e => setExDate(e.target.value)} />
            </div>
            <div>
              <Label>Descrição *</Label>
              <Input value={exDescription} onChange={e => setExDescription(e.target.value)} placeholder="Descreva..." />
            </div>
            {remaining !== null && (
              <p className={`text-xs ${remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                Saldo restante da campanha: {formatCurrency(remaining)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddExpense}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
