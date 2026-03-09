// FinanceOS - Mock Financial Data
// Empresa: TechBR Ltda | CNPJ: 12.345.678/0001-99 | Segmento: SaaS B2B

export const companyInfo = {
  name: "TechBR Ltda",
  cnpj: "12.345.678/0001-99",
  segment: "SaaS B2B",
  employees: 124,
  activeClients: 847,
};

export const currentMonth = {
  grossRevenue: 4850000,
  netRevenue: 4120000,
  cmv: 1236000,
  operatingExpenses: 1648000,
  financialExpenses: 206000,
  ebitda: 1030000,
  netProfit: 824000,
  payroll: 890000,
};

export const annualData = {
  grossRevenue: 52800000,
  netRevenue: 44880000,
};

export const kpis = {
  averageTicket: 5727,
  churnRate: 2.3,
  ebitdaMargin: 25,
  netMargin: 20,
  cmvPercentage: 30,
  operatingExpensesPercentage: 40,
  financialExpensesPercentage: 5,
};

// Evolução mensal dos últimos 12 meses
export const monthlyEvolution = [
  { month: "Mar/24", grossRevenue: 3950000, netRevenue: 3357500, netProfit: 671500 },
  { month: "Abr/24", grossRevenue: 4100000, netRevenue: 3485000, netProfit: 697000 },
  { month: "Mai/24", grossRevenue: 4050000, netRevenue: 3442500, netProfit: 688500 },
  { month: "Jun/24", grossRevenue: 4200000, netRevenue: 3570000, netProfit: 714000 },
  { month: "Jul/24", grossRevenue: 4350000, netRevenue: 3697500, netProfit: 739500 },
  { month: "Ago/24", grossRevenue: 4400000, netRevenue: 3740000, netProfit: 748000 },
  { month: "Set/24", grossRevenue: 4500000, netRevenue: 3825000, netProfit: 765000 },
  { month: "Out/24", grossRevenue: 4600000, netRevenue: 3910000, netProfit: 782000 },
  { month: "Nov/24", grossRevenue: 4700000, netRevenue: 3995000, netProfit: 799000 },
  { month: "Dez/24", grossRevenue: 4750000, netRevenue: 4037500, netProfit: 807500 },
  { month: "Jan/25", grossRevenue: 4800000, netRevenue: 4080000, netProfit: 816000 },
  { month: "Fev/25", grossRevenue: 4850000, netRevenue: 4120000, netProfit: 824000 },
];

// Contas a Pagar
export const accountsPayable = [
  { id: 1, description: "Fornecedor AWS", value: 85000, dueDate: "2025-03-15", status: "pending" },
  { id: 2, description: "Folha de Pagamento", value: 890000, dueDate: "2025-03-05", status: "paid" },
  { id: 3, description: "Aluguel Sede", value: 45000, dueDate: "2025-03-10", status: "pending" },
  { id: 4, description: "Marketing Digital", value: 120000, dueDate: "2025-03-20", status: "pending" },
  { id: 5, description: "Impostos", value: 320000, dueDate: "2025-03-25", status: "overdue" },
];

// Contas a Receber
export const accountsReceivable = [
  { id: 1, client: "Empresa ABC", value: 250000, dueDate: "2025-03-10", status: "pending" },
  { id: 2, client: "Tech Solutions", value: 180000, dueDate: "2025-03-05", status: "received" },
  { id: 3, client: "Inovação SA", value: 95000, dueDate: "2025-03-15", status: "pending" },
  { id: 4, client: "DataCorp", value: 320000, dueDate: "2025-02-28", status: "overdue" },
  { id: 5, client: "CloudFirst", value: 150000, dueDate: "2025-03-20", status: "pending" },
];

// Indicadores de Liquidez
export const liquidityIndicators = {
  currentRatio: 2.35,
  quickRatio: 1.89,
  cashRatio: 0.95,
  currentAssets: 12500000,
  currentLiabilities: 5319149,
  inventory: 2450000,
  cash: 5050000,
};

// Fluxo de Caixa
export const cashFlowData = [
  { month: "Mar/24", inflow: 3800000, outflow: 3200000, balance: 600000 },
  { month: "Abr/24", inflow: 4000000, outflow: 3350000, balance: 650000 },
  { month: "Mai/24", inflow: 3900000, outflow: 3250000, balance: 650000 },
  { month: "Jun/24", inflow: 4100000, outflow: 3400000, balance: 700000 },
  { month: "Jul/24", inflow: 4250000, outflow: 3500000, balance: 750000 },
  { month: "Ago/24", inflow: 4300000, outflow: 3550000, balance: 750000 },
  { month: "Set/24", inflow: 4400000, outflow: 3600000, balance: 800000 },
  { month: "Out/24", inflow: 4500000, outflow: 3700000, balance: 800000 },
  { month: "Nov/24", inflow: 4600000, outflow: 3750000, balance: 850000 },
  { month: "Dez/24", inflow: 4650000, outflow: 3800000, balance: 850000 },
  { month: "Jan/25", inflow: 4700000, outflow: 3850000, balance: 850000 },
  { month: "Fev/25", inflow: 4850000, outflow: 3900000, balance: 950000 },
];

// DRE Simplificada
export const dreData = {
  grossRevenue: 4850000,
  deductions: 730000,
  netRevenue: 4120000,
  cmv: 1236000,
  grossProfit: 2884000,
  operatingExpenses: 1648000,
  administrativeExpenses: 650000,
  salesExpenses: 520000,
  otherExpenses: 478000,
  operatingProfit: 1236000,
  financialExpenses: 206000,
  ebitda: 1030000,
  depreciation: 82400,
  ebt: 947600,
  taxes: 123600,
  netProfit: 824000,
};

// Notificações
export const notifications = [
  { id: 1, type: "warning", message: "3 contas vencem hoje", time: "2 min" },
  { id: 2, type: "alert", message: "Conta em atraso: R$ 320.000", time: "15 min" },
  { id: 3, type: "info", message: "Relatório mensal disponível", time: "1h" },
  { id: 4, type: "success", message: "Pagamento confirmado", time: "3h" },
];

// Formato de moeda brasileira
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Formato de porcentagem
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Formato compacto para valores grandes
export const formatCompact = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
};
