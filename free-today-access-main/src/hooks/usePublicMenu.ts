import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useStoreSlug() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['store_slug', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('store_slug')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data?.store_slug || '';
    },
    enabled: !!user,
  });
}

export function useUpdateStoreSlug() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ store_slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '') })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store_slug'] });
      toast({ title: 'Slug atualizado!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message?.includes('unique') ? 'Este slug já está em uso' : err.message, variant: 'destructive' });
    },
  });
}

export function useDailyPromotions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['daily_promotions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_promotions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreatePromotion() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string }) => {
      const { error } = await supabase
        .from('daily_promotions')
        .insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily_promotions'] });
      toast({ title: 'Promoção criada!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });
}

export function useTogglePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('daily_promotions')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily_promotions'] });
    },
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_promotions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily_promotions'] });
      toast({ title: 'Promoção excluída!' });
    },
  });
}
