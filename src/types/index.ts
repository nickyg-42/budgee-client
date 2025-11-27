export interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string;
  category: string[];
  primary_category: string;
  detailed_category: string;
  pending: boolean;
  account_owner?: string;
  transaction_id: string;
}

export interface Account {
  id: string;
  item_id: string;
  name: string;
  type: string;
  subtype: string;
  mask?: string;
  balance: {
    available?: number;
    current: number;
    limit?: number;
  };
}

export interface PlaidItem {
  id: string;
  user_id: string;
  access_token: string;
  item_id: string;
  institution_name: string;
  institution_id: string;
  created_at: string;
  updated_at: string;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savings_rate: number;
}

export interface DashboardStats {
  current_month: MonthlySummary;
  previous_month: MonthlySummary;
  top_categories: CategorySpending[];
  accounts: Account[];
  net_worth: number;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  estimated_amount: number;
  upcoming_date: string;
  frequency: string;
}

export interface FilterOptions {
  search: string;
  account: string;
  user: string;
  primary_category: string;
  detailed_category: string;
  tags: string;
  date_from: string;
  date_to: string;
  amount_min: string;
  amount_max: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at?: string;
  password_hash?: string;
}

export interface AuthResponse {
  user?: User;
  token: string;
  user_id?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
}