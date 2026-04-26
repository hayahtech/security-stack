// ===== Multi-CNPJ Mock Data =====

export interface GroupCompany {
  id: string;
  name: string;
  cnpj: string;
  type: 'cd_central' | 'filial_varejo' | 'holding' | 'transportadora';
  city: string;
  ownStock: number;
  custodiedStock: number;
  consignedStock: number;
  ownSKUs: number;
  thirdPartySKUs: number;
  pendingPOs: number;
  pendingFromCD: number;
}

export interface StockOwnership {
  id: string;
  skuId: string;
  skuName: string;
  totalQty: number;
  ownQty: number;
  custodiedQty: number;
  consignedQty: number;
  inTransitQty: number;
  ownerId: string;
  ownerName: string;
  custodyId: string;
  custodyName: string;
  unitCost: number;
  fiscalStatus: 'REGULAR' | 'PENDENTE' | 'DIVERGENTE';
}

export type TransferType = 'TRANSFERENCIA_PROPRIEDADE' | 'REMESSA_DEPOSITO' | 'CONSIGNACAO' | 'COMODATO' | 'DEVOLUCAO';
export type TransferStatus = 'SOLICITADO' | 'APROVADO' | 'NF_EMITIDA' | 'EM_TRANSITO' | 'RECEBIDO' | 'CONCLUIDO';

export interface IntercompanyTransfer {
  id: string;
  number: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  type: TransferType;
  status: TransferStatus;
  skuCount: number;
  totalValue: number;
  nfNumber?: string;
  nfKey?: string;
  cfop: string;
  markup: number;
  requestedAt: Date;
  deadline: Date;
  completedAt?: Date;
}

export type ConsignmentStatus = 'ATIVA' | 'EM_ACERTO' | 'ENCERRADA';

export interface Consignment {
  id: string;
  consignorId: string;
  consignorName: string;
  consignorExternal: boolean;
  consigneeId: string;
  consigneeName: string;
  skuCount: number;
  totalValue: number;
  soldValue: number;
  returnDue: Date;
  daysOpen: number;
  status: ConsignmentStatus;
  items: ConsignmentItem[];
}

export interface ConsignmentItem {
  skuId: string;
  skuName: string;
  sentQty: number;
  soldQty: number;
  returnQty: number;
  unitPrice: number;
  status: 'VENDIDO' | 'A_DEVOLVER' | 'AVARIADO' | 'PENDENTE';
}

export type ComodatoStatus = 'ATIVO' | 'VENCIDO' | 'DEVOLVIDO';

export interface ComodatoItem {
  id: string;
  item: string;
  description: string;
  ownerId: string;
  ownerName: string;
  holderId: string;
  holderName: string;
  exitDate: Date;
  returnDue: Date;
  condition: string;
  assetValue: number;
  status: ComodatoStatus;
  responsible: string;
}

export interface IntercompanyBalance {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  balance: number;
}

export type FiscalNFStatus = 'ESCRITURADO' | 'PENDENTE' | 'DIVERGENTE';

export interface FiscalObligation {
  id: string;
  nfNumber: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  value: number;
  cfop: string;
  issuedAt: Date;
  senderStatus: FiscalNFStatus;
  receiverStatus: FiscalNFStatus;
  nature: string;
}

// ===== Data =====

export const companies: GroupCompany[] = [
  {
    id: 'cnpj-a', name: 'Atacadão Distribuição SP', cnpj: '12.345.678/0001-90',
    type: 'cd_central', city: 'Guarulhos',
    ownStock: 4200000, custodiedStock: 1800000, consignedStock: 620000,
    ownSKUs: 1240, thirdPartySKUs: 380, pendingPOs: 5, pendingFromCD: 0,
  },
  {
    id: 'cnpj-b', name: 'Fort Atacadista Loja SP-01', cnpj: '98.765.432/0001-11',
    type: 'filial_varejo', city: 'São Paulo',
    ownStock: 890000, custodiedStock: 0, consignedStock: 120000,
    ownSKUs: 620, thirdPartySKUs: 85, pendingPOs: 3, pendingFromCD: 245000,
  },
  {
    id: 'cnpj-c', name: 'Fort Atacadista Loja SP-02', cnpj: '11.222.333/0001-44',
    type: 'filial_varejo', city: 'Campinas',
    ownStock: 740000, custodiedStock: 0, consignedStock: 95000,
    ownSKUs: 510, thirdPartySKUs: 62, pendingPOs: 2, pendingFromCD: 180000,
  },
  {
    id: 'cnpj-d', name: 'Fort Imóveis e Logística', cnpj: '55.666.777/0001-88',
    type: 'holding', city: 'São Paulo',
    ownStock: 0, custodiedStock: 0, consignedStock: 0,
    ownSKUs: 0, thirdPartySKUs: 0, pendingPOs: 0, pendingFromCD: 0,
  },
];

