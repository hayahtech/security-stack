import { addMonths, subMonths, format } from 'date-fns';

// ===== FORECAST DATA =====

const now = new Date();
const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Seasonality factors (1.0 = normal)
const seasonality = [0.85, 0.82, 0.88, 0.95, 1.0, 0.98, 0.92, 0.95, 1.05, 1.10, 1.30, 1.34];

function genMonth(baseRevenue: number, baseCost: number, monthIdx: number, noise = 0.05) {
  const s = seasonality[monthIdx % 12];
  const n = 1 + (Math.random() - 0.5) * noise * 2;
  const revenue = Math.round(baseRevenue * s * n);
  const costs = Math.round(baseCost * (0.95 + Math.random() * 0.1));
  return { revenue, costs, balance: revenue - costs };
}

// 24 months of actuals
export interface ForecastMonth {
  month: string;
  monthIdx: number;
  date: Date;
  revenue: number;
  costs: number;
  balance: number;
  cumulative: number;
  type: 'actual' | 'forecast';
}

const baseRevenue = 1_800_000;
const baseCost = 1_450_000;

let cumulative = 2_400_000; // starting cash
export const actualMonths: ForecastMonth[] = Array.from({ length: 24 }, (_, i) => {
  const date = subMonths(now, 24 - i);
  const m = genMonth(baseRevenue, baseCost, date.getMonth(), 0.08);
  cumulative += m.balance;
  return {
    month: `${monthNames[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`,
    monthIdx: date.getMonth(),
    date,
    revenue: m.revenue,
    costs: m.costs,
    balance: m.balance,
    cumulative,
    type: 'actual' as const,
  };
});

// 12 months of forecast (3 scenarios)
function generateForecast(revenueMultiplier: number, costMultiplier: number, startCumulative: number) {
  let cum = startCumulative;
  return Array.from({ length: 12 }, (_, i) => {
    const date = addMonths(now, i + 1);
    const s = seasonality[date.getMonth()];
    const revenue = Math.round(baseRevenue * s * revenueMultiplier);
    const costs = Math.round(baseCost * costMultiplier);
    const balance = revenue - costs;
    cum += balance;
    return {
      month: `${monthNames[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`,
      monthIdx: date.getMonth(),
      date,
      revenue,
      costs,
      balance,
      cumulative: cum,
      type: 'forecast' as const,
    };
  });
}

const lastCumulative = actualMonths[actualMonths.length - 1].cumulative;
export const forecastBase = generateForecast(1.05, 1.02, lastCumulative);
export const forecastOptimistic = generateForecast(1.15, 1.0, lastCumulative);
export const forecastPessimistic = generateForecast(0.88, 1.08, lastCumulative);

export const MIN_CASH = 150_000;

// ===== PREDICTED ENTRIES/EXITS =====

export type PredictionConfidence = 'CONTRATUAL' | 'HISTORICO' | 'ESTIMADO' | 'INCERTO';
export type PredictionRecurrence = 'UNICA' | 'SEMANAL' | 'MENSAL' | 'ANUAL';

export interface PredictedFlow {
  id: string;
  description: string;
  value: number;
  date: Date;
  recurrence: PredictionRecurrence;
  confidence: PredictionConfidence;
  origin: string;
  type: 'ENTRADA' | 'SAIDA';
}

export const predictedFlows: PredictedFlow[] = [
  // Entradas
  { id: 'PF001', description: 'Aluguel Loja Centro SP', value: 45_000, date: addMonths(now, 1), recurrence: 'MENSAL', confidence: 'CONTRATUAL', origin: 'Contrato #2024-001', type: 'ENTRADA' },
  { id: 'PF002', description: 'Assinatura SaaS Enterprise', value: 12_000, date: addMonths(now, 1), recurrence: 'MENSAL', confidence: 'CONTRATUAL', origin: 'Contrato #2024-015', type: 'ENTRADA' },
  { id: 'PF003', description: 'Vendas Atacado Recorrente', value: 380_000, date: addMonths(now, 1), recurrence: 'MENSAL', confidence: 'HISTORICO', origin: 'Média 6 meses', type: 'ENTRADA' },
  { id: 'PF004', description: 'Vendas Varejo', value: 850_000, date: addMonths(now, 1), recurrence: 'MENSAL', confidence: 'HISTORICO', origin: 'Média 12 meses', type: 'ENTRADA' },
  { id: 'PF005', description: 'Recebível Safra Soja', value: 220_000, date: addMonths(now, 3), recurrence: 'UNICA', confidence: 'ESTIMADO', origin: 'Estimativa agrícola', type: 'ENTRADA' },
  { id: 'PF006', description: 'Contrato novo (prospecção)', value: 95_000, date: addMonths(now, 4), recurrence: 'MENSAL', confidence: 'INCERTO', origin: 'Pipeline comercial', type: 'ENTRADA' },
  // Saídas
  { id: 'PF007', description: 'Folha de Pagamento', value: 680_000, date: addMonths(now, 1), recurrence: 'MENSAL', confidence: 'CONTRATUAL', origin: 'RH - CLT', type: 'SAIDA' },
  { id: 'PF008', description: 'Impostos Mensais (DAS/ICMS)', value: 185_000, date: addMonths(now, 1), recurrence: 'MENSAL', confidence: 'CONTRATUAL', origin: 'Fiscal', type: 'SAIDA' },
  { id: 'PF009', description: 'Fornecedores Fixos', value: 320_000, date: addMonths(now, 1), recurrence: 'MENSAL', confidence: 'CONTRATUAL', origin: 'Contratos vigentes', type: 'SAIDA' },
  { id: 'PF010', description: 'Aluguel CDs', value: 120_000, date: addMonths(now, 1), recurrence: 'MENSAL', confidence: 'CONTRATUAL', origin: 'Contrato locação', type: 'SAIDA' },
  { id: 'PF011', description: 'Energia + Água CDs', value: 65_000, date: addMonths(now, 1), recurrence: 'MENSAL', confidence: 'HISTORICO', origin: 'Média 6 meses', type: 'SAIDA' },
  { id: 'PF012', description: 'Manutenção Frota', value: 42_000, date: addMonths(now, 2), recurrence: 'MENSAL', confidence: 'ESTIMADO', origin: 'Orçamento anual', type: 'SAIDA' },
  { id: 'PF013', description: 'Reforma Câmara Fria', value: 180_000, date: addMonths(now, 5), recurrence: 'UNICA', confidence: 'ESTIMADO', origin: 'Orçamento aprovado', type: 'SAIDA' },
  { id: 'PF014', description: '13º Salário (2ª parcela)', value: 340_000, date: addMonths(now, 8), recurrence: 'ANUAL', confidence: 'CONTRATUAL', origin: 'RH - CLT', type: 'SAIDA' },
];

