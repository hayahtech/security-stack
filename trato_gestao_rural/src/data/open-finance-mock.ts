import { Transaction } from "./types";

export interface PluggyConfig {
  clientId: string;
  clientSecret: string;
  environment: "sandbox" | "production";
}

export interface ConnectedBank {
  id: string;
  itemId: string; // Pluggy item_id
  connectorName: string;
  connectorLogo: string;
  accountType: string;
  agency: string;
  accountNumber: string;
  linkedInstrumentId: string | null;
  status: "connected" | "needs_reauth" | "error";
  lastSync: string | null;
  balanceFromPluggy: number;
  createdAt: string;
}

export interface ImportedTransaction {
  id: string;
  pluggyTransactionId: string;
  connectedBankId: string;
  date: string;
  description: string;
  originalDescription: string;
  amount: number;
  type: "credit" | "debit";
  suggestedCategoryId: string | null;
  confirmedCategoryId: string | null;
  status: "pending_review" | "auto_categorized" | "confirmed" | "ignored";
  matchedPayableId: string | null;
  importedAt: string;
}

export interface CategorizationRule {
  id: string;
  keyword: string;
  categoryId: string;
  timesUsed: number;
}

export const bankLogos: Record<string, string> = {
  "banco-do-brasil": "🏦",
  "bradesco": "🏦",
  "itau": "🏦",
  "caixa": "🏦",
  "santander": "🏦",
  "nubank": "💜",
  "inter": "🟧",
  "sicoob": "🟢",
  "sicredi": "🟢",
  "btg": "🏦",
  "xp": "🏦",
  "c6": "⬛",
  "safra": "🏦",
  "pagbank": "🟡",
  "stone": "🟢",
};

export const availableBanks = [
  { id: "banco-do-brasil", name: "Banco do Brasil", color: "bg-yellow-500" },
  { id: "bradesco", name: "Bradesco", color: "bg-red-600" },
  { id: "itau", name: "Itaú Unibanco", color: "bg-orange-500" },
  { id: "caixa", name: "Caixa Econômica", color: "bg-blue-600" },
  { id: "santander", name: "Santander", color: "bg-red-500" },
  { id: "nubank", name: "Nubank", color: "bg-purple-600" },
  { id: "inter", name: "Banco Inter", color: "bg-orange-600" },
  { id: "sicoob", name: "Sicoob", color: "bg-green-600" },
  { id: "sicredi", name: "Sicredi", color: "bg-green-700" },
  { id: "btg", name: "BTG Pactual", color: "bg-blue-900" },
  { id: "xp", name: "XP Investimentos", color: "bg-gray-900" },
  { id: "c6", name: "C6 Bank", color: "bg-gray-800" },
  { id: "safra", name: "Banco Safra", color: "bg-blue-800" },
  { id: "pagbank", name: "PagBank", color: "bg-green-500" },
  { id: "stone", name: "Stone", color: "bg-emerald-600" },
];

export const mockConnectedBanks: ConnectedBank[] = [
  {
    id: "cb-1",
    itemId: "pluggy-item-abc123",
    connectorName: "Sicoob",
    connectorLogo: "🟢",
    accountType: "Conta Corrente",
    agency: "3001",
    accountNumber: "12345-6",
    linkedInstrumentId: "pi-1",
    status: "connected",
    lastSync: "2026-03-08T06:00:00",
    balanceFromPluggy: 87320,
    createdAt: "2026-01-15",
  },
  {
    id: "cb-2",
    itemId: "pluggy-item-def456",
    connectorName: "Nubank",
    connectorLogo: "💜",
    accountType: "Cartão de Crédito",
    agency: "",
    accountNumber: "****8832",
    linkedInstrumentId: "pi-4",
    status: "needs_reauth",
    lastSync: "2026-03-05T06:00:00",
    balanceFromPluggy: -1850,
    createdAt: "2026-02-10",
  },
];

