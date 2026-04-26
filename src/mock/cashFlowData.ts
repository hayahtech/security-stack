// Fluxo de Caixa, Tesouraria e Conciliação Bancária - Dados Mockados

// ═══ FLUXO DE CAIXA ═══

export const cashFlowDirect = {
  period: "Março/2025",
  entries: [
    { id: "clients", label: "Recebimento de clientes", value: 4620000 },
    { id: "financial", label: "Receitas financeiras", value: 41000 },
    { id: "other", label: "Outras entradas", value: 28500 },
  ],
  exits: [
    { id: "suppliers", label: "Pagamento a fornecedores", value: -1180000 },
    { id: "payroll", label: "Folha de pagamento", value: -890000 },
    { id: "taxes", label: "Impostos e tributos", value: -412000 },
    { id: "operational", label: "Despesas operacionais", value: -380000 },
    { id: "financial_exp", label: "Despesas financeiras", value: -206000 },
    { id: "capex", label: "Investimentos (CAPEX)", value: -95000 },
  ],
  totalEntries: 4689500,
  totalExits: -3163000,
  periodBalance: 1526500,
  initialBalance: 2840000,
  finalBalance: 4366500,
};

export const cashFlowIndirect = {
  period: "Março/2025",
  operationalActivities: [
    { id: "net_income", label: "Lucro Líquido", value: 1171781 },
    { id: "depreciation", label: "(+) Depreciação", value: 85000 },
    { id: "receivables", label: "(±) Var. Contas a Receber", value: -120000 },
    { id: "inventory", label: "(±) Var. Estoques", value: 45000 },
    { id: "payables", label: "(±) Var. Fornecedores", value: 85000 },
    { id: "taxes_pay", label: "(±) Var. Impostos a Pagar", value: -32000 },
  ],
  investmentActivities: [
    { id: "capex", label: "Aquisição de Imobilizado", value: -95000 },
    { id: "investments", label: "Aplicações Financeiras", value: -150000 },
  ],
  financingActivities: [
    { id: "loans", label: "Captação de Empréstimos", value: 300000 },
    { id: "loan_payment", label: "Amortização de Dívidas", value: -180000 },
    { id: "dividends", label: "Dividendos Pagos", value: -120000 },
  ],
  totalOperational: 1234781,
  totalInvestment: -245000,
  totalFinancing: 0,
  periodBalance: 989781,
  initialBalance: 3376719,
  finalBalance: 4366500,
};

// Projeção diária dos próximos 30 dias
export const dailyCashProjection = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  const baseFlow = 50000 + Math.random() * 100000;
  const isPayday = date.getDate() === 5 || date.getDate() === 20;
  const flow = isPayday ? -400000 + Math.random() * 100000 : baseFlow * (Math.random() > 0.4 ? 1 : -0.6);
  return {
    date: date.toISOString().split("T")[0],
    label: `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`,
    projected: Math.round(flow),
    balance: 4366500 + Math.round(flow * (i + 1) * 0.1),
  };
});

// Projeção trimestral
export const quarterlyProjection = [
  { month: "Mar/25", inflow: 4689500, outflow: 3163000, balance: 4366500, breakeven: 3200000 },
  { month: "Abr/25", inflow: 4850000, outflow: 3350000, balance: 5866500, breakeven: 3200000 },
  { month: "Mai/25", inflow: 5100000, outflow: 3500000, balance: 7466500, breakeven: 3200000 },
  { month: "Jun/25", inflow: 4950000, outflow: 3400000, balance: 9016500, breakeven: 3200000 },
];

// Dados para gráfico waterfall
export const waterfallData = [
  { name: "Saldo Inicial", value: 2840000, type: "initial" },
  { name: "Clientes", value: 4620000, type: "positive" },
  { name: "Rec. Financ.", value: 41000, type: "positive" },
  { name: "Outras", value: 28500, type: "positive" },
  { name: "Fornecedores", value: -1180000, type: "negative" },
  { name: "Folha", value: -890000, type: "negative" },
  { name: "Impostos", value: -412000, type: "negative" },
  { name: "Desp. Oper.", value: -380000, type: "negative" },
  { name: "Desp. Fin.", value: -206000, type: "negative" },
  { name: "CAPEX", value: -95000, type: "negative" },
  { name: "Saldo Final", value: 4366500, type: "total" },
];

// ═══ TESOURARIA ═══

export const bankAccounts = [
  { id: "itau", name: "Banco Itaú", type: "Conta Corrente", balance: 1842300, variation: 2.3, color: "hsl(24, 100%, 50%)" },
  { id: "bb", name: "Banco do Brasil", type: "Conta Corrente", balance: 987500, variation: -1.2, color: "hsl(210, 100%, 45%)" },
  { id: "caixa", name: "Caixa Econômica", type: "Conta Corrente", balance: 645200, variation: 0.8, color: "hsl(200, 100%, 40%)" },
  { id: "cdb", name: "Aplicações CDB", type: "Investimento", balance: 891500, variation: 0.45, color: "hsl(152, 100%, 40%)" },
];

export const totalAvailable = 4366500;
export const minimumCashRequired = 2500000;

