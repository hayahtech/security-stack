export type JournalEntryStatus = "confirmado" | "rascunho" | "estornado";

export interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  type: "debito" | "credito";
  amount: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  lot: string;
  document: string;
  description: string;
  lines: JournalEntryLine[];
  status: JournalEntryStatus;
  reversalOf?: string;
}

export const journalEntriesData: JournalEntry[] = [
  {
    id: "LC-001", date: "2025-03-01", lot: "LT-2025-001", document: "NF 4821",
    description: "Recebimento de cliente - Projeto Alpha",
    lines: [
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "debito", amount: 182400 },
      { accountCode: "1.1.2.01", accountName: "Clientes Nacionais", type: "credito", amount: 182400 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-002", date: "2025-03-01", lot: "LT-2025-001", document: "NF 3290",
    description: "Pagamento fornecedor - Insumos TechParts",
    lines: [
      { accountCode: "2.1.1", accountName: "Fornecedores", type: "debito", amount: 48320 },
      { accountCode: "1.1.1.03", accountName: "Banco do Brasil CC", type: "credito", amount: 48320 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-003", date: "2025-03-02", lot: "LT-2025-002", document: "FP 03/2025",
    description: "Folha de pagamento março/2025",
    lines: [
      { accountCode: "6.1", accountName: "Despesas Operacionais", type: "debito", amount: 890000 },
      { accountCode: "2.1.3", accountName: "Obrigações Trabalhistas", type: "credito", amount: 890000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-004", date: "2025-03-02", lot: "LT-2025-002", document: "DEP 03/2025",
    description: "Depreciação mensal - Imobilizado",
    lines: [
      { accountCode: "6.1", accountName: "Despesas Operacionais", type: "debito", amount: 85000 },
      { accountCode: "1.2.1", accountName: "Imobilizado", type: "credito", amount: 85000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-005", date: "2025-03-03", lot: "LT-2025-003", document: "PROV-IRPJ",
    description: "Provisão IRPJ trimestral",
    lines: [
      { accountCode: "6.1", accountName: "Despesas Operacionais", type: "debito", amount: 127000 },
      { accountCode: "2.1.2", accountName: "Obrigações Fiscais", type: "credito", amount: 127000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-006", date: "2025-03-03", lot: "LT-2025-003", document: "NF 4830",
    description: "Venda de serviços - Consultoria Beta Corp",
    lines: [
      { accountCode: "1.1.2.01", accountName: "Clientes Nacionais", type: "debito", amount: 245000 },
      { accountCode: "4.1", accountName: "Receita Bruta de Serviços", type: "credito", amount: 245000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-007", date: "2025-03-04", lot: "LT-2025-004", document: "NF 4831",
    description: "Venda de produtos - Lote equipamentos",
    lines: [
      { accountCode: "1.1.2.01", accountName: "Clientes Nacionais", type: "debito", amount: 156800 },
      { accountCode: "4.2", accountName: "Receita Bruta de Produtos", type: "credito", amount: 156800 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-008", date: "2025-03-04", lot: "LT-2025-004", document: "CMV-001",
    description: "Baixa estoque - Custo mercadoria vendida",
    lines: [
      { accountCode: "5.1", accountName: "CMV / CPV", type: "debito", amount: 89400 },
      { accountCode: "1.1.3", accountName: "Estoques", type: "credito", amount: 89400 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-009", date: "2025-03-05", lot: "LT-2025-005", document: "PAG-ALG",
    description: "Pagamento aluguel escritório março",
    lines: [
      { accountCode: "6.1", accountName: "Despesas Operacionais", type: "debito", amount: 32000 },
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "credito", amount: 32000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-010", date: "2025-03-05", lot: "LT-2025-005", document: "JUR-EMP",
    description: "Juros sobre empréstimo bancário",
    lines: [
      { accountCode: "6.2", accountName: "Despesas Financeiras", type: "debito", amount: 18500 },
      { accountCode: "1.1.1.03", accountName: "Banco do Brasil CC", type: "credito", amount: 18500 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-011", date: "2025-03-06", lot: "LT-2025-006", document: "REC-INT",
    description: "Recebimento cliente internacional - USD",
    lines: [
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "debito", amount: 310000 },
      { accountCode: "1.1.2.02", accountName: "Clientes Internacionais", type: "credito", amount: 310000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-012", date: "2025-03-06", lot: "LT-2025-006", document: "APL-CDB",
    description: "Aplicação em CDB - Banco Itaú",
    lines: [
      { accountCode: "1.1.1.04", accountName: "Aplicações CDB", type: "debito", amount: 500000 },
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "credito", amount: 500000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-013", date: "2025-03-07", lot: "LT-2025-007", document: "PROV-PDD",
    description: "Provisão para devedores duvidosos",
    lines: [
      { accountCode: "6.1", accountName: "Despesas Operacionais", type: "debito", amount: 24500 },
      { accountCode: "1.1.2.03", accountName: "(-) Provisão Devedores Duvidosos", type: "credito", amount: 24500 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-014", date: "2025-03-07", lot: "LT-2025-007", document: "PAG-INSS",
    description: "Pagamento INSS competência fevereiro",
    lines: [
      { accountCode: "2.1.2", accountName: "Obrigações Fiscais", type: "debito", amount: 178000 },
      { accountCode: "1.1.1.03", accountName: "Banco do Brasil CC", type: "credito", amount: 178000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-015", date: "2025-03-08", lot: "LT-2025-008", document: "NF 4835",
    description: "Venda de serviços - Projeto Gamma",
    lines: [
      { accountCode: "1.1.2.01", accountName: "Clientes Nacionais", type: "debito", amount: 198000 },
      { accountCode: "4.1", accountName: "Receita Bruta de Serviços", type: "credito", amount: 198000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-016", date: "2025-03-08", lot: "LT-2025-008", document: "DED-ISS",
    description: "ISS retido na fonte - NF 4835",
    lines: [
      { accountCode: "4.9", accountName: "(-) Deduções de Receita", type: "debito", amount: 9900 },
      { accountCode: "2.1.2", accountName: "Obrigações Fiscais", type: "credito", amount: 9900 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-017", date: "2025-03-10", lot: "LT-2025-009", document: "PAG-FORN2",
    description: "Pagamento fornecedor - DataCloud Ltda",
    lines: [
      { accountCode: "2.1.1", accountName: "Fornecedores", type: "debito", amount: 67800 },
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "credito", amount: 67800 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-018", date: "2025-03-10", lot: "LT-2025-009", document: "RES-CDB",
    description: "Resgate CDB com rendimento",
    lines: [
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "debito", amount: 205400 },
      { accountCode: "1.1.1.04", accountName: "Aplicações CDB", type: "credito", amount: 200000 },
      { accountCode: "4.1", accountName: "Receita Bruta de Serviços", type: "credito", amount: 5400 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-019", date: "2025-03-11", lot: "LT-2025-010", document: "AMORT-EMP",
    description: "Amortização empréstimo bancário",
    lines: [
      { accountCode: "2.1.4", accountName: "Empréstimos CP", type: "debito", amount: 95000 },
      { accountCode: "1.1.1.03", accountName: "Banco do Brasil CC", type: "credito", amount: 95000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-020", date: "2025-03-12", lot: "LT-2025-011", document: "CAIXA-001",
    description: "Suprimento de caixa",
    lines: [
      { accountCode: "1.1.1.01", accountName: "Caixa Geral", type: "debito", amount: 5000 },
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "credito", amount: 5000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-021", date: "2025-03-12", lot: "LT-2025-011", document: "PAG-ENERG",
    description: "Pagamento energia elétrica",
    lines: [
      { accountCode: "6.1", accountName: "Despesas Operacionais", type: "debito", amount: 12800 },
      { accountCode: "1.1.1.01", accountName: "Caixa Geral", type: "credito", amount: 12800 },
    ],
    status: "rascunho",
  },
  {
    id: "LC-022", date: "2025-03-13", lot: "LT-2025-012", document: "NF 4840",
    description: "Recebimento parcial - Cliente Omega",
    lines: [
      { accountCode: "1.1.1.03", accountName: "Banco do Brasil CC", type: "debito", amount: 75000 },
      { accountCode: "1.1.2.01", accountName: "Clientes Nacionais", type: "credito", amount: 75000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-023", date: "2025-03-14", lot: "LT-2025-013", document: "PAG-SW",
    description: "Pagamento licenças de software",
    lines: [
      { accountCode: "6.1", accountName: "Despesas Operacionais", type: "debito", amount: 28900 },
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "credito", amount: 28900 },
    ],
    status: "rascunho",
  },
  {
    id: "LC-024", date: "2025-03-15", lot: "LT-2025-014", document: "ADT-13",
    description: "Adiantamento 13º salário",
    lines: [
      { accountCode: "6.1", accountName: "Despesas Operacionais", type: "debito", amount: 445000 },
      { accountCode: "2.1.3", accountName: "Obrigações Trabalhistas", type: "credito", amount: 445000 },
    ],
    status: "rascunho",
  },
  {
    id: "LC-025", date: "2025-03-15", lot: "LT-2025-014", document: "DIST-LUC",
    description: "Distribuição de lucros aos sócios",
    lines: [
      { accountCode: "3.3", accountName: "Lucros/Prejuízos Acumulados", type: "debito", amount: 350000 },
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "credito", amount: 350000 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-026", date: "2025-03-16", lot: "LT-2025-015", document: "NF 4845",
    description: "Compra de estoque - Materiais diversos",
    lines: [
      { accountCode: "1.1.3", accountName: "Estoques", type: "debito", amount: 134500 },
      { accountCode: "2.1.1", accountName: "Fornecedores", type: "credito", amount: 134500 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-027", date: "2025-03-17", lot: "LT-2025-016", document: "PAG-FGTS",
    description: "Pagamento FGTS competência fevereiro",
    lines: [
      { accountCode: "2.1.2", accountName: "Obrigações Fiscais", type: "debito", amount: 71200 },
      { accountCode: "1.1.1.03", accountName: "Banco do Brasil CC", type: "credito", amount: 71200 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-028", date: "2025-03-18", lot: "LT-2025-017", document: "REC-PROD",
    description: "Recebimento venda de produtos - Lote 22",
    lines: [
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "debito", amount: 156800 },
      { accountCode: "1.1.2.01", accountName: "Clientes Nacionais", type: "credito", amount: 156800 },
    ],
    status: "confirmado",
  },
  {
    id: "LC-029", date: "2025-03-19", lot: "LT-2025-018", document: "EST-001",
    description: "Estorno LC-009 - Aluguel lançado em duplicidade",
    lines: [
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "debito", amount: 32000 },
      { accountCode: "6.1", accountName: "Despesas Operacionais", type: "credito", amount: 32000 },
    ],
    status: "estornado",
    reversalOf: "LC-009",
  },
  {
    id: "LC-030", date: "2025-03-20", lot: "LT-2025-019", document: "TRANSF-01",
    description: "Transferência entre contas - Itaú para BB",
    lines: [
      { accountCode: "1.1.1.03", accountName: "Banco do Brasil CC", type: "debito", amount: 200000 },
      { accountCode: "1.1.1.02", accountName: "Banco Itaú CC 32.12345-6", type: "credito", amount: 200000 },
    ],
    status: "confirmado",
  },
];
