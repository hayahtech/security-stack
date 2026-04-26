import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type ProductUnit = 'kg' | 'l' | 'un' | 'cx' | 'g';
type ProductCategory = 'ingrediente' | 'embalagem' | 'limpeza' | 'outros';
type MovementType = 'entrada' | 'saida' | 'ajuste';

export function useProducts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*, suppliers(name)').order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateProduct() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; unit: ProductUnit; quantity_min?: number; quantity_max?: number; cost_price?: number; category: ProductCategory; supplier_id?: string; notes?: string }) => {
      const { data, error } = await supabase.from('products').insert({ ...input, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast({ title: 'Produto cadastrado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useStockMovements(productId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stock_movements', productId],
    queryFn: async () => {
      let query = supabase.from('stock_movements').select('*, products(name)').order('date', { ascending: false });
      if (productId) query = query.eq('product_id', productId);
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateStockMovement() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { product_id: string; type: MovementType; quantity: number; cost_price?: number; reason?: string; notes?: string }) => {
      const { data, error } = await supabase.from('stock_movements').insert({ ...input, user_id: user!.id }).select().single();
      if (error) throw error;

      const { data: product } = await supabase.from('products').select('quantity_current, cost_price').eq('id', input.product_id).single();
      if (product) {
        let newQty = Number(product.quantity_current);
        if (input.type === 'entrada') newQty += input.quantity;
        else if (input.type === 'saida') newQty -= input.quantity;
        else newQty = input.quantity;

        const updates: { quantity_current: number; cost_price?: number } = { quantity_current: Math.max(0, newQty) };
        if (input.type === 'entrada' && input.cost_price) {
          updates.cost_price = input.cost_price;
        }
        await supabase.from('products').update(updates).eq('id', input.product_id);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['stock_movements'] });
      toast({ title: 'Movimentação registrada!' });
    },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}
