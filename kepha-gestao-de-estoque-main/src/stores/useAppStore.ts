import { create } from 'zustand';
import { SKU, Warehouse, StockMovement, PurchaseOrder, Alert, User, Supplier, Dock, ReceivingSchedule, ReceivingHistory, Batch, BatchTraceEvent, LossRecord, Promotion, MarginRule, CDArea, ServiceOrder, ReplenishmentSuggestion, CycleCountSchedule, ProcessedDocument, BankAccount, BankTransaction, LedgerEntry, ReconciliationHistory } from '@/types';
import { skus, warehouses, stockMovements, purchaseOrders, alerts, users, suppliers, docks as mockDocks, receivingSchedules as mockSchedules, receivingHistory as mockHistory, batches as mockBatches, batchTraceEvents as mockTraceEvents, lossRecords as mockLossRecords, promotions as mockPromotions, marginRules as mockMarginRules, cdAreas as mockCdAreas, serviceOrders as mockServiceOrders, replenishmentSuggestions as mockReplenSugg, cycleCountSchedules as mockCycleCounts, processedDocuments as mockDocs, bankAccounts as mockBankAccounts, bankTransactions as mockBankTx, ledgerEntries as mockLedger, reconciliationHistory as mockReconHistory } from '@/data/mockData';

interface AppState {
  // Data
  skus: SKU[];
  warehouses: Warehouse[];
  movements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  alerts: Alert[];
  users: User[];
  suppliers: Supplier[];
  docks: Dock[];
  receivingSchedules: ReceivingSchedule[];
  receivingHistory: ReceivingHistory[];
  batches: Batch[];
  batchTraceEvents: BatchTraceEvent[];
  lossRecords: LossRecord[];
  promotions: Promotion[];
  marginRules: MarginRule[];
  cdAreas: CDArea[];
  serviceOrders: ServiceOrder[];
  replenishmentSuggestions: ReplenishmentSuggestion[];
  cycleCountSchedules: CycleCountSchedule[];
  processedDocuments: ProcessedDocument[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  ledgerEntries: LedgerEntry[];
  reconciliationHistory: ReconciliationHistory[];
  
  // UI State
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  currentUser: User | null;
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  
  // SKU Actions
  addSKU: (sku: SKU) => void;
  updateSKU: (id: string, updates: Partial<SKU>) => void;
  
  // Alert Actions
  acknowledgeAlert: (id: string) => void;
  snoozeAlert: (id: string, until: Date) => void;
  
  // PO Actions
  updatePOStatus: (id: string, status: PurchaseOrder['status']) => void;

  // Dock Actions
  updateDockStatus: (id: string, updates: Partial<Dock>) => void;
  addReceivingHistory: (entry: ReceivingHistory) => void;
  updateScheduleStatus: (id: string, status: ReceivingSchedule['status']) => void;

  // Batch Actions
  updateBatch: (id: string, updates: Partial<Batch>) => void;
  addLossRecord: (record: LossRecord) => void;

  // Pricing Actions
  updateMarginRule: (category: string, updates: Partial<MarginRule>) => void;
  addPromotion: (promo: Promotion) => void;

  // Logistics Actions
  updateCDArea: (id: string, updates: Partial<CDArea>) => void;
  updateServiceOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  updateCycleCount: (id: string, updates: Partial<CycleCountSchedule>) => void;

  // Financial Actions
  addProcessedDocument: (doc: ProcessedDocument) => void;
  updateDocumentStatus: (id: string, status: ProcessedDocument['status']) => void;
  updateBankTransaction: (id: string, updates: Partial<BankTransaction>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initialize with mock data
  skus,
  warehouses,
  movements: stockMovements,
  purchaseOrders,
  alerts,
  users,
  suppliers,
  docks: mockDocks,
  receivingSchedules: mockSchedules,
  receivingHistory: mockHistory,
  batches: mockBatches,
  batchTraceEvents: mockTraceEvents,
  lossRecords: mockLossRecords,
  promotions: mockPromotions,
  marginRules: mockMarginRules,
  cdAreas: mockCdAreas,
  serviceOrders: mockServiceOrders,
  replenishmentSuggestions: mockReplenSugg,
  cycleCountSchedules: mockCycleCounts,
  processedDocuments: mockDocs,
  bankAccounts: mockBankAccounts,
  bankTransactions: mockBankTx,
  ledgerEntries: mockLedger,
  reconciliationHistory: mockReconHistory,
  
  // UI State
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  currentUser: users[0],
  
  // Actions
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  
  // SKU Actions
  addSKU: (sku) => set((state) => ({ skus: [sku, ...state.skus] })),
  updateSKU: (id, updates) => set((state) => ({
    skus: state.skus.map((sku) => sku.id === id ? { ...sku, ...updates } : sku),
  })),
  
  // Alert Actions
  acknowledgeAlert: (id) => set((state) => ({
    alerts: state.alerts.map((alert) => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ),
  })),
  
  snoozeAlert: (id, until) => set((state) => ({
    alerts: state.alerts.map((alert) => 
      alert.id === id ? { ...alert, snoozedUntil: until } : alert
    ),
  })),
  
  // PO Actions
  updatePOStatus: (id, status) => set((state) => ({
    purchaseOrders: state.purchaseOrders.map((po) => 
      po.id === id ? { ...po, status } : po
    ),
  })),

  // Dock Actions
  updateDockStatus: (id, updates) => set((state) => ({
    docks: state.docks.map((dock) =>
      dock.id === id ? { ...dock, ...updates } : dock
    ),
  })),

  addReceivingHistory: (entry) => set((state) => ({
    receivingHistory: [entry, ...state.receivingHistory],
  })),

  updateScheduleStatus: (id, status) => set((state) => ({
    receivingSchedules: state.receivingSchedules.map((s) =>
      s.id === id ? { ...s, status } : s
    ),
  })),

  // Batch Actions
  updateBatch: (id, updates) => set((state) => ({
    batches: state.batches.map((b) => b.id === id ? { ...b, ...updates } : b),
  })),

  addLossRecord: (record) => set((state) => ({
    lossRecords: [record, ...state.lossRecords],
  })),

  // Pricing Actions
  updateMarginRule: (category, updates) => set((state) => ({
    marginRules: state.marginRules.map((r) => r.category === category ? { ...r, ...updates } : r),
  })),

  addPromotion: (promo) => set((state) => ({
    promotions: [...state.promotions, promo],
  })),

  // Logistics Actions
  updateCDArea: (id, updates) => set((state) => ({
    cdAreas: state.cdAreas.map((a) => a.id === id ? { ...a, ...updates } : a),
  })),

  updateServiceOrder: (id, updates) => set((state) => ({
    serviceOrders: state.serviceOrders.map((o) => o.id === id ? { ...o, ...updates } : o),
  })),

  updateCycleCount: (id, updates) => set((state) => ({
    cycleCountSchedules: state.cycleCountSchedules.map((c) => c.id === id ? { ...c, ...updates } : c),
  })),

  // Financial Actions
  addProcessedDocument: (doc) => set((state) => ({
    processedDocuments: [doc, ...state.processedDocuments],
  })),

  updateDocumentStatus: (id, status) => set((state) => ({
    processedDocuments: state.processedDocuments.map((d) => d.id === id ? { ...d, status } : d),
  })),

  updateBankTransaction: (id, updates) => set((state) => ({
    bankTransactions: state.bankTransactions.map((t) => t.id === id ? { ...t, ...updates } : t),
  })),
}));
