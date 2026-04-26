export interface Report {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  lastGenerated: string;
  frequency: string;
}

export const reports: Report[] = [
  { id: "1", name: "Relatório Executivo Mensal", description: "Visão consolidada de todos os indicadores financeiros", icon: "BarChart3", category: "Executivo", lastGenerated: "2025-03-01", frequency: "Mensal" },
  { id: "2", name: "DRE Completa", description: "Demonstração de resultado do exercício detalhada", icon: "FileText", category: "Contábil", lastGenerated: "2025-03-01", frequency: "Mensal" },
  { id: "3", name: "Balanço Patrimonial", description: "Posição patrimonial com ativo, passivo e PL", icon: "Scale", category: "Contábil", lastGenerated: "2025-03-01", frequency: "Mensal" },
  { id: "4", name: "Fluxo de Caixa", description: "Movimentação de caixa detalhada por categoria", icon: "Wallet", category: "Tesouraria", lastGenerated: "2025-03-05", frequency: "Semanal" },
  { id: "5", name: "Aging de Recebíveis", description: "Análise de vencimento das contas a receber", icon: "Clock", category: "Contas", lastGenerated: "2025-03-05", frequency: "Semanal" },
  { id: "6", name: "Análise de Inadimplência", description: "Detalhamento de títulos vencidos e provisão", icon: "AlertTriangle", category: "Contas", lastGenerated: "2025-03-01", frequency: "Mensal" },
  { id: "7", name: "Posição de Tesouraria", description: "Saldo de caixa, aplicações e compromissos", icon: "Landmark", category: "Tesouraria", lastGenerated: "2025-03-07", frequency: "Diário" },
  { id: "8", name: "KPIs Dashboard", description: "Painel completo de indicadores-chave", icon: "Gauge", category: "Executivo", lastGenerated: "2025-03-07", frequency: "Semanal" },
  { id: "9", name: "Análise de Margens", description: "Evolução das margens bruta, EBITDA e líquida", icon: "TrendingUp", category: "Análise", lastGenerated: "2025-03-01", frequency: "Mensal" },
  { id: "10", name: "Relatório Fiscal/Tributário", description: "Apuração de impostos e obrigações fiscais", icon: "Receipt", category: "Fiscal", lastGenerated: "2025-03-01", frequency: "Mensal" },
  { id: "11", name: "Comparativo Orçado vs Realizado", description: "Variações entre orçamento e execução real", icon: "GitCompare", category: "Planejamento", lastGenerated: "2025-03-01", frequency: "Mensal" },
  { id: "12", name: "Relatório de Projeções", description: "Cenários de forecasting para 12 meses", icon: "Telescope", category: "Planejamento", lastGenerated: "2025-03-01", frequency: "Trimestral" },
];

export const reportsHistory = [
  { report: "Relatório Executivo Mensal", date: "2025-03-01", format: "PDF", user: "Admin" },
  { report: "DRE Completa", date: "2025-03-01", format: "Excel", user: "Admin" },
  { report: "Fluxo de Caixa", date: "2025-03-05", format: "PDF", user: "CFO" },
  { report: "Posição de Tesouraria", date: "2025-03-07", format: "PDF", user: "Tesoureiro" },
  { report: "KPIs Dashboard", date: "2025-03-07", format: "PDF", user: "CEO" },
  { report: "Aging de Recebíveis", date: "2025-03-05", format: "Excel", user: "Controller" },
];
