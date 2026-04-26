import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, differenceInMinutes } from 'date-fns';

export interface TimeRecord {
  id: string;
  user_id: string;
  employee_id: string;
  type: string;
  recorded_at: string;
  location: string | null;
  notes: string | null;
  manual_adjustment: boolean;
  adjusted_by: string | null;
  created_at: string;
}

export interface WorkSchedule {
  id: string;
  user_id: string;
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_minutes: number;
  active: boolean;
}

const RECORD_ORDER = ['entrada', 'saida_almoco', 'retorno_almoco', 'saida'] as const;
const RECORD_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  saida_almoco: 'Saída Almoço',
  retorno_almoco: 'Retorno Almoço',
  saida: 'Saída',
};

export { RECORD_ORDER, RECORD_LABELS };

export function getNextRecordType(records: TimeRecord[]): string {
  if (records.length === 0) return 'entrada';
  const types = records.map(r => r.type);
  for (const t of RECORD_ORDER) {
    if (!types.includes(t)) return t;
  }
  return 'entrada'; // next day
}

export function calculateWorkedMinutes(records: TimeRecord[]): number {
  const sorted = [...records].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  const entrada = sorted.find(r => r.type === 'entrada');
  const saidaAlmoco = sorted.find(r => r.type === 'saida_almoco');
  const retornoAlmoco = sorted.find(r => r.type === 'retorno_almoco');
  const saida = sorted.find(r => r.type === 'saida');

  let total = 0;
  const end = saida ? parseISO(saida.recorded_at) : new Date();

  if (entrada) {
    const breakStart = saidaAlmoco ? parseISO(saidaAlmoco.recorded_at) : end;
    total += differenceInMinutes(breakStart, parseISO(entrada.recorded_at));

    if (saidaAlmoco && retornoAlmoco) {
      total += differenceInMinutes(end, parseISO(retornoAlmoco.recorded_at));
    }
  }

  return Math.max(0, total);
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

export function useTimeRecords(date: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['time-records', user?.id, date],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('time_records')
        .select('*')
        .gte('recorded_at', `${date}T00:00:00`)
        .lt('recorded_at', `${date}T23:59:59.999`)
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      return (data || []) as TimeRecord[];
    },
    enabled: !!user,
  });
}

export function useTimeRecordsRange(employeeId: string, startDate: string, endDate: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['time-records-range', user?.id, employeeId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('time_records')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('recorded_at', `${startDate}T00:00:00`)
        .lte('recorded_at', `${endDate}T23:59:59.999`)
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      return (data || []) as TimeRecord[];
    },
    enabled: !!user && !!employeeId,
  });
}

export function useCreateTimeRecord() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Pick<TimeRecord, 'employee_id' | 'type' | 'recorded_at' | 'notes' | 'manual_adjustment'>) => {
      const { error } = await (supabase as any)
        .from('time_records')
        .insert({
          ...record,
          user_id: user!.id,
          adjusted_by: record.manual_adjustment ? user!.id : null,
        });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-records'] }),
  });
}

export function useUpdateTimeRecord() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimeRecord> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('time_records')
        .update({ ...updates, manual_adjustment: true, adjusted_by: user!.id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-records'] }),
  });
}

export function useWorkSchedules(employeeId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['work-schedules', user?.id, employeeId],
    queryFn: async () => {
      let query = (supabase as any).from('work_schedules').select('*').eq('active', true);
      if (employeeId) query = query.eq('employee_id', employeeId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as WorkSchedule[];
    },
    enabled: !!user,
  });
}

export function useSaveSchedule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: Omit<WorkSchedule, 'id' | 'user_id'> & { id?: string }) => {
      if (schedule.id) {
        const { id, ...rest } = schedule;
        const { error } = await (supabase as any).from('work_schedules').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('work_schedules').insert({ ...schedule, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work-schedules'] }),
  });
}
