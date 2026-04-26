export interface MetaFinanceira {
  id: string;
  nome: string;
  categoria: string;
  emoji: string;
  valorMeta: number;
  valorAtual: number;
  dataInicio: string;
  dataAlvo: string;
  cor: string;
  contribuicaoMensal: number;
  ativa: boolean;
  observacoes?: string;
}

export const metaEmojis: Record<string, string> = {
  emergencia: "🛡️",
  viagem: "✈️",
  veiculo: "🚗",
  imovel: "🏠",
  educacao: "📚",
  aposentadoria: "🌅",
  investimento: "📈",
  outros: "🎯",
};

export const metaCategories = [
  { value: "emergencia", label: "Reserva de Emergência" },
  { value: "viagem", label: "Viagem" },
  { value: "veiculo", label: "Veículo" },
  { value: "imovel", label: "Imóvel" },
  { value: "educacao", label: "Educação" },
  { value: "aposentadoria", label: "Aposentadoria" },
  { value: "investimento", label: "Investimento" },
  { value: "outros", label: "Outros" },
];

export const metaColors: Record<string, string> = {
  emergencia: "bg-indigo-500",
  viagem: "bg-violet-500",
  veiculo: "bg-amber-500",
  imovel: "bg-emerald-500",
  educacao: "bg-blue-500",
  aposentadoria: "bg-rose-500",
  investimento: "bg-teal-500",
  outros: "bg-slate-500",
};

export const averageMonthlyExpenses = 8340;

export const mockMetas: MetaFinanceira[] = [
  {
    id: "1",
    nome: "Reserva de Emergência",
    categoria: "emergencia",
    emoji: "🛡️",
    valorMeta: 30000,
    valorAtual: 20400,
    dataInicio: "2024-01-01",
    dataAlvo: "2025-12-31",
    cor: "bg-indigo-500",
    contribuicaoMensal: 800,
    ativa: true,
  },
  {
    id: "2",
    nome: "Viagem Europa 2027",
    categoria: "viagem",
    emoji: "✈️",
    valorMeta: 15000,
    valorAtual: 3300,
    dataInicio: "2024-06-01",
    dataAlvo: "2027-07-01",
    cor: "bg-violet-500",
    contribuicaoMensal: 400,
    ativa: true,
  },
  {
    id: "3",
    nome: "Troca do carro",
    categoria: "veiculo",
    emoji: "🚗",
    valorMeta: 60000,
    valorAtual: 27000,
    dataInicio: "2023-01-01",
    dataAlvo: "2026-06-01",
    cor: "bg-amber-500",
    contribuicaoMensal: 1200,
    ativa: true,
  },
];
