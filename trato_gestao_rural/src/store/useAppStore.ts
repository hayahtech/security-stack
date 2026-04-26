import { create } from 'zustand';
import type { Account, CreditCard, Property, Activity, CostCenter, Category, Transaction, Budget, Alert } from '@/types';
import { mockAccounts, mockCards, mockProperties, mockActivities, mockCostCenters, mockCategories, mockTransactions, mockBudgets, mockAlerts } from '@/mock/data';

interface AppState {
  accounts: Account[];
  cards: CreditCard[];
  properties: Property[];
  activities: Activity[];
  costCenters: CostCenter[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  alerts: Alert[];
  darkMode: boolean;
  hideValues: boolean;

  // Actions
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  markAsPaid: (id: string) => void;
  addAccount: (account: Account) => void;
  updateAccount: (id: string, data: Partial<Account>) => void;
  addProperty: (property: Property) => void;
  addActivity: (activity: Activity) => void;
  addCostCenter: (cc: CostCenter) => void;
  addCategory: (cat: Category) => void;
  toggleDarkMode: () => void;
  toggleHideValues: () => void;
  dismissAlert: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  accounts: mockAccounts,
  cards: mockCards,
  properties: mockProperties,
  activities: mockActivities,
  costCenters: mockCostCenters,
  categories: mockCategories,
  transactions: mockTransactions,
  budgets: mockBudgets,
  alerts: mockAlerts,
  darkMode: localStorage.getItem('darkMode') === 'true',
  hideValues: localStorage.getItem('hideValues') === 'true',

  addTransaction: (tx) => set((s) => {
    const accounts = s.accounts.map(a => {
      if (a.id === tx.accountId) {
        const delta = tx.type === 'receita' ? tx.amount : -tx.amount;
        return { ...a, balance: a.balance + delta };
      }
      return a;
    });
    return { transactions: [tx, ...s.transactions], accounts };
  }),

  updateTransaction: (id, data) => set((s) => ({
    transactions: s.transactions.map(t => t.id === id ? { ...t, ...data } : t),
  })),

  deleteTransaction: (id) => set((s) => ({
    transactions: s.transactions.filter(t => t.id !== id),
  })),

  markAsPaid: (id) => set((s) => ({
    transactions: s.transactions.map(t =>
      t.id === id
        ? { ...t, status: 'pago' as const, history: [...t.history, { date: new Date().toISOString().split('T')[0], action: 'Pago', description: 'Marcado como pago' }] }
        : t
    ),
  })),

  addAccount: (account) => set((s) => ({ accounts: [...s.accounts, account] })),
  updateAccount: (id, data) => set((s) => ({
    accounts: s.accounts.map(a => a.id === id ? { ...a, ...data } : a),
  })),
  addProperty: (property) => set((s) => ({ properties: [...s.properties, property] })),
  addActivity: (activity) => set((s) => ({ activities: [...s.activities, activity] })),
  addCostCenter: (cc) => set((s) => ({ costCenters: [...s.costCenters, cc] })),
  addCategory: (cat) => set((s) => ({ categories: [...s.categories, cat] })),
  dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter(a => a.id !== id) })),

  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    localStorage.setItem('darkMode', String(next));
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { darkMode: next };
  }),

  toggleHideValues: () => set((s) => {
    const next = !s.hideValues;
    localStorage.setItem('hideValues', String(next));
    return { hideValues: next };
  }),
}));

// Initialize dark mode
if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.classList.add('dark');
}
