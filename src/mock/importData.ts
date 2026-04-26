export interface ImportRecord {
  id: string;
  date: string;
  fileName: string;
  type: string;
  records: number;
  valid: number;
  errors: number;
  duplicates: number;
  status: "success" | "partial" | "error";
}

export const importHistory: ImportRecord[] = [
  { id: "1", date: "09/03/2025", fileName: "lancamentos_2024.xlsx", type: "Lançamentos", records: 1248, valid: 1248, errors: 0, duplicates: 0, status: "success" },
  { id: "2", date: "08/03/2025", fileName: "clientes_base.csv", type: "Clientes", records: 847, valid: 847, errors: 0, duplicates: 0, status: "success" },
  { id: "3", date: "07/03/2025", fileName: "contas_pagar_mar.xlsx", type: "Contas a Pagar", records: 42, valid: 39, errors: 3, duplicates: 0, status: "partial" },
  { id: "4", date: "05/03/2025", fileName: "fornecedores.xlsx", type: "Fornecedores", records: 124, valid: 120, errors: 2, duplicates: 2, status: "partial" },
  { id: "5", date: "01/03/2025", fileName: "receber_fev.csv", type: "Contas a Receber", records: 312, valid: 312, errors: 0, duplicates: 0, status: "success" },
];

export const importTypes = [
  { id: "lancamentos", label: "Lançamentos", icon: "📒", columns: ["Data", "Conta Débito", "Conta Crédito", "Valor", "Histórico", "Documento"] },
  { id: "clientes", label: "Clientes", icon: "👥", columns: ["Razão Social", "CNPJ/CPF", "E-mail", "Telefone", "Endereço", "Segmento"] },
  { id: "fornecedores", label: "Fornecedores", icon: "🏢", columns: ["Razão Social", "CNPJ", "E-mail", "Telefone", "Categoria", "Condição Pgto"] },
  { id: "receber", label: "Contas a Receber", icon: "💰", columns: ["Cliente", "Valor", "Emissão", "Vencimento", "Documento", "Status"] },
  { id: "pagar", label: "Contas a Pagar", icon: "💸", columns: ["Fornecedor", "Valor", "Emissão", "Vencimento", "Documento", "Categoria"] },
];

export const migrationSystems = [
  { id: "contaazul", name: "Conta Azul", icon: "🔵", steps: ["Acesse Relatórios → Exportar Dados", "Selecione o período desejado", "Baixe o arquivo CSV", "Faça upload aqui e mapeie as colunas"] },
  { id: "omie", name: "Omie", icon: "🟠", steps: ["Acesse Cadastros → Exportar", "Escolha o módulo (Clientes, Financeiro, etc.)", "Gere o arquivo Excel", "Faça upload e configure o mapeamento"] },
  { id: "quickbooks", name: "QuickBooks", icon: "🟢", steps: ["Go to Reports → Export to Excel", "Select date range and accounts", "Download the Excel file", "Upload here and map columns"] },
  { id: "excel", name: "Planilha Excel genérica", icon: "📊", steps: ["Organize seus dados em colunas", "Garanta que a primeira linha contém os cabeçalhos", "Faça upload do arquivo", "Use o assistente de mapeamento"] },
  { id: "outro", name: "Outro sistema", icon: "📦", steps: ["Exporte os dados do sistema atual", "Salve em formato CSV ou Excel", "Faça upload aqui", "Mapeie as colunas manualmente"] },
];

export const validationErrors = [
  { line: 45, field: "Data", value: "30/02/2025", error: "Data inválida" },
  { line: 67, field: "Cliente", value: "ABC Ltda", error: "Cliente não encontrado" },
  { line: 89, field: "Valor", value: "abc", error: "Valor não numérico" },
  { line: 112, field: "CNPJ", value: "12.345.678/0001", error: "CNPJ incompleto" },
  { line: 134, field: "Data", value: "", error: "Campo obrigatório vazio" },
  { line: 156, field: "Conta", value: "9.9.9", error: "Conta não existe no plano" },
  { line: 201, field: "Valor", value: "-500", error: "Valor negativo não permitido" },
  { line: 234, field: "Vencimento", value: "01/13/2025", error: "Mês inválido" },
  { line: 267, field: "E-mail", value: "joao@", error: "E-mail inválido" },
  { line: 289, field: "Telefone", value: "123", error: "Telefone muito curto" },
  { line: 312, field: "CEP", value: "0000", error: "CEP inválido" },
  { line: 345, field: "Data", value: "2030-01-01", error: "Data no futuro" },
  { line: 378, field: "Valor", value: "0", error: "Valor zerado" },
  { line: 401, field: "CNPJ", value: "11.111.111/1111-11", error: "CNPJ inválido (dígitos repetidos)" },
];
