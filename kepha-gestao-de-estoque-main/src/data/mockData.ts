import { 
  SKU, Warehouse, Zone, Aisle, Bin, StockMovement, PurchaseOrder, 
  Supplier, Alert, User, Integration, Category, MovementType, POStatus,
  ActivityFeedItem, Batch, BatchCategory, BatchTraceEvent, LossRecord, LossReason,
  Promotion, MarginRule, CDArea, ServiceOrder, PickingItem, ReplenishmentSuggestion, CycleCountSchedule,
  ProcessedDocument, BankAccount, BankTransaction, LedgerEntry, ReconciliationHistory
} from '@/types';
import { subDays, subHours, subMinutes, addDays, addHours, format } from 'date-fns';

// ===== SUPPLIERS =====
export const suppliers: Supplier[] = [
  { id: 'SUP001', name: 'TechDistribuidora LTDA', email: 'vendas@techdist.com.br', phone: '(11) 3456-7890', leadTime: 7, paymentTerms: '30 dias', onTimeDeliveryRate: 94, fillRate: 97, totalOrders: 234 },
  { id: 'SUP002', name: 'ModaExpress Atacado', email: 'comercial@modaexpress.com.br', phone: '(21) 2345-6789', leadTime: 5, paymentTerms: '15 dias', onTimeDeliveryRate: 89, fillRate: 92, totalOrders: 156 },
  { id: 'SUP003', name: 'Casa & Lar Importações', email: 'pedidos@casaelar.com.br', phone: '(31) 3456-7891', leadTime: 12, paymentTerms: '45 dias', onTimeDeliveryRate: 91, fillRate: 95, totalOrders: 89 },
  { id: 'SUP004', name: 'AlimentosBR Distribuidora', email: 'vendas@alimentosbr.com.br', phone: '(41) 4567-8901', leadTime: 3, paymentTerms: '7 dias', onTimeDeliveryRate: 98, fillRate: 99, totalOrders: 412 },
  { id: 'SUP005', name: 'IndustrialParts SA', email: 'comercial@industrialparts.com.br', phone: '(51) 5678-9012', leadTime: 21, paymentTerms: '60 dias', onTimeDeliveryRate: 85, fillRate: 88, totalOrders: 67 },
  { id: 'SUP006', name: 'Eletrônicos Premium', email: 'vendas@eletropremium.com.br', phone: '(11) 2345-6780', leadTime: 10, paymentTerms: '30 dias', onTimeDeliveryRate: 92, fillRate: 94, totalOrders: 189 },
  { id: 'SUP007', name: 'Fashion Import LTDA', email: 'compras@fashionimport.com.br', phone: '(21) 3456-7892', leadTime: 14, paymentTerms: '45 dias', onTimeDeliveryRate: 87, fillRate: 90, totalOrders: 78 },
  { id: 'SUP008', name: 'Decorações Globais', email: 'pedidos@decorglobal.com.br', phone: '(31) 4567-8902', leadTime: 8, paymentTerms: '30 dias', onTimeDeliveryRate: 93, fillRate: 96, totalOrders: 145 },
  { id: 'SUP009', name: 'NutriFood Atacado', email: 'vendas@nutrifood.com.br', phone: '(41) 5678-9013', leadTime: 2, paymentTerms: '7 dias', onTimeDeliveryRate: 99, fillRate: 99, totalOrders: 567 },
  { id: 'SUP010', name: 'MaquinaParts Industrial', email: 'comercial@maquinaparts.com.br', phone: '(51) 6789-0123', leadTime: 30, paymentTerms: '90 dias', onTimeDeliveryRate: 82, fillRate: 85, totalOrders: 34 },
];

// ===== SKUS =====
const categories: Category[] = ['Eletrônicos', 'Vestuário', 'Casa', 'Alimentos', 'Industrial'];

