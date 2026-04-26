import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function useLoans() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['loans', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useLoanInstallments(loanId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['loan_installments', loanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_installments')
        .select('*')
        .eq('loan_id', loanId!)
        .order('installment_number');
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!loanId,
  });
}

export function useCreateLoan() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      creditor?: string;
      total_amount: number;
      installments_total: number;
      interest_rate: number;
      start_date: string;
      due_day: number;
      scope?: 'business' | 'personal';
      notes?: string;
    }) => {
      const monthlyRate = input.interest_rate / 100;
      const installmentAmount = monthlyRate > 0
        ? input.total_amount * (monthlyRate * Math.pow(1 + monthlyRate, input.installments_total)) / (Math.pow(1 + monthlyRate, input.installments_total) - 1)
        : input.total_amount / input.installments_total;

      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .insert({
          user_id: user!.id,
          name: input.name,
          creditor: input.creditor,
          total_amount: input.total_amount,
          remaining_amount: input.total_amount,
          installments_total: input.installments_total,
          installment_amount: Math.round(installmentAmount * 100) / 100,
          interest_rate: input.interest_rate,
          start_date: input.start_date,
          due_day: input.due_day,
          scope: input.scope || 'business',
          notes: input.notes,
        })
        .select()
        .single();
      if (loanError) throw loanError;

      const installments = [];
      const startDate = new Date(input.start_date);
      for (let i = 0; i < input.installments_total; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        dueDate.setDate(input.due_day);
        installments.push({
          loan_id: loan.id,
          user_id: user!.id,
          installment_number: i + 1,
          amount: Math.round(installmentAmount * 100) / 100,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pendente' as const,
        });
      }

      const { error: instError } = await supabase.from('loan_installments').insert(installments);
      if (instError) throw instError;

      return loan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Empréstimo cadastrado!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });
}

export function usePayInstallment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, loanId }: { id: string; loanId: string }) => {
      const { error } = await supabase
        .from('loan_installments')
        .update({ status: 'pago' as const, paid_at: new Date().toISOString().split('T')[0] })
        .eq('id', id);
      if (error) throw error;

      const { data: installments } = await supabase
        .from('loan_installments')
        .select('status, amount')
        .eq('loan_id', loanId);

      const paidCount = installments?.filter(i => i.status === 'pago').length || 0;
      const remainingAmount = installments?.filter(i => i.status !== 'pago').reduce((s, i) => s + Number(i.amount), 0) || 0;

      await supabase.from('loans').update({
        installments_paid: paidCount,
        remaining_amount: remainingAmount,
        status: (paidCount >= (installments?.length || 0) ? 'quitado' : 'ativo') as 'quitado' | 'ativo',
      }).eq('id', loanId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      qc.invalidateQueries({ queryKey: ['loan_installments'] });
      toast({ title: 'Parcela paga!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });
}
