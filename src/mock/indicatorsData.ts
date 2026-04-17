// Indicadores de Liquidez, Capital de Giro, Dívida e Alavancagem

// ═══ BALANÇO PATRIMONIAL ═══
export const balanceSheet = {
  currentAssets: 12840000,
  cash: 4366500,
  receivables: 7180000,
  inventory: 293500,
  longTermAssets: 2100000, // ARLP
  totalAssets: 28450000,
  currentLiabilities: 7920000,
  longTermLiabilities: 7400000, // PELP
  totalLiabilities: 15320000,
  suppliers: 3240000,
};

// ═══ LIQUIDEZ ═══
export const liquidityIndicators = {
  current: { value: 1.62, label: "Liquidez Corrente", formula: "AC / PC", benchmark: { excellent: 1.5, adequate: 1.0 } },
  quick: { value: 1.59, label: "Liquidez Seca", formula: "(AC - Estoques) / PC", benchmark: { excellent: 1.0, adequate: 0.7 } },
  immediate: { value: 0.55, label: "Liquidez Imediata", formula: "Caixa / PC", benchmark: { excellent: 0.5, adequate: 0.3 } },
  general: { value: 1.28, label: "Liquidez Geral", formula: "(AC + ARLP) / (PC + PELP)", benchmark: { excellent: 1.2, adequate: 1.0 } },
};

export const liquidityHistory = {
  current: [1.45, 1.48, 1.52, 1.55, 1.58, 1.62],
  quick: [1.42, 1.44, 1.48, 1.51, 1.55, 1.59],
  immediate: [0.42, 0.45, 0.48, 0.50, 0.52, 0.55],
  general: [1.18, 1.20, 1.22, 1.24, 1.26, 1.28],
};

export const liquidityHistoryMonths = ["Out/24", "Nov/24", "Dez/24", "Jan/25", "Fev/25", "Mar/25"];

// ═══ CAPITAL DE GIRO ═══
export const workingCapital = {
  cgl: 4920000, // AC - PC
  ncg: 4233500, // Recebíveis + Estoques - Fornecedores
  treasuryBalance: 686500, // CGL - NCG
  receivables: 7180000,
  inventory: 293500,
  suppliers: 3240000,
};

// ═══ DÍVIDA E ALAVANCAGEM ═══
export const debtData = {
  grossDebt: 8420000,
  shortTermDebt: 2840000,
  longTermDebt: 5580000,
  cash: 4366500,
  netDebt: 4053500,
  annualEbitda: 12360000,
  netDebtToEbitda: 0.33,
  debtRatio: 53.8, // Passivo Total / Ativo Total
  gaf: 1.24,
  gao: 2.18,
  interestCoverage: 8.4,
};

// Cronograma de amortização (24 meses)
export const amortizationSchedule = Array.from({ length: 24 }, (_, i) => {
  const date = new Date(2025, 3 + i); // Start Apr 2025
  const month = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  const principal = i < 12
    ? Math.round(2840000 / 12 + (i % 3 === 0 ? 50000 : 0))
    : Math.round(5580000 / 24 + (i % 4 === 0 ? 30000 : 0));
  const interest = Math.round(principal * 0.012 * (1 - i * 0.01));
  return { month, principal, interest, total: principal + interest };
});

// Benchmarks SaaS
export const saasBenchmarks = [
  { indicator: "Dív. Líq./EBITDA", company: 0.33, sector: 1.8, status: "excellent" as const },
  { indicator: "Endividamento", company: 53.8, sector: 55.0, status: "good" as const },
  { indicator: "GAF", company: 1.24, sector: 1.5, status: "good" as const },
  { indicator: "Cobertura de Juros", company: 8.4, sector: 4.0, status: "excellent" as const },
  { indicator: "Liquidez Corrente", company: 1.62, sector: 1.4, status: "excellent" as const },
  { indicator: "Liquidez Seca", company: 1.59, sector: 1.2, status: "excellent" as const },
];
