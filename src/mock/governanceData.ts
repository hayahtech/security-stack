// Governança & Controle — Dados Mockados

// ═══ ALÇADAS DE APROVAÇÃO ═══

export interface ApprovalRule {
  id: number;
  name: string;
  active: boolean;
  tiers: { min: number; max: number | null; approver: string; hoursLimit: number; escalation: string }[];
}

export const approvalRules: ApprovalRule[] = [
  {
    id: 1,
    name: "Despesas Operacionais",
    active: true,
    tiers: [
      { min: 0, max: 500, approver: "Aprovação automática", hoursLimit: 0, escalation: "N/A" },
      { min: 501, max: 5000, approver: "Gestor da área", hoursLimit: 24, escalation: "Diretor Financeiro" },
      { min: 5001, max: 50000, approver: "Diretor Financeiro", hoursLimit: 48, escalation: "CEO" },
      { min: 50001, max: null, approver: "CEO + CFO", hoursLimit: 72, escalation: "Board" },
    ],
  },
  {
    id: 2,
    name: "CAPEX / Investimentos",
    active: true,
    tiers: [
      { min: 0, max: 200000, approver: "Comitê de Investimentos", hoursLimit: 72, escalation: "Board de Diretores" },
      { min: 200001, max: null, approver: "Board de Diretores", hoursLimit: 120, escalation: "Assembleia" },
    ],
  },
  {
    id: 3,
    name: "Viagens e Despesas Variáveis",
    active: true,
    tiers: [
      { min: 0, max: 2000, approver: "Gestor direto", hoursLimit: 24, escalation: "RH" },
      { min: 2001, max: null, approver: "RH + Financeiro", hoursLimit: 48, escalation: "Diretor Financeiro" },
    ],
  },
];

export interface PendingApproval {
  id: number;
  requester: string;
  description: string;
  value: number;
  category: string;
  submittedAt: string;
  hoursAgo: number;
  urgency: "low" | "medium" | "high";
}

export const pendingApprovals: PendingApproval[] = [
  { id: 1, requester: "Marina Costa", description: "Renovação licença Adobe Creative Suite", value: 12800, category: "Despesas Operacionais", submittedAt: "08/03 09:15", hoursAgo: 5, urgency: "medium" },
  { id: 2, requester: "Pedro Almeida", description: "Viagem técnica cliente SP — passagem + hotel", value: 3400, category: "Viagens", submittedAt: "07/03 16:42", hoursAgo: 21, urgency: "high" },
  { id: 3, requester: "Lucas Ferreira", description: "Compra de 10 monitores ultrawide", value: 45000, category: "CAPEX", submittedAt: "07/03 10:30", hoursAgo: 28, urgency: "high" },
];

// ═══ TRILHA DE AUDITORIA ═══

export interface AuditEntry {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  actionType: "edit" | "approve" | "system" | "reject" | "create" | "delete_attempt" | "login" | "export";
  entity: string;
  oldValue: string;
  newValue: string;
  ip: string;
  suspicious: boolean;
}

