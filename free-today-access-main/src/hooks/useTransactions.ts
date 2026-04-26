import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface TransactionInsert {
  category_id?: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  scope: 'business' | 'personal';
  status?: 'paid' | 'pending';
  payment_method?: string;
  date?: string;
  due_date?: string;
  notes?: string;
  recurrent?: boolean;
  recurrence?: 'mensal' | 'semanal' | 'quinzenal';
}

export function useTransactions(filters?: {
  type?: 'revenue' | 'expense';
  scope?: 'business' | 'personal';
  group?: string;
  categoryIds?: string[];
}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transactions', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*, categories(*)')
        .order('date', { ascending: false });

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.scope) query = query.eq('scope', filters.scope);
      if (filters?.categoryIds && filters.categoryIds.length > 0) {
        query = query.in('category_id', filters.categoryIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateTransaction() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransactionInsert) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Transação salva com sucesso!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Transação excluída!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    },
  });
}
