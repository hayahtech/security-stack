// ===== Core Types for SGE (Sistema de Gestão de Estoque) =====

export type SKUStatus = 'active' | 'inactive' | 'discontinued';
export type Category = 'Eletrônicos' | 'Vestuário' | 'Casa' | 'Alimentos' | 'Industrial';
export type UnitOfMeasure = 'UN' | 'KG' | 'L' | 'M' | 'M2' | 'M3' | 'CX' | 'PCT';

export interface SKU {
  id: string;
  name: string;
  category: Category;
  brand: string;
  variants: number;
  unit: UnitOfMeasure;
  cost: number;
  price: number;
  stock: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  leadTime: number; // days
  status: SKUStatus;
  supplierId: string;
  barcode: string;
  createdAt: Date;
  lastMovement: Date;
  imageUrl?: string;
  // Pricing fields
  markupPercent: number;
  priceWholesale: number;
  minPrice: number;
  competitorPrice: number;
  salesVolume: number; // mock monthly units sold
}

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  state: string;
  totalSKUs: number;
  capacity: number;
  usedCapacity: number;
  manager: string;
  zones: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  warehouseId: string;
  aisles: Aisle[];
}

export interface Aisle {
  id: string;
  name: string;
  zoneId: string;
  bins: Bin[];
}

export interface Bin {
  id: string;
  name: string;
  aisleId: string;
  skuId?: string;
  quantity: number;
  maxCapacity: number;
}

export type MovementType = 'ENTRADA' | 'SAÍDA' | 'TRANSFERÊNCIA' | 'AJUSTE' | 'DEVOLUÇÃO' | 'AVARIA' | 'BAIXA';

export interface StockMovement {
  id: string;
  timestamp: Date;
  skuId: string;
  skuName: string;
  type: MovementType;
  quantity: number;
  fromWarehouse?: string;
  toWarehouse?: string;
  reference?: string; // PO or SO number
  operator: string;
  notes?: string;
}

export type POStatus = 'RASCUNHO' | 'ENVIADO' | 'CONFIRMADO' | 'PARCIAL' | 'RECEBIDO' | 'FECHADO';

export interface PurchaseOrderLine {
  id: string;
  skuId: string;
  skuName: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  expectedDelivery: Date;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  lines: PurchaseOrderLine[];
  totalValue: number;
  createdAt: Date;
  expectedDelivery: Date;
  receivedAt?: Date;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  leadTime: number; // days
  paymentTerms: string;
  onTimeDeliveryRate: number; // percentage
  fillRate: number; // percentage
  totalOrders: number;
}

export type AlertType = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'OVERSTOCK' | 'EXPIRING' | 'ANOMALY';
export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  skuId?: string;
  skuName?: string;
  warehouseId?: string;
  warehouseName?: string;
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  snoozedUntil?: Date;
}

export type UserRole = 'ADMINISTRADOR' | 'GERENTE' | 'OPERADOR' | 'VISUALIZADOR' | 'AUDITOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastAccess: Date;
  status: 'active' | 'inactive';
  avatar?: string;
}

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface Integration {
  id: string;
  name: string;
  type: 'erp' | 'ecommerce' | 'logistics' | 'financial';
  status: IntegrationStatus;
  lastSync?: Date;
  icon: string;
}

// Dashboard specific types
export interface KPIData {
  value: number;
  change: number; // percentage change
  trend: number[]; // last 30 days
}

export interface InventoryHealthScore {
  overall: number;
  breakdown: {
    stockAvailability: number;
    turnoverRate: number;
    deadStock: number;
    orderFulfillment: number;
  };
}

export interface ActivityFeedItem {
  id: string;
  type: 'movement' | 'alert' | 'po' | 'user';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
}

// Report types
export type ReportPeriod = 'today' | '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface ReportFilters {
  period: ReportPeriod;
  startDate?: Date;
  endDate?: Date;
  categories?: Category[];
  warehouses?: string[];
}

// ===== Receiving / Dock Types =====
export type DockStatus = 'LIVRE' | 'OCUPADA' | 'AGUARDANDO_CONFERENCIA' | 'BLOQUEADA';

export interface Dock {
  id: string;
  number: number;
  name: string;
  status: DockStatus;
  supplierId?: string;
  supplierName?: string;
  poId?: string;
  poNumber?: string;
  arrivalTime?: Date;
  scheduleId?: string;
}

