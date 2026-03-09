export interface KeyResult {
  id: string;
  description: string;
  target: string;
  current: string;
  progress: number;
  status: "on_track" | "at_risk" | "achieved" | "behind";
  responsible: { name: string; initials: string };
  checkins: { date: string; value: string; comment: string }[];
}

export interface Objective {
  id: string;
  title: string;
  keyResults: KeyResult[];
}

export const objectives: Objective[] = [
  {
    id: "1",
    title: "Crescer receita com eficiência",
    keyResults: [
      {
        id: "1.1", description: "MRR > R$ 5.200.000 em março", target: "R$ 5.200.000", current: "R$ 4.850.000", progress: 93.3, status: "at_risk",
        responsible: { name: "Carlos Mendes", initials: "CM" },
        checkins: [
          { date: "07/03", value: "R$ 4.850.000", comment: "Pipeline forte, 3 deals grandes em negociação" },
          { date: "28/02", value: "R$ 4.720.000", comment: "Crescimento orgânico dentro do esperado" },
          { date: "21/02", value: "R$ 4.680.000", comment: "2 novos enterprise fechados" },
        ],
      },
      {
        id: "1.2", description: "Churn < 2%", target: "< 2%", current: "2,3%", progress: 87, status: "behind",
        responsible: { name: "Ana Ferreira", initials: "AF" },
        checkins: [
          { date: "07/03", value: "2,3%", comment: "Perdemos 2 clientes mid-market — investigando causas" },
          { date: "28/02", value: "2,1%", comment: "Melhorou com ações de CS proativo" },
        ],
      },
      {
        id: "1.3", description: "CAC Payback < 15 meses", target: "< 15m", current: "17m", progress: 88, status: "at_risk",
        responsible: { name: "Rafael Costa", initials: "RC" },
        checkins: [
          { date: "07/03", value: "17m", comment: "Reduzindo CAC com foco em inbound" },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Melhorar eficiência de caixa",
    keyResults: [
      {
        id: "2.1", description: "Margem EBITDA > 38%", target: "> 38%", current: "40,4%", progress: 100, status: "achieved",
        responsible: { name: "João Silva", initials: "JS" },
        checkins: [
          { date: "07/03", value: "40,4%", comment: "Meta batida! Controle de custos funcionando" },
        ],
      },
      {
        id: "2.2", description: "PMR < 25 dias", target: "< 25d", current: "28 dias", progress: 89, status: "at_risk",
        responsible: { name: "Lucia Santos", initials: "LS" },
        checkins: [
          { date: "07/03", value: "28d", comment: "Régua de cobrança ajudando, mas 3 clientes grandes puxam para cima" },
        ],
      },
      {
        id: "2.3", description: "Inadimplência < 10%", target: "< 10%", current: "14,7%", progress: 68, status: "behind",
        responsible: { name: "Ana Ferreira", initials: "AF" },
        checkins: [
          { date: "07/03", value: "14,7%", comment: "Ações de cobrança intensificadas, mas longe da meta" },
        ],
      },
    ],
  },
  {
    id: "3",
    title: "Fortalecer estrutura financeira",
    keyResults: [
      {
        id: "3.1", description: "Dívida/EBITDA < 0,5x", target: "< 0,5x", current: "0,33x", progress: 100, status: "achieved",
        responsible: { name: "João Silva", initials: "JS" },
        checkins: [{ date: "07/03", value: "0,33x", comment: "Excelente — bem abaixo do limite" }],
      },
      {
        id: "3.2", description: "Liquidez Corrente > 1,5", target: "> 1,5", current: "1,62", progress: 100, status: "achieved",
        responsible: { name: "Maria Souza", initials: "MS" },
        checkins: [{ date: "07/03", value: "1,62", comment: "Estável acima da meta" }],
      },
      {
        id: "3.3", description: "Fundo de reserva ≥ R$ 3M", target: "≥ R$ 3M", current: "R$ 4,37M", progress: 100, status: "achieved",
        responsible: { name: "Maria Souza", initials: "MS" },
        checkins: [{ date: "07/03", value: "R$ 4,37M", comment: "Reserva robusta, acima do mínimo" }],
      },
    ],
  },
];

export const quarterScore = 71;

export const simpleModeTranslations: Record<string, { title: string; explanation: string; verdict: string; emoji: string }> = {
  "liquidez_corrente": {
    title: "Saúde do Caixa",
    explanation: "Para cada R$ 1 que você deve nos próximos 12 meses, você tem R$ 1,62 disponível.",
    verdict: "Você está seguro. Tem mais do que o necessário para cobrir suas obrigações de curto prazo.",
    emoji: "💚",
  },
  "ebitda": {
    title: "Lucro Operacional",
    explanation: "O negócio gerou R$ 1,8M de lucro antes de impostos só em março — isso representa 40% de cada real faturado ficando no bolso como resultado.",
    verdict: "Isso é excelente. A maioria das empresas do seu segmento opera com margem de 25-30%.",
    emoji: "💰",
  },
  "divida_ebitda": {
    title: "Nível de Endividamento",
    explanation: "Sua dívida está confortável: você precisaria de apenas 4 meses de lucro para quitá-la inteiramente.",
    verdict: "Isso é considerado excelente pelo mercado. Empresas saudáveis ficam abaixo de 2x.",
    emoji: "🏦",
  },
  "roe": {
    title: "Quanto cada real dos sócios rendeu",
    explanation: "Para cada R$ 1 que os sócios têm investido, o negócio devolveu R$ 0,27 de lucro nos últimos 12 meses.",
    verdict: "Isso é muito bom. Supera a maioria dos investimentos financeiros do mercado.",
    emoji: "📈",
  },
  "pmr": {
    title: "Quantos dias você espera para receber",
    explanation: "Após vender, você espera em média 28 dias para receber o dinheiro.",
    verdict: "Atenção: a meta é 25 dias. Clientes grandes estão demorando mais.",
    emoji: "⏳",
  },
  "ncg": {
    title: "Dinheiro parado para o negócio girar",
    explanation: "Você precisa manter R$ 4,9M em caixa o tempo todo só para o negócio funcionar no dia a dia.",
    verdict: "Isso inclui o que você espera receber menos o que precisa pagar.",
    emoji: "🔄",
  },
  "roic": {
    title: "Retorno de cada real investido",
    explanation: "Para cada R$ 1 investido no negócio (equipamentos, software, capital de giro), você gerou R$ 0,31 de retorno.",
    verdict: "Bom retorno — o investimento está se pagando.",
    emoji: "🎯",
  },
  "churn": {
    title: "Quantos clientes saíram",
    explanation: "2,3% dos seus clientes cancelaram no último mês. São aproximadamente 19 clientes.",
    verdict: "Acima da meta de 2%. Investigar causas e agir com CS proativo.",
    emoji: "🔴",
  },
};
