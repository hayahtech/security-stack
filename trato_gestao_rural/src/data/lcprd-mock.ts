export interface LcprdConfig {
  producerName: string;
  cpf: string;
  ie: string;
  address: string;
  municipality: string;
  state: string;
  totalArea: number;
  exerciseYear: number;
  mainActivity: "pecuaria" | "agricultura" | "ambas" | "piscicultura" | "silvicultura";
  taxRegime: "lucro_real" | "resultado_presumido";
}

export interface LcprdRevenue {
  id: string;
  date: string;
  description: string;
  origin: string;
  category: string;
  nfeKey?: string;
  amount: number;
  classified: boolean;
  rural: boolean;
}

export interface LcprdExpense {
  id: string;
  date: string;
  description: string;
  supplier: string;
  category: string;
  nfeKey?: string;
  amount: number;
  deductible: boolean;
  classified: boolean;
}

export interface DepreciationAsset {
  id: string;
  name: string;
  type: "trator" | "veiculo" | "equipamento" | "benfeitoria";
  acquisitionValue: number;
  acquisitionDate: string;
  usefulLifeYears: number;
  depreciationRate: number;
  accumulatedDepreciation: number;
}

export const defaultConfig: LcprdConfig = {
  producerName: "José Carlos da Silva",
  cpf: "000.000.000-00",
  ie: "123456789",
  address: "Fazenda Boa Vista, Rod. MG-050 Km 32",
  municipality: "Uberaba",
  state: "MG",
  totalArea: 850,
  exerciseYear: 2026,
  mainActivity: "pecuaria",
  taxRegime: "lucro_real",
};

export const activityLabels: Record<string, string> = {
  pecuaria: "Pecuária",
  agricultura: "Agricultura",
  ambas: "Pecuária e Agricultura",
  piscicultura: "Piscicultura",
  silvicultura: "Silvicultura",
};

export const taxRegimeLabels: Record<string, string> = {
  lucro_real: "Lucro Real",
  resultado_presumido: "Resultado Presumido (75%)",
};

export const revenueCategories = [
  "Venda de animais",
  "Venda de produtos de origem animal",
  "Venda de produtos agrícolas",
  "Venda de pescado",
  "Arrendamento de terras rurais",
  "Indenizações recebidas",
  "Subvenções e subsídios",
  "Outras receitas rurais",
];

export const deductibleExpenseCategories = [
  "Aquisição de animais",
  "Alimentação animal",
  "Medicamentos e veterinário",
  "Sementes, mudas e insumos",
  "Adubos, fertilizantes e defensivos",
  "Combustíveis e lubrificantes",
  "Manutenção de máquinas",
  "Energia elétrica",
  "Arrendamento de terras pago",
  "Mão de obra",
  "Encargos sociais e trabalhistas",
  "Depreciação de bens",
  "Juros de financiamentos rurais",
  "Transporte de produção",
  "Outras despesas rurais",
];

export const nonDeductibleCategories = [
  "Despesas pessoais e familiares",
  "Aquisição de ativo imobilizado",
  "Multas e penalidades",
];

const months2026 = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const mockRevenues: LcprdRevenue[] = [
  { id: "lr-1", date: "2026-01-15", description: "Venda de 20 bezerros desmamados", origin: "Fazenda Esperança", category: "Venda de animais", nfeKey: "35260112345678000195550010000001231123456789", amount: 52000, classified: true, rural: true },
  { id: "lr-2", date: "2026-01-02", description: "Aluguel de pasto — janeiro", origin: "Fazenda Vizinha", category: "Arrendamento de terras rurais", amount: 3000, classified: true, rural: true },
  { id: "lr-3", date: "2026-01-28", description: "Recebimento leite — quinzena 2/jan", origin: "Laticínio São José", category: "Venda de produtos de origem animal", amount: 7500, classified: true, rural: true },
  { id: "lr-4", date: "2026-02-05", description: "Venda de 5 vacas de descarte", origin: "Frigorífico Central", category: "Venda de animais", nfeKey: "35260212345678000195550010000001241123456780", amount: 18000, classified: true, rural: true },
  { id: "lr-5", date: "2026-02-18", description: "Recebimento leite — quinzena 2/fev", origin: "Laticínio São José", category: "Venda de produtos de origem animal", amount: 7800, classified: true, rural: true },
  { id: "lr-6", date: "2026-02-25", description: "Venda de 8 novilhos — leilão", origin: "Leilão Rural", category: "Venda de animais", nfeKey: "35260212345678000195550010000001251123456781", amount: 32000, classified: true, rural: true },
  { id: "lr-7", date: "2026-03-01", description: "Aluguel de pasto — Lote Sul", origin: "Fazenda Vizinha", category: "Arrendamento de terras rurais", amount: 3000, classified: true, rural: true },
  { id: "lr-8", date: "2026-03-05", description: "Recebimento leite — quinzena 1", origin: "Laticínio São José", category: "Venda de produtos de origem animal", amount: 8200, classified: true, rural: true },
  { id: "lr-9", date: "2026-03-08", description: "Venda de 15 bezerros", origin: "João Silva", category: "Venda de animais", nfeKey: "35260312345678000195550010000001261123456782", amount: 45000, classified: true, rural: true },
  { id: "lr-10", date: "2026-01-10", description: "Subvenção PRONAF", origin: "Banco do Brasil", category: "Subvenções e subsídios", amount: 12000, classified: true, rural: true },
];

