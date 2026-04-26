import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';

export type RecurrenceType = 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';

export interface Bill {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'pending';
  type: 'pagar' | 'receber';
  category_id: string | null;
  recurrent: boolean;
  recurrence_type_text: RecurrenceType | null;
  recurrence_day: number | null;
  recurrence_end_date: string | null;
  parent_bill_id: string | null;
  recurrence_count: number;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  categories?: { id: string; name: string } | null;
}

function calculateNextDueDate(currentDue: string, recurrenceType: RecurrenceType): string {
  const date = new Date(currentDue);
  switch (recurrenceType) {
    case 'semanal': return format(addWeeks(date, 1), 'yyyy-MM-dd');
    case 'quinzenal': return format(addDays(date, 15), 'yyyy-MM-dd');
    case 'mensal': return format(addMonths(date, 1), 'yyyy-MM-dd');
    case 'bimestral': return format(addMonths(date, 2), 'yyyy-MM-dd');
    case 'trimestral': return format(addMonths(date, 3), 'yyyy-MM-dd');
    case 'semestral': return format(addMonths(date, 6), 'yyyy-MM-dd');
    case 'anual': return format(addYears(date, 1), 'yyyy-MM-dd');
    default: return format(addMonths(date, 1), 'yyyy-MM-dd');
  }
}

export function useBills(filter?: 'all' | 'overdue' | 'today' | 'week' | 'month') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bills', user?.id, filter],
    queryFn: async () => {
      let query = supabase
        .from('bills')
        .select('*, categories(id, name)')
        .order('due_date', { ascending: true });

      if (filter === 'overdue') {
        query = query.eq('status', 'pending').lt('due_date', new Date().toISOString().split('T')[0]);
      } else if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.eq('due_date', today);
      } else if (filter === 'week') {
        const today = new Date();
        const weekEnd = format(addDays(today, 7), 'yyyy-MM-dd');
        query = query.gte('due_date', format(today, 'yyyy-MM-dd')).lte('due_date', weekEnd);
      } else if (filter === 'month') {
        const today = new Date();
        const monthEnd = format(addMonths(today, 1), 'yyyy-MM-dd');
        query = query.gte('due_date', format(today, 'yyyy-MM-dd')).lte('due_date', monthEnd);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Bill[];
    },
    enabled: !!user,
  });
}

export function useRecurringBills() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bills', 'recurring', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bills')
        .select('*, categories(id, name)')
        .eq('recurrent', true)
        .is('parent_bill_id', null)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as unknown as Bill[];
    },
    enabled: !!user,
  });
}

export function useCreateBill() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bill: {
      description: string;
      amount: number;
      due_date: string;
      type: 'pagar' | 'receber';
      category_id?: string;
      recurrent?: boolean;
      recurrence_type_text?: RecurrenceType;
      recurrence_day?: number;
      recurrence_end_date?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('bills')
        .insert({
          user_id: user!.id,
          description: bill.description,
          amount: bill.amount,
          due_date: bill.due_date,
          type: bill.type as any,
          category_id: bill.category_id || null,
          recurrent: bill.recurrent || false,
          recurrence_type_text: bill.recurrence_type_text || null,
          recurrence_day: bill.recurrence_day || null,
          recurrence_end_date: bill.recurrence_end_date || null,
          notes: bill.notes || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      toast({ title: 'Conta criada com sucesso!' });
    },
    onError: () => toast({ title: 'Erro ao criar conta', variant: 'destructive' }),
  });
}

export function usePayBill() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paid_at }: { id: string; paid_at: string }) => {
      // Get the bill first
      const { data: bill, error: fetchError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      // Mark as paid
      const { error: updateError } = await supabase
        .from('bills')
        .update({ status: 'paid', paid_at } as any)
        .eq('id', id);
      if (updateError) throw updateError;

      // If recurring, generate next bill
      const b = bill as any;
      if (b.recurrent && b.recurrence_type_text) {
        const nextDue = calculateNextDueDate(b.due_date, b.recurrence_type_text);
        const endDate = b.recurrence_end_date;
        
        if (!endDate || nextDue <= endDate) {
          // Check no duplicate
          const parentId = b.parent_bill_id || b.id;
          const { data: existing } = await (supabase
            .from('bills')
            .select('id') as any)
            .eq('parent_bill_id', parentId)
            .eq('due_date', nextDue)
            .maybeSingle();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('bills')
              .insert({
                user_id: user!.id,
                description: b.description,
                amount: b.amount,
                due_date: nextDue,
                type: b.type,
                category_id: b.category_id,
                recurrent: true,
                recurrence_type_text: b.recurrence_type_text,
                recurrence_day: b.recurrence_day,
                recurrence_end_date: b.recurrence_end_date,
                parent_bill_id: parentId,
                recurrence_count: (b.recurrence_count || 0) + 1,
                notes: b.notes,
              } as any);
            if (insertError) throw insertError;

            return { nextDue };
          }
        }
      }
      return { nextDue: null };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      if (result.nextDue) {
        const d = new Date(result.nextDue);
        toast({ title: `Conta paga! Próximo vencimento gerado para ${d.toLocaleDateString('pt-BR')}` });
      } else {
        toast({ title: 'Conta marcada como paga!' });
      }
    },
    onError: () => toast({ title: 'Erro ao pagar conta', variant: 'destructive' }),
  });
}

export function useDeleteBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      toast({ title: 'Conta removida' });
    },
  });
}

export function useUpdateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; recurrent?: boolean; recurrence_end_date?: string }) => {
      const { id, ...updates } = params;
      const { error } = await supabase.from('bills').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      toast({ title: 'Conta atualizada' });
    },
  });
}

export function recurrenceLabel(type: RecurrenceType | null): string {
  const map: Record<string, string> = {
    semanal: 'Semanal',
    quinzenal: 'Quinzenal',
    mensal: 'Mensal',
    bimestral: 'Bimestral',
    trimestral: 'Trimestral',
    semestral: 'Semestral',
    anual: 'Anual',
  };
  return type ? map[type] || type : '';
}
