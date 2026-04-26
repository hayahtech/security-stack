import type { Cnpj } from '@/lib/cnpj';

export type { Cnpj };

export interface EmpresaInfo {
  cnpj: Cnpj;
  cnpj_formatted: string;
  nome: string;
  nome_fantasia?: string;
  municipio?: string;
  uf?: string;
}

export type ItemStatus = 'OK' | 'NOT_OK' | 'NA' | 'PENDING';
export type ChecklistType = 'inbound' | 'outbound' | 'audit';
export type FinalStatus = 'approved' | 'rejected' | 'pending';
export type UserRole = 'inspector' | 'supervisor';
export type WorkflowStatus = 'editing' | 'awaiting_supervisor' | 'in_review';

export interface ChecklistItem {
  id: string;
  label: string;
  status: ItemStatus;
  isCritical: boolean;
  notes: string;
  module: string;
  photo?: string;
}

export interface ChecklistContext {
  vehicle: boolean;
  fragile: boolean;
  hazmat: boolean;
}

export interface AuditInfo {
  user: string;
  timestamp: string;
  confirmed: boolean;
}

export interface ApprovalFlow {
  inspectorName: string;
  inspectorConfirmed: boolean;
  supervisorName: string;
  supervisorStatus: 'pending' | 'approved' | 'returned';
  supervisorNotes: string;
  returnedAt?: string;
}

export interface CriticalAlert {
  id: string;
  label: string;
  timestamp: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy_m: number;
  timestamp_iso: string;
}

export interface Checklist {
  id: string;
  type: ChecklistType;
  empresa: EmpresaInfo | null;
  context: ChecklistContext;
  items: ChecklistItem[];
  audit: AuditInfo;
  finalStatus: FinalStatus;
}

// Base items for inbound checklist
export const INBOUND_ITEMS: Omit<ChecklistItem, 'status' | 'notes' | 'photo'>[] = [
  { id: 'in_1', label: 'Conferência da Nota Fiscal', isCritical: true, module: 'base' },
  { id: 'in_2', label: 'Verificação da quantidade recebida', isCritical: true, module: 'base' },
  { id: 'in_3', label: 'Integridade da embalagem', isCritical: true, module: 'base' },
  { id: 'in_4', label: 'Conferência de lacres e selos', isCritical: true, module: 'base' },
  { id: 'in_5', label: 'Verificação de avarias no transporte', isCritical: false, module: 'base' },
  { id: 'in_6', label: 'Conformidade do produto com o pedido', isCritical: true, module: 'base' },
  { id: 'in_7', label: 'Registro fotográfico da carga', isCritical: false, module: 'base' },
  { id: 'in_8', label: 'Conferência de data de validade', isCritical: false, module: 'base' },
];

export const OUTBOUND_ITEMS: Omit<ChecklistItem, 'status' | 'notes' | 'photo'>[] = [
  { id: 'out_1', label: 'Conferência do pedido de saída', isCritical: true, module: 'base' },
  { id: 'out_2', label: 'Verificação da embalagem para envio', isCritical: true, module: 'base' },
  { id: 'out_3', label: 'Etiquetagem correta (destino e remetente)', isCritical: true, module: 'base' },
  { id: 'out_4', label: 'Peso e dimensões conferidos', isCritical: false, module: 'base' },
  { id: 'out_5', label: 'Documentação de transporte emitida', isCritical: true, module: 'base' },
  { id: 'out_6', label: 'Registro fotográfico de despacho', isCritical: false, module: 'base' },
];

export const VEHICLE_ITEMS: Omit<ChecklistItem, 'status' | 'notes' | 'photo'>[] = [
  { id: 'veh_1', label: 'Condição dos pneus', isCritical: true, module: 'vehicle' },
  { id: 'veh_2', label: 'Nível de combustível adequado', isCritical: false, module: 'vehicle' },
  { id: 'veh_3', label: 'Luzes e sinalização funcionando', isCritical: true, module: 'vehicle' },
  { id: 'veh_4', label: 'Freios em bom estado', isCritical: true, module: 'vehicle' },
  { id: 'veh_5', label: 'Documentação do veículo em dia', isCritical: true, module: 'vehicle' },
  { id: 'veh_6', label: 'Limpeza e organização do veículo', isCritical: false, module: 'vehicle' },
];

export const FRAGILE_ITEMS: Omit<ChecklistItem, 'status' | 'notes' | 'photo'>[] = [
  { id: 'fra_1', label: 'Embalagem com proteção extra (plástico bolha, isopor)', isCritical: true, module: 'fragile' },
  { id: 'fra_2', label: 'Etiqueta "FRÁGIL" visível', isCritical: true, module: 'fragile' },
  { id: 'fra_3', label: 'Teste de resistência da embalagem', isCritical: false, module: 'fragile' },
  { id: 'fra_4', label: 'Indicador de impacto anexado', isCritical: false, module: 'fragile' },
];

export const HAZMAT_ITEMS: Omit<ChecklistItem, 'status' | 'notes' | 'photo'>[] = [
  { id: 'haz_1', label: 'Ficha de segurança (FISPQ) disponível', isCritical: true, module: 'hazmat' },
  { id: 'haz_2', label: 'Sinalização de produto perigoso', isCritical: true, module: 'hazmat' },
  { id: 'haz_3', label: 'EPI adequado disponível', isCritical: true, module: 'hazmat' },
  { id: 'haz_4', label: 'Armazenamento conforme normas', isCritical: true, module: 'hazmat' },
  { id: 'haz_5', label: 'Fitas refletivas e sinalização no veículo', isCritical: true, module: 'hazmat' },
];

export const AUDIT_ITEMS: Omit<ChecklistItem, 'status' | 'notes' | 'photo'>[] = [
  { id: 'aud_1', label: 'Conformidade com procedimentos operacionais', isCritical: true, module: 'base' },
  { id: 'aud_2', label: 'Registros de entrada/saída atualizados', isCritical: true, module: 'base' },
  { id: 'aud_3', label: 'Documentação fiscal em conformidade', isCritical: true, module: 'base' },
  { id: 'aud_4', label: 'Inventário físico confere com sistema', isCritical: true, module: 'base' },
  { id: 'aud_5', label: 'Condições de armazenamento adequadas', isCritical: true, module: 'base' },
  { id: 'aud_6', label: 'EPIs disponíveis e em bom estado', isCritical: true, module: 'base' },
  { id: 'aud_7', label: 'Sinalização de segurança visível', isCritical: false, module: 'base' },
  { id: 'aud_8', label: 'Limpeza e organização do ambiente', isCritical: false, module: 'base' },
  { id: 'aud_9', label: 'Extintores dentro da validade', isCritical: true, module: 'base' },
  { id: 'aud_10', label: 'Treinamentos da equipe em dia', isCritical: false, module: 'base' },
];

export const MODULE_LABELS: Record<string, string> = {
  base: 'Itens Gerais',
  vehicle: '🚛 Inspeção Veicular',
  fragile: '📦 Produtos Frágeis',
  hazmat: '⚠️ Materiais Perigosos',
};

export function initializeItems(templates: Omit<ChecklistItem, 'status' | 'notes' | 'photo'>[]): ChecklistItem[] {
  return templates.map(t => ({ ...t, status: 'PENDING' as ItemStatus, notes: '', photo: undefined }));
}
