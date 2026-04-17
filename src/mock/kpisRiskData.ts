// KPIs de Rentabilidade e Análise de Riscos

// ═══ RENTABILIDADE ═══
export const profitabilityKpis = {
  equity: 13130000,
  totalAssets: 28450000,
  investedCapital: 17183500,
  capitalEmployed: 20530000,
  nopatMonthly: 1295531,
  nopatAnnual: 15546375,
  netIncomeAnnual: 14061372,
  ebitAnnual: 20728500,
  roe: 107.1,
  roa: 49.4,
  roic: 90.5,
  roce: 100.9,
  wacc: 14.2,
  roicWaccSpread: 76.3,
  ebitdaMargin: 40.4,
  capexToRevenue: 1.96,
  momGrowth: 2.1,
  yoyGrowth: 28.4,
  nps: 72,
  churnRate: 2.3,
  nrr: 118,
  burnMultiple: 0.4,
  healthScore: 87,
};

export const healthCategories = [
  { category: "Rentabilidade", status: "excellent" as const, score: 95 },
  { category: "Liquidez", status: "excellent" as const, score: 88 },
  { category: "Endividamento", status: "excellent" as const, score: 85 },
  { category: "Crescimento", status: "warning" as const, score: 72 },
];

export const kpiTargets = [
  { kpi: "ROE", actual: 107.1, target: 25, unit: "%" },
  { kpi: "ROA", actual: 49.4, target: 15, unit: "%" },
  { kpi: "ROIC", actual: 90.5, target: 20, unit: "%" },
  { kpi: "Margem EBITDA", actual: 40.4, target: 30, unit: "%" },
  { kpi: "Churn", actual: 2.3, target: 3.0, unit: "%" },
  { kpi: "NPS", actual: 72, target: 60, unit: "" },
  { kpi: "NRR", actual: 118, target: 110, unit: "%" },
  { kpi: "Crescimento YoY", actual: 28.4, target: 30, unit: "%" },
];

export const quarterlyComparison = [
  { quarter: "Q1/24", roe: 82.4, roa: 38.2, roic: 72.1, ebitda: 35.2 },
  { quarter: "Q2/24", roe: 89.5, roa: 41.3, roic: 78.4, ebitda: 36.8 },
  { quarter: "Q3/24", roe: 97.2, roa: 45.1, roic: 84.3, ebitda: 38.5 },
  { quarter: "Q4/24", roe: 103.8, roa: 47.8, roic: 88.1, ebitda: 39.7 },
  { quarter: "Q1/25", roe: 107.1, roa: 49.4, roic: 90.5, ebitda: 40.4 },
];

export const rentabilityHistory = [
  { month: "Out/24", roe: 98.5, roa: 45.8 },
  { month: "Nov/24", roe: 100.2, roa: 46.5 },
  { month: "Dez/24", roe: 102.1, roa: 47.2 },
  { month: "Jan/25", roe: 104.0, roa: 48.0 },
  { month: "Fev/25", roe: 105.5, roa: 48.7 },
  { month: "Mar/25", roe: 107.1, roa: 49.4 },
];

// ═══ RISCOS ═══
export interface Risk {
  id: number;
  name: string;
  description: string;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  financialImpact: number;
  mitigation: string;
  responsible: string;
  deadline: string;
  x: number; // 1-5 probability
  y: number; // 1-5 impact
}

export const companyRisks: Risk[] = [
  { id: 1, name: "Concentração de receita", description: "Top 5 clientes = 38% da receita", probability: "high", impact: "high", financialImpact: 1843000, mitigation: "Diversificar base de clientes, programa de aquisição agressivo", responsible: "Diretoria Comercial", deadline: "Jun/2025", x: 4, y: 4 },
  { id: 2, name: "Dependência AWS", description: "36% do CMV em infraestrutura cloud AWS", probability: "medium", impact: "high", financialImpact: 485000, mitigation: "Estratégia multi-cloud, POC com GCP", responsible: "CTO", deadline: "Set/2025", x: 3, y: 4 },
  { id: 3, name: "Risco cambial", description: "12% da receita em USD sem hedge", probability: "low", impact: "medium", financialImpact: 582000, mitigation: "Contratar hedge cambial para 80% da exposição", responsible: "CFO", deadline: "Abr/2025", x: 2, y: 3 },
  { id: 4, name: "Risco regulatório LGPD", description: "Compliance em andamento, 78% concluído", probability: "medium", impact: "medium", financialImpact: 350000, mitigation: "Acelerar projeto de adequação, DPO dedicado", responsible: "Jurídico", deadline: "Mai/2025", x: 3, y: 3 },
  { id: 5, name: "Risco de churn", description: "Aceleração acima de 3% impacta MRR", probability: "medium", impact: "high", financialImpact: 1455000, mitigation: "Programa de CS proativo, health score de clientes", responsible: "VP Customer Success", deadline: "Contínuo", x: 3, y: 5 },
];

export interface ClientRisk {
  id: number;
  name: string;
  mrr: number;
  avgDelay: number;
  relationship: number; // months
  purchaseVolume: "low" | "medium" | "high";
  score: number; // 0-100
  risk: "low" | "medium" | "high";
  trend: "improving" | "stable" | "deteriorating";
}

