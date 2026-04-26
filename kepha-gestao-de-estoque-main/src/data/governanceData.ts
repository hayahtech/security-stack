// ===== Governance & Approvals Mock Data =====

export interface ApprovalRule {
  id: string;
  name: string;
  conditions: { type: string; operator: string; value: string }[];
  approver: string;
  approverRole: string;
  substitute: string;
  deadline: number; // hours
  escalation: 'ESCALAR_SUPERIOR' | 'APROVAR_AUTO' | 'REPROVAR_AUTO';
  notifications: ('email' | 'in_app' | 'webhook')[];
  active: boolean;
}

export interface ApprovalRequest {
  id: string;
  number: string;
  requester: string;
  requesterRole: string;
  type: string;
  supplier: string;
  value: number;
  costCenter: string;
  category: string;
  createdAt: Date;
  status: 'PENDENTE' | 'APROVADO' | 'REPROVADO' | 'ESCALADO' | 'CANCELADO';
  currentLevel: number;
  totalLevels: number;
  approver?: string;
  approvedAt?: Date;
  comment?: string;
  attachments: string[];
  timeline: ApprovalTimelineEntry[];
}

export interface ApprovalTimelineEntry {
  step: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  responsible: string;
  timestamp?: Date;
  comment?: string;
  duration?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  user: string;
  ip: string;
  action: 'CRIOU' | 'EDITOU' | 'EXCLUIU' | 'APROVOU' | 'REPROVOU' | 'VISUALIZOU' | 'LOGIN' | 'CONFIGUROU';
  entity: string;
  recordId: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
}

export interface BudgetLine {
  id: string;
  costCenter: string;
  category: string;
  budgeted: number;
  actual: number;
  committed: number;
  available: number;
  percentUsed: number;
}