export const mockExpenses: LcprdExpense[] = [
  { id: "le-1", date: "2026-01-25", description: "Ração — 8 toneladas", supplier: "Nutrifarm Rações", category: "Alimentação animal", amount: 10200, deductible: true, classified: true },
  { id: "le-2", date: "2026-01-20", description: "Salários — Janeiro", supplier: "Folha de Pagamento", category: "Mão de obra", amount: 15000, deductible: true, classified: true },
  { id: "le-3", date: "2026-01-10", description: "Combustível — diesel janeiro", supplier: "Posto Fazendeiro", category: "Combustíveis e lubrificantes", amount: 3800, deductible: true, classified: true },
  { id: "le-4", date: "2026-01-05", description: "Energia elétrica — dezembro", supplier: "CEMIG", category: "Energia elétrica", amount: 1380, deductible: true, classified: true },
  { id: "le-5", date: "2026-02-28", description: "Manutenção de cercas — Pasto Norte", supplier: "Mão de obra local", category: "Manutenção de máquinas", amount: 1800, deductible: true, classified: true },
  { id: "le-6", date: "2026-02-22", description: "Energia elétrica — Fazenda Boa Vista", supplier: "CEMIG", category: "Energia elétrica", amount: 1450, deductible: true, classified: true },
  { id: "le-7", date: "2026-02-20", description: "Salários — Fevereiro", supplier: "Folha de Pagamento", category: "Mão de obra", amount: 15000, deductible: true, classified: true },
  { id: "le-8", date: "2026-02-15", description: "Compra de feno — 200 fardos", supplier: "Cooperativa Agro Sul", category: "Alimentação animal", amount: 6000, deductible: true, classified: true },
  { id: "le-9", date: "2026-02-10", description: "Funrural — competência janeiro", supplier: "Receita Federal", category: "Encargos sociais e trabalhistas", amount: 2200, deductible: true, classified: true },
  { id: "le-10", date: "2026-02-02", description: "Manutenção trator — troca de óleo", supplier: "Oficina Mecânica Rural", category: "Manutenção de máquinas", amount: 980, deductible: true, classified: true },
  { id: "le-11", date: "2026-03-07", description: "Compra de ração — 10 toneladas", supplier: "Nutrifarm Rações", category: "Alimentação animal", nfeKey: "35260312345678000195550010000001271123456783", amount: 12800, deductible: true, classified: true },
  { id: "le-12", date: "2026-03-04", description: "Veterinário — vacinação rebanho", supplier: "Dr. Carlos", category: "Medicamentos e veterinário", amount: 3500, deductible: true, classified: true },
  { id: "le-13", date: "2026-03-03", description: "Sal mineral — 500kg", supplier: "Cooperativa Agro Sul", category: "Alimentação animal", amount: 2100, deductible: true, classified: true },
  { id: "le-14", date: "2026-03-02", description: "Combustível — diesel", supplier: "Posto Fazendeiro", category: "Combustíveis e lubrificantes", amount: 4500, deductible: true, classified: true },
  // Non-deductible
  { id: "le-15", date: "2026-01-18", description: "Compra de TV para casa sede", supplier: "Magazine Luiza", category: "Despesas pessoais e familiares", amount: 3200, deductible: false, classified: true },
  { id: "le-16", date: "2026-02-14", description: "Multa ambiental — queimada", supplier: "IBAMA", category: "Multas e penalidades", amount: 5000, deductible: false, classified: true },
];

export const mockAssets: DepreciationAsset[] = [
  { id: "da-1", name: "Trator John Deere 5075E", type: "trator", acquisitionValue: 280000, acquisitionDate: "2022-03-15", usefulLifeYears: 10, depreciationRate: 10, accumulatedDepreciation: 112000 },
  { id: "da-2", name: "Caminhonete Toyota Hilux", type: "veiculo", acquisitionValue: 185000, acquisitionDate: "2023-08-10", usefulLifeYears: 5, depreciationRate: 20, accumulatedDepreciation: 92500 },
  { id: "da-3", name: "Plantadeira Semeato SHM 15/17", type: "equipamento", acquisitionValue: 120000, acquisitionDate: "2021-06-01", usefulLifeYears: 10, depreciationRate: 10, accumulatedDepreciation: 60000 },
  { id: "da-4", name: "Curral de manejo coberto", type: "benfeitoria", acquisitionValue: 95000, acquisitionDate: "2019-01-20", usefulLifeYears: 25, depreciationRate: 4, accumulatedDepreciation: 26600 },
  { id: "da-5", name: "Pulverizador autopropelido", type: "equipamento", acquisitionValue: 450000, acquisitionDate: "2024-02-28", usefulLifeYears: 10, depreciationRate: 10, accumulatedDepreciation: 90000 },
];

export const assetTypeLabels: Record<string, string> = {
  trator: "Trator / Máquina Agrícola",
  veiculo: "Veículo",
  equipamento: "Equipamento",
  benfeitoria: "Benfeitoria / Instalação",
};

export const defaultDepreciationRates: Record<string, { years: number; rate: number }> = {
  trator: { years: 10, rate: 10 },
  veiculo: { years: 5, rate: 20 },
  equipamento: { years: 10, rate: 10 },
  benfeitoria: { years: 25, rate: 4 },
};

// Monthly summary for chart and annual statement
export function getMonthlyData(revenues: LcprdRevenue[], expenses: LcprdExpense[], year: number) {
  return months2026.map((label, i) => {
    const month = String(i + 1).padStart(2, "0");
    const prefix = `${year}-${month}`;
    const rec = revenues.filter(r => r.rural && r.date.startsWith(prefix)).reduce((s, r) => s + r.amount, 0);
    const desp = expenses.filter(e => e.deductible && e.date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0);
    return { month: label, receita: rec, despesa: desp, resultado: rec - desp };
  });
}
