import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { deductStockForSale } from '@/hooks/useRecipes';

type SalesChannel = 'balcao' | 'delivery' | 'ifood' | 'rappi' | 'whatsapp';
type PaymentMethod = 'dinheiro' | 'pix' | 'cartao' | 'app';
type SaleStatus = 'aberto' | 'fechado' | 'cancelado';

interface SaleItemInput {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
}

export function useSales(dateFilter?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sales', user?.id, dateFilter],
    queryFn: async () => {
      let query = supabase.from('sales').select('*').order('created_at', { ascending: false });
      if (dateFilter) query = query.eq('date', dateFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useSaleItems(saleId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['sale_items', saleId],
    queryFn: async () => {
      const { data, error } = await supabase.from('sale_items').select('*, menu_items(name, category)').eq('sale_id', saleId!);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!saleId,
  });
}

export function useTodaySaleItems() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['today_sale_items', user?.id, today],
    queryFn: async () => {
      // Get today's sale IDs first
      const { data: sales } = await supabase.from('sales').select('id').eq('date', today).neq('status', 'cancelado');
      if (!sales || sales.length === 0) return [];
      const saleIds = sales.map(s => s.id);
      const { data, error } = await supabase.from('sale_items').select('*, menu_items(name, category)').in('sale_id', saleIds);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateSale() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      channel: SalesChannel;
      customer_name?: string;
      table_number?: string;
      payment_method: PaymentMethod;
      total_amount: number;
      customer_id?: string;
      items: SaleItemInput[];
    }) => {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user!.id,
          channel: input.channel,
          customer_name: input.customer_name,
          table_number: input.table_number,
          payment_method: input.payment_method,
          total_amount: input.total_amount,
          customer_id: input.customer_id,
          status: 'fechado' as const,
        })
        .select()
        .single();
      if (saleError) throw saleError;

      const saleItems = input.items.map(item => ({
        sale_id: sale.id,
        user_id: user!.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      // Auto deduct stock based on recipes
      try {
        await deductStockForSale(user!.id, input.items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })));
      } catch { /* non-blocking */ }

      // Also create a revenue transaction
      const { data: cats } = await supabase.from('categories').select('id').eq('user_id', user!.id).eq('name', channelToCategoryName(input.channel)).single();
      if (cats) {
        await supabase.from('transactions').insert({
          user_id: user!.id,
          category_id: cats.id,
          description: `Venda #${sale.id.slice(0, 8)} - ${channelLabel(input.channel)}${input.customer_name ? ` - ${input.customer_name}` : ''}`,
          amount: input.total_amount,
          type: 'revenue' as const,
          scope: 'business' as const,
          status: 'paid' as const,
          date: new Date().toISOString().split('T')[0],
          payment_method: input.payment_method,
        });
      }

      return sale;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['sale_items'] });
      qc.invalidateQueries({ queryKey: ['today_sale_items'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['stock_movements'] });
      toast({ title: 'Venda registrada!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao registrar venda', description: err.message, variant: 'destructive' });
    },
  });
}

export function useCancelSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales').update({ status: 'cancelado' as const }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['today_sale_items'] });
      toast({ title: 'Venda cancelada!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });
}

function channelToCategoryName(channel: SalesChannel): string {
  const map: Record<SalesChannel, string> = {
    balcao: 'Balcão',
    delivery: 'Delivery',
    ifood: 'iFood',
    rappi: 'Rappi',
    whatsapp: 'WhatsApp',
  };
  return map[channel];
}

export function channelLabel(channel: string): string {
  const map: Record<string, string> = {
    balcao: 'Balcão',
    delivery: 'Delivery',
    ifood: 'iFood',
    rappi: 'Rappi',
    whatsapp: 'WhatsApp',
  };
  return map[channel] || channel;
}

export function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    cartao: 'Cartão',
    app: 'App',
  };
  return map[method] || method;
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    aberto: 'Aberto',
    fechado: 'Fechado',
    cancelado: 'Cancelado',
  };
  return map[status] || status;
}
