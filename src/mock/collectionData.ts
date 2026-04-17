export type CollectionChannel = "email" | "whatsapp" | "sms" | "phone" | "internal";
export type DebtorStatus = "aguardando" | "respondeu" | "negociacao" | "urgente" | "pausado" | "quitado" | "perda";

export interface CollectionStage {
  id: string;
  day: number; // negative = before due, positive = after due
  label: string;
  description: string;
  channels: CollectionChannel[];
  template: string;
  tone: string;
  autoFee?: { penalty: number; interest: number };
  escalateTo?: string;
  createTask?: string;
  actions?: string[];
}

export interface Debtor {
  id: string;
  company: string;
  cnpj: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  value: number;
  dueDate: string;
  daysOverdue: number;
  currentStage: string;
  nextAction: string;
  nextActionDate?: string;
  status: DebtorStatus;
  promisedPayment?: { date: string; value: number };
  history: CollectionEvent[];
}

export interface CollectionEvent {
  id: string;
  date: string;
  type: "email" | "whatsapp" | "sms" | "phone" | "internal" | "payment" | "promise" | "note";
  stage?: string;
  description: string;
  status: "sent" | "opened" | "clicked" | "replied" | "failed" | "completed";
  openedAt?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: CollectionChannel;
  subject?: string;
  body: string;
  variables: string[];
}

export const collectionStages: CollectionStage[] = [
  {
    id: "d-5",
    day: -5,
    label: "D-5",
    description: "Lembrete amigável pré-vencimento",
    channels: ["email"],
    template: "Olá [Nome], sua fatura de R$ [Valor] vence em 5 dias. [LinkBoleto]",
    tone: "Amigável e informativo",
  },
  {
    id: "d0",
    day: 0,
    label: "D0",
    description: "Confirmação de vencimento",
    channels: ["email", "whatsapp"],
    template: "Olá [Nome], hoje vence sua fatura de R$ [Valor]. [LinkBoleto] [LinkPIX]",
    tone: "Informativo",
  },
  {
    id: "d3",
    day: 3,
    label: "D+3",
    description: "Primeiro contato pós-vencimento",
    channels: ["email", "whatsapp"],
    template: "Identificamos que sua fatura de R$ [Valor] ainda está em aberto. Podemos ajudar? [LinkBoleto]",
    tone: "Prestativo, sem acusação",
  },
  {
    id: "d7",
    day: 7,
    label: "D+7",
    description: "Segundo contato — urgência moderada",
    channels: ["email", "whatsapp"],
    template: "Prezado(a) [Nome], sua fatura de R$ [Valor] está com [DiasAtraso] dias de atraso. Entre em contato para regularizar.",
    tone: "Formal mas cordial",
    autoFee: { penalty: 2, interest: 1 },
    escalateTo: "Gestor de CS",
  },
  {
    id: "d15",
    day: 15,
    label: "D+15",
    description: "Escalada para gerência",
    channels: ["email", "internal"],
    template: "Conforme cláusula [X] do contrato, informamos que o débito de R$ [Valor] permanece em aberto há [DiasAtraso] dias.",
    tone: "Formal, menciona cláusula contratual",
    escalateTo: "CFO",
    createTask: "Time comercial entrar em contato",
  },
  {
    id: "d30",
    day: 30,
    label: "D+30",
    description: "Proposta de acordo",
    channels: ["email", "whatsapp"],
    template: "Prezado(a) [Nome], gostaríamos de propor um acordo para quitação do débito de R$ [Valor]. Podemos parcelar em até 2x.",
    tone: "Negociação",
    createTask: "Enviar proposta personalizada",
  },
  {
    id: "d60",
    day: 60,
    label: "D+60",
    description: "Negativação e cobrança jurídica",
    channels: ["email"],
    template: "NOTIFICAÇÃO EXTRAJUDICIAL: O débito de R$ [Valor], vencido há [DiasAtraso] dias, será encaminhado para negativação e cobrança jurídica.",
    tone: "Formal jurídico",
    actions: ["Marcar para negativação Serasa", "Alertar jurídico"],
  },
];

