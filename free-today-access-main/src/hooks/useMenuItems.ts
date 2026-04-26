import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type MenuCategory = 'pizza' | 'bebida' | 'sobremesa' | 'outro';

export function useMenuItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['menu_items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('menu_items').select('*').order('category').order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateMenuItem() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; category: MenuCategory; sale_price: number; cost_price: number; description?: string | null; image_url?: string | null }) => {
      const { data, error } = await supabase.from('menu_items').insert({ ...input, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu_items'] }); toast({ title: 'Item cadastrado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; category?: MenuCategory; sale_price?: number; cost_price?: number; active?: boolean; description?: string | null; image_url?: string | null }) => {
      const { error } = await supabase.from('menu_items').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu_items'] }); toast({ title: 'Item atualizado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['menu_items'] }); toast({ title: 'Item excluído!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}