export type ScheduleStatus = 'AGENDADO' | 'CONFIRMADO' | 'EM_TRANSITO' | 'CHEGOU' | 'ATRASADO' | 'CANCELADO';

export interface ReceivingSchedule {
  id: string;
  scheduledTime: Date;
  supplierId: string;
  supplierName: string;
  poId: string;
  poNumber: string;
  expectedItems: number;
  estimatedWeight: number;
  dockId?: string;
  dockName?: string;
  driverName: string;
  licensePlate: string;
  status: ScheduleStatus;
  notes?: string;
}

export type ReceivingHistoryStatus = 'CONCLUIDO' | 'COM_DIVERGENCIAS' | 'RECUSADO';

export interface ReceivingHistory {
  id: string;
  date: Date;
  supplierId: string;
  supplierName: string;
  poId: string;
  poNumber: string;
  nfNumber: string;
  totalItems: number;
  totalValue: number;
  divergences: number;
  inspector: string;
  status: ReceivingHistoryStatus;
}

export type DivergenceReason = 'AVARIA' | 'FALTA' | 'EXCESSO' | 'PRODUTO_ERRADO' | 'VENCIDO';

export interface ConferenceItem {
  skuId: string;
  skuName: string;
  orderedQty: number;
  nfQty: number;
  checkedQty: number;
  lot?: string;
  expiryDate?: Date;
  temperature?: number;
  divergenceReason?: DivergenceReason;
  status: 'pending' | 'ok' | 'divergent';
}

// ===== Batch / Lot Types =====
export type BatchStatus = 'NORMAL' | 'ATENCAO' | 'CRITICO' | 'VENCIDO' | 'BAIXA_REALIZADA';
export type BatchCategory = 'Alimentos' | 'Frios' | 'Laticínios' | 'Bebidas' | 'Limpeza' | 'FLV' | 'Padaria';

export interface Batch {
  id: string;
  lotNumber: string;
  skuId: string;
  skuName: string;
  category: BatchCategory;
  quantity: number;
  warehouseId: string;
  warehouseName: string;
  binLocation: string;
  manufacturingDate: Date;
  expiryDate: Date;
  supplierId: string;
  supplierName: string;
  status: BatchStatus;
  temperature?: number;
  discountApplied?: number;
}

export interface BatchTraceEvent {
  id: string;
  batchId: string;
  type: 'ORIGEM' | 'RECEBIMENTO' | 'ARMAZENAMENTO' | 'MOVIMENTACAO' | 'SAIDA';
  timestamp: Date;
  user: string;
  description: string;
  details?: Record<string, string>;
}

export type LossReason = 'VENCIMENTO' | 'AVARIA' | 'FURTO' | 'ERRO_OPERACIONAL' | 'PRODUTO_IMPROPRIO';

export interface LossRecord {
  id: string;
  date: Date;
  batchId: string;
  lotNumber: string;
  skuId: string;
  skuName: string;
  quantity: number;
  value: number;
  reason: LossReason;
  responsible: string;
  category: BatchCategory;
}

// ===== Pricing Types =====
export type PromotionType = 'PERCENTUAL' | 'VALOR_FIXO' | 'LEVE_X_PAGUE_Y' | 'COMBO' | 'PRECO_ESPECIAL_ATACADO';
export type PromotionStatus = 'ATIVA' | 'PROGRAMADA' | 'ENCERRADA';

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: PromotionType;
  discount: number; // percentage or fixed value
  skuIds: string[];
  startDate: Date;
  endDate: Date;
  status: PromotionStatus;
  marginImpact: number; // R$
}

export interface MarginRule {
  category: Category;
  minMargin: number;
  defaultMarkup: number;
  targetMargin: number;
  tolerance: number;
}

// ===== Logistics / Picking Types =====
export type CDAreaType = 'DOCA_RECEBIMENTO' | 'DOCA_EXPEDICAO' | 'CAMARA_FRIA' | 'CAMARA_RESFRIADA' | 'AREA_SECA' | 'AREA_FLV' | 'AREA_SEPARACAO';

export interface CDArea {
  id: string;
  name: string;
  type: CDAreaType;
  temperature?: number;
  targetTemp?: number;
  occupancyPercent: number;
  capacity: number;
  activeAlerts: number;
  corridors: string[];
}

