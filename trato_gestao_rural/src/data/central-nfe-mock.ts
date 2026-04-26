/* ── Central NF-e SEFAZ — Types & Mock Data ── */

export interface DfeConfig {
  recipientType: "pf" | "pj";
  cnpjCpf: string;
  razaoSocial: string;
  environment: "homologacao" | "producao";
  apiProvider: "nuvemfiscal" | "focus" | "enotas" | "outro";
  apiToken: string;
  apiUrl: string;
  autoSync: boolean;
  syncFrequency: "1h" | "6h" | "diaria" | "manual";
  syncHour: string;
  initialPeriod: "30d" | "60d" | "90d" | "6m" | "1a";
  notifyNew: boolean;
}

export type NfeStatus = "nova" | "revisao" | "importada" | "ignorada";
export type ManifestStatus = "confirmada" | "ciente" | "nao_realizada" | "desconhecida" | "pendente";

export interface SefazNfe {
  id: string;
  number: number;
  series: number;
  accessKey: string;
  emissionDate: string;
  // Emitter
  emitterCnpj: string;
  emitterName: string;
  emitterIe: string;
  emitterKnown: boolean; // already in Parceiros
  // Items summary
  items: SefazNfeItem[];
  totalValue: number;
  freight: number;
  discount: number;
  netTotal: number;
  // Duplicates
  installments: { number: number; dueDate: string; amount: number }[];
  // Status
  status: NfeStatus;
  manifestStatus: ManifestStatus;
  ignoreReason?: string;
  importedAt?: string;
  payableStatus?: "pendente" | "pago" | "vencido";
  // Nature / CFOP
  nature: string;
  cfop: string;
}

export interface SefazNfeItem {
  id: string;
  description: string;
  ncm: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  suggestedCategory: string;
  stockProductMatch?: string;
  includeInStock: boolean;
}

export interface SyncLog {
  id: string;
  dateTime: string;
  type: "automatica" | "manual";
  nfesFound: number;
  nfesNew: number;
  status: "sucesso" | "erro" | "parcial";
  errorDetail?: string;
}

export const defaultDfeConfig: DfeConfig = {
  recipientType: "pf",
  cnpjCpf: "000.000.000-00",
  razaoSocial: "José Carlos da Silva",
  environment: "homologacao",
  apiProvider: "nuvemfiscal",
  apiToken: "",
  apiUrl: "https://api.nuvemfiscal.com.br",
  autoSync: true,
  syncFrequency: "6h",
  syncHour: "06:00",
  initialPeriod: "90d",
  notifyNew: true,
};

export const apiProviderUrls: Record<string, string> = {
  nuvemfiscal: "https://api.nuvemfiscal.com.br",
  focus: "https://homologacao.focusnfe.com.br",
  enotas: "https://api.enotas.com.br",
  outro: "",
};

export const apiProviderLabels: Record<string, string> = {
  nuvemfiscal: "Nuvem Fiscal", focus: "Focus NF-e", enotas: "eNotas", outro: "Outro",
};

export const manifestLabels: Record<ManifestStatus, string> = {
  confirmada: "Confirmada ✅", ciente: "Ciente 👁", nao_realizada: "Não Realizada ❌",
  desconhecida: "Desconhecida ❓", pendente: "Pendente ⏳",
};
export const manifestColors: Record<ManifestStatus, string> = {
  confirmada: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  ciente: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  nao_realizada: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  desconhecida: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  pendente: "bg-muted text-muted-foreground border-border",
};

function classifyNcm(ncm: string): string {
  if (ncm.startsWith("23")) return "Alimentação Animal";
  if (ncm.startsWith("30")) return "Medicamentos e Veterinário";
  if (ncm.startsWith("2710")) return "Combustível";
  if (ncm.startsWith("87")) return "Máquinas e Implementos";
  if (ncm.startsWith("3808")) return "Defensivos Agrícolas";
  if (ncm.startsWith("31")) return "Fertilizantes e Adubos";
  if (ncm.startsWith("25") || ncm.startsWith("26")) return "Minerais";
  return "Outros Insumos";
}

