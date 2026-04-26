/* ── MDF-e Mock Data & Types ── */

export interface MdfeRecord {
  id: string;
  number: string;
  series: string;
  accessKey: string;
  emissionDate: string;
  ufStart: string;
  ufEnd: string;
  modal: "rodoviario" | "ferroviario" | "aquaviario" | "aereo";
  // Emitente
  emitterCnpj: string;
  emitterName: string;
  emitterIe: string;
  // Transportadora
  carrierCnpj: string;
  carrierName: string;
  carrierRntrc: string;
  // Veículo
  vehiclePlate: string;
  vehicleUf: string;
  vehicleRntrc: string;
  vehicleAssetId?: string; // link to maquinas-mock
  // Motorista
  driverCpf: string;
  driverName: string;
  // Carga
  productName: string;
  ncm: string;
  unit: string;
  quantity: number;
  grossWeight: number;
  netWeight: number;
  declaredValue: number;
  // NF-es vinculadas
  linkedNfeKeys: string[];
  // Vinculação interna
  linkedSaleId?: string;
  linkedSaleDescription?: string;
  transportStatus: "registrado" | "vinculado" | "em_transito" | "entregue";
  // Animais (se venda de animais)
  animalEarTags?: string[];
}

export const modalLabels: Record<string, string> = {
  rodoviario: "Rodoviário",
  ferroviario: "Ferroviário",
  aquaviario: "Aquaviário",
  aereo: "Aéreo",
};

export const transportStatusLabels: Record<string, string> = {
  registrado: "Registrado",
  vinculado: "Vinculado à Venda",
  em_transito: "Em Trânsito",
  entregue: "Entregue",
};

export const transportStatusColors: Record<string, string> = {
  registrado: "bg-muted text-muted-foreground border-border",
  vinculado: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  em_transito: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  entregue: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
};

