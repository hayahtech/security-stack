export type LeadStatus = 'novo' | 'contactado' | 'qualificado' | 'perdido';
export type DealStage = 'novo_lead' | 'contactado' | 'proposta' | 'ganho' | 'perdido';
export type InteractionType = 'ligacao' | 'mensagem' | 'reuniao' | 'nota';
export type ActivityStatus = 'pendente' | 'concluida' | 'cancelada' | 'atrasada';
export type ActivityType = 'tarefa' | 'ligacao' | 'reuniao' | 'email' | 'follow_up' | 'visita';
export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';
export type PipelineType = 'vendas' | 'imobiliario' | 'marketing';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: LeadStatus;
  notes: string;
  tags: string[];
  responsible_id: string;
  potential_value: number;
  company?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  tags: string[];
  notes: string;
  segment?: string;
  total_revenue: number;
  deals_count: number;
  last_contact?: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  lead_id?: string;
  customer_id?: string;
  name: string;
  value: number;
  stage: DealStage;
  pipeline: PipelineType;
  priority: Priority;
  probability: number;
  forecast_date?: string;
  responsible_id: string;
  source?: string;
  last_interaction?: string;
  next_activity?: string;
  stage_history: { stage: DealStage; date: string }[];
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  lead_id?: string;
  customer_id?: string;
  deal_id?: string;
  type: InteractionType;
  description: string;
  user_id?: string;
  date: string;
  created_at: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  type: ActivityType;
  status: ActivityStatus;
  priority: Priority;
  lead_id?: string;
  customer_id?: string;
  deal_id?: string;
  responsible_id: string;
  due_date: string;
  completed_at?: string;
  created_at: string;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo',
  contactado: 'Contactado',
  qualificado: 'Qualificado',
  perdido: 'Perdido',
};

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  novo_lead: 'Novo Lead',
  contactado: 'Contactado',
  proposta: 'Proposta',
  ganho: 'Ganho',
  perdido: 'Perdido',
};

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  ligacao: 'Ligação',
  mensagem: 'Mensagem',
  reuniao: 'Reunião',
  nota: 'Nota',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  tarefa: 'Tarefa',
  ligacao: 'Ligação',
  reuniao: 'Reunião',
  email: 'Email',
  follow_up: 'Follow-up',
  visita: 'Visita',
};

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  pendente: 'Pendente',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  atrasada: 'Atrasada',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const PIPELINE_LABELS: Record<PipelineType, string> = {
  vendas: 'Pipeline de Vendas',
  imobiliario: 'Pipeline Imobiliário',
  marketing: 'Pipeline Marketing',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  novo: 'bg-info/15 text-info',
  contactado: 'bg-warning/15 text-warning',
  qualificado: 'bg-success/15 text-success',
  perdido: 'bg-destructive/15 text-destructive',
};

export const DEAL_STAGE_COLORS: Record<DealStage, string> = {
  novo_lead: 'bg-info/15 text-info',
  contactado: 'bg-warning/15 text-warning',
  proposta: 'bg-accent/15 text-accent',
  ganho: 'bg-success/15 text-success',
  perdido: 'bg-destructive/15 text-destructive',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  baixa: 'bg-muted text-muted-foreground',
  media: 'bg-info/15 text-info',
  alta: 'bg-warning/15 text-warning',
  urgente: 'bg-destructive/15 text-destructive',
};

export const ACTIVITY_STATUS_COLORS: Record<ActivityStatus, string> = {
  pendente: 'bg-warning/15 text-warning',
  concluida: 'bg-success/15 text-success',
  cancelada: 'bg-muted text-muted-foreground',
  atrasada: 'bg-destructive/15 text-destructive',
};
