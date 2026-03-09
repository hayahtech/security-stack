// Mock data for Contas a Pagar, Contas a Receber, and Inadimplência

import { formatCurrency } from "@/mock/financialData";

// ═══ CONTAS A RECEBER ═══

const clientNames = [
  "Alpha Tech", "Beta Solutions", "Gamma Corp", "Delta Sys", "Epsilon Digital",
  "Zeta Cloud", "Eta Software", "Theta Labs", "Iota Data", "Kappa Serviços",
  "Lambda IT", "Mu Analytics", "Nu Telecom", "Xi Consulting", "Omicron Pay",
  "Pi Networks", "Rho Digital", "Sigma Tech", "Tau Systems", "Upsilon Inc",
  "Phi Solutions", "Chi Data", "Psi Automação", "Omega Corp", "Nexus IT",
  "Vertex Labs", "Prism Digital", "Quasar Tech", "Zenith SA", "Apex Cloud",
  "Core Systems", "Fusion IT", "Helix Data", "Ionic Tech", "Jade Software",
  "Kyber Corp", "Lumen SA", "Matrix IT", "Neon Digital", "Orbit Cloud",
  "Pulse Tech", "Quantum SA", "Radix Labs", "Solar IT", "Titan Systems",
  "Ultra Corp", "Vortex SA", "Wave Digital", "Xcel Tech", "Yukon IT",
];

export type AccountStatus = "on_time" | "due_today" | "overdue_1_30" | "overdue_31_60" | "overdue_60_plus";

export interface Receivable {
  id: number;
  client: string;
  nf: string;
  value: number;
  issueDate: string;
  dueDate: string;
  daysOverdue: number;
  status: AccountStatus;
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split("T")[0];
}

