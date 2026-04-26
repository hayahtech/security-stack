import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WaitlistEntry {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  arrived_at: string;
  called_at: string | null;
  seated_at: string | null;
  status: string;
  estimated_wait_minutes: number | null;
  notes: string | null;
}

export function useWaitlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['waitlist', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await (supabase as any)
        .from('waitlist')
        .select('*')
        .gte('arrived_at', `${today}T00:00:00`)
        .in('status', ['aguardando', 'chamado'])
        .order('arrived_at', { ascending: true });
      if (error) throw error;
      return (data || []) as WaitlistEntry[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useAddToWaitlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Pick<WaitlistEntry, 'customer_name' | 'customer_phone' | 'party_size' | 'notes' | 'estimated_wait_minutes'>) => {
      const { error } = await (supabase as any)
        .from('waitlist')
        .insert({ ...entry, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waitlist'] }),
  });
}

export function useUpdateWaitlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WaitlistEntry> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('waitlist')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['waitlist'] }),
  });
}
