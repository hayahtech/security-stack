import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { HideValuesToggle } from '@/components/shared/HideValuesToggle';
import { formatCurrency, formatDate } from '@/lib/format';
import { ArrowLeft, Check, Copy, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { generateId } from '@/lib/format';

export default function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { transactions, accounts, properties, activities, costCenters, categories, markAsPaid, deleteTransaction, addTransaction, hideValues } = useAppStore();
  const mask = (v: number) => hideValues ? '•••••' : formatCurrency(v);
  const [showDelete, setShowDelete] = useState(false);

  const tx = transactions.find(t => t.id === id);
  if (!tx) return <div className="page-container"><p className="text-muted-foreground">Lançamento não encontrado</p></div>;

  const account = accounts.find(a => a.id === tx.accountId);
  const property = properties.find(p => p.id === tx.propertyId);
  const activity = activities.find(a => a.id === tx.activityId);
  const costCenter = costCenters.find(cc => cc.id === tx.costCenterId);
  const category = categories.find(c => c.id === tx.categoryId);
  const subcategory = category?.subcategories.find(s => s.id === tx.subcategoryId);

  const related = tx.parentId ? transactions.filter(t => t.parentId === tx.parentId && t.id !== tx.id) : [];

  const handleDuplicate = () => {
    addTransaction({ ...tx, id: generateId(), status: 'pendente', date: new Date().toISOString().split('T')[0], history: [{ date: new Date().toISOString().split('T')[0], action: 'Duplicado', description: `Duplicado de ${tx.id}` }] });
    toast.success('Lançamento duplicado!');
    navigate('/app/financeiro/lancamentos');
  };

  const detail = (label: string, value?: string) => value ? (
    <div className="flex justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  ) : null;

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <HideValuesToggle />
      </div>

      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{tx.type}</p>
            <h2 className="text-foreground">{tx.description}</h2>
          </div>
          <StatusBadge status={tx.status} />
        </div>

        <p className={`text-3xl font-bold ${tx.type === 'receita' ? 'text-success' : 'text-danger'}`}>
          {tx.type === 'receita' ? '+' : '-'}{mask(tx.amount)}
        </p>

        <div className="mt-6">
          {detail('Data', formatDate(tx.date))}
          {detail('Vencimento', formatDate(tx.dueDate))}
          {detail('Conta', account?.name)}
          {detail('Propriedade', property?.name)}
          {detail('Atividade', activity?.name)}
          {detail('Centro de Custo', costCenter?.name)}
          {detail('Categoria', category?.name)}
          {detail('Subcategoria', subcategory?.name)}
          {detail('Método', tx.paymentMethod)}
          {tx.installments && detail('Parcela', `${tx.currentInstallment} de ${tx.installments}`)}
          {tx.recurring && detail('Recorrência', tx.recurringFrequency)}
          {tx.notes && detail('Observações', tx.notes)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tx.status === 'pendente' && (
          <button onClick={() => { markAsPaid(tx.id); toast.success('Marcado como pago!'); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success text-success-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Check className="h-4 w-4" /> Marcar como Pago
          </button>
        )}
        <button onClick={handleDuplicate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors">
          <Copy className="h-4 w-4" /> Duplicar
        </button>
        <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-danger/30 bg-danger/5 text-danger text-sm font-medium hover:bg-danger/10 transition-colors">
          <Trash2 className="h-4 w-4" /> Excluir
        </button>
      </div>

      {related.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h3 className="section-title">Parcelas Relacionadas</h3>
          <div className="space-y-2">
            {related.map(r => (
              <div key={r.id} onClick={() => navigate(`/app/financeiro/lancamentos/${r.id}`)} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                <div>
                  <p className="text-sm text-foreground">{r.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.dueDate)}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="section-title flex items-center gap-2"><Clock className="h-4 w-4" /> Histórico</h3>
        <div className="space-y-3">
          {tx.history.map((ev, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{ev.action}</p>
                <p className="text-xs text-muted-foreground">{ev.description} — {formatDate(ev.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog open={showDelete} onClose={() => setShowDelete(false)} onConfirm={() => { deleteTransaction(tx.id); navigate('/app/financeiro/lancamentos'); toast.success('Lançamento excluído'); }} title="Excluir lançamento?" description="Essa ação não pode ser desfeita." />
    </div>
  );
}
