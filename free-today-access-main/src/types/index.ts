export type Scope = 'business' | 'personal';
export type TransactionType = 'revenue' | 'expense';
export type TransactionStatus = 'paid' | 'pending';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  scope: Scope;
  icon: string;
  group: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  category?: Category;
  amount: number;
  date: string;
  description: string;
  type: TransactionType;
  scope: Scope;
  status: TransactionStatus;
  due_date?: string;
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  installments: number;
  interest_rate: number;
  start_date: string;
  created_at: string;
}

export interface LoanInstallment {
  id: string;
  loan_id: string;
  number: number;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date?: string;
}

export interface PeriodFilter {
  type: 'day' | 'week' | 'month' | 'year';
  date: Date;
}