const generateSKUs = (): SKU[] => {
  const skuTemplates = [
    // Eletrônicos
    { name: 'iPhone 15 Pro 256GB', category: 'Eletrônicos' as Category, brand: 'Apple', cost: 6500, price: 8999, supplierId: 'SUP001' },
    { name: 'Samsung Galaxy S24 Ultra', category: 'Eletrônicos' as Category, brand: 'Samsung', cost: 5200, price: 7499, supplierId: 'SUP001' },
    { name: 'MacBook Air M3 15"', category: 'Eletrônicos' as Category, brand: 'Apple', cost: 9800, price: 13999, supplierId: 'SUP006' },
    { name: 'Dell XPS 15 i7', category: 'Eletrônicos' as Category, brand: 'Dell', cost: 7200, price: 9899, supplierId: 'SUP001' },
    { name: 'AirPods Pro 2ª Geração', category: 'Eletrônicos' as Category, brand: 'Apple', cost: 1200, price: 1899, supplierId: 'SUP006' },
    { name: 'JBL Flip 6 Bluetooth', category: 'Eletrônicos' as Category, brand: 'JBL', cost: 450, price: 699, supplierId: 'SUP001' },
    { name: 'Sony WH-1000XM5', category: 'Eletrônicos' as Category, brand: 'Sony', cost: 1800, price: 2499, supplierId: 'SUP006' },
    { name: 'iPad Pro 12.9" M2', category: 'Eletrônicos' as Category, brand: 'Apple', cost: 7500, price: 10499, supplierId: 'SUP001' },
    { name: 'Monitor LG 27" 4K', category: 'Eletrônicos' as Category, brand: 'LG', cost: 2200, price: 3199, supplierId: 'SUP006' },
    { name: 'Teclado Logitech MX Keys', category: 'Eletrônicos' as Category, brand: 'Logitech', cost: 600, price: 899, supplierId: 'SUP001' },
    // Vestuário
    { name: 'Camiseta Polo Tommy Hilfiger', category: 'Vestuário' as Category, brand: 'Tommy Hilfiger', cost: 120, price: 299, supplierId: 'SUP002' },
    { name: 'Calça Jeans Levis 501', category: 'Vestuário' as Category, brand: 'Levis', cost: 180, price: 399, supplierId: 'SUP002' },
    { name: 'Tênis Nike Air Max 90', category: 'Vestuário' as Category, brand: 'Nike', cost: 450, price: 899, supplierId: 'SUP007' },
    { name: 'Jaqueta Adidas Originals', category: 'Vestuário' as Category, brand: 'Adidas', cost: 280, price: 549, supplierId: 'SUP002' },
    { name: 'Vestido Zara Midi', category: 'Vestuário' as Category, brand: 'Zara', cost: 150, price: 349, supplierId: 'SUP007' },
    { name: 'Blazer Hugo Boss', category: 'Vestuário' as Category, brand: 'Hugo Boss', cost: 890, price: 1899, supplierId: 'SUP002' },
    { name: 'Bolsa Michael Kors', category: 'Vestuário' as Category, brand: 'Michael Kors', cost: 650, price: 1299, supplierId: 'SUP007' },
    { name: 'Relógio Fossil Gen 6', category: 'Vestuário' as Category, brand: 'Fossil', cost: 800, price: 1499, supplierId: 'SUP002' },
    { name: 'Óculos Ray-Ban Aviador', category: 'Vestuário' as Category, brand: 'Ray-Ban', cost: 350, price: 699, supplierId: 'SUP007' },
    { name: 'Mochila North Face', category: 'Vestuário' as Category, brand: 'North Face', cost: 280, price: 599, supplierId: 'SUP002' },
    // Casa
    { name: 'Sofá Retrátil 3 Lugares', category: 'Casa' as Category, brand: 'Tok&Stok', cost: 2200, price: 4599, supplierId: 'SUP003' },
    { name: 'Mesa de Jantar 6 Lugares', category: 'Casa' as Category, brand: 'Etna', cost: 1800, price: 3499, supplierId: 'SUP003' },
    { name: 'Luminária Pendente Design', category: 'Casa' as Category, brand: 'Lumini', cost: 450, price: 899, supplierId: 'SUP008' },
    { name: 'Tapete Persa 2x3m', category: 'Casa' as Category, brand: 'Kilim', cost: 1200, price: 2499, supplierId: 'SUP003' },
    { name: 'Jogo de Panelas Tramontina', category: 'Casa' as Category, brand: 'Tramontina', cost: 380, price: 799, supplierId: 'SUP008' },
    { name: 'Cafeteira Nespresso Vertuo', category: 'Casa' as Category, brand: 'Nespresso', cost: 650, price: 1199, supplierId: 'SUP003' },
    { name: 'Robot Aspirador iRobot', category: 'Casa' as Category, brand: 'iRobot', cost: 1800, price: 3299, supplierId: 'SUP008' },
    { name: 'Colchão King Ortobom', category: 'Casa' as Category, brand: 'Ortobom', cost: 2500, price: 4999, supplierId: 'SUP003' },
    { name: 'Purificador Água Electrolux', category: 'Casa' as Category, brand: 'Electrolux', cost: 280, price: 599, supplierId: 'SUP008' },
    { name: 'Ar Condicionado LG 12000BTU', category: 'Casa' as Category, brand: 'LG', cost: 1900, price: 3499, supplierId: 'SUP003' },
    // Alimentos
    { name: 'Café Premium Orfeu 1kg', category: 'Alimentos' as Category, brand: 'Orfeu', cost: 45, price: 89, supplierId: 'SUP004' },
    { name: 'Azeite Extra Virgem 500ml', category: 'Alimentos' as Category, brand: 'Gallo', cost: 35, price: 69, supplierId: 'SUP009' },
    { name: 'Chocolate Lindt 100g', category: 'Alimentos' as Category, brand: 'Lindt', cost: 18, price: 39, supplierId: 'SUP004' },
    { name: 'Vinho Tinto Reserva 750ml', category: 'Alimentos' as Category, brand: 'Casillero del Diablo', cost: 55, price: 119, supplierId: 'SUP009' },
    { name: 'Whisky Johnnie Walker 1L', category: 'Alimentos' as Category, brand: 'Johnnie Walker', cost: 120, price: 249, supplierId: 'SUP004' },
    { name: 'Proteína Whey 2kg', category: 'Alimentos' as Category, brand: 'Optimum Nutrition', cost: 180, price: 349, supplierId: 'SUP009' },
    { name: 'Cápsulas Nespresso x50', category: 'Alimentos' as Category, brand: 'Nespresso', cost: 110, price: 199, supplierId: 'SUP004' },
    { name: 'Queijo Parmesão 500g', category: 'Alimentos' as Category, brand: 'Tirolez', cost: 55, price: 99, supplierId: 'SUP009' },
    { name: 'Mel Orgânico 500g', category: 'Alimentos' as Category, brand: 'Breyer', cost: 28, price: 59, supplierId: 'SUP004' },
    { name: 'Granola Premium 800g', category: 'Alimentos' as Category, brand: 'Jasmine', cost: 22, price: 45, supplierId: 'SUP009' },
    // Industrial
    { name: 'Motor Elétrico 5CV', category: 'Industrial' as Category, brand: 'WEG', cost: 2800, price: 4999, supplierId: 'SUP005' },
    { name: 'Compressor de Ar 100L', category: 'Industrial' as Category, brand: 'Schulz', cost: 3200, price: 5499, supplierId: 'SUP010' },
    { name: 'Furadeira Industrial', category: 'Industrial' as Category, brand: 'Bosch', cost: 1500, price: 2799, supplierId: 'SUP005' },
    { name: 'Parafusadeira DeWalt', category: 'Industrial' as Category, brand: 'DeWalt', cost: 890, price: 1599, supplierId: 'SUP010' },
    { name: 'Serra Circular Makita', category: 'Industrial' as Category, brand: 'Makita', cost: 1200, price: 2199, supplierId: 'SUP005' },
    { name: 'Esmerilhadeira Angular', category: 'Industrial' as Category, brand: 'Bosch', cost: 450, price: 899, supplierId: 'SUP010' },
    { name: 'Solda MIG 250A', category: 'Industrial' as Category, brand: 'ESAB', cost: 2100, price: 3799, supplierId: 'SUP005' },
    { name: 'Gerador 8000W', category: 'Industrial' as Category, brand: 'Toyama', cost: 4500, price: 7999, supplierId: 'SUP010' },
    { name: 'Ponte Rolante 5T', category: 'Industrial' as Category, brand: 'Konecranes', cost: 45000, price: 79999, supplierId: 'SUP005' },
    { name: 'Empilhadeira Elétrica', category: 'Industrial' as Category, brand: 'Yale', cost: 85000, price: 149999, supplierId: 'SUP010' },
  ];

  const markupByCategory: Record<string, number> = {
    'Eletrônicos': 35, 'Vestuário': 90, 'Casa': 80, 'Alimentos': 60, 'Industrial': 45,
  };

  return skuTemplates.map((template, index) => {
    const stock = Math.floor(Math.random() * 500) + 10;
    const reserved = Math.floor(stock * Math.random() * 0.3);
    const baseMarkup = markupByCategory[template.category] || 50;
    const markupPercent = baseMarkup + (Math.random() * 20 - 10); // ±10% variance
    const competitorVariance = 1 + (Math.random() * 0.3 - 0.15); // ±15%
    return {
      id: `SKU${String(index + 1).padStart(6, '0')}`,
      name: template.name,
      category: template.category,
      brand: template.brand,
      variants: Math.floor(Math.random() * 5) + 1,
      unit: 'UN' as const,
      cost: template.cost,
      price: template.price,
      stock,
      reserved,
      available: stock - reserved,
      reorderPoint: Math.floor(stock * 0.2),
      leadTime: Math.floor(Math.random() * 14) + 3,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      supplierId: template.supplierId,
      barcode: `789${String(Math.floor(Math.random() * 10000000000)).padStart(10, '0')}`,
      createdAt: subDays(new Date(), Math.floor(Math.random() * 365)),
      lastMovement: subDays(new Date(), Math.floor(Math.random() * 30)),
      markupPercent: parseFloat(markupPercent.toFixed(1)),
      priceWholesale: parseFloat((template.price * 0.85).toFixed(2)),
      minPrice: parseFloat((template.cost * 1.05).toFixed(2)),
      competitorPrice: parseFloat((template.price * competitorVariance).toFixed(2)),
      salesVolume: Math.floor(Math.random() * 500) + 5,
    };
  });
};

export const skus: SKU[] = generateSKUs();

