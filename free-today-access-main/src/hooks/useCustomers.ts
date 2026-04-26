import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_zipcode: string | null;
  birth_date: string;
  notes: string | null;
  family_group_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  zipcode: string | null;
  is_default: boolean;
}

export function useCustomers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customers', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').order('name');
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!user,
  });
}

export function useCustomer(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as Customer;
    },
    enabled: !!user && !!id,
  });
}

export function useCustomerAddresses(customerId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customer_addresses', customerId],
    queryFn: async () => {
      const { data, error } = await supabase.from('customer_addresses').select('*').eq('customer_id', customerId!);
      if (error) throw error;
      return data as CustomerAddress[];
    },
    enabled: !!user && !!customerId,
  });
}

export function useCustomerSales(customerId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customer_sales', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(*, menu_items(name, category))')
        .eq('customer_id', customerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!customerId,
  });
}

export function useCreateCustomer() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('customers').insert({ ...input, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast({ title: 'Cliente cadastrado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Customer> & { id: string }) => {
      const { error } = await supabase.from('customers').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); qc.invalidateQueries({ queryKey: ['customer'] }); toast({ title: 'Cliente atualizado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); toast({ title: 'Cliente removido!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CustomerAddress, 'id'>) => {
      const { data, error } = await supabase.from('customer_addresses').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer_addresses'] }); toast({ title: 'Endereço salvo!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customer_addresses'] }); toast({ title: 'Endereço removido!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

// Customers with sales stats for ranking
export function useCustomersWithStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customers_with_stats', user?.id],
    queryFn: async () => {
      const { data: customers, error: cErr } = await supabase.from('customers').select('*').order('name');
      if (cErr) throw cErr;
      const { data: sales, error: sErr } = await supabase.from('sales').select('id, customer_id, total_amount, created_at, status').neq('status', 'cancelado');
      if (sErr) throw sErr;

      return (customers as Customer[]).map(c => {
        const cSales = (sales || []).filter(s => s.customer_id === c.id);
        const totalSpent = cSales.reduce((s, sale) => s + Number(sale.total_amount), 0);
        const lastSale = cSales.length > 0 ? cSales.sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at : null;
        return { ...c, totalOrders: cSales.length, totalSpent, lastSale };
      });
    },
    enabled: !!user,
  });
}

export function getCustomerLevel(orders: number) {
  if (orders >= 21) return { label: 'Top', emoji: '👑' };
  if (orders >= 11) return { label: 'VIP', emoji: '🥇' };
  if (orders >= 4) return { label: 'Frequente', emoji: '🥈' };
  return { label: 'Novo', emoji: '🥉' };
}
