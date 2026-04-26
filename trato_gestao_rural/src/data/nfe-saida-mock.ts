/* ── NF-e Saída — Types & Mock Data ── */

export interface NfeConfig {
  emitterType: "pf" | "pj";
  cnpjCpf: string;
  razaoSocial: string;
  ie: string;
  im: string;
  address: string;
  municipality: string;
  state: string;
  taxRegime: "simples" | "presumido" | "real" | "mei";
  cnae: string;
  series: number;
  nextNumber: number;
  environment: "homologacao" | "producao";
  apiProvider: "focus" | "enotas" | "nuvemfiscal" | "outro";
  apiUrl: string;
  apiToken: string;
  certificateUploaded: boolean;
}

export interface NfeItem {
  id: string;
  code: string;
  description: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  icmsCst: string;
  icmsRate: number;
  pisCst: string;
  cofinsCst: string;
  ipiRate: number;
}

export interface NfeDocument {
  id: string;
  number: number;
  series: number;
  accessKey: string;
  emissionDate: string;
  exitDate: string;
  nature: string;
  purpose: "normal" | "complementar" | "ajuste" | "devolucao";
  // Destinatário
  recipientCnpjCpf: string;
  recipientName: string;
  recipientIe: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string;
  ieIndicator: "contribuinte" | "isento" | "nao_contribuinte";
  finalConsumer: boolean;
  // Items
  items: NfeItem[];
  // Totals
  subtotal: number;
  freight: number;
  discount: number;
  total: number;
  // Transport
  freightMode: "cif" | "fob" | "sem_frete";
  carrierName: string;
  vehiclePlate: string;
  volumes: number;
  grossWeight: number;
  netWeight: number;
  // Payment
  paymentMode: "avista" | "aprazo" | "outros";
  installments: { number: number; dueDate: string; amount: number }[];
  // Status
  status: "autorizada" | "cancelada" | "denegada" | "contingencia" | "rascunho";
  cancelReason?: string;
  additionalInfo: string;
  fiscalInfo: string;
  linkedSaleId?: string;
}

export interface ProducerNote {
  id: string;
  number: string;
  date: string;
  recipientName: string;
  product: string;
  quantity: number;
  unit: string;
  value: number;
  linkedSaleId?: string;
  documentUrl?: string;
}

export const defaultNfeConfig: NfeConfig = {
  emitterType: "pf",
  cnpjCpf: "000.000.000-00",
  razaoSocial: "José Carlos da Silva",
  ie: "123456789",
  im: "",
  address: "Fazenda Boa Vista, Rod. MG-050 Km 32",
  municipality: "Uberaba",
  state: "MG",
  taxRegime: "real",
  cnae: "0151-2/01",
  series: 1,
  nextNumber: 101,
  environment: "homologacao",
  apiProvider: "focus",
  apiUrl: "",
  apiToken: "",
  certificateUploaded: false,
};

export const natureOptions = ["Venda", "Remessa", "Devolução", "Transferência", "Doação"];
export const purposeLabels: Record<string, string> = {
  normal: "Normal", complementar: "Complementar", ajuste: "Ajuste", devolucao: "Devolução",
};
export const statusLabels: Record<string, string> = {
  autorizada: "Autorizada", cancelada: "Cancelada", denegada: "Denegada",
  contingencia: "Em Contingência", rascunho: "Rascunho",
};
export const statusColors: Record<string, string> = {
  autorizada: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  cancelada: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  denegada: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  contingencia: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  rascunho: "bg-muted text-muted-foreground border-border",
};
export const taxRegimeLabels: Record<string, string> = {
  simples: "Simples Nacional", presumido: "Lucro Presumido", real: "Lucro Real", mei: "MEI",
};
export const apiProviderLabels: Record<string, string> = {
  focus: "Focus NF-e", enotas: "eNotas", nuvemfiscal: "Nuvem Fiscal", outro: "Outro",
};

// NCMs comuns por tipo de produto
export const commonNcms = [
  { code: "0102.29.90", desc: "Bovinos vivos — outros" },
  { code: "0101.21.00", desc: "Cavalos reprodutores de raça pura" },
  { code: "0104.10.11", desc: "Ovinos reprodutores de raça pura" },
  { code: "0106.19.00", desc: "Outros mamíferos vivos" },
  { code: "0401.10.10", desc: "Leite UHT" },
  { code: "0401.20.10", desc: "Leite pasteurizado" },
  { code: "1005.90.10", desc: "Milho em grão" },
  { code: "1201.90.00", desc: "Soja em grão" },
  { code: "0901.11.10", desc: "Café em grão" },
];

