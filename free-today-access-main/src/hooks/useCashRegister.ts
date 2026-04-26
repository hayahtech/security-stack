import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useActiveCashSession() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cash_session_active', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_sessions')
        .select('*, employees(name), cash_movements(*)')
        .eq('status', 'aberto')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCashSessions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cash_sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_sessions')
        .select('*, employees(name)')
        .order('opened_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCashMovements(sessionId?: string) {
  return useQuery({
    queryKey: ['cash_movements', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .eq('session_id', sessionId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useOpenCashSession() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { opening_balance: number; employee_id?: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('cash_sessions')
        .insert({ user_id: user!.id, opening_balance: input.opening_balance, expected_balance: input.opening_balance, employee_id: input.employee_id || null, notes: input.notes || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash_session'] }); qc.invalidateQueries({ queryKey: ['cash_sessions'] }); toast({ title: 'Caixa aberto!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useCloseCashSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; actual_balance: number; expected_balance: number; notes?: string }) => {
      const difference = input.actual_balance - input.expected_balance;
      const { error } = await supabase
        .from('cash_sessions')
        .update({ status: 'fechado', closed_at: new Date().toISOString(), actual_balance: input.actual_balance, expected_balance: input.expected_balance, difference, notes: input.notes || null })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cash_session'] }); qc.invalidateQueries({ queryKey: ['cash_sessions'] }); toast({ title: 'Caixa fechado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useCreateCashMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { session_id: string; type: 'sangria' | 'suprimento'; amount: number; reason?: string }) => {
      const { data, error } = await supabase
        .from('cash_movements')
        .insert(input)
        .select()
        .single();
      if (error) throw error;

      // Update expected balance
      const { data: session } = await supabase.from('cash_sessions').select('expected_balance').eq('id', input.session_id).single();
      if (session) {
        const delta = input.type === 'suprimento' ? input.amount : -input.amount;
        await supabase.from('cash_sessions').update({ expected_balance: Number(session.expected_balance) + delta }).eq('id', input.session_id);
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash_session'] });
      qc.invalidateQueries({ queryKey: ['cash_sessions'] });
      qc.invalidateQueries({ queryKey: ['cash_movements'] });
      toast({ title: 'Movimentação registrada!' });
    },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}