// ===== WAREHOUSES =====
export const warehouses: Warehouse[] = [
  {
    id: 'WH001',
    name: 'Centro de Distribuição São Paulo',
    city: 'São Paulo',
    state: 'SP',
    totalSKUs: 35,
    capacity: 50000,
    usedCapacity: 42500,
    manager: 'Carlos Silva',
    zones: [
      { id: 'Z001', name: 'Zona A - Eletrônicos', warehouseId: 'WH001', aisles: [] },
      { id: 'Z002', name: 'Zona B - Vestuário', warehouseId: 'WH001', aisles: [] },
      { id: 'Z003', name: 'Zona C - Casa', warehouseId: 'WH001', aisles: [] },
    ],
  },
  {
    id: 'WH002',
    name: 'Centro de Distribuição Recife',
    city: 'Recife',
    state: 'PE',
    totalSKUs: 28,
    capacity: 30000,
    usedCapacity: 21000,
    manager: 'Ana Costa',
    zones: [
      { id: 'Z004', name: 'Zona A - Geral', warehouseId: 'WH002', aisles: [] },
      { id: 'Z005', name: 'Zona B - Alimentos', warehouseId: 'WH002', aisles: [] },
    ],
  },
  {
    id: 'WH003',
    name: 'Centro de Distribuição Porto Alegre',
    city: 'Porto Alegre',
    state: 'RS',
    totalSKUs: 22,
    capacity: 25000,
    usedCapacity: 18750,
    manager: 'Roberto Martins',
    zones: [
      { id: 'Z006', name: 'Zona A - Industrial', warehouseId: 'WH003', aisles: [] },
      { id: 'Z007', name: 'Zona B - Misto', warehouseId: 'WH003', aisles: [] },
    ],
  },
];

// ===== STOCK MOVEMENTS =====
const movementTypes: MovementType[] = ['ENTRADA', 'SAÍDA', 'TRANSFERÊNCIA', 'AJUSTE', 'DEVOLUÇÃO', 'AVARIA', 'BAIXA'];
const operators = ['Carlos Silva', 'Ana Costa', 'Roberto Martins', 'Maria Santos', 'João Oliveira'];

