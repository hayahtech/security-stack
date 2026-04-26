// Orçamento Empresarial — Dados Mockados

export const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export interface BudgetLine {
  id: string;
  label: string;
  type: "revenue" | "expense";
  group: string;
  budgeted: number[];
  actual: number[];
}

const g = (base: number, rate: number, count: number) =>
  Array.from({ length: count }, (_, i) => Math.round(base * Math.pow(1 + rate, i)));

export const budgetLines: BudgetLine[] = [
  // Receitas
  { id: "basic", label: "Plano Basic", type: "revenue", group: "Receitas", budgeted: g(580000, 0.018, 12), actual: [585000, 592000, 612000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "pro", label: "Plano Pro", type: "revenue", group: "Receitas", budgeted: g(1790000, 0.018, 12), actual: [1810000, 1825000, 1880000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "enterprise", label: "Plano Enterprise", type: "revenue", group: "Receitas", budgeted: g(2320000, 0.017, 12), actual: [2290000, 2380000, 2420000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  // Despesas
  { id: "cmv", label: "CMV", type: "expense", group: "Custos", budgeted: g(1407000, 0.018, 12), actual: [1420000, 1455000, 1490000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "payroll", label: "Folha de Pagamento", type: "expense", group: "Pessoal", budgeted: [890000, 890000, 905000, 905000, 910000, 910000, 920000, 920000, 930000, 930000, 940000, 940000], actual: [892000, 890000, 908000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "marketing", label: "Marketing", type: "expense", group: "Marketing", budgeted: g(165000, 0.015, 12), actual: [162000, 178000, 172000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "infra", label: "Infraestrutura & Cloud", type: "expense", group: "Tecnologia", budgeted: g(210000, 0.02, 12), actual: [215000, 222000, 218000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "admin", label: "G&A (Administrativo)", type: "expense", group: "Administrativo", budgeted: [145000, 145000, 148000, 148000, 150000, 150000, 152000, 152000, 155000, 155000, 158000, 158000], actual: [143000, 146000, 151000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "sales", label: "Comercial & Vendas", type: "expense", group: "Comercial", budgeted: g(280000, 0.015, 12), actual: [275000, 290000, 285000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: "financial", label: "Despesas Financeiras", type: "expense", group: "Financeiro", budgeted: [206000, 206000, 206000, 200000, 200000, 195000, 195000, 190000, 190000, 185000, 185000, 180000], actual: [208000, 204000, 206000, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
];

// Current month index (March = 2, 0-indexed)
export const currentMonthIndex = 2;

// Forecast rolling: replaces budgeted with actual for past months, adjusts future
export function computeForecastRolling(lines: BudgetLine[]): BudgetLine[] {
  return lines.map((line) => {
    const forecast = [...line.budgeted];
    for (let i = 0; i < currentMonthIndex; i++) {
      forecast[i] = line.actual[i];
    }
    // Adjust future months based on YTD trend
    const budgetedYTD = line.budgeted.slice(0, currentMonthIndex).reduce((s, v) => s + v, 0);
    const actualYTD = line.actual.slice(0, currentMonthIndex).reduce((s, v) => s + v, 0);
    if (budgetedYTD > 0) {
      const trendFactor = actualYTD / budgetedYTD;
      for (let i = currentMonthIndex; i < 12; i++) {
        forecast[i] = Math.round(line.budgeted[i] * trendFactor);
      }
    }
    return { ...line, budgeted: forecast };
  });
}

// Deviation comments
export interface DeviationComment {
  lineId: string;
  monthIndex: number;
  comment: string;
  author: string;
  status: "pending" | "approved";
}

export const deviationComments: DeviationComment[] = [
  { lineId: "marketing", monthIndex: 1, comment: "Campanha de aquisição antecipada para evento do setor", author: "Marina Costa", status: "approved" },
  { lineId: "infra", monthIndex: 1, comment: "Migração de região AWS gerou custo pontual", author: "Lucas Ferreira", status: "pending" },
  { lineId: "enterprise", monthIndex: 0, comment: "Churn de 2 contas enterprise compensado parcialmente por upsell", author: "Pedro Almeida", status: "approved" },
];
