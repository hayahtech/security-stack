import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type DeliveryStatus = 'recebido' | 'em_preparo' | 'saiu_entrega' | 'entregue' | 'cancelado';

export function useDeliveryOrders(channelFilter?: string) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['delivery_orders', user?.id, today, channelFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from('sales')
        .select('*, sale_items(*, menu_items(name)), customers(name, phone, address_street, address_number, address_neighborhood, address_city), employees!sales_delivery_employee_id_fkey(name)')
        .in('channel', ['delivery', 'ifood', 'rappi', 'whatsapp'])
        .gte('date', today)
        .neq('status', 'cancelado')
        .order('created_at', { ascending: true });

      if (channelFilter && channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
    refetchInterval: 15000, // auto-refresh every 15s
  });
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, delivery_status, delivery_employee_id }: { id: string; delivery_status: DeliveryStatus; delivery_employee_id?: string }) => {
      const updates: any = { delivery_status };
      if (delivery_status === 'em_preparo') updates.delivery_started_at = new Date().toISOString();
      if (delivery_status === 'saiu_entrega') {
        updates.delivery_departed_at = new Date().toISOString();
        if (delivery_employee_id) updates.delivery_employee_id = delivery_employee_id;
      }
      if (delivery_status === 'entregue') updates.delivery_delivered_at = new Date().toISOString();

      const { error } = await (supabase as any).from('sales').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery_orders'] });
      qc.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useDeliveryEmployees() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['delivery_employees', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').eq('status', 'ativo').order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
