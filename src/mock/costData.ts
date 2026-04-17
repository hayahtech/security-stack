export const costBreakdown = {
  fixos: {
    total: 1248000,
    items: [
      { name: "Folha de Pagamento", value: 720000, pct: 57.7 },
      { name: "Aluguel & Infraestrutura", value: 185000, pct: 14.8 },
      { name: "Contratos Fixos", value: 148000, pct: 11.9 },
      { name: "Seguros & Compliance", value: 95000, pct: 7.6 },
      { name: "Outros Fixos", value: 100000, pct: 8.0 },
    ],
  },
  variaveis: {
    total: 687000,
    items: [
      { name: "Comissões de Vendas", value: 291000, pct: 42.4 },
      { name: "Marketing Performance", value: 198000, pct: 28.8 },
      { name: "Infra Cloud Escalável", value: 142000, pct: 20.7 },
      { name: "Outros Variáveis", value: 56000, pct: 8.1 },
    ],
  },
  semivariaveis: {
    total: 410000,
    items: [
      { name: "Suporte ao Cliente", value: 180000, pct: 43.9 },
      { name: "Ferramentas & Licenças", value: 120000, pct: 29.3 },
      { name: "Viagens & Eventos", value: 65000, pct: 15.9 },
      { name: "Treinamentos", value: 45000, pct: 11.0 },
    ],
  },
};

export const breakevenData = {
  custoFixoTotal: 1248000,
  margemContribuicao: 0.724,
  receitaMinima: 1723000,
  receitaAtual: 4850000,
  margemSeguranca: 64.5,
};

export const costCenters = [
  { name: "Comercial", value: 685000, pct: 29.2, color: "hsl(var(--primary))" },
  { name: "Produto", value: 520000, pct: 22.2, color: "hsl(var(--secondary))" },
  { name: "Operações", value: 448000, pct: 19.1, color: "hsl(var(--success))" },
  { name: "G&A", value: 392000, pct: 16.7, color: "hsl(187 80% 60%)" },
  { name: "Marketing", value: 300000, pct: 12.8, color: "hsl(252 80% 80%)" },
];

export const costEvolution = [
  { month: "Out/24", custos: 2180, receita: 4200 },
  { month: "Nov/24", custos: 2210, receita: 4350 },
  { month: "Dez/24", custos: 2280, receita: 4500 },
  { month: "Jan/25", custos: 2300, receita: 4620 },
  { month: "Fev/25", custos: 2320, receita: 4730 },
  { month: "Mar/25", custos: 2345, receita: 4850 },
];

export const efficiencyMetrics = {
  custoPerCliente: 2769,
  custoPorRealReceita: 0.48,
  clientesTotal: 847,
};

export const costReductionOpportunities = [
  { id: 1, initiative: "Renegociar AWS", saving: 72000, pctSaving: 14.8, status: "Em análise", responsible: "CTO", roi: "4,2x", priority: "Alta" },
  { id: 2, initiative: "Consolidar licenças SaaS", saving: 28000, pctSaving: 23.3, status: "Em andamento", responsible: "COO", roi: "6,8x", priority: "Média" },
  { id: 3, initiative: "Otimizar headcount indireto", saving: 45000, pctSaving: 6.3, status: "Planejado", responsible: "VP People", roi: "3,1x", priority: "Alta" },
  { id: 4, initiative: "Renegociar locação", saving: 18000, pctSaving: 9.7, status: "Concluído", responsible: "CFO", roi: "12,0x", priority: "Baixa" },
];

export const heatmapData = [
  { category: "Pessoal", jan: 720, fev: 722, mar: 720 },
  { category: "Cloud/Infra", jan: 485, fev: 490, mar: 485 },
  { category: "Marketing", jan: 310, fev: 295, mar: 300 },
  { category: "Comissões", jan: 280, fev: 285, mar: 291 },
  { category: "Licenças", jan: 205, fev: 208, mar: 210 },
  { category: "Suporte", jan: 175, fev: 178, mar: 180 },
  { category: "Aluguel", jan: 185, fev: 185, mar: 185 },
  { category: "Outros", jan: 150, fev: 155, mar: 152 },
];
