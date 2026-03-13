export interface BurnEntry {
  week: string;
  planned: number;
  actual: number;
  earned: number;
}

export interface TeamMember {
  name: string;
  role: string;
  allocation: number;
  costPerHour: number;
}

export interface ProjectRisk {
  description: string;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  category: "implementation" | "consulting" | "development" | "audit" | "infrastructure";
  budgeted: number;
  actual: number;
  margin: number;
  progress: number;
  status: "on_track" | "over_budget" | "at_risk" | "completed" | "paused";
  startDate: string;
  endDate: string;
  forecastEnd: string;
  manager: string;
  milestones: { name: string; value: number; status: "done" | "in_progress" | "pending"; dueDate: string }[];
  burnHistory: BurnEntry[];
  team: TeamMember[];
  risks: ProjectRisk[];
  cpi: number;
  spi: number;
  eac: number;
  vac: number;
  tcpi: number;
  aiRiskScore: number;
  aiPredictedMargin: number;
  aiCompletionProbability: number;
  aiAlerts: string[];
}

export const projectsData: Project[] = [
  {
    id: "proj-001",
    name: "Implementação ERP",
    client: "MegaCorp",
    category: "implementation",
    budgeted: 280000,
    actual: 194200,
    margin: 30.6,
    progress: 69,
    status: "on_track",
    startDate: "2024-09-01",
    endDate: "2025-06-30",
    forecastEnd: "2025-06-25",
    manager: "Carlos Mendes",
    milestones: [
      { name: "Kickoff & Discovery", value: 42000, status: "done", dueDate: "2024-09-30" },
      { name: "Configuração Módulos", value: 70000, status: "done", dueDate: "2024-12-15" },
      { name: "Integração Legado", value: 70000, status: "in_progress", dueDate: "2025-03-31" },
      { name: "UAT & Go-live", value: 56000, status: "pending", dueDate: "2025-05-30" },
      { name: "Pós-venda & Suporte", value: 42000, status: "pending", dueDate: "2025-06-30" },
    ],
    burnHistory: [
      { week: "S1", planned: 23000, actual: 22000, earned: 21500 },
      { week: "S2", planned: 46000, actual: 44500, earned: 44000 },
      { week: "S3", planned: 69000, actual: 67800, earned: 66500 },
      { week: "S4", planned: 92000, actual: 90200, earned: 89000 },
      { week: "S5", planned: 115000, actual: 113500, earned: 112000 },
      { week: "S6", planned: 138000, actual: 136800, earned: 135000 },
      { week: "S7", planned: 161000, actual: 159200, earned: 157500 },
      { week: "S8", planned: 184000, actual: 182500, earned: 180000 },
      { week: "S9", planned: 207000, actual: 194200, earned: 193000 },
    ],
    team: [
      { name: "Carlos Mendes", role: "Gerente de Projeto", allocation: 100, costPerHour: 180 },
      { name: "Ana Lima", role: "Consultora ERP", allocation: 100, costPerHour: 150 },
      { name: "Pedro Santos", role: "Desenvolvedor Sr.", allocation: 80, costPerHour: 140 },
      { name: "Julia Costa", role: "Analista de Dados", allocation: 60, costPerHour: 120 },
    ],
    risks: [
      { description: "Atraso na migração de dados legados", probability: "medium", impact: "high", mitigation: "Equipe dedicada + validação incremental" },
      { description: "Resistência dos usuários à mudança", probability: "medium", impact: "medium", mitigation: "Treinamento in-loco + champions internos" },
    ],
    cpi: 1.05,
    spi: 1.02,
    eac: 266667,
    vac: 13333,
    tcpi: 0.97,
    aiRiskScore: 22,
    aiPredictedMargin: 32.1,
    aiCompletionProbability: 94,
    aiAlerts: [],
  },
  {
    id: "proj-002",
    name: "App Mobile v2",
    client: "StartupXYZ",
    category: "development",
    budgeted: 145000,
    actual: 178400,
    margin: -23.0,
    progress: 88,
    status: "over_budget",
    startDate: "2024-10-01",
    endDate: "2025-03-31",
    forecastEnd: "2025-05-15",
    manager: "Rafael Torres",
    milestones: [
      { name: "Design & Protótipo", value: 29000, status: "done", dueDate: "2024-11-15" },
      { name: "Backend API", value: 36250, status: "done", dueDate: "2025-01-15" },
      { name: "Frontend Mobile", value: 43500, status: "done", dueDate: "2025-02-28" },
      { name: "QA & Testes", value: 21750, status: "in_progress", dueDate: "2025-03-20" },
      { name: "Deploy & Lançamento", value: 14500, status: "pending", dueDate: "2025-03-31" },
    ],
    burnHistory: [
      { week: "S1", planned: 14500, actual: 15200, earned: 14000 },
      { week: "S2", planned: 29000, actual: 32400, earned: 27500 },
      { week: "S3", planned: 43500, actual: 51800, earned: 40000 },
      { week: "S4", planned: 58000, actual: 72500, earned: 54000 },
      { week: "S5", planned: 72500, actual: 92000, earned: 67000 },
      { week: "S6", planned: 87000, actual: 112500, earned: 80000 },
      { week: "S7", planned: 101500, actual: 134200, earned: 93000 },
      { week: "S8", planned: 116000, actual: 152800, earned: 106000 },
      { week: "S9", planned: 127600, actual: 168000, earned: 118000 },
      { week: "S10", planned: 136000, actual: 178400, earned: 127600 },
    ],
    team: [
      { name: "Rafael Torres", role: "Tech Lead", allocation: 100, costPerHour: 170 },
      { name: "Fernanda Alves", role: "Designer UX", allocation: 80, costPerHour: 130 },
      { name: "Lucas Oliveira", role: "Dev Mobile Sr.", allocation: 100, costPerHour: 160 },
      { name: "Mariana Silva", role: "Dev Mobile Jr.", allocation: 100, costPerHour: 90 },
      { name: "Bruno Ferreira", role: "QA Engineer", allocation: 60, costPerHour: 110 },
    ],
    risks: [
      { description: "Escopo cresceu 35% sem reajuste de orçamento", probability: "high", impact: "high", mitigation: "Renegociar contrato com aditivo de escopo" },
      { description: "Prazo de lançamento na App Store pode atrasar", probability: "high", impact: "medium", mitigation: "Submeter versão beta antecipadamente" },
      { description: "Performance em dispositivos Android antigos", probability: "medium", impact: "medium", mitigation: "Testes em device farm + otimização lazy load" },
    ],
    risks_extra: [],
    cpi: 0.72,
    spi: 0.82,
    eac: 201389,
    vac: -56389,
    tcpi: 1.92,
    aiRiskScore: 82,
    aiPredictedMargin: -18.5,
    aiCompletionProbability: 61,
    aiAlerts: [
      "CPI 0.72 — custo real 38% acima do planejado por unidade de trabalho entregue",
      "TCPI 1.92 — precisaria dobrar a eficiência para cumprir o orçamento original",
      "Previsão de estouro de R$ 56.389 com base na tendência atual",
      "Recomendação: renegociar escopo ou aprovar aditivo contratual",
    ],
  },
  {
    id: "proj-003",
    name: "Consultoria M&A",
    client: "FintechBR",
    category: "consulting",
    budgeted: 420000,
    actual: 186000,
    margin: 55.7,
    progress: 44,
    status: "on_track",
    startDate: "2025-01-15",
    endDate: "2025-09-30",
    forecastEnd: "2025-09-20",
    manager: "Daniela Rocha",
    milestones: [
      { name: "Due Diligence Inicial", value: 84000, status: "done", dueDate: "2025-03-15" },
      { name: "Valuation & Modelagem", value: 105000, status: "in_progress", dueDate: "2025-05-30" },
      { name: "Negociação & Estruturação", value: 126000, status: "pending", dueDate: "2025-07-31" },
      { name: "Fechamento & Integração", value: 105000, status: "pending", dueDate: "2025-09-30" },
    ],
    burnHistory: [
      { week: "S1", planned: 42000, actual: 38000, earned: 40000 },
      { week: "S2", planned: 84000, actual: 78000, earned: 82000 },
      { week: "S3", planned: 126000, actual: 118000, earned: 124000 },
      { week: "S4", planned: 168000, actual: 156000, earned: 165000 },
      { week: "S5", planned: 189000, actual: 172000, earned: 185000 },
      { week: "S6", planned: 210000, actual: 186000, earned: 205000 },
    ],
    team: [
      { name: "Daniela Rocha", role: "Sócia M&A", allocation: 60, costPerHour: 350 },
      { name: "André Bastos", role: "Analista Financeiro Sr.", allocation: 100, costPerHour: 180 },
      { name: "Camila Nunes", role: "Analista Jurídico", allocation: 50, costPerHour: 200 },
    ],
    risks: [
      { description: "Informações incompletas da target", probability: "medium", impact: "high", mitigation: "Checklist rigoroso + data room estruturado" },
      { description: "Mudança regulatória CADE", probability: "low", impact: "high", mitigation: "Parecer jurídico preventivo + cenários alternativos" },
    ],
    cpi: 1.10,
    spi: 1.05,
    eac: 381818,
    vac: 38182,
    tcpi: 0.92,
    aiRiskScore: 18,
    aiPredictedMargin: 58.2,
    aiCompletionProbability: 97,
    aiAlerts: [],
  },
  {
    id: "proj-004",
    name: "Integração API Pagamentos",
    client: "ComércioSul",
    category: "development",
    budgeted: 95000,
    actual: 72000,
    margin: 24.2,
    progress: 62,
    status: "at_risk",
    startDate: "2024-12-01",
    endDate: "2025-04-30",
    forecastEnd: "2025-06-10",
    manager: "Felipe Martins",
    milestones: [
      { name: "Análise APIs Gateway", value: 19000, status: "done", dueDate: "2025-01-15" },
      { name: "Desenvolvimento Core", value: 38000, status: "in_progress", dueDate: "2025-03-15" },
      { name: "Homologação & Testes", value: 23750, status: "pending", dueDate: "2025-04-15" },
      { name: "Go-live Produção", value: 14250, status: "pending", dueDate: "2025-04-30" },
    ],
    burnHistory: [
      { week: "S1", planned: 9500, actual: 9000, earned: 9200 },
      { week: "S2", planned: 19000, actual: 18500, earned: 18000 },
      { week: "S3", planned: 28500, actual: 28000, earned: 26000 },
      { week: "S4", planned: 38000, actual: 38500, earned: 34000 },
      { week: "S5", planned: 47500, actual: 48200, earned: 41000 },
      { week: "S6", planned: 57000, actual: 58500, earned: 48000 },
      { week: "S7", planned: 66500, actual: 65800, earned: 53000 },
      { week: "S8", planned: 76000, actual: 72000, earned: 58900 },
    ],
    team: [
      { name: "Felipe Martins", role: "Tech Lead", allocation: 80, costPerHour: 160 },
      { name: "Gustavo Reis", role: "Dev Backend Sr.", allocation: 100, costPerHour: 150 },
      { name: "Larissa Duarte", role: "Dev Backend Jr.", allocation: 100, costPerHour: 85 },
    ],
    risks: [
      { description: "API do gateway com documentação desatualizada", probability: "high", impact: "medium", mitigation: "Contato direto com time técnico do fornecedor" },
      { description: "Certificação PCI-DSS pendente", probability: "medium", impact: "high", mitigation: "Consultoria especializada contratada" },
      { description: "Baixa velocidade de entrega nas últimas sprints", probability: "high", impact: "high", mitigation: "Alocar dev senior adicional" },
    ],
    cpi: 0.82,
    spi: 0.78,
    eac: 115854,
    vac: -20854,
    tcpi: 1.57,
    aiRiskScore: 68,
    aiPredictedMargin: 12.4,
    aiCompletionProbability: 72,
    aiAlerts: [
      "SPI 0.78 — entregas 22% abaixo do ritmo planejado",
      "Risco de atraso de 41 dias no cronograma original",
      "Recomendação: revisar alocação da equipe e priorizar backlog",
    ],
  },
  {
    id: "proj-005",
    name: "Migração Cloud AWS",
    client: "IndústriaBR",
    category: "infrastructure",
    budgeted: 380000,
    actual: 245000,
    margin: 35.5,
    progress: 58,
    status: "at_risk",
    startDate: "2024-11-01",
    endDate: "2025-05-31",
    forecastEnd: "2025-07-15",
    manager: "Ricardo Lopes",
    milestones: [
      { name: "Assessment & Planejamento", value: 57000, status: "done", dueDate: "2025-01-15" },
      { name: "Migração Fase 1 (Dev/Staging)", value: 95000, status: "done", dueDate: "2025-03-01" },
      { name: "Migração Fase 2 (Produção)", value: 114000, status: "in_progress", dueDate: "2025-04-30" },
      { name: "Otimização & FinOps", value: 57000, status: "pending", dueDate: "2025-05-15" },
      { name: "Handover & Documentação", value: 57000, status: "pending", dueDate: "2025-05-31" },
    ],
    burnHistory: [
      { week: "S1", planned: 38000, actual: 36000, earned: 37000 },
      { week: "S2", planned: 76000, actual: 74000, earned: 74000 },
      { week: "S3", planned: 114000, actual: 115000, earned: 110000 },
      { week: "S4", planned: 152000, actual: 158000, earned: 145000 },
      { week: "S5", planned: 190000, actual: 198000, earned: 176000 },
      { week: "S6", planned: 228000, actual: 232000, earned: 204000 },
      { week: "S7", planned: 266000, actual: 245000, earned: 220000 },
    ],
    team: [
      { name: "Ricardo Lopes", role: "Cloud Architect", allocation: 100, costPerHour: 200 },
      { name: "Thiago Barbosa", role: "DevOps Engineer", allocation: 100, costPerHour: 160 },
      { name: "Patrícia Souza", role: "SRE", allocation: 80, costPerHour: 150 },
      { name: "Diego Moura", role: "DBA", allocation: 60, costPerHour: 140 },
    ],
    risks: [
      { description: "Downtime durante migração de banco produção", probability: "medium", impact: "high", mitigation: "Blue-green deployment + janela de manutenção noturna" },
      { description: "Custos AWS acima do estimado pós-migração", probability: "high", impact: "medium", mitigation: "FinOps review semanal + Reserved Instances" },
      { description: "Dependências de sistemas legados não mapeadas", probability: "medium", impact: "high", mitigation: "Discovery automatizado com ferramentas de mapeamento" },
    ],
    cpi: 0.90,
    spi: 0.83,
    eac: 422222,
    vac: -42222,
    tcpi: 1.19,
    aiRiskScore: 62,
    aiPredictedMargin: 22.8,
    aiCompletionProbability: 74,
    aiAlerts: [
      "SPI 0.83 — projeto entregando 17% abaixo do ritmo necessário",
      "Previsão de atraso de 45 dias e estouro de R$ 42.222",
      "Custos de infraestrutura AWS subindo acima do previsto",
    ],
  },
  {
    id: "proj-006",
    name: "Dashboard BI",
    client: "LogísticaXP",
    category: "development",
    budgeted: 120000,
    actual: 52000,
    margin: 56.7,
    progress: 38,
    status: "on_track",
    startDate: "2025-02-01",
    endDate: "2025-07-31",
    forecastEnd: "2025-07-20",
    manager: "Vanessa Campos",
    milestones: [
      { name: "Levantamento KPIs", value: 18000, status: "done", dueDate: "2025-02-28" },
      { name: "Modelagem de Dados", value: 30000, status: "in_progress", dueDate: "2025-04-15" },
      { name: "Desenvolvimento Dashboards", value: 42000, status: "pending", dueDate: "2025-06-15" },
      { name: "Deploy & Treinamento", value: 30000, status: "pending", dueDate: "2025-07-31" },
    ],
    burnHistory: [
      { week: "S1", planned: 12000, actual: 11000, earned: 11500 },
      { week: "S2", planned: 24000, actual: 22500, earned: 23500 },
      { week: "S3", planned: 36000, actual: 34000, earned: 35000 },
      { week: "S4", planned: 48000, actual: 46000, earned: 46500 },
      { week: "S5", planned: 54000, actual: 52000, earned: 53000 },
    ],
    team: [
      { name: "Vanessa Campos", role: "Data Lead", allocation: 80, costPerHour: 170 },
      { name: "Igor Nascimento", role: "Eng. de Dados", allocation: 100, costPerHour: 140 },
      { name: "Aline Teixeira", role: "Analista BI", allocation: 100, costPerHour: 110 },
    ],
    risks: [
      { description: "Qualidade dos dados de origem irregular", probability: "medium", impact: "medium", mitigation: "Pipeline de limpeza + validação automatizada" },
    ],
    cpi: 1.02,
    spi: 1.04,
    eac: 117647,
    vac: 2353,
    tcpi: 0.99,
    aiRiskScore: 15,
    aiPredictedMargin: 58.1,
    aiCompletionProbability: 96,
    aiAlerts: [],
  },
  {
    id: "proj-007",
    name: "Auditoria SOC2",
    client: "SaaS Corp",
    category: "audit",
    budgeted: 210000,
    actual: 210000,
    margin: 42.3,
    progress: 100,
    status: "completed",
    startDate: "2024-06-01",
    endDate: "2024-12-31",
    forecastEnd: "2024-12-28",
    manager: "Patrícia Gomes",
    milestones: [
      { name: "Gap Analysis", value: 42000, status: "done", dueDate: "2024-07-31" },
      { name: "Implementação Controles", value: 63000, status: "done", dueDate: "2024-09-30" },
      { name: "Testes de Evidência", value: 52500, status: "done", dueDate: "2024-11-15" },
      { name: "Relatório Final & Certificação", value: 52500, status: "done", dueDate: "2024-12-31" },
    ],
    burnHistory: [
      { week: "S1", planned: 26250, actual: 25000, earned: 26000 },
      { week: "S2", planned: 52500, actual: 50000, earned: 51500 },
      { week: "S3", planned: 78750, actual: 76000, earned: 78000 },
      { week: "S4", planned: 105000, actual: 102000, earned: 104000 },
      { week: "S5", planned: 131250, actual: 128000, earned: 130000 },
      { week: "S6", planned: 157500, actual: 155000, earned: 156500 },
      { week: "S7", planned: 183750, actual: 182000, earned: 183000 },
      { week: "S8", planned: 210000, actual: 210000, earned: 210000 },
    ],
    team: [
      { name: "Patrícia Gomes", role: "Lead Auditor", allocation: 100, costPerHour: 220 },
      { name: "Renato Dias", role: "Security Analyst", allocation: 80, costPerHour: 160 },
      { name: "Bianca Melo", role: "Compliance Specialist", allocation: 60, costPerHour: 140 },
    ],
    risks: [],
    cpi: 1.00,
    spi: 1.00,
    eac: 210000,
    vac: 0,
    tcpi: 1.00,
    aiRiskScore: 0,
    aiPredictedMargin: 42.3,
    aiCompletionProbability: 100,
    aiAlerts: [],
  },
  {
    id: "proj-008",
    name: "Chatbot IA Atendimento",
    client: "VarejoMax",
    category: "development",
    budgeted: 175000,
    actual: 98000,
    margin: 44.0,
    progress: 52,
    status: "on_track",
    startDate: "2025-01-10",
    endDate: "2025-08-15",
    forecastEnd: "2025-08-10",
    manager: "Eduardo Prado",
    milestones: [
      { name: "Definição de Intents & NLP", value: 35000, status: "done", dueDate: "2025-02-28" },
      { name: "Treinamento Modelo", value: 52500, status: "in_progress", dueDate: "2025-04-30" },
      { name: "Integração Canais (Web/WhatsApp)", value: 43750, status: "pending", dueDate: "2025-06-30" },
      { name: "Otimização & Métricas", value: 26250, status: "pending", dueDate: "2025-07-31" },
      { name: "Go-live & Monitoramento", value: 17500, status: "pending", dueDate: "2025-08-15" },
    ],
    burnHistory: [
      { week: "S1", planned: 17500, actual: 16000, earned: 17000 },
      { week: "S2", planned: 35000, actual: 33000, earned: 34500 },
      { week: "S3", planned: 52500, actual: 50000, earned: 51000 },
      { week: "S4", planned: 70000, actual: 67000, earned: 68500 },
      { week: "S5", planned: 87500, actual: 84000, earned: 86000 },
      { week: "S6", planned: 96250, actual: 91000, earned: 93000 },
      { week: "S7", planned: 105000, actual: 98000, earned: 102000 },
    ],
    team: [
      { name: "Eduardo Prado", role: "ML Engineer Lead", allocation: 100, costPerHour: 190 },
      { name: "Natália Ribeiro", role: "NLP Specialist", allocation: 100, costPerHour: 170 },
      { name: "Caio Almeida", role: "Full Stack Dev", allocation: 80, costPerHour: 130 },
      { name: "Isabela Freitas", role: "UX Writer", allocation: 40, costPerHour: 100 },
    ],
    risks: [
      { description: "Acurácia do modelo abaixo de 85% no go-live", probability: "medium", impact: "high", mitigation: "Dataset expandido + fine-tuning iterativo" },
      { description: "Latência de resposta > 3s no WhatsApp", probability: "low", impact: "medium", mitigation: "Cache de respostas frequentes + edge computing" },
    ],
    cpi: 1.04,
    spi: 1.03,
    eac: 168269,
    vac: 6731,
    tcpi: 0.95,
    aiRiskScore: 28,
    aiPredictedMargin: 46.2,
    aiCompletionProbability: 93,
    aiAlerts: [],
  },
];
