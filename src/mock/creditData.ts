export interface CreditModality {
  id: string;
  name: string;
  rateMonthly: number;
  rateLabel: string;
  maxInstallments: number;
  alert?: string;
}

export const creditModalities: CreditModality[] = [
  { id: "giro", name: "Capital de Giro", rateMonthly: 1.80, rateLabel: "1,80%/mês", maxInstallments: 36 },
  { id: "bndes", name: "BNDES", rateMonthly: 0.92, rateLabel: "0,92%/mês", maxInstallments: 60 },
  { id: "antecip", name: "Antecip. Recebíveis", rateMonthly: 1.45, rateLabel: "1,45%/mês", maxInstallments: 0 },
  { id: "debenture", name: "Debênture", rateMonthly: 1.05, rateLabel: "CDI+2,5%", maxInstallments: 60 },
  { id: "cheque", name: "Cheque Especial", rateMonthly: 8.20, rateLabel: "8,20%/mês", maxInstallments: 0, alert: "EVITAR 🔴" },
];

export const activeLoans = [
  { id: "1", bank: "Santander", type: "Capital de Giro", originalValue: 500000, balance: 180000, rate: "2,1%/mês", installmentsLeft: 8, nextDue: "15/03/2025", monthlyPayment: 24200 },
  { id: "2", bank: "Itaú BBA", type: "BNDES", originalValue: 2000000, balance: 1420000, rate: "0,92%/mês", installmentsLeft: 42, nextDue: "20/03/2025", monthlyPayment: 38900 },
  { id: "3", bank: "Bradesco", type: "Capital de Giro", originalValue: 800000, balance: 340000, rate: "1,75%/mês", installmentsLeft: 16, nextDue: "10/03/2025", monthlyPayment: 24800 },
];

export interface Opportunity {
  id: string;
  type: "investment" | "discount" | "renegotiation" | "receivable";
  severity: "green" | "yellow";
  title: string;
  description: string;
  potentialSaving: number;
  details: string;
  risk: string;
  actions: string[];
}

export const opportunities: Opportunity[] = [
  {
    id: "1", type: "investment", severity: "green",
    title: "APLICAÇÃO DE CAIXA OCIOSO",
    description: "R$ 1.842.300 no Itaú CC rendendo 0%",
    potentialSaving: 18240,
    details: "Aplicar em CDB 108% CDI = +R$ 18.240/mês",
    risk: "Baixíssimo | Liquidez: D+1",
    actions: ["Simular", "Marcar como feito"],
  },
  {
    id: "2", type: "discount", severity: "green",
    title: "DESCONTO POR ANTECIPAÇÃO — FORNECEDOR AWS",
    description: "Fatura de R$ 485.000 vence em 22 dias",
    potentialSaving: 8730,
    details: "AWS oferece 1,8% de desconto para pagar hoje",
    risk: "Seu caixa suporta: ✅",
    actions: ["Calcular", "Ignorar por 30 dias"],
  },
  {
    id: "3", type: "renegotiation", severity: "yellow",
    title: "RENEGOCIAÇÃO DE DÍVIDA CARA",
    description: "Empréstimo Santander a 2,1%/mês (R$ 180.000 saldo)",
    potentialSaving: 2430,
    details: "Taxa de mercado atual: 1,65%/mês. Economia com portabilidade: R$ 2.430/mês",
    risk: "Requer análise de contrato e tarifas de portabilidade",
    actions: ["Simular portabilidade", "Agendar revisão"],
  },
];

export const cashFlowWithCredit = [
  { month: "Mar", sem: 4200000, com: 4700000 },
  { month: "Abr", sem: 3800000, com: 4280000 },
  { month: "Mai", sem: 3500000, com: 3960000 },
  { month: "Jun", sem: 3100000, com: 3540000 },
  { month: "Jul", sem: 2800000, com: 3220000 },
  { month: "Ago", sem: 2400000, com: 2820000 },
  { month: "Set", sem: 2100000, com: 2500000 },
  { month: "Out", sem: 1900000, com: 2280000 },
  { month: "Nov", sem: 1600000, com: 1960000 },
  { month: "Dez", sem: 1300000, com: 1640000 },
];
