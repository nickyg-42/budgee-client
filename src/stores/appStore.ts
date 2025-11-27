import { create } from 'zustand';
import { Transaction, Account, PlaidItem, DashboardStats, RecurringTransaction, FilterOptions, User } from '../types';

interface AppState {
  // Data
  transactions: Transaction[];
  accounts: Account[];
  plaidItems: PlaidItem[];
  dashboardStats: DashboardStats | null;
  recurringTransactions: RecurringTransaction[];
  currentUser: User | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Filters
  transactionFilters: FilterOptions;
  
  // Actions
  setTransactions: (transactions: Transaction[]) => void;
  setAccounts: (accounts: Account[]) => void;
  setPlaidItems: (items: PlaidItem[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setRecurringTransactions: (transactions: RecurringTransaction[]) => void;
  setCurrentUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTransactionFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
}

const initialFilters: FilterOptions = {
  search: '',
  account: 'All',
  user: 'All',
  primary_category: 'All',
  detailed_category: 'All',
  tags: 'All',
  date_from: '',
  date_to: '',
  amount_min: '',
  amount_max: '',
};

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  transactions: [],
  accounts: [],
  plaidItems: [],
  dashboardStats: null,
  recurringTransactions: [],
  currentUser: null,
  isLoading: false,
  error: null,
  transactionFilters: initialFilters,

  // Actions
  setTransactions: (transactions) => set({ transactions }),
  setAccounts: (accounts) => set({ accounts }),
  setPlaidItems: (items) => set({ plaidItems: items }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setRecurringTransactions: (transactions) => set({ recurringTransactions: transactions }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setTransactionFilters: (filters) => set((state) => ({
    transactionFilters: { ...state.transactionFilters, ...filters }
  })),
  resetFilters: () => set({ transactionFilters: initialFilters }),
}));