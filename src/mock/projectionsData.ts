// Projeções & Forecasting mock data

export const scenarios = {
  base: {
    name: "Cenário Base",
    growthRate: 2.5,
    churnRate: 2.3,
    ebitdaMargin: 40,
    finalMRR: 6.23,
    color: "hsl(var(--primary))",
  },
  optimistic: {
    name: "Cenário Otimista",
    growthRate: 4.5,
    churnRate: 1.8,
    ebitdaMargin: 42,
    finalMRR: 7.89,
    color: "hsl(var(--success))",
  },
  pessimistic: {
    name: "Cenário Pessimista",
    growthRate: 0.8,
    churnRate: 3.5,
    ebitdaMargin: 37,
    finalMRR: 5.12,
    color: "hsl(var(--destructive))",
  },
};

const baseMRR = 4850000;

export function generateProjection(growthRate: number, churnRate: number, months: number = 12) {
  const data = [];
  let mrr = baseMRR;
  for (let i = 0; i <= months; i++) {
    const month = new Date(2025, 2 + i, 1);
    const label = month.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    data.push({ month: label, mrr: Math.round(mrr) });
    const netGrowth = (growthRate - churnRate) / 100;
    mrr = mrr * (1 + growthRate / 100) * (1 - churnRate / 100);
  }
  return data;
}

export const projectedDRE = [
  { item: "Receita Bruta", values: [4850, 4971, 5095, 5222, 5353, 5487, 5624, 5765, 5909, 6057, 6209, 6364, 6523] },
  { item: "(-) Deduções", values: [-364, -373, -382, -392, -401, -412, -422, -432, -443, -454, -466, -477, -489] },
  { item: "Receita Líquida", values: [4486, 4598, 4713, 4830, 4952, 5075, 5202, 5333, 5466, 5603, 5743, 5887, 6034] },
  { item: "(-) CMV", values: [-1346, -1379, -1414, -1449, -1486, -1523, -1561, -1600, -1640, -1681, -1723, -1766, -1810] },
  { item: "Lucro Bruto", values: [3140, 3219, 3299, 3381, 3466, 3552, 3641, 3733, 3826, 3922, 4020, 4121, 4224] },
  { item: "EBITDA", values: [1812, 1858, 1904, 1951, 2000, 2050, 2101, 2154, 2208, 2263, 2320, 2378, 2438] },
  { item: "Lucro Líquido", values: [1172, 1201, 1231, 1262, 1293, 1325, 1358, 1392, 1427, 1463, 1500, 1538, 1576] },
];

export const cashFlowProjection = Array.from({ length: 13 }, (_, i) => {
  const month = new Date(2025, 2 + i, 1);
  const label = month.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  const base = 2200000 + i * 180000;
  return {
    month: label,
    entradas: Math.round(base * 1.1),
    saidas: Math.round(base * 0.65),
    saldo: Math.round(base * 0.45),
  };
});

export const capitalGiroProjection = Array.from({ length: 13 }, (_, i) => {
  const month = new Date(2025, 2 + i, 1);
  const label = month.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  return {
    month: label,
    necessidade: 4233500 + i * 120000,
    disponivel: 4920000 + i * 95000,
  };
});