export const mockSefazNfes: SefazNfe[] = [
  {
    id: "snfe-1", number: 4521, series: 1, accessKey: "31260398765432000110550010000045211234567890",
    emissionDate: "2026-03-07", emitterCnpj: "98.765.432/0001-10", emitterName: "Nutrifarm Rações Ltda",
    emitterIe: "456123789", emitterKnown: true,
    items: [
      { id: "si-1", description: "Ração bovinos confinamento 22% PB", ncm: "2309.90.40", unit: "TON", quantity: 10, unitPrice: 1280, totalPrice: 12800, suggestedCategory: classifyNcm("2309"), includeInStock: true },
    ],
    totalValue: 12800, freight: 0, discount: 0, netTotal: 12800,
    installments: [{ number: 1, dueDate: "2026-04-07", amount: 6400 }, { number: 2, dueDate: "2026-05-07", amount: 6400 }],
    status: "nova", manifestStatus: "pendente", nature: "Compra para uso/consumo", cfop: "1.556",
  },
  {
    id: "snfe-2", number: 892, series: 1, accessKey: "31260355544433000122550010000008921234567891",
    emissionDate: "2026-03-06", emitterCnpj: "55.544.433/0001-22", emitterName: "Vet Saúde Animal ME",
    emitterIe: "789456123", emitterKnown: false,
    items: [
      { id: "si-2", description: "Ivermectina 1% — frasco 500ml", ncm: "3004.90.99", unit: "FR", quantity: 20, unitPrice: 45, totalPrice: 900, suggestedCategory: classifyNcm("3004"), includeInStock: true },
      { id: "si-3", description: "Vacina Aftosa Ourovac — dose 50ml", ncm: "3002.30.00", unit: "DS", quantity: 200, unitPrice: 3.5, totalPrice: 700, suggestedCategory: classifyNcm("3002"), includeInStock: true },
      { id: "si-4", description: "Vermífugo Albendazol 10% — 1L", ncm: "3004.90.69", unit: "FR", quantity: 10, unitPrice: 32, totalPrice: 320, suggestedCategory: classifyNcm("3004"), includeInStock: true },
    ],
    totalValue: 1920, freight: 150, discount: 0, netTotal: 2070,
    installments: [{ number: 1, dueDate: "2026-04-06", amount: 2070 }],
    status: "nova", manifestStatus: "pendente", nature: "Compra para uso/consumo", cfop: "2.556",
  },
  {
    id: "snfe-3", number: 1205, series: 3, accessKey: "31260344433322000133550030000012051234567892",
    emissionDate: "2026-03-05", emitterCnpj: "44.433.322/0001-33", emitterName: "Cooperativa Agro Sul",
    emitterIe: "321987654", emitterKnown: true,
    items: [
      { id: "si-5", description: "Sal mineral proteinado Nutripasto 80P", ncm: "2309.90.90", unit: "SC", quantity: 40, unitPrice: 52.5, totalPrice: 2100, suggestedCategory: classifyNcm("2309"), includeInStock: true },
    ],
    totalValue: 2100, freight: 0, discount: 100, netTotal: 2000,
    installments: [{ number: 1, dueDate: "2026-03-20", amount: 2000 }],
    status: "nova", manifestStatus: "pendente", nature: "Compra para uso/consumo", cfop: "1.556",
  },
  {
    id: "snfe-4", number: 7788, series: 1, accessKey: "31260333322211000144550010000077881234567893",
    emissionDate: "2026-03-04", emitterCnpj: "33.322.211/0001-44", emitterName: "Posto Fazendeiro Ltda",
    emitterIe: "654321987", emitterKnown: true,
    items: [
      { id: "si-6", description: "Óleo diesel S10 — litro", ncm: "2710.19.21", unit: "LT", quantity: 2000, unitPrice: 2.25, totalPrice: 4500, suggestedCategory: classifyNcm("2710"), includeInStock: true },
    ],
    totalValue: 4500, freight: 0, discount: 0, netTotal: 4500,
    installments: [{ number: 1, dueDate: "2026-03-19", amount: 4500 }],
    status: "revisao", manifestStatus: "ciente", nature: "Compra para uso/consumo", cfop: "1.653",
  },
  {
    id: "snfe-5", number: 3344, series: 1, accessKey: "31260222211100000155550010000033441234567894",
    emissionDate: "2026-02-28", emitterCnpj: "22.211.100/0001-55", emitterName: "CEMIG Distribuição S.A.",
    emitterIe: "111222333", emitterKnown: true,
    items: [
      { id: "si-7", description: "Energia elétrica — consumo rural", ncm: "2716.00.00", unit: "KWH", quantity: 3200, unitPrice: 0.453, totalPrice: 1450, suggestedCategory: "Energia Elétrica", includeInStock: false },
    ],
    totalValue: 1450, freight: 0, discount: 0, netTotal: 1450,
    installments: [{ number: 1, dueDate: "2026-03-15", amount: 1450 }],
    status: "importada", manifestStatus: "confirmada", importedAt: "2026-03-01T10:30:00", payableStatus: "pendente",
    nature: "Prestação de serviço", cfop: "1.556",
  },
  {
    id: "snfe-6", number: 156, series: 1, accessKey: "31260211100099000166550010000001561234567895",
    emissionDate: "2026-02-20", emitterCnpj: "11.100.099/0001-66", emitterName: "Oficina Mecânica Rural ME",
    emitterIe: "444555666", emitterKnown: true,
    items: [
      { id: "si-8", description: "Serviço de manutenção trator John Deere", ncm: "00.000.000", unit: "SV", quantity: 1, unitPrice: 980, totalPrice: 980, suggestedCategory: "Manutenção de Máquinas", includeInStock: false },
    ],
    totalValue: 980, freight: 0, discount: 0, netTotal: 980,
    installments: [{ number: 1, dueDate: "2026-03-07", amount: 980 }],
    status: "importada", manifestStatus: "confirmada", importedAt: "2026-02-22T14:15:00", payableStatus: "pago",
    nature: "Prestação de serviço", cfop: "1.933",
  },
  {
    id: "snfe-7", number: 9901, series: 2, accessKey: "31260199988877000177550020000099011234567896",
    emissionDate: "2026-02-15", emitterCnpj: "99.988.877/0001-77", emitterName: "AgroInsumos Nacional SA",
    emitterIe: "777888999", emitterKnown: true,
    items: [
      { id: "si-9", description: "Feno coast cross — fardo 20kg", ncm: "1214.90.00", unit: "FD", quantity: 200, unitPrice: 30, totalPrice: 6000, suggestedCategory: "Alimentação Animal", includeInStock: true },
    ],
    totalValue: 6000, freight: 350, discount: 0, netTotal: 6350,
    installments: [{ number: 1, dueDate: "2026-03-15", amount: 3175 }, { number: 2, dueDate: "2026-04-15", amount: 3175 }],
    status: "importada", manifestStatus: "confirmada", importedAt: "2026-02-16T08:00:00", payableStatus: "pendente",
    nature: "Compra para uso/consumo", cfop: "2.556",
  },
  {
    id: "snfe-8", number: 445, series: 1, accessKey: "31260188877766000188550010000004451234567897",
    emissionDate: "2026-01-30", emitterCnpj: "88.877.766/0001-88", emitterName: "Desconhecido Comércio Ltda",
    emitterIe: "000111222", emitterKnown: false,
    items: [
      { id: "si-10", description: "Produto não solicitado", ncm: "9999.99.99", unit: "UN", quantity: 1, unitPrice: 500, totalPrice: 500, suggestedCategory: "Outros", includeInStock: false },
    ],
    totalValue: 500, freight: 0, discount: 0, netTotal: 500,
    installments: [],
    status: "ignorada", manifestStatus: "desconhecida", ignoreReason: "Nota não reconhecida — fornecedor desconhecido",
    nature: "Venda", cfop: "6.102",
  },
];