export const debtors: Debtor[] = [
  {
    id: "DEB-001",
    company: "Empresa ABC",
    cnpj: "12.345.678/0001-90",
    contactName: "João Silva",
    contactEmail: "joao@empresaabc.com.br",
    contactPhone: "(11) 99999-1234",
    value: 28400,
    dueDate: "2025-03-01",
    daysOverdue: 8,
    currentStage: "d7",
    nextAction: "Escalada gerência",
    nextActionDate: "2025-03-10",
    status: "aguardando",
    history: [
      { id: "h1", date: "2025-02-24", type: "email", stage: "D-5", description: "E-mail D-5 enviado", status: "opened", openedAt: "2025-02-24 10:23" },
      { id: "h2", date: "2025-03-01", type: "email", stage: "D0", description: "E-mail D0 enviado", status: "opened", openedAt: "2025-03-01 08:15" },
      { id: "h3", date: "2025-03-01", type: "whatsapp", stage: "D0", description: "WhatsApp D0 enviado", status: "sent" },
      { id: "h4", date: "2025-03-04", type: "email", stage: "D+3", description: "E-mail D+3 enviado", status: "opened", openedAt: "2025-03-04 14:32" },
      { id: "h5", date: "2025-03-08", type: "email", stage: "D+7", description: "E-mail D+7 enviado automaticamente", status: "sent" },
    ],
  },
  {
    id: "DEB-002",
    company: "Startup XYZ",
    cnpj: "23.456.789/0001-01",
    contactName: "Maria Costa",
    contactEmail: "maria@startupxyz.io",
    contactPhone: "(11) 98888-5678",
    value: 8750,
    dueDate: "2025-03-06",
    daysOverdue: 3,
    currentStage: "d3",
    nextAction: "✅ Enviado hoje",
    status: "respondeu",
    history: [
      { id: "h1", date: "2025-03-01", type: "email", stage: "D-5", description: "E-mail D-5 enviado", status: "opened" },
      { id: "h2", date: "2025-03-06", type: "email", stage: "D0", description: "E-mail D0 enviado", status: "opened" },
      { id: "h3", date: "2025-03-09", type: "email", stage: "D+3", description: "E-mail D+3 enviado", status: "replied" },
    ],
  },
  {
    id: "DEB-003",
    company: "MicroBR Ltda",
    cnpj: "34.567.890/0001-12",
    contactName: "Carlos Souza",
    contactEmail: "carlos@microbr.com.br",
    contactPhone: "(21) 97777-9012",
    value: 4200,
    dueDate: "2025-02-06",
    daysOverdue: 31,
    currentStage: "d30",
    nextAction: "Proposta enviada",
    status: "negociacao",
    promisedPayment: { date: "2025-03-15", value: 4200 },
    history: [
      { id: "h1", date: "2025-02-01", type: "email", stage: "D-5", description: "E-mail D-5 enviado", status: "sent" },
      { id: "h2", date: "2025-02-06", type: "email", stage: "D0", description: "E-mail D0 enviado", status: "opened" },
      { id: "h3", date: "2025-02-09", type: "email", stage: "D+3", description: "E-mail D+3 enviado", status: "opened" },
      { id: "h4", date: "2025-02-13", type: "email", stage: "D+7", description: "E-mail D+7 enviado", status: "sent" },
      { id: "h5", date: "2025-02-21", type: "email", stage: "D+15", description: "E-mail D+15 enviado", status: "opened" },
      { id: "h6", date: "2025-03-08", type: "email", stage: "D+30", description: "Proposta de acordo enviada", status: "replied" },
      { id: "h7", date: "2025-03-08", type: "promise", description: "Cliente prometeu pagar em 15/03", status: "completed" },
    ],
  },
  {
    id: "DEB-004",
    company: "Comércio Sul",
    cnpj: "45.678.901/0001-23",
    contactName: "Ana Oliveira",
    contactEmail: "ana@comerciosul.com.br",
    contactPhone: "(51) 96666-3456",
    value: 62000,
    dueDate: "2025-01-01",
    daysOverdue: 67,
    currentStage: "d60",
    nextAction: "Negativar Serasa",
    nextActionDate: "2025-03-12",
    status: "urgente",
    history: [
      { id: "h1", date: "2024-12-27", type: "email", stage: "D-5", description: "E-mail D-5 enviado", status: "sent" },
      { id: "h2", date: "2025-01-01", type: "email", stage: "D0", description: "E-mail D0 enviado", status: "sent" },
      { id: "h3", date: "2025-01-04", type: "email", stage: "D+3", description: "E-mail D+3 enviado", status: "sent" },
      { id: "h4", date: "2025-01-08", type: "email", stage: "D+7", description: "E-mail D+7 enviado", status: "sent" },
      { id: "h5", date: "2025-01-16", type: "phone", description: "Ligação realizada — sem resposta", status: "failed" },
      { id: "h6", date: "2025-01-31", type: "email", stage: "D+30", description: "Proposta de acordo enviada", status: "sent" },
      { id: "h7", date: "2025-03-01", type: "email", stage: "D+60", description: "Notificação extrajudicial enviada", status: "sent" },
    ],
  },
  {
    id: "DEB-005",
    company: "Tech Solutions",
    cnpj: "56.789.012/0001-34",
    contactName: "Pedro Lima",
    contactEmail: "pedro@techsolutions.com.br",
    contactPhone: "(11) 95555-7890",
    value: 15800,
    dueDate: "2025-03-02",
    daysOverdue: 7,
    currentStage: "d7",
    nextAction: "Aguardando resposta",
    status: "aguardando",
    history: [],
  },
  {
    id: "DEB-006",
    company: "Distribuidora Norte",
    cnpj: "67.890.123/0001-45",
    contactName: "Fernanda Santos",
    contactEmail: "fernanda@distnorte.com.br",
    contactPhone: "(92) 94444-1234",
    value: 42300,
    dueDate: "2025-02-15",
    daysOverdue: 22,
    currentStage: "d15",
    nextAction: "Escalada CFO",
    status: "aguardando",
    history: [],
  },
  {
    id: "DEB-007",
    company: "Varejo Express",
    cnpj: "78.901.234/0001-56",
    contactName: "Ricardo Almeida",
    contactEmail: "ricardo@varejoexp.com.br",
    contactPhone: "(31) 93333-5678",
    value: 9500,
    dueDate: "2025-03-05",
    daysOverdue: 4,
    currentStage: "d3",
    nextAction: "Segundo contato em 3d",
    status: "aguardando",
    history: [],
  },
  {
    id: "DEB-008",
    company: "Indústria Paulista",
    cnpj: "89.012.345/0001-67",
    contactName: "Marcos Pereira",
    contactEmail: "marcos@indpaulista.com.br",
    contactPhone: "(11) 92222-9012",
    value: 128000,
    dueDate: "2025-01-20",
    daysOverdue: 48,
    currentStage: "d30",
    nextAction: "Aguardando proposta",
    status: "negociacao",
    promisedPayment: { date: "2025-03-20", value: 64000 },
    history: [],
  },
];

