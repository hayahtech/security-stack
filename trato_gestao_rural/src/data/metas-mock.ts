export interface MetaAporte {
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
  aportes: MetaAporte[];
}

export const metaEmojis = ["✈️", "🏠", "🚗", "💍", "🎓", "🏖️", "💊", "🎯", "💰", "📱", "🎁", "👶"];

export const metaCategories = [
  "Viagem", "Imóvel", "Veículo", "Educação", "Reserva de emergência",
  "Casamento/Festa", "Saúde", "Eletrônicos", "Presente", "Outro"
];

export const metaColors = [
  "149 62% 26%",   // green (primary)
  "213 78% 37%",   // blue (info)
  "37 100% 50%",   // orange (accent)
  "0 72% 50%",     // red (destructive)
  "270 60% 50%",   // purple
  "330 70% 50%",   // pink
  "180 60% 35%",   // teal
  "45 90% 45%",    // gold
];

export const mockMetas: MetaFinanceira[] = [
  {
    id: "meta-1",
    name: "Reserva de Emergência",
    emoji: "💰",
    category: "Reserva de emergência",
    target_amount: 60000,
    current_amount: 38000,
    instrument_id: "pi-2",
    target_date: null,
    priority: "alta",
    color: "149 62% 26%",
    observations: "6 meses de despesas mensais médias",
    created_at: "2025-06-01",
    completed_at: null,
    aportes: [
      { id: "ap-1", meta_id: "meta-1", date: "2025-06-15", amount: 5000, instrument_id: "pi-1", observation: "Aporte inicial" },
      { id: "ap-2", meta_id: "meta-1", date: "2025-07-10", amount: 5000, instrument_id: "pi-1", observation: "" },
      { id: "ap-3", meta_id: "meta-1", date: "2025-08-10", amount: 5000, instrument_id: "pi-1", observation: "" },
      { id: "ap-4", meta_id: "meta-1", date: "2025-09-10", amount: 5000, instrument_id: "pi-1", observation: "" },
      { id: "ap-5", meta_id: "meta-1", date: "2025-10-10", amount: 5000, instrument_id: "pi-1", observation: "" },
      { id: "ap-6", meta_id: "meta-1", date: "2025-11-10", amount: 3000, instrument_id: "pi-1", observation: "" },
      { id: "ap-7", meta_id: "meta-1", date: "2025-12-10", amount: 3000, instrument_id: "pi-1", observation: "" },
      { id: "ap-8", meta_id: "meta-1", date: "2026-01-10", amount: 3000, instrument_id: "pi-1", observation: "" },
      { id: "ap-9", meta_id: "meta-1", date: "2026-02-10", amount: 2000, instrument_id: "pi-1", observation: "" },
      { id: "ap-10", meta_id: "meta-1", date: "2026-03-05", amount: 2000, instrument_id: "pi-1", observation: "Aporte março" },
    ],
  },
  {
    id: "meta-2",
    name: "Viagem Europa 2027",
    emoji: "✈️",
    category: "Viagem",
    target_amount: 45000,
    current_amount: 18500,
    instrument_id: "pi-2",
    target_date: "2027-06-01",
    priority: "media",
    color: "213 78% 37%",
    observations: "Roteiro: Portugal, Espanha e Itália — 20 dias",
    created_at: "2025-09-01",
    completed_at: null,
    aportes: [
      { id: "ap-20", meta_id: "meta-2", date: "2025-09-15", amount: 5000, instrument_id: "pi-1", observation: "Início" },
      { id: "ap-21", meta_id: "meta-2", date: "2025-10-10", amount: 2500, instrument_id: "pi-1", observation: "" },
      { id: "ap-22", meta_id: "meta-2", date: "2025-11-10", amount: 2000, instrument_id: "pi-1", observation: "" },
      { id: "ap-23", meta_id: "meta-2", date: "2025-12-10", amount: 2000, instrument_id: "pi-1", observation: "" },
      { id: "ap-24", meta_id: "meta-2", date: "2026-01-10", amount: 2500, instrument_id: "pi-1", observation: "" },
      { id: "ap-25", meta_id: "meta-2", date: "2026-02-10", amount: 2000, instrument_id: "pi-1", observation: "" },
      { id: "ap-26", meta_id: "meta-2", date: "2026-03-05", amount: 2500, instrument_id: "pi-1", observation: "" },
    ],
  },
  {
    id: "meta-3",
    name: "Entrada Apartamento",
    emoji: "🏠",
    category: "Imóvel",
    target_amount: 120000,
    current_amount: 42000,
    instrument_id: "pi-2",
    target_date: "2028-01-01",
    priority: "alta",
    color: "37 100% 50%",
    observations: "Apartamento 3 quartos — zona sul",
    created_at: "2025-03-01",
    completed_at: null,
    aportes: [
      { id: "ap-30", meta_id: "meta-3", date: "2025-03-15", amount: 10000, instrument_id: "pi-1", observation: "Início" },
      { id: "ap-31", meta_id: "meta-3", date: "2025-05-10", amount: 5000, instrument_id: "pi-1", observation: "" },
      { id: "ap-32", meta_id: "meta-3", date: "2025-07-10", amount: 5000, instrument_id: "pi-1", observation: "" },
      { id: "ap-33", meta_id: "meta-3", date: "2025-09-10", amount: 5000, instrument_id: "pi-1", observation: "" },
      { id: "ap-34", meta_id: "meta-3", date: "2025-11-10", amount: 5000, instrument_id: "pi-1", observation: "" },
      { id: "ap-35", meta_id: "meta-3", date: "2026-01-10", amount: 6000, instrument_id: "pi-1", observation: "13º" },
      { id: "ap-36", meta_id: "meta-3", date: "2026-03-01", amount: 6000, instrument_id: "pi-1", observation: "" },
    ],
  },
  {
    id: "meta-4",
    name: "MacBook Pro",
    emoji: "📱",
    category: "Eletrônicos",
    target_amount: 18000,
    current_amount: 18000,
    instrument_id: "pi-1",
    target_date: "2025-12-01",
    priority: "baixa",
    color: "270 60% 50%",
    observations: "MacBook Pro M3 — comprado!",
    created_at: "2025-06-01",
    completed_at: "2025-11-28",
    aportes: [
      { id: "ap-40", meta_id: "meta-4", date: "2025-06-15", amount: 5000, instrument_id: "pi-1", observation: "" },
      { id: "ap-41", meta_id: "meta-4", date: "2025-08-10", amount: 5000, instrument_id: "pi-1", observation: "" },
      { id: "ap-42", meta_id: "meta-4", date: "2025-10-10", amount: 5000, instrument_id: "pi-1", observation: "" },
      { id: "ap-43", meta_id: "meta-4", date: "2025-11-28", amount: 3000, instrument_id: "pi-1", observation: "Concluída!" },
    ],
  },
];

// Average monthly expenses for emergency reserve calculation (last 3 months)
export const averageMonthlyExpenses = 10000;
