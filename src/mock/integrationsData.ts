// Integrações & Automações — Dados Mockados

export interface ConnectedBank {
  id: string;
  name: string;
  type: string;
  agency: string;
  account: string;
  status: "connected" | "unstable" | "disconnected";
  lastSync: string;
  syncMethod: string;
  color: string;
}

export const connectedBanks: ConnectedBank[] = [
  { id: "itau", name: "Itaú Unibanco", type: "Conta Corrente", agency: "0032", account: "12345-6", status: "connected", lastSync: "há 4 min", syncMethod: "Open Finance", color: "hsl(24, 100%, 50%)" },
  { id: "bb", name: "Banco do Brasil", type: "Conta Corrente", agency: "1234", account: "56789-0", status: "connected", lastSync: "há 12 min", syncMethod: "API Direta", color: "hsl(45, 100%, 50%)" },
  { id: "caixa", name: "Caixa Econômica", type: "Conta Corrente", agency: "0891", account: "34567-8", status: "unstable", lastSync: "há 3 horas", syncMethod: "Open Finance", color: "hsl(200, 100%, 40%)" },
];

export const availableBanks = [
  { id: "bradesco", name: "Bradesco", logo: "🏦" },
  { id: "santander", name: "Santander", logo: "🏦" },
  { id: "sicoob", name: "Sicoob", logo: "🏦" },
  { id: "nubank", name: "Nubank", logo: "🏦" },
  { id: "inter", name: "Banco Inter", logo: "🏦" },
];

export const reconciliationStats = {
  autoReconciled: 847,
  pendingExceptions: 12,
  autoRate: 98.6,
  monthlyTransactions: 859,
};

// ═══ CENTRAL DE INTEGRAÇÕES ═══

export interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  connected: boolean;
  lastEvent?: string;
  dataVolume?: string;
}

export const integrations: Integration[] = [
  { id: "omie", name: "Omie", category: "ERP / Contabilidade", description: "Sincronização automática de lançamentos contábeis", icon: "📊", connected: true, lastEvent: "há 8 min", dataVolume: "12.480 registros" },
  { id: "plugnotas", name: "Plugnotas", category: "Emissão NF-e", description: "Emissão e recebimento automático de NF-e", icon: "🧾", connected: true, lastEvent: "há 22 min", dataVolume: "3.247 notas" },
  { id: "hubspot", name: "HubSpot", category: "CRM", description: "Sincronização de clientes, deals e faturamento", icon: "🎯", connected: true, lastEvent: "há 1 hora", dataVolume: "847 contatos" },
  { id: "stripe", name: "Stripe", category: "Pagamentos", description: "Gestão de cobranças e recebimentos online", icon: "💳", connected: true, lastEvent: "há 5 min", dataVolume: "R$ 2.4M processados" },
  { id: "n8n", name: "n8n / Zapier", category: "Automações", description: "Workflows e automações entre sistemas", icon: "⚡", connected: false },
  { id: "powerbi", name: "Power BI / Metabase", category: "BI & Analytics", description: "Dashboards avançados e relatórios customizados", icon: "📈", connected: false },
  { id: "slack", name: "Slack", category: "Notificações", description: "Alertas e notificações em canais", icon: "💬", connected: false },
  { id: "whatsapp", name: "WhatsApp Business", category: "Alertas", description: "Alertas críticos via WhatsApp", icon: "📱", connected: false },
  { id: "sap", name: "SAP / TOTVS", category: "ERP Legado", description: "Integração com ERP legado", icon: "🏢", connected: false },
  { id: "contaazul", name: "Conta Azul / QuickBooks", category: "Contabilidade", description: "Contabilidade simplificada", icon: "📒", connected: false },
];

// ═══ WEBHOOKS E GATILHOS ═══

export interface Trigger {
  id: number;
  name: string;
  condition: string;
  conditionDetail: string;
  actions: string[];
  active: boolean;
  timesTriggered: number;
  lastTriggered?: string;
}