export const messageTemplates: MessageTemplate[] = [
  {
    id: "t1",
    name: "Lembrete pré-vencimento",
    channel: "email",
    subject: "Sua fatura vence em breve",
    body: "Olá [Nome],\n\nSua fatura de R$ [Valor] vence em [Vencimento].\n\nPara sua comodidade, segue o link para pagamento:\n[LinkBoleto]\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\n[NomeEmpresa]",
    variables: ["Nome", "Valor", "Vencimento", "LinkBoleto", "NomeEmpresa"],
  },
  {
    id: "t2",
    name: "Notificação de vencimento",
    channel: "whatsapp",
    body: "Olá [Nome]! 👋\n\nHoje vence sua fatura de R$ [Valor].\n\n📄 Boleto: [LinkBoleto]\n⚡ PIX: [LinkPIX]\n\nQualquer dúvida, responda esta mensagem!",
    variables: ["Nome", "Valor", "LinkBoleto", "LinkPIX"],
  },
  {
    id: "t3",
    name: "Primeiro contato pós-vencimento",
    channel: "email",
    subject: "Identificamos uma pendência",
    body: "Olá [Nome],\n\nIdentificamos que sua fatura de R$ [Valor], vencida em [Vencimento], ainda está em aberto.\n\nPodemos ajudar com alguma dúvida ou dificuldade?\n\n[LinkBoleto]\n\nAtenciosamente,\n[NomeEmpresa]",
    variables: ["Nome", "Valor", "Vencimento", "LinkBoleto", "NomeEmpresa"],
  },
  {
    id: "t4",
    name: "Notificação extrajudicial",
    channel: "email",
    subject: "NOTIFICAÇÃO EXTRAJUDICIAL - Débito em aberto",
    body: "Prezado(a) [Nome],\n\nNOTIFICAÇÃO EXTRAJUDICIAL\n\nVimos por meio desta notificar que o débito de R$ [Valor], vencido há [DiasAtraso] dias, será encaminhado para negativação nos órgãos de proteção ao crédito e cobrança jurídica, caso não seja regularizado em até 5 (cinco) dias úteis.\n\nPara regularização imediata: [LinkBoleto]\n\nAtenciosamente,\n[NomeEmpresa]\nDepartamento Financeiro",
    variables: ["Nome", "Valor", "DiasAtraso", "LinkBoleto", "NomeEmpresa"],
  },
];

export const collectionAnalytics = {
  recoveryByStage: [
    { stage: "D+3", rate: 48 },
    { stage: "D+7", rate: 31 },
    { stage: "D+15", rate: 12 },
    { stage: "D+30", rate: 6 },
    { stage: "D+60", rate: 3 },
  ],
  avgRecoveryDays: 11.4,
  recoveredThisMonth: 387200,
  unrecoveredCost: 169000,
  totalPendingActions: 12,
};
