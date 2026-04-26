import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type Equipment = 'camara_fria' | 'freezer' | 'geladeira' | 'balcao_frio';
export type TempStatus = 'ok' | 'alerta' | 'critico';

export const equipmentLabels: Record<string, string> = {
  camara_fria: 'Câmara Fria',
  freezer: 'Freezer',
  geladeira: 'Geladeira',
  balcao_frio: 'Balcão Frio',
};

export const equipmentRanges: Record<string, { min: number; max: number; alertMin: number; alertMax: number }> = {
  camara_fria: { min: -18, max: -12, alertMin: -20, alertMax: -10 },
  freezer: { min: -25, max: -15, alertMin: -28, alertMax: -12 },
  geladeira: { min: 1, max: 5, alertMin: -1, alertMax: 7 },
  balcao_frio: { min: 1, max: 10, alertMin: -1, alertMax: 12 },
};

export function getTempStatus(equipment: string, temp: number): TempStatus {
  const range = equipmentRanges[equipment];
  if (!range) return 'ok';
  if (temp >= range.min && temp <= range.max) return 'ok';
  if (temp >= range.alertMin && temp <= range.alertMax) return 'alerta';
  return 'critico';
}

export function useTemperatureLogs(dateFrom?: string, dateTo?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['temperature_logs', user?.id, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase.from('temperature_logs').select('*, employees(name)').order('recorded_at', { ascending: false });
      if (dateFrom) query = query.gte('recorded_at', dateFrom);
      if (dateTo) query = query.lte('recorded_at', dateTo + 'T23:59:59');
      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateTemperatureLog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { equipment: Equipment; temperature: number; recorded_by?: string; notes?: string }) => {
      const status = getTempStatus(input.equipment, input.temperature);
      const { data, error } = await supabase.from('temperature_logs').insert({ user_id: user!.id, ...input, status }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['temperature_logs'] });
      if (data.status === 'critico') toast({ title: '🚨 Temperatura CRÍTICA!', description: `${equipmentLabels[data.equipment]}: ${data.temperature}°C`, variant: 'destructive' });
      else if (data.status === 'alerta') toast({ title: '⚠️ Temperatura em alerta', description: `${equipmentLabels[data.equipment]}: ${data.temperature}°C` });
      else toast({ title: 'Temperatura registrada!' });
    },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}

export function useCleaningLogs(dateFrom?: string, dateTo?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cleaning_logs', user?.id, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase.from('cleaning_logs').select('*, employees(name)').order('cleaned_at', { ascending: false });
      if (dateFrom) query = query.gte('cleaned_at', dateFrom);
      if (dateTo) query = query.lte('cleaned_at', dateTo + 'T23:59:59');
      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateCleaningLog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { area: string; employee_id?: string; checklist?: any[]; notes?: string }) => {
      const { data, error } = await supabase.from('cleaning_logs').insert({ user_id: user!.id, ...input }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cleaning_logs'] }); toast({ title: 'Limpeza registrada!' }); },
    onError: (err: any) => { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); },
  });
}
