import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, DollarSign, AlertTriangle, Check, Pause, XCircle, Edit } from 'lucide-react';
import { useBills, useRecurringBills, useCreateBill, usePayBill, useDeleteBill, useUpdateBill, recurrenceLabel, type RecurrenceType, type Bill } from '@/hooks/useBills';
import { useCategories } from '@/hooks/useCategories';
import { format, differenceInDays, addDays } from 'date-fns';
import { toast } from '@/hooks/use-toast';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function BillsPage() {
  const [tab, setTab] = useState('pending');
  const [filter, setFilter] = useState<'all' | 'overdue' | 'today' | 'week' | 'month'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);

  const { data: bills, isLoading } = useBills(filter);
  const { data: recurringBills, isLoading: recLoading } = useRecurringBills();
  const { data: categories } = useCategories();
  const createBill = useCreateBill();
  const payBill = usePayBill();
  const deleteBill = useDeleteBill();
  const updateBill = useUpdateBill();

  // Form state
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [billType, setBillType] = useState<'pagar' | 'receber'>('pagar');
  const [catId, setCatId] = useState('');
  const [recurrent, setRecurrent] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('mensal');
  const [recurrenceDay, setRecurrenceDay] = useState('');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const pendingBills = (bills || []).filter(b => b.status === 'pending');
  const totalPagar = pendingBills.filter(b => b.type === 'pagar').reduce((s, b) => s + Number(b.amount), 0);
  const totalReceber = pendingBills.filter(b => b.type === 'receber').reduce((s, b) => s + Number(b.amount), 0);

  const today = new Date().toISOString().split('T')[0];

  function resetForm() {
    setDesc(''); setAmount(''); setDueDate(''); setBillType('pagar');
    setCatId(''); setRecurrent(false); setRecurrenceType('mensal');
    setRecurrenceDay(''); setRecurrenceEndDate('');
  }

  function handleCreate() {
    if (!desc || !amount || !dueDate) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    createBill.mutate({
      description: desc,
      amount: parseFloat(amount),
      due_date: dueDate,
      type: billType,
      category_id: catId || undefined,
      recurrent,
      recurrence_type_text: recurrent ? recurrenceType : undefined,
      recurrence_day: recurrent && recurrenceDay ? parseInt(recurrenceDay) : undefined,
      recurrence_end_date: recurrent && recurrenceEndDate ? recurrenceEndDate : undefined,
    });
    setFormOpen(false);
    resetForm();
  }

  function handlePay() {
    if (!selectedBill) return;
    payBill.mutate({ id: selectedBill.id, paid_at: paidAt });
    setPayModalOpen(false);
    setSelectedBill(null);
  }

  function getDueBadge(dueDate: string, status: string) {
    if (status === 'paid') return null;
    const diff = differenceInDays(new Date(dueDate), new Date());
    if (diff < 0) return <Badge variant="destructive" className="text-xs">Vencida</Badge>;
    if (diff <= 3) return <Badge className="text-xs bg-amber-500 text-white hover:bg-amber-600">Vence em {diff}d</Badge>;
    return null;
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Contas</h1>
          <p className="text-sm text-muted-foreground">Gerencie contas a pagar e receber</p>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova Conta</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">A Pagar</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-destructive">{formatCurrency(totalPagar)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">A Receber</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-[hsl(var(--success))]">{formatCurrency(totalReceber)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Saldo Pendente</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(totalReceber - totalPagar)}</p></CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">A Pagar/Receber</TabsTrigger>
          <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'overdue', 'today', 'week', 'month'] as const).map(f => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                {{ all: 'Todas', overdue: 'Vencidas', today: 'Hoje', week: 'Semana', month: 'Mês' }[f]}
              </Button>
            ))}
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(bills || []).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma conta encontrada</TableCell></TableRow>
                ) : (
                  (bills || []).map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          {new Date(b.due_date).toLocaleDateString('pt-BR')}
                          {getDueBadge(b.due_date, b.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {b.description}
                        {b.recurrent && <Badge variant="outline" className="ml-2 text-xs">Recorrente</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.type === 'receber' ? 'default' : 'secondary'} className="text-xs">
                          {b.type === 'pagar' ? 'Pagar' : 'Receber'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right text-sm font-semibold ${b.type === 'receber' ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                        {formatCurrency(Number(b.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                          {b.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {b.status === 'pending' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              setSelectedBill(b);
                              setPaidAt(new Date().toISOString().split('T')[0]);
                              setPayModalOpen(true);
                            }}>
                              <Check className="h-4 w-4 text-[hsl(var(--success))]" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="recurring" className="space-y-4">
          {recLoading ? <Skeleton className="h-64 w-full" /> : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Próx. Vencimento</TableHead>
                    <TableHead>Encerramento</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recurringBills || []).length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma conta recorrente</TableCell></TableRow>
                  ) : (
                    (recurringBills || []).map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="text-sm font-medium">{b.description}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">{formatCurrency(Number(b.amount))}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{recurrenceLabel(b.recurrence_type_text)}</Badge></TableCell>
                        <TableCell className="text-sm">{new Date(b.due_date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.recurrence_end_date ? new Date(b.recurrence_end_date).toLocaleDateString('pt-BR') : 'Sem fim'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              updateBill.mutate({ id: b.id, recurrent: false });
                            }}>
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => {
                              if (confirm('Encerrar esta série recorrente?')) {
                                updateBill.mutate({ id: b.id, recurrent: false, recurrence_end_date: today });
                              }
                            }}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* New Bill Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nova Conta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={billType} onValueChange={v => setBillType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagar">A Pagar</SelectItem>
                  <SelectItem value="receber">A Receber</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Aluguel" />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label>Data de Vencimento</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={catId} onValueChange={setCatId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {(categories || []).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={recurrent} onCheckedChange={setRecurrent} />
              <Label>Conta recorrente</Label>
            </div>
            {recurrent && (
              <>
                <div>
                  <Label>Frequência</Label>
                  <Select value={recurrenceType} onValueChange={v => setRecurrenceType(v as RecurrenceType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="bimestral">Bimestral</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="semestral">Semestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dia de vencimento</Label>
                  <Input type="number" min={1} max={31} value={recurrenceDay} onChange={e => setRecurrenceDay(e.target.value)} placeholder="Ex: 10" />
                </div>
                <div>
                  <Label>Data de encerramento (opcional)</Label>
                  <Input type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} />
                </div>
                {dueDate && (
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    📅 Esta conta será gerada automaticamente {recurrenceLabel(recurrenceType).toLowerCase()}, a partir de {new Date(dueDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    {recurrenceEndDate ? ` até ${new Date(recurrenceEndDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` : ' sem data de encerramento'}.
                  </p>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Pagar Conta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm"><strong>{selectedBill?.description}</strong> — {selectedBill ? formatCurrency(Number(selectedBill.amount)) : ''}</p>
            <div>
              <Label>Data de Pagamento</Label>
              <Input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayModalOpen(false)}>Cancelar</Button>
            <Button onClick={handlePay}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
