import { useEffect, useState, useRef, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useAppStore } from '../stores/appStore';
import { apiService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Search, Edit, Trash2, Plus, Minus, Upload, Download, Car, Plane, Utensils, Music2, ArrowUpRight, ArrowDownRight, CreditCard, ShoppingBag, Heart, Home, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';

export const Transactions = () => {
  const { transactions, setTransactions, transactionFilters, setTransactionFilters, accounts, setAccounts, plaidItems, setPlaidItems } = useAppStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [chartMonths, setChartMonths] = useState(2);
  const initRef = useRef(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTx, setEditTx] = useState<any | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editName, setEditName] = useState('');
  const [editMerchantName, setEditMerchantName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAmount, setEditAmount] = useState('');

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

  const asNumber = (v: any) => {
    const n = typeof v === 'number' ? v : v === undefined || v === null ? 0 : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const buckets = new Map<string, { income: number; expenses: number; label: string }>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const label = `${d.toLocaleString(undefined, { month: 'short' })} ${y}`;
      buckets.set(key, { income: 0, expenses: 0, label });
    }

    (transactions || []).forEach((t: any) => {
      if (!t || typeof t !== 'object') return;
      const d: any = t.date;
      const dt = typeof d === 'string' ? new Date(d) : new Date(d);
      if (isNaN(dt.getTime())) return;
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const bucket = buckets.get(key);
      if (!bucket) return;
      const amt = asNumber(t.amount);
      if (amt >= 0) bucket.income += amt; else bucket.expenses += Math.abs(amt);
    });

    return Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([_, v]) => ({ month: v.label, income: v.income, expenses: v.expenses }));
  }, [transactions]);

  const chartDataWindow = useMemo(() => {
    const data = monthlyChartData || [];
    const n = Math.max(1, Math.min(12, chartMonths));
    return data.slice(Math.max(0, data.length - n));
  }, [monthlyChartData, chartMonths]);

  const chartDateRange = useMemo(() => {
    const now = new Date();
    const n = Math.max(1, Math.min(12, chartMonths));
    const start = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: formatDate(toISO(start)), end: formatDate(toISO(end)) };
  }, [chartMonths]);

  const safeName = (t: any) => (t?.name ?? t?.merchant_name ?? '');
  const safePrimaryCategory = (t: any) => (t?.primary_category ?? t?.category ?? '');
  const isPending = (t: any) => {
    const v = (t as any)?.pending;
    return v === true || v === 't' || v === 'true';
  };

  const getCategoryIcon = (cat: string) => {
    const c = (cat || '').toUpperCase();
    switch (c) {
      case 'TRANSPORTATION':
        return <Car className="w-4 h-4 text-gray-700" />;
      case 'TRAVEL':
        return <Plane className="w-4 h-4 text-gray-700" />;
      case 'FOOD_AND_DRINK':
        return <Utensils className="w-4 h-4 text-gray-700" />;
      case 'ENTERTAINMENT':
        return <Music2 className="w-4 h-4 text-gray-700" />;
      case 'TRANSFER_OUT':
        return <ArrowUpRight className="w-4 h-4 text-gray-700" />;
      case 'INCOME':
        return <ArrowDownRight className="w-4 h-4 text-gray-700" />;
      case 'LOAN_PAYMENTS':
        return <CreditCard className="w-4 h-4 text-gray-700" />;
      case 'GENERAL_MERCHANDISE':
        return <ShoppingBag className="w-4 h-4 text-gray-700" />;
      case 'PERSONAL_CARE':
        return <Heart className="w-4 h-4 text-gray-700" />;
      case 'RENT_AND_UTILITIES':
        return <Home className="w-4 h-4 text-gray-700" />;
      default:
        return <Circle className="w-4 h-4 text-gray-700" />;
    }
  };

  const monthOptions = useMemo(() => {
    const now = new Date();
    const options: { value: string; label: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const label = `${d.toLocaleString(undefined, { month: 'long' })} ${y}`;
      options.push({ value: `${y}-${m}`, label });
    }
    return options;
  }, []);

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
    // Month filter
    if (transactionFilters.date_from) {
      const selectedMonth = transactionFilters.date_from.slice(0, 7);
      const d: any = (transaction as any).date;
      const txMonth = typeof d === 'string' ? d.slice(0, 7) : new Date(d).toISOString().slice(0, 7);
      if (txMonth !== selectedMonth) return false;
    }
    // Amount range
    const amt = asNumber(transaction.amount);
    if (transactionFilters.amount_min) {
      const min = Number(transactionFilters.amount_min);
      if (Number.isFinite(min) && amt < min) return false;
    }
    if (transactionFilters.amount_max) {
      const max = Number(transactionFilters.amount_max);
      if (Number.isFinite(max) && amt > max) return false;
    }
    return true;
  });

  const summaryTotals = useMemo(() => {
    let income = 0;
    let expenses = 0;
    (filteredTransactions || []).forEach((t: any) => {
      const amt = asNumber(t?.amount);
      if (amt >= 0) income += amt; else expenses += Math.abs(amt);
    });
    return { income, expenses, cashFlow: income - expenses };
  }, [filteredTransactions]);

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

  const getAccountName = (accountId: string | number) => {
    const idStr = String(accountId);
    const found = (accounts || []).find((a: any) => String(a?.id) === idStr);
    return found?.name || 'Unknown Account';
  };

  return (
    <Layout>
      {/* Date Range and Chart */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              onClick={() => setChartMonths(m => Math.max(1, m - 1))}
              disabled={chartMonths <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              {chartDateRange.start}
            </div>
            <div className="bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              {chartDateRange.end}
            </div>
            <button
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              onClick={() => setChartMonths(m => Math.min(12, m + 1))}
              disabled={chartMonths >= 12}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <IncomeExpenseChart data={chartDataWindow} />
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
                  <p className={`text-lg font-bold ${summaryTotals.cashFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(summaryTotals.cashFlow)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Income</p>
                  <p className="text-lg font-bold text-green-500">{formatCurrency(summaryTotals.income)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expenses</p>
                  <p className="text-lg font-bold text-pink-500">{formatCurrency(summaryTotals.expenses)}</p>
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
        
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mr-3"></div>
              <span className="text-gray-600">Loading transactions...</span>
            </div>
          )}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">out of {filteredTransactions.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white disabled:opacity-50"
              >
                ← Previous
              </button>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {Math.max(1, Math.ceil(filteredTransactions.length / pageSize))}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(Math.max(1, Math.ceil(filteredTransactions.length / pageSize)), currentPage + 1))}
                disabled={currentPage >= Math.ceil(filteredTransactions.length / pageSize)}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
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
              
              <div className="col-span-2">
                <span className="text-sm font-medium">Primary Category</span>
                <select
                  value={transactionFilters.primary_category}
                  onChange={(e) => setTransactionFilters({ primary_category: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="All">All</option>
                  {Array.from(new Set((transactions || []).map(t => safePrimaryCategory(t)).filter(Boolean)))
                    .map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
              </div>
              
              <div className="col-span-2">
                <span className="text-sm font-medium">Month</span>
                <div className="mt-2">
                  <select
                    value={transactionFilters.date_from}
                    onChange={(e) => { setTransactionFilters({ date_from: e.target.value }); setCurrentPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">All</option>
                    {monthOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => { setTransactionFilters({ date_from: '' }); setCurrentPage(1); }}
                  className="mt-2 text-xs text-gray-600 underline"
                >
                  Clear month
                </button>
              </div>
              
              <div className="col-span-2">
                <span className="text-sm font-medium">Amount Range</span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={transactionFilters.amount_min}
                    onChange={(e) => {
                      setTransactionFilters({ amount_min: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={transactionFilters.amount_max}
                    onChange={(e) => {
                      setTransactionFilters({ amount_max: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <button
                  onClick={() => { setTransactionFilters({ amount_min: '', amount_max: '' }); setCurrentPage(1); }}
                  className="mt-2 text-xs text-gray-600 underline"
                >
                  Clear amount range
                </button>
              </div>
            </div>
          </div>
          
          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-600">
                  <th className="px-4 py-3">Select</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Merchant</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Primary Category</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((transaction) => (
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
                          {getCategoryIcon(safePrimaryCategory(transaction))}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{(transaction as any).name || 'Unknown'}</div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {(transaction as any).merchant_name || ''}
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getAccountName(transaction.account_id)}
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                        {safePrimaryCategory(transaction)}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {isPending(transaction) ? 'Yes' : 'No'}
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
                          <Edit className="w-4 h-4" onClick={() => {
                            setEditTx(transaction);
                            setEditCategory(safePrimaryCategory(transaction));
                            setEditName((transaction as any).name || '');
                            setEditMerchantName(transaction.merchant_name || safeName(transaction));
                            setEditDate((transaction as any).date ? String((transaction as any).date).slice(0,10) : '');
                            setEditAmount(String(asNumber(transaction.amount)));
                            setIsEditOpen(true);
                          }} />
                        </button>
                        <button className="text-pink-500 hover:text-pink-700" onClick={async () => {
                          const ok = window.confirm('Delete this transaction? You will not be able to recover it.');
                          if (!ok) return;
                          try {
                            await apiService.deleteTransaction(String((transaction as any).transaction_id || (transaction as any).id));
                            setTransactions((transactions || []).filter((t: any) => String((t as any).id) !== String((transaction as any).id)) as any);
                            toast.success('Transaction deleted');
                          } catch (e) {
                            toast.error('Failed to delete transaction');
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {Math.max(1, Math.ceil(filteredTransactions.length / pageSize))}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white disabled:opacity-50"
              >
                ← Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(Math.max(1, Math.ceil(filteredTransactions.length / pageSize)), currentPage + 1))}
                disabled={currentPage >= Math.ceil(filteredTransactions.length / pageSize)}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-white disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Modal
        open={isEditOpen}
        title="Edit Transaction"
        onClose={() => setIsEditOpen(false)}
        actions={(
          <>
            <button
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!editTx) return;
                try {
                  const id = String((editTx as any).transaction_id || (editTx as any).id);
                  const payload: any = {
                    category: editCategory,
                    primary_category: editCategory,
                    name: editName,
                    merchant_name: editMerchantName,
                    date: editDate,
                    amount: Number(editAmount)
                  };
                  const updated = await apiService.updateTransaction(id, payload);
                  setTransactions(((transactions || []) as any[]).map((t: any) => String((t as any).id) === String((editTx as any).id) ? (updated || { ...t, ...payload }) : t) as any);
                  toast.success('Transaction updated');
                  setIsEditOpen(false);
                } catch (e) {
                  toast.error('Failed to update transaction');
                }
              }}
              className="px-4 py-2 rounded-md bg-pink-600 text-white hover:bg-pink-700"
            >
              Save
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {['TRANSPORTATION','TRAVEL','FOOD_AND_DRINK','ENTERTAINMENT','TRANSFER_OUT','INCOME','LOAN_PAYMENTS','GENERAL_MERCHANDISE','PERSONAL_CARE','RENT_AND_UTILITIES'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Name</label>
            <input
              type="text"
              value={editMerchantName}
              onChange={(e) => setEditMerchantName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