export type ServiceOrderType = 'REABASTECIMENTO' | 'SEPARACAO' | 'TRANSFERENCIA' | 'INVENTARIO' | 'REORGANIZACAO';
export type ServiceOrderPriority = 'URGENTE' | 'ALTA' | 'NORMAL' | 'BAIXA';
export type ServiceOrderStatus = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface ServiceOrder {
  id: string;
  number: string;
  type: ServiceOrderType;
  priority: ServiceOrderPriority;
  skuIds: string[];
  skuNames: string[];
  origin: string;
  destination: string;
  operator: string;
  createdAt: Date;
  deadline: Date;
  status: ServiceOrderStatus;
  items?: PickingItem[];
}

export interface PickingItem {
  skuId: string;
  skuName: string;
  location: string;
  lot?: string;
  expiry?: string;
  requestedQty: number;
  collectedQty: number;
  status: 'pending' | 'collected' | 'problem';
  problemNote?: string;
}

export interface ReplenishmentSuggestion {
  id: string;
  skuId: string;
  skuName: string;
  currentBin: string;
  currentQty: number;
  minQty: number;
  suggestedQty: number;
  sourceLocation: string;
  urgency: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export interface CycleCountSchedule {
  id: string;
  area: string;
  corridor: string;
  scheduledDate: Date;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  assignedTo?: string;
  binsCount: number;
  divergences?: number;
}

// ===== Financial Automation Types =====

export type ProcessedDocStatus = 'APROVADO' | 'PENDENTE_REVISAO' | 'REJEITADO' | 'LANCADO';

export interface ExtractedField {
  value: string;
  confidence: number; // 0-100
}

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileType: 'PDF' | 'XML' | 'JPG' | 'PNG';
  uploadedAt: Date;
  processedAt?: Date;
  status: ProcessedDocStatus;
  supplier: ExtractedField;
  cnpj: ExtractedField;
  nfNumber: ExtractedField;
  issueDate: ExtractedField;
  dueDate: ExtractedField;
  grossValue: ExtractedField;
  taxes: ExtractedField;
  netValue: ExtractedField;
  category: ExtractedField;
  costCenter: ExtractedField;
  notes: ExtractedField;
  processedBy: string;
}

export interface BankAccount {
  id: string;
  bank: string;
  agency: string;
  account: string;
  balance: number;
  color: string;
}

export type ExceptionType = 'SEM_MATCH' | 'VALOR_DIVERGENTE' | 'DATA_DIVERGENTE' | 'DUPLICATA_SUSPEITA';

export interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  value: number;
  accountId: string;
  matchedLedgerId?: string;
  status: 'CONCILIADO' | 'PENDENTE' | 'EXCECAO';
  exceptionType?: ExceptionType;
}

export interface LedgerEntry {
  id: string;
  date: Date;
  description: string;
  value: number;
  category: string;
  matchedTransactionId?: string;
  status: 'CONCILIADO' | 'PENDENTE';
}

export interface ReconciliationHistory {
  month: string;
  year: number;
  totalTransactions: number;
  autoReconciled: number;
  autoPercent: number;
  totalValue: number;
}

// ===== Cost Center & Allocation Types =====

export type EntityType = 'GROUP' | 'COMPANY' | 'UNIT' | 'COST_CENTER';

export interface CostEntity {
  id: string;
  name: string;
  type: EntityType;
  parentId?: string;
  icon: string;
  revenue: number;
  directCosts: number;
  allocatedCosts: number;
  result: number;
  margin: number;
  area?: number; // m²
  headcount?: number;
}

export type AllocationMethod = 'PERCENTUAL_FIXO' | 'PROPORCIONAL_RECEITA' | 'PROPORCIONAL_AREA' | 'PROPORCIONAL_HEADCOUNT' | 'PROPORCIONAL_CONSUMO';

export interface AllocationRule {
  id: string;
  name: string;
  accountOrigin: string;
  method: AllocationMethod;
  destinations: { entityId: string; entityName: string; percent: number }[];
  periodicity: 'MENSAL' | 'SEMANAL' | 'POR_LANCAMENTO';
  active: boolean;
  monthlyValue: number;
}

export interface CostEntry {
  id: string;
  date: Date;
  description: string;
  value: number;
  supplier: string;
  entityId: string;
  entityName: string;
  allocations: { entityId: string; entityName: string; percent: number; value: number }[];
  isIntercompany: boolean;
}

export interface ConsolidationRow {
  account: string;
  values: Record<string, number>;
  eliminations: number;
  total: number;
  isIntercompany?: boolean;
}