export const recentTransactions = [
  { id: 1, date: "2025-03-08", description: "Recebimento Cliente ABC", account: "Itaú", type: "credit", value: 85000, category: "Vendas" },
  { id: 2, date: "2025-03-08", description: "Pagamento Fornecedor XYZ", account: "BB", type: "debit", value: -42000, category: "Fornecedores" },
  { id: 3, date: "2025-03-07", description: "Aplicação CDB Automática", account: "CDB", type: "credit", value: 100000, category: "Investimentos" },
  { id: 4, date: "2025-03-07", description: "Folha de Pagamento", account: "Itaú", type: "debit", value: -320000, category: "Pessoal" },
  { id: 5, date: "2025-03-07", description: "Recebimento Cliente DEF", account: "Caixa", type: "credit", value: 65000, category: "Vendas" },
  { id: 6, date: "2025-03-06", description: "ISS sobre Serviços", account: "BB", type: "debit", value: -28000, category: "Impostos" },
  { id: 7, date: "2025-03-06", description: "Rendimento CDB", account: "CDB", type: "credit", value: 4500, category: "Receita Financeira" },
  { id: 8, date: "2025-03-06", description: "Energia Elétrica", account: "Itaú", type: "debit", value: -18500, category: "Utilities" },
  { id: 9, date: "2025-03-05", description: "Recebimento Cliente GHI", account: "Itaú", type: "credit", value: 125000, category: "Vendas" },
  { id: 10, date: "2025-03-05", description: "Internet e Telecom", account: "BB", type: "debit", value: -8900, category: "Utilities" },
  { id: 11, date: "2025-03-05", description: "Aluguel Sede", account: "Caixa", type: "debit", value: -45000, category: "Ocupação" },
  { id: 12, date: "2025-03-04", description: "Recebimento Cliente JKL", account: "BB", type: "credit", value: 95000, category: "Vendas" },
  { id: 13, date: "2025-03-04", description: "Material de Escritório", account: "Itaú", type: "debit", value: -3200, category: "Administrativo" },
  { id: 14, date: "2025-03-04", description: "Pagamento Fornecedor ABC", account: "Caixa", type: "debit", value: -67000, category: "Fornecedores" },
  { id: 15, date: "2025-03-03", description: "Recebimento Cliente MNO", account: "Itaú", type: "credit", value: 78000, category: "Vendas" },
  { id: 16, date: "2025-03-03", description: "Software e Licenças", account: "BB", type: "debit", value: -15600, category: "TI" },
  { id: 17, date: "2025-03-02", description: "Transferência entre contas", account: "Itaú", type: "debit", value: -200000, category: "Transferência" },
  { id: 18, date: "2025-03-02", description: "Transferência entre contas", account: "CDB", type: "credit", value: 200000, category: "Transferência" },
  { id: 19, date: "2025-03-01", description: "INSS Patronal", account: "Itaú", type: "debit", value: -89000, category: "Impostos" },
  { id: 20, date: "2025-03-01", description: "FGTS", account: "Itaú", type: "debit", value: -71200, category: "Impostos" },
];

// ═══ CONCILIAÇÃO BANCÁRIA ═══

export interface ReconciliationItem {
  id: number;
  date: string;
  description: string;
  bankValue: number;
  accountingValue: number;
  status: "reconciled" | "pending" | "divergent";
  bank: string;
}

export const reconciliationData: ReconciliationItem[] = [
  { id: 1, date: "2025-03-08", description: "Recebimento Cliente ABC", bankValue: 85000, accountingValue: 85000, status: "reconciled", bank: "Itaú" },
  { id: 2, date: "2025-03-08", description: "Pagamento Fornecedor XYZ", bankValue: -42000, accountingValue: -42000, status: "reconciled", bank: "BB" },
  { id: 3, date: "2025-03-07", description: "Aplicação CDB", bankValue: 100000, accountingValue: 100000, status: "reconciled", bank: "CDB" },
  { id: 4, date: "2025-03-07", description: "Folha de Pagamento", bankValue: -320000, accountingValue: -318500, status: "divergent", bank: "Itaú" },
  { id: 5, date: "2025-03-07", description: "Recebimento Cliente DEF", bankValue: 65000, accountingValue: 65000, status: "reconciled", bank: "Caixa" },
  { id: 6, date: "2025-03-06", description: "ISS sobre Serviços", bankValue: -28000, accountingValue: -28000, status: "reconciled", bank: "BB" },
  { id: 7, date: "2025-03-06", description: "Rendimento CDB", bankValue: 4500, accountingValue: 0, status: "pending", bank: "CDB" },
  { id: 8, date: "2025-03-06", description: "Energia Elétrica", bankValue: -18500, accountingValue: -18500, status: "reconciled", bank: "Itaú" },
  { id: 9, date: "2025-03-05", description: "Recebimento Cliente GHI", bankValue: 125000, accountingValue: 125000, status: "reconciled", bank: "Itaú" },
  { id: 10, date: "2025-03-05", description: "Internet e Telecom", bankValue: -8900, accountingValue: -8900, status: "reconciled", bank: "BB" },
  { id: 11, date: "2025-03-05", description: "Aluguel Sede", bankValue: -45000, accountingValue: -45000, status: "reconciled", bank: "Caixa" },
  { id: 12, date: "2025-03-04", description: "Tarifa Bancária", bankValue: -350, accountingValue: 0, status: "pending", bank: "Itaú" },
  { id: 13, date: "2025-03-04", description: "Material Escritório", bankValue: -3200, accountingValue: -3450, status: "divergent", bank: "Itaú" },
  { id: 14, date: "2025-03-04", description: "Pagamento Forn. ABC", bankValue: -67000, accountingValue: -67000, status: "reconciled", bank: "Caixa" },
  { id: 15, date: "2025-03-03", description: "DOC/TED Recebido", bankValue: 12500, accountingValue: 0, status: "pending", bank: "BB" },
];

export const reconciliationSummary = {
  totalReconciled: 10,
  totalPending: 3,
  totalDivergent: 2,
  reconciledValue: 523500,
  pendingValue: 16650,
  divergenceValue: 1750,
};
