import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface LoyaltyProgram {
  id: string;
  user_id: string;
  name: string;
  type: string;
  rule_type: string;
  points_per_unit: number;
  reward_type: string;
  reward_value: number;
  points_required: number;
  scope: string;
  active: boolean;
  expiration_days: number | null;
  created_at: string;
}

export interface LoyaltyPoint {
  id: string;
  customer_id: string;
  family_group_id: string | null;
  sale_id: string | null;
  program_id: string;
  type: string;
  points: number;
  balance_after: number;
  description: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  user_id: string;
  code: string;
  type: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  customer_id: string | null;
  family_group_id: string | null;
  program_id: string | null;
  used_at: string | null;
  used_in_sale_id: string | null;
  valid_from: string;
  valid_until: string;
  active: boolean;
  created_at: string;
}

export interface FamilyGroup {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_group_id: string;
  customer_id: string;
  role: string;
  joined_at: string;
}

// Family Groups
export function useFamilyGroups() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['family_groups', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('family_groups').select('*').order('name');
      if (error) throw error;
      return data as FamilyGroup[];
    },
    enabled: !!user,
  });
}

export function useFamilyMembers(groupId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['family_members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase.from('family_members').select('*, customers(name, phone)').eq('family_group_id', groupId!);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!groupId,
  });
}

export function useCreateFamilyGroup() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; titularCustomerId: string }) => {
      const { data: group, error } = await supabase.from('family_groups').insert({ user_id: user!.id, name: input.name }).select().single();
      if (error) throw error;
      // Add titular member
      await supabase.from('family_members').insert({ family_group_id: group.id, customer_id: input.titularCustomerId, role: 'titular' });
      // Link customer
      await supabase.from('customers').update({ family_group_id: group.id }).eq('id', input.titularCustomerId);
      return group;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['family_groups'] }); qc.invalidateQueries({ queryKey: ['customers'] }); toast({ title: 'Grupo familiar criado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useAddFamilyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { family_group_id: string; customer_id: string }) => {
      const { error } = await supabase.from('family_members').insert({ ...input, role: 'dependente' });
      if (error) throw error;
      await supabase.from('customers').update({ family_group_id: input.family_group_id }).eq('id', input.customer_id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['family_members'] }); qc.invalidateQueries({ queryKey: ['customers'] }); toast({ title: 'Membro adicionado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

// Loyalty Programs
export function useLoyaltyPrograms() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['loyalty_programs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_programs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as LoyaltyProgram[];
    },
    enabled: !!user,
  });
}

export function useCreateLoyaltyProgram() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<LoyaltyProgram, 'id' | 'user_id' | 'created_at'>) => {
      const { error } = await supabase.from('loyalty_programs').insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty_programs'] }); toast({ title: 'Programa criado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useToggleLoyaltyProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('loyalty_programs').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty_programs'] }); },
  });
}

export function useDeleteLoyaltyProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loyalty_programs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loyalty_programs'] }); toast({ title: 'Programa removido!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

// Loyalty Points
export function useCustomerPoints(customerId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['loyalty_points', customerId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_points').select('*').eq('customer_id', customerId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data as LoyaltyPoint[];
    },
    enabled: !!user && !!customerId,
  });
}

export function useCustomerBalance(customerId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['loyalty_balance', customerId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_points').select('points, type').eq('customer_id', customerId!);
      if (error) throw error;
      return (data || []).reduce((sum, p) => sum + (p.type === 'credito' ? p.points : -p.points), 0);
    },
    enabled: !!user && !!customerId,
  });
}

export function useFamilyBalance(groupId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['family_balance', groupId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loyalty_points').select('points, type').eq('family_group_id', groupId!);
      if (error) throw error;
      return (data || []).reduce((sum, p) => sum + (p.type === 'credito' ? p.points : -p.points), 0);
    },
    enabled: !!user && !!groupId,
  });
}

export async function creditPoints(params: {
  customerId: string;
  familyGroupId?: string | null;
  saleId: string;
  programId: string;
  points: number;
  description: string;
  expirationDays?: number | null;
}) {
  // Get current balance
  const { data: existing } = await supabase.from('loyalty_points').select('points, type').eq('customer_id', params.customerId);
  const currentBalance = (existing || []).reduce((s, p) => s + (p.type === 'credito' ? p.points : -p.points), 0);
  const newBalance = currentBalance + params.points;
  
  const expiresAt = params.expirationDays 
    ? new Date(Date.now() + params.expirationDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error } = await supabase.from('loyalty_points').insert({
    customer_id: params.customerId,
    family_group_id: params.familyGroupId || null,
    sale_id: params.saleId,
    program_id: params.programId,
    type: 'credito',
    points: params.points,
    balance_after: newBalance,
    description: params.description,
    expires_at: expiresAt,
  });
  if (error) throw error;
  return newBalance;
}

// Coupons
export function useCoupons(filters?: { type?: string; customerId?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['coupons', user?.id, filters],
    queryFn: async () => {
      let query = supabase.from('coupons').select('*, customers(name)').order('created_at', { ascending: false });
      if (filters?.type && filters.type !== 'all') query = query.eq('type', filters.type);
      if (filters?.customerId) query = query.eq('customer_id', filters.customerId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).eq('active', true).is('used_at', null).single();
      if (error) throw new Error('Cupom inválido ou já utilizado');
      const today = new Date().toISOString().split('T')[0];
      if (data.valid_from > today || data.valid_until < today) throw new Error('Cupom fora do período de validade');
      return data as Coupon;
    },
  });
}

export function useCreateCoupon() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Coupon> & { code: string; discount_type: string; discount_value: number }) => {
      const { error } = await supabase.from('coupons').insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); toast({ title: 'Cupom criado!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useUseCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ couponId, saleId }: { couponId: string; saleId: string }) => {
      const { error } = await supabase.from('coupons').update({ used_at: new Date().toISOString(), used_in_sale_id: saleId, active: false }).eq('id', couponId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coupons'] }); },
  });
}

export function useCustomerCoupons(customerId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customer_coupons', customerId],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').or(`customer_id.eq.${customerId}`).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
    enabled: !!user && !!customerId,
  });
}

// Generate coupon code
export function generateCouponCode(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${year}${rand}`.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
