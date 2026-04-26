import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface AssetRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  type: string;
  value: number;
  acquisition_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface LiabilityRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  type: string;
  value: number;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

export function useAssets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['assets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as AssetRow[];
    },
    enabled: !!user,
  });
}

export function useLiabilities() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['liabilities', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('liabilities').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as LiabilityRow[];
    },
    enabled: !!user,
  });
}

export function useCreateAsset() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<AssetRow, 'id' | 'user_id' | 'created_at'>) => {
      const { error } = await supabase.from('assets').insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast({ title: 'Ativo salvo!' }); },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assets'] }); toast({ title: 'Ativo removido' }); },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useCreateLiability() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<LiabilityRow, 'id' | 'user_id' | 'created_at'>) => {
      const { error } = await supabase.from('liabilities').insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['liabilities'] }); toast({ title: 'Passivo salvo!' }); },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteLiability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('liabilities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['liabilities'] }); toast({ title: 'Passivo removido' }); },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}
