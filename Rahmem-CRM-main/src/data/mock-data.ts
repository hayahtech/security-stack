import { Lead, Customer, Deal, Interaction, User, Activity } from '@/types/crm';

export const mockUsers: User[] = [
  { id: 'u1', name: 'Ricardo Almeida', email: 'ricardo@rahmem.com', role: 'Gerente Comercial' },
  { id: 'u2', name: 'Camila Ferreira', email: 'camila@rahmem.com', role: 'Vendedora' },
  { id: 'u3', name: 'Bruno Martins', email: 'bruno@rahmem.com', role: 'SDR' },
  { id: 'u4', name: 'Patrícia Souza', email: 'patricia@rahmem.com', role: 'Closer' },
  { id: 'u5', name: 'Diego Nascimento', email: 'diego@rahmem.com', role: 'Vendedor' },
];

export const mockLeads: Lead[] = [
  { id: 'l1', name: 'Carlos Silva', phone: '(11) 99999-0001', email: 'carlos@empresa.com', source: 'Website', status: 'novo', notes: 'Interessado no plano enterprise', tags: ['enterprise', 'urgente'], responsible_id: 'u2', potential_value: 45000, company: 'Silva & Associados', created_at: '2026-03-20T10:00:00Z', updated_at: '2026-03-20T10:00:00Z' },
  { id: 'l2', name: 'Ana Oliveira', phone: '(21) 98888-0002', email: 'ana@startup.io', source: 'LinkedIn', status: 'contactado', notes: 'Agendou demo para semana que vem', tags: ['startup', 'demo'], responsible_id: 'u3', potential_value: 12000, company: 'StartupXYZ', created_at: '2026-03-18T14:00:00Z', updated_at: '2026-03-19T09:00:00Z' },
  { id: 'l3', name: 'Roberto Santos', phone: '(31) 97777-0003', email: 'roberto@corp.com.br', source: 'Indicação', status: 'qualificado', notes: 'Budget aprovado, aguardando proposta', tags: ['enterprise'], responsible_id: 'u4', potential_value: 85000, company: 'Corp Brasil', created_at: '2026-03-15T08:00:00Z', updated_at: '2026-03-21T16:00:00Z' },
  { id: 'l4', name: 'Mariana Costa', phone: '(41) 96666-0004', email: 'mariana@tech.com', source: 'Google Ads', status: 'novo', notes: '', tags: ['pme'], responsible_id: 'u2', potential_value: 8000, company: 'Tech Solutions', created_at: '2026-03-22T09:00:00Z', updated_at: '2026-03-22T09:00:00Z' },
  { id: 'l5', name: 'Fernando Lima', phone: '(51) 95555-0005', email: 'fernando@agencia.com', source: 'Website', status: 'perdido', notes: 'Optou por concorrente', tags: ['agência'], responsible_id: 'u5', potential_value: 22000, company: 'Agência Digital', created_at: '2026-03-10T11:00:00Z', updated_at: '2026-03-17T15:00:00Z' },
  { id: 'l6', name: 'Julia Mendes', phone: '(61) 94444-0006', email: 'julia@varejo.com', source: 'Evento', status: 'contactado', notes: 'Conheceu no Web Summit', tags: ['varejo', 'evento'], responsible_id: 'u3', potential_value: 35000, company: 'Varejo Express', created_at: '2026-03-12T13:00:00Z', updated_at: '2026-03-20T10:00:00Z' },
  { id: 'l7', name: 'Pedro Henrique', phone: '(85) 93333-0007', email: 'pedro@logistica.com', source: 'Indicação', status: 'novo', notes: 'Indicado pelo Roberto Santos', tags: ['logística'], responsible_id: 'u4', potential_value: 52000, company: 'LogBrasil', created_at: '2026-03-25T09:00:00Z', updated_at: '2026-03-25T09:00:00Z' },
  { id: 'l8', name: 'Fernanda Rocha', phone: '(71) 92222-0008', email: 'fernanda@educacao.com', source: 'Google Ads', status: 'contactado', notes: 'Interessada no módulo educacional', tags: ['educação', 'pme'], responsible_id: 'u2', potential_value: 18000, company: 'EduTech', created_at: '2026-03-23T11:00:00Z', updated_at: '2026-03-26T14:00:00Z' },
];