export const stockOwnership: StockOwnership[] = [
  { id: 'so-1', skuId: 'SKU-001', skuName: 'Arroz Tipo 1 5kg', totalQty: 2400, ownQty: 1800, custodiedQty: 400, consignedQty: 200, inTransitQty: 0, ownerId: 'cnpj-a', ownerName: 'Atacadão SP', custodyId: 'cnpj-a', custodyName: 'Atacadão SP', unitCost: 18.50, fiscalStatus: 'REGULAR' },
  { id: 'so-2', skuId: 'SKU-002', skuName: 'Feijão Preto 1kg', totalQty: 1800, ownQty: 1200, custodiedQty: 600, consignedQty: 0, inTransitQty: 0, ownerId: 'cnpj-a', ownerName: 'Atacadão SP', custodyId: 'cnpj-b', custodyName: 'Fort SP-01', unitCost: 7.90, fiscalStatus: 'REGULAR' },
  { id: 'so-3', skuId: 'SKU-003', skuName: 'Óleo de Soja 900ml', totalQty: 3200, ownQty: 2000, custodiedQty: 800, consignedQty: 400, inTransitQty: 120, ownerId: 'cnpj-a', ownerName: 'Atacadão SP', custodyId: 'cnpj-a', custodyName: 'Atacadão SP', unitCost: 6.40, fiscalStatus: 'PENDENTE' },
  { id: 'so-4', skuId: 'SKU-004', skuName: 'Açúcar Cristal 5kg', totalQty: 1500, ownQty: 900, custodiedQty: 0, consignedQty: 600, inTransitQty: 0, ownerId: 'cnpj-b', ownerName: 'Fort SP-01', custodyId: 'cnpj-b', custodyName: 'Fort SP-01', unitCost: 14.20, fiscalStatus: 'REGULAR' },
  { id: 'so-5', skuId: 'SKU-005', skuName: 'Farinha de Trigo 1kg', totalQty: 2100, ownQty: 1400, custodiedQty: 700, consignedQty: 0, inTransitQty: 200, ownerId: 'cnpj-a', ownerName: 'Atacadão SP', custodyId: 'cnpj-c', custodyName: 'Fort SP-02', unitCost: 4.80, fiscalStatus: 'DIVERGENTE' },
  { id: 'so-6', skuId: 'SKU-006', skuName: 'Leite UHT Integral 1L', totalQty: 5000, ownQty: 3000, custodiedQty: 1200, consignedQty: 800, inTransitQty: 0, ownerId: 'cnpj-a', ownerName: 'Atacadão SP', custodyId: 'cnpj-a', custodyName: 'Atacadão SP', unitCost: 4.50, fiscalStatus: 'REGULAR' },
  { id: 'so-7', skuId: 'SKU-007', skuName: 'Café Torrado 500g', totalQty: 1600, ownQty: 800, custodiedQty: 500, consignedQty: 300, inTransitQty: 0, ownerId: 'cnpj-b', ownerName: 'Fort SP-01', custodyId: 'cnpj-a', custodyName: 'Atacadão SP', unitCost: 12.90, fiscalStatus: 'REGULAR' },
  { id: 'so-8', skuId: 'SKU-008', skuName: 'Macarrão Espaguete 500g', totalQty: 2800, ownQty: 2000, custodiedQty: 500, consignedQty: 300, inTransitQty: 0, ownerId: 'cnpj-c', ownerName: 'Fort SP-02', custodyId: 'cnpj-a', custodyName: 'Atacadão SP', unitCost: 3.20, fiscalStatus: 'PENDENTE' },
  { id: 'so-9', skuId: 'SKU-009', skuName: 'Sabão em Pó 1kg', totalQty: 1900, ownQty: 1200, custodiedQty: 400, consignedQty: 300, inTransitQty: 0, ownerId: 'cnpj-a', ownerName: 'Atacadão SP', custodyId: 'cnpj-b', custodyName: 'Fort SP-01', unitCost: 8.70, fiscalStatus: 'REGULAR' },
  { id: 'so-10', skuId: 'SKU-010', skuName: 'Papel Higiênico 12un', totalQty: 3500, ownQty: 2500, custodiedQty: 600, consignedQty: 400, inTransitQty: 0, ownerId: 'cnpj-a', ownerName: 'Atacadão SP', custodyId: 'cnpj-c', custodyName: 'Fort SP-02', unitCost: 15.60, fiscalStatus: 'REGULAR' },
];