export interface WebhookTrigger {
  id: string;
  name: string;
  condition: string;
  action: string;
  active: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

// ----- Approval Rules -----
export const approvalRules: ApprovalRule[] = [
  { id: 'AR-001', name: 'Despesas até R$ 500', conditions: [{ type: 'valor', operator: '<=', value: '500' }], approver: 'Sistema', approverRole: 'Automático', substitute: '-', deadline: 0, escalation: 'APROVAR_AUTO', notifications: ['in_app'], active: true },
  { id: 'AR-002', name: 'Despesas R$ 500 a R$ 5.000', conditions: [{ type: 'valor', operator: 'between', value: '500-5000' }], approver: 'Carlos Mendes', approverRole: 'Gerente de Área', substitute: 'Ana Costa', deadline: 24, escalation: 'ESCALAR_SUPERIOR', notifications: ['email', 'in_app'], active: true },
  { id: 'AR-003', name: 'Despesas R$ 5.000 a R$ 50.000', conditions: [{ type: 'valor', operator: 'between', value: '5000-50000' }], approver: 'Maria Santos', approverRole: 'Gerente Regional', substitute: 'Roberto Lima', deadline: 48, escalation: 'ESCALAR_SUPERIOR', notifications: ['email', 'in_app', 'webhook'], active: true },
  { id: 'AR-004', name: 'Despesas acima de R$ 50.000', conditions: [{ type: 'valor', operator: '>', value: '50000' }], approver: 'Diretoria', approverRole: 'Diretor Financeiro', substitute: 'CEO', deadline: 72, escalation: 'REPROVAR_AUTO', notifications: ['email', 'in_app', 'webhook'], active: true },
  { id: 'AR-005', name: 'Compra de Imobilizado', conditions: [{ type: 'categoria', operator: '==', value: 'Imobilizado' }], approver: 'Roberto Lima', approverRole: 'CFO', substitute: 'Diretoria', deadline: 48, escalation: 'ESCALAR_SUPERIOR', notifications: ['email', 'in_app'], active: true },
  { id: 'AR-006', name: 'Despesas de Viagem', conditions: [{ type: 'categoria', operator: '==', value: 'Viagem' }], approver: 'Gestor Direto', approverRole: 'Gestor', substitute: 'Gerente de Área', deadline: 24, escalation: 'ESCALAR_SUPERIOR', notifications: ['email', 'in_app'], active: true },
  { id: 'AR-007', name: 'Fornecedor Novo', conditions: [{ type: 'fornecedor', operator: '==', value: 'novo' }], approver: 'Carlos Mendes', approverRole: 'Gerente de Área', substitute: 'Maria Santos', deadline: 48, escalation: 'REPROVAR_AUTO', notifications: ['email', 'in_app', 'webhook'], active: true },
  { id: 'AR-008', name: 'Acima do Orçamento', conditions: [{ type: 'orcamento', operator: '>', value: '100%' }], approver: 'Roberto Lima', approverRole: 'CFO', substitute: 'Diretoria', deadline: 72, escalation: 'REPROVAR_AUTO', notifications: ['email', 'in_app', 'webhook'], active: false },
];

// ----- Pending Approvals -----
const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

export const approvalRequests: ApprovalRequest[] = [
  {
    id: 'AP-001', number: 'AP-2024-0847', requester: 'João Silva', requesterRole: 'Operador',
    type: 'Despesa Operacional', supplier: 'Transportadora Rápida Ltda', value: 8750,
    costCenter: 'CD Guarulhos / Logística', category: 'Frete e Transporte',
    createdAt: hoursAgo(2), status: 'PENDENTE', currentLevel: 2, totalLevels: 2,
    attachments: ['NF-4521.pdf'], timeline: [
      { step: 'Criado', status: 'completed', responsible: 'João Silva', timestamp: hoursAgo(2), duration: '-' },
      { step: 'Aprovação Nível 1', status: 'completed', responsible: 'Carlos Mendes', timestamp: hoursAgo(1), comment: 'OK, dentro do previsto', duration: '1h' },
      { step: 'Aprovação Nível 2', status: 'current', responsible: 'Maria Santos (Você)', duration: 'Aguardando' },
      { step: 'Pagamento', status: 'pending', responsible: 'Financeiro' },
    ],
  },
  {
    id: 'AP-002', number: 'AP-2024-0848', requester: 'Ana Costa', requesterRole: 'Analista',
    type: 'Material de Escritório', supplier: 'Kalunga S.A.', value: 2340,
    costCenter: 'CD Campinas / Administrativo', category: 'Material e Suprimentos',
    createdAt: hoursAgo(5), status: 'PENDENTE', currentLevel: 1, totalLevels: 1,
    attachments: ['Pedido-882.pdf'], timeline: [
      { step: 'Criado', status: 'completed', responsible: 'Ana Costa', timestamp: hoursAgo(5), duration: '-' },
      { step: 'Aprovação Gerente', status: 'current', responsible: 'Maria Santos (Você)', duration: 'Aguardando' },
      { step: 'Compra', status: 'pending', responsible: 'Compras' },
    ],
  },
  {
    id: 'AP-003', number: 'AP-2024-0849', requester: 'Pedro Oliveira', requesterRole: 'Coordenador',
    type: 'Manutenção Predial', supplier: 'TechClean Serviços', value: 15200,
    costCenter: 'CD Guarulhos / Operações', category: 'Manutenção e Conservação',
    createdAt: hoursAgo(28), status: 'PENDENTE', currentLevel: 2, totalLevels: 2,
    attachments: ['Proposta-TC-2024.pdf', 'Fotos-Local.zip'], timeline: [
      { step: 'Criado', status: 'completed', responsible: 'Pedro Oliveira', timestamp: hoursAgo(28), duration: '-' },
      { step: 'Aprovação Nível 1', status: 'completed', responsible: 'Carlos Mendes', timestamp: hoursAgo(26), comment: 'Urgente, aprovar rápido', duration: '2h' },
      { step: 'Aprovação Nível 2', status: 'current', responsible: 'Maria Santos (Você)', duration: 'Aguardando' },
      { step: 'Execução', status: 'pending', responsible: 'Facilities' },
    ],
  },
  {
    id: 'AP-004', number: 'AP-2024-0850', requester: 'Lucas Ferreira', requesterRole: 'Operador',
    type: 'Despesa Operacional', supplier: 'Auto Peças Central', value: 4800,
    costCenter: 'CD Curitiba / Operações', category: 'Combustível e Veículos',
    createdAt: hoursAgo(12), status: 'PENDENTE', currentLevel: 1, totalLevels: 2,
    attachments: ['NF-9921.pdf'], timeline: [
      { step: 'Criado', status: 'completed', responsible: 'Lucas Ferreira', timestamp: hoursAgo(12), duration: '-' },
      { step: 'Aprovação Nível 1', status: 'current', responsible: 'Maria Santos (Você)', duration: 'Aguardando' },
      { step: 'Aprovação Nível 2', status: 'pending', responsible: 'Diretoria' },
      { step: 'Pagamento', status: 'pending', responsible: 'Financeiro' },
    ],
  },
  {
    id: 'AP-005', number: 'AP-2024-0851', requester: 'Mariana Dias', requesterRole: 'Analista',
    type: 'Investimento', supplier: 'Dell Technologies', value: 78500,
    costCenter: 'CD Guarulhos / TI', category: 'Imobilizado',
    createdAt: hoursAgo(48), status: 'PENDENTE', currentLevel: 2, totalLevels: 3,
    attachments: ['Proposta-Dell-2024.pdf', 'Justificativa.docx'], timeline: [
      { step: 'Criado', status: 'completed', responsible: 'Mariana Dias', timestamp: hoursAgo(48), duration: '-' },
      { step: 'Aprovação Gerente TI', status: 'completed', responsible: 'Carlos Mendes', timestamp: hoursAgo(44), comment: 'Necessário para expansão', duration: '4h' },
      { step: 'Aprovação CFO', status: 'current', responsible: 'Maria Santos (Você)', duration: 'Aguardando' },
      { step: 'Aprovação Diretoria', status: 'pending', responsible: 'Diretoria' },
      { step: 'Compra', status: 'pending', responsible: 'Compras' },
    ],
  },
  // Completed approvals
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `AP-C${i + 1}`, number: `AP-2024-0${835 + i}`, requester: ['João Silva', 'Ana Costa', 'Pedro Oliveira', 'Lucas Ferreira'][i % 4], requesterRole: ['Operador', 'Analista', 'Coordenador', 'Operador'][i % 4],
    type: ['Despesa Operacional', 'Material', 'Serviço', 'Viagem'][i % 4], supplier: ['Fornecedor A', 'Fornecedor B', 'Fornecedor C', 'Fornecedor D'][i % 4],
    value: [1200, 3400, 8900, 450, 22000, 6700, 15000, 980, 42000, 2100, 7800, 350][i],
    costCenter: ['CD Guarulhos / Operações', 'CD Campinas / Comercial', 'CD Curitiba / Logística'][i % 3],
    category: ['Frete', 'Material', 'Manutenção', 'Viagem', 'TI', 'Serviços'][i % 6],
    createdAt: new Date(2024, 11, 20 + i), status: (i % 5 === 3 ? 'REPROVADO' : 'APROVADO') as ApprovalRequest['status'],
    currentLevel: 2, totalLevels: 2, approver: 'Maria Santos',
    approvedAt: new Date(2024, 11, 21 + i), comment: i % 5 === 3 ? 'Fora do orçamento aprovado' : undefined,
    attachments: ['NF.pdf'], timeline: [],
  })),
];

