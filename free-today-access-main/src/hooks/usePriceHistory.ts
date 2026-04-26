import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PriceRecord {
  id: string;
  user_id: string;
  product_id: string;
  price: number;
  supplier_id: string | null;
  recorded_at: string;
  source: string;
  notes: string | null;
}

export function usePriceHistory(productId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['price-history', user?.id, productId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('product_price_history')
        .select('*, suppliers(name)')
        .order('recorded_at', { ascending: false });

      if (productId) query = query.eq('product_id', productId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as (PriceRecord & { suppliers?: { name: string } })[];
    },
    enabled: !!user,
  });
}

export function useAllPriceHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['price-history-all', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('product_price_history')
        .select('*, suppliers(name), products(name, cost_price, unit)')
        .order('recorded_at', { ascending: false });
      if (error) throw error;
      return (data || []) as (PriceRecord & { suppliers?: { name: string }; products?: { name: string; cost_price: number; unit: string } })[];
    },
    enabled: !!user,
  });
}
