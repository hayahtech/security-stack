import { useState } from 'react';
import { useTransactions, useCreateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PersonalExpenses() {
  const [formOpen, setFormOpen] = useState(false);
  const { data: categories, isLoading: catLoading } = useCategories();
  const cats = (categories || []).filter(c => c.scope === 'personal');
  const { data: transactions, isLoading } = useTransactions({ scope: 'personal' });
  const createTx = useCreateTransaction();
  const deleteTx = useDeleteTransaction();

  if (isLoading || catLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Nunito' }}>Gastos Pessoais</h1>
          <p className="text-sm text-muted-foreground">Alimentação, transporte, saúde e contas pessoais</p>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4 mr-1" /> Novo Gasto</Button>
      </div>
      <TransactionTable transactions={transactions || []} categories={categories || []} onDelete={(id) => {
        if (confirm('Excluir esta transação?')) deleteTx.mutate(id);
      }} />
      <TransactionForm open={formOpen} onClose={() => setFormOpen(false)} categories={cats} onSave={(data) => {
        createTx.mutate({ ...data, type: 'expense', scope: 'personal' });
        setFormOpen(false);
      }} />
    </div>
  );
}
