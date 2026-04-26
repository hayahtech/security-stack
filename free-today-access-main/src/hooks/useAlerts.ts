import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect, useRef } from 'react';
import { format, addDays, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string | null;
  severity: string;
  reference_id: string | null;
  read: boolean;
  archived: boolean;
  created_at: string;
}

export function useAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('archived', false)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Alert[];
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });
}

export function useUnreadCount() {
  const { data: alerts } = useAlerts();
  return (alerts || []).filter(a => !a.read).length;
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('alerts').update({ read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useMarkAllRead() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('alerts').update({ read: true }).eq('user_id', user!.id).eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

export function useArchiveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('alerts').update({ archived: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

// Generate alerts from current data - runs once on load
export function useGenerateAlerts() {
  const { user } = useAuth();
  const hasRun = useRef(false);

  const generate = useCallback(async () => {
    if (!user || hasRun.current) return;
    hasRun.current = true;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const alerts: { type: string; title: string; message: string; severity: string; reference_id?: string }[] = [];

    try {
      const [productsRes, billsRes, customersRes, loansRes, loyaltyRes, tempRes] = await Promise.all([
        supabase.from('products').select('id, name, quantity_current, quantity_min'),
        supabase.from('bills').select('id, description, due_date, status, amount'),
        supabase.from('customers').select('id, name, birth_date'),
        supabase.from('loan_installments').select('id, loan_id, due_date, amount, status').eq('status', 'pendente'),
        supabase.from('loyalty_points').select('customer_id, balance_after, program_id').order('created_at', { ascending: false }),
        supabase.from('temperature_logs').select('id, equipment, temperature, status, recorded_at').eq('status', 'critico').gte('recorded_at', format(subDays(today, 1), 'yyyy-MM-dd')),
      ]);

      // 🔴 Critical stock
      (productsRes.data || []).forEach(p => {
        if (p.quantity_current < p.quantity_min) {
          alerts.push({
            type: 'stock_critical',
            title: `Estoque crítico: ${p.name}`,
            message: `Atual: ${p.quantity_current}, Mínimo: ${p.quantity_min}`,
            severity: 'critical',
            reference_id: p.id,
          });
        }
      });

      // 🟡 Bills due in 3 days
      const threeDaysLater = format(addDays(today, 3), 'yyyy-MM-dd');
      (billsRes.data || []).filter(b => b.status === 'pending' && b.due_date <= threeDaysLater && b.due_date >= todayStr).forEach(b => {
        alerts.push({
          type: 'bill_due',
          title: `Conta vencendo: ${b.description}`,
          message: `Valor: R$ ${Number(b.amount).toFixed(2)} - Vence em ${b.due_date}`,
          severity: 'warning',
          reference_id: b.id,
        });
      });

      // 🎂 Customer birthday tomorrow
      const tomorrow = format(addDays(today, 1), 'MM-dd');
      (customersRes.data || []).forEach(c => {
        if (!c.birth_date) return;
        const bday = c.birth_date.slice(5); // MM-dd
        if (bday === tomorrow) {
          alerts.push({
            type: 'birthday',
            title: `🎂 Aniversário amanhã: ${c.name}`,
            message: 'Aproveite para enviar uma mensagem ou oferta especial!',
            severity: 'info',
            reference_id: c.id,
          });
        }
      });

      // 💳 Loan installment due this week
      const weekLater = format(addDays(today, 7), 'yyyy-MM-dd');
      (loansRes.data || []).filter(i => i.due_date >= todayStr && i.due_date <= weekLater).forEach(i => {
        alerts.push({
          type: 'loan_due',
          title: `Parcela vencendo: R$ ${Number(i.amount).toFixed(2)}`,
          message: `Vencimento em ${i.due_date}`,
          severity: 'warning',
          reference_id: i.loan_id,
        });
      });

      // ❄️ Critical temperature
      (tempRes.data || []).forEach(t => {
        alerts.push({
          type: 'temperature',
          title: `Temperatura crítica: ${t.equipment}`,
          message: `${t.temperature}°C registrado`,
          severity: 'critical',
          reference_id: t.id,
        });
      });

      if (alerts.length === 0) return;

      // Check existing alerts today to avoid duplicates
      const { data: existingAlerts } = await supabase
        .from('alerts')
        .select('type, reference_id')
        .eq('user_id', user.id)
        .gte('created_at', todayStr);

      const existingSet = new Set((existingAlerts || []).map(a => `${a.type}:${a.reference_id}`));
      const newAlerts = alerts
        .filter(a => !existingSet.has(`${a.type}:${a.reference_id || ''}`))
        .map(a => ({ ...a, user_id: user.id }));

      if (newAlerts.length > 0) {
        await supabase.from('alerts').insert(newAlerts);
      }
    } catch (err) {
      console.error('Error generating alerts:', err);
    }
  }, [user]);

  useEffect(() => {
    generate();
  }, [generate]);
}
