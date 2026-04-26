import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type SupplierCategory = 'ingredientes' | 'embalagens' | 'equipamentos' | 'outros';

export function useSuppliers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['suppliers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateSupplier() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; contact?: string; phone?: string; email?: string; category: SupplierCategory; payment_terms?: string; notes?: string }) => {
      const { data, error } = await supabase.from('suppliers').insert({ ...input, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast({ title: 'Fornecedor cadastrado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; contact?: string; phone?: string; email?: string; category?: SupplierCategory; payment_terms?: string; notes?: string; active?: boolean }) => {
      const { error } = await supabase.from('suppliers').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast({ title: 'Fornecedor atualizado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast({ title: 'Fornecedor excluído!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}
