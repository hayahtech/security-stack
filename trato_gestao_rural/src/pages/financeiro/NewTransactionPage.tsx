import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/lib/format';
import { toast } from 'sonner';
import type { TransactionType, PaymentMethod } from '@/types';

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const { accounts, properties, activities, costCenters, categories, addTransaction } = useAppStore();

  const [type, setType] = useState<TransactionType>('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [propertyId, setPropertyId] = useState(properties[0]?.id || '');
  const [activityId, setActivityId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState(2);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState('mensal');
  const [notes, setNotes] = useState('');

  const filteredCategories = categories.filter(c =>
    type === 'receita' ? c.type === 'receita' : c.type === 'despesa'
  );
  const selectedCategory = categories.find(c => c.id === categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !accountId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const amountNum = parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Valor inválido');
      return;
    }

    if (isInstallment && installments > 1) {
      const perInstallment = amountNum / installments;
      const parentId = generateId();
      for (let i = 0; i < installments; i++) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + i);
        const dd = new Date(dueDate);
        dd.setMonth(dd.getMonth() + i);
        addTransaction({
          id: i === 0 ? parentId : generateId(),
          type, description: `${description} - parcela ${i + 1}/${installments}`,
          amount: perInstallment, date: d.toISOString().split('T')[0], dueDate: dd.toISOString().split('T')[0],
          accountId, propertyId, costCenterId, activityId, categoryId, subcategoryId, paymentMethod,
          status: i === 0 ? 'pago' : 'pendente',
          installments, currentInstallment: i + 1, parentId,
          notes,
          history: [{ date: new Date().toISOString().split('T')[0], action: 'Criado', description: `Parcela ${i + 1} de ${installments}` }],
        });
      }
      toast.success(`${installments} parcelas criadas com sucesso!`);
    } else if (isRecurring) {
      // Generate 6 months of recurring
      for (let i = 0; i < 6; i++) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + i);
        addTransaction({
          id: generateId(), type, description,
          amount: amountNum, date: d.toISOString().split('T')[0], dueDate: d.toISOString().split('T')[0],
          accountId, propertyId, costCenterId, activityId, categoryId, subcategoryId, paymentMethod,
          status: i === 0 ? 'pago' : 'pendente',
          recurring: true, recurringFrequency: recurringFreq, notes,
          history: [{ date: new Date().toISOString().split('T')[0], action: 'Criado', description: 'Lançamento recorrente' }],
        });
      }
      toast.success('Recorrência criada com sucesso!');
    } else {
      addTransaction({
        id: generateId(), type, description,
        amount: amountNum, date, dueDate,
        accountId, propertyId, costCenterId, activityId, categoryId, subcategoryId, paymentMethod,
        status: 'pago', notes,
        history: [{ date: new Date().toISOString().split('T')[0], action: 'Criado', description: 'Lançamento criado' }],
      });
      toast.success('Lançamento salvo com sucesso!');
    }

    navigate('/app/financeiro/lancamentos');
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[48px]";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="page-container max-w-2xl">
      <h1 className="mb-6">Novo Lançamento</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type selector */}
        <div>
          <label className={labelClass}>Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {(['receita', 'despesa', 'transferencia'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setCategoryId(''); }}
                className={`py-3 rounded-xl text-sm font-medium border transition-all ${type === t
                  ? t === 'receita' ? 'bg-success/10 border-success text-success' : t === 'despesa' ? 'bg-danger/10 border-danger text-danger' : 'bg-azul-light border-azul text-azul'
                  : 'border-input bg-card text-muted-foreground hover:bg-muted'}`}>
                {t === 'receita' ? '↑ Receita' : t === 'despesa' ? '↓ Despesa' : '↔ Transferência'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Descrição *</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Venda de soja - lote 15" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Valor (R$) *</label>
            <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Método</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className={inputClass}>
              <option value="pix">Pix</option>
              <option value="boleto">Boleto</option>
              <option value="cartao">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="transferencia">Transferência</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Data Competência</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Data Vencimento</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Conta *</label>
          <select value={accountId} onChange={e => setAccountId(e.target.value)} className={inputClass}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Propriedade</label>
            <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className={inputClass}>
              <option value="">Selecione</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Atividade</label>
            <select value={activityId} onChange={e => setActivityId(e.target.value)} className={inputClass}>
              <option value="">Selecione</option>
              {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Centro de Custo</label>
            <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className={inputClass}>
              <option value="">Selecione</option>
              {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Categoria</label>
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId(''); }} className={inputClass}>
              <option value="">Selecione</option>
              {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {selectedCategory && selectedCategory.subcategories.length > 0 && (
          <div>
            <label className={labelClass}>Subcategoria</label>
            <select value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)} className={inputClass}>
              <option value="">Selecione</option>
              {selectedCategory.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Installments / Recurring */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isInstallment} onChange={e => { setIsInstallment(e.target.checked); if (e.target.checked) setIsRecurring(false); }} className="rounded" />
            <span className="text-sm text-foreground">Parcelado?</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isRecurring} onChange={e => { setIsRecurring(e.target.checked); if (e.target.checked) setIsInstallment(false); }} className="rounded" />
            <span className="text-sm text-foreground">Recorrente?</span>
          </label>
        </div>

        {isInstallment && (
          <div className="animate-fade-in">
            <label className={labelClass}>Número de parcelas</label>
            <input type="number" min={2} max={48} value={installments} onChange={e => setInstallments(parseInt(e.target.value) || 2)} className={inputClass} />
          </div>
        )}

        {isRecurring && (
          <div className="animate-fade-in">
            <label className={labelClass}>Frequência</label>
            <select value={recurringFreq} onChange={e => setRecurringFreq(e.target.value)} className={inputClass}>
              <option value="mensal">Mensal</option>
              <option value="semanal">Semanal</option>
              <option value="trimestral">Trimestral</option>
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Observações</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inputClass} placeholder="Anotações opcionais..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity min-h-[48px]">
            Salvar Lançamento
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl border border-input bg-card text-foreground text-sm hover:bg-muted transition-colors min-h-[48px]">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
