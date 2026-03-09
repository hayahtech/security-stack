export interface BalanceSheetLine {
  id: string;
  label: string;
  isGroup?: boolean;
  isTotal?: boolean;
  isDeduction?: boolean;
  indent?: number;
  values: Record<string, number>; // key = period (e.g., "2024-12", "2025-03")
}

export interface BalanceSheetData {
  assets: BalanceSheetLine[];
  liabilities: BalanceSheetLine[];
  equity: BalanceSheetLine[];
}

export const balanceSheetPeriods = ["2024-12", "2025-03", "2025-06"];

export const balanceSheetData: BalanceSheetData = {
  assets: [
    { id: "ac", label: "ATIVO CIRCULANTE", isGroup: true, values: { "2024-12": 11240000, "2025-03": 12340000, "2025-06": 12840000 } },
    { id: "ac-caixa", label: "Caixa e Equivalentes", indent: 1, values: { "2024-12": 3890500, "2025-03": 4120000, "2025-06": 4366500 } },
    { id: "ac-itau", label: "Banco Itaú CC", indent: 2, values: { "2024-12": 1542300, "2025-03": 1720000, "2025-06": 1842300 } },
    { id: "ac-bb", label: "Banco Brasil CC", indent: 2, values: { "2024-12": 867500, "2025-03": 920000, "2025-06": 987500 } },
    { id: "ac-cdb", label: "CDB / Aplicações", indent: 2, values: { "2024-12": 750000, "2025-03": 840000, "2025-06": 891500 } },
    { id: "ac-receber", label: "Contas a Receber Clientes", indent: 1, values: { "2024-12": 6200000, "2025-03": 6850000, "2025-06": 7180000 } },
    { id: "ac-pdd", label: "(-) PDD", indent: 1, isDeduction: true, values: { "2024-12": -850000, "2025-03": -920000, "2025-06": -1000000 } },
    { id: "ac-estoque", label: "Estoques", indent: 1, values: { "2024-12": 245000, "2025-03": 268000, "2025-06": 293500 } },
    
    { id: "anc", label: "ATIVO NÃO CIRCULANTE", isGroup: true, values: { "2024-12": 14180000, "2025-03": 15020000, "2025-06": 15610000 } },
    { id: "anc-rlp", label: "Realizável a Longo Prazo", indent: 1, values: { "2024-12": 1850000, "2025-03": 1980000, "2025-06": 2100000 } },
    { id: "anc-imob-bruto", label: "Imobilizado Bruto", indent: 1, values: { "2024-12": 7820000, "2025-03": 8120000, "2025-06": 8420000 } },
    { id: "anc-deprec", label: "(-) Deprec. Acumulada", indent: 1, isDeduction: true, values: { "2024-12": -1940000, "2025-03": -2120000, "2025-06": -2310000 } },
    { id: "anc-imob-liq", label: "Imobilizado Líquido", indent: 1, values: { "2024-12": 5880000, "2025-03": 6000000, "2025-06": 6110000 } },
    { id: "anc-intang-bruto", label: "Intangível (Softwares/IP)", indent: 1, values: { "2024-12": 4200000, "2025-03": 4500000, "2025-06": 4800000 } },
    { id: "anc-amort", label: "(-) Amort. Acumulada", indent: 1, isDeduction: true, values: { "2024-12": -720000, "2025-03": -810000, "2025-06": -900000 } },
    { id: "anc-intang-liq", label: "Intangível Líquido", indent: 1, values: { "2024-12": 3480000, "2025-03": 3690000, "2025-06": 3900000 } },
    { id: "anc-outros", label: "Outros ANLP", indent: 1, values: { "2024-12": 2970000, "2025-03": 3350000, "2025-06": 3500000 } },
    
    { id: "total-ativo", label: "TOTAL ATIVO", isTotal: true, values: { "2024-12": 25420000, "2025-03": 27360000, "2025-06": 28450000 } },
  ],
  liabilities: [
    { id: "pc", label: "PASSIVO CIRCULANTE", isGroup: true, values: { "2024-12": 7120000, "2025-03": 7540000, "2025-06": 7920000 } },
    { id: "pc-fornec", label: "Fornecedores", indent: 1, values: { "2024-12": 2840000, "2025-03": 3050000, "2025-06": 3240000 } },
    { id: "pc-salarios", label: "Salários a Pagar", indent: 1, values: { "2024-12": 820000, "2025-03": 856000, "2025-06": 890000 } },
    { id: "pc-obrig-fisc", label: "Obrigações Fiscais", indent: 1, values: { "2024-12": 378000, "2025-03": 394000, "2025-06": 412000 } },
    { id: "pc-emp-cp", label: "Empréstimos CP", indent: 1, values: { "2024-12": 2620000, "2025-03": 2740000, "2025-06": 2840000 } },
    { id: "pc-outras", label: "Outras Obrigações", indent: 1, values: { "2024-12": 462000, "2025-03": 500000, "2025-06": 538000 } },
    
    { id: "pnc", label: "PASSIVO NÃO CIRCULANTE", isGroup: true, values: { "2024-12": 6800000, "2025-03": 7120000, "2025-06": 7400000 } },
    { id: "pnc-emp-lp", label: "Empréstimos LP", indent: 1, values: { "2024-12": 5120000, "2025-03": 5350000, "2025-06": 5580000 } },
    { id: "pnc-deb", label: "Debêntures", indent: 1, values: { "2024-12": 1680000, "2025-03": 1770000, "2025-06": 1820000 } },
    
    { id: "total-passivo", label: "TOTAL PASSIVO", isTotal: true, values: { "2024-12": 13920000, "2025-03": 14660000, "2025-06": 15320000 } },
  ],
  equity: [
    { id: "pl", label: "PATRIMÔNIO LÍQUIDO", isGroup: true, values: { "2024-12": 11500000, "2025-03": 12700000, "2025-06": 13130000 } },
    { id: "pl-capital", label: "Capital Social", indent: 1, values: { "2024-12": 5000000, "2025-03": 5000000, "2025-06": 5000000 } },
    { id: "pl-reserva", label: "Reserva de Lucros", indent: 1, values: { "2024-12": 4320000, "2025-03": 4850000, "2025-06": 5200000 } },
    { id: "pl-lucro-ex", label: "Lucros do Exercício", indent: 1, values: { "2024-12": 2180000, "2025-03": 2850000, "2025-06": 2930000 } },
    
    { id: "total-passivo-pl", label: "TOTAL PASSIVO + PL", isTotal: true, values: { "2024-12": 25420000, "2025-03": 27360000, "2025-06": 28450000 } },
  ],
};

export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
}

export function calculateIndicators(period: string) {
  const totalAtivo = balanceSheetData.assets.find(l => l.id === "total-ativo")?.values[period] || 0;
  const totalPassivo = balanceSheetData.liabilities.find(l => l.id === "total-passivo")?.values[period] || 0;
  const totalPL = balanceSheetData.equity.find(l => l.id === "pl")?.values[period] || 0;
  const imobilizado = balanceSheetData.assets.find(l => l.id === "anc-imob-liq")?.values[period] || 0;
  const ativoNaoCirc = balanceSheetData.assets.find(l => l.id === "anc")?.values[period] || 0;

  return {
    indiceEndividamento: totalPassivo / (totalPassivo + totalPL) * 100,
    participacaoCapitalTerceiros: totalPassivo / totalPL * 100,
    imobilizacaoPL: imobilizado / totalPL * 100,
    grauImobilizacao: ativoNaoCirc / totalAtivo * 100,
  };
}
