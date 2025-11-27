import { useState, useEffect, useCallback } from 'react';
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
  const [hasError, setHasError] = useState(false);
  const [isCreatingLinkToken, setIsCreatingLinkToken] = useState(false);

  // Only load existing data on mount - no automatic link token creation
  useEffect(() => {
    loadAccounts();
    loadPlaidItems();
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
          }
        } catch (itemError) {
          console.warn(`Failed to load accounts for item ${item.id}:`, itemError);
          // Continue with other items even if one fails
        }
      }
      
      setAccounts(allAccounts || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
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

  const createLinkToken = async () => {
    try {
      setIsCreatingLinkToken(true);
      const response = await apiService.createLinkToken();
      setLinkToken(response.link_token);
      return response.link_token;
    } catch (error) {
      console.error('Failed to create link token:', error);
      toast.error('Failed to initialize bank connection');
      throw error;
    } finally {
      setIsCreatingLinkToken(false);
    }
  };

  const handleFirstAccountConnection = useCallback(async () => {
    try {
      if (!linkToken) {
        // Only create token if we don't have one
        await createLinkToken();
        // The usePlaidLink hook will automatically pick up the new token
      }
    } catch (error) {
      console.error('Failed to create link token:', error);
      toast.error('Failed to initialize bank connection');
    }
  }, [linkToken]);

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

  // Plaid Link configuration for the main page - must be after handlePlaidSuccess is defined
  const config = {
    token: linkToken,
    onSuccess: handlePlaidSuccess,
    onExit: (err: any, metadata: any) => {
      if (err) {
        console.error('Plaid Link exit error:', err);
        toast.error('Bank connection cancelled or failed');
      }
    },
    onEvent: (eventName: string, metadata: any) => {
      // Log Plaid Link events for debugging
      console.log('Plaid Link event:', eventName, metadata);
    },
  };

  const { open, ready } = usePlaidLink(config);

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
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mb-4"></div>
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
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
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
              <p className={`text-4xl font-bold ${totalNetWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalNetWorth)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {accounts.length} connected account{accounts.length !== 1 ? 's' : ''}
              </p>
              {accounts.length === 0 && (
                <div className="mt-4">
                  <p className="text-sm text-pink-600 mb-3 font-medium">
                    Connect your first bank account to get started!
                  </p>
                  <button
                    onClick={() => {
                      if (ready && linkToken) {
                        // If we have a token and Plaid Link is ready, open it
                        open();
                      } else if (!linkToken && !isCreatingLinkToken) {
                        // If no token exists, create one first
                        handleFirstAccountConnection();
                      }
                    }}
                    disabled={isCreatingLinkToken}
                    className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                  >
                    {isCreatingLinkToken ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Connect Bank Account</span>
                      </>
                    )}
                  </button>
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
        {Object.entries(accountsByType).length > 0 && Object.entries(accountsByType).map(([type, typeAccounts]) => (
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
                      <p className="font-medium text-gray-900">{account.name || 'Unknown Account'}</p>
                      <p className="text-sm text-gray-600">
                        {account.subtype || account.type || 'Unknown'} {account.mask ? `••••${account.mask}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(account?.balance?.current || 0)}
                      </p>
                      {account?.balance?.available !== undefined && (
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
                      {formatCurrency(typeAccounts.reduce((sum, acc) => sum + (acc?.balance?.current || 0), 0))}
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
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-pink-600" />
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