export const mockCustomers: Customer[] = [
  { id: 'c1', name: 'TechCorp Brasil', phone: '(11) 3333-0001', email: 'contato@techcorp.com.br', company: 'TechCorp', tags: ['premium', 'enterprise'], notes: 'Cliente desde 2024', segment: 'Tecnologia', total_revenue: 195000, deals_count: 3, last_contact: '2026-03-28', status: 'ativo', created_at: '2024-06-15T10:00:00Z', updated_at: '2026-03-01T10:00:00Z' },
  { id: 'c2', name: 'StartupXYZ', phone: '(21) 3333-0002', email: 'hello@startupxyz.io', company: 'StartupXYZ', tags: ['startup', 'growth'], notes: 'Plano growth anual', segment: 'SaaS', total_revenue: 48000, deals_count: 2, last_contact: '2026-03-15', status: 'ativo', created_at: '2025-01-10T10:00:00Z', updated_at: '2026-02-15T10:00:00Z' },
  { id: 'c3', name: 'Varejo Nacional', phone: '(31) 3333-0003', email: 'comercial@varejonal.com.br', company: 'Varejo Nacional SA', tags: ['enterprise', 'varejo'], notes: '150 usuários ativos', segment: 'Varejo', total_revenue: 320000, deals_count: 5, last_contact: '2026-03-30', status: 'ativo', created_at: '2024-09-20T10:00:00Z', updated_at: '2026-03-10T10:00:00Z' },
  { id: 'c4', name: 'Construtora Horizonte', phone: '(11) 3333-0004', email: 'comercial@horizonte.com.br', company: 'Horizonte SA', tags: ['construção', 'enterprise'], notes: 'Contrato renovado em 2026', segment: 'Construção', total_revenue: 240000, deals_count: 4, last_contact: '2026-03-22', status: 'ativo', created_at: '2025-03-01T10:00:00Z', updated_at: '2026-03-22T10:00:00Z' },
  { id: 'c5', name: 'Clinica Saúde+', phone: '(41) 3333-0005', email: 'admin@saudemais.com', company: 'Saúde+ Ltda', tags: ['saúde', 'pme'], notes: 'Parceiro desde 2025. Sem contato recente.', segment: 'Saúde', total_revenue: 36000, deals_count: 1, last_contact: '2026-01-10', status: 'inativo', created_at: '2025-06-01T10:00:00Z', updated_at: '2026-01-10T10:00:00Z' },
];

