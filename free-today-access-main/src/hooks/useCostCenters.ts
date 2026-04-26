import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const COST_CENTERS = [
  { value: 'salao', label: 'Salão' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'ifood', label: 'iFood' },
  { value: 'rappi', label: 'Rappi' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'geral', label: 'Geral' },
] as const;

export type CostCenterKey = typeof COST_CENTERS[number]['value'];

export interface CostCenterAllocation {
  id: string;
  user_id: string;
  category_id: string | null;
  description: string;
  salao: number;
  delivery: number;
  ifood: number;
  rappi: number;
  whatsapp: number;
  eventos: number;
  geral: number;
  created_at: string;
  updated_at: string;
}

export interface ChannelSummary {
  channel: CostCenterKey;
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

// Map sales channel to cost center
export function channelToCostCenter(channel: string): CostCenterKey {
  const map: Record<string, CostCenterKey> = {
    balcao: 'salao',
    delivery: 'delivery',
    ifood: 'ifood',
    rappi: 'rappi',
    whatsapp: 'whatsapp',
    evento: 'eventos',
  };
  return map[channel] || 'geral';
}

// Smart default based on category name
export function guessCostCenter(categoryName: string): CostCenterKey {
  const lower = categoryName.toLowerCase();
  if (lower.includes('ifood')) return 'ifood';
  if (lower.includes('rappi')) return 'rappi';
  if (lower.includes('whatsapp')) return 'whatsapp';
  if (lower.includes('delivery') || lower.includes('entrega') || lower.includes('combustível')) return 'delivery';
  if (lower.includes('salão') || lower.includes('balcão') || lower.includes('decoração')) return 'salao';
  if (lower.includes('evento') || lower.includes('encomend')) return 'eventos';
  return 'geral';
}

export function useCostCenterSummary(startDate: string, endDate: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cost-center-summary', user?.id, startDate, endDate],
    queryFn: async () => {
      // Fetch sales grouped by cost_center
      const { data: sales } = await (supabase as any)
        .from('sales')
        .select('cost_center, total_amount, discount_amount')
        .gte('date', startDate)
        .lte('date', endDate)
        .in('status', ['finalizado', 'entregue']);

      // Fetch expense bills grouped by cost_center
      const { data: bills } = await (supabase as any)
        .from('bills')
        .select('cost_center, amount, type, status')
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .eq('type', 'pagar');

      const channels: Record<CostCenterKey, { revenue: number; expenses: number }> = {
        salao: { revenue: 0, expenses: 0 },
        delivery: { revenue: 0, expenses: 0 },
        ifood: { revenue: 0, expenses: 0 },
        rappi: { revenue: 0, expenses: 0 },
        whatsapp: { revenue: 0, expenses: 0 },
        eventos: { revenue: 0, expenses: 0 },
        geral: { revenue: 0, expenses: 0 },
      };

      (sales || []).forEach((s: any) => {
        const cc = (s.cost_center || 'geral') as CostCenterKey;
        if (channels[cc]) {
          channels[cc].revenue += Number(s.total_amount) - Number(s.discount_amount || 0);
        }
      });

      (bills || []).forEach((b: any) => {
        const cc = (b.cost_center || 'geral') as CostCenterKey;
        if (channels[cc]) {
          channels[cc].expenses += Number(b.amount);
        }
      });

      const summaries: ChannelSummary[] = COST_CENTERS.map(c => {
        const d = channels[c.value];
        const profit = d.revenue - d.expenses;
        const margin = d.revenue > 0 ? (profit / d.revenue) * 100 : 0;
        return { channel: c.value, label: c.label, revenue: d.revenue, expenses: d.expenses, profit, margin };
      }).sort((a, b) => b.margin - a.margin);

      return summaries;
    },
    enabled: !!user,
  });
}

export function useCostCenterAllocations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cost-center-allocations', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('cost_center_allocations')
        .select('*')
        .order('description');
      if (error) throw error;
      return (data || []) as CostCenterAllocation[];
    },
    enabled: !!user,
  });
}

export function useSaveAllocation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alloc: Omit<CostCenterAllocation, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { id?: string }) => {
      if (alloc.id) {
        const { id, ...rest } = alloc;
        const { error } = await (supabase as any).from('cost_center_allocations').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('cost_center_allocations').insert({ ...alloc, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cost-center-allocations'] }),
  });
}

export function useDeleteAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('cost_center_allocations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cost-center-allocations'] }),
  });
}
