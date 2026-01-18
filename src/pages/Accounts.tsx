import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { PlaidLinkButton } from '../components/PlaidLinkButton';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { DollarSign, CreditCard, Building, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../theme/ThemeContext';

export const Accounts = () => {
  const { accounts, plaidItems, setAccounts, setPlaidItems } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { semantic } = useTheme();
  

  const initRef = useRef(false);

  const initializeData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      const items = await apiService.getPlaidItems();
      setPlaidItems(items || []);
      
      if (!items || items.length === 0) {
        setAccounts([]);
        return;
      }

      const allAccounts: any[] = [];
      
      for (const item of items) {
        try {
          const itemAccounts = await apiService.getAccountsFromDB(item.id);
          
          if (itemAccounts && Array.isArray(itemAccounts)) {
            allAccounts.push(...itemAccounts);
          } else {
            
          }
        } catch (itemError) {
          
        }
      }
      
      setAccounts(allAccounts || []);
    } catch (error) {
      setHasError(true);
      setAccounts([]);
      setPlaidItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Only load existing data on mount (guarded against React StrictMode double-invoke)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initializeData();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      
      // Load accounts from all connected items
      const items = await apiService.getPlaidItems();
      
      // Handle case where user has no Plaid items (new user)
      if (!items || items.length === 0) {
        setAccounts([]);
        setPlaidItems([]);
        return;
      }
      
      const allAccounts = [];
      
      for (const item of items) {
        try {
          const itemAccounts = await apiService.getAccountsFromDB(item.id);
          
          // Handle null/undefined responses gracefully
          if (itemAccounts && Array.isArray(itemAccounts)) {
            allAccounts.push(...itemAccounts);
          } else {
            
          }
        } catch (itemError) {
          // Continue with other items even if one fails
        }
      }
      
      setAccounts(allAccounts || []);
    } catch (error) {
      setHasError(true);
      // Don't show error toast for new users - it's expected they have no accounts
      if (error instanceof Error && !error.message.includes('No items found')) {
        toast.error('Failed to load accounts');
      }
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaidSuccess = async (publicToken: string) => {
    try {
      setIsLoading(true);
      const itemsBefore = plaidItems ? [...plaidItems] : [];
      await apiService.exchangePublicToken(publicToken);
      const newItems = await apiService.getPlaidItems();
      setPlaidItems(newItems || []);
      const newlyAdded = (newItems || []).filter(i => !(itemsBefore || []).some(b => b.id === i.id));
      const targetItems = newlyAdded.length > 0 ? newlyAdded : (newItems || []);
      for (const item of targetItems) {
        try {
          await apiService.getPlaidAccounts(item.id);
          await apiService.syncTransactions(String(item.id));
        } catch (e) {
        }
      }
      toast.success('Bank account connected successfully!');
      localStorage.removeItem('plaid_link_token');
      await initializeData();
    } catch (error) {
      // Extract error message from backend response
      let errorMessage = 'Failed to connect bank account';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  

  const asNumber = (v: any) => {
    const n = typeof v === 'number' ? v : v === undefined || v === null ? 0 : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const getCurrentBalance = (a: any) => asNumber(a?.balance?.current ?? a?.current_balance);
  const getAvailableBalance = (a: any) => asNumber(a?.balance?.available ?? a?.available_balance);

  const totalNetWorth = (accounts || []).reduce((sum, account) => {
    const type = String(account?.type || '').toLowerCase();
    const bal = getCurrentBalance(account);
    const contrib = (type === 'credit' || type === 'loan') ? -Math.abs(bal) : bal;
    return sum + contrib;
  }, 0);

  const accountsByType = (accounts || []).reduce((acc, account) => {
    const category = (account?.type || 'unknown').toLowerCase();
    if (!acc[category]) acc[category] = [];
    acc[category].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

  const institutionNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    (plaidItems || []).forEach((item) => {
      if (item.id) map.set(String(item.id), item.institution_name);
      if (item.item_id) map.set(String(item.item_id), item.institution_name);
    });
    return map;
  }, [plaidItems]);

  const getAccountTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'depository':
        return <DollarSign className="w-5 h-5" />;
      case 'credit':
        return <CreditCard className="w-5 h-5" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5" />;
      case 'loan':
        return <Building className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    if (!type) return 'text-gray-600 bg-gray-100';
    switch (type.toLowerCase()) {
      case 'depository':
        return 'text-green-600 bg-green-100';
      case 'credit':
        return 'text-red-600 bg-red-100';
      case 'investment':
        return 'text-blue-600 bg-blue-100';
      case 'loan':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 text-center">
            {accounts.length === 0 ? 'Loading your accounts...' : 'Refreshing account data...'}
          </p>
          <p className="text-sm text-gray-500 text-center mt-2">
            This may take a moment for first-time users
          </p>
        </div>
      </Layout>
    );
  }

  // Error state - show retry option
  if (hasError && accounts.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Accounts</h3>
          <p className="text-gray-600 mb-6 text-center max-w-md">
            We couldn't load your account information. This might be due to a temporary connection issue.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={loadAccounts}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Net Worth Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Net Worth Summary</h3>
              {/* Only show the button in header if accounts exist - avoid duplicate Plaid instances */}
              {accounts.length > 0 && <PlaidLinkButton onSuccess={handlePlaidSuccess} />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Net Worth</p>
              <p className="text-4xl font-bold text-black">{formatCurrency(totalNetWorth)}</p>
              <p className="text-sm text-gray-500 mt-2">
                {accounts.length} connected account{accounts.length !== 1 ? 's' : ''}
              </p>
              {accounts.length === 0 && (
                <div className="mt-4">
                  <p className="text-sm text-blue-600 mb-3 font-medium">
                    Connect your first bank account to get started!
                  </p>
                  <div className="mx-auto">
                    <PlaidLinkButton onSuccess={handlePlaidSuccess} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connected Institutions */}
        {plaidItems.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Connected Institutions</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plaidItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.institution_name}</p>
                      <p className="text-sm text-gray-600">
                        Connected {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const ok = window.confirm('Remove this institution? This will also remove its accounts and transactions.');
                        if (!ok) return;
                        try {
                          await apiService.deletePlaidItem(item.id);
                          toast.success('Institution removed');
                          await initializeData();
                        } catch (error) {
                          toast.error('Failed to remove institution');
                          console.error('Failed to remove institution:', error);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts by Type */}
        {Object.entries(accountsByType).length > 0 && Object.entries(accountsByType).map(([category, typeAccounts]) => (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${getAccountTypeColor(category).split(' ')[1]}`}>
                  <div className={getAccountTypeColor(category).split(' ')[0]}>
                    {getAccountTypeIcon(category)}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 capitalize">{category} Accounts</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typeAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{account.name || 'Unknown Account'}</p>
                      <p className="text-sm text-gray-600">
                        {(institutionNameLookup.get(String((account as any).item_id)) || 'Unknown Institution')} • {account.subtype || account.type || 'Unknown'} {account.mask ? `••••${account.mask}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(getCurrentBalance(account))}
                      </p>
                      {(account?.balance?.available !== undefined || (account as any)?.available_balance !== undefined) && (
                        <p className="text-sm text-gray-600">
                          Available: {formatCurrency(getAvailableBalance(account))}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total {category}</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(typeAccounts.reduce((sum, acc) => sum + getCurrentBalance(acc), 0))}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State - Only show if we don't have the connect button in the Net Worth card */}
        {accounts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Connected Accounts</h3>
              <p className="text-gray-600 mb-2">
                Welcome to your financial dashboard! To get started, connect your first bank account.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Once connected, you'll be able to track your net worth, view transactions, and manage your finances all in one place.
              </p>
              <div className="text-xs text-gray-400">
                Your data is encrypted and secure. We use bank-level security to protect your information.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
