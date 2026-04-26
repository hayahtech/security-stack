import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type TableStatus = 'livre' | 'ocupada' | 'reservada' | 'conta_pedida' | 'limpeza';
type SessionStatus = 'aberta' | 'conta_pedida' | 'fechada' | 'cancelada';
type OrderStatus = 'pendente' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado';

export function useTables() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tables', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('tables').select('*').eq('active', true).order('number');
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });
}

export function useCreateTable() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { number: number; capacity: number; location: string }) => {
      const { data, error } = await (supabase as any).from('tables').insert({ ...input, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); toast({ title: 'Mesa cadastrada!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useUpdateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; status?: TableStatus; current_session_id?: string | null; active?: boolean }) => {
      const { error } = await (supabase as any).from('tables').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

// Sessions
export function useTableSession(sessionId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['table_sessions', sessionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('table_sessions').select('*, employees(name)').eq('id', sessionId!).single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!user && !!sessionId,
  });
}

export function useOpenTableSession() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const updateTable = useUpdateTable();
  return useMutation({
    mutationFn: async (input: { table_id: string; customer_count: number; waiter_id?: string }) => {
      const { data, error } = await (supabase as any).from('table_sessions').insert({ ...input, user_id: user!.id }).select().single();
      if (error) throw error;
      await updateTable.mutateAsync({ id: input.table_id, status: 'ocupada', current_session_id: data.id });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); qc.invalidateQueries({ queryKey: ['table_sessions'] }); toast({ title: 'Mesa aberta!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useCloseTableSession() {
  const qc = useQueryClient();
  const updateTable = useUpdateTable();
  return useMutation({
    mutationFn: async ({ sessionId, tableId }: { sessionId: string; tableId: string }) => {
      const { error } = await (supabase as any).from('table_sessions').update({ status: 'fechada', closed_at: new Date().toISOString() }).eq('id', sessionId);
      if (error) throw error;
      await updateTable.mutateAsync({ id: tableId, status: 'livre', current_session_id: null });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] });
      qc.invalidateQueries({ queryKey: ['table_sessions'] });
      qc.invalidateQueries({ queryKey: ['table_orders'] });
      toast({ title: 'Mesa fechada!' });
    },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useRequestBill() {
  const qc = useQueryClient();
  const updateTable = useUpdateTable();
  return useMutation({
    mutationFn: async ({ sessionId, tableId }: { sessionId: string; tableId: string }) => {
      const { error } = await (supabase as any).from('table_sessions').update({ status: 'conta_pedida' }).eq('id', sessionId);
      if (error) throw error;
      await updateTable.mutateAsync({ id: tableId, status: 'conta_pedida' });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); qc.invalidateQueries({ queryKey: ['table_sessions'] }); toast({ title: 'Conta pedida!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useTransferTable() {
  const qc = useQueryClient();
  const updateTable = useUpdateTable();
  return useMutation({
    mutationFn: async ({ sessionId, fromTableId, toTableId }: { sessionId: string; fromTableId: string; toTableId: string }) => {
      const { error } = await (supabase as any).from('table_sessions').update({ table_id: toTableId }).eq('id', sessionId);
      if (error) throw error;
      await updateTable.mutateAsync({ id: fromTableId, status: 'livre', current_session_id: null });
      await updateTable.mutateAsync({ id: toTableId, status: 'ocupada', current_session_id: sessionId });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); qc.invalidateQueries({ queryKey: ['table_sessions'] }); toast({ title: 'Mesa transferida!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

// Orders
export function useTableOrders(sessionId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['table_orders', sessionId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('table_orders').select('*, menu_items(name, category)').eq('table_session_id', sessionId!).order('created_at', { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user && !!sessionId,
  });
}

export function useAddTableOrder() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { table_session_id: string; menu_item_id: string; quantity: number; unit_price: number; notes?: string }) => {
      const { data, error } = await (supabase as any).from('table_orders').insert({
        ...input,
        subtotal: input.quantity * input.unit_price,
        user_id: user!.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['table_orders'] }); toast({ title: 'Item adicionado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useUpdateTableOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; status?: OrderStatus; notes?: string }) => {
      const { error } = await (supabase as any).from('table_orders').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['table_orders'] }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useCancelTableOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await (supabase as any).from('table_orders').update({ status: 'cancelado', notes: reason }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['table_orders'] }); toast({ title: 'Item cancelado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}