export const auditLog: AuditEntry[] = [
  { id: 1, timestamp: "08/03 14:32", user: "Carlos M.", action: "Editou lançamento", actionType: "edit", entity: "Despesa #4821", oldValue: "R$ 4.800", newValue: "R$ 5.200", ip: "177.38.x.x", suspicious: true },
  { id: 2, timestamp: "08/03 13:15", user: "Ana P.", action: "Aprovou pagamento", actionType: "approve", entity: "Pagamento #892", oldValue: "Pendente", newValue: "Aprovado", ip: "189.12.x.x", suspicious: false },
  { id: 3, timestamp: "08/03 11:08", user: "Sistema", action: "Conciliação automática", actionType: "system", entity: "Extrato Itaú", oldValue: "—", newValue: "847 lançamentos", ip: "—", suspicious: false },
  { id: 4, timestamp: "08/03 09:44", user: "Rafael T.", action: "Tentativa de exclusão", actionType: "delete_attempt", entity: "NF #301", oldValue: "—", newValue: "Bloqueado", ip: "201.45.x.x", suspicious: true },
  { id: 5, timestamp: "08/03 08:30", user: "Carlos M.", action: "Login no sistema", actionType: "login", entity: "Sessão", oldValue: "—", newValue: "Ativo", ip: "177.38.x.x", suspicious: false },
  { id: 6, timestamp: "07/03 23:48", user: "Rafael T.", action: "Login fora do horário", actionType: "login", entity: "Sessão", oldValue: "—", newValue: "Ativo", ip: "201.45.x.x", suspicious: true },
  { id: 7, timestamp: "07/03 18:22", user: "Ana P.", action: "Exportou relatório", actionType: "export", entity: "DRE Março/2025", oldValue: "—", newValue: "PDF gerado", ip: "189.12.x.x", suspicious: false },
  { id: 8, timestamp: "07/03 17:10", user: "Marina C.", action: "Criou lançamento", actionType: "create", entity: "Despesa #4820", oldValue: "—", newValue: "R$ 2.350", ip: "10.0.x.x", suspicious: false },
  { id: 9, timestamp: "07/03 16:45", user: "Pedro A.", action: "Editou lançamento", actionType: "edit", entity: "Receita #1204", oldValue: "R$ 85.000", newValue: "R$ 87.500", ip: "10.0.x.x", suspicious: false },
  { id: 10, timestamp: "07/03 15:33", user: "Carlos M.", action: "Aprovou pagamento", actionType: "approve", entity: "Pagamento #891", oldValue: "Pendente", newValue: "Aprovado", ip: "177.38.x.x", suspicious: false },
  { id: 11, timestamp: "07/03 14:20", user: "Sistema", action: "Backup automático", actionType: "system", entity: "Database", oldValue: "—", newValue: "Concluído", ip: "—", suspicious: false },
  { id: 12, timestamp: "07/03 11:05", user: "Rafael T.", action: "Tentativa de exclusão", actionType: "delete_attempt", entity: "Despesa #4815", oldValue: "R$ 12.800", newValue: "Bloqueado", ip: "201.45.x.x", suspicious: true },
  { id: 13, timestamp: "07/03 10:30", user: "Lucas F.", action: "Submeteu para aprovação", actionType: "create", entity: "CAPEX #087", oldValue: "—", newValue: "R$ 45.000", ip: "10.0.x.x", suspicious: false },
  { id: 14, timestamp: "07/03 09:15", user: "Ana P.", action: "Rejeitou pagamento", actionType: "reject", entity: "Pagamento #889", oldValue: "Pendente", newValue: "Rejeitado", ip: "189.12.x.x", suspicious: false },
  { id: 15, timestamp: "06/03 17:55", user: "Carlos M.", action: "Editou lançamento", actionType: "edit", entity: "Despesa #4812", oldValue: "R$ 1.200", newValue: "R$ 1.450", ip: "177.38.x.x", suspicious: false },
  { id: 16, timestamp: "06/03 16:30", user: "Sistema", action: "Importação NF-e", actionType: "system", entity: "Lote #234", oldValue: "—", newValue: "18 notas importadas", ip: "—", suspicious: false },
  { id: 17, timestamp: "06/03 15:10", user: "Marina C.", action: "Aprovou reembolso", actionType: "approve", entity: "Reembolso #156", oldValue: "Pendente", newValue: "Aprovado", ip: "10.0.x.x", suspicious: false },
  { id: 18, timestamp: "06/03 14:00", user: "Pedro A.", action: "Login no sistema", actionType: "login", entity: "Sessão", oldValue: "—", newValue: "Ativo", ip: "10.0.x.x", suspicious: false },
  { id: 19, timestamp: "06/03 11:45", user: "Carlos M.", action: "Editou alçada", actionType: "edit", entity: "Regra #1", oldValue: "Limite: R$ 3.000", newValue: "Limite: R$ 5.000", ip: "177.38.x.x", suspicious: false },
  { id: 20, timestamp: "06/03 10:22", user: "Ana P.", action: "Exportou relatório", actionType: "export", entity: "Fluxo de Caixa", oldValue: "—", newValue: "Excel gerado", ip: "189.12.x.x", suspicious: false },
  { id: 21, timestamp: "05/03 18:15", user: "Sistema", action: "Alerta automático", actionType: "system", entity: "Caixa", oldValue: "—", newValue: "Saldo < mínimo", ip: "—", suspicious: false },
  { id: 22, timestamp: "05/03 16:40", user: "Rafael T.", action: "Criou lançamento", actionType: "create", entity: "Receita #1201", oldValue: "—", newValue: "R$ 65.000", ip: "201.45.x.x", suspicious: false },
  { id: 23, timestamp: "05/03 14:30", user: "Lucas F.", action: "Editou centro de custo", actionType: "edit", entity: "CC-003", oldValue: "Operações", newValue: "Operações & Suporte", ip: "10.0.x.x", suspicious: false },
  { id: 24, timestamp: "05/03 11:20", user: "Ana P.", action: "Aprovou pagamento", actionType: "approve", entity: "Pagamento #887", oldValue: "Pendente", newValue: "Aprovado", ip: "189.12.x.x", suspicious: false },
  { id: 25, timestamp: "04/03 17:00", user: "Carlos M.", action: "Login no sistema", actionType: "login", entity: "Sessão", oldValue: "—", newValue: "Ativo", ip: "177.38.x.x", suspicious: false },
  { id: 26, timestamp: "04/03 15:45", user: "Sistema", action: "Conciliação automática", actionType: "system", entity: "Extrato BB", oldValue: "—", newValue: "312 lançamentos", ip: "—", suspicious: false },
  { id: 27, timestamp: "04/03 13:10", user: "Marina C.", action: "Submeteu reembolso", actionType: "create", entity: "Reembolso #157", oldValue: "—", newValue: "R$ 1.850", ip: "10.0.x.x", suspicious: false },
  { id: 28, timestamp: "04/03 10:55", user: "Pedro A.", action: "Editou lançamento", actionType: "edit", entity: "Despesa #4808", oldValue: "R$ 7.200", newValue: "R$ 7.500", ip: "10.0.x.x", suspicious: false },
  { id: 29, timestamp: "03/03 16:30", user: "Carlos M.", action: "Aprovou CAPEX", actionType: "approve", entity: "CAPEX #085", oldValue: "Pendente", newValue: "Aprovado", ip: "177.38.x.x", suspicious: false },
  { id: 30, timestamp: "03/03 09:00", user: "Sistema", action: "Backup automático", actionType: "system", entity: "Database", oldValue: "—", newValue: "Concluído", ip: "—", suspicious: false },
];

