import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface SalesGoal {
  id: string;
  user_id: string;
  period: string;
  goal_type: string;
  target_value: number;
  reference_date: string;
  created_at: string;
}

export function useSalesGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sales_goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('sales_goals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as SalesGoal[];
    },
    enabled: !!user,
  });
}

export function useCreateSalesGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { period: string; goal_type: string; target_value: number; reference_date?: string }) => {
      const { error } = await supabase.from('sales_goals').insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales_goals'] }); toast({ title: 'Meta cadastrada!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useUpdateSalesGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<SalesGoal> & { id: string }) => {
      const { error } = await supabase.from('sales_goals').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales_goals'] }); toast({ title: 'Meta atualizada!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useDeleteSalesGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales_goals'] }); toast({ title: 'Meta removida!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}