export const mockSyncLogs: SyncLog[] = [
  { id: "sl-1", dateTime: "2026-03-08T06:00:00", type: "automatica", nfesFound: 12, nfesNew: 3, status: "sucesso" },
  { id: "sl-2", dateTime: "2026-03-07T06:00:00", type: "automatica", nfesFound: 8, nfesNew: 1, status: "sucesso" },
  { id: "sl-3", dateTime: "2026-03-06T14:22:00", type: "manual", nfesFound: 10, nfesNew: 2, status: "sucesso" },
  { id: "sl-4", dateTime: "2026-03-05T06:00:00", type: "automatica", nfesFound: 0, nfesNew: 0, status: "erro", errorDetail: "Token de autenticação expirado — renove o token nas configurações" },
  { id: "sl-5", dateTime: "2026-03-04T06:00:00", type: "automatica", nfesFound: 5, nfesNew: 1, status: "sucesso" },
  { id: "sl-6", dateTime: "2026-03-03T18:45:00", type: "manual", nfesFound: 15, nfesNew: 4, status: "parcial", errorDetail: "2 NF-es não puderam ser baixadas — tentando novamente na próxima sincronização" },
];

export interface DfeAlert {
  type: "warning" | "error" | "info";
  message: string;
}

export function getDfeAlerts(nfes: SefazNfe[]): DfeAlert[] {
  const alerts: DfeAlert[] = [];
  const pendingManifest = nfes.filter(n => n.manifestStatus === "pendente" && daysDiff(n.emissionDate) > 7);
  if (pendingManifest.length > 0) {
    alerts.push({ type: "warning", message: `${pendingManifest.length} NF-e(s) sem manifestação há mais de 7 dias — manifestação é obrigatória para CNPJ` });
  }
  const cancelled = nfes.filter(n => n.status === "importada" && n.nature === "Cancelada");
  if (cancelled.length > 0) {
    alerts.push({ type: "error", message: `${cancelled.length} NF-e(s) importadas foram canceladas pelo fornecedor na SEFAZ` });
  }
  return alerts;
}

function daysDiff(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}
