// Mock data: Margens, CMV, Ciclo Financeiro, Ticket Médio

// ═══ MARGENS ═══
export const marginsData = {
  grossRevenue: 4850000,
  netRevenue: 4486250,
  grossProfit: 3140375,
  ebitda: 1812375,
  ebit: 1727375,
  netIncome: 1171781,
  variableCosts: 1238000,
};

export const margins = [
  { label: "Margem Bruta", value: 69.9, benchmarkMin: 65, benchmarkMax: 80, color: "hsl(152, 100%, 50%)" },
  { label: "Margem de Contribuição", value: 72.4, benchmarkMin: 60, benchmarkMax: 75, color: "hsl(187, 100%, 50%)" },
  { label: "Margem EBITDA", value: 40.4, benchmarkMin: 20, benchmarkMax: 40, color: "hsl(252, 100%, 69%)" },
  { label: "Margem Operacional", value: 38.5, benchmarkMin: 15, benchmarkMax: 35, color: "hsl(45, 100%, 50%)" },
  { label: "Margem Líquida", value: 26.1, benchmarkMin: 15, benchmarkMax: 25, color: "hsl(354, 100%, 64%)" },
];

export const marginsBenchmarkSaaS = [
  { label: "M. Bruta", company: 69.9, sector: 72 },
  { label: "M. Contribuição", company: 72.4, sector: 68 },
  { label: "M. EBITDA", company: 40.4, sector: 30 },
  { label: "M. Operacional", company: 38.5, sector: 25 },
  { label: "M. Líquida", company: 26.1, sector: 20 },
];

export const marginsHistory = [
  { month: "Abr/24", gross: 67.2, ebitda: 36.8, net: 22.5 },
  { month: "Mai/24", gross: 67.5, ebitda: 37.1, net: 22.8 },
  { month: "Jun/24", gross: 67.8, ebitda: 37.5, net: 23.2 },
  { month: "Jul/24", gross: 68.1, ebitda: 38.0, net: 23.6 },
  { month: "Ago/24", gross: 68.4, ebitda: 38.4, net: 24.0 },
  { month: "Set/24", gross: 68.7, ebitda: 38.8, net: 24.4 },
  { month: "Out/24", gross: 69.0, ebitda: 39.1, net: 24.8 },
  { month: "Nov/24", gross: 69.2, ebitda: 39.4, net: 25.1 },
  { month: "Dez/24", gross: 69.4, ebitda: 39.7, net: 25.4 },
  { month: "Jan/25", gross: 69.6, ebitda: 39.9, net: 25.7 },
  { month: "Fev/25", gross: 69.8, ebitda: 40.1, net: 25.9 },
  { month: "Mar/25", gross: 69.9, ebitda: 40.4, net: 26.1 },
];

// ═══ CMV ═══
export const cmvComposition = [
  { name: "Infraestrutura Cloud", value: 485000, percentage: 36.1, color: "hsl(187, 100%, 50%)" },
  { name: "Licenças de Software", value: 210000, percentage: 15.6, color: "hsl(252, 100%, 69%)" },
  { name: "Suporte Técnico Direto", value: 320000, percentage: 23.8, color: "hsl(152, 100%, 50%)" },
  { name: "Custos de Integração", value: 180000, percentage: 13.4, color: "hsl(45, 100%, 50%)" },
  { name: "Outros Custos Diretos", value: 150875, percentage: 11.2, color: "hsl(354, 100%, 64%)" },
];

export const cmvTotal = 1345875;

export const cmvEvolution = [
  { month: "Abr/24", cmv: 32.8, target: 32 },
  { month: "Mai/24", cmv: 32.5, target: 32 },
  { month: "Jun/24", cmv: 32.2, target: 32 },
  { month: "Jul/24", cmv: 31.9, target: 32 },
  { month: "Ago/24", cmv: 31.6, target: 32 },
  { month: "Set/24", cmv: 31.3, target: 32 },
  { month: "Out/24", cmv: 31.0, target: 32 },
  { month: "Nov/24", cmv: 30.8, target: 32 },
  { month: "Dez/24", cmv: 30.6, target: 32 },
  { month: "Jan/25", cmv: 30.3, target: 32 },
  { month: "Fev/25", cmv: 30.1, target: 32 },
  { month: "Mar/25", cmv: 30.0, target: 32 },
];

export const cmvReductionOpportunities = [
  { area: "Migração parcial para spot instances", saving: 72000, effort: "Médio" },
  { area: "Renegociação contrato Cloud", saving: 48000, effort: "Baixo" },
  { area: "Automação de onboarding", saving: 54000, effort: "Alto" },
  { area: "Consolidação de licenças", saving: 31000, effort: "Baixo" },
];

// ═══ CICLO FINANCEIRO ═══
export const cycleData = {
  pme: 6.5,
  pmr: 44.4,
  pmp: 72.2,
  operationalCycle: 50.9,
  financialCycle: -21.3,
  inventory: 293500,
  receivables: 7180000,
  payables: 3240000,
  dailyCmv: 1345875 / 30,
  dailyRevenue: 4850000 / 30,
};

export const cycleHistory = [
  { month: "Out/24", pme: 7.2, pmr: 48.1, pmp: 68.5, financial: -13.2 },
  { month: "Nov/24", pme: 7.0, pmr: 47.2, pmp: 69.1, financial: -14.9 },
  { month: "Dez/24", pme: 6.8, pmr: 46.5, pmp: 70.0, financial: -16.7 },
  { month: "Jan/25", pme: 6.7, pmr: 45.8, pmp: 70.8, financial: -18.3 },
  { month: "Fev/25", pme: 6.6, pmr: 45.0, pmp: 71.5, financial: -19.9 },
  { month: "Mar/25", pme: 6.5, pmr: 44.4, pmp: 72.2, financial: -21.3 },
];

export const cycleBenchmark = { pme: 10, pmr: 45, pmp: 60, financial: -5 };

// ═══ TICKET MÉDIO ═══
export const ticketData = {
  totalClients: 847,
  mrr: 4850000,
  avgTicket: 5727,
  churn: 0.023,
  ltv: 248978,
  cac: 8420,
  ltvCacRatio: 29.6,
};

export const planSegmentation = [
  { plan: "Basic", clients: 312, ticket: 1890, revenue: 589680, color: "hsl(215, 20%, 55%)" },
  { plan: "Professional", clients: 385, ticket: 4750, revenue: 1828750, color: "hsl(187, 100%, 50%)" },
  { plan: "Enterprise", clients: 150, ticket: 16216, revenue: 2432400, color: "hsl(252, 100%, 69%)" },
];

export const ticketEvolution = [
  { month: "Abr/24", ticket: 4980 },
  { month: "Mai/24", ticket: 5050 },
  { month: "Jun/24", ticket: 5120 },
  { month: "Jul/24", ticket: 5200 },
  { month: "Ago/24", ticket: 5280 },
  { month: "Set/24", ticket: 5350 },
  { month: "Out/24", ticket: 5420 },
  { month: "Nov/24", ticket: 5490 },
  { month: "Dez/24", ticket: 5560 },
  { month: "Jan/25", ticket: 5620 },
  { month: "Fev/25", ticket: 5680 },
  { month: "Mar/25", ticket: 5727 },
];
