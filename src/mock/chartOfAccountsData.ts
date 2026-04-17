export type AccountNature = "devedora" | "credora";
export type AccountType = "ativo" | "passivo" | "patrimonio" | "receita" | "custo" | "despesa";

export interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  nature: AccountNature;
  level: number;
  parentId: string | null;
  active: boolean;
  hasEntries: boolean;
  children?: ChartAccount[];
}

export const chartOfAccountsData: ChartAccount[] = [
  {
    id: "1", code: "1", name: "ATIVO", type: "ativo", nature: "devedora", level: 1, parentId: null, active: true, hasEntries: false,
    children: [
      {
        id: "1.1", code: "1.1", name: "Ativo Circulante", type: "ativo", nature: "devedora", level: 2, parentId: "1", active: true, hasEntries: false,
        children: [
          {
            id: "1.1.1", code: "1.1.1", name: "Caixa e Equivalentes", type: "ativo", nature: "devedora", level: 3, parentId: "1.1", active: true, hasEntries: false,
            children: [
              { id: "1.1.1.01", code: "1.1.1.01", name: "Caixa Geral", type: "ativo", nature: "devedora", level: 4, parentId: "1.1.1", active: true, hasEntries: true },
              { id: "1.1.1.02", code: "1.1.1.02", name: "Banco Itaú CC 32.12345-6", type: "ativo", nature: "devedora", level: 4, parentId: "1.1.1", active: true, hasEntries: true },
              { id: "1.1.1.03", code: "1.1.1.03", name: "Banco do Brasil CC", type: "ativo", nature: "devedora", level: 4, parentId: "1.1.1", active: true, hasEntries: true },
              { id: "1.1.1.04", code: "1.1.1.04", name: "Aplicações CDB", type: "ativo", nature: "devedora", level: 4, parentId: "1.1.1", active: true, hasEntries: true },
            ],
          },
          {
            id: "1.1.2", code: "1.1.2", name: "Contas a Receber", type: "ativo", nature: "devedora", level: 3, parentId: "1.1", active: true, hasEntries: false,
            children: [
              { id: "1.1.2.01", code: "1.1.2.01", name: "Clientes Nacionais", type: "ativo", nature: "devedora", level: 4, parentId: "1.1.2", active: true, hasEntries: true },
              { id: "1.1.2.02", code: "1.1.2.02", name: "Clientes Internacionais", type: "ativo", nature: "devedora", level: 4, parentId: "1.1.2", active: true, hasEntries: true },
              { id: "1.1.2.03", code: "1.1.2.03", name: "(-) Provisão Devedores Duvidosos", type: "ativo", nature: "credora", level: 4, parentId: "1.1.2", active: true, hasEntries: true },
            ],
          },
          {
            id: "1.1.3", code: "1.1.3", name: "Estoques", type: "ativo", nature: "devedora", level: 3, parentId: "1.1", active: true, hasEntries: true,
          },
        ],
      },
      {
        id: "1.2", code: "1.2", name: "Ativo Não Circulante", type: "ativo", nature: "devedora", level: 2, parentId: "1", active: true, hasEntries: false,
        children: [
          { id: "1.2.1", code: "1.2.1", name: "Imobilizado", type: "ativo", nature: "devedora", level: 3, parentId: "1.2", active: true, hasEntries: true },
          { id: "1.2.2", code: "1.2.2", name: "Intangível", type: "ativo", nature: "devedora", level: 3, parentId: "1.2", active: true, hasEntries: true },
        ],
      },
    ],
  },
  {
    id: "2", code: "2", name: "PASSIVO", type: "passivo", nature: "credora", level: 1, parentId: null, active: true, hasEntries: false,
    children: [
      {
        id: "2.1", code: "2.1", name: "Passivo Circulante", type: "passivo", nature: "credora", level: 2, parentId: "2", active: true, hasEntries: false,
        children: [
          { id: "2.1.1", code: "2.1.1", name: "Fornecedores", type: "passivo", nature: "credora", level: 3, parentId: "2.1", active: true, hasEntries: true },
          { id: "2.1.2", code: "2.1.2", name: "Obrigações Fiscais", type: "passivo", nature: "credora", level: 3, parentId: "2.1", active: true, hasEntries: true },
          { id: "2.1.3", code: "2.1.3", name: "Obrigações Trabalhistas", type: "passivo", nature: "credora", level: 3, parentId: "2.1", active: true, hasEntries: true },
          { id: "2.1.4", code: "2.1.4", name: "Empréstimos CP", type: "passivo", nature: "credora", level: 3, parentId: "2.1", active: true, hasEntries: true },
        ],
      },
      {
        id: "2.2", code: "2.2", name: "Passivo Não Circulante", type: "passivo", nature: "credora", level: 2, parentId: "2", active: true, hasEntries: true,
      },
    ],
  },
  {
    id: "3", code: "3", name: "PATRIMÔNIO LÍQUIDO", type: "patrimonio", nature: "credora", level: 1, parentId: null, active: true, hasEntries: false,
    children: [
      { id: "3.1", code: "3.1", name: "Capital Social", type: "patrimonio", nature: "credora", level: 2, parentId: "3", active: true, hasEntries: true },
      { id: "3.2", code: "3.2", name: "Reservas", type: "patrimonio", nature: "credora", level: 2, parentId: "3", active: true, hasEntries: true },
      { id: "3.3", code: "3.3", name: "Lucros/Prejuízos Acumulados", type: "patrimonio", nature: "credora", level: 2, parentId: "3", active: true, hasEntries: true },
    ],
  },
  {
    id: "4", code: "4", name: "RECEITAS", type: "receita", nature: "credora", level: 1, parentId: null, active: true, hasEntries: false,
    children: [
      { id: "4.1", code: "4.1", name: "Receita Bruta de Serviços", type: "receita", nature: "credora", level: 2, parentId: "4", active: true, hasEntries: true },
      { id: "4.2", code: "4.2", name: "Receita Bruta de Produtos", type: "receita", nature: "credora", level: 2, parentId: "4", active: true, hasEntries: true },
      { id: "4.9", code: "4.9", name: "(-) Deduções de Receita", type: "receita", nature: "devedora", level: 2, parentId: "4", active: true, hasEntries: true },
    ],
  },
  {
    id: "5", code: "5", name: "CUSTOS", type: "custo", nature: "devedora", level: 1, parentId: null, active: true, hasEntries: false,
    children: [
      { id: "5.1", code: "5.1", name: "CMV / CPV", type: "custo", nature: "devedora", level: 2, parentId: "5", active: true, hasEntries: true },
    ],
  },
  {
    id: "6", code: "6", name: "DESPESAS", type: "despesa", nature: "devedora", level: 1, parentId: null, active: true, hasEntries: false,
    children: [
      { id: "6.1", code: "6.1", name: "Despesas Operacionais", type: "despesa", nature: "devedora", level: 2, parentId: "6", active: true, hasEntries: true },
      { id: "6.2", code: "6.2", name: "Despesas Financeiras", type: "despesa", nature: "devedora", level: 2, parentId: "6", active: true, hasEntries: true },
      { id: "6.9", code: "6.9", name: "Outras Despesas", type: "despesa", nature: "devedora", level: 2, parentId: "6", active: true, hasEntries: false },
    ],
  },
];

// Flatten tree for search/select purposes
export function flattenAccounts(accounts: ChartAccount[]): ChartAccount[] {
  const result: ChartAccount[] = [];
  function walk(list: ChartAccount[]) {
    for (const acc of list) {
      result.push(acc);
      if (acc.children) walk(acc.children);
    }
  }
  walk(accounts);
  return result;
}

// Template names
export const accountTemplates = [
  { id: "saas", name: "SaaS B2B", description: "Plano otimizado para empresas SaaS" },
  { id: "varejo", name: "Varejo", description: "Plano para comércio varejista" },
  { id: "servicos", name: "Serviços", description: "Plano para prestadores de serviço" },
  { id: "industria", name: "Indústria", description: "Plano para indústria e manufatura" },
];