// ===== SAVED SCENARIOS =====

export interface SavedScenario {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  variables: {
    financing: number;
    financingMonths: number;
    financingRate: number;
    revenueChange: number;
    expenseAnticipation: number;
    newHeadcount: number;
    avgSalary: number;
  };
  resultCash12m: number;
  criticalPoint?: string;
}

export const savedScenarios: SavedScenario[] = [
  {
    id: 'SC001', name: 'Compra do Caminhão', description: 'Financiamento de 2 caminhões frigoríficos para expansão logística',
    createdAt: subMonths(now, 1),
    variables: { financing: 800_000, financingMonths: 48, financingRate: 1.2, revenueChange: 5, expenseAnticipation: 0, newHeadcount: 4, avgSalary: 3500 },
    resultCash12m: 1_820_000,
  },
  {
    id: 'SC002', name: 'Expansão CD Recife', description: 'Abertura de novo centro de distribuição no Nordeste',
    createdAt: subMonths(now, 2),
    variables: { financing: 2_000_000, financingMonths: 60, financingRate: 1.5, revenueChange: 15, expenseAnticipation: 500_000, newHeadcount: 35, avgSalary: 4200 },
    resultCash12m: 980_000, criticalPoint: 'Ago/26',
  },
  {
    id: 'SC003', name: 'Queda de 20% nas vendas', description: 'Cenário pessimista de retração econômica',
    createdAt: subMonths(now, 0),
    variables: { financing: 0, financingMonths: 0, financingRate: 0, revenueChange: -20, expenseAnticipation: 0, newHeadcount: 0, avgSalary: 0 },
    resultCash12m: -42_000, criticalPoint: 'Set/26',
  },
];

// ===== SEASONALITY DATA =====

export interface SeasonalityPattern {
  title: string;
  icon: string;
  months: string;
  variation: number;
  description: string;
  type: 'peak' | 'valley';
  yearsOfData: number;
}

export const seasonalityPatterns: SeasonalityPattern[] = [
  { title: 'Pico de Receita', icon: '📈', months: 'Novembro e Dezembro', variation: 34, description: 'Black Friday + Natal elevam vendas significativamente', type: 'peak', yearsOfData: 3 },
  { title: 'Vale de Caixa', icon: '📉', months: 'Fevereiro e Março', variation: -18, description: 'Requer atenção de capital de giro', type: 'valley', yearsOfData: 3 },
  { title: 'Retomada Escolar', icon: '📚', months: 'Janeiro e Fevereiro', variation: 12, description: 'Material escolar e volta às aulas', type: 'peak', yearsOfData: 2 },
  { title: 'Queda Pós-Páscoa', icon: '🐣', months: 'Maio', variation: -8, description: 'Normalização após sazonalidade de Páscoa', type: 'valley', yearsOfData: 3 },
];

// Heatmap: 12 months x categories
export const seasonalityHeatmap: { category: string; months: number[] }[] = [
  { category: 'Vendas Varejo', months: [85, 82, 88, 95, 100, 98, 92, 95, 105, 110, 130, 134] },
  { category: 'Vendas Atacado', months: [90, 88, 92, 98, 102, 100, 95, 97, 108, 112, 125, 128] },
  { category: 'Folha Pagamento', months: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 150] },
  { category: 'Fornecedores', months: [95, 90, 92, 98, 100, 100, 95, 98, 105, 108, 120, 125] },
  { category: 'Energia', months: [90, 95, 95, 85, 80, 78, 80, 82, 88, 95, 100, 105] },
  { category: 'Frete/Logística', months: [88, 85, 90, 95, 100, 98, 92, 95, 108, 115, 135, 140] },
];
