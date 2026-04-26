export type TransactionType = 'receita' | 'despesa' | 'transferencia';
export type TransactionStatus = 'pendente' | 'pago' | 'cancelado';
export type BudgetStatus = 'dentro' | 'proximo' | 'estourado';
export type ActivityStatus = 'planejada' | 'em_andamento' | 'finalizada';
export type AccountType = 'corrente' | 'poupanca' | 'caixa' | 'digital' | 'cooperativa';
export type PaymentMethod = 'pix' | 'boleto' | 'cartao' | 'dinheiro' | 'transferencia';
export type PropertyType = 'propria' | 'arrendada';

export interface Account {
  id: string;
  name: string;
  bank: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  color: string;
  active: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  brand: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  linkedAccountId: string;
  invoices: Invoice[];
}

export interface Invoice {
  id: string;
  cardId: string;
  month: number;
  year: number;
  total: number;
  paid: boolean;
  transactions: string[];
}

export interface Property {
  id: string;
  name: string;
  area: number;
  location: string;
  type: PropertyType;
  notes: string;
}

export interface Activity {
  id: string;
  name: string;
  type: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  revenueGoal: number;
  status: ActivityStatus;
}

export interface CostCenter {
  id: string;
  name: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'receita' | 'despesa';
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  dueDate: string;
  accountId: string;
  cardId?: string;
  propertyId: string;
  costCenterId: string;
  activityId: string;
  categoryId: string;
  subcategoryId?: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  installments?: number;
  currentInstallment?: number;
  parentId?: string;
  recurring?: boolean;
  recurringFrequency?: string;
  notes?: string;
  history: TransactionEvent[];
}

export interface TransactionEvent {
  date: string;
  action: string;
  description: string;
}

export interface Budget {
  id: string;
  propertyId?: string;
  activityId?: string;
  categoryId?: string;
  plannedAmount: number;
  spentAmount: number;
  period: string;
  status: BudgetStatus;
}

export interface Alert {
  id: string;
  type: 'vencimento' | 'fatura' | 'orcamento' | 'safra';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'danger';
}
