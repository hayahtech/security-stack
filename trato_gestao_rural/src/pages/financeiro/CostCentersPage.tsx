import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/lib/format';
import { PieChart } from 'lucide-react';

export default function CostCentersPage() {
  const { costCenters, transactions } = useAppStore();

  return (
    <div className="page-container">
      <h1 className="mb-6">Centros de Custo</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {costCenters.map(cc => {
          const total = transactions.filter(t => t.costCenterId === cc.id && t.type === 'despesa' && t.status !== 'cancelado').reduce((s, t) => s + t.amount, 0);
          return (
            <div key={cc.id} className="stat-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-terra-light">
                  <PieChart className="h-5 w-5 text-terra" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{cc.name}</p>
                  <p className="text-xs text-muted-foreground">{cc.description}</p>
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(total)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total acumulado</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