// ----- Audit Trail -----
const actionTypes: AuditEntry['action'][] = ['CRIOU', 'EDITOU', 'EXCLUIU', 'APROVOU', 'REPROVOU', 'VISUALIZOU', 'LOGIN', 'CONFIGUROU'];
const users = ['Maria Santos', 'Carlos Mendes', 'João Silva', 'Ana Costa', 'Pedro Oliveira', 'Roberto Lima', 'Lucas Ferreira', 'Mariana Dias'];
const entities = ['Aprovação', 'Lançamento', 'Regra de Alçada', 'Centro de Custo', 'Orçamento', 'Fornecedor', 'Documento', 'Configuração'];
const ips = ['192.168.1.45', '192.168.1.102', '10.0.0.15', '192.168.2.33', '10.0.1.88', '192.168.1.78'];

export const auditTrail: AuditEntry[] = Array.from({ length: 200 }, (_, i) => {
  const action = actionTypes[i % 8];
  const isEdit = action === 'EDITOU';
  return {
    id: `AUD-${String(i + 1).padStart(4, '0')}`,
    timestamp: new Date(now.getTime() - i * 432000 * Math.random()),
    user: users[i % users.length],
    ip: ips[i % ips.length],
    action,
    entity: entities[i % entities.length],
    recordId: `#${String(1000 + i).padStart(6, '0')}`,
    oldValue: isEdit ? ['R$ 1.000,00', 'Categoria: Outros', 'Status: Ativo', 'Prazo: 24h'][i % 4] : undefined,
    newValue: isEdit ? ['R$ 1.500,00', 'Categoria: Combustível', 'Status: Inativo', 'Prazo: 48h'][i % 4] : undefined,
    details: action === 'LOGIN' ? 'Login via SSO' : action === 'REPROVOU' ? 'Fora do orçamento previsto' : undefined,
  };
}).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

