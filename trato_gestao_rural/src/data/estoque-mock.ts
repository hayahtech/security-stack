/* ── Estoque (Stock) — types, mock data & utilities ── */

export type StockCategory =
  | "alimentacao" | "saude_animal" | "defensivo" | "combustivel" | "ferramentas" | "outros";

export const categoryLabel: Record<StockCategory, string> = {
  alimentacao: "Alimentação",
  saude_animal: "Saúde Animal",
  defensivo: "Defensivo Agrícola",
  combustivel: "Combustível",
  ferramentas: "Ferramentas",
  outros: "Outros",
};

export const categoryColor: Record<StockCategory, string> = {
  alimentacao: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  saude_animal: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  defensivo: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  combustivel: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  ferramentas: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  outros: "bg-muted text-muted-foreground border-border",
};

export type StockUnit = "kg" | "litro" | "saco" | "caixa" | "unidade" | "dose";

export const unitLabel: Record<StockUnit, string> = {
  kg: "kg", litro: "L", saco: "saco(s)", caixa: "cx", unidade: "un", dose: "dose(s)",
};

export type StockStatus = "ok" | "baixo" | "zerado";

export type EntryType = "compra" | "doacao" | "producao_propria" | "transferencia" | "ajuste_inventario" | "devolucao";

export const entryTypeLabel: Record<EntryType, string> = {
  compra: "Compra",
  doacao: "Doação",
  producao_propria: "Produção Própria",
  transferencia: "Transferência entre fazendas",
  ajuste_inventario: "Ajuste de Inventário",
  devolucao: "Devolução",
};

export type AdjustmentReason = "contagem_fisica" | "perda_quebra" | "vencimento" | "erro_lancamento";

export const adjustmentReasonLabel: Record<AdjustmentReason, string> = {
  contagem_fisica: "Contagem Física",
  perda_quebra: "Perda / Quebra",
  vencimento: "Vencimento",
  erro_lancamento: "Erro de Lançamento",
};

export interface StockProduct {
  id: string;
  name: string;
  category: StockCategory;
  unit: StockUnit;
  currentQty: number;
  minQty: number;
  avgCost: number;
  supplierId: string;
  supplierName: string;
  lot?: string;
  expiryDate?: string;
}

export type MovementType = "entrada" | "saida";
export type ExitReason = "uso_rebanho" | "uso_lavoura" | "perda" | "transferencia";

export const exitReasonLabel: Record<ExitReason, string> = {
  uso_rebanho: "Uso no rebanho",
  uso_lavoura: "Uso na lavoura",
  perda: "Perda",
  transferencia: "Transferência",
};

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  entryType?: EntryType;
  qty: number;
  unitCost?: number;
  totalCost?: number;
  supplierName?: string;
  invoiceNumber?: string;
  reason?: ExitReason;
  adjustmentReason?: AdjustmentReason;
  responsibleName: string;
  linkedPaddock?: string;
  date: string;
  balanceAfter: number;
  lot?: string;
  expiryDate?: string;
  observations?: string;
}

/* ── Helpers ── */
export function getProductStatus(p: StockProduct): StockStatus {
  if (p.currentQty <= 0) return "zerado";
  if (p.currentQty <= p.minQty) return "baixo";
  return "ok";
}

