import { useEffect, useState, useRef } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Search, Edit, Trash2, Plus, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';

export const Transactions = () => {
  const { transactions, setTransactions, transactionFilters, setTransactionFilters, accounts, setAccounts, plaidItems, setPlaidItems } = useAppStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const loadTransactions = async () => {
      try {
        setIsLoading(true);
        console.log('Transactions: starting load');
        const items = await apiService.getPlaidItems();
        console.log('Transactions: items loaded', items);
        setPlaidItems(items || []);
        if (!items || items.length === 0) {
          console.log('Transactions: no items, finishing');
          setTransactions([]);
          setIsLoading(false);
          return;
        }

        await Promise.all(items.map((item) => {
          const iid = item.id;
          console.log('Transactions: syncing item', iid);
          return apiService.syncTransactions(String(iid)).catch((e) => {
            console.error('Transactions: sync failed for item', iid, e);
            return null;
          });
        }));

        const allAccounts: any[] = [];
        const accountsByItem = await Promise.all(items.map((item) => {
          console.log('Transactions: loading accounts for item', item.id);
          return apiService.getAccountsFromDB(item.id).catch((e) => {
            console.error('Transactions: load accounts failed for item', item.id, e);
            return [];
          });
        }));
        accountsByItem.forEach((arr) => allAccounts.push(...(arr || [])));
        console.log('Transactions: total accounts loaded', allAccounts.length);
        setAccounts(allAccounts || []);

        const txnsByAccount = await Promise.all((allAccounts || []).map((acc) => {
          console.log('Transactions: loading transactions for account', acc.id);
          return apiService.getTransactions(acc.id).catch((e) => {
            console.error('Transactions: load transactions failed for account', acc.id, e);
            return [];
          });
        }));
        const normalized = (txnsByAccount || []).map((arr) => Array.isArray(arr) ? arr : (arr ? [arr] : []));
        const allTxns = ([] as any[]).concat(...normalized).filter((t) => !!t && typeof t === 'object');
        console.log('Transactions: total transactions loaded', allTxns.length);
        setTransactions(allTxns as any);
        toast.success('Transactions synced');
      } catch (error) {
        console.error('Failed to sync and load transactions:', error);
        toast.error('Failed to load transactions');
      } finally {
        console.log('Transactions: finishing load');
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const monthlyChartData = [
    { month: 'Jul 2023', income: 1500, expenses: 1200 },
    { month: 'Aug 2023', income: 1800, expenses: 1400 },
    { month: 'Sep 2023', income: 2100, expenses: 1600 },
    { month: 'Oct 2023', income: 1900, expenses: 1500 },
    { month: 'Nov 2023', income: 2079, expenses: 3591 },
  ];

  const asNumber = (v: any) => {
    const n = typeof v === 'number' ? v : v === undefined || v === null ? 0 : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const safeName = (t: any) => (t?.name ?? t?.merchant_name ?? '');
  const safePrimaryCategory = (t: any) => (t?.primary_category ?? t?.category ?? '');
  const safeDetailedCategory = (t: any) => (t?.detailed_category ?? '');

  const filteredTransactions = (transactions || []).filter(transaction => {
    if (!transaction || typeof transaction !== 'object') {
      return false;
    }
    const name = safeName(transaction).toLowerCase();
    if (transactionFilters.search && !name.includes(transactionFilters.search.toLowerCase())) {
      return false;
    }
    if (transactionFilters.account !== 'All' && String(transaction.account_id) !== transactionFilters.account) {
      return false;
    }
    if (transactionFilters.primary_category !== 'All' && safePrimaryCategory(transaction) !== transactionFilters.primary_category) {
      return false;
    }
    if (transactionFilters.detailed_category !== 'All' && safeDetailedCategory(transaction) !== transactionFilters.detailed_category) {
      return false;
    }
    return true;
  });

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => String((t as any).id)).filter(Boolean)));
    }
  };

  const handleSelectTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const getAccountName = (accountId: string) => {
    const found = (accounts || []).find(a => a.id === accountId);
    return found?.name || 'Unknown Account';
  };

  return (
    <Layout>
      {/* Date Range and Chart */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-gray-600">
              ←
            </button>
            <div className="bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              July 1, 2023
            </div>
            <div className="bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              November 30, 2023
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              →
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <IncomeExpenseChart data={monthlyChartData} />
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex space-x-2 mb-4">
                <button className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white">
                  <Upload className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white">
                  <Download className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Cash Flow</p>
                  <p className="text-lg font-bold text-green-500">$424</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Income</p>
                  <p className="text-lg font-bold text-green-500">$8,962</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expenses</p>
                  <p className="text-lg font-bold text-pink-500">$8,538</p>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-gray-600">{filteredTransactions.length} Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="text-gray-600 hover:text-gray-900"
              disabled={currentPage === 1}
            >
              ← Previous
            </button>
            <button 
              onClick={() => setCurrentPage(currentPage + 1)}
              className="text-gray-600 hover:text-gray-900"
            >
              Next →
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mr-3"></div>
              <span className="text-gray-600">Loading transactions...</span>
            </div>
          )}
          {/* Filter Row */}
          <div className="border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50">
              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.size === filteredTransactions.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">Name</span>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={transactionFilters.search}
                  onChange={(e) => setTransactionFilters({ search: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              
              <div className="col-span-1">
                <span className="text-sm font-medium">Account</span>
                <select
                  value={transactionFilters.account}
                  onChange={(e) => setTransactionFilters({ account: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="All">All</option>
                  {(accounts || []).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-span-1">
                <span className="text-sm font-medium">User</span>
                <select
                  value={transactionFilters.user}
                  onChange={(e) => setTransactionFilters({ user: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="All">All</option>
                  <option value="tim">tim</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <span className="text-sm font-medium">Primary Category</span>
                <select
                  value={transactionFilters.primary_category}
                  onChange={(e) => setTransactionFilters({ primary_category: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="All">All</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="TRANSPORTATION">Transportation</option>
                  <option value="ENTERTAINMENT">Entertainment</option>
                  <option value="GENERAL_MERCHANDISE">General Merchandise</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <span className="text-sm font-medium">Detailed Category</span>
                <select
                  value={transactionFilters.detailed_category}
                  onChange={(e) => setTransactionFilters({ detailed_category: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="All">All</option>
                  <option value="FLIGHTS">Flights</option>
                  <option value="TAXIS_AND_RIDE_SHARES">Taxis & Ride Shares</option>
                  <option value="SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS">Events</option>
                  <option value="OTHER_GENERAL_MERCHANDISE">Other</option>
                </select>
              </div>
              
              <div className="col-span-1">
                <span className="text-sm font-medium">Tags</span>
                <select
                  value={transactionFilters.tags}
                  onChange={(e) => setTransactionFilters({ tags: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="All">All</option>
                </select>
              </div>
              
              <div className="col-span-1">
                <span className="text-sm font-medium">Date</span>
                <input
                  type="text"
                  placeholder="Search..."
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              
              <div className="col-span-1">
                <span className="text-sm font-medium">Amount</span>
                <input
                  type="text"
                  placeholder="Search..."
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>
          
          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={String((transaction as any).id)} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.has(String((transaction as any).id))}
                          onChange={() => handleSelectTransaction(String((transaction as any).id))}
                          className="rounded"
                        />
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {safeName(transaction).charAt(0) || '?'}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{safeName(transaction) || 'Unknown'}</div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getAccountName(transaction.account_id)}
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.account_owner || ''}
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                        {safePrimaryCategory(transaction)}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                        {safeDetailedCategory(transaction) || '—'}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(transaction.date)}
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={asNumber(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(asNumber(transaction.amount))}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <button className="text-pink-500 hover:text-pink-700">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-pink-500 hover:text-pink-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};
