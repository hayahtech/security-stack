// DRE - Demonstração do Resultado do Exercício
// Dados dos últimos 3 períodos

export interface DreLineItem {
  id: string;
  label: string;
  type: "revenue" | "deduction" | "subtotal" | "expense" | "total";
  values: number[];
  tooltip: string;
  indent?: number;
}

export const dreMonths = ["Jan/2025", "Fev/2025", "Mar/2025"];

export const dreData: DreLineItem[] = [
  {
    id: "gross_revenue",
    label: "(+) RECEITA BRUTA",
    type: "revenue",
    values: [5100000, 4750000, 4850000],
    tooltip: "Valor total das vendas antes de qualquer dedução. Inclui todos os produtos e serviços comercializados.",
  },
  {
    id: "deductions",
    label: "(-) Deduções/Impostos (PIS/COFINS/ISS)",
    type: "deduction",
    values: [-382500, -356250, -363750],
    tooltip: "Tributos sobre vendas: PIS (0,65%), COFINS (3%), ISS (até 5%). Deduzidos diretamente da receita bruta.",
    indent: 1,
  },
  {
    id: "net_revenue",
    label: "(=) RECEITA LÍQUIDA",
    type: "subtotal",
    values: [4717500, 4393750, 4486250],
    tooltip: "Receita efetiva após dedução dos impostos sobre vendas. Base para cálculo da Análise Vertical (AV%).",
  },
  {
    id: "cmv",
    label: "(-) CMV/CPV",
    type: "deduction",
    values: [-1415250, -1318125, -1345875],
    tooltip: "Custo da Mercadoria Vendida ou Custo dos Produtos Vendidos. Custos diretos de produção ou aquisição.",
    indent: 1,
  },
  {
    id: "gross_profit",
    label: "(=) LUCRO BRUTO",
    type: "subtotal",
    values: [3302250, 3075625, 3140375],
    tooltip: "Receita líquida menos custos diretos. Indica a margem disponível para cobrir despesas operacionais.",
  },
  {
    id: "sales_expenses",
    label: "(-) Despesas com Vendas",
    type: "expense",
    values: [-470000, -440000, -455000],
    tooltip: "Comissões de vendas, fretes sobre vendas, descontos concedidos e outras despesas comerciais.",
    indent: 1,
  },
  {
    id: "admin_expenses",
    label: "(-) Despesas Administrativas",
    type: "expense",
    values: [-620000, -590000, -610000],
    tooltip: "Salários administrativos, aluguel, utilities, material de escritório e despesas gerais.",
    indent: 1,
  },
  {
    id: "marketing_expenses",
    label: "(-) Despesas de Marketing",
    type: "expense",
    values: [-180000, -165000, -172000],
    tooltip: "Publicidade, propaganda, eventos, branding e ações promocionais.",
    indent: 1,
  },
  {
    id: "other_expenses",
    label: "(-) Outras Despesas Operacionais",
    type: "expense",
    values: [-95000, -88000, -91000],
    tooltip: "Despesas operacionais não classificadas nas categorias anteriores.",
    indent: 1,
  },
  {
    id: "ebitda",
    label: "(=) EBITDA",
    type: "subtotal",
    values: [1937250, 1792625, 1812375],
    tooltip: "Lucro antes de Juros, Impostos, Depreciação e Amortização. Principal indicador de geração de caixa operacional.",
  },
  {
    id: "depreciation",
    label: "(-) Depreciação/Amortização",
    type: "expense",
    values: [-85000, -85000, -85000],
    tooltip: "Reconhecimento contábil da perda de valor de ativos ao longo do tempo. Despesa não-caixa.",
    indent: 1,
  },
  {
    id: "ebit",
    label: "(=) EBIT / Lucro Operacional",
    type: "subtotal",
    values: [1852250, 1707625, 1727375],
    tooltip: "Lucro antes de Juros e Impostos. Mede a eficiência operacional do negócio.",
  },
  {
    id: "financial_expenses",
    label: "(-) Despesas Financeiras",
    type: "expense",
    values: [-210000, -198000, -206000],
    tooltip: "Juros sobre empréstimos, financiamentos, descontos de duplicatas e encargos bancários.",
    indent: 1,
  },
  {
    id: "financial_income",
    label: "(+) Receitas Financeiras",
    type: "revenue",
    values: [42000, 38500, 41000],
    tooltip: "Rendimentos de aplicações financeiras, juros recebidos e descontos obtidos.",
    indent: 1,
  },
  {
    id: "ebt",
    label: "(=) LAIR (Lucro Antes IR)",
    type: "subtotal",
    values: [1684250, 1548125, 1562375],
    tooltip: "Lucro Antes do Imposto de Renda. Base de cálculo para tributação sobre o lucro.",
  },
  {
    id: "taxes",
    label: "(-) IRPJ + CSLL (25%)",
    type: "expense",
    values: [-421063, -387031, -390594],
    tooltip: "Imposto de Renda Pessoa Jurídica (15% + 10% adicional) e Contribuição Social (9%).",
    indent: 1,
  },
  {
    id: "net_income",
    label: "(=) LUCRO LÍQUIDO",
    type: "total",
    values: [1263188, 1161094, 1171781],
    tooltip: "Resultado final após todas as deduções. Lucro disponível para distribuição ou reinvestimento.",
  },
];

