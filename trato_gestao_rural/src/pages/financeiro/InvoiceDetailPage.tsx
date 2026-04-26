import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/lib/format';
import { HideValuesToggle } from '@/components/shared/HideValuesToggle';
import { ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceDetailPage() {
  const { id, faturaId } = useParams();
  const navigate = useNavigate();
  const { cards, hideValues } = useAppStore();
  const mask = (v: number) => hideValues ? '•••••' : formatCurrency(v);
  const card = cards.find(c => c.id === id);
  const invoice = card?.invoices.find(i => i.id === faturaId);

  if (!card || !invoice) return <div className="page-container"><p className="text-muted-foreground">Fatura não encontrada</p></div>;

  const handlePay = () => {
    invoice.paid = true;
    toast.success('Fatura paga com sucesso!');
    navigate(`/app/cartoes/${card.id}`);
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(`/app/cartoes/${card.id}`)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <HideValuesToggle />
      </div>

      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2>Fatura {card.name}</h2>
        <p className="text-3xl font-bold text-foreground mt-2">{mask(invoice.total)}</p>
        <p className="text-sm text-muted-foreground mt-1">{invoice.paid ? '✅ Paga' : '⏳ Em aberto'}</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h3 className="section-title">Despesas da Fatura</h3>
        <div className="space-y-2">
          {invoice.transactions.map((desc, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <span className="text-sm text-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {!invoice.paid && (
        <button onClick={handlePay} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-success text-success-foreground font-medium text-sm hover:opacity-90 transition-opacity min-h-[48px]">
          <Check className="h-4 w-4" /> Pagar Fatura
        </button>
      )}
    </div>
  );
}
