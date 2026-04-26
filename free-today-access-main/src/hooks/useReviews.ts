import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useReviews(dateFrom?: string, dateTo?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['reviews', user?.id, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase.from('reviews').select('*, customers(name, phone)').order('created_at', { ascending: false });
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');
      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateReview() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { customer_id?: string; sale_id?: string; channel: string; rating: number; comment?: string; category: string }) => {
      const { data, error } = await supabase.from('reviews').insert({ user_id: user!.id, ...input }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      if (data.rating <= 2) toast({ title: '⚠️ Avaliação baixa registrada', description: `Nota ${data.rating}/5`, variant: 'destructive' });
      else toast({ title: 'Avaliação registrada!' });
    },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useRespondReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, response_text }: { id: string; response_text: string }) => {
      const { error } = await supabase.from('reviews').update({ response_text, responded_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reviews'] }); toast({ title: 'Resposta salva!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useOccurrences(status?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['occurrences', user?.id, status],
    queryFn: async () => {
      let query = supabase.from('occurrences').select('*, customers(name, phone)').order('created_at', { ascending: false });
      if (status && status !== 'all') query = query.eq('status', status);
      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCustomerOccurrences(customerId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['occurrences', 'customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase.from('occurrences').select('*').eq('customer_id', customerId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!customerId,
  });
}

export function useCustomerReviews(customerId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['reviews', 'customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase.from('reviews').select('*').eq('customer_id', customerId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!customerId,
  });
}

export function useCreateOccurrence() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { customer_id?: string; sale_id?: string; type: string; description: string }) => {
      const { data, error } = await supabase.from('occurrences').insert({ user_id: user!.id, ...input }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['occurrences'] }); toast({ title: 'Ocorrência registrada!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useUpdateOccurrence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; status?: string; resolution?: string }) => {
      const updates: any = { ...input };
      if (input.status === 'resolvido') updates.resolved_at = new Date().toISOString();
      const { error } = await supabase.from('occurrences').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['occurrences'] }); toast({ title: 'Ocorrência atualizada!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}