export function getStatusBadge(s: StockStatus): { label: string; className: string } {
  switch (s) {
    case "ok": return { label: "✅ OK", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300" };
    case "baixo": return { label: "⚠️ Baixo", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300" };
    case "zerado": return { label: "❌ Zerado", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300" };
  }
}

/* ── Mock Products ── */
export const mockProducts: StockProduct[] = [
  { id: "sp1", name: "Ração Concentrada Engorda", category: "alimentacao", unit: "saco", currentQty: 45, minQty: 20, avgCost: 85, supplierId: "p1", supplierName: "Agropecuária Boa Safra" },
  { id: "sp2", name: "Sal Mineral Proteinado", category: "alimentacao", unit: "saco", currentQty: 12, minQty: 15, avgCost: 120, supplierId: "p1", supplierName: "Agropecuária Boa Safra" },
  { id: "sp3", name: "Silagem de Milho", category: "alimentacao", unit: "kg", currentQty: 8500, minQty: 5000, avgCost: 0.45, supplierId: "", supplierName: "Produção Própria" },
  { id: "sp4", name: "Vacina Aftosa", category: "saude_animal", unit: "dose", currentQty: 200, minQty: 100, avgCost: 4.5, supplierId: "p1", supplierName: "Agropecuária Boa Safra", lot: "LOTE-2026-A1", expiryDate: "2027-06-15" },
  { id: "sp5", name: "Ivermectina 1%", category: "saude_animal", unit: "litro", currentQty: 3, minQty: 5, avgCost: 95, supplierId: "p1", supplierName: "Agropecuária Boa Safra", lot: "LOTE-2026-B3", expiryDate: "2027-03-01" },
  { id: "sp6", name: "Oxitetraciclina LA", category: "saude_animal", unit: "unidade", currentQty: 8, minQty: 10, avgCost: 42, supplierId: "p1", supplierName: "Agropecuária Boa Safra" },
  { id: "sp7", name: "Herbicida Glifosato", category: "defensivo", unit: "litro", currentQty: 40, minQty: 20, avgCost: 28, supplierId: "", supplierName: "AgroQuímica" },
  { id: "sp8", name: "Diesel S10", category: "combustivel", unit: "litro", currentQty: 850, minQty: 500, avgCost: 6.2, supplierId: "", supplierName: "Posto Rural" },
  { id: "sp9", name: "Óleo Lubrificante Motor", category: "combustivel", unit: "litro", currentQty: 0, minQty: 20, avgCost: 22, supplierId: "", supplierName: "Posto Rural" },
  { id: "sp10", name: "Arame Farpado Rolo 400m", category: "ferramentas", unit: "unidade", currentQty: 6, minQty: 3, avgCost: 280, supplierId: "", supplierName: "Casa Agro" },
  { id: "sp11", name: "Vacina Brucelose B19", category: "saude_animal", unit: "dose", currentQty: 50, minQty: 30, avgCost: 3.8, supplierId: "p1", supplierName: "Agropecuária Boa Safra", lot: "LOTE-2026-C2", expiryDate: "2026-12-30" },
  { id: "sp12", name: "Ração Bezerro Pré-Inicial", category: "alimentacao", unit: "saco", currentQty: 8, minQty: 10, avgCost: 95, supplierId: "p1", supplierName: "Agropecuária Boa Safra" },
];

/* ── Mock Movements ── */
export const mockMovements: StockMovement[] = [
  { id: "sm1", productId: "sp1", productName: "Ração Concentrada Engorda", type: "entrada", entryType: "compra", qty: 30, unitCost: 85, totalCost: 2550, supplierName: "Agropecuária Boa Safra", invoiceNumber: "NF-2026-0412", responsibleName: "João", date: "2026-03-06", balanceAfter: 45 },
  { id: "sm2", productId: "sp2", productName: "Sal Mineral Proteinado", type: "saida", qty: 5, reason: "uso_rebanho", responsibleName: "Carlos", linkedPaddock: "Pasto Norte", date: "2026-03-05", balanceAfter: 12 },
  { id: "sm3", productId: "sp5", productName: "Ivermectina 1%", type: "saida", qty: 2, reason: "uso_rebanho", responsibleName: "Dr. Silva", linkedPaddock: "Pasto Sul", date: "2026-03-04", balanceAfter: 3 },
  { id: "sm4", productId: "sp8", productName: "Diesel S10", type: "entrada", entryType: "compra", qty: 500, unitCost: 6.2, totalCost: 3100, supplierName: "Posto Rural", invoiceNumber: "NF-2026-0398", responsibleName: "João", date: "2026-03-03", balanceAfter: 850 },
  { id: "sm5", productId: "sp4", productName: "Vacina Aftosa", type: "saida", qty: 30, reason: "uso_rebanho", responsibleName: "Dr. Silva", linkedPaddock: "Pasto Norte", date: "2026-03-02", balanceAfter: 200 },
  { id: "sm6", productId: "sp9", productName: "Óleo Lubrificante Motor", type: "saida", qty: 10, reason: "uso_lavoura", responsibleName: "Carlos", date: "2026-03-01", balanceAfter: 0 },
  { id: "sm7", productId: "sp7", productName: "Herbicida Glifosato", type: "entrada", entryType: "compra", qty: 20, unitCost: 28, totalCost: 560, supplierName: "AgroQuímica", invoiceNumber: "NF-2026-0385", responsibleName: "João", date: "2026-02-28", balanceAfter: 40 },
  { id: "sm8", productId: "sp1", productName: "Ração Concentrada Engorda", type: "saida", qty: 15, reason: "uso_rebanho", responsibleName: "Carlos", linkedPaddock: "Confinamento", date: "2026-02-27", balanceAfter: 15 },
  { id: "sm9", productId: "sp12", productName: "Ração Bezerro Pré-Inicial", type: "saida", qty: 4, reason: "uso_rebanho", responsibleName: "Maria", linkedPaddock: "Piquete Maternidade", date: "2026-02-25", balanceAfter: 8 },
  { id: "sm10", productId: "sp10", productName: "Arame Farpado Rolo 400m", type: "entrada", entryType: "compra", qty: 3, unitCost: 280, totalCost: 840, supplierName: "Casa Agro", responsibleName: "João", date: "2026-02-20", balanceAfter: 6 },
];

/** Products below minimum stock — for dashboard alerts */
export function getLowStockProducts(): StockProduct[] {
  return mockProducts.filter((p) => getProductStatus(p) !== "ok");
}

/** Category summary */
export function getCategorySummary(): { category: StockCategory; label: string; totalQty: number; totalValue: number; color: string }[] {
  const cats = Object.keys(categoryLabel) as StockCategory[];
  return cats.map((cat) => {
    const products = mockProducts.filter((p) => p.category === cat);
    return {
      category: cat,
      label: categoryLabel[cat],
      totalQty: products.reduce((s, p) => s + p.currentQty, 0),
      totalValue: products.reduce((s, p) => s + p.currentQty * p.avgCost, 0),
      color: categoryColor[cat],
    };
  }).filter((c) => c.totalQty > 0 || c.totalValue > 0);
}

/** Generate CSV template for stock import */
export function generateImportTemplate(): string {
  const header = "produto_nome,categoria,quantidade,unidade,custo_unitario,data_entrada,fornecedor,nota_fiscal,lote,validade";
  const example1 = "Ração Engorda Premium,alimentacao,50,saco,89.90,2026-03-08,Agropecuária Boa Safra,NF-2026-0500,LOTE-A1,2027-06-15";
  const example2 = "Vacina Carbúnculo,saude_animal,100,dose,5.20,2026-03-08,VetPharm,,LOTE-B2,2027-01-30";
  const example3 = "Diesel S10,combustivel,300,litro,6.35,2026-03-08,Posto Rural,NF-2026-0501,,";
  return [header, example1, example2, example3].join("\n");
}
