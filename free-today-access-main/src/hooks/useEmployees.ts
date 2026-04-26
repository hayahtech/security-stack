import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type EmployeeStatus = 'ativo' | 'inativo';

export function useEmployees() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['employees', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateEmployee() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; role?: string; salary: number; hire_date: string; phone?: string; notes?: string }) => {
      const { data, error } = await supabase.from('employees').insert({ ...input, user_id: user!.id }).select().single();
      if (error) throw error;

      const { data: salaryCat } = await supabase.from('categories').select('id').eq('name', 'Salários/Pró-labore').eq('user_id', user!.id).single();
      if (salaryCat) {
        await supabase.from('transactions').insert({
          user_id: user!.id,
          category_id: salaryCat.id,
          description: `Salário - ${input.name}`,
          amount: input.salary,
          type: 'expense' as const,
          scope: 'business' as const,
          status: 'pending' as const,
          date: new Date().toISOString().split('T')[0],
          recurrent: true,
          recurrence: 'mensal' as const,
        });
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast({ title: 'Funcionário cadastrado!' });
    },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; role?: string; salary?: number; status?: EmployeeStatus; phone?: string; notes?: string }) => {
      const { error } = await supabase.from('employees').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast({ title: 'Funcionário atualizado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast({ title: 'Funcionário excluído!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}
