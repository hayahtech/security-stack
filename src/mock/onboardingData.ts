export const segments = [
  { id: "saas", label: "SaaS / Tech", icon: "🖥️" },
  { id: "varejo", label: "Varejo", icon: "🛍️" },
  { id: "servicos", label: "Serviços", icon: "⚙️" },
  { id: "industria", label: "Indústria", icon: "🏭" },
  { id: "agro", label: "Agronegócio", icon: "🌾" },
  { id: "construcao", label: "Construção", icon: "🏗️" },
  { id: "saude", label: "Saúde", icon: "🏥" },
  { id: "educacao", label: "Educação", icon: "📚" },
  { id: "alimentacao", label: "Alimentação", icon: "🍕" },
  { id: "outro", label: "Outro...", icon: "📦" },
];

export const companySize = [
  { id: "micro", label: "Até R$ 1M/ano" },
  { id: "pequena", label: "R$ 1M a R$ 10M" },
  { id: "media", label: "R$ 10M a R$ 100M" },
  { id: "grande", label: "Acima de R$ 100M" },
];

export const roles = [
  { id: "ceo", label: "CEO / Sócio" },
  { id: "cfo", label: "CFO / Diretor Financeiro" },
  { id: "controller", label: "Controller" },
  { id: "contador", label: "Contador" },
  { id: "gestor", label: "Gestor Financeiro" },
];

export const concerns = [
  { id: "fluxo", label: "Fluxo de caixa negativo" },
  { id: "inadimplencia", label: "Inadimplência alta" },
  { id: "lucro", label: "Não sei se a empresa dá lucro" },
  { id: "custos", label: "Falta de visibilidade dos custos" },
  { id: "captacao", label: "Preparação para captação" },
  { id: "compliance", label: "Compliance / auditoria" },
  { id: "crescimento", label: "Crescimento desorganizado" },
  { id: "contador_int", label: "Integração com contador" },
];

export const segmentConfig: Record<string, {
  accounts: number;
  kpis: string[];
  focusLabel: string;
  tips: string;
}> = {
  saas: {
    accounts: 120,
    kpis: ["MRR", "Churn", "CAC", "LTV", "Burn Rate"],
    focusLabel: "Receita Recorrente e Unit Economics",
    tips: "Otimizado para métricas SaaS e receita recorrente",
  },
  varejo: {
    accounts: 95,
    kpis: ["CMV", "Giro de Estoque", "Ticket Médio", "Margem Bruta", "Vendas/m²"],
    focusLabel: "Gestão de Estoque e Margem",
    tips: "Foco em controle de estoque e margem por produto",
  },
  servicos: {
    accounts: 80,
    kpis: ["Margem por Projeto", "Utilização", "PMR", "Backlog", "Revenue/FTE"],
    focusLabel: "Rentabilidade por Projeto",
    tips: "Otimizado para controle de projetos e alocação",
  },
  industria: {
    accounts: 140,
    kpis: ["Custo Unitário", "OEE", "CMV", "Lead Time", "Capacidade"],
    focusLabel: "Custos de Produção e Eficiência",
    tips: "Foco em custos industriais e eficiência produtiva",
  },
  agro: {
    accounts: 110,
    kpis: ["Custo/Hectare", "Produtividade", "Margem Safra", "Estoque Grãos", "Hedge"],
    focusLabel: "Gestão por Safra e Commodities",
    tips: "Termos adaptados: safra, talhão, silo",
  },
  construcao: {
    accounts: 130,
    kpis: ["Custo/m²", "Avanço Obra", "BDI", "Margem Obra", "Medição"],
    focusLabel: "Controle por Obra e Medições",
    tips: "Termos adaptados: obra, etapa, medição",
  },
  saude: {
    accounts: 100,
    kpis: ["Receita/Leito", "Glosa", "Ticket Consulta", "Ocupação", "CMV Materiais"],
    focusLabel: "Gestão de Glosas e Ocupação",
    tips: "Foco em controle de glosas e materiais hospitalares",
  },
  educacao: {
    accounts: 85,
    kpis: ["Receita/Aluno", "Inadimplência", "Evasão", "Custo/Aluno", "Ocupação Turmas"],
    focusLabel: "Receita por Aluno e Retenção",
    tips: "Foco em controle de matrículas e evasão",
  },
  alimentacao: {
    accounts: 90,
    kpis: ["CMV Food", "Ticket Médio", "Custo MP", "Desperdício", "Vendas/Dia"],
    focusLabel: "CMV e Controle de Insumos",
    tips: "Foco em custo de matéria-prima e desperdício",
  },
  outro: {
    accounts: 75,
    kpis: ["Receita", "Margem", "Fluxo de Caixa", "Inadimplência", "EBITDA"],
    focusLabel: "Visão Financeira Geral",
    tips: "Configuração padrão personalizável",
  },
};
