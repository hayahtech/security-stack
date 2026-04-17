export interface Partner {
  id: string;
  name: string;
  cpfCnpj: string;
  participation: number;
  proLabore: number;
  role: string;
  type: "pf" | "pj";
}

export const partners: Partner[] = [
  { id: "1", name: "João Silva", cpfCnpj: "***.456.789-**", participation: 55, proLabore: 28000, role: "CEO", type: "pf" },
  { id: "2", name: "Maria Souza", cpfCnpj: "***.789.012-**", participation: 35, proLabore: 22000, role: "COO", type: "pf" },
  { id: "3", name: "Tech Invest Fundo", cpfCnpj: "CNPJ", participation: 10, proLabore: 0, role: "Investidor", type: "pj" },
];

export const profitDistribution = {
  quarterlyProfit: 3515343,
  contingencyReserve: 351534,
  reinvestmentReserve: 703069,
  distributable: 2460740,
};

export const proLaboreHistory = [
  { month: "Mar/25", joao: 28000, maria: 22000, inssPatronal: 10000, irrf: 8400, totalCost: 68400 },
  { month: "Fev/25", joao: 28000, maria: 22000, inssPatronal: 10000, irrf: 8400, totalCost: 68400 },
  { month: "Jan/25", joao: 28000, maria: 22000, inssPatronal: 10000, irrf: 8400, totalCost: 68400 },
  { month: "Dez/24", joao: 26000, maria: 20000, inssPatronal: 9200, irrf: 7600, totalCost: 62800 },
  { month: "Nov/24", joao: 26000, maria: 20000, inssPatronal: 9200, irrf: 7600, totalCost: 62800 },
  { month: "Out/24", joao: 26000, maria: 20000, inssPatronal: 9200, irrf: 7600, totalCost: 62800 },
];

export interface Project {
  id: string;
  name: string;
  client: string;
  budgeted: number;
  actual: number;
  margin: number;
  progress: number;
  status: "on_track" | "over_budget" | "at_risk" | "completed";
  milestones: { name: string; value: number; status: "done" | "pending" | "in_progress" }[];
}

export const projects: Project[] = [
  { id: "1", name: "Implementação ERP", client: "MegaCorp", budgeted: 280000, actual: 194200, margin: 62.4, progress: 69, status: "on_track",
    milestones: [
      { name: "Kickoff", value: 0, status: "done" },
      { name: "Fase 1 — Levantamento", value: 70000, status: "done" },
      { name: "Fase 2 — Desenvolvimento", value: 70000, status: "done" },
      { name: "Fase 3 — Implantação", value: 70000, status: "in_progress" },
      { name: "Fase 4 — Go-live", value: 70000, status: "pending" },
    ],
  },
  { id: "2", name: "App Mobile v2", client: "StartupXYZ", budgeted: 145000, actual: 178400, margin: -18.8, progress: 88, status: "over_budget",
    milestones: [
      { name: "Design", value: 36250, status: "done" },
      { name: "Backend", value: 36250, status: "done" },
      { name: "Frontend", value: 36250, status: "done" },
      { name: "Testes & Deploy", value: 36250, status: "in_progress" },
    ],
  },
  { id: "3", name: "Consultoria M&A", client: "FintechBR", budgeted: 420000, actual: 186000, margin: 71.2, progress: 44, status: "on_track",
    milestones: [
      { name: "Due Diligence", value: 140000, status: "done" },
      { name: "Valuation", value: 140000, status: "in_progress" },
      { name: "Negociação", value: 140000, status: "pending" },
    ],
  },
  { id: "4", name: "Integração API Pagamentos", client: "ComércioSul", budgeted: 95000, actual: 62000, margin: 58.2, progress: 55, status: "on_track",
    milestones: [
      { name: "Arquitetura", value: 23750, status: "done" },
      { name: "Desenvolvimento", value: 23750, status: "in_progress" },
      { name: "Testes", value: 23750, status: "pending" },
      { name: "Homologação", value: 23750, status: "pending" },
    ],
  },
  { id: "5", name: "Migração Cloud AWS", client: "IndústriaBR", budgeted: 380000, actual: 348000, margin: 42.1, progress: 91, status: "at_risk",
    milestones: [
      { name: "Assessment", value: 95000, status: "done" },
      { name: "Migração Fase 1", value: 95000, status: "done" },
      { name: "Migração Fase 2", value: 95000, status: "done" },
      { name: "Otimização", value: 95000, status: "in_progress" },
    ],
  },
  { id: "6", name: "Dashboard BI", client: "LogísticaXP", budgeted: 120000, actual: 45000, margin: 75.0, progress: 30, status: "on_track",
    milestones: [
      { name: "Requisitos", value: 30000, status: "done" },
      { name: "ETL", value: 30000, status: "in_progress" },
      { name: "Dashboards", value: 30000, status: "pending" },
      { name: "Deploy", value: 30000, status: "pending" },
    ],
  },
  { id: "7", name: "Auditoria SOC2", client: "SaaS Corp", budgeted: 210000, actual: 210000, margin: 38.5, progress: 100, status: "completed",
    milestones: [
      { name: "Gap Analysis", value: 70000, status: "done" },
      { name: "Remediação", value: 70000, status: "done" },
      { name: "Auditoria Final", value: 70000, status: "done" },
    ],
  },
  { id: "8", name: "Chatbot IA Atendimento", client: "VarejoMax", budgeted: 175000, actual: 89000, margin: 61.0, progress: 48, status: "on_track",
    milestones: [
      { name: "Treinamento NLP", value: 43750, status: "done" },
      { name: "Integração CRM", value: 43750, status: "in_progress" },
      { name: "Testes A/B", value: 43750, status: "pending" },
      { name: "Rollout", value: 43750, status: "pending" },
    ],
  },
];
