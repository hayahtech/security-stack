// Centros de Custo & Rateio mock data

export interface CostCenter {
  id: string;
  name: string;
  parentId: string | null;
  budget: number;
  actual: number;
  children?: CostCenter[];
}

export const costCentersTree: CostCenter[] = [
  {
    id: "CC-001", name: "Produto & Tecnologia", parentId: null, budget: 520000, actual: 498000,
    children: [
      { id: "CC-001-1", name: "Backend", parentId: "CC-001", budget: 180000, actual: 172000 },
      { id: "CC-001-2", name: "Frontend", parentId: "CC-001", budget: 140000, actual: 138000 },
      { id: "CC-001-3", name: "Infraestrutura", parentId: "CC-001", budget: 120000, actual: 118000 },
      { id: "CC-001-4", name: "Data & BI", parentId: "CC-001", budget: 80000, actual: 70000 },
    ],
  },
  {
    id: "CC-002", name: "Comercial & Vendas", parentId: null, budget: 685000, actual: 701000,
    children: [
      { id: "CC-002-1", name: "Inside Sales", parentId: "CC-002", budget: 220000, actual: 235000 },
      { id: "CC-002-2", name: "Field Sales", parentId: "CC-002", budget: 250000, actual: 248000 },
      { id: "CC-002-3", name: "Pré-venda", parentId: "CC-002", budget: 115000, actual: 118000 },
      { id: "CC-002-4", name: "Customer Success", parentId: "CC-002", budget: 100000, actual: 100000 },
    ],
  },
  {
    id: "CC-003", name: "Operações & Suporte", parentId: null, budget: 448000, actual: 432000,
    children: [
      { id: "CC-003-1", name: "Suporte N1", parentId: "CC-003", budget: 150000, actual: 145000 },
      { id: "CC-003-2", name: "Suporte N2", parentId: "CC-003", budget: 148000, actual: 142000 },
      { id: "CC-003-3", name: "Implementação", parentId: "CC-003", budget: 150000, actual: 145000 },
    ],
  },
  {
    id: "CC-004", name: "Marketing", parentId: null, budget: 300000, actual: 312000,
    children: [
      { id: "CC-004-1", name: "Performance", parentId: "CC-004", budget: 120000, actual: 132000 },
      { id: "CC-004-2", name: "Brand", parentId: "CC-004", budget: 80000, actual: 78000 },
      { id: "CC-004-3", name: "Eventos", parentId: "CC-004", budget: 60000, actual: 62000 },
      { id: "CC-004-4", name: "Conteúdo", parentId: "CC-004", budget: 40000, actual: 40000 },
    ],
  },
  {
    id: "CC-005", name: "G&A — Geral e Administrativo", parentId: null, budget: 392000, actual: 385000,
    children: [
      { id: "CC-005-1", name: "Financeiro", parentId: "CC-005", budget: 120000, actual: 118000 },
      { id: "CC-005-2", name: "RH & People", parentId: "CC-005", budget: 130000, actual: 128000 },
      { id: "CC-005-3", name: "Jurídico", parentId: "CC-005", budget: 82000, actual: 80000 },
      { id: "CC-005-4", name: "Facilities", parentId: "CC-005", budget: 60000, actual: 59000 },
    ],
  },
];

export const heatmapCCData = [
  { cc: "Produto", out: 480, nov: 490, dez: 495, jan: 492, fev: 496, mar: 498 },
  { cc: "Comercial", out: 660, nov: 670, dez: 680, jan: 690, fev: 695, mar: 701 },
  { cc: "Operações", out: 420, nov: 425, dez: 428, jan: 430, fev: 431, mar: 432 },
  { cc: "Marketing", out: 280, nov: 290, dez: 295, jan: 300, fev: 308, mar: 312 },
  { cc: "G&A", out: 380, nov: 382, dez: 383, jan: 384, fev: 384, mar: 385 },
];

export interface RateioRule {
  id: string;
  account: string;
  totalValue: number;
  active: boolean;
  basis: "manual" | "headcount" | "area" | "revenue";
  allocations: { ccId: string; ccName: string; pct: number }[];
}

