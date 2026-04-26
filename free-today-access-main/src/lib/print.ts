import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ======= Types =======
interface KitchenOrderItem {
  name: string;
  quantity: number;
  notes?: string;
  category?: string;
}

interface KitchenOrder {
  tableNumber?: number | string;
  orderNumber?: string;
  waiterName?: string;
  items: KitchenOrderItem[];
  createdAt?: string;
}

interface ReceiptItem {
  name: string;
  quantity: number;
  total: number;
}

interface CustomerReceipt {
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  footerMessage?: string;
  date: string;
  tableNumber?: string;
  waiterName?: string;
  orderNumber: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  change?: number;
  loyaltyPoints?: number;
  loyaltyBalance?: number;
  pointsToReward?: number;
  showLoyalty?: boolean;
}

interface DeliveryLabel {
  orderNumber: string;
  driverName?: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  addressComplement?: string;
  items: { name: string; quantity: number }[];
  total: number;
  isPaid: boolean;
  paymentMethod?: string;
  changeNeeded?: number;
  notes?: string;
  createdAt?: string;
}

// ======= Helpers =======
const RECEIPT_WIDTH = 72; // mm for 80mm printer
const MARGIN = 4;
const CONTENT_WIDTH = RECEIPT_WIDTH - MARGIN * 2;

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d?: string) {
  if (!d) return new Date().toLocaleDateString('pt-BR');
  return new Date(d).toLocaleDateString('pt-BR');
}