const d = (offset: number) => { const dt = new Date(); dt.setDate(dt.getDate() + offset); return dt; };

export const intercompanyTransfers: IntercompanyTransfer[] = [
  { id: 'tr-1', number: 'TRANSF-2024-0230', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-b', toName: 'Fort SP-01', type: 'TRANSFERENCIA_PROPRIEDADE', status: 'CONCLUIDO', skuCount: 8, totalValue: 32400, nfNumber: '000.230', nfKey: '35240112345678000190550010000023001', cfop: '5.152', markup: 4.5, requestedAt: d(-15), deadline: d(-12), completedAt: d(-13) },
  { id: 'tr-2', number: 'TRANSF-2024-0231', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-c', toName: 'Fort SP-02', type: 'TRANSFERENCIA_PROPRIEDADE', status: 'CONCLUIDO', skuCount: 5, totalValue: 18700, nfNumber: '000.231', nfKey: '35240112345678000190550010000023101', cfop: '5.152', markup: 4.0, requestedAt: d(-12), deadline: d(-9), completedAt: d(-10) },
  { id: 'tr-3', number: 'TRANSF-2024-0232', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-b', toName: 'Fort SP-01', type: 'REMESSA_DEPOSITO', status: 'RECEBIDO', skuCount: 3, totalValue: 12500, nfNumber: '000.232', cfop: '5.949', markup: 0, requestedAt: d(-8), deadline: d(-5) },
  { id: 'tr-4', number: 'TRANSF-2024-0233', fromId: 'cnpj-b', fromName: 'Fort SP-01', toId: 'cnpj-a', toName: 'Atacadão SP', type: 'DEVOLUCAO', status: 'EM_TRANSITO', skuCount: 2, totalValue: 4200, nfNumber: '000.233', cfop: '5.152', markup: 0, requestedAt: d(-5), deadline: d(-2) },
  { id: 'tr-5', number: 'TRANSF-2024-0234', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-b', toName: 'Fort SP-01', type: 'TRANSFERENCIA_PROPRIEDADE', status: 'NF_EMITIDA', skuCount: 12, totalValue: 48200, nfNumber: '000.234', nfKey: '35240112345678000190550010000023401', cfop: '5.152', markup: 5.0, requestedAt: d(-3), deadline: d(1) },
  { id: 'tr-6', number: 'TRANSF-2024-0235', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-c', toName: 'Fort SP-02', type: 'CONSIGNACAO', status: 'APROVADO', skuCount: 7, totalValue: 22800, cfop: '5.919', markup: 0, requestedAt: d(-2), deadline: d(3) },
  { id: 'tr-7', number: 'TRANSF-2024-0236', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-b', toName: 'Fort SP-01', type: 'TRANSFERENCIA_PROPRIEDADE', status: 'APROVADO', skuCount: 4, totalValue: 15600, cfop: '5.152', markup: 3.5, requestedAt: d(-1), deadline: d(4) },
  { id: 'tr-8', number: 'TRANSF-2024-0237', fromId: 'cnpj-c', fromName: 'Fort SP-02', toId: 'cnpj-a', toName: 'Atacadão SP', type: 'DEVOLUCAO', status: 'SOLICITADO', skuCount: 3, totalValue: 8900, cfop: '5.152', markup: 0, requestedAt: d(0), deadline: d(5) },
  { id: 'tr-9', number: 'TRANSF-2024-0238', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-d', toName: 'Fort Imóveis', type: 'COMODATO', status: 'SOLICITADO', skuCount: 1, totalValue: 85000, cfop: '5.908', markup: 0, requestedAt: d(0), deadline: d(7) },
  { id: 'tr-10', number: 'TRANSF-2024-0239', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-b', toName: 'Fort SP-01', type: 'REMESSA_DEPOSITO', status: 'EM_TRANSITO', skuCount: 6, totalValue: 27300, nfNumber: '000.239', cfop: '5.949', markup: 0, requestedAt: d(-4), deadline: d(0) },
  { id: 'tr-11', number: 'TRANSF-2024-0240', fromId: 'cnpj-b', fromName: 'Fort SP-01', toId: 'cnpj-c', toName: 'Fort SP-02', type: 'TRANSFERENCIA_PROPRIEDADE', status: 'CONCLUIDO', skuCount: 3, totalValue: 9800, nfNumber: '000.240', cfop: '5.152', markup: 3.0, requestedAt: d(-20), deadline: d(-17), completedAt: d(-18) },
  { id: 'tr-12', number: 'TRANSF-2024-0241', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-c', toName: 'Fort SP-02', type: 'TRANSFERENCIA_PROPRIEDADE', status: 'CONCLUIDO', skuCount: 10, totalValue: 56200, nfNumber: '000.241', cfop: '5.152', markup: 4.2, requestedAt: d(-25), deadline: d(-22), completedAt: d(-23) },
  { id: 'tr-13', number: 'TRANSF-2024-0242', fromId: 'cnpj-d', fromName: 'Fort Imóveis', toId: 'cnpj-a', toName: 'Atacadão SP', type: 'COMODATO', status: 'CONCLUIDO', skuCount: 2, totalValue: 120000, nfNumber: '000.242', cfop: '5.908', markup: 0, requestedAt: d(-30), deadline: d(-25), completedAt: d(-27) },
  { id: 'tr-14', number: 'TRANSF-2024-0243', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-b', toName: 'Fort SP-01', type: 'CONSIGNACAO', status: 'RECEBIDO', skuCount: 15, totalValue: 34500, nfNumber: '000.243', cfop: '5.919', markup: 0, requestedAt: d(-10), deadline: d(-6) },
  { id: 'tr-15', number: 'TRANSF-2024-0244', fromId: 'cnpj-c', fromName: 'Fort SP-02', toId: 'cnpj-b', toName: 'Fort SP-01', type: 'TRANSFERENCIA_PROPRIEDADE', status: 'NF_EMITIDA', skuCount: 4, totalValue: 11200, nfNumber: '000.244', cfop: '5.152', markup: 3.8, requestedAt: d(-1), deadline: d(3) },
];

export const consignments: Consignment[] = [
  {
    id: 'csg-1', consignorId: 'ext-forn-1', consignorName: 'Distribuidora Nacional Ltda', consignorExternal: true,
    consigneeId: 'cnpj-b', consigneeName: 'Fort SP-01', skuCount: 45, totalValue: 234000, soldValue: 67000,
    returnDue: d(35), daysOpen: 23, status: 'ATIVA',
    items: [
      { skuId: 'SKU-C01', skuName: 'Biscoito Recheado 140g', sentQty: 500, soldQty: 180, returnQty: 0, unitPrice: 3.80, status: 'PENDENTE' },
      { skuId: 'SKU-C02', skuName: 'Suco Natural 1L', sentQty: 300, soldQty: 120, returnQty: 50, unitPrice: 6.50, status: 'VENDIDO' },
      { skuId: 'SKU-C03', skuName: 'Iogurte Grego 170g', sentQty: 200, soldQty: 85, returnQty: 0, unitPrice: 4.20, status: 'PENDENTE' },
      { skuId: 'SKU-C04', skuName: 'Cereal Matinal 300g', sentQty: 150, soldQty: 0, returnQty: 150, unitPrice: 12.90, status: 'A_DEVOLVER' },
    ],
  },
  {
    id: 'csg-2', consignorId: 'ext-forn-2', consignorName: 'Bebidas Premium S.A.', consignorExternal: true,
    consigneeId: 'cnpj-c', consigneeName: 'Fort SP-02', skuCount: 28, totalValue: 156000, soldValue: 42000,
    returnDue: d(18), daysOpen: 40, status: 'ATIVA',
    items: [
      { skuId: 'SKU-C05', skuName: 'Energético 250ml', sentQty: 600, soldQty: 250, returnQty: 0, unitPrice: 7.90, status: 'VENDIDO' },
      { skuId: 'SKU-C06', skuName: 'Água Mineral Premium 500ml', sentQty: 1000, soldQty: 400, returnQty: 0, unitPrice: 2.50, status: 'PENDENTE' },
      { skuId: 'SKU-C07', skuName: 'Isotônico 500ml', sentQty: 80, soldQty: 0, returnQty: 0, unitPrice: 5.40, status: 'AVARIADO' },
    ],
  },
  {
    id: 'csg-3', consignorId: 'cnpj-a', consignorName: 'Atacadão SP', consignorExternal: false,
    consigneeId: 'cnpj-b', consigneeName: 'Fort SP-01', skuCount: 15, totalValue: 89000, soldValue: 31000,
    returnDue: d(10), daysOpen: 48, status: 'EM_ACERTO',
    items: [
      { skuId: 'SKU-C08', skuName: 'Detergente Líquido 500ml', sentQty: 400, soldQty: 220, returnQty: 80, unitPrice: 2.90, status: 'VENDIDO' },
      { skuId: 'SKU-C09', skuName: 'Amaciante 2L', sentQty: 250, soldQty: 100, returnQty: 50, unitPrice: 9.80, status: 'A_DEVOLVER' },
    ],
  },
];

export const comodatoItems: ComodatoItem[] = [
  { id: 'cmd-1', item: 'Geladeira Expositora Vertical 4P', description: 'Geladeira expositora 4 portas marca Metalfrio', ownerId: 'cnpj-d', ownerName: 'Fort Imóveis', holderId: 'cnpj-b', holderName: 'Fort SP-01', exitDate: d(-180), returnDue: d(185), condition: 'Novo', assetValue: 18500, status: 'ATIVO', responsible: 'Carlos Mendes' },
  { id: 'cmd-2', item: 'Empilhadeira Elétrica 2T', description: 'Empilhadeira elétrica Toyota 8FBE20', ownerId: 'cnpj-d', ownerName: 'Fort Imóveis', holderId: 'cnpj-a', holderName: 'Atacadão SP', exitDate: d(-365), returnDue: d(0), condition: 'Usado - 90%', assetValue: 95000, status: 'VENCIDO', responsible: 'Roberto Lima' },
  { id: 'cmd-3', item: 'Rack Industrial 6 Níveis', description: 'Estante porta-pallets 6 níveis 2.5m', ownerId: 'cnpj-a', ownerName: 'Atacadão SP', holderId: 'cnpj-c', holderName: 'Fort SP-02', exitDate: d(-90), returnDue: d(275), condition: 'Novo', assetValue: 4200, status: 'ATIVO', responsible: 'Ana Souza' },
  { id: 'cmd-4', item: 'Paleteira Hidráulica', description: 'Paleteira manual 2.5T Paletrans', ownerId: 'cnpj-a', ownerName: 'Atacadão SP', holderId: 'cnpj-b', holderName: 'Fort SP-01', exitDate: d(-60), returnDue: d(305), condition: 'Novo', assetValue: 2800, status: 'ATIVO', responsible: 'Felipe Torres' },
  { id: 'cmd-5', item: 'Balança de Chão Digital 300kg', description: 'Balança digital Toledo Prix 2098', ownerId: 'cnpj-d', ownerName: 'Fort Imóveis', holderId: 'cnpj-c', holderName: 'Fort SP-02', exitDate: d(-200), returnDue: d(-15), condition: 'Usado - 85%', assetValue: 3400, status: 'VENCIDO', responsible: 'Mariana Costa' },
  { id: 'cmd-6', item: 'Câmara Fria Modular 20m³', description: 'Câmara fria desmontável Refricomp', ownerId: 'cnpj-d', ownerName: 'Fort Imóveis', holderId: 'cnpj-a', holderName: 'Atacadão SP', exitDate: d(-400), returnDue: d(-35), condition: 'Usado - 80%', assetValue: 45000, status: 'VENCIDO', responsible: 'Roberto Lima' },
  { id: 'cmd-7', item: 'Pallet Plástico Padrão PBR', description: 'Lote 200 pallets plástico 1,00x1,20m', ownerId: 'cnpj-a', ownerName: 'Atacadão SP', holderId: 'cnpj-b', holderName: 'Fort SP-01', exitDate: d(-30), returnDue: d(335), condition: 'Novo', assetValue: 24000, status: 'ATIVO', responsible: 'Carlos Mendes' },
  { id: 'cmd-8', item: 'Leitor de Código de Barras Industrial', description: 'Zebra DS3608 c/ base carregadora', ownerId: 'cnpj-a', ownerName: 'Atacadão SP', holderId: 'cnpj-c', holderName: 'Fort SP-02', exitDate: d(-45), returnDue: d(-10), condition: 'Novo', assetValue: 5600, status: 'DEVOLVIDO', responsible: 'Ana Souza' },
];

export const intercompanyBalances: IntercompanyBalance[] = [
  { fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-b', toName: 'Fort SP-01', balance: 45200 },
  { fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-c', toName: 'Fort SP-02', balance: 12800 },
  { fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-d', toName: 'Fort Imóveis', balance: -28000 },
  { fromId: 'cnpj-b', fromName: 'Fort SP-01', toId: 'cnpj-c', toName: 'Fort SP-02', balance: 8500 },
  { fromId: 'cnpj-b', fromName: 'Fort SP-01', toId: 'cnpj-d', toName: 'Fort Imóveis', balance: -5200 },
  { fromId: 'cnpj-c', fromName: 'Fort SP-02', toId: 'cnpj-d', toName: 'Fort Imóveis', balance: 3100 },
];

export const fiscalObligations: FiscalObligation[] = [
  { id: 'fo-1', nfNumber: '000.230', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-b', toName: 'Fort SP-01', value: 32400, cfop: '5.152', issuedAt: d(-14), senderStatus: 'ESCRITURADO', receiverStatus: 'ESCRITURADO', nature: 'Transferência entre estabelecimentos' },
  { id: 'fo-2', nfNumber: '000.231', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-c', toName: 'Fort SP-02', value: 18700, cfop: '5.152', issuedAt: d(-11), senderStatus: 'ESCRITURADO', receiverStatus: 'PENDENTE', nature: 'Transferência entre estabelecimentos' },
  { id: 'fo-3', nfNumber: '000.234', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-b', toName: 'Fort SP-01', value: 48200, cfop: '5.152', issuedAt: d(-2), senderStatus: 'ESCRITURADO', receiverStatus: 'DIVERGENTE', nature: 'Transferência entre estabelecimentos' },
  { id: 'fo-4', nfNumber: '000.239', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-b', toName: 'Fort SP-01', value: 27300, cfop: '5.949', issuedAt: d(-3), senderStatus: 'PENDENTE', receiverStatus: 'PENDENTE', nature: 'Remessa para depósito' },
  { id: 'fo-5', nfNumber: '000.244', fromId: 'cnpj-c', fromName: 'Fort SP-02', toId: 'cnpj-b', toName: 'Fort SP-01', value: 11200, cfop: '5.152', issuedAt: d(-1), senderStatus: 'ESCRITURADO', receiverStatus: 'DIVERGENTE', nature: 'Transferência entre estabelecimentos' },
  { id: 'fo-6', nfNumber: '000.240', fromId: 'cnpj-b', fromName: 'Fort SP-01', toId: 'cnpj-c', toName: 'Fort SP-02', value: 9800, cfop: '5.152', issuedAt: d(-19), senderStatus: 'ESCRITURADO', receiverStatus: 'ESCRITURADO', nature: 'Transferência entre estabelecimentos' },
  { id: 'fo-7', nfNumber: '000.243', fromId: 'cnpj-a', fromName: 'Atacadão SP', toId: 'cnpj-b', toName: 'Fort SP-01', value: 34500, cfop: '5.919', issuedAt: d(-9), senderStatus: 'PENDENTE', receiverStatus: 'ESCRITURADO', nature: 'Remessa em consignação' },
];

export const cfopMap: Record<string, { cfop: string; nature: string }> = {
  TRANSFERENCIA_PROPRIEDADE: { cfop: '5.152', nature: 'Transferência entre estabelecimentos' },
  REMESSA_DEPOSITO: { cfop: '5.949', nature: 'Remessa para depósito' },
  CONSIGNACAO: { cfop: '5.919', nature: 'Remessa em consignação mercantil' },
  COMODATO: { cfop: '5.908', nature: 'Remessa de bem por conta de contrato de comodato' },
  DEVOLUCAO: { cfop: '5.152', nature: 'Devolução de transferência' },
};