// Heatmap de atividade (hora × dia da semana)
export const activityHeatmap = [
  { day: "Seg", h8: 5, h9: 12, h10: 18, h11: 15, h12: 4, h13: 8, h14: 20, h15: 16, h16: 14, h17: 10, h18: 3, h19: 1 },
  { day: "Ter", h8: 6, h9: 14, h10: 20, h11: 17, h12: 5, h13: 10, h14: 22, h15: 18, h16: 12, h17: 8, h18: 2, h19: 0 },
  { day: "Qua", h8: 4, h9: 11, h10: 16, h11: 14, h12: 3, h13: 9, h14: 19, h15: 15, h16: 11, h17: 7, h18: 1, h19: 0 },
  { day: "Qui", h8: 7, h9: 15, h10: 21, h11: 18, h12: 6, h13: 11, h14: 23, h15: 19, h16: 15, h17: 9, h18: 4, h19: 1 },
  { day: "Sex", h8: 3, h9: 10, h10: 14, h11: 12, h12: 2, h13: 7, h14: 15, h15: 13, h16: 10, h17: 6, h18: 2, h19: 0 },
  { day: "Sáb", h8: 0, h9: 1, h10: 2, h11: 1, h12: 0, h13: 0, h14: 1, h15: 0, h16: 0, h17: 0, h18: 0, h19: 0 },
  { day: "Dom", h8: 0, h9: 0, h10: 0, h11: 1, h12: 0, h13: 0, h14: 0, h15: 0, h16: 0, h17: 0, h18: 0, h19: 0 },
];

