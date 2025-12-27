import { useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { apiService } from '../services/api';
import { Budget, Transaction } from '../types';
import { PERSONAL_FINANCE_CATEGORIES, PersonalFinanceCategory, PERSONAL_FINANCE_CATEGORY_OPTIONS, getCategoryLabelFromConstants } from '../constants/personalFinanceCategories';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { toast } from 'sonner';
import { CategoryChart } from '../components/charts/CategoryChart';
import { useTheme } from '../theme/ThemeContext';

const isValidCategory = (c: string): c is PersonalFinanceCategory =>
  (PERSONAL_FINANCE_CATEGORIES as readonly string[]).includes(c);
const EXCLUDED_BUDGET_CATEGORIES: readonly PersonalFinanceCategory[] = [
  'INCOME',
  'LOAN_DISBURSEMENTS',
  'TRANSFER_IN',
];
const BUDGET_CATEGORY_OPTIONS = PERSONAL_FINANCE_CATEGORY_OPTIONS.filter(
  (opt) => !EXCLUDED_BUDGET_CATEGORIES.includes(opt.value)
);

export const Budgets = () => {
  const { transactions, setTransactions, setAccounts, setPlaidItems } = useAppStore();
  const { progress } = useTheme();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('');
  const [newAmount, setNewAmount] = useState<string>('');
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const initRef = useRef(false);
  const dataInitRef = useRef(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.getBudgets();
        setBudgets(Array.isArray(data) ? data : []);
      } catch (e) {
        toast.error('Failed to load budgets');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (dataInitRef.current) return;
    if ((transactions || []).length > 0) return;
    dataInitRef.current = true;
    const loadStoreData = async () => {
      try {
        setIsLoading(true);
        const items = await apiService.getPlaidItems();
        setPlaidItems(items || []);
        if (!items || items.length === 0) {
          setTransactions([]);
          setAccounts([]);
          return;
        }
        const accountsByItem = await Promise.all(items.map((item) => apiService.getAccountsFromDB(item.id).catch(() => [])));
        const allAccounts: any[] = ([] as any[]).concat(...accountsByItem).filter((a) => !!a && typeof a === 'object');
        setAccounts(allAccounts || []);
        const txnsByAccount = await Promise.all((allAccounts || []).map((acc: any) => apiService.getTransactions(String(acc.id)).catch(() => [])));
        const normalized = (txnsByAccount || []).map((arr) => Array.isArray(arr) ? arr : (arr ? [arr] : []));
        const allTxns = ([] as any[]).concat(...normalized).filter((t) => !!t && typeof t === 'object');
        setTransactions(allTxns as any);
      } catch (e) {
        toast.error('Failed to load transactions for budgets');
      } finally {
        setIsLoading(false);
      }
    };
    loadStoreData();
  }, [transactions, setPlaidItems, setAccounts, setTransactions]);
  const daysInMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }, []);
  const dayOfMonth = useMemo(() => new Date().getDate(), []);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  useEffect(() => {
    if (!selectedMonth) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setSelectedMonth(`${y}-${m}`);
    }
  }, [selectedMonth]);
  const monthOptions = useMemo(() => {
    const now = new Date();
    const options: { value: string; label: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const value = `${y}-${m}`;
      const label = `${d.toLocaleString(undefined, { month: 'long' })} ${y}`;
      options.push({ value, label });
    }
    return options;
  }, []);
  const monthProgressPct = useMemo(() => {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (selectedMonth === currentYM) {
      return Math.round((dayOfMonth / daysInMonth) * 100);
    }
    return 100;
  }, [selectedMonth, dayOfMonth, daysInMonth]);

  const asNumber = (v: any) => {
    const n = typeof v === 'number' ? v : v === undefined || v === null ? 0 : Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const currentMonthSpentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    const ym = selectedMonth;
    (transactions || []).forEach((t: any) => {
      const v: any = (t as Transaction).date;
      const txm = typeof v === 'string' ? v.slice(0, 7) : new Date(v).toISOString().slice(0, 7);
      if (txm !== ym) return;
      if ((t as any).expense !== true) return;
      const cat = String((t as any).primary_category || 'OTHER');
      const prev = map.get(cat) || 0;
      map.set(cat, prev + Math.abs(asNumber((t as any).amount)));
    });
    return map;
  }, [transactions, selectedMonth]);

  const categoryChartData = useMemo(() => {
    const entries = Array.from(currentMonthSpentByCategory.entries());
    if (entries.length === 0) {
      return [{ category: 'DEFAULT', amount: -1, percentage: 0 }];
    }
    return entries.map(([category, amount]) => ({ category, amount: -Math.abs(amount), percentage: 0 }));
  }, [currentMonthSpentByCategory]);

  const getBarColor = (pct: number) => {
    if (pct <= 50) return progress.low;
    if (pct <= 80) return progress.mid;
    if (pct <= 100) return progress.high;
    return progress.over;
  };
  const expandAll = () => {
    const map: Record<number, boolean> = {};
    (budgets || []).forEach(b => { map[Number(b.id)] = true; });
    setExpanded(map);
  };
  const collapseAll = () => {
    setExpanded({});
  };

  const handleAddBudget = async () => {
    const cat = newCategory.trim();
    const amt = Number(newAmount);
    if (!cat || !isValidCategory(cat)) {
      toast.error('Select a valid category');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (budgets.some(b => String(b.personal_finance_category) === cat)) {
      toast.error('A budget already exists for this category');
      return;
    }
    try {
      const created = await apiService.createBudget({ personal_finance_category: cat, amount: amt });
      setBudgets([...(budgets || []), created]);
      toast.success('Budget created');
      setIsAddOpen(false);
      setNewCategory('');
      setNewAmount('');
    } catch (e) {
      toast.error('Failed to create budget');
    }
  };

  const handleDeleteBudget = async (b: Budget) => {
    const ok = window.confirm(`Delete budget for ${b.personal_finance_category}?`);
    if (!ok) return;
    try {
      await apiService.deleteBudget(Number(b.id));
      setBudgets((budgets || []).filter(x => Number(x.id) !== Number(b.id)));
      toast.success('Budget deleted');
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  const handleStartEdit = (b: Budget) => {
    setEditBudget(b);
    setEditAmount(String(b.amount));
    setEditCategory(String(b.personal_finance_category));
  };
  const handleSaveEdit = async () => {
    if (!editBudget) return;
    const amt = Number(editAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    const cat = editCategory.trim();
    if (!cat || !isValidCategory(cat)) {
      toast.error('Select a valid category');
      return;
    }
    if (budgets.some(b => String(b.personal_finance_category) === cat && Number(b.id) !== Number(editBudget.id))) {
      toast.error('A budget already exists for this category');
      return;
    }
    try {
      const updated = await apiService.updateBudget(Number(editBudget.id), { amount: amt, personal_finance_category: cat });
      setBudgets((budgets || []).map(x => Number(x.id) === Number(editBudget.id) ? { ...x, ...(updated || {}), amount: amt, personal_finance_category: cat } : x));
      toast.success('Budget updated');
      setEditBudget(null);
      setEditAmount('');
      setEditCategory('');
    } catch {
      toast.error('Failed to update budget');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <button
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">Monthly Budgets</span>
              <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-700">Month progress: <span className="font-bold">{monthProgressPct}%</span></span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                >
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={expandAll}
                  className="inline-flex items-center px-2 py-1 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-xs"
                  title="Expand all budgets"
                >
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Expand all
                </button>
                <button
                  onClick={collapseAll}
                  className="inline-flex items-center px-2 py-1 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-xs"
                  title="Collapse all budgets"
                >
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Collapse all
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="py-6 text-center text-gray-600">Loading...</div>
            ) : budgets.length === 0 ? (
              <div className="py-6 text-center text-gray-600">No budgets yet. Add one to get started.</div>
            ) : (
              <div className="space-y-4">
              {(budgets || []).slice().sort((a, b) => String(a.personal_finance_category).localeCompare(String(b.personal_finance_category))).map((b) => {
                const spent = currentMonthSpentByCategory.get(String(b.personal_finance_category)) || 0;
                const amt = Number(b.amount);
                const ratio = amt > 0 ? spent / amt : 0;
                const fillPct = Math.min(100, Math.round(ratio * 100));
                const over = spent > amt;
                const color = over ? progress.over : getBarColor(fillPct);
                const txns = (transactions || []).filter((t: any) => {
                  const v: any = (t as Transaction).date;
                  const txm = typeof v === 'string' ? v.slice(0, 7) : new Date(v).toISOString().slice(0, 7);
                  if (txm !== selectedMonth) return false;
                  if ((t as any).expense !== true) return false;
                  const cat = String((t as any).primary_category || 'OTHER');
                  return cat === String(b.personal_finance_category);
                });
                return (
                  <div key={b.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{getCategoryLabelFromConstants(String(b.personal_finance_category))}</div>
                          <div className="text-xs text-gray-700">
                            <span className="font-bold">Allotted:</span> <span>{formatCurrency(amt)}</span> •{' '}
                            <span className="font-bold">Spent:</span> <span>{formatCurrency(spent)}</span> •{' '}
                            {amt - spent >= 0 ? (
                              <>
                                <span className="font-bold">Remaining:</span> <span>{formatCurrency(amt - spent)}</span>
                              </>
                            ) : (
                              <>
                                <span className="font-bold text-red-600">Over:</span> <span className="text-red-600">{formatCurrency(spent - amt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-gray-700 hover:text-gray-900 flex items-center text-xs font-medium"
                            onClick={() => setExpanded(prev => ({ ...prev, [Number(b.id)]: !prev[Number(b.id)] }))}
                            title={expanded[Number(b.id)] ? 'Hide expenses' : 'Show expenses'}
                          >
                            {expanded[Number(b.id)] ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                            {expanded[Number(b.id)] ? 'Hide expenses' : `Show expenses (${txns.length})`}
                          </button>
                          <button className="text-blue-600 hover:text-blue-800" onClick={() => handleStartEdit(b)}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800" onClick={() => handleDeleteBudget(b)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="relative h-5 bg-gray-100 rounded-md mb-2">
                        <div className="h-full rounded-sm" style={{ width: `${fillPct}%`, backgroundColor: color }}></div>
                    </div>
                    {expanded[Number(b.id)] && (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        {txns.length === 0 ? (
                          <div className="text-xs text-gray-600">No expenses for this category in {selectedMonth}.</div>
                        ) : (
                          <div className="space-y-2">
                            {txns.map((t: any) => (
                              <div key={String((t as any).id)} className="flex items-center justify-between text-sm">
                                <div className="flex-1 pr-3">
                                  <div className="font-medium text-gray-900">{String((t as any).name || (t as any).merchant_name || 'Unknown')}</div>
                                  <div className="text-xs text-gray-600">{formatDate(String((t as any).date || ''))}</div>
                                </div>
                                <div className="text-right font-semibold text-gray-900">{formatCurrency(Math.abs(asNumber((t as any).amount)))}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex justify-end mb-4 text-sm text-gray-600">Monthly Spending Breakdown</div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="w-full">
                {(() => {
                  const ym = selectedMonth;
                  const monthTxns = (transactions || []).filter((t: any) => {
                    const v: any = (t as Transaction).date;
                    const txm = typeof v === 'string' ? v.slice(0, 7) : new Date(v).toISOString().slice(0, 7);
                    return txm === ym;
                  });
                  return <CategoryChart data={categoryChartData} height={560} outerRadius={150} innerRadius={70} transactionsForMonth={monthTxns as any} selectedMonth={ym} />;
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isAddOpen}
        title="Add Budget"
        onClose={() => setIsAddOpen(false)}
        actions={(
          <>
            <button
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBudget}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
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
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {BUDGET_CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editBudget}
        title={editBudget ? `Edit Budget` : 'Edit Budget'}
        onClose={() => setEditBudget(null)}
        actions={(
          <>
            <button
              onClick={() => setEditBudget(null)}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {BUDGET_CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
