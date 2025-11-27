import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { PlaidLinkButton } from '../components/PlaidLinkButton';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { Plus, DollarSign, CreditCard, Building, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { usePlaidLink } from 'react-plaid-link';

export const Accounts = () => {
  const { accounts, plaidItems, setAccounts, setPlaidItems } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
    loadPlaidItems();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
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
          }
        } catch (itemError) {
          console.warn(`Failed to load accounts for item ${item.id}:`, itemError);
          // Continue with other items even if one fails
        }
      }
      
      setAccounts(allAccounts || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      // Don't show error toast for new users - it's expected they have no accounts
      if (error instanceof Error && !error.message.includes('No items found')) {
        toast.error('Failed to load accounts');
      }
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaidItems = async () => {
    try {
      const items = await apiService.getPlaidItems();
      // Handle null/undefined responses gracefully
      setPlaidItems(items || []);
    } catch (error) {
      console.error('Failed to load Plaid items:', error);
      // Set empty array on error to handle gracefully
      setPlaidItems([]);
    }
  };

  const handlePlaidSuccess = async (publicToken: string) => {
    try {
      setIsLoading(true);
      await apiService.exchangePublicToken(publicToken);
      toast.success('Bank account connected successfully!');
      
      // Reload accounts and items
      await loadAccounts();
      await loadPlaidItems();
    } catch (error) {
      console.error('Failed to exchange public token:', error);
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

  const totalNetWorth = (accounts || []).reduce((sum, account) => {
    return sum + (account?.balance?.current || 0);
  }, 0);

  const accountsByType = (accounts || []).reduce((acc, account) => {
    const type = account?.type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
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
              <PlaidLinkButton onSuccess={handlePlaidSuccess} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Net Worth</p>
              <p className={`text-4xl font-bold ${totalNetWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalNetWorth)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {accounts.length} connected account{accounts.length !== 1 ? 's' : ''}
              </p>
              {accounts.length === 0 && (
                <p className="text-sm text-pink-600 mt-2 font-medium">
                  Connect your first bank account to get started!
                </p>
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
                        try {
                          // Add remove institution functionality
                          toast.info('Remove institution feature coming soon');
                        } catch (error) {
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
        {Object.entries(accountsByType).map(([type, typeAccounts]) => (
          <Card key={type}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${getAccountTypeColor(type).split(' ')[1]}`}>
                  <div className={getAccountTypeColor(type).split(' ')[0]}>
                    {getAccountTypeIcon(type)}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 capitalize">{type} Accounts</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typeAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-600">{account.subtype} ••••{account.mask}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(account.balance.current)}
                      </p>
                      {account.balance.available !== undefined && (
                        <p className="text-sm text-gray-600">
                          Available: {formatCurrency(account.balance.available)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total {type}</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(typeAccounts.reduce((sum, acc) => sum + acc.balance.current, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {accounts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Connected Accounts</h3>
              <p className="text-gray-600 mb-6">
                Connect your bank accounts to start tracking your net worth and transactions.
              </p>
              <PlaidLinkButton onSuccess={handlePlaidSuccess} />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};