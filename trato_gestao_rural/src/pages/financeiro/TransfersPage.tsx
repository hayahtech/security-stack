import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/lib/format';
import { HideValuesToggle } from '@/components/shared/HideValuesToggle';
import { ArrowLeftRight } from 'lucide-react';
import { generateId } from '@/lib/format';
import { toast } from 'sonner';

export default function TransfersPage() {
  const navigate = useNavigate();
  const { accounts, addTransaction, hideValues } = useAppStore();
  const mask = (v: number) => hideValues ? '•••••' : formatCurrency(v);
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [toId, setToId] = useState(accounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!amountNum || fromId === toId) {
      toast.error('Verifique os dados da transferência');
      return;
    }
    const fromAcc = accounts.find(a => a.id === fromId);
    const toAcc = accounts.find(a => a.id === toId);

    addTransaction({
      id: generateId(), type: 'transferencia', description: description || `Transferência para ${toAcc?.name}`,
      amount: amountNum, date, dueDate: date, accountId: fromId, propertyId: '', costCenterId: '', activityId: '', categoryId: '', paymentMethod: 'transferencia', status: 'pago',
      history: [{ date, action: 'Transferência', description: `Saída para ${toAcc?.name}` }],
    });

    addTransaction({
      id: generateId(), type: 'transferencia', description: description || `Transferência de ${fromAcc?.name}`,
      amount: amountNum, date, dueDate: date, accountId: toId, propertyId: '', costCenterId: '', activityId: '', categoryId: '', paymentMethod: 'transferencia', status: 'pago',
      history: [{ date, action: 'Transferência', description: `Entrada de ${fromAcc?.name}` }],
    });

    toast.success('Transferência realizada!');
    navigate('/app/dashboard');
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[48px]";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="page-container max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h1>Transferência entre Contas</h1>
        <HideValuesToggle />
      </div>

      <form onSubmit={handleTransfer} className="space-y-5">
        <div>
          <label className={labelClass}>Conta Origem</label>
          <select value={fromId} onChange={e => setFromId(e.target.value)} className={inputClass}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {mask(a.balance)}</option>)}
          </select>
        </div>

        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-muted">
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Conta Destino</label>
          <select value={toId} onChange={e => setToId(e.target.value)} className={inputClass}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {mask(a.balance)}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Valor (R$)</label>
          <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Data</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Opcional" className={inputClass} />
        </div>

        <button type="submit" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity min-h-[48px]">
          Confirmar Transferência
        </button>
      </form>
    </div>
  );
}
