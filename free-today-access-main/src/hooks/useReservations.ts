import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Reservation {
  id: string;
  user_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  table_id: string | null;
  reserved_date: string;
  reserved_time: string;
  status: string;
  notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export function useReservations(date?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['reservations', user?.id, date],
    queryFn: async () => {
      let query = (supabase as any)
        .from('reservations')
        .select('*')
        .order('reserved_date', { ascending: true })
        .order('reserved_time', { ascending: true });
      if (date) {
        query = query.eq('reserved_date', date);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Reservation[];
    },
    enabled: !!user,
  });
}

export function useCreateReservation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Omit<Reservation, 'id' | 'user_id' | 'created_at' | 'confirmed_at' | 'cancelled_at'>) => {
      const { error } = await (supabase as any)
        .from('reservations')
        .insert({ ...r, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  });
}

export function useUpdateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Reservation> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('reservations')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  });
}

export function useReservationsByRange(startDate: string, endDate: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['reservations-range', user?.id, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('reservations')
        .select('id, reserved_date, status')
        .gte('reserved_date', startDate)
        .lte('reserved_date', endDate);
      if (error) throw error;
      return (data || []) as Pick<Reservation, 'id' | 'reserved_date' | 'status'>[];
    },
    enabled: !!user,
  });
}