export const mockDeals: Deal[] = [
  // Vendas pipeline
  { id: 'd1', lead_id: 'l1', name: 'Plano Enterprise - Carlos', value: 45000, stage: 'novo_lead', pipeline: 'vendas', priority: 'alta', probability: 30, forecast_date: '2026-05-15', responsible_id: 'u2', source: 'Website', last_interaction: '2026-03-20', next_activity: 'Agendar demo', stage_history: [{ stage: 'novo_lead', date: '2026-03-20' }], created_at: '2026-03-20T10:00:00Z', updated_at: '2026-03-20T10:00:00Z' },
  { id: 'd2', lead_id: 'l2', name: 'Demo StartupXYZ', value: 12000, stage: 'contactado', pipeline: 'vendas', priority: 'media', probability: 50, forecast_date: '2026-04-30', responsible_id: 'u3', source: 'LinkedIn', last_interaction: '2026-03-19', next_activity: 'Demo 25/03', stage_history: [{ stage: 'novo_lead', date: '2026-03-18' }, { stage: 'contactado', date: '2026-03-19' }], created_at: '2026-03-18T14:00:00Z', updated_at: '2026-03-19T09:00:00Z' },
  { id: 'd3', lead_id: 'l3', name: 'Proposta Corp - Roberto', value: 85000, stage: 'proposta', pipeline: 'vendas', priority: 'urgente', probability: 75, forecast_date: '2026-04-10', responsible_id: 'u4', source: 'Indicação', last_interaction: '2026-03-21', next_activity: 'Follow-up proposta', stage_history: [{ stage: 'novo_lead', date: '2026-03-15' }, { stage: 'contactado', date: '2026-03-17' }, { stage: 'proposta', date: '2026-03-21' }], created_at: '2026-03-15T08:00:00Z', updated_at: '2026-03-21T16:00:00Z' },
  { id: 'd4', customer_id: 'c1', name: 'Upgrade TechCorp', value: 65000, stage: 'proposta', pipeline: 'vendas', priority: 'alta', probability: 80, forecast_date: '2026-04-20', responsible_id: 'u2', source: 'Upsell', last_interaction: '2026-03-18', next_activity: 'Reunião decisão', stage_history: [{ stage: 'novo_lead', date: '2026-03-10' }, { stage: 'contactado', date: '2026-03-12' }, { stage: 'proposta', date: '2026-03-18' }], created_at: '2026-03-10T10:00:00Z', updated_at: '2026-03-18T10:00:00Z' },
  { id: 'd5', customer_id: 'c2', name: 'Renovação StartupXYZ', value: 15000, stage: 'ganho', pipeline: 'vendas', priority: 'media', probability: 100, responsible_id: 'u3', source: 'Renovação', last_interaction: '2026-03-15', stage_history: [{ stage: 'novo_lead', date: '2026-02-01' }, { stage: 'proposta', date: '2026-02-20' }, { stage: 'ganho', date: '2026-03-15' }], created_at: '2026-02-01T10:00:00Z', updated_at: '2026-03-15T10:00:00Z' },
  { id: 'd6', lead_id: 'l5', name: 'Projeto Agência', value: 22000, stage: 'perdido', pipeline: 'vendas', priority: 'media', probability: 0, responsible_id: 'u5', source: 'Website', last_interaction: '2026-03-17', stage_history: [{ stage: 'novo_lead', date: '2026-03-10' }, { stage: 'contactado', date: '2026-03-12' }, { stage: 'proposta', date: '2026-03-14' }, { stage: 'perdido', date: '2026-03-17' }], created_at: '2026-03-10T11:00:00Z', updated_at: '2026-03-17T15:00:00Z' },
  { id: 'd7', lead_id: 'l6', name: 'Varejo Julia', value: 35000, stage: 'contactado', pipeline: 'vendas', priority: 'alta', probability: 40, forecast_date: '2026-05-01', responsible_id: 'u3', source: 'Evento', last_interaction: '2026-03-20', next_activity: 'Enviar material', stage_history: [{ stage: 'novo_lead', date: '2026-03-12' }, { stage: 'contactado', date: '2026-03-20' }], created_at: '2026-03-12T13:00:00Z', updated_at: '2026-03-20T10:00:00Z' },
  { id: 'd8', lead_id: 'l7', name: 'Contrato LogBrasil', value: 52000, stage: 'novo_lead', pipeline: 'vendas', priority: 'media', probability: 20, forecast_date: '2026-06-01', responsible_id: 'u4', source: 'Indicação', last_interaction: '2026-03-25', next_activity: 'Primeiro contato', stage_history: [{ stage: 'novo_lead', date: '2026-03-25' }], created_at: '2026-03-25T09:00:00Z', updated_at: '2026-03-25T09:00:00Z' },

  // Imobiliario pipeline
  { id: 'd9', customer_id: 'c4', name: 'Lote Alphaville - Horizonte', value: 1200000, stage: 'proposta', pipeline: 'imobiliario', priority: 'urgente', probability: 60, forecast_date: '2026-04-30', responsible_id: 'u5', source: 'Indicação', last_interaction: '2026-03-28', next_activity: 'Visita ao terreno', stage_history: [{ stage: 'novo_lead', date: '2026-03-01' }, { stage: 'contactado', date: '2026-03-10' }, { stage: 'proposta', date: '2026-03-25' }], created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-28T10:00:00Z' },
  { id: 'd10', name: 'Apartamento Centro SP', value: 680000, stage: 'contactado', pipeline: 'imobiliario', priority: 'alta', probability: 35, forecast_date: '2026-05-30', responsible_id: 'u5', source: 'Portal', last_interaction: '2026-03-26', next_activity: 'Agendar visita', stage_history: [{ stage: 'novo_lead', date: '2026-03-20' }, { stage: 'contactado', date: '2026-03-26' }], created_at: '2026-03-20T10:00:00Z', updated_at: '2026-03-26T10:00:00Z' },
  { id: 'd11', name: 'Casa Jardins - Família Pereira', value: 950000, stage: 'novo_lead', pipeline: 'imobiliario', priority: 'media', probability: 15, responsible_id: 'u2', source: 'Website', last_interaction: '2026-03-29', stage_history: [{ stage: 'novo_lead', date: '2026-03-29' }], created_at: '2026-03-29T10:00:00Z', updated_at: '2026-03-29T10:00:00Z' },
  { id: 'd12', name: 'Sala Comercial Faria Lima', value: 420000, stage: 'ganho', pipeline: 'imobiliario', priority: 'alta', probability: 100, responsible_id: 'u5', source: 'Indicação', last_interaction: '2026-03-10', stage_history: [{ stage: 'novo_lead', date: '2026-01-15' }, { stage: 'contactado', date: '2026-02-01' }, { stage: 'proposta', date: '2026-02-20' }, { stage: 'ganho', date: '2026-03-10' }], created_at: '2026-01-15T10:00:00Z', updated_at: '2026-03-10T10:00:00Z' },

  // Marketing pipeline
  { id: 'd13', name: 'Campanha Black Friday', value: 28000, stage: 'proposta', pipeline: 'marketing', priority: 'alta', probability: 70, forecast_date: '2026-04-15', responsible_id: 'u2', source: 'Inbound', last_interaction: '2026-03-27', next_activity: 'Aprovar briefing', stage_history: [{ stage: 'novo_lead', date: '2026-03-10' }, { stage: 'contactado', date: '2026-03-15' }, { stage: 'proposta', date: '2026-03-27' }], created_at: '2026-03-10T10:00:00Z', updated_at: '2026-03-27T10:00:00Z' },
  { id: 'd14', name: 'Branding Redesign', value: 45000, stage: 'contactado', pipeline: 'marketing', priority: 'media', probability: 45, forecast_date: '2026-05-01', responsible_id: 'u3', source: 'Outbound', last_interaction: '2026-03-22', next_activity: 'Apresentar portfólio', stage_history: [{ stage: 'novo_lead', date: '2026-03-15' }, { stage: 'contactado', date: '2026-03-22' }], created_at: '2026-03-15T10:00:00Z', updated_at: '2026-03-22T10:00:00Z' },
  { id: 'd15', name: 'SEO Anual - Varejo Nacional', value: 36000, stage: 'ganho', pipeline: 'marketing', priority: 'media', probability: 100, responsible_id: 'u2', source: 'Upsell', last_interaction: '2026-03-05', stage_history: [{ stage: 'novo_lead', date: '2026-02-01' }, { stage: 'proposta', date: '2026-02-15' }, { stage: 'ganho', date: '2026-03-05' }], created_at: '2026-02-01T10:00:00Z', updated_at: '2026-03-05T10:00:00Z' },
  { id: 'd16', name: 'Social Media Pack', value: 18000, stage: 'novo_lead', pipeline: 'marketing', priority: 'baixa', probability: 10, responsible_id: 'u3', source: 'Inbound', last_interaction: '2026-03-30', stage_history: [{ stage: 'novo_lead', date: '2026-03-30' }], created_at: '2026-03-30T10:00:00Z', updated_at: '2026-03-30T10:00:00Z' },
];

export const mockInteractions: Interaction[] = [
  { id: 'i1', lead_id: 'l1', type: 'nota', description: 'Lead chegou pelo formulário do site, demonstrou interesse no plano enterprise.', user_id: 'u2', date: '2026-03-20T10:00:00Z', created_at: '2026-03-20T10:00:00Z' },
  { id: 'i2', lead_id: 'l2', type: 'ligacao', description: 'Primeira ligação de qualificação. Ana está avaliando 3 soluções.', user_id: 'u3', date: '2026-03-18T15:00:00Z', created_at: '2026-03-18T15:00:00Z' },
  { id: 'i3', lead_id: 'l2', type: 'reuniao', description: 'Demo agendada para 25/03 às 14h via Zoom.', user_id: 'u3', date: '2026-03-19T09:00:00Z', created_at: '2026-03-19T09:00:00Z' },
  { id: 'i4', lead_id: 'l3', deal_id: 'd3', type: 'mensagem', description: 'Enviada proposta comercial por email. Valor: R$ 85.000/ano.', user_id: 'u4', date: '2026-03-21T16:00:00Z', created_at: '2026-03-21T16:00:00Z' },
  { id: 'i5', customer_id: 'c1', deal_id: 'd4', type: 'reuniao', description: 'Reunião trimestral de acompanhamento. Satisfação alta.', user_id: 'u2', date: '2026-03-15T10:00:00Z', created_at: '2026-03-15T10:00:00Z' },
  { id: 'i6', lead_id: 'l6', type: 'nota', description: 'Conheceu no Web Summit, muito interessada na plataforma.', user_id: 'u3', date: '2026-03-12T13:00:00Z', created_at: '2026-03-12T13:00:00Z' },
  { id: 'i7', lead_id: 'l3', deal_id: 'd3', type: 'ligacao', description: 'Roberto confirmou interesse. Próximo passo: reunião com diretoria.', user_id: 'u4', date: '2026-03-19T14:00:00Z', created_at: '2026-03-19T14:00:00Z' },
  { id: 'i8', customer_id: 'c3', type: 'reuniao', description: 'Reunião de revisão de contrato. 150 usuários ativos. Satisfeitos.', user_id: 'u2', date: '2026-03-28T10:00:00Z', created_at: '2026-03-28T10:00:00Z' },
  { id: 'i9', customer_id: 'c4', deal_id: 'd9', type: 'mensagem', description: 'Proposta de lote enviada por email. Aguardando retorno.', user_id: 'u5', date: '2026-03-28T15:00:00Z', created_at: '2026-03-28T15:00:00Z' },
  { id: 'i10', lead_id: 'l7', type: 'nota', description: 'Pedro indicado pelo Roberto Santos. Empresa de logística com potencial alto.', user_id: 'u4', date: '2026-03-25T09:30:00Z', created_at: '2026-03-25T09:30:00Z' },
  { id: 'i11', lead_id: 'l8', type: 'ligacao', description: 'Fernanda quer entender funcionalidades do módulo educacional.', user_id: 'u2', date: '2026-03-26T14:00:00Z', created_at: '2026-03-26T14:00:00Z' },
  { id: 'i12', customer_id: 'c1', type: 'mensagem', description: 'Enviado relatório mensal de uso. Engajamento acima de 90%.', user_id: 'u2', date: '2026-03-28T09:00:00Z', created_at: '2026-03-28T09:00:00Z' },
];

export const mockActivities: Activity[] = [
  { id: 'a1', title: 'Demo com Ana Oliveira', description: 'Demonstrar módulo de pipeline e dashboard', type: 'reuniao', status: 'pendente', priority: 'alta', lead_id: 'l2', deal_id: 'd2', responsible_id: 'u3', due_date: '2026-04-02T14:00:00Z', created_at: '2026-03-19T09:00:00Z' },
  { id: 'a2', title: 'Follow-up proposta Roberto', description: 'Ligar para saber decisão da diretoria', type: 'follow_up', status: 'pendente', priority: 'urgente', lead_id: 'l3', deal_id: 'd3', responsible_id: 'u4', due_date: '2026-04-02T10:00:00Z', created_at: '2026-03-21T16:00:00Z' },
  { id: 'a3', title: 'Enviar material para Julia', description: 'Case studies do segmento varejo', type: 'email', status: 'pendente', priority: 'media', lead_id: 'l6', deal_id: 'd7', responsible_id: 'u3', due_date: '2026-04-03T09:00:00Z', created_at: '2026-03-20T10:00:00Z' },
  { id: 'a4', title: 'Reunião decisão TechCorp', description: 'Apresentar proposta de upgrade ao CEO', type: 'reuniao', status: 'pendente', priority: 'alta', customer_id: 'c1', deal_id: 'd4', responsible_id: 'u2', due_date: '2026-04-04T15:00:00Z', created_at: '2026-03-18T10:00:00Z' },
  { id: 'a5', title: 'Qualificar lead Pedro Henrique', description: 'Primeiro contato telefônico', type: 'ligacao', status: 'pendente', priority: 'media', lead_id: 'l7', deal_id: 'd8', responsible_id: 'u4', due_date: '2026-04-02T11:00:00Z', created_at: '2026-03-25T09:00:00Z' },
  { id: 'a6', title: 'Visita terreno Alphaville', description: 'Acompanhar cliente Horizonte na visita', type: 'visita', status: 'pendente', priority: 'urgente', customer_id: 'c4', deal_id: 'd9', responsible_id: 'u5', due_date: '2026-04-03T10:00:00Z', created_at: '2026-03-28T10:00:00Z' },
  { id: 'a7', title: 'Revisar proposta Mariana Costa', description: 'Preparar proposta personalizada para PME', type: 'tarefa', status: 'pendente', priority: 'baixa', lead_id: 'l4', responsible_id: 'u2', due_date: '2026-04-05T17:00:00Z', created_at: '2026-03-22T09:00:00Z' },
  { id: 'a8', title: 'Check-in Varejo Nacional', description: 'Reunião mensal de acompanhamento', type: 'reuniao', status: 'concluida', priority: 'media', customer_id: 'c3', responsible_id: 'u2', due_date: '2026-03-28T10:00:00Z', completed_at: '2026-03-28T11:00:00Z', created_at: '2026-03-20T10:00:00Z' },
  { id: 'a9', title: 'Enviar contrato renovação StartupXYZ', description: 'Contrato anual aprovado', type: 'tarefa', status: 'concluida', priority: 'alta', customer_id: 'c2', deal_id: 'd5', responsible_id: 'u3', due_date: '2026-03-15T12:00:00Z', completed_at: '2026-03-15T10:00:00Z', created_at: '2026-03-10T10:00:00Z' },
  { id: 'a10', title: 'Aprovar briefing Black Friday', description: 'Revisar e aprovar briefing da campanha', type: 'tarefa', status: 'pendente', priority: 'alta', deal_id: 'd13', responsible_id: 'u2', due_date: '2026-04-02T17:00:00Z', created_at: '2026-03-27T10:00:00Z' },
  { id: 'a11', title: 'Ligar para Fernanda Rocha', description: 'Segunda ligação de qualificação', type: 'ligacao', status: 'atrasada', priority: 'media', lead_id: 'l8', responsible_id: 'u2', due_date: '2026-03-30T10:00:00Z', created_at: '2026-03-26T14:00:00Z' },
  { id: 'a12', title: 'Follow-up Clínica Saúde+', description: 'Reativar relacionamento com cliente inativo', type: 'follow_up', status: 'pendente', priority: 'baixa', customer_id: 'c5', responsible_id: 'u2', due_date: '2026-04-07T10:00:00Z', created_at: '2026-03-30T10:00:00Z' },
];

// Helper functions
export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id);
}

