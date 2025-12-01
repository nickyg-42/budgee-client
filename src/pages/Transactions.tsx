import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Search, Edit, Trash2, Plus, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';

export const Transactions = () => {
  const { transactions, setTransactions, transactionFilters, setTransactionFilters } = useAppStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        // Try to fetch real transactions from backend first
        const realTransactions = await apiService.getAllTransactions();
        setTransactions(realTransactions);
      } catch (error) {
        console.error('Failed to load real transactions, using fallback data:', error);
        // Fallback to mock data if backend endpoint doesn't exist yet
        const mockTransactions = [
          {
            id: '1',
            account_id: 'acc_1',
            transaction_id: 'txn_1',
            amount: -500,
            date: '2023-11-11',
            name: 'United Airlines',
            merchant_name: 'United Airlines',
            category: ['Travel', 'Flights'],
            primary_category: 'TRAVEL',
            detailed_category: 'FLIGHTS',
            pending: false,
            account_owner: 'tim'
          },
          {
            id: '2',
            account_id: 'acc_2',
            transaction_id: 'txn_2',
            amount: -6.33,
            date: '2023-11-09',
            name: 'Uber',
            merchant_name: 'Uber',
            category: ['Transportation', 'Ride Share'],
            primary_category: 'TRANSPORTATION',
            detailed_category: 'TAXIS_AND_RIDE_SHARES',
            pending: false,
            account_owner: 'tim'
          },
          {
            id: '3',
            account_id: 'acc_2',
            transaction_id: 'txn_3',
            amount: -6.33,
            date: '2023-11-09',
            name: 'Uber',
            merchant_name: 'Uber',
            category: ['Transportation', 'Ride Share'],
            primary_category: 'TRANSPORTATION',
            detailed_category: 'TAXIS_AND_RIDE_SHARES',
            pending: false,
            account_owner: 'tim'
          },
          {
            id: '4',
            account_id: 'acc_1',
            transaction_id: 'txn_4',
            amount: -500,
            date: '2023-11-06',
            name: 'Tectra Inc',
            merchant_name: 'Tectra Inc',
            category: ['Entertainment', 'Events'],
            primary_category: 'ENTERTAINMENT',
            detailed_category: 'SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS',
            pending: false,
            account_owner: 'tim'
          },
          {
            id: '5',
            account_id: 'acc_1',
            transaction_id: 'txn_5',
            amount: -500,
            date: '2023-11-06',
            name: 'Tectra Inc',
            merchant_name: 'Tectra Inc',
            category: ['Entertainment', 'Events'],
            primary_category: 'ENTERTAINMENT',
            detailed_category: 'SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS',
            pending: false,
            account_owner: 'tim'
          },
          {
            id: '6',
            account_id: 'acc_1',
            transaction_id: 'txn_6',
            amount: 2078.50,
            date: '2023-11-05',
            name: 'AUTOMATIC PAYMENT - THANK',
            merchant_name: 'AUTOMATIC PAYMENT - THANK',
            category: ['General Merchandise', 'Other'],
            primary_category: 'GENERAL_MERCHANDISE',
            detailed_category: 'OTHER_GENERAL_MERCHANDISE',
            pending: false,
            account_owner: 'tim'
          }
        ];
        setTransactions(mockTransactions);
      }
    };

    loadTransactions();
  }, [setTransactions]);

  const monthlyChartData = [
    { month: 'Jul 2023', income: 1500, expenses: 1200 },
    { month: 'Aug 2023', income: 1800, expenses: 1400 },
    { month: 'Sep 2023', income: 2100, expenses: 1600 },
    { month: 'Oct 2023', income: 1900, expenses: 1500 },
    { month: 'Nov 2023', income: 2079, expenses: 3591 },
  ];

  const filteredTransactions = transactions.filter(transaction => {
    if (transactionFilters.search && !transaction.name.toLowerCase().includes(transactionFilters.search.toLowerCase())) {
      return false;
    }
    if (transactionFilters.account !== 'All' && transaction.account_id !== transactionFilters.account) {
      return false;
    }
    if (transactionFilters.primary_category !== 'All' && transaction.primary_category !== transactionFilters.primary_category) {
      return false;
    }
    if (transactionFilters.detailed_category !== 'All' && transaction.detailed_category !== transactionFilters.detailed_category) {
      return false;
    }
    return true;
  });

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
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
    const accountMap: Record<string, string> = {
      'acc_1': 'Plaid Credit Card',
      'acc_2': 'Plaid Checking'
    };
    return accountMap[accountId] || 'Unknown Account';
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
                  <option value="acc_1">Plaid Credit Card</option>
                  <option value="acc_2">Plaid Checking</option>
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
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.has(transaction.id)}
                          onChange={() => handleSelectTransaction(transaction.id)}
                          className="rounded"
                        />
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {transaction.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{transaction.name}</div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getAccountName(transaction.account_id)}
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transaction.account_owner}
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                        {transaction.primary_category}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                        {transaction.detailed_category}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(transaction.date)}
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(transaction.amount)}
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