export const mockImportedTransactions: ImportedTransaction[] = [
  {
    id: "imp-1", pluggyTransactionId: "pluggy-txn-001", connectedBankId: "cb-1",
    date: "2026-03-07", description: "PIX Recebido - Laticínio São José",
    originalDescription: "PIX RECEBIDO LATICINIO SAO JOSE LTDA",
    amount: 12500, type: "credit", suggestedCategoryId: "cat-2",
    confirmedCategoryId: null, status: "auto_categorized", matchedPayableId: null,
    importedAt: "2026-03-08T06:01:00",
  },
  {
    id: "imp-2", pluggyTransactionId: "pluggy-txn-002", connectedBankId: "cb-1",
    date: "2026-03-07", description: "POSTO IPIRANGA MATAO",
    originalDescription: "DEBITO AUTOMATICO POSTO IPIRANGA MATAO SP",
    amount: 450, type: "debit", suggestedCategoryId: "cat-8",
    confirmedCategoryId: null, status: "auto_categorized", matchedPayableId: null,
    importedAt: "2026-03-08T06:01:00",
  },
  {
    id: "imp-3", pluggyTransactionId: "pluggy-txn-003", connectedBankId: "cb-1",
    date: "2026-03-06", description: "TED Recebido - 000.000.000-00",
    originalDescription: "TED RECEBIDO CPF 04512345600",
    amount: 8200, type: "credit", suggestedCategoryId: null,
    confirmedCategoryId: null, status: "pending_review", matchedPayableId: null,
    importedAt: "2026-03-08T06:01:00",
  },
  {
    id: "imp-4", pluggyTransactionId: "pluggy-txn-004", connectedBankId: "cb-1",
    date: "2026-03-06", description: "Nutrivale Nutrição Animal",
    originalDescription: "PIX ENVIADO NUTRIVALE NUTRICAO ANIMAL LTDA",
    amount: 3200, type: "debit", suggestedCategoryId: "cat-3",
    confirmedCategoryId: null, status: "auto_categorized", matchedPayableId: "pay-3",
    importedAt: "2026-03-08T06:01:00",
  },
  {
    id: "imp-5", pluggyTransactionId: "pluggy-txn-005", connectedBankId: "cb-1",
    date: "2026-03-05", description: "Farmácia Veterinária Dr. Carlos",
    originalDescription: "DEBITO FARM VET DR CARLOS LTDA",
    amount: 890, type: "debit", suggestedCategoryId: "cat-4",
    confirmedCategoryId: null, status: "pending_review", matchedPayableId: null,
    importedAt: "2026-03-08T06:01:00",
  },
  {
    id: "imp-6", pluggyTransactionId: "pluggy-txn-006", connectedBankId: "cb-1",
    date: "2026-03-05", description: "Transferência entre contas",
    originalDescription: "TRANSF CC POUPANCA SICOOB",
    amount: 5000, type: "debit", suggestedCategoryId: null,
    confirmedCategoryId: null, status: "pending_review", matchedPayableId: null,
    importedAt: "2026-03-08T06:01:00",
  },
  {
    id: "imp-7", pluggyTransactionId: "pluggy-txn-007", connectedBankId: "cb-1",
    date: "2026-03-04", description: "Cooperativa Agro Sul - Sal Mineral",
    originalDescription: "PIX ENVIADO COOP AGRO SUL",
    amount: 1750, type: "debit", suggestedCategoryId: "cat-3",
    confirmedCategoryId: null, status: "auto_categorized", matchedPayableId: null,
    importedAt: "2026-03-08T06:01:00",
  },
  {
    id: "imp-8", pluggyTransactionId: "pluggy-txn-008", connectedBankId: "cb-1",
    date: "2026-03-03", description: "Pagamento Energia Elétrica",
    originalDescription: "DEB AUTO CPFL ENERGIA",
    amount: 620, type: "debit", suggestedCategoryId: "cat-8",
    confirmedCategoryId: null, status: "pending_review", matchedPayableId: null,
    importedAt: "2026-03-08T06:01:00",
  },
];

export const mockCategorizationRules: CategorizationRule[] = [
  { id: "rule-1", keyword: "posto ipiranga", categoryId: "cat-8", timesUsed: 5 },
  { id: "rule-2", keyword: "laticinio", categoryId: "cat-2", timesUsed: 12 },
  { id: "rule-3", keyword: "nutrivale", categoryId: "cat-3", timesUsed: 8 },
  { id: "rule-4", keyword: "sal mineral", categoryId: "cat-3", timesUsed: 3 },
  { id: "rule-5", keyword: "cpfl energia", categoryId: "cat-8", timesUsed: 6 },
];