// ----- Budget Lines -----
export const budgetLines: BudgetLine[] = [
  { id: 'BL-01', costCenter: 'CD Guarulhos / Operações', category: 'Frete e Transporte', budgeted: 120000, actual: 98500, committed: 15200, available: 6300, percentUsed: 94.7 },
  { id: 'BL-02', costCenter: 'CD Guarulhos / Operações', category: 'Manutenção', budgeted: 45000, actual: 32000, committed: 8000, available: 5000, percentUsed: 88.9 },
  { id: 'BL-03', costCenter: 'CD Guarulhos / Comercial', category: 'Marketing', budgeted: 80000, actual: 42000, committed: 12000, available: 26000, percentUsed: 67.5 },
  { id: 'BL-04', costCenter: 'CD Guarulhos / Administrativo', category: 'Material', budgeted: 15000, actual: 11200, committed: 2340, available: 1460, percentUsed: 90.3 },
  { id: 'BL-05', costCenter: 'CD Campinas / Operações', category: 'Frete e Transporte', budgeted: 95000, actual: 78000, committed: 9800, available: 7200, percentUsed: 92.4 },
  { id: 'BL-06', costCenter: 'CD Campinas / Comercial', category: 'Viagens', budgeted: 30000, actual: 18500, committed: 4200, available: 7300, percentUsed: 75.7 },
  { id: 'BL-07', costCenter: 'CD Curitiba / Operações', category: 'Combustível', budgeted: 55000, actual: 53800, committed: 4800, available: -3600, percentUsed: 106.5 },
  { id: 'BL-08', costCenter: 'CD Curitiba / Logística', category: 'Manutenção', budgeted: 35000, actual: 28900, committed: 5500, available: 600, percentUsed: 98.3 },
  { id: 'BL-09', costCenter: 'CD Guarulhos / TI', category: 'Imobilizado', budgeted: 60000, actual: 45000, committed: 78500, available: -63500, percentUsed: 205.8 },
  { id: 'BL-10', costCenter: 'CD Guarulhos / Operações', category: 'Energia', budgeted: 40000, actual: 29800, committed: 0, available: 10200, percentUsed: 74.5 },
];

// ----- Webhook Triggers -----
export const webhookTriggers: WebhookTrigger[] = [
  { id: 'WH-01', name: 'Alerta de Despesa Alta', condition: 'Despesa > R$ 10.000', action: 'POST webhook → Slack #financeiro', active: true, lastTriggered: hoursAgo(18), triggerCount: 47 },
  { id: 'WH-02', name: 'Aprovação Pendente > 48h', condition: 'Aprovação sem resposta por 48h', action: 'E-mail para diretor + escalar alçada', active: true, lastTriggered: hoursAgo(72), triggerCount: 12 },
  { id: 'WH-03', name: 'Orçamento Ultrapassado', condition: 'Realizado + Comprometido > 100% do Orçado', action: 'POST webhook → Teams #controle + bloquear lançamento', active: true, lastTriggered: hoursAgo(6), triggerCount: 8 },
];