export const clientRisks: ClientRisk[] = [
  { id: 1, name: "Alpha Tech", mrr: 48000, avgDelay: 2, relationship: 36, purchaseVolume: "high", score: 92, risk: "low", trend: "stable" },
  { id: 2, name: "Beta Solutions", mrr: 82000, avgDelay: 0, relationship: 48, purchaseVolume: "high", score: 98, risk: "low", trend: "improving" },
  { id: 3, name: "Gamma Corp", mrr: 65000, avgDelay: 5, relationship: 24, purchaseVolume: "high", score: 85, risk: "low", trend: "stable" },
  { id: 4, name: "Delta Sys", mrr: 38000, avgDelay: 18, relationship: 12, purchaseVolume: "medium", score: 42, risk: "high", trend: "deteriorating" },
  { id: 5, name: "Epsilon Digital", mrr: 55000, avgDelay: 3, relationship: 30, purchaseVolume: "high", score: 88, risk: "low", trend: "stable" },
  { id: 6, name: "Zeta Cloud", mrr: 72000, avgDelay: 1, relationship: 42, purchaseVolume: "high", score: 95, risk: "low", trend: "improving" },
  { id: 7, name: "Eta Software", mrr: 28000, avgDelay: 22, relationship: 8, purchaseVolume: "medium", score: 35, risk: "high", trend: "deteriorating" },
  { id: 8, name: "Theta Labs", mrr: 42000, avgDelay: 8, relationship: 18, purchaseVolume: "medium", score: 62, risk: "medium", trend: "stable" },
  { id: 9, name: "Iota Data", mrr: 33000, avgDelay: 12, relationship: 15, purchaseVolume: "medium", score: 55, risk: "medium", trend: "deteriorating" },
  { id: 10, name: "Kappa Serviços", mrr: 25000, avgDelay: 28, relationship: 6, purchaseVolume: "low", score: 28, risk: "high", trend: "deteriorating" },
  { id: 11, name: "Lambda IT", mrr: 61000, avgDelay: 0, relationship: 40, purchaseVolume: "high", score: 97, risk: "low", trend: "improving" },
  { id: 12, name: "Mu Analytics", mrr: 45000, avgDelay: 10, relationship: 20, purchaseVolume: "medium", score: 58, risk: "medium", trend: "stable" },
  { id: 13, name: "Nu Telecom", mrr: 38000, avgDelay: 4, relationship: 28, purchaseVolume: "medium", score: 82, risk: "low", trend: "stable" },
  { id: 14, name: "Xi Consulting", mrr: 52000, avgDelay: 6, relationship: 22, purchaseVolume: "high", score: 78, risk: "low", trend: "stable" },
  { id: 15, name: "Omicron Pay", mrr: 18000, avgDelay: 15, relationship: 10, purchaseVolume: "low", score: 45, risk: "medium", trend: "deteriorating" },
  { id: 16, name: "Pi Networks", mrr: 68000, avgDelay: 1, relationship: 38, purchaseVolume: "high", score: 94, risk: "low", trend: "improving" },
  { id: 17, name: "Rho Digital", mrr: 22000, avgDelay: 20, relationship: 9, purchaseVolume: "low", score: 38, risk: "high", trend: "deteriorating" },
  { id: 18, name: "Sigma Tech", mrr: 75000, avgDelay: 2, relationship: 44, purchaseVolume: "high", score: 93, risk: "low", trend: "stable" },
  { id: 19, name: "Tau Systems", mrr: 41000, avgDelay: 7, relationship: 16, purchaseVolume: "medium", score: 68, risk: "medium", trend: "stable" },
  { id: 20, name: "Upsilon Inc", mrr: 29000, avgDelay: 14, relationship: 11, purchaseVolume: "low", score: 48, risk: "medium", trend: "deteriorating" },
];

export interface SupplierRisk {
  id: number;
  name: string;
  costShare: number;
  alternatives: number;
  slaCompliance: number;
  deliveryScore: number;
  reliability: "excellent" | "good" | "fair" | "poor";
}

export const supplierRisks: SupplierRisk[] = [
  { id: 1, name: "AWS", costShare: 36.1, alternatives: 3, slaCompliance: 99.95, deliveryScore: 98, reliability: "excellent" },
  { id: 2, name: "Google Cloud", costShare: 12.4, alternatives: 2, slaCompliance: 99.90, deliveryScore: 97, reliability: "excellent" },
  { id: 3, name: "Suporte TechTeam", costShare: 9.5, alternatives: 5, slaCompliance: 95.2, deliveryScore: 88, reliability: "good" },
  { id: 4, name: "Integrator SA", costShare: 8.8, alternatives: 4, slaCompliance: 92.5, deliveryScore: 85, reliability: "good" },
  { id: 5, name: "LicenseSoft", costShare: 7.2, alternatives: 3, slaCompliance: 98.0, deliveryScore: 94, reliability: "excellent" },
  { id: 6, name: "DataPipe", costShare: 5.8, alternatives: 2, slaCompliance: 89.5, deliveryScore: 82, reliability: "fair" },
  { id: 7, name: "SecureNet", costShare: 4.5, alternatives: 4, slaCompliance: 97.8, deliveryScore: 95, reliability: "excellent" },
  { id: 8, name: "CloudOps BR", costShare: 3.2, alternatives: 6, slaCompliance: 91.0, deliveryScore: 84, reliability: "good" },
];
