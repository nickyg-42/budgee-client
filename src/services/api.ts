import { Transaction, Account, PlaidItem, DashboardStats, RecurringTransaction, User, AuthResponse, LoginRequest, RegisterRequest, Budget, TransactionRule, WhitelistedEmail } from '../types';

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
        const contentType = String(response.headers.get('content-type') || '').toLowerCase();
        let parsed: any = null;
        let rawText: string | null = null;
        if (contentType.includes('application/json')) {
          try {
            parsed = await response.json();
          } catch {}
        } else {
          try {
            rawText = await response.text();
          } catch {}
        }
        if (parsed && (parsed.message || parsed.error)) {
          errorMessage = String(parsed.message || parsed.error);
        } else if (rawText && rawText.trim().length > 0) {
          errorMessage = rawText.trim();
        } else {
          errorMessage = response.statusText || errorMessage;
        }

        if (response.status === 401) {
          // Handle unauthorized access
          this.token = null;
          localStorage.removeItem('token');
          // Don't redirect here, let the component handle it
        } else if (response.status === 403) {
          const msg = String(errorMessage || '').toLowerCase();
          const lockedDetected = msg.includes('locked') || (parsed && parsed.locked === true);
          if (lockedDetected) {
            this.token = null;
            localStorage.removeItem('token');
            try {
              window.location.href = '/login';
            } catch {}
          }
        }
        
        const error: any = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const okContentType = String(response.headers.get('content-type') || '').toLowerCase();
      const contentLength = String(response.headers.get('content-length') || '');
      const isNoContent = response.status === 204 || contentLength === '0';
      if (isNoContent) return null;
      if (okContentType.includes('application/json')) {
        try {
          return await response.json();
        } catch {
          return null;
        }
      }
      try {
        const text = await response.text();
        return text && text.length > 0 ? text : null;
      } catch {
        return null;
      }
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
  async getAllPlaidItemsFromDB(): Promise<PlaidItem[]> {
    return this.fetchWithErrorHandling('/plaid/items/all/db');
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
  async deleteAdminPlaidItem(itemId: string): Promise<{ success: boolean }>{
    return this.fetchWithErrorHandling(`/admin/plaid/items/${itemId}`, {
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

  async createTransaction(data: { account_id: string | number; amount: number; date: string; name: string; merchant_name?: string; primary_category: string; detailed_category?: string; payment_channel?: string; expense: boolean }): Promise<Transaction> {
    return this.fetchWithErrorHandling('/plaid/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    return this.fetchWithErrorHandling('/budgets');
  }

  async createBudget(payload: { personal_finance_category: string; amount: number }): Promise<Budget> {
    return this.fetchWithErrorHandling('/budgets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateBudget(id: number, payload: { amount?: number; personal_finance_category?: string }): Promise<Budget> {
    return this.fetchWithErrorHandling(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteBudget(id: number): Promise<{ success: boolean }> {
    return this.fetchWithErrorHandling(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Transaction Rules
  async getTransactionRules(): Promise<TransactionRule[]> {
    return this.fetchWithErrorHandling('/transaction-rules');
  }

  async getTransactionRule(id: number): Promise<TransactionRule> {
    return this.fetchWithErrorHandling(`/transaction-rules/${id}`);
  }

  async createTransactionRule(payload: { name: string; conditions: any; personal_finance_category: string }): Promise<TransactionRule> {
    return this.fetchWithErrorHandling('/transaction-rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTransactionRule(id: number, payload: { name?: string; conditions?: any; personal_finance_category?: string }): Promise<TransactionRule> {
    return this.fetchWithErrorHandling(`/transaction-rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTransactionRule(id: number): Promise<{ success: boolean }> {
    return this.fetchWithErrorHandling(`/transaction-rules/${id}`, {
      method: 'DELETE',
    });
  }

  async triggerTransactionRules(): Promise<{ message?: string; num_adjusted?: string | number }> {
    return this.fetchWithErrorHandling('/transaction-rules/trigger', {
      method: 'POST',
    });
  }

  // Admin
  async updateAllItemWebhooks(webhook_url: string): Promise<{ success: boolean }>{
    return this.fetchWithErrorHandling('/item/webhook/update-all', {
      method: 'POST',
      body: JSON.stringify({ webhook_url }),
    });
  }

  async recategorizeTransactions(): Promise<{ success: boolean }>{
    return this.fetchWithErrorHandling('/plaid/transactions/recategorize', {
      method: 'POST',
    });
  }
  async clearTransactionsCache(): Promise<{ success: boolean }>{
    return this.fetchWithErrorHandling('/admin/cache/clear/transactions', {
      method: 'POST',
    });
  }
  async clearItemsCache(): Promise<{ success: boolean }>{
    return this.fetchWithErrorHandling('/admin/cache/clear/items', {
      method: 'POST',
    });
  }
  async clearAccountsCache(): Promise<{ success: boolean }>{
    return this.fetchWithErrorHandling('/admin/cache/clear/accounts', {
      method: 'POST',
    });
  }

  async syncUserTransactions(user_id: string | number): Promise<{ results: Array<{ item_id: string; success: boolean; error?: string }> }>{
    return this.fetchWithErrorHandling(`/plaid/transactions/sync/${user_id}`, {
      method: 'POST',
    });
  }

  async getUsers(): Promise<User[]> {
    return this.fetchWithErrorHandling('/admin/users');
  }

  async updateUserAdmin(user_id: number, payload: { first_name?: string; last_name?: string; email?: string; password?: string }): Promise<User> {
    return this.fetchWithErrorHandling(`/admin/user/${user_id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteUserAdmin(user_id: number): Promise<{ success: boolean }> {
    return this.fetchWithErrorHandling(`/admin/user/${user_id}`, {
      method: 'DELETE',
    });
  }

  // Whitelisted Emails
  async getWhitelistedEmails(): Promise<WhitelistedEmail[]> {
    return this.fetchWithErrorHandling('/admin/whitelisted-emails');
  }

  async createWhitelistedEmail(email: string): Promise<WhitelistedEmail> {
    return this.fetchWithErrorHandling('/admin/whitelisted-emails', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
  
  async deleteWhitelistedEmail(email_id: number): Promise<{ success: boolean }> {
    return this.fetchWithErrorHandling(`/admin/whitelisted-emails/${email_id}`, {
      method: 'DELETE',
    });
  }

  async lockUser(user_id: number): Promise<{ success: boolean }> {
    return this.fetchWithErrorHandling(`/admin/user/lock/${user_id}`, {
      method: 'POST',
    });
  }

  async unlockUser(user_id: number): Promise<{ success: boolean }> {
    return this.fetchWithErrorHandling(`/admin/user/unlock/${user_id}`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();
