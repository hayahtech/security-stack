import { useState } from 'react';
import { useTransactions, useCreateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useScope } from '@/contexts/ScopeContext';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Revenue() {
  const [formOpen, setFormOpen] = useState(false);
  const { scope } = useScope();
  const { data: categories, isLoading: catLoading } = useCategories();
  const revenueCats = (categories || []).filter(c => c.type === 'revenue' && c.scope === 'business');
  const catIds = revenueCats.map(c => c.id);
  const { data: transactions, isLoading } = useTransactions({ type: 'revenue', scope: 'business', categoryIds: catIds });
  const createTx = useCreateTransaction();
  const deleteTx = useDeleteTransaction();

  if (isLoading || catLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Receitas</h1>
          <p className="text-sm text-muted-foreground">Vendas e recebimentos do negócio</p>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova Receita</Button>
      </div>
      <TransactionTable transactions={transactions || []} categories={categories || []} onDelete={(id) => {
        if (confirm('Excluir esta transação?')) deleteTx.mutate(id);
      }} />
      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        categories={revenueCats}
        onSave={(data) => {
          createTx.mutate({ ...data, type: 'revenue', scope: 'business' });
          setFormOpen(false);
        }}
      />
    </div>
  );
}