export const mockNfes: NfeDocument[] = [
  {
    id: "nfe-s1", number: 97, series: 1,
    accessKey: "31260312345678000195550010000000971234567890",
    emissionDate: "2026-03-08", exitDate: "2026-03-08",
    nature: "Venda", purpose: "normal",
    recipientCnpjCpf: "11.222.333/0001-44", recipientName: "Frigorífico ABC Ltda",
    recipientIe: "987654321", recipientAddress: "Rod. SP-322 Km 15",
    recipientCity: "Ribeirão Preto", recipientState: "SP",
    ieIndicator: "contribuinte", finalConsumer: false,
    items: [
      { id: "i1", code: "BOV-001", description: "Bovino Nelore Macho — Lote 142", ncm: "0102.29.90", cfop: "6.101", unit: "CAB", quantity: 15, unitPrice: 3000, totalPrice: 45000, icmsCst: "00", icmsRate: 12, pisCst: "01", cofinsCst: "01", ipiRate: 0 },
    ],
    subtotal: 45000, freight: 0, discount: 0, total: 45000,
    freightMode: "fob", carrierName: "Trans Rural Ltda", vehiclePlate: "DEF-5678",
    volumes: 1, grossWeight: 10200, netWeight: 10200,
    paymentMode: "avista", installments: [],
    status: "autorizada", additionalInfo: "", fiscalInfo: "Funrural retido conforme Lei 13.606/2018",
    linkedSaleId: "txn-1",
  },
  {
    id: "nfe-s2", number: 96, series: 1,
    accessKey: "31260212345678000195550010000000961234567891",
    emissionDate: "2026-02-25", exitDate: "2026-02-25",
    nature: "Venda", purpose: "normal",
    recipientCnpjCpf: "55.666.777/0001-88", recipientName: "Leilão Rural Ltda",
    recipientIe: "456789123", recipientAddress: "Av. Brasil, 500",
    recipientCity: "Uberlândia", recipientState: "MG",
    ieIndicator: "contribuinte", finalConsumer: false,
    items: [
      { id: "i2", code: "BOV-002", description: "Bovino Nelore Macho — Novilhos leilão", ncm: "0102.29.90", cfop: "5.101", unit: "CAB", quantity: 8, unitPrice: 4000, totalPrice: 32000, icmsCst: "00", icmsRate: 7, pisCst: "01", cofinsCst: "01", ipiRate: 0 },
    ],
    subtotal: 32000, freight: 1200, discount: 0, total: 33200,
    freightMode: "cif", carrierName: "Transporte Minas Gerais", vehiclePlate: "XYZ-9876",
    volumes: 1, grossWeight: 5440, netWeight: 5440,
    paymentMode: "aprazo",
    installments: [
      { number: 1, dueDate: "2026-03-25", amount: 16600 },
      { number: 2, dueDate: "2026-04-25", amount: 16600 },
    ],
    status: "autorizada", additionalInfo: "", fiscalInfo: "",
    linkedSaleId: "txn-9",
  },
  {
    id: "nfe-s3", number: 95, series: 1,
    accessKey: "31260212345678000195550010000000951234567892",
    emissionDate: "2026-02-05", exitDate: "2026-02-05",
    nature: "Venda", purpose: "normal",
    recipientCnpjCpf: "33.444.555/0001-66", recipientName: "Frigorífico Central S/A",
    recipientIe: "321654987", recipientAddress: "Distrito Industrial, Lote 42",
    recipientCity: "Uberaba", recipientState: "MG",
    ieIndicator: "contribuinte", finalConsumer: false,
    items: [
      { id: "i3", code: "BOV-003", description: "Bovino — Vacas de descarte", ncm: "0102.29.90", cfop: "5.101", unit: "CAB", quantity: 5, unitPrice: 3600, totalPrice: 18000, icmsCst: "00", icmsRate: 7, pisCst: "01", cofinsCst: "01", ipiRate: 0 },
    ],
    subtotal: 18000, freight: 800, discount: 0, total: 18800,
    freightMode: "cif", carrierName: "Trans Rural Ltda", vehiclePlate: "DEF-5678",
    volumes: 1, grossWeight: 2450, netWeight: 2450,
    paymentMode: "avista", installments: [],
    status: "autorizada", additionalInfo: "", fiscalInfo: "",
    linkedSaleId: "txn-15",
  },
  {
    id: "nfe-s4", number: 94, series: 1,
    accessKey: "31260112345678000195550010000000941234567893",
    emissionDate: "2026-01-15", exitDate: "2026-01-15",
    nature: "Venda", purpose: "normal",
    recipientCnpjCpf: "77.888.999/0001-00", recipientName: "Fazenda Esperança Ltda",
    recipientIe: "159753456", recipientAddress: "Estrada Municipal, s/n",
    recipientCity: "Araguari", recipientState: "MG",
    ieIndicator: "contribuinte", finalConsumer: false,
    items: [
      { id: "i4", code: "BOV-004", description: "Bovino Nelore — Bezerros desmamados", ncm: "0102.29.90", cfop: "5.101", unit: "CAB", quantity: 20, unitPrice: 2600, totalPrice: 52000, icmsCst: "00", icmsRate: 7, pisCst: "01", cofinsCst: "01", ipiRate: 0 },
    ],
    subtotal: 52000, freight: 0, discount: 0, total: 52000,
    freightMode: "fob", carrierName: "Boiadeiro Transportes", vehiclePlate: "JKL-3456",
    volumes: 1, grossWeight: 4600, netWeight: 4600,
    paymentMode: "aprazo",
    installments: [
      { number: 1, dueDate: "2026-02-15", amount: 26000 },
      { number: 2, dueDate: "2026-03-15", amount: 26000 },
    ],
    status: "autorizada", additionalInfo: "", fiscalInfo: "",
    linkedSaleId: "txn-20",
  },
  {
    id: "nfe-s5", number: 93, series: 1,
    accessKey: "31251212345678000195550010000000931234567894",
    emissionDate: "2025-12-20", exitDate: "2025-12-20",
    nature: "Venda", purpose: "normal",
    recipientCnpjCpf: "11.222.333/0001-44", recipientName: "Frigorífico ABC Ltda",
    recipientIe: "987654321", recipientAddress: "Rod. SP-322 Km 15",
    recipientCity: "Ribeirão Preto", recipientState: "SP",
    ieIndicator: "contribuinte", finalConsumer: false,
    items: [
      { id: "i5", code: "BOV-005", description: "Bovino Angus — Novilhos terminados", ncm: "0102.29.90", cfop: "6.101", unit: "CAB", quantity: 12, unitPrice: 3800, totalPrice: 45600, icmsCst: "00", icmsRate: 12, pisCst: "01", cofinsCst: "01", ipiRate: 0 },
    ],
    subtotal: 45600, freight: 1500, discount: 600, total: 46500,
    freightMode: "cif", carrierName: "Trans Rural Ltda", vehiclePlate: "DEF-5678",
    volumes: 1, grossWeight: 8160, netWeight: 8160,
    paymentMode: "avista", installments: [],
    status: "cancelada", cancelReason: "Erro na identificação do lote — NF-e reemitida com dados corretos",
    additionalInfo: "", fiscalInfo: "",
  },
];

export const mockProducerNotes: ProducerNote[] = [
  { id: "pn-1", number: "2026/001", date: "2026-03-05", recipientName: "Laticínio São José", product: "Leite in natura", quantity: 4200, unit: "LT", value: 8200, linkedSaleId: "txn-3" },
  { id: "pn-2", number: "2026/002", date: "2026-02-18", recipientName: "Laticínio São José", product: "Leite in natura", quantity: 3900, unit: "LT", value: 7800 },
  { id: "pn-3", number: "2026/003", date: "2026-01-28", recipientName: "Laticínio São José", product: "Leite in natura", quantity: 3750, unit: "LT", value: 7500 },
  { id: "pn-4", number: "2025/012", date: "2025-12-15", recipientName: "Fazenda Vizinha", product: "Arrendamento de pasto", quantity: 1, unit: "MÊS", value: 3000 },
];