// Ajuste gerencial mensal
export const managerialAdjustment = 45000;

// Função para calcular AH% (variação entre períodos)
export const calculateAH = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

// Função para calcular AV% (% sobre Receita Líquida)
export const calculateAV = (value: number, netRevenue: number): number => {
  if (netRevenue === 0) return 0;
  return (value / netRevenue) * 100;
};

// Função para obter dados gerenciais
export const getManagerialData = (data: DreLineItem[]): DreLineItem[] => {
  return data.map((item) => {
    if (item.id === "depreciation") {
      return { ...item, values: [0, 0, 0] }; // Exclui depreciação
    }
    if (item.id === "ebitda") {
      // EBITDA gerencial = EBITDA + ajuste
      return {
        ...item,
        label: "(=) EBITDA Gerencial",
        values: item.values.map((v) => v + managerialAdjustment),
      };
    }
    if (item.id === "ebit") {
      // Recalcula EBIT sem depreciação + ajuste
      const originalEbitda = data.find((d) => d.id === "ebitda")!.values;
      return {
        ...item,
        label: "(=) EBIT Gerencial",
        values: originalEbitda.map((v) => v + managerialAdjustment),
      };
    }
    if (item.id === "ebt") {
      const originalEbitda = data.find((d) => d.id === "ebitda")!.values;
      const financialExp = data.find((d) => d.id === "financial_expenses")!.values;
      const financialInc = data.find((d) => d.id === "financial_income")!.values;
      return {
        ...item,
        label: "(=) LAIR Gerencial",
        values: originalEbitda.map((v, i) => v + managerialAdjustment + financialExp[i] + financialInc[i]),
      };
    }
    if (item.id === "taxes") {
      const originalEbitda = data.find((d) => d.id === "ebitda")!.values;
      const financialExp = data.find((d) => d.id === "financial_expenses")!.values;
      const financialInc = data.find((d) => d.id === "financial_income")!.values;
      const lair = originalEbitda.map((v, i) => v + managerialAdjustment + financialExp[i] + financialInc[i]);
      return {
        ...item,
        values: lair.map((v) => -Math.round(v * 0.25)),
      };
    }
    if (item.id === "net_income") {
      const originalEbitda = data.find((d) => d.id === "ebitda")!.values;
      const financialExp = data.find((d) => d.id === "financial_expenses")!.values;
      const financialInc = data.find((d) => d.id === "financial_income")!.values;
      const lair = originalEbitda.map((v, i) => v + managerialAdjustment + financialExp[i] + financialInc[i]);
      return {
        ...item,
        label: "(=) LUCRO LÍQUIDO GERENCIAL",
        values: lair.map((v) => Math.round(v * 0.75)),
      };
    }
    return item;
  });
};