function formatTime(d?: string) {
  if (!d) return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function drawDivider(doc: jsPDF, y: number): number {
  doc.setDrawColor(0);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(MARGIN, y, RECEIPT_WIDTH - MARGIN, y);
  doc.setLineDashPattern([], 0);
  return y + 3;
}

function centerText(doc: jsPDF, text: string, y: number, fontSize: number = 8): number {
  doc.setFontSize(fontSize);
  const w = doc.getTextWidth(text);
  doc.text(text, (RECEIPT_WIDTH - w) / 2, y);
  return y + fontSize * 0.5;
}

function leftRight(doc: jsPDF, left: string, right: string, y: number, fontSize: number = 8): number {
  doc.setFontSize(fontSize);
  doc.text(left, MARGIN, y);
  const rw = doc.getTextWidth(right);
  doc.text(right, RECEIPT_WIDTH - MARGIN - rw, y);
  return y + fontSize * 0.45;
}

// ======= Kitchen Order =======
export function printKitchenOrder(order: KitchenOrder): void {
  const doc = new jsPDF({ unit: 'mm', format: [RECEIPT_WIDTH, 200] });
  doc.setFont('courier', 'bold');
  let y = 8;

  y = centerText(doc, 'COMANDA COZINHA', y, 14);
  y += 2;

  doc.setFont('courier', 'normal');
  const headerParts = [];
  if (order.tableNumber) headerParts.push(`Mesa ${order.tableNumber}`);
  headerParts.push(formatTime(order.createdAt));
  y = centerText(doc, headerParts.join(' • '), y, 9);

  if (order.waiterName) {
    y = centerText(doc, `Garçom: ${order.waiterName}`, y + 1, 8);
  }
  y += 1;
  y = drawDivider(doc, y);

  // Group items by category
  const grouped: Record<string, KitchenOrderItem[]> = {};
  order.items.forEach(item => {
    const cat = item.category || 'Outros';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  doc.setFont('courier', 'bold');
  for (const [, items] of Object.entries(grouped)) {
    for (const item of items) {
      doc.setFontSize(11);
      doc.text(`${item.quantity}x ${item.name}`, MARGIN, y);
      y += 4.5;
      if (item.notes) {
        doc.setFont('courier', 'italic');
        doc.setFontSize(8);
        doc.text(`  obs: ${item.notes}`, MARGIN, y);
        y += 3.5;
        doc.setFont('courier', 'bold');
      }
    }
  }

  y = drawDivider(doc, y + 1);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  if (order.orderNumber) {
    y = centerText(doc, `Pedido #${order.orderNumber}`, y, 8);
  }
  y = centerText(doc, `${formatTime(order.createdAt)} • ${formatDate(order.createdAt)}`, y + 1, 8);

  // Trim PDF height
  const finalHeight = y + 8;
  const trimmed = new jsPDF({ unit: 'mm', format: [RECEIPT_WIDTH, finalHeight] });
  // Re-render at correct height
  renderKitchenContent(trimmed, order);

  trimmed.autoPrint();
  window.open(trimmed.output('bloburl'), '_blank');
}

function renderKitchenContent(doc: jsPDF, order: KitchenOrder) {
  doc.setFont('courier', 'bold');
  let y = 8;
  y = centerText(doc, 'COMANDA COZINHA', y, 14);
  y += 2;
  doc.setFont('courier', 'normal');
  const headerParts = [];
  if (order.tableNumber) headerParts.push(`Mesa ${order.tableNumber}`);
  headerParts.push(formatTime(order.createdAt));
  y = centerText(doc, headerParts.join(' • '), y, 9);
  if (order.waiterName) y = centerText(doc, `Garçom: ${order.waiterName}`, y + 1, 8);
  y += 1;
  y = drawDivider(doc, y);

  const grouped: Record<string, KitchenOrderItem[]> = {};
  order.items.forEach(item => {
    const cat = item.category || 'Outros';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  doc.setFont('courier', 'bold');
  for (const [, items] of Object.entries(grouped)) {
    for (const item of items) {
      doc.setFontSize(11);
      doc.text(`${item.quantity}x ${item.name}`, MARGIN, y);
      y += 4.5;
      if (item.notes) {
        doc.setFont('courier', 'italic');
        doc.setFontSize(8);
        doc.text(`  obs: ${item.notes}`, MARGIN, y);
        y += 3.5;
        doc.setFont('courier', 'bold');
      }
    }
  }

  y = drawDivider(doc, y + 1);
  doc.setFont('courier', 'normal');
  if (order.orderNumber) y = centerText(doc, `Pedido #${order.orderNumber}`, y, 8);
  centerText(doc, `${formatTime(order.createdAt)} • ${formatDate(order.createdAt)}`, y + 1, 8);
}

// ======= Customer Receipt =======
export function printCustomerReceipt(receipt: CustomerReceipt): void {
  const doc = new jsPDF({ unit: 'mm', format: [RECEIPT_WIDTH, 300] });
  doc.setFont('courier', 'bold');
  let y = 8;

  // Header
  y = centerText(doc, receipt.restaurantName || '🍕 RESTAURANTE', y, 12);
  y += 1;
  if (receipt.restaurantAddress) {
    doc.setFont('courier', 'normal');
    y = centerText(doc, receipt.restaurantAddress, y, 7);
  }
  if (receipt.restaurantPhone) {
    y = centerText(doc, `Tel: ${receipt.restaurantPhone}`, y + 1, 7);
  }
  y += 1;
  y = drawDivider(doc, y);

  // Order info
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  y = leftRight(doc, `Data: ${receipt.date}`, formatTime(), y);
  y += 1;
  if (receipt.tableNumber) { y = leftRight(doc, `Mesa: ${receipt.tableNumber}`, receipt.waiterName ? `Atend: ${receipt.waiterName}` : '', y); y += 1; }
  y = leftRight(doc, `Pedido: #${receipt.orderNumber}`, '', y);
  y += 1;
  y = drawDivider(doc, y);

  // Items header
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  y = leftRight(doc, 'ITEM', 'TOTAL', y);
  y += 1;
  doc.setFont('courier', 'normal');

  for (const item of receipt.items) {
    const name = item.name.length > 20 ? item.name.substring(0, 20) + '.' : item.name;
    y = leftRight(doc, `${name}  ${item.quantity}x`, formatCurrency(item.total), y, 7);
    y += 1;
  }

  y = drawDivider(doc, y);

  // Totals
  doc.setFont('courier', 'normal');
  y = leftRight(doc, 'Subtotal:', formatCurrency(receipt.subtotal), y);
  y += 1;
  if (receipt.discount > 0) {
    y = leftRight(doc, 'Desconto:', `-${formatCurrency(receipt.discount)}`, y);
    y += 1;
  }
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  y = leftRight(doc, 'TOTAL:', formatCurrency(receipt.total), y, 10);
  y += 1;
  y = drawDivider(doc, y);

  // Payment
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  y = leftRight(doc, 'Pagamento:', receipt.paymentMethod, y);
  y += 1;
  if (receipt.change !== undefined && receipt.change > 0) {
    y = leftRight(doc, 'Troco:', formatCurrency(receipt.change), y);
    y += 1;
  }

  // Loyalty
  if (receipt.showLoyalty && receipt.loyaltyPoints !== undefined) {
    y = drawDivider(doc, y);
    y = leftRight(doc, 'Pontos ganhos:', `${receipt.loyaltyPoints} pts`, y);
    y += 1;
    if (receipt.loyaltyBalance !== undefined) {
      y = leftRight(doc, 'Saldo:', `${receipt.loyaltyBalance} pts`, y);
      y += 1;
    }
    if (receipt.pointsToReward !== undefined && receipt.pointsToReward > 0) {
      y = centerText(doc, `Faltam ${receipt.pointsToReward} pts p/ resgate`, y, 7);
    }
  }

  y = drawDivider(doc, y + 1);

  // Footer
  const footer = receipt.footerMessage || 'Obrigado pela preferência!';
  y = centerText(doc, footer, y, 8);

  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}

// ======= Delivery Label =======
export function printDeliveryOrder(label: DeliveryLabel): void {
  const doc = new jsPDF({ unit: 'mm', format: [RECEIPT_WIDTH, 250] });
  doc.setFont('courier', 'bold');
  let y = 8;

  y = centerText(doc, `🛵 ENTREGA #${label.orderNumber}`, y, 12);
  y += 1;
  doc.setFont('courier', 'normal');
  const parts = [formatTime(label.createdAt)];
  if (label.driverName) parts.push(label.driverName);
  y = centerText(doc, parts.join(' • '), y, 8);
  y += 1;
  y = drawDivider(doc, y);

  // Customer info
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text(`CLIENTE: ${label.customerName}`, MARGIN, y);
  y += 4;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  if (label.customerPhone) {
    doc.text(`TEL: ${label.customerPhone}`, MARGIN, y);
    y += 3.5;
  }
  doc.text(`END: ${label.address}`, MARGIN, y, { maxWidth: CONTENT_WIDTH });
  y += label.address.length > 30 ? 7 : 3.5;
  if (label.addressComplement) {
    doc.text(`     ${label.addressComplement}`, MARGIN, y);
    y += 3.5;
  }

  y = drawDivider(doc, y + 1);

  // Items
  doc.setFont('courier', 'bold');
  for (const item of label.items) {
    doc.setFontSize(9);
    doc.text(`${item.quantity}x ${item.name}`, MARGIN, y);
    y += 4;
  }

  y = drawDivider(doc, y + 1);

  // Payment info
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  y = leftRight(doc, 'TOTAL:', formatCurrency(label.total), y, 10);
  y += 2;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  y = leftRight(doc, 'PAGO:', label.isPaid ? `Sim (${label.paymentMethod || ''})` : 'Não', y);
  y += 1;
  if (!label.isPaid && label.changeNeeded !== undefined && label.changeNeeded > 0) {
    y = leftRight(doc, 'TROCO P/:', formatCurrency(label.changeNeeded), y);
    y += 1;
  } else {
    y = leftRight(doc, 'TROCO:', 'Não necessário', y);
    y += 1;
  }

  // Notes
  if (label.notes) {
    y = drawDivider(doc, y);
    doc.setFont('courier', 'italic');
    doc.setFontSize(8);
    doc.text(`Obs: ${label.notes}`, MARGIN, y, { maxWidth: CONTENT_WIDTH });
  }

  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}

// ======= Payment method labels =======
export function paymentMethodLabel(m: string): string {
  const map: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    cartao: 'Cartão',
    app: 'App',
  };
  return map[m] || m;
}
