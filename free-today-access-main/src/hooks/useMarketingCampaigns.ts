import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface MarketingCampaign {
  id: string;
  user_id: string;
  name: string;
  objective: string;
  channel: string;
  status: string;
  budget: number;
  spent: number;
  start_date: string;
  end_date: string | null;
  target_audience: string | null;
  expected_reach: number | null;
  actual_reach: number | null;
  expected_conversions: number | null;
  actual_conversions: number | null;
  cost_center: string | null;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignInsert {
  name: string;
  objective: string;
  channel: string;
  budget: number;
  start_date: string;
  end_date?: string;
  target_audience?: string;
  expected_reach?: number;
  expected_conversions?: number;
  cost_center?: string;
  notes?: string;
  attachment_url?: string;
}

export function useMarketingCampaigns(filters?: { status?: string; channel?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['marketing_campaigns', user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.channel) query = query.eq('channel', filters.channel);

      const { data, error } = await query;
      if (error) throw error;
      return data as MarketingCampaign[];
    },
    enabled: !!user,
  });
}

export function useMarketingCampaign(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['marketing_campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as MarketingCampaign;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateCampaign() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CampaignInsert) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing_campaigns'] });
      toast({ title: 'Campanha criada com sucesso!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao criar campanha', description: err.message, variant: 'destructive' });
    },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarketingCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing_campaigns'] });
      qc.invalidateQueries({ queryKey: ['marketing_campaign'] });
      toast({ title: 'Campanha atualizada!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marketing_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing_campaigns'] });
      toast({ title: 'Campanha excluída!' });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    },
  });
}

export function useCampaignTransactions(campaignId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['campaign_transactions', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('campaign_id', campaignId!)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!campaignId,
  });
}

// Channel display helpers
export const CHANNEL_OPTIONS = [
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'google', label: 'Google Ads', icon: '🔍' },
  { value: 'ifood', label: 'iFood Ads', icon: '🛵' },
  { value: 'rappi', label: 'Rappi Ads', icon: '📦' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'panfleto', label: 'Panfleto', icon: '📄' },
  { value: 'influenciador', label: 'Influenciador', icon: '⭐' },
  { value: 'email', label: 'E-mail Marketing', icon: '📧' },
  { value: 'outro', label: 'Outro', icon: '📢' },
];

export const OBJECTIVE_OPTIONS = [
  { value: 'novos_clientes', label: 'Novos Clientes' },
  { value: 'retencao', label: 'Retenção' },
  { value: 'aumento_ticket', label: 'Aumento de Ticket' },
  { value: 'lancamento', label: 'Lançamento' },
  { value: 'sazonalidade', label: 'Sazonalidade' },
  { value: 'branding', label: 'Branding' },
];

export const STATUS_OPTIONS = [
  { value: 'planejada', label: 'Planejada', color: 'secondary' },
  { value: 'ativa', label: 'Ativa', color: 'default' },
  { value: 'pausada', label: 'Pausada', color: 'outline' },
  { value: 'encerrada', label: 'Encerrada', color: 'destructive' },
];

export const INVESTMENT_TYPE_OPTIONS = [
  { value: 'midia_paga', label: 'Mídia Paga' },
  { value: 'producao', label: 'Produção de Conteúdo' },
  { value: 'material_fisico', label: 'Material Físico' },
  { value: 'influenciador', label: 'Influenciador' },
  { value: 'promocao', label: 'Promoção/Desconto' },
  { value: 'ferramenta', label: 'Ferramenta/Software' },
];
