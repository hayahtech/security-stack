import { useState } from 'react';
import { useLoans, useLoanInstallments, useCreateLoan, usePayInstallment } from '@/hooks/useLoans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ChevronDown, ChevronUp, Landmark, Check } from 'lucide-react';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function LoanInstallments({ loanId, installmentsTotal }: { loanId: string; installmentsTotal: number }) {
  const { data: installments, isLoading } = useLoanInstallments(loanId);
  const payInstallment = usePayInstallment();

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Parcela</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(installments || []).map(inst => (
            <TableRow key={inst.id}>
              <TableCell>{inst.installment_number}/{installmentsTotal}</TableCell>
              <TableCell>{new Date(inst.due_date).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(Number(inst.amount))}</TableCell>
              <TableCell>
                <Badge variant={inst.status === 'pago' ? 'default' : inst.status === 'vencido' ? 'destructive' : 'secondary'}>
                  {inst.status === 'pago' ? 'Paga' : inst.status === 'vencido' ? 'Vencida' : 'Pendente'}
                </Badge>
              </TableCell>
              <TableCell>
                {inst.status !== 'pago' && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => payInstallment.mutate({ id: inst.id, loanId })}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function LoansPage() {
  const { data: loans, isLoading } = useLoans();
  const createLoan = useCreateLoan();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [name, setName] = useState('');
  const [creditor, setCreditor] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentsTotal, setInstallmentsTotal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDay, setDueDay] = useState('10');

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const handleCreate = () => {
    createLoan.mutate({
      name, creditor, total_amount: parseFloat(totalAmount),
      installments_total: parseInt(installmentsTotal),
      interest_rate: parseFloat(interestRate) || 0,
      start_date: startDate, due_day: parseInt(dueDay) || 10,
    });
    setFormOpen(false);
    setName(''); setCreditor(''); setTotalAmount(''); setInstallmentsTotal(''); setInterestRate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Empréstimos</h1>
          <p className="text-sm text-muted-foreground">Controle de empréstimos e financiamentos</p>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo Empréstimo</Button>
      </div>

      {(loans || []).length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum empréstimo cadastrado</p>
      )}

      {(loans || []).map(loan => {
        const isExpanded = expanded === loan.id;
        return (
          <Card key={loan.id}>
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : loan.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Landmark className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{loan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(Number(loan.total_amount))} • {loan.installments_total}x • {Number(loan.interest_rate)}% a.m.
                      {loan.creditor && ` • ${loan.creditor}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={loan.status === 'quitado' ? 'default' : 'outline'}>
                    {loan.installments_paid}/{loan.installments_total} pagas
                  </Badge>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent>
                <LoanInstallments loanId={loan.id} installmentsTotal={loan.installments_total} />
              </CardContent>
            )}
          </Card>
        );
      })}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Empréstimo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Forno Industrial" /></div>
            <div><Label>Credor</Label><Input value={creditor} onChange={e => setCreditor(e.target.value)} placeholder="Banco, pessoa..." /></div>
            <div><Label>Valor Total (R$)</Label><Input type="number" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nº de Parcelas</Label><Input type="number" value={installmentsTotal} onChange={e => setInstallmentsTotal(e.target.value)} placeholder="1-60" /></div>
              <div><Label>Taxa de Juros (% a.m.)</Label><Input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data de Início</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div><Label>Dia de Vencimento</Label><Input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
