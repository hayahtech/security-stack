import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { differenceInMonths } from 'date-fns';

export interface Equipment {
  id: string;
  user_id: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  acquisition_date: string;
  acquisition_value: number;
  useful_life_months: number;
  residual_value: number;
  current_value: number | null;
  depreciation_method: string;
  status: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Maintenance {
  id: string;
  user_id: string;
  equipment_id: string;
  type: string;
  description: string;
  cost: number;
  performed_at: string;
  next_maintenance_date: string | null;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
}

export function calcDepreciation(eq: Equipment) {
  const acqValue = Number(eq.acquisition_value);
  const residual = Number(eq.residual_value) || 0;
  const lifeMonths = eq.useful_life_months || 60;
  const depreciableValue = acqValue - residual;
  const monthlyDeprec = depreciableValue / lifeMonths;
  const monthsElapsed = differenceInMonths(new Date(), new Date(eq.acquisition_date));
  const accumulated = Math.min(depreciableValue, Math.max(0, monthlyDeprec * monthsElapsed));
  const currentValue = Math.max(residual, acqValue - accumulated);
  const remainingMonths = Math.max(0, lifeMonths - monthsElapsed);
  const lifePercent = Math.min(100, (monthsElapsed / lifeMonths) * 100);
  return { monthlyDeprec, accumulated, currentValue, remainingMonths, lifePercent, monthsElapsed };
}

export function useEquipment() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['equipment', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('equipment').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Equipment[];
    },
    enabled: !!user,
  });
}

export function useEquipmentById(id?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('equipment').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as Equipment;
    },
    enabled: !!user && !!id,
  });
}

export function useMaintenances(equipmentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['maintenances', equipmentId],
    queryFn: async () => {
      let q = (supabase as any).from('equipment_maintenances').select('*').order('performed_at', { ascending: false });
      if (equipmentId) q = q.eq('equipment_id', equipmentId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Maintenance[];
    },
    enabled: !!user,
  });
}

export function useCreateEquipment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Equipment>) => {
      const { error } = await (supabase as any).from('equipment').insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); toast({ title: 'Equipamento cadastrado!' }); },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<Equipment> & { id: string }) => {
      const { error } = await (supabase as any).from('equipment').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); toast({ title: 'Equipamento atualizado!' }); },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('equipment').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['equipment'] }); toast({ title: 'Equipamento removido' }); },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useCreateMaintenance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Maintenance>) => {
      const { error } = await (supabase as any).from('equipment_maintenances').insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenances'] }); toast({ title: 'Manutenção registrada!' }); },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}