// ═══ REEMBOLSOS ═══

export interface ReimbursementRequest {
  id: number;
  collaborator: string;
  description: string;
  value: number;
  category: string;
  justification: string;
  submittedDate: string;
  status: "submitted" | "review" | "approved" | "paid" | "rejected";
  reviewerComment?: string;
}

export const reimbursementRequests: ReimbursementRequest[] = [
  { id: 1, collaborator: "Marina Costa", description: "Almoço com cliente — reunião comercial", value: 285, category: "Alimentação", justification: "Almoço de negociação contrato anual", submittedDate: "08/03/2025", status: "submitted" },
  { id: 2, collaborator: "Pedro Almeida", description: "Uber para evento de TI", value: 142, category: "Transporte", justification: "Deslocamento para TechConf 2025", submittedDate: "08/03/2025", status: "submitted" },
  { id: 3, collaborator: "Lucas Ferreira", description: "Material de apresentação — gráfica", value: 890, category: "Material", justification: "Impressão deck comercial cliente enterprise", submittedDate: "07/03/2025", status: "review" },
  { id: 4, collaborator: "Ana Paula", description: "Passagem aérea SP-RJ", value: 1250, category: "Viagem", justification: "Visita ao escritório regional", submittedDate: "07/03/2025", status: "review" },
  { id: 5, collaborator: "Carlos Mendes", description: "Estacionamento escritório — mês", value: 450, category: "Transporte", justification: "Estacionamento rotativo próximo à sede", submittedDate: "06/03/2025", status: "approved" },
  { id: 6, collaborator: "Marina Costa", description: "Curso online de liderança", value: 2800, category: "Treinamento", justification: "Programa de desenvolvimento gerencial", submittedDate: "06/03/2025", status: "review" },
  { id: 7, collaborator: "Rafael Torres", description: "Jantar com parceiro estratégico", value: 520, category: "Alimentação", justification: "Jantar de alinhamento parceria", submittedDate: "05/03/2025", status: "approved" },
  { id: 8, collaborator: "Pedro Almeida", description: "Hotel 2 diárias — treinamento", value: 1640, category: "Hospedagem", justification: "Treinamento técnico obrigatório", submittedDate: "05/03/2025", status: "paid" },
  { id: 9, collaborator: "Lucas Ferreira", description: "Combustível — visitas técnicas", value: 380, category: "Transporte", justification: "Visitas a 4 clientes na região", submittedDate: "04/03/2025", status: "paid" },
  { id: 10, collaborator: "Ana Paula", description: "Livros técnicos — contabilidade", value: 245, category: "Material", justification: "Atualização IFRS 2025", submittedDate: "04/03/2025", status: "rejected", reviewerComment: "Sem aprovação prévia do gestor" },
  { id: 11, collaborator: "Carlos Mendes", description: "Café e snacks — workshop", value: 185, category: "Alimentação", justification: "Workshop de planejamento trimestral", submittedDate: "03/03/2025", status: "paid" },
  { id: 12, collaborator: "Marina Costa", description: "Taxi aeroporto — viagem cliente", value: 95, category: "Transporte", justification: "Deslocamento GRU-Centro", submittedDate: "03/03/2025", status: "paid" },
];

export const reimbursementSummary = {
  totalPending: 28400,
  openRequests: 12,
  avgProcessingDays: 3.2,
  monthlyTotal: 48200,
  byCategory: [
    { category: "Alimentação", total: 12400, count: 18 },
    { category: "Transporte", total: 9800, count: 24 },
    { category: "Viagem", total: 15600, count: 8 },
    { category: "Material", total: 4200, count: 6 },
    { category: "Treinamento", total: 6200, count: 3 },
  ],
  byCollaborator: [
    { name: "Marina Costa", total: 8200, count: 12 },
    { name: "Pedro Almeida", total: 7400, count: 9 },
    { name: "Lucas Ferreira", total: 5800, count: 7 },
    { name: "Ana Paula", total: 4600, count: 6 },
    { name: "Carlos Mendes", total: 3800, count: 5 },
    { name: "Rafael Torres", total: 2400, count: 3 },
  ],
};
