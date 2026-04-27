export interface AporteFinanceiro {
  id: string;
  meta_id: string;
  date: string;
  amount: number;
  instrument_id: string;
  observation: string;
}

export interface MetaFinanceira {
  id: string;
  name: string;
  emoji: string;
  category: string;
  target_amount: number;
  current_amount: number;
  instrument_id: string;
  target_date: string | null;
  priority: "alta" | "media" | "baixa";
  color: string;
  observations: string;
  created_at: string;
  completed_at: string | null;
  aportes: AporteFinanceiro[];
}

export const metaEmojis: string[] = [
  "🛡️", "✈️", "🚗", "🏠", "📚", "🌅", "📈", "🎯", "💍", "🎓", "💼", "🏥",
];

export const metaCategories: string[] = [
  "Reserva de emergência",
  "Viagem",
  "Veículo",
  "Imóvel",
  "Educação",
  "Aposentadoria",
  "Investimento",
  "Outros",
];

// HSL triplet strings — consumidos como `hsl(${c})` no MetasFinanceiras
export const metaColors: string[] = [
  "239 84% 67%", // indigo
  "262 83% 58%", // violet
  "38 92% 50%",  // amber
  "160 84% 39%", // emerald
  "217 91% 60%", // blue
  "350 89% 60%", // rose
  "173 80% 40%", // teal
  "215 16% 47%", // slate
];

export const averageMonthlyExpenses = 8340;

// Generate up to N months of contribution history with realistic variation
function generateAportes(
  metaId: string,
  startDate: string,
  initialAmount: number,
  monthlyAmount: number,
  months: number,
): AporteFinanceiro[] {
  const aportes: AporteFinanceiro[] = [];
  const start = new Date(startDate);

  if (initialAmount > 0) {
    aportes.push({
      id: `ap-${metaId}-0`,
      meta_id: metaId,
      date: startDate,
      amount: initialAmount,
      instrument_id: "inst-1",
      observation: "Saldo inicial",
    });
  }

  for (let i = 1; i < months; i++) {
    const date = new Date(start);
    date.setMonth(date.getMonth() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const variation = monthlyAmount * (0.8 + Math.random() * 0.4); // 80%–120%
    aportes.push({
      id: `ap-${metaId}-${i}`,
      meta_id: metaId,
      date: `${year}-${month}-${day}`,
      amount: Math.round(variation),
      instrument_id: "inst-1",
      observation: i % 12 === 0 ? "Aporte anual reforçado" : "Contribuição mensal",
    });
  }

  return aportes;
}

export const mockMetas: MetaFinanceira[] = [
  {
    id: "meta-1",
    name: "Reserva de Emergência",
    emoji: "🛡️",
    category: "Reserva de emergência",
    target_amount: 50000,
    current_amount: 48200,
    instrument_id: "inst-1",
    target_date: null,
    priority: "alta",
    color: "239 84% 67%",
    observations: "Equivalente a 6 meses de despesas (R$ 8.340/mês × 6)",
    created_at: "2023-01-15",
    completed_at: null,
    aportes: generateAportes("meta-1", "2023-01-15", 5000, 1200, 36),
  },
  {
    id: "meta-2",
    name: "Viagem Europa 2027",
    emoji: "✈️",
    category: "Viagem",
    target_amount: 35000,
    current_amount: 18500,
    instrument_id: "inst-2",
    target_date: "2027-06-01",
    priority: "media",
    color: "262 83% 58%",
    observations: "Viagem de 2 semanas para Portugal, Itália e Grécia",
    created_at: "2024-03-20",
    completed_at: null,
    aportes: generateAportes("meta-2", "2024-03-20", 2000, 850, 27),
  },
  {
    id: "meta-3",
    name: "Troca do carro",
    emoji: "🚗",
    category: "Veículo",
    target_amount: 80000,
    current_amount: 68500,
    instrument_id: "inst-3",
    target_date: "2026-12-31",
    priority: "alta",
    color: "38 92% 50%",
    observations: "Carro novo modelo 2027, entrada + financiamento",
    created_at: "2023-06-01",
    completed_at: null,
    aportes: generateAportes("meta-3", "2023-06-01", 8000, 1500, 31),
  },
  {
    id: "meta-4",
    name: "Apto para aluguel — Reforma",
    emoji: "🏠",
    category: "Imóvel",
    target_amount: 45000,
    current_amount: 45000,
    instrument_id: "inst-1",
    target_date: "2025-11-30",
    priority: "alta",
    color: "160 84% 39%",
    observations: "Reforma completa do apto para renda passiva",
    created_at: "2023-01-01",
    completed_at: "2025-11-15",
    aportes: generateAportes("meta-4", "2023-01-01", 3000, 1200, 35),
  },
  {
    id: "meta-5",
    name: "Investimentos em Ações",
    emoji: "📈",
    category: "Investimento",
    target_amount: 100000,
    current_amount: 67300,
    instrument_id: "inst-4",
    target_date: "2028-12-31",
    priority: "media",
    color: "173 80% 40%",
    observations: "Carteira diversificada em Blue Chips e ETFs",
    created_at: "2023-02-01",
    completed_at: null,
    aportes: generateAportes("meta-5", "2023-02-01", 15000, 1800, 35),
  },
  {
    id: "meta-6",
    name: "Especialização em IA",
    emoji: "📚",
    category: "Educação",
    target_amount: 12000,
    current_amount: 12000,
    instrument_id: "inst-1",
    target_date: "2024-12-31",
    priority: "alta",
    color: "217 91% 60%",
    observations: "Curso de pós-graduação em Machine Learning",
    created_at: "2024-01-15",
    completed_at: "2024-11-30",
    aportes: generateAportes("meta-6", "2024-01-15", 2000, 800, 11),
  },
  {
    id: "meta-7",
    name: "Fundo de Aposentadoria",
    emoji: "🌅",
    category: "Aposentadoria",
    target_amount: 500000,
    current_amount: 156800,
    instrument_id: "inst-4",
    target_date: "2055-12-31",
    priority: "alta",
    color: "350 89% 60%",
    observations: "Contribuições mensais para segurança no futuro",
    created_at: "2023-01-01",
    completed_at: null,
    aportes: generateAportes("meta-7", "2023-01-01", 8000, 2200, 36),
  },
  {
    id: "meta-8",
    name: "Eletrônicos & Casa Inteligente",
    emoji: "🎯",
    category: "Outros",
    target_amount: 8000,
    current_amount: 8000,
    instrument_id: "inst-1",
    target_date: "2024-09-30",
    priority: "baixa",
    color: "215 16% 47%",
    observations: "Smart TV, climatizador, iluminação inteligente",
    created_at: "2024-02-01",
    completed_at: "2024-09-28",
    aportes: generateAportes("meta-8", "2024-02-01", 1500, 500, 8),
  },
];