export function getLeadById(id: string): Lead | undefined {
  return mockLeads.find(l => l.id === id);
}

export function getCustomerById(id: string): Customer | undefined {
  return mockCustomers.find(c => c.id === id);
}

export function getDealById(id: string): Deal | undefined {
  return mockDeals.find(d => d.id === id);
}

export function getDealsByLeadId(leadId: string): Deal[] {
  return mockDeals.filter(d => d.lead_id === leadId);
}

export function getDealsByCustomerId(customerId: string): Deal[] {
  return mockDeals.filter(d => d.customer_id === customerId);
}

export function getInteractionsByLeadId(leadId: string): Interaction[] {
  return mockInteractions.filter(i => i.lead_id === leadId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getInteractionsByCustomerId(customerId: string): Interaction[] {
  return mockInteractions.filter(i => i.customer_id === customerId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getInteractionsByDealId(dealId: string): Interaction[] {
  return mockInteractions.filter(i => i.deal_id === dealId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getActivitiesByLeadId(leadId: string): Activity[] {
  return mockActivities.filter(a => a.lead_id === leadId);
}

export function getActivitiesByCustomerId(customerId: string): Activity[] {
  return mockActivities.filter(a => a.customer_id === customerId);
}

export function getActivitiesByDealId(dealId: string): Activity[] {
  return mockActivities.filter(a => a.deal_id === dealId);
}
