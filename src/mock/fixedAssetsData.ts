export interface FixedAsset {
  id: string;
  name: string;
  category: string;
  acquisitionValue: number;
  purchaseDate: string;
  usefulLifeMonths: number;
  monthlyDepreciation: number;
  currentValue: number;
  location: string;
  status: "active" | "fully_depreciated" | "disposed" | "maintenance";
  tag?: string;
}

export const fixedAssets: FixedAsset[] = [
  { id: "1", name: "MacBook Pro 16\" #001", category: "TI/Equipamentos", acquisitionValue: 18900, purchaseDate: "Jan/24", usefulLifeMonths: 36, monthlyDepreciation: 525, currentValue: 14700, location: "Escritório SP", status: "active", tag: "TI-001" },
  { id: "2", name: "MacBook Pro 16\" #002", category: "TI/Equipamentos", acquisitionValue: 18900, purchaseDate: "Jan/24", usefulLifeMonths: 36, monthlyDepreciation: 525, currentValue: 14700, location: "Home Office", status: "active", tag: "TI-002" },
  { id: "3", name: "iPhone 15 Pro #001", category: "TI/Celular", acquisitionValue: 8200, purchaseDate: "Mar/24", usefulLifeMonths: 24, monthlyDepreciation: 342, currentValue: 5464, location: "SP", status: "active", tag: "TI-003" },
  { id: "4", name: "Servidor Dell R740", category: "TI/Servidor", acquisitionValue: 84000, purchaseDate: "Jun/23", usefulLifeMonths: 60, monthlyDepreciation: 1400, currentValue: 54600, location: "Data Center", status: "active", tag: "TI-004" },
  { id: "5", name: "Software Adobe CC", category: "Intangível", acquisitionValue: 12400, purchaseDate: "Jan/25", usefulLifeMonths: 24, monthlyDepreciation: 517, currentValue: 11366, location: "Digital", status: "active", tag: "SW-001" },
  { id: "6", name: "Mesa/cadeiras sala conf.", category: "Móveis", acquisitionValue: 28400, purchaseDate: "Mar/22", usefulLifeMonths: 120, monthlyDepreciation: 237, currentValue: 20390, location: "Escritório", status: "active", tag: "MOB-001" },
  { id: "7", name: "Honda Civic placa ABC", category: "Veículo", acquisitionValue: 128000, purchaseDate: "Set/23", usefulLifeMonths: 60, monthlyDepreciation: 2133, currentValue: 97000, location: "Comercial", status: "active", tag: "VEI-001" },
  { id: "8", name: "Ar condicionado Daikin 36k", category: "Instalações", acquisitionValue: 14800, purchaseDate: "Jun/22", usefulLifeMonths: 120, monthlyDepreciation: 123, currentValue: 10738, location: "Escritório SP", status: "active", tag: "INS-001" },
  { id: "9", name: "Monitor Dell 27\" #001", category: "TI/Equipamentos", acquisitionValue: 3200, purchaseDate: "Jan/23", usefulLifeMonths: 36, monthlyDepreciation: 89, currentValue: 822, location: "Escritório SP", status: "active", tag: "TI-005" },
  { id: "10", name: "Monitor Dell 27\" #002", category: "TI/Equipamentos", acquisitionValue: 3200, purchaseDate: "Jan/23", usefulLifeMonths: 36, monthlyDepreciation: 89, currentValue: 822, location: "Escritório SP", status: "active", tag: "TI-006" },
  { id: "11", name: "Impressora HP LaserJet Pro", category: "TI/Equipamentos", acquisitionValue: 4800, purchaseDate: "Mar/21", usefulLifeMonths: 36, monthlyDepreciation: 0, currentValue: 0, location: "Escritório SP", status: "fully_depreciated", tag: "TI-007" },
  { id: "12", name: "Notebook Lenovo ThinkPad", category: "TI/Equipamentos", acquisitionValue: 8900, purchaseDate: "Jun/21", usefulLifeMonths: 36, monthlyDepreciation: 0, currentValue: 0, location: "Estoque", status: "fully_depreciated", tag: "TI-008" },
  { id: "13", name: "Câmera Canon EOS R5", category: "TI/Equipamentos", acquisitionValue: 22000, purchaseDate: "Set/22", usefulLifeMonths: 48, monthlyDepreciation: 458, currentValue: 8250, location: "Marketing", status: "active", tag: "TI-009" },
  { id: "14", name: "Sofá recepção + mesas", category: "Móveis", acquisitionValue: 18500, purchaseDate: "Jan/22", usefulLifeMonths: 120, monthlyDepreciation: 154, currentValue: 12646, location: "Recepção", status: "active", tag: "MOB-002" },
  { id: "15", name: "Fiat Fiorino placa DEF", category: "Veículo", acquisitionValue: 72000, purchaseDate: "Mar/22", usefulLifeMonths: 60, monthlyDepreciation: 1200, currentValue: 28800, location: "Logística", status: "active", tag: "VEI-002" },
  { id: "16", name: "Firewall Fortinet 200F", category: "TI/Rede", acquisitionValue: 38000, purchaseDate: "Jun/23", usefulLifeMonths: 60, monthlyDepreciation: 633, currentValue: 24700, location: "Data Center", status: "active", tag: "TI-010" },
  { id: "17", name: "Switch Cisco Catalyst", category: "TI/Rede", acquisitionValue: 15600, purchaseDate: "Jun/23", usefulLifeMonths: 60, monthlyDepreciation: 260, currentValue: 10140, location: "Data Center", status: "active", tag: "TI-011" },
  { id: "18", name: "Projetor Epson EB-992F", category: "TI/Equipamentos", acquisitionValue: 6800, purchaseDate: "Mar/20", usefulLifeMonths: 48, monthlyDepreciation: 0, currentValue: 0, location: "Sala treinamento", status: "fully_depreciated", tag: "TI-012" },
  { id: "19", name: "Estação de trabalho Dell Precision", category: "TI/Equipamentos", acquisitionValue: 28000, purchaseDate: "Sep/23", usefulLifeMonths: 48, monthlyDepreciation: 583, currentValue: 17500, location: "Engenharia", status: "active", tag: "TI-013" },
  { id: "20", name: "Licença perpétua AutoCAD", category: "Intangível", acquisitionValue: 45000, purchaseDate: "Jan/22", usefulLifeMonths: 60, monthlyDepreciation: 750, currentValue: 16500, location: "Digital", status: "active", tag: "SW-002" },
];

export const assetKpis = {
  grossTotal: 8420000,
  accumulatedDepreciation: 2310000,
  netTotal: 6110000,
  monthlyDepreciation: 85000,
  fullyDepreciated: 8,
};

export const depreciationByCategory = [
  { category: "TI/Equipamentos", gross: 2840000, depreciation: 980000, net: 1860000, monthlyDep: 32400 },
  { category: "TI/Servidor", gross: 1200000, depreciation: 420000, net: 780000, monthlyDep: 14000 },
  { category: "TI/Rede", gross: 540000, depreciation: 180000, net: 360000, monthlyDep: 8930 },
  { category: "Intangível", gross: 4800000, depreciation: 900000, net: 3900000, monthlyDep: 12670 },
  { category: "Móveis", gross: 480000, depreciation: 145000, net: 335000, monthlyDep: 3910 },
  { category: "Veículos", gross: 680000, depreciation: 312000, net: 368000, monthlyDep: 8330 },
  { category: "Instalações", gross: 280000, depreciation: 73000, net: 207000, monthlyDep: 4760 },
];