function getDaysOverdue(dueDate: string): number {
  const today = new Date("2025-03-09");
  const due = new Date(dueDate);
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getStatus(days: number): AccountStatus {
  if (days < 0) return "on_time";
  if (days === 0) return "due_today";
  if (days <= 30) return "overdue_1_30";
  if (days <= 60) return "overdue_31_60";
  return "overdue_60_plus";
}

export const receivables: Receivable[] = Array.from({ length: 50 }, (_, i) => {
  const issueDate = randomDate(new Date("2024-12-01"), new Date("2025-03-05"));
  // Mix of due dates: some past, some future, some today
  let dueDate: string;
  if (i < 8) {
    dueDate = randomDate(new Date("2024-12-15"), new Date("2025-01-15")); // overdue 60+
  } else if (i < 15) {
    dueDate = randomDate(new Date("2025-01-16"), new Date("2025-02-08")); // overdue 31-60
  } else if (i < 25) {
    dueDate = randomDate(new Date("2025-02-09"), new Date("2025-03-08")); // overdue 1-30
  } else if (i < 27) {
    dueDate = "2025-03-09"; // due today
  } else {
    dueDate = randomDate(new Date("2025-03-10"), new Date("2025-04-30")); // on time
  }
  const days = getDaysOverdue(dueDate);
  const value = Math.round((50000 + Math.random() * 400000) / 100) * 100;
  return {
    id: i + 1,
    client: clientNames[i % clientNames.length],
    nf: `NF-${(20250000 + i + 1).toString()}`,
    value,
    issueDate,
    dueDate,
    daysOverdue: Math.max(0, days),
    status: getStatus(days),
  };
});

export const receivableKpis = {
  totalReceivable: 8420000,
  dueIn30Days: 3180000,
  overdue: 1240000,
  delinquencyRate: 14.7,
  avgDaysToReceive: 28,
};

// ═══ CONTAS A PAGAR ═══

const supplierNames = [
  "AWS Brasil", "Google Cloud", "Microsoft Azure", "Algar Telecom", "Vivo Empresas",
  "Energisa", "Comgás", "Locaweb", "Resultados Digitais", "Conta Azul",
  "WeWork", "99 Corporativo", "VR Benefícios", "Bradesco Seguros", "Porto Seguro",
  "Sodexo", "Flash Benefícios", "iFood Corporate", "Robert Half", "TOTVS",
  "Salesforce", "HubSpot", "Slack", "Zoom", "Adobe",
  "JetBrains", "GitHub Enterprise", "Datadog", "New Relic", "PagerDuty",
  "Zendesk", "Intercom", "SendGrid", "Twilio", "Stripe",
  "PagSeguro", "Stone", "Cielo", "Rede", "Getnet",
];

const categories = [
  "Infraestrutura", "Telecom", "Utilities", "Software", "Marketing",
  "Ocupação", "Benefícios", "Seguros", "Pessoal", "Impostos",
];

export interface Payable {
  id: number;
  supplier: string;
  description: string;
  value: number;
  dueDate: string;
  category: string;
  status: "paid" | "pending" | "overdue";
}

export const payables: Payable[] = Array.from({ length: 40 }, (_, i) => {
  const dueDate = i < 4
    ? randomDate(new Date("2025-02-20"), new Date("2025-03-05")) // overdue
    : i < 15
    ? randomDate(new Date("2025-03-09"), new Date("2025-03-16")) // next 7 days
    : randomDate(new Date("2025-03-17"), new Date("2025-05-30")); // future
  const days = getDaysOverdue(dueDate);
  const value = Math.round((5000 + Math.random() * 300000) / 100) * 100;
  return {
    id: i + 1,
    supplier: supplierNames[i % supplierNames.length],
    description: `Serviço ${categories[i % categories.length]} - ${["Jan", "Fev", "Mar"][i % 3]}/2025`,
    value,
    dueDate,
    category: categories[i % categories.length],
    status: days > 0 ? "overdue" : "pending",
  };
});

export const payableKpis = {
  totalPayable: 5890000,
  dueIn7Days: 1420000,
  overdue: 185000,
  avgDaysToPay: 35,
};

// ═══ AGENDA FINANCEIRA (próximos 7 dias) ═══

export interface AgendaItem {
  date: string;
  label: string;
  items: { type: "pay" | "receive"; description: string; value: number }[];
}

export const financialAgenda: AgendaItem[] = Array.from({ length: 7 }, (_, i) => {
  const date = new Date("2025-03-09");
  date.setDate(date.getDate() + i);
  const dateStr = date.toISOString().split("T")[0];
  const dayLabel = date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  const payCount = Math.floor(Math.random() * 3);
  const receiveCount = Math.floor(Math.random() * 4);
  const items: AgendaItem["items"] = [];
  for (let j = 0; j < receiveCount; j++) {
    items.push({
      type: "receive",
      description: clientNames[Math.floor(Math.random() * clientNames.length)],
      value: Math.round((20000 + Math.random() * 200000) / 100) * 100,
    });
  }
  for (let j = 0; j < payCount; j++) {
    items.push({
      type: "pay",
      description: supplierNames[Math.floor(Math.random() * supplierNames.length)],
      value: Math.round((10000 + Math.random() * 150000) / 100) * 100,
    });
  }
  return { date: dateStr, label: dayLabel, items };
});

// ═══ INADIMPLÊNCIA ═══

export const agingData = [
  { range: "1-30 dias", value: 482000, percentage: 38.9, color: "hsl(45, 100%, 50%)" },
  { range: "31-60 dias", value: 361000, percentage: 29.1, color: "hsl(25, 100%, 50%)" },
  { range: "61-90 dias", value: 228000, percentage: 18.4, color: "hsl(354, 100%, 64%)" },
  { range: "+90 dias", value: 169000, percentage: 13.6, color: "hsl(252, 100%, 69%)" },
];

export const totalDelinquency = 1240000;

export interface Debtor {
  id: number;
  name: string;
  cnpj: string;
  totalDebt: number;
  oldestDue: string;
  daysOverdue: number;
  riskScore: "low" | "medium" | "high";
  attempts: number;
}

export const topDebtors: Debtor[] = [
  { id: 1, name: "Omega Corp", cnpj: "98.765.432/0001-01", totalDebt: 248000, oldestDue: "2024-11-15", daysOverdue: 114, riskScore: "high", attempts: 5 },
  { id: 2, name: "Delta Sys", cnpj: "12.876.543/0001-02", totalDebt: 195000, oldestDue: "2024-12-20", daysOverdue: 79, riskScore: "high", attempts: 4 },
  { id: 3, name: "Kappa Serviços", cnpj: "45.678.912/0001-03", totalDebt: 156000, oldestDue: "2025-01-05", daysOverdue: 63, riskScore: "high", attempts: 3 },
  { id: 4, name: "Eta Software", cnpj: "78.912.345/0001-04", totalDebt: 132000, oldestDue: "2025-01-18", daysOverdue: 50, riskScore: "medium", attempts: 2 },
  { id: 5, name: "Mu Analytics", cnpj: "23.456.789/0001-05", totalDebt: 118000, oldestDue: "2025-01-25", daysOverdue: 43, riskScore: "medium", attempts: 2 },
  { id: 6, name: "Rho Digital", cnpj: "56.789.123/0001-06", totalDebt: 95000, oldestDue: "2025-02-05", daysOverdue: 32, riskScore: "medium", attempts: 1 },
  { id: 7, name: "Chi Data", cnpj: "89.123.456/0001-07", totalDebt: 82000, oldestDue: "2025-02-10", daysOverdue: 27, riskScore: "low", attempts: 1 },
  { id: 8, name: "Prism Digital", cnpj: "34.567.891/0001-08", totalDebt: 74000, oldestDue: "2025-02-15", daysOverdue: 22, riskScore: "low", attempts: 1 },
  { id: 9, name: "Helix Data", cnpj: "67.891.234/0001-09", totalDebt: 68000, oldestDue: "2025-02-20", daysOverdue: 17, riskScore: "low", attempts: 0 },
  { id: 10, name: "Jade Software", cnpj: "91.234.567/0001-10", totalDebt: 72000, oldestDue: "2025-02-22", daysOverdue: 15, riskScore: "low", attempts: 0 },
];

export const delinquencyEvolution = [
  { month: "Out/24", rate: 11.2, value: 890000 },
  { month: "Nov/24", rate: 12.5, value: 980000 },
  { month: "Dez/24", rate: 13.1, value: 1050000 },
  { month: "Jan/25", rate: 13.8, value: 1120000 },
  { month: "Fev/25", rate: 14.2, value: 1180000 },
  { month: "Mar/25", rate: 14.7, value: 1240000 },
];

export const recoveryRate = 68;