export const triggers: Trigger[] = [
  {
    id: 1,
    name: "Despesa de alto valor",
    condition: "Novo lançamento > R$ 10.000",
    conditionDetail: "Qualquer despesa operacional acima do limite",
    actions: ["Enviar alerta no Slack #financeiro", "Iniciar fluxo de aprovação"],
    active: true,
    timesTriggered: 8,
    lastTriggered: "08/03 14:32",
  },
  {
    id: 2,
    name: "Cliente inadimplente",
    condition: "Fatura vencida > 5 dias",
    conditionDetail: "Contas a receber com atraso superior a 5 dias",
    actions: ["Enviar e-mail automático de cobrança", "Criar tarefa no CRM"],
    active: true,
    timesTriggered: 23,
    lastTriggered: "08/03 09:15",
  },
  {
    id: 3,
    name: "Caixa abaixo do mínimo",
    condition: "Saldo < R$ 500.000",
    conditionDetail: "Saldo total disponível abaixo da reserva mínima",
    actions: ["Alertar CEO + CFO via WhatsApp"],
    active: true,
    timesTriggered: 0,
  },
  {
    id: 4,
    name: "Novo recebimento grande",
    condition: "Recebimento > R$ 50.000",
    conditionDetail: "Entrada de valor alto identificada",
    actions: ["Notificar Financeiro", "Registrar no log"],
    active: false,
    timesTriggered: 5,
    lastTriggered: "06/03 11:20",
  },
];

export interface TriggerLog {
  id: number;
  triggerId: number;
  triggerName: string;
  timestamp: string;
  data: string;
  actionExecuted: string;
  status: "success" | "failed";
}

export const triggerLogs: TriggerLog[] = [
  { id: 1, triggerId: 1, triggerName: "Despesa de alto valor", timestamp: "08/03 14:32", data: "Despesa #4821 — R$ 12.800", actionExecuted: "Slack + Aprovação", status: "success" },
  { id: 2, triggerId: 2, triggerName: "Cliente inadimplente", timestamp: "08/03 09:15", data: "Empresa XYZ — R$ 87.000 (45 dias)", actionExecuted: "E-mail + CRM", status: "success" },
  { id: 3, triggerId: 2, triggerName: "Cliente inadimplente", timestamp: "07/03 16:40", data: "Empresa ABC — R$ 34.200 (12 dias)", actionExecuted: "E-mail + CRM", status: "success" },
  { id: 4, triggerId: 1, triggerName: "Despesa de alto valor", timestamp: "07/03 11:05", data: "CAPEX #087 — R$ 45.000", actionExecuted: "Slack + Aprovação", status: "success" },
  { id: 5, triggerId: 2, triggerName: "Cliente inadimplente", timestamp: "06/03 14:22", data: "Empresa DEF — R$ 15.600 (8 dias)", actionExecuted: "E-mail enviado", status: "failed" },
];

// ═══ API EXPLORER ═══

export const apiEndpoints = [
  { method: "GET", path: "/api/v1/transactions", description: "Listar transações", auth: true },
  { method: "POST", path: "/api/v1/transactions", description: "Criar lançamento", auth: true },
  { method: "GET", path: "/api/v1/cashflow", description: "Fluxo de caixa atual", auth: true },
  { method: "GET", path: "/api/v1/dre", description: "DRE do período", auth: true },
  { method: "GET", path: "/api/v1/kpis", description: "KPIs e indicadores", auth: true },
  { method: "POST", path: "/api/v1/webhooks", description: "Registrar webhook", auth: true },
  { method: "GET", path: "/api/v1/accounts", description: "Contas bancárias", auth: true },
  { method: "GET", path: "/api/v1/reports/{id}", description: "Relatório específico", auth: true },
];

export const apiLogs = [
  { id: 1, timestamp: "14:32:15", method: "GET", path: "/api/v1/transactions", status: 200, latency: "45ms" },
  { id: 2, timestamp: "14:31:48", method: "POST", path: "/api/v1/transactions", status: 201, latency: "120ms" },
  { id: 3, timestamp: "14:30:22", method: "GET", path: "/api/v1/cashflow", status: 200, latency: "38ms" },
  { id: 4, timestamp: "14:29:55", method: "GET", path: "/api/v1/kpis", status: 200, latency: "52ms" },
  { id: 5, timestamp: "14:28:10", method: "POST", path: "/api/v1/webhooks", status: 400, latency: "15ms" },
  { id: 6, timestamp: "14:27:33", method: "GET", path: "/api/v1/accounts", status: 200, latency: "41ms" },
  { id: 7, timestamp: "14:25:18", method: "GET", path: "/api/v1/reports/42", status: 200, latency: "180ms" },
  { id: 8, timestamp: "14:24:01", method: "POST", path: "/api/v1/transactions", status: 500, latency: "2100ms" },
  { id: 9, timestamp: "14:22:45", method: "GET", path: "/api/v1/dre", status: 200, latency: "67ms" },
  { id: 10, timestamp: "14:20:30", method: "GET", path: "/api/v1/transactions", status: 200, latency: "43ms" },
];

export const apiUsage = {
  rateLimit: { perMinute: 1000, perDay: 50000 },
  currentUsage: { minute: 12, day: 5840 },
  usagePercent: 11.7,
};
