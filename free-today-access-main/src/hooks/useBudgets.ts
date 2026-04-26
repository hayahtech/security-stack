import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  cost_center: string | null;
  name: string;
  amount: number;
  month: number;
  year: number;
  type: string;
  notes: string | null;
  created_at: string;
}

interface BudgetInsert {
  category_id?: string | null;
  cost_center?: string | null;
  name: string;
  amount: number;
  month: number;
  year: number;
  type: string;
  notes?: string | null;
}

export function useBudgets(month: number, year: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['budgets', user?.id, month, year],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('budgets')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .order('name');
      if (error) throw error;
      return (data || []) as Budget[];
    },
    enabled: !!user,
  });
}

export function useUpsertBudgets() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (items: BudgetInsert[]) => {
      // Delete existing budgets for the month/year first, then insert
      if (items.length === 0) return;
      const { month, year } = items[0];

      await (supabase as any)
        .from('budgets')
        .delete()
        .eq('month', month)
        .eq('year', year);

      const rows = items.filter(i => i.amount > 0).map(i => ({ ...i, user_id: user!.id }));
      if (rows.length === 0) return;

      const { error } = await (supabase as any)
        .from('budgets')
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Orçamento salvo com sucesso!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao salvar orçamento', description: err.message, variant: 'destructive' });
    },
  });
}

export function useBudgetVsActual(month: number, year: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['budget-vs-actual', user?.id, month, year],
    queryFn: async () => {
      // Get transactions for the month
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`;

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .gte('date', startDate)
        .lt('date', endDate);

      if (error) throw error;

      // Group by category_id
      const byCat: Record<string, { revenue: number; expense: number; catName: string; catGroup: string; catType: string }> = {};
      (transactions || []).forEach((t: any) => {
        const catId = t.category_id || 'sem-categoria';
        if (!byCat[catId]) {
          byCat[catId] = {
            revenue: 0,
            expense: 0,
            catName: t.categories?.name || 'Sem categoria',
            catGroup: t.categories?.group || 'Outros',
            catType: t.categories?.type || t.type,
          };
        }
        if (t.type === 'revenue') byCat[catId].revenue += Number(t.amount);
        else byCat[catId].expense += Number(t.amount);
      });

      return byCat;
    },
    enabled: !!user,
  });
}

export function usePreviousBudgets(month: number, year: number) {
  const { user } = useAuth();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  return useQuery({
    queryKey: ['budgets', user?.id, prevMonth, prevYear],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('budgets')
        .select('*')
        .eq('month', prevMonth)
        .eq('year', prevYear);
      if (error) throw error;
      return (data || []) as Budget[];
    },
    enabled: !!user,
  });
}

export function useAverageTransactions(month: number, year: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['avg-transactions-3m', user?.id, month, year],
    queryFn: async () => {
      // Get last 3 months of transactions
      const dates: { start: string; end: string }[] = [];
      for (let i = 1; i <= 3; i++) {
        let m = month - i;
        let y = year;
        if (m <= 0) { m += 12; y -= 1; }
        const start = `${y}-${String(m).padStart(2, '0')}-01`;
        const endM = m === 12 ? 1 : m + 1;
        const endY = m === 12 ? y + 1 : y;
        dates.push({ start, end: `${endY}-${String(endM).padStart(2, '0')}-01` });
      }

      const allStart = dates[dates.length - 1].start;
      const allEnd = dates[0].end;

      const { data, error } = await supabase
        .from('transactions')
        .select('category_id, type, amount')
        .gte('date', allStart)
        .lt('date', allEnd);

      if (error) throw error;

      const byCat: Record<string, { total: number; type: string }> = {};
      (data || []).forEach((t: any) => {
        const catId = t.category_id || 'sem-categoria';
        if (!byCat[catId]) byCat[catId] = { total: 0, type: t.type };
        byCat[catId].total += Number(t.amount);
      });

      // Average over 3 months
      Object.keys(byCat).forEach(k => {
        byCat[k].total = Math.round((byCat[k].total / 3) * 100) / 100;
      });

      return byCat;
    },
    enabled: !!user,
  });
}
