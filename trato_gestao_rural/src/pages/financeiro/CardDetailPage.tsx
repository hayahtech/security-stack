import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/lib/format';
import { HideValuesToggle } from '@/components/shared/HideValuesToggle';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';

export default function CardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cards, hideValues } = useAppStore();
  const mask = (v: number) => hideValues ? '•••••' : formatCurrency(v);
  const card = cards.find(c => c.id === id);

  if (!card) return <div className="page-container"><p className="text-muted-foreground">Cartão não encontrado</p></div>;

  const usedLimit = card.invoices.filter(i => !i.paid).reduce((s, i) => s + i.total, 0);
  const available = card.limit - usedLimit;
  const usedPercent = (usedLimit / card.limit) * 100;

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate('/app/cartoes')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <HideValuesToggle />
      </div>

      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-accent">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2>{card.name}</h2>
            <p className="text-sm text-muted-foreground">{card.brand} • Fecha dia {card.closingDay} • Vence dia {card.dueDay}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-xs text-muted-foreground">Limite</p>
            <p className="text-lg font-bold text-foreground">{mask(card.limit)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Utilizado</p>
            <p className="text-lg font-bold text-danger">{mask(usedLimit)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Disponível</p>
            <p className="text-lg font-bold text-success">{mask(available)}</p>
          </div>
        </div>

        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(usedPercent, 100)}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{usedPercent.toFixed(0)}% utilizado</p>
      </div>

      <h3 className="section-title">Faturas</h3>
      <div className="space-y-3">
        {card.invoices.map(inv => {
          const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          return (
            <div key={inv.id} onClick={() => navigate(`/app/cartoes/${card.id}/fatura/${inv.id}`)} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm cursor-pointer transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">{monthNames[inv.month]}/{inv.year}</p>
                <StatusBadge status={inv.paid ? 'pago' : 'pendente'} />
              </div>
              <p className="text-xl font-bold text-foreground">{mask(inv.total)}</p>
              <p className="text-xs text-muted-foreground mt-1">{inv.transactions.length} lançamentos</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