export const mockMdfes: MdfeRecord[] = [
  {
    id: "mdfe-1", number: "000001", series: "1", accessKey: "31260112345678000195580010000000011234567890",
    emissionDate: "2026-03-08T10:30:00", ufStart: "MG", ufEnd: "SP", modal: "rodoviario",
    emitterCnpj: "12.345.678/0001-95", emitterName: "Fazenda Boa Vista Ltda", emitterIe: "123456789",
    carrierCnpj: "98.765.432/0001-10", carrierName: "Trans Rural Ltda", carrierRntrc: "00012345",
    vehiclePlate: "DEF-5678", vehicleUf: "MG", vehicleRntrc: "00012345", vehicleAssetId: "a2",
    driverCpf: "000.000.001-00", driverName: "Antônio Carlos Pereira",
    productName: "Bovinos vivos para abate", ncm: "01029090", unit: "CAB", quantity: 15,
    grossWeight: 10200, netWeight: 10200, declaredValue: 45000,
    linkedNfeKeys: ["35260312345678000195550010000001261123456782"],
    linkedSaleId: "txn-1", linkedSaleDescription: "Venda de 15 bezerros",
    transportStatus: "entregue",
    animalEarTags: ["BR001", "BR003", "BR005", "BR007", "BR009", "BR011", "BR013", "BR015", "BR017", "BR019", "BR021", "BR023", "BR025", "BR027", "BR029"],
  },
  {
    id: "mdfe-2", number: "000002", series: "1", accessKey: "31260212345678000195580010000000021234567891",
    emissionDate: "2026-02-25T08:15:00", ufStart: "MG", ufEnd: "MG", modal: "rodoviario",
    emitterCnpj: "12.345.678/0001-95", emitterName: "Fazenda Boa Vista Ltda", emitterIe: "123456789",
    carrierCnpj: "11.222.333/0001-44", carrierName: "Transporte Minas Gerais", carrierRntrc: "00098765",
    vehiclePlate: "XYZ-9876", vehicleUf: "MG", vehicleRntrc: "00098765",
    driverCpf: "000.000.002-00", driverName: "Carlos Eduardo Santos",
    productName: "Bovinos vivos — novilhos", ncm: "01029090", unit: "CAB", quantity: 8,
    grossWeight: 5440, netWeight: 5440, declaredValue: 32000,
    linkedNfeKeys: ["35260212345678000195550010000001251123456781"],
    linkedSaleId: "txn-9", linkedSaleDescription: "Venda de 8 novilhos — leilão",
    transportStatus: "entregue",
    animalEarTags: ["BR002", "BR004", "BR006", "BR008", "BR010", "BR012", "BR014", "BR016"],
  },
  {
    id: "mdfe-3", number: "000003", series: "1", accessKey: "31260212345678000195580010000000031234567892",
    emissionDate: "2026-02-05T14:00:00", ufStart: "MG", ufEnd: "SP", modal: "rodoviario",
    emitterCnpj: "12.345.678/0001-95", emitterName: "Fazenda Boa Vista Ltda", emitterIe: "123456789",
    carrierCnpj: "98.765.432/0001-10", carrierName: "Trans Rural Ltda", carrierRntrc: "00012345",
    vehiclePlate: "DEF-5678", vehicleUf: "MG", vehicleRntrc: "00012345", vehicleAssetId: "a2",
    driverCpf: "000.000.001-00", driverName: "Antônio Carlos Pereira",
    productName: "Bovinos vivos — vacas de descarte", ncm: "01029090", unit: "CAB", quantity: 5,
    grossWeight: 2450, netWeight: 2450, declaredValue: 18000,
    linkedNfeKeys: ["35260212345678000195550010000001241123456780"],
    linkedSaleId: undefined, linkedSaleDescription: undefined,
    transportStatus: "registrado",
  },
  {
    id: "mdfe-4", number: "000004", series: "1", accessKey: "31260112345678000195580010000000041234567893",
    emissionDate: "2026-01-15T07:45:00", ufStart: "MG", ufEnd: "GO", modal: "rodoviario",
    emitterCnpj: "12.345.678/0001-95", emitterName: "Fazenda Boa Vista Ltda", emitterIe: "123456789",
    carrierCnpj: "22.333.444/0001-55", carrierName: "Boiadeiro Transportes", carrierRntrc: "00054321",
    vehiclePlate: "JKL-3456", vehicleUf: "GO", vehicleRntrc: "00054321",
    driverCpf: "000.000.003-00", driverName: "José Ribeiro da Silva",
    productName: "Bovinos vivos — bezerros desmamados", ncm: "01029090", unit: "CAB", quantity: 20,
    grossWeight: 4600, netWeight: 4600, declaredValue: 52000,
    linkedNfeKeys: ["35260112345678000195550010000001231123456789"],
    linkedSaleId: "txn-20", linkedSaleDescription: "Venda de 20 bezerros desmamados",
    transportStatus: "vinculado",
    animalEarTags: ["BR031", "BR032", "BR033", "BR034", "BR035", "BR036", "BR037", "BR038", "BR039", "BR040", "BR041", "BR042", "BR043", "BR044", "BR045", "BR046", "BR047", "BR048", "BR049", "BR050"],
  },
  {
    id: "mdfe-5", number: "000005", series: "1", accessKey: "31260312345678000195580010000000051234567894",
    emissionDate: "2026-03-06T11:20:00", ufStart: "MG", ufEnd: "RJ", modal: "rodoviario",
    emitterCnpj: "12.345.678/0001-95", emitterName: "Fazenda Boa Vista Ltda", emitterIe: "123456789",
    carrierCnpj: "98.765.432/0001-10", carrierName: "Trans Rural Ltda", carrierRntrc: "00012345",
    vehiclePlate: "DEF-5678", vehicleUf: "MG", vehicleRntrc: "00012345", vehicleAssetId: "a2",
    driverCpf: "000.000.001-00", driverName: "Antônio Carlos Pereira",
    productName: "Leite in natura", ncm: "04012010", unit: "LT", quantity: 8000,
    grossWeight: 8240, netWeight: 8000, declaredValue: 8200,
    linkedNfeKeys: [],
    transportStatus: "em_transito",
  },
];

// Alerts
export interface MdfeAlert {
  type: "warning" | "error" | "info";
  message: string;
  mdfeId?: string;
  saleId?: string;
}

export function getMdfeAlerts(mdfes: MdfeRecord[]): MdfeAlert[] {
  const alerts: MdfeAlert[] = [];
  const today = new Date();

  // Sales without MDF-e (mock - would come from transactions)
  alerts.push({
    type: "warning",
    message: "Venda 'Venda de 5 vacas de descarte' (05/02) sem MDF-e vinculado há mais de 7 dias",
    saleId: "txn-15",
  });

  // MDF-e with unlinked NF-e
  for (const mdfe of mdfes) {
    if (mdfe.transportStatus === "registrado" && !mdfe.linkedSaleId) {
      alerts.push({
        type: "info",
        message: `MDF-e ${mdfe.number} registrado sem vinculação a venda do sistema`,
        mdfeId: mdfe.id,
      });
    }
  }

  return alerts;
}
