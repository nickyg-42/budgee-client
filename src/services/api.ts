import { Transaction, Account, PlaidItem, DashboardStats, RecurringTransaction, User, AuthResponse, LoginRequest, RegisterRequest } from '../types';

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async fetchWithErrorHandling(url: string, options?: RequestInit) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.headers as Record<string, string>,
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_ROOT}/api${url}`,
      {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse JSON error, use status text
          errorMessage = response.statusText || errorMessage;
        }

        if (response.status === 401) {
          // Handle unauthorized access
          this.token = null;
          localStorage.removeItem('token');
          // Don't redirect here, let the component handle it
        }
        
        const error: any = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      
      throw error;
    }
  }

  // Plaid Integration
  async createLinkToken() {
    const res = await this.fetchWithErrorHandling('/plaid/create-link-token', {
      method: 'POST',
    });
    if (typeof res === 'string') {
      return { link_token: res };
    }
    if (res && res.link_token) {
      return res;
    }
    if (res && res.linkToken) {
      return { link_token: res.linkToken };
    }
    return res;
  }

  async exchangePublicToken(publicToken: string) {
    return this.fetchWithErrorHandling('/plaid/exchange-public-token', {
      method: 'POST',
      body: JSON.stringify({ public_token: publicToken }),
    });
  }

  async getPlaidItems(): Promise<PlaidItem[]> {
    return this.fetchWithErrorHandling('/plaid/items');
  }

  async getPlaidAccounts(itemId: string): Promise<Account[]> {
    return this.fetchWithErrorHandling(`/plaid/accounts/${itemId}`);
  }

  async getAccountsFromDB(itemId: string): Promise<Account[]> {
    return this.fetchWithErrorHandling(`/plaid/accounts/${itemId}/db`);
  }

  async syncTransactions(itemId: string) {
    return this.fetchWithErrorHandling(`/plaid/transactions/${itemId}/sync`);
  }

  async getTransactions(accountId: string): Promise<Transaction[]> {
    return this.fetchWithErrorHandling(`/plaid/transactions/${accountId}`);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return this.fetchWithErrorHandling('/plaid/transactions');
  }

  async getDashboardData(): Promise<DashboardStats> {
    return this.fetchWithErrorHandling('/plaid/dashboard');
  }

  // Authentication
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.fetchWithErrorHandling('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.fetchWithErrorHandling('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  async getCurrentUser(userId: number): Promise<User> {
    return this.fetchWithErrorHandling(`/user/${userId}`);
  }

  async updateUser(data: Partial<User>): Promise<User> {
    return this.fetchWithErrorHandling('/user', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { current_password: string; new_password: string }): Promise<{ success: boolean }>{
    return this.fetchWithErrorHandling('/user/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(userId: number): Promise<{ success: boolean }>{
    const res = await this.fetchWithErrorHandling('/user', {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId })
    });
    this.token = null;
    localStorage.removeItem('token');
    try {
      window.location.href = '/register';
    } catch {}
    return res;
  }

  async deletePlaidItem(itemId: string): Promise<{ success: boolean }>{
    return this.fetchWithErrorHandling(`/plaid/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async deleteTransaction(transactionId: string): Promise<{ success: boolean }>{
    return this.fetchWithErrorHandling(`/plaid/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }

  async updateTransaction(transactionId: string, data: { merchant_name?: string; date?: string; amount?: number; primary_category?: string; name?: string; detailed_category?: string; payment_channel?: string; personal_finance_category_icon_url?: string }): Promise<any> {
    return this.fetchWithErrorHandling(`/plaid/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Dashboard Data
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await this.getDashboardData();
    } catch (error) {
      // Fallback mock data if backend endpoint doesn't exist yet
      return {
        current_month: {
          month: 'November',
          income: 2079,
          expenses: 3591,
          savings: -1513,
          savings_rate: 0
        },
        previous_month: {
          month: 'October',
          income: 1008,
          expenses: 1392,
          savings: -384,
          savings_rate: 0
        },
        top_categories: [
          { category: 'GENERAL MERCHANDISE', amount: -2078.50, percentage: 57.9 },
          { category: 'ENTERTAINMENT', amount: -1000.00, percentage: 27.9 },
          { category: 'TRAVEL', amount: -500.00, percentage: 13.9 },
          { category: 'TRANSPORTATION', amount: -12.66, percentage: 0.3 }
        ],
        accounts: [],
        net_worth: 113498
      };
    }
  }

  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    // Mock data for now - replace with actual endpoint when available
    return [
      {
        id: '1',
        name: 'INTRST PYMNT',
        estimated_amount: 4,
        upcoming_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'monthly'
      },
      {
        id: '2',
        name: "McDonald's",
        estimated_amount: -12,
        upcoming_date: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'monthly'
      },
      {
        id: '3',
        name: 'Starbucks',
        estimated_amount: -4,
        upcoming_date: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'monthly'
      },
      {
        id: '4',
        name: 'United Airlines',
        estimated_amount: -500,
        upcoming_date: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'monthly'
      },
      {
        id: '5',
        name: 'Touchstone Climbing',
        estimated_amount: -79,
        upcoming_date: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'monthly'
      },
      {
        id: '6',
        name: 'CD DEPOSIT .INI',
        estimated_amount: -1000,
        upcoming_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'monthly'
      }
    ];
  }
}

export const apiService = new ApiService();
