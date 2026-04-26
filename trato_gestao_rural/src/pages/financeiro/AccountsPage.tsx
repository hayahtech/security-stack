import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/lib/format';
import { HideValuesToggle } from '@/components/shared/HideValuesToggle';
import { Landmark } from 'lucide-react';

export default function AccountsPage() {
  const navigate = useNavigate();
  const { accounts, hideValues } = useAppStore();
  const mask = (v: number) => hideValues ? '•••••' : formatCurrency(v);
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>Contas</h1>
          <p className="text-sm text-muted-foreground mt-1">Saldo consolidado: {mask(total)}</p>
        </div>
        <HideValuesToggle />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} onClick={() => navigate(`/app/contas/${acc.id}`)} className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: acc.color + '20' }}>
                <Landmark className="h-5 w-5" style={{ color: acc.color }} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{acc.name}</p>
                <p className="text-xs text-muted-foreground">{acc.bank} • {acc.type}</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{mask(acc.balance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Saldo inicial: {mask(acc.initialBalance)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