export const rateioRules: RateioRule[] = [
  {
    id: "R-001", account: "Aluguel do Escritório", totalValue: 85000, active: true, basis: "manual",
    allocations: [
      { ccId: "CC-001", ccName: "Produto", pct: 35 },
      { ccId: "CC-002", ccName: "Comercial", pct: 25 },
      { ccId: "CC-003", ccName: "Operações", pct: 20 },
      { ccId: "CC-004", ccName: "Marketing", pct: 10 },
      { ccId: "CC-005", ccName: "G&A", pct: 10 },
    ],
  },
  {
    id: "R-002", account: "Energia Elétrica", totalValue: 12000, active: true, basis: "area",
    allocations: [
      { ccId: "CC-001", ccName: "Produto", pct: 30 },
      { ccId: "CC-002", ccName: "Comercial", pct: 25 },
      { ccId: "CC-003", ccName: "Operações", pct: 20 },
      { ccId: "CC-004", ccName: "Marketing", pct: 10 },
      { ccId: "CC-005", ccName: "G&A", pct: 15 },
    ],
  },
  {
    id: "R-003", account: "Segurança Patrimonial", totalValue: 8500, active: true, basis: "manual",
    allocations: [
      { ccId: "CC-001", ccName: "Produto", pct: 20 },
      { ccId: "CC-002", ccName: "Comercial", pct: 20 },
      { ccId: "CC-003", ccName: "Operações", pct: 20 },
      { ccId: "CC-004", ccName: "Marketing", pct: 20 },
      { ccId: "CC-005", ccName: "G&A", pct: 20 },
    ],
  },
  {
    id: "R-004", account: "Software Corporativo (ERP)", totalValue: 22000, active: false, basis: "headcount",
    allocations: [
      { ccId: "CC-001", ccName: "Produto", pct: 32 },
      { ccId: "CC-002", ccName: "Comercial", pct: 28 },
      { ccId: "CC-003", ccName: "Operações", pct: 18 },
      { ccId: "CC-004", ccName: "Marketing", pct: 10 },
      { ccId: "CC-005", ccName: "G&A", pct: 12 },
    ],
  },
];

export interface Entity {
  id: string;
  name: string;
  type: "empresa" | "holding" | "pessoa_fisica" | "consolidado";
  color: string;
  cnpjCpf: string;
}

export const entities: Entity[] = [
  { id: "E-001", name: "TechBR Ltda", type: "empresa", color: "hsl(var(--primary))", cnpjCpf: "12.345.678/0001-99" },
  { id: "E-002", name: "TechBR Holding", type: "holding", color: "hsl(var(--secondary))", cnpjCpf: "12.345.679/0001-70" },
  { id: "E-003", name: "Sócio 1 — João Silva", type: "pessoa_fisica", color: "hsl(var(--success))", cnpjCpf: "123.456.789-00" },
  { id: "E-004", name: "Sócio 2 — Maria Santos", type: "pessoa_fisica", color: "hsl(187 80% 60%)", cnpjCpf: "987.654.321-00" },
  { id: "E-000", name: "Consolidado Grupo", type: "consolidado", color: "hsl(252 80% 80%)", cnpjCpf: "—" },
];

export const intercompanyAlerts = [
  { id: 1, from: "TechBR Ltda", to: "TechBR Holding", value: 350000, desc: "Distribuição de Dividendos", date: "01/03/2025", type: "transfer" },
  { id: 2, from: "TechBR Ltda", to: "Sócio 1", value: 45000, desc: "Pró-labore", date: "05/03/2025", type: "transfer" },
  { id: 3, from: "TechBR Ltda", to: "Sócio 2", value: 45000, desc: "Pró-labore", date: "05/03/2025", type: "transfer" },
  { id: 4, from: "Sócio 1", to: "TechBR Ltda", value: 8200, desc: "⚠ Despesa pessoal em conta da empresa", date: "07/03/2025", type: "alert" },
  { id: 5, from: "TechBR Holding", to: "TechBR Ltda", value: 500000, desc: "Aporte de Capital", date: "10/03/2025", type: "transfer" },
];
