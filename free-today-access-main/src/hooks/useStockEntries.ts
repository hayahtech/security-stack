import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface StockEntryItem {
  id?: string;
  entry_id?: string;
  product_id: string | null;
  nfe_product_code?: string;
  nfe_product_name?: string;
  ncm?: string;
  cfop?: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount: number;
  taxes?: Record<string, any>;
  matched_product_id?: string | null;
  included: boolean;
}

export interface StockEntry {
  id?: string;
  user_id?: string;
  supplier_id: string | null;
  entry_type: 'manual' | 'xml_nfe' | 'compra_avulsa';
  nfe_number?: string;
  nfe_key?: string;
  nfe_date?: string;
  total_value: number;
  xml_raw?: string;
  status: 'rascunho' | 'confirmado' | 'cancelado';
  notes?: string;
  items: StockEntryItem[];
}

export function useStockEntries(filters?: { status?: string; supplier_id?: string; entry_type?: string; startDate?: string; endDate?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stock-entries', user?.id, filters],
    queryFn: async () => {
      let q = supabase
        .from('stock_entries')
        .select('*, suppliers(name), stock_entry_items(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.supplier_id) q = q.eq('supplier_id', filters.supplier_id);
      if (filters?.entry_type) q = q.eq('entry_type', filters.entry_type);
      if (filters?.startDate) q = q.gte('created_at', filters.startDate);
      if (filters?.endDate) q = q.lte('created_at', filters.endDate);

      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useStockEntryDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['stock-entry', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_entries')
        .select('*, suppliers(name, id), stock_entry_items(*, products:matched_product_id(name, unit))')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateStockEntry() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (entry: StockEntry) => {
      // Check duplicate NF-e key
      if (entry.nfe_key) {
        const { data: existing } = await supabase
          .from('stock_entries')
          .select('id')
          .eq('nfe_key', entry.nfe_key)
          .eq('user_id', user!.id)
          .neq('status', 'cancelado')
          .limit(1);
        if (existing && existing.length > 0) {
          throw new Error('Esta NF-e já foi importada anteriormente.');
        }
      }

      const { items, ...header } = entry;
      const { data: created, error } = await supabase
        .from('stock_entries')
        .insert({ ...header, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // Insert items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          entry_id: created.id,
          product_id: item.product_id,
          nfe_product_code: item.nfe_product_code || null,
          nfe_product_name: item.nfe_product_name || null,
          ncm: item.ncm || null,
          cfop: item.cfop || null,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          discount: item.discount || 0,
          taxes: item.taxes || {},
          matched_product_id: item.matched_product_id || null,
          included: item.included,
        }));
        const { error: itemsError } = await supabase.from('stock_entry_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      // If confirmed, update stock
      if (entry.status === 'confirmado') {
        await applyStockUpdate(created.id, user!.id);
      }

      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-entries'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
}

export function useConfirmStockEntry() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('stock_entries')
        .update({ status: 'confirmado', updated_at: new Date().toISOString() })
        .eq('id', entryId);
      if (error) throw error;

      await applyStockUpdate(entryId, user!.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-entries'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Entrada confirmada e estoque atualizado!');
    },
  });
}

export function useCancelStockEntry() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, reason }: { entryId: string; reason: string }) => {
      // Get items to reverse
      const { data: items } = await supabase
        .from('stock_entry_items')
        .select('matched_product_id, product_id, quantity')
        .eq('entry_id', entryId)
        .eq('included', true);

      // Check if reversal would cause negative stock
      for (const item of (items || [])) {
        const productId = item.matched_product_id || item.product_id;
        if (!productId) continue;
        const { data: product } = await supabase.from('products').select('quantity_current, name').eq('id', productId).single();
        if (product && Number(product.quantity_current) < Number(item.quantity)) {
          throw new Error(`Não é possível cancelar: ${product.name} ficaria com estoque negativo.`);
        }
      }

      // Reverse stock
      for (const item of (items || [])) {
        const productId = item.matched_product_id || item.product_id;
        if (!productId) continue;

        const { data: product } = await supabase.from('products').select('quantity_current').eq('id', productId).single();
        if (product) {
          await supabase.from('products').update({
            quantity_current: Number(product.quantity_current) - Number(item.quantity),
            updated_at: new Date().toISOString(),
          }).eq('id', productId);
        }

        await supabase.from('stock_movements').insert({
          product_id: productId,
          user_id: user!.id,
          type: 'saida',
          quantity: Number(item.quantity),
          reason: `Cancelamento de entrada: ${reason}`,
          date: new Date().toISOString().split('T')[0],
        });
      }

      const { error } = await supabase
        .from('stock_entries')
        .update({ status: 'cancelado', notes: reason, updated_at: new Date().toISOString() })
        .eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-entries'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Entrada cancelada e estoque estornado.');
    },
  });
}

async function applyStockUpdate(entryId: string, userId: string) {
  const { data: items } = await supabase
    .from('stock_entry_items')
    .select('*')
    .eq('entry_id', entryId)
    .eq('included', true);

  let updatedCount = 0;
  for (const item of (items || [])) {
    const productId = item.matched_product_id || item.product_id;
    if (!productId) continue;

    const { data: product } = await supabase.from('products').select('quantity_current, cost_price').eq('id', productId).single();
    if (product) {
      await supabase.from('products').update({
        quantity_current: Number(product.quantity_current) + Number(item.quantity),
        cost_price: Number(item.unit_price) > 0 ? Number(item.unit_price) : Number(product.cost_price),
        updated_at: new Date().toISOString(),
      }).eq('id', productId);

      await supabase.from('stock_movements').insert({
        product_id: productId,
        user_id: userId,
        type: 'entrada',
        quantity: Number(item.quantity),
        cost_price: Number(item.unit_price),
        reason: 'Entrada de estoque',
        reference_id: entryId,
        date: new Date().toISOString().split('T')[0],
      });

      updatedCount++;
    }
  }
  return updatedCount;
}
