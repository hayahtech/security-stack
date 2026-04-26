import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  [key: string]: any;
}

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (data: {
    category_id: string;
    amount: number;
    date: string;
    description: string;
    status: 'paid' | 'pending';
    due_date?: string;
    recurrent?: boolean;
    recurrence?: 'mensal' | 'semanal' | 'quinzenal';
  }) => void;
}

export function TransactionForm({ open, onClose, categories, onSave }: Props) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [dueDate, setDueDate] = useState('');
  const [recurrent, setRecurrent] = useState(false);
  const [recurrence, setRecurrence] = useState<'mensal' | 'semanal' | 'quinzenal'>('mensal');

  const handleSave = () => {
    if (!categoryId || !amount || !description) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    onSave({
      category_id: categoryId,
      amount: parseFloat(amount),
      date,
      description,
      status,
      due_date: status === 'pending' ? dueDate || undefined : undefined,
      recurrent: recurrent || undefined,
      recurrence: recurrent ? recurrence : undefined,
    });
    setCategoryId('');
    setAmount('');
    setDescription('');
    setStatus('paid');
    setDueDate('');
    setRecurrent(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <Label>Data</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva a transação..." />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as 'paid' | 'pending')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status === 'pending' && (
            <div>
              <Label>Data de Vencimento</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Switch checked={recurrent} onCheckedChange={setRecurrent} />
            <Label>Despesa recorrente</Label>
          </div>
          {recurrent && (
            <div>
              <Label>Frequência</Label>
              <Select value={recurrence} onValueChange={v => setRecurrence(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
