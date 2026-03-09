export interface Provision {
  id: string;
  description: string;
  value: number;
  competence: string;
  payment: string;
  type: "Recorrente" | "Pontual" | "Estimada" | "Diferimento";
  status: "active" | "realized" | "review" | "in_progress";
  details?: {
    totalPaid?: number;
    monthlyRecognition?: number;
    monthsTotal?: number;
    monthsConsumed?: number;
  };
}

export const provisions: Provision[] = [
  { id: "1", description: "13º salário (provisão mensal)", value: 74167, competence: "Mar/25", payment: "Dez/25", type: "Recorrente", status: "active" },
  { id: "2", description: "Férias (provisão mensal)", value: 98889, competence: "Mar/25", payment: "Ao tirar", type: "Recorrente", status: "active" },
  { id: "3", description: "FGTS sobre provisões", value: 13845, competence: "Mar/25", payment: "Dez/25", type: "Recorrente", status: "active" },
  { id: "4", description: "Aluguel jan (pago em fev)", value: 42000, competence: "Jan/25", payment: "Fev/25", type: "Pontual", status: "realized" },
  { id: "5", description: "Contingência trabalhista", value: 180000, competence: "—", payment: "Indefinido", type: "Estimada", status: "review" },
  { id: "6", description: "Software anual pago à vista", value: 340800, competence: "Mar-Fev", payment: "Mar/25", type: "Diferimento", status: "in_progress", details: { totalPaid: 340800, monthlyRecognition: 28400, monthsTotal: 12, monthsConsumed: 1 } },
  { id: "7", description: "Bônus anual equipe comercial", value: 145000, competence: "Mar/25", payment: "Jan/26", type: "Recorrente", status: "active" },
  { id: "8", description: "Provisão para garantia (produtos)", value: 32500, competence: "Mar/25", payment: "Sob demanda", type: "Estimada", status: "active" },
  { id: "9", description: "Seguro empresarial (anual)", value: 186000, competence: "Mar-Fev", payment: "Mar/25", type: "Diferimento", status: "in_progress", details: { totalPaid: 186000, monthlyRecognition: 15500, monthsTotal: 12, monthsConsumed: 1 } },
  { id: "10", description: "IPTU parcelado (competência anual)", value: 8400, competence: "Mar/25", payment: "Mar/25", type: "Pontual", status: "realized" },
  { id: "11", description: "Contingência cível — processo 0042", value: 250000, competence: "—", payment: "Indefinido", type: "Estimada", status: "review" },
  { id: "12", description: "Comissões de vendas (diferidas)", value: 67800, competence: "Mar/25", payment: "Abr/25", type: "Recorrente", status: "active" },
];

export const cashVsAccrual = {
  cashResult: 1526500,
  accrualResult: 1847200,
  difference: 320700,
  explanations: [
    { desc: "13º + Férias + FGTS (provisões trabalhistas)", value: 186901 },
    { desc: "Software anual — diferimento", value: -312400 },
    { desc: "Receita reconhecida antes do recebimento", value: 284500 },
    { desc: "Aluguel competência dez pago jan", value: 42000 },
    { desc: "Comissões diferidas", value: 67800 },
    { desc: "Seguro diferido", value: -170500 },
    { desc: "Outros ajustes de competência", value: 222399 },
  ],
};