const generateMovements = (): StockMovement[] => {
  const movements: StockMovement[] = [];
  for (let i = 0; i < 220; i++) {
    const sku = skus[Math.floor(Math.random() * skus.length)];
    const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
    const hoursAgo = Math.floor(Math.random() * 2160); // ~90 days
    movements.push({
      id: `MOV${String(i + 1).padStart(6, '0')}`,
      timestamp: subHours(new Date(), hoursAgo),
      skuId: sku.id,
      skuName: sku.name,
      type,
      quantity: Math.floor(Math.random() * 100) + 1,
      fromWarehouse: type === 'TRANSFERÊNCIA' || type === 'SAÍDA' ? warehouses[Math.floor(Math.random() * warehouses.length)].name : undefined,
      toWarehouse: type === 'TRANSFERÊNCIA' || type === 'ENTRADA' ? warehouses[Math.floor(Math.random() * warehouses.length)].name : undefined,
      reference: type === 'ENTRADA' ? `PO-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}` : type === 'SAÍDA' ? `SO-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}` : undefined,
      operator: operators[Math.floor(Math.random() * operators.length)],
      notes: Math.random() > 0.7 ? 'Observação de exemplo para esta movimentação' : undefined,
    });
  }
  return movements.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const stockMovements: StockMovement[] = generateMovements();

// ===== PURCHASE ORDERS =====
const poStatuses: POStatus[] = ['RASCUNHO', 'ENVIADO', 'CONFIRMADO', 'PARCIAL', 'RECEBIDO', 'FECHADO'];

const generatePurchaseOrders = (): PurchaseOrder[] => {
  const pos: PurchaseOrder[] = [];
  for (let i = 0; i < 20; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const status = poStatuses[Math.floor(Math.random() * poStatuses.length)];
    const numLines = Math.floor(Math.random() * 5) + 1;
    const lines = [];
    let totalValue = 0;
    
    for (let j = 0; j < numLines; j++) {
      const sku = skus[Math.floor(Math.random() * skus.length)];
      const qty = Math.floor(Math.random() * 50) + 10;
      const received = status === 'RECEBIDO' || status === 'FECHADO' ? qty : status === 'PARCIAL' ? Math.floor(qty * Math.random()) : 0;
      lines.push({
        id: `POL${String(i * 10 + j).padStart(6, '0')}`,
        skuId: sku.id,
        skuName: sku.name,
        quantity: qty,
        receivedQuantity: received,
        unitCost: sku.cost,
        expectedDelivery: addDays(new Date(), supplier.leadTime),
      });
      totalValue += qty * sku.cost;
    }

    pos.push({
      id: `PO${String(i + 1).padStart(6, '0')}`,
      number: `PO-2024-${String(i + 1).padStart(4, '0')}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      status,
      lines,
      totalValue,
      createdAt: subDays(new Date(), Math.floor(Math.random() * 60)),
      expectedDelivery: addDays(new Date(), Math.floor(Math.random() * 30)),
      receivedAt: status === 'RECEBIDO' || status === 'FECHADO' ? subDays(new Date(), Math.floor(Math.random() * 10)) : undefined,
    });
  }
  return pos;
};

export const purchaseOrders: PurchaseOrder[] = generatePurchaseOrders();

// ===== ALERTS =====
const generateAlerts = (): Alert[] => {
  const lowStockSkus = skus.filter(s => s.stock < s.reorderPoint).slice(0, 5);
  const outOfStockAlerts: Alert[] = [
    { id: 'ALT001', type: 'OUT_OF_STOCK', severity: 'critical', skuId: 'SKU000012', skuName: 'Tênis Nike Air Max 90', warehouseId: 'WH001', warehouseName: 'CD São Paulo', message: 'Item sem estoque - última unidade vendida há 2 horas', createdAt: subHours(new Date(), 2), acknowledged: false },
    { id: 'ALT002', type: 'OUT_OF_STOCK', severity: 'critical', skuId: 'SKU000025', skuName: 'Cafeteira Nespresso Vertuo', warehouseId: 'WH002', warehouseName: 'CD Recife', message: 'Item sem estoque - pedidos pendentes: 3', createdAt: subHours(new Date(), 5), acknowledged: false },
  ];
  
  const lowStockAlerts: Alert[] = lowStockSkus.map((sku, i) => ({
    id: `ALT${String(i + 3).padStart(3, '0')}`,
    type: 'LOW_STOCK' as const,
    severity: 'warning' as const,
    skuId: sku.id,
    skuName: sku.name,
    message: `Estoque abaixo do ponto de reposição: ${sku.stock} unidades (mínimo: ${sku.reorderPoint})`,
    createdAt: subHours(new Date(), Math.floor(Math.random() * 48)),
    acknowledged: false,
  }));

  const overstockAlerts: Alert[] = [
    { id: 'ALT010', type: 'OVERSTOCK', severity: 'warning', skuId: 'SKU000033', skuName: 'Vinho Tinto Reserva 750ml', warehouseId: 'WH001', warehouseName: 'CD São Paulo', message: 'Estoque acima do limite máximo: 450 unidades (máximo recomendado: 200)', createdAt: subDays(new Date(), 1), acknowledged: false },
    { id: 'ALT011', type: 'OVERSTOCK', severity: 'warning', skuId: 'SKU000044', skuName: 'Parafusadeira DeWalt', warehouseId: 'WH003', warehouseName: 'CD Porto Alegre', message: 'Capital excessivo imobilizado: R$ 89.000 em estoque parado', createdAt: subDays(new Date(), 2), acknowledged: true },
  ];

  const expiringAlerts: Alert[] = [
    { id: 'ALT012', type: 'EXPIRING', severity: 'warning', skuId: 'SKU000030', skuName: 'Café Premium Orfeu 1kg', warehouseId: 'WH002', warehouseName: 'CD Recife', message: 'Lote vence em 15 dias - 120 unidades afetadas', createdAt: subDays(new Date(), 1), acknowledged: false },
  ];

  const anomalyAlerts: Alert[] = [
    { id: 'ALT013', type: 'ANOMALY', severity: 'info', skuId: 'SKU000001', skuName: 'iPhone 15 Pro 256GB', message: 'Pico de saída detectado: 340% acima da média semanal', createdAt: subHours(new Date(), 6), acknowledged: false },
    { id: 'ALT014', type: 'ANOMALY', severity: 'info', skuId: 'SKU000003', skuName: 'MacBook Air M3 15"', message: 'Queda abrupta de estoque: verificar possível divergência', createdAt: subHours(new Date(), 12), acknowledged: false },
    { id: 'ALT015', type: 'ANOMALY', severity: 'critical', message: 'Múltiplos ajustes manuais detectados no CD São Paulo nas últimas 24h', createdAt: subHours(new Date(), 1), acknowledged: false },
  ];

  return [...outOfStockAlerts, ...lowStockAlerts, ...overstockAlerts, ...expiringAlerts, ...anomalyAlerts];
};

export const alerts: Alert[] = generateAlerts();

// ===== USERS =====
export const users: User[] = [
  { id: 'USR001', name: 'Carlos Silva', email: 'carlos.silva@empresa.com.br', role: 'ADMINISTRADOR', lastAccess: subMinutes(new Date(), 5), status: 'active' },
  { id: 'USR002', name: 'Ana Costa', email: 'ana.costa@empresa.com.br', role: 'GERENTE', lastAccess: subHours(new Date(), 1), status: 'active' },
  { id: 'USR003', name: 'Roberto Martins', email: 'roberto.martins@empresa.com.br', role: 'GERENTE', lastAccess: subHours(new Date(), 3), status: 'active' },
  { id: 'USR004', name: 'Maria Santos', email: 'maria.santos@empresa.com.br', role: 'OPERADOR', lastAccess: subMinutes(new Date(), 30), status: 'active' },
  { id: 'USR005', name: 'João Oliveira', email: 'joao.oliveira@empresa.com.br', role: 'AUDITOR', lastAccess: subDays(new Date(), 2), status: 'inactive' },
];

// ===== INTEGRATIONS =====
export const integrations: Integration[] = [
  { id: 'INT001', name: 'SAP ERP', type: 'erp', status: 'connected', lastSync: subMinutes(new Date(), 15), icon: 'database' },
  { id: 'INT002', name: 'TOTVS Protheus', type: 'erp', status: 'disconnected', icon: 'database' },
  { id: 'INT003', name: 'Mercado Livre', type: 'ecommerce', status: 'connected', lastSync: subMinutes(new Date(), 5), icon: 'shopping-cart' },
  { id: 'INT004', name: 'Shopify', type: 'ecommerce', status: 'connected', lastSync: subMinutes(new Date(), 10), icon: 'shopping-bag' },
  { id: 'INT005', name: 'VTEX', type: 'ecommerce', status: 'error', lastSync: subHours(new Date(), 2), icon: 'store' },
  { id: 'INT006', name: 'Correios', type: 'logistics', status: 'connected', lastSync: subMinutes(new Date(), 20), icon: 'truck' },
  { id: 'INT007', name: 'Loggi', type: 'logistics', status: 'connected', lastSync: subMinutes(new Date(), 8), icon: 'package' },
  { id: 'INT008', name: 'Conta Azul', type: 'financial', status: 'connected', lastSync: subHours(new Date(), 1), icon: 'credit-card' },
  { id: 'INT009', name: 'Omie', type: 'financial', status: 'disconnected', icon: 'wallet' },
];

// ===== ACTIVITY FEED =====
export const generateActivityFeed = (): ActivityFeedItem[] => {
  const activities: ActivityFeedItem[] = [
    { id: 'ACT001', type: 'movement', title: 'Entrada registrada', description: 'PO-2024-0015: 50 unidades de iPhone 15 Pro', timestamp: subMinutes(new Date(), 3), icon: 'package-plus' },
    { id: 'ACT002', type: 'alert', title: 'Alerta crítico', description: 'Tênis Nike Air Max 90 sem estoque no CD São Paulo', timestamp: subMinutes(new Date(), 8), icon: 'alert-triangle' },
    { id: 'ACT003', type: 'po', title: 'PO confirmado', description: 'TechDistribuidora confirmou PO-2024-0018', timestamp: subMinutes(new Date(), 15), icon: 'check-circle' },
    { id: 'ACT004', type: 'movement', title: 'Transferência concluída', description: '120 unidades de Café Premium: SP → Recife', timestamp: subMinutes(new Date(), 22), icon: 'arrow-right-left' },
    { id: 'ACT005', type: 'user', title: 'Login detectado', description: 'Ana Costa acessou o sistema', timestamp: subMinutes(new Date(), 30), icon: 'user' },
    { id: 'ACT006', type: 'alert', title: 'Estoque baixo', description: 'AirPods Pro 2ª Geração abaixo do ponto de reposição', timestamp: subMinutes(new Date(), 45), icon: 'alert-circle' },
    { id: 'ACT007', type: 'movement', title: 'Saída processada', description: 'SO-0892: 15 MacBook Air M3 despachados', timestamp: subHours(new Date(), 1), icon: 'package-minus' },
    { id: 'ACT008', type: 'po', title: 'PO criado', description: 'Novo pedido para AlimentosBR: R$ 12.450', timestamp: subHours(new Date(), 1.5), icon: 'file-plus' },
  ];
  return activities;
};

// ===== DASHBOARD KPIs =====
export const dashboardKPIs = {
  totalActiveSKUs: { value: skus.filter(s => s.status === 'active').length * 96547, change: 2.3, trend: Array.from({length: 30}, () => Math.floor(Math.random() * 100000) + 4700000) },
  totalStockValue: { value: skus.reduce((acc, s) => acc + (s.stock * s.cost), 0) * 234, change: -1.2, trend: Array.from({length: 30}, () => Math.floor(Math.random() * 10000000) + 150000000) },
  lowStockAlerts: { value: alerts.filter(a => a.type === 'LOW_STOCK' && !a.acknowledged).length, change: 15, trend: Array.from({length: 30}, () => Math.floor(Math.random() * 10) + 2) },
  outOfStockItems: { value: alerts.filter(a => a.type === 'OUT_OF_STOCK').length, change: -25, trend: Array.from({length: 30}, () => Math.floor(Math.random() * 5)) },
  pendingPOs: { value: purchaseOrders.filter(po => ['RASCUNHO', 'ENVIADO', 'CONFIRMADO', 'PARCIAL'].includes(po.status)).length, change: 8, trend: Array.from({length: 30}, () => Math.floor(Math.random() * 15) + 5) },
  fillRate: { value: 94.7, change: 1.5, trend: Array.from({length: 30}, () => Math.random() * 5 + 92) },
};

export const inventoryHealthScore = {
  overall: 78,
  breakdown: {
    stockAvailability: 85,
    turnoverRate: 72,
    deadStock: 68,
    orderFulfillment: 87,
  },
};

// ===== RECEIVING / DOCKS =====
import { Dock, ReceivingSchedule, ReceivingHistory } from '@/types';

const dockStatuses: Dock[] = [
  { id: 'DOCK01', number: 1, name: 'Doca 01 — Secos', status: 'LIVRE' },
  { id: 'DOCK02', number: 2, name: 'Doca 02 — Secos', status: 'OCUPADA', supplierId: 'SUP004', supplierName: 'AlimentosBR Distribuidora', poId: 'PO000001', poNumber: 'PO-2024-0001', arrivalTime: subHours(new Date(), 1.5) },
  { id: 'DOCK03', number: 3, name: 'Doca 03 — Frios', status: 'OCUPADA', supplierId: 'SUP009', supplierName: 'NutriFood Atacado', poId: 'PO000006', poNumber: 'PO-2024-0006', arrivalTime: subMinutes(new Date(), 45) },
  { id: 'DOCK04', number: 4, name: 'Doca 04 — Frios', status: 'AGUARDANDO_CONFERENCIA', supplierId: 'SUP001', supplierName: 'TechDistribuidora LTDA', poId: 'PO000003', poNumber: 'PO-2024-0003', arrivalTime: subHours(new Date(), 3) },
  { id: 'DOCK05', number: 5, name: 'Doca 05 — Congelados', status: 'AGUARDANDO_CONFERENCIA', supplierId: 'SUP002', supplierName: 'ModaExpress Atacado', poId: 'PO000008', poNumber: 'PO-2024-0008', arrivalTime: subHours(new Date(), 2) },
  { id: 'DOCK06', number: 6, name: 'Doca 06 — Congelados', status: 'LIVRE' },
  { id: 'DOCK07', number: 7, name: 'Doca 07 — Geral', status: 'LIVRE' },
  { id: 'DOCK08', number: 8, name: 'Doca 08 — Geral', status: 'BLOQUEADA' },
];

export const docks: Dock[] = dockStatuses;

const todayBase = new Date();
todayBase.setHours(0, 0, 0, 0);
const setTime = (h: number, m: number) => { const d = new Date(todayBase); d.setHours(h, m); return d; };

const driverNames = ['José da Silva', 'Marcos Pereira', 'Antônio Souza', 'Pedro Santos', 'Lucas Oliveira', 'Fernando Costa', 'Rafael Lima', 'Bruno Almeida', 'Diego Nascimento', 'Thiago Ferreira', 'Ricardo Barbosa', 'Gustavo Rocha'];
const plates = ['ABC1D23', 'DEF2G34', 'GHI3H45', 'JKL4J56', 'MNO5K67', 'PQR6L78', 'STU7M89', 'VWX8N90', 'YZA9P01', 'BCD0Q12', 'EFG1R23', 'HIJ2S34'];

const scheduleStatuses: ReceivingSchedule['status'][] = ['AGENDADO', 'CONFIRMADO', 'EM_TRANSITO', 'CHEGOU', 'ATRASADO', 'CANCELADO'];

export const receivingSchedules: ReceivingSchedule[] = Array.from({ length: 12 }, (_, i) => {
  const hour = 6 + Math.floor((i / 12) * 16); // 06:00 to 22:00
  const minute = (i % 4) * 15;
  const supplier = suppliers[i % suppliers.length];
  const po = purchaseOrders[i % purchaseOrders.length];
  const statusIdx = i < 2 ? 3 : i < 4 ? 2 : i < 6 ? 1 : i === 11 ? 5 : i === 10 ? 4 : 0;
  const dockAssigned = i < 5 ? dockStatuses[i] : undefined;
  return {
    id: `SCHED${String(i + 1).padStart(4, '0')}`,
    scheduledTime: setTime(hour, minute),
    supplierId: supplier.id,
    supplierName: supplier.name,
    poId: po.id,
    poNumber: po.number,
    expectedItems: po.lines.length,
    estimatedWeight: Math.floor(Math.random() * 8000) + 500,
    dockId: dockAssigned?.id,
    dockName: dockAssigned?.name,
    driverName: driverNames[i],
    licensePlate: plates[i],
    status: scheduleStatuses[statusIdx],
    notes: i % 3 === 0 ? 'Carga paletizada, necessita empilhadeira' : undefined,
  };
});

const inspectors = ['Carlos Silva', 'Ana Costa', 'Roberto Martins', 'Maria Santos'];
const historyStatuses: ReceivingHistory['status'][] = ['CONCLUIDO', 'COM_DIVERGENCIAS', 'RECUSADO'];

export const receivingHistory: ReceivingHistory[] = Array.from({ length: 20 }, (_, i) => {
  const supplier = suppliers[i % suppliers.length];
  const po = purchaseOrders[i % purchaseOrders.length];
  const status = i < 12 ? 'CONCLUIDO' : i < 17 ? 'COM_DIVERGENCIAS' : 'RECUSADO';
  return {
    id: `REC${String(i + 1).padStart(4, '0')}`,
    date: subDays(new Date(), Math.floor(i * 0.75)),
    supplierId: supplier.id,
    supplierName: supplier.name,
    poId: po.id,
    poNumber: po.number,
    nfNumber: `${Math.floor(Math.random() * 900000) + 100000}`,
    totalItems: Math.floor(Math.random() * 50) + 5,
    totalValue: Math.floor(Math.random() * 150000) + 5000,
    divergences: status === 'CONCLUIDO' ? 0 : Math.floor(Math.random() * 5) + 1,
    inspector: inspectors[i % inspectors.length],
    status,
  };
});

// ===== BATCHES / LOTS =====
const batchCategories: BatchCategory[] = ['Alimentos', 'Frios', 'Laticínios', 'Bebidas', 'Limpeza', 'FLV', 'Padaria'];
const batchProducts: { name: string; cat: BatchCategory; cost: number }[] = [
  { name: 'Leite Integral 1L', cat: 'Laticínios', cost: 5.9 },
  { name: 'Iogurte Natural 170g', cat: 'Laticínios', cost: 3.2 },
  { name: 'Queijo Mussarela 500g', cat: 'Laticínios', cost: 24 },
  { name: 'Presunto Cozido 200g', cat: 'Frios', cost: 12 },
  { name: 'Peito de Peru 200g', cat: 'Frios', cost: 15 },
  { name: 'Mortadela Bologna 500g', cat: 'Frios', cost: 9 },
  { name: 'Banana Prata kg', cat: 'FLV', cost: 4.5 },
  { name: 'Tomate Italiano kg', cat: 'FLV', cost: 8 },
  { name: 'Alface Crespa un', cat: 'FLV', cost: 2.5 },
  { name: 'Maçã Fuji kg', cat: 'FLV', cost: 7 },
  { name: 'Pão Francês kg', cat: 'Padaria', cost: 12 },
  { name: 'Bolo de Chocolate un', cat: 'Padaria', cost: 18 },
  { name: 'Croissant un', cat: 'Padaria', cost: 5 },
  { name: 'Cerveja Lata 350ml', cat: 'Bebidas', cost: 3 },
  { name: 'Suco Natural 1L', cat: 'Bebidas', cost: 8 },
  { name: 'Água Sanitária 2L', cat: 'Limpeza', cost: 5 },
  { name: 'Detergente 500ml', cat: 'Limpeza', cost: 2.5 },
  { name: 'Café Premium 1kg', cat: 'Alimentos', cost: 45 },
  { name: 'Arroz Integral 5kg', cat: 'Alimentos', cost: 22 },
  { name: 'Azeite Extra Virgem 500ml', cat: 'Alimentos', cost: 35 },
];

const binLocations = ['A01-01', 'A01-02', 'A02-01', 'A02-03', 'B01-01', 'B01-02', 'B02-01', 'C01-01', 'C01-03', 'C02-02', 'F01-01', 'F01-02', 'F02-01', 'F02-02', 'R01-01', 'R01-02'];

const generateBatches = (): Batch[] => {
  const batches: Batch[] = [];
  for (let i = 0; i < 60; i++) {
    const prod = batchProducts[i % batchProducts.length];
    const wh = warehouses[i % warehouses.length];
    const supplier = suppliers[i % suppliers.length];

    // Distribute expiry: 5 expired, 8 critical (≤3d), 15 attention (4-7d), rest normal
    let daysToExpiry: number;
    if (i < 5) daysToExpiry = -(Math.floor(Math.random() * 5) + 1); // expired
    else if (i < 13) daysToExpiry = Math.floor(Math.random() * 3) + 1; // critical
    else if (i < 28) daysToExpiry = Math.floor(Math.random() * 4) + 4; // attention
    else daysToExpiry = Math.floor(Math.random() * 90) + 16; // normal

    const expiryDate = addDays(new Date(), daysToExpiry);
    const shelfLife = prod.cat === 'FLV' ? 7 : prod.cat === 'Padaria' ? 3 : prod.cat === 'Frios' ? 30 : prod.cat === 'Laticínios' ? 21 : prod.cat === 'Bebidas' ? 180 : prod.cat === 'Limpeza' ? 365 : 120;
    const mfgDate = subDays(expiryDate, shelfLife);

    let status: Batch['status'];
    if (daysToExpiry < 0) status = 'VENCIDO';
    else if (daysToExpiry <= 3) status = 'CRITICO';
    else if (daysToExpiry <= 7) status = 'ATENCAO';
    else status = 'NORMAL';

    const isCold = ['Frios', 'Laticínios', 'FLV'].includes(prod.cat);

    batches.push({
      id: `BATCH${String(i + 1).padStart(4, '0')}`,
      lotNumber: `LT${String(2024000 + i)}`,
      skuId: `SKU${String((i % 10) + 30).padStart(6, '0')}`,
      skuName: prod.name,
      category: prod.cat,
      quantity: Math.floor(Math.random() * 200) + 10,
      warehouseId: wh.id,
      warehouseName: wh.name,
      binLocation: binLocations[i % binLocations.length],
      manufacturingDate: mfgDate,
      expiryDate,
      supplierId: supplier.id,
      supplierName: supplier.name,
      status,
      temperature: isCold ? parseFloat((Math.random() * 6 + 1).toFixed(1)) : undefined,
    });
  }
  return batches;
};

export const batches: Batch[] = generateBatches();

// Trace events for each batch
export const batchTraceEvents: BatchTraceEvent[] = batches.flatMap((batch, bi) => {
  const events: BatchTraceEvent[] = [
    { id: `BTE${bi}-1`, batchId: batch.id, type: 'ORIGEM', timestamp: batch.manufacturingDate, user: batch.supplierName, description: `Fabricado por ${batch.supplierName}`, details: { 'Lote': batch.lotNumber, 'Fabricação': batch.manufacturingDate.toISOString().split('T')[0] } },
    { id: `BTE${bi}-2`, batchId: batch.id, type: 'RECEBIMENTO', timestamp: addDays(batch.manufacturingDate, 2), user: inspectors[bi % inspectors.length], description: `Recebido na ${batch.warehouseName}`, details: { 'NF': `${Math.floor(Math.random() * 900000) + 100000}`, 'Temp': batch.temperature ? `${batch.temperature}°C` : 'N/A' } },
    { id: `BTE${bi}-3`, batchId: batch.id, type: 'ARMAZENAMENTO', timestamp: addDays(batch.manufacturingDate, 2), user: inspectors[(bi + 1) % inspectors.length], description: `Armazenado em ${batch.binLocation}`, details: { 'Bin': batch.binLocation, 'Armazém': batch.warehouseName } },
  ];
  if (bi % 3 === 0) {
    events.push({ id: `BTE${bi}-4`, batchId: batch.id, type: 'MOVIMENTACAO', timestamp: addDays(batch.manufacturingDate, 5), user: 'João Oliveira', description: 'Transferência interna para área de picking', details: { 'De': batch.binLocation, 'Para': 'PICK-01' } });
  }
  if (batch.status === 'VENCIDO') {
    events.push({ id: `BTE${bi}-5`, batchId: batch.id, type: 'SAIDA', timestamp: new Date(), user: 'Maria Santos', description: 'Baixa por vencimento realizada', details: { 'Motivo': 'VENCIMENTO', 'Qtd': String(batch.quantity) } });
  }
  return events;
});

// Loss records
const lossReasons: LossReason[] = ['VENCIMENTO', 'AVARIA', 'FURTO', 'ERRO_OPERACIONAL', 'PRODUTO_IMPROPRIO'];

export const lossRecords: LossRecord[] = Array.from({ length: 15 }, (_, i) => {
  const prod = batchProducts[i % batchProducts.length];
  const batch = batches[i % batches.length];
  const qty = Math.floor(Math.random() * 30) + 5;
  return {
    id: `LOSS${String(i + 1).padStart(4, '0')}`,
    date: subDays(new Date(), Math.floor(Math.random() * 30)),
    batchId: batch.id,
    lotNumber: batch.lotNumber,
    skuId: batch.skuId,
    skuName: prod.name,
    quantity: qty,
    value: qty * prod.cost,
    reason: i < 6 ? 'VENCIMENTO' : lossReasons[i % lossReasons.length],
    responsible: inspectors[i % inspectors.length],
    category: prod.cat,
  };
});

// ===== PROMOTIONS =====
export const promotions: Promotion[] = [
  {
    id: 'PROMO001', name: 'Semana do Eletrônico', description: '15% off em eletrônicos selecionados',
    type: 'PERCENTUAL', discount: 15, skuIds: ['SKU000001', 'SKU000002', 'SKU000005', 'SKU000006'],
    startDate: subDays(new Date(), 2), endDate: addDays(new Date(), 5), status: 'ATIVA', marginImpact: 12500,
  },
  {
    id: 'PROMO002', name: 'Festival de Inverno Vestuário', description: 'Leve 3 Pague 2 em vestuário',
    type: 'LEVE_X_PAGUE_Y', discount: 33, skuIds: ['SKU000011', 'SKU000012', 'SKU000013', 'SKU000014', 'SKU000015'],
    startDate: subDays(new Date(), 5), endDate: addDays(new Date(), 10), status: 'ATIVA', marginImpact: 8900,
  },
  {
    id: 'PROMO003', name: 'Atacado Especial Alimentos', description: 'Preço especial para compras acima de 10un',
    type: 'PRECO_ESPECIAL_ATACADO', discount: 20, skuIds: ['SKU000030', 'SKU000031', 'SKU000032', 'SKU000033', 'SKU000034'],
    startDate: addDays(new Date(), 3), endDate: addDays(new Date(), 17), status: 'PROGRAMADA', marginImpact: 5600,
  },
];

// ===== MARGIN RULES =====
export const marginRules: MarginRule[] = [
  { category: 'Eletrônicos', minMargin: 15, defaultMarkup: 35, targetMargin: 25, tolerance: 3 },
  { category: 'Vestuário', minMargin: 30, defaultMarkup: 90, targetMargin: 45, tolerance: 5 },
  { category: 'Casa', minMargin: 25, defaultMarkup: 80, targetMargin: 40, tolerance: 5 },
  { category: 'Alimentos', minMargin: 20, defaultMarkup: 60, targetMargin: 35, tolerance: 3 },
  { category: 'Industrial', minMargin: 18, defaultMarkup: 45, targetMargin: 30, tolerance: 4 },
];

// ===== CD AREAS =====
export const cdAreas: CDArea[] = [
  { id: 'AREA01', name: 'Docas de Recebimento', type: 'DOCA_RECEBIMENTO', occupancyPercent: 62, capacity: 8, activeAlerts: 0, corridors: [] },
  { id: 'AREA02', name: 'Docas de Expedição', type: 'DOCA_EXPEDICAO', occupancyPercent: 45, capacity: 6, activeAlerts: 0, corridors: [] },
  { id: 'AREA03', name: 'Câmara Fria (-18°C)', type: 'CAMARA_FRIA', temperature: -18.2, targetTemp: -18, occupancyPercent: 85, capacity: 5000, activeAlerts: 1, corridors: ['CF-A', 'CF-B'] },
  { id: 'AREA04', name: 'Câmara Resfriada (2-8°C)', type: 'CAMARA_RESFRIADA', temperature: 4.5, targetTemp: 5, occupancyPercent: 72, capacity: 8000, activeAlerts: 0, corridors: ['CR-A', 'CR-B'] },
  { id: 'AREA05', name: 'Área Seca', type: 'AREA_SECA', occupancyPercent: 68, capacity: 30000, activeAlerts: 2, corridors: ['A', 'B', 'C', 'D', 'E', 'F'] },
  { id: 'AREA06', name: 'Área FLV', type: 'AREA_FLV', temperature: 12.3, targetTemp: 12, occupancyPercent: 55, capacity: 4000, activeAlerts: 0, corridors: ['FLV-A', 'FLV-B'] },
  { id: 'AREA07', name: 'Área de Separação', type: 'AREA_SEPARACAO', occupancyPercent: 91, capacity: 2000, activeAlerts: 1, corridors: ['SEP-1', 'SEP-2', 'SEP-3'] },
];

// ===== SERVICE ORDERS =====
const cdOperators = ['Marcos Pereira', 'Luciana Santos', 'Fernando Gomes', 'Patricia Lima', 'Ricardo Souza', 'Camila Alves'];
const soTypes: ServiceOrder['type'][] = ['REABASTECIMENTO', 'SEPARACAO', 'TRANSFERENCIA', 'INVENTARIO', 'REORGANIZACAO'];
const soPriorities: ServiceOrder['priority'][] = ['URGENTE', 'ALTA', 'NORMAL', 'BAIXA'];
const soStatuses: ServiceOrder['status'][] = ['ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];

const generatePickingItems = (count: number): PickingItem[] => {
  const corridors = ['A', 'B', 'C', 'D', 'E', 'F'];
  return Array.from({ length: count }, (_, i) => {
    const sku = skus[(i * 3) % skus.length];
    return {
      skuId: sku.id, skuName: sku.name,
      location: `${corridors[i % corridors.length]}-${String(Math.floor(i / 2) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}`,
      lot: `LT${2024000 + i}`, expiry: '12/2025',
      requestedQty: Math.floor(Math.random() * 30) + 5,
      collectedQty: 0, status: 'pending' as const,
    };
  }).sort((a, b) => a.location.localeCompare(b.location));
};

export const serviceOrders: ServiceOrder[] = Array.from({ length: 15 }, (_, i) => {
  const type = soTypes[i % soTypes.length];
  const skuCount = Math.floor(Math.random() * 5) + 1;
  const usedSkus = skus.slice(i * 2, i * 2 + skuCount);
  const origins = ['Câmara Fria', 'Câmara Resfr.', 'Corredor A', 'Corredor B', 'Corredor C', 'Estoque Reserva', 'Área FLV'];
  const dests = ['Gôndola Setor 1', 'Gôndola Setor 2', 'Área de Separação', 'Doca Expedição', 'Corredor E', 'Promoção Central'];
  return {
    id: `OS${String(i + 1).padStart(4, '0')}`,
    number: `OS-${String(i + 1).padStart(4, '0')}`,
    type, priority: soPriorities[i % soPriorities.length],
    skuIds: usedSkus.map(s => s.id), skuNames: usedSkus.map(s => s.name),
    origin: origins[i % origins.length], destination: dests[i % dests.length],
    operator: cdOperators[i % cdOperators.length],
    createdAt: subHours(new Date(), Math.floor(Math.random() * 48)),
    deadline: addHours(new Date(), Math.floor(Math.random() * 8) + 1),
    status: i < 5 ? 'ABERTA' : i < 10 ? 'EM_ANDAMENTO' : i < 13 ? 'CONCLUIDA' : 'CANCELADA',
    items: type === 'SEPARACAO' ? generatePickingItems(Math.floor(Math.random() * 6) + 3) : undefined,
  };
});

// ===== REPLENISHMENT SUGGESTIONS =====
export const replenishmentSuggestions: ReplenishmentSuggestion[] = Array.from({ length: 8 }, (_, i) => {
  const sku = skus[(i * 5) % skus.length];
  return {
    id: `REP${String(i + 1).padStart(4, '0')}`,
    skuId: sku.id, skuName: sku.name,
    currentBin: `${['A', 'B', 'C', 'D'][i % 4]}-${String(i + 1).padStart(2, '0')}-01`,
    currentQty: Math.floor(Math.random() * 5) + 1,
    minQty: 10, suggestedQty: Math.floor(Math.random() * 30) + 15,
    sourceLocation: `EST-${['A', 'B', 'C'][i % 3]}-${String(i + 10).padStart(2, '0')}`,
    urgency: i < 3 ? 'ALTA' : i < 6 ? 'MEDIA' : 'BAIXA',
  };
});

// ===== CYCLE COUNT =====
const today = new Date();
export const cycleCountSchedules: CycleCountSchedule[] = [
  { id: 'CC001', area: 'Área Seca', corridor: 'Corredor A', scheduledDate: today, status: 'PENDENTE', binsCount: 32 },
  { id: 'CC002', area: 'Área Seca', corridor: 'Corredor B', scheduledDate: today, status: 'EM_ANDAMENTO', assignedTo: 'Ricardo Souza', binsCount: 28, divergences: 3 },
  { id: 'CC003', area: 'Câmara Fria', corridor: 'CF-A', scheduledDate: addDays(today, 1), status: 'PENDENTE', binsCount: 18 },
  { id: 'CC004', area: 'Câmara Resfriada', corridor: 'CR-A', scheduledDate: addDays(today, 1), status: 'PENDENTE', binsCount: 22 },
  { id: 'CC005', area: 'Área FLV', corridor: 'FLV-A', scheduledDate: addDays(today, 2), status: 'PENDENTE', binsCount: 15 },
  { id: 'CC006', area: 'Área Seca', corridor: 'Corredor C', scheduledDate: addDays(today, 3), status: 'PENDENTE', binsCount: 30 },
  { id: 'CC007', area: 'Área Seca', corridor: 'Corredor D', scheduledDate: addDays(today, 4), status: 'PENDENTE', binsCount: 35 },
  { id: 'CC008', area: 'Área de Separação', corridor: 'SEP-1', scheduledDate: addDays(today, 5), status: 'CONCLUIDO', assignedTo: 'Camila Alves', binsCount: 12, divergences: 1 },
];

// ===== FINANCIAL AUTOMATION =====

const docSuppliers = ['TechDistribuidora LTDA', 'AlimentosBR Distribuidora', 'NutriFood Atacado', 'Casa & Lar Importações', 'ModaExpress Atacado', 'Eletrônicos Premium', 'IndustrialParts SA', 'Decorações Globais'];
const docCategories = ['Matéria-prima', 'Manutenção', 'Transporte', 'Serviços', 'Material de escritório', 'Embalagens', 'Energia', 'Aluguel'];
const costCenters = ['CD São Paulo', 'CD Recife', 'CD Curitiba', 'Administrativo', 'Logística', 'Comercial'];

function ef(value: string, minConf = 60): { value: string; confidence: number } {
  return { value, confidence: Math.floor(Math.random() * (100 - minConf) + minConf) };
}

export const processedDocuments: ProcessedDocument[] = Array.from({ length: 8 }, (_, i) => {
  const sup = docSuppliers[i % docSuppliers.length];
  const gross = Math.floor(Math.random() * 50000) + 500;
  const tax = Math.round(gross * (Math.random() * 0.15 + 0.05));
  const statuses: ProcessedDocument['status'][] = ['APROVADO', 'PENDENTE_REVISAO', 'REJEITADO', 'LANCADO', 'APROVADO', 'LANCADO', 'PENDENTE_REVISAO', 'APROVADO'];
  return {
    id: `DOC${String(i + 1).padStart(4, '0')}`,
    fileName: `NF_${String(1000 + i)}_${sup.split(' ')[0]}.pdf`,
    fileType: (['PDF', 'XML', 'PDF', 'JPG', 'PDF', 'PNG', 'XML', 'PDF'] as const)[i],
    uploadedAt: subDays(new Date(), Math.floor(Math.random() * 30)),
    processedAt: subDays(new Date(), Math.floor(Math.random() * 28)),
    status: statuses[i],
    supplier: ef(sup, 85),
    cnpj: ef(`${String(Math.floor(Math.random() * 90 + 10))}.${String(Math.floor(Math.random() * 900 + 100))}.${String(Math.floor(Math.random() * 900 + 100))}/0001-${String(Math.floor(Math.random() * 90 + 10))}`, 80),
    nfNumber: ef(String(1000 + i * 137), 95),
    issueDate: ef(format(subDays(new Date(), Math.floor(Math.random() * 30)), 'dd/MM/yyyy'), 92),
    dueDate: ef(format(addDays(new Date(), Math.floor(Math.random() * 30)), 'dd/MM/yyyy'), 88),
    grossValue: ef(`R$ ${gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 90),
    taxes: ef(`R$ ${tax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 75),
    netValue: ef(`R$ ${(gross - tax).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 85),
    category: ef(docCategories[i % docCategories.length], 70),
    costCenter: ef(costCenters[i % costCenters.length], 65),
    notes: ef(i % 3 === 0 ? 'Entrega parcial referente ao pedido #4521' : '', 50),
    processedBy: 'IA OCR v2.1',
  };
});

export const bankAccounts: BankAccount[] = [
  { id: 'BA001', bank: 'Banco do Brasil', agency: '1234-5', account: '12345-6', balance: 1_245_678.90, color: '#f5c542' },
  { id: 'BA002', bank: 'Itaú', agency: '0987', account: '67890-1', balance: 876_543.21, color: '#ef6c00' },
  { id: 'BA003', bank: 'Bradesco', agency: '4567', account: '11223-4', balance: 432_100.55, color: '#cc0000' },
  { id: 'BA004', bank: 'Nubank', agency: '0001', account: '99887-7', balance: 156_789.00, color: '#8a2be2' },
];

const txDescriptions = [
  'PAG FORNEC TECHDIST', 'TRANSF PIX ALIMENT', 'BOLETO ENERGIA', 'PAG FRETE LOGISTICA',
  'DEB AUTO ALUGUEL', 'PIX RECEB CLIENTE A', 'TED RECEB VENDAS', 'PAG SALARIOS',
  'TAXA BANCARIA', 'IOF CAMBIO', 'RECEB DUPLICATA', 'PAG FORNEC NUTRIFOOD',
  'PIX RECEB CLIENTE B', 'BOLETO MANUTENCAO', 'PAG SEGURO', 'RECEB JUROS APLIC',
  'PAG FORNEC MODAEXPR', 'TED FORNEC CASALAR', 'TARIFA MENSAL', 'PIX RECEB DEVOL',
  'PAG IMPOSTOS DARF', 'RECEB ALUGUEL LOJA', 'TED FORNEC ELETPREM', 'PAG FRETE JADLOG',
  'BOLETO TELECOM', 'PIX FORNEC DECORGLO', 'RECEB ROYALTIES', 'PAG COMISSOES',
  'DEB SEGURO CARGA', 'RECEB INDENIZACAO',
];

export const bankTransactions: BankTransaction[] = Array.from({ length: 30 }, (_, i) => {
  const isCredit = i % 4 === 0;
  const val = (Math.floor(Math.random() * 30000) + 200) * (isCredit ? 1 : -1);
  const isException = i >= 25; // last 5 are exceptions
  const exTypes: BankTransaction['exceptionType'][] = ['SEM_MATCH', 'VALOR_DIVERGENTE', 'DATA_DIVERGENTE', 'DUPLICATA_SUSPEITA', 'SEM_MATCH'];
  return {
    id: `TX${String(i + 1).padStart(4, '0')}`,
    date: subDays(new Date(), Math.floor(Math.random() * 28)),
    description: txDescriptions[i % txDescriptions.length],
    value: val,
    accountId: bankAccounts[i % bankAccounts.length].id,
    matchedLedgerId: isException ? undefined : `LE${String(i + 1).padStart(4, '0')}`,
    status: isException ? 'EXCECAO' : (i < 25 ? 'CONCILIADO' : 'PENDENTE'),
    exceptionType: isException ? exTypes[i - 25] : undefined,
  };
});

export const ledgerEntries: LedgerEntry[] = Array.from({ length: 25 }, (_, i) => {
  const tx = bankTransactions[i];
  const hasValueDiv = tx?.exceptionType === 'VALOR_DIVERGENTE';
  return {
    id: `LE${String(i + 1).padStart(4, '0')}`,
    date: tx ? new Date(tx.date) : subDays(new Date(), i),
    description: tx ? tx.description.replace('PAG ', 'LANC ').replace('RECEB ', 'REC ') : `Lançamento ${i + 1}`,
    value: tx ? (hasValueDiv ? tx.value + (Math.random() > 0.5 ? 150 : -150) : tx.value) : 0,
    category: docCategories[i % docCategories.length],
    matchedTransactionId: i < 25 ? tx?.id : undefined,
    status: i < 25 ? 'CONCILIADO' : 'PENDENTE',
  };
});

export const reconciliationHistory: ReconciliationHistory[] = [
  { month: 'Janeiro', year: 2025, totalTransactions: 312, autoReconciled: 305, autoPercent: 97.8, totalValue: 2_345_678 },
  { month: 'Fevereiro', year: 2025, totalTransactions: 287, autoReconciled: 282, autoPercent: 98.3, totalValue: 1_987_432 },
  { month: 'Março', year: 2025, totalTransactions: 345, autoReconciled: 340, autoPercent: 98.6, totalValue: 2_567_890 },
  { month: 'Abril', year: 2025, totalTransactions: 298, autoReconciled: 291, autoPercent: 97.7, totalValue: 2_123_456 },
  { month: 'Maio', year: 2025, totalTransactions: 334, autoReconciled: 330, autoPercent: 98.8, totalValue: 2_456_789 },
  { month: 'Junho', year: 2025, totalTransactions: 310, autoReconciled: 307, autoPercent: 99.0, totalValue: 2_234_567 },
